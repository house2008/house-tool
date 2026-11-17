/* 国家法律索引 · 首页应用逻辑 */
'use strict';

let META = null;
let LAW_DATA = [];

const SECTION_ORDER = ['constitution', 'laws', 'pending', 'interpretation', 'decision', 'amendment', 'constitution_history'];
const SECTION_META = {
  constitution:         { title: '宪法', en: 'CONSTITUTION', note: '国家根本法，具有最高法律效力' },
  laws:                 { title: '现行有效法律', en: 'LAWS IN FORCE', note: '全国人民代表大会及其常务委员会制定' },
  pending:              { title: '尚未生效的法律', en: 'NOT YET IN FORCE', note: '已公布，施行日期在检索日之后' },
  interpretation:       { title: '法律解释', en: 'LEGAL INTERPRETATIONS', note: '全国人民代表大会常务委员会对法律所作的解释' },
  decision:             { title: '有关法律问题和重大问题的决定', nav: '有关决定', en: 'DECISIONS', note: '全国人民代表大会常务委员会作出的有关决定' },
  amendment:            { title: '刑法修正案', en: 'CRIMINAL LAW AMENDMENTS', note: '对《中华人民共和国刑法》的历次修正' },
  constitution_history: { title: '宪法修正案及历史文本', nav: '宪法文本', en: 'CONSTITUTIONAL HISTORY', note: '宪法历次修正案及1982年宪法文本' }
};
const CHIP_META = [
  { key: 'all', label: '全部' },
  { key: 'constitution', label: '宪法' },
  { key: 'laws', label: '法律' },
  { key: 'pending', label: '尚未生效' },
  { key: 'interpretation', label: '法律解释' },
  { key: 'decision', label: '决定' },
  { key: 'amendment', label: '修正案' },
  { key: 'constitution_history', label: '宪法文本' }
];

const state = {
  q: '',
  filter: 'all',
  scope: 'all',        // all | title | body
  mode: 'fuzzy',       // fuzzy | exact
  sort: 'time',        // time | category
  searchIndex: null,
  searchLoading: false,
  searchError: false
};

const SORT_KEY = 'law-index-sort';
const PANEL_KEY = 'law-index-panel-collapsed';

const input = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const lawList = document.getElementById('lawList');
const emptyState = document.getElementById('emptyState');
const resultCount = document.getElementById('resultCount');
const chipsEl = document.getElementById('chips');
const sideNav = document.getElementById('sideNav');
const searchIndexStatus = document.getElementById('searchIndexStatus');

let searchIndexPromise = null;
let searchToken = 0;
let scrollTicking = false;

const pad4 = n => String(n || 0).padStart(4, '0');
const countBy = key => LAW_DATA.filter(e => e.sec === key).length;
const catKey = e => e.sec + '|' + e.cat;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function normalize(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function tokensOf(q) {
  return normalize(q).split(' ').filter(Boolean);
}
function highlight(text, tokens) {
  const safe = escapeHtml(text);
  if (!tokens.length) return safe;
  const pattern = tokens.map(escapeReg).sort((a, b) => b.length - a.length).join('|');
  return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
}
function formatDate(s) {
  if (!s) return '—';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(s);
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}
function localDate() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function sectionLabel(sec) {
  return SECTION_META[sec] ? SECTION_META[sec].title : sec;
}

/* ---------- Full-text index ---------- */
function updateSearchState() {
  if (!searchIndexStatus) return;
  if (state.searchLoading) {
    searchIndexStatus.hidden = false;
    searchIndexStatus.textContent = '正在加载全文索引…';
  } else if (state.searchError) {
    searchIndexStatus.hidden = false;
    searchIndexStatus.textContent = '全文索引不可用，当前仅检索标题';
  } else if (state.searchIndex) {
    searchIndexStatus.hidden = false;
    searchIndexStatus.textContent = '全文索引已加载';
  } else {
    searchIndexStatus.hidden = true;
  }
}
function ensureSearchIndex() {
  if (state.searchIndex) return Promise.resolve(state.searchIndex);
  if (searchIndexPromise) return searchIndexPromise;
  state.searchLoading = true;
  updateSearchState();
  searchIndexPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'data/search-index.js?v=' + encodeURIComponent(META.generatedAt || Date.now());
    s.async = true;
    s.onload = () => {
      state.searchLoading = false;
      if (window.LAW_SEARCH_INDEX && window.LAW_SEARCH_INDEX.entries) {
        state.searchIndex = window.LAW_SEARCH_INDEX.entries;
        state.searchError = false;
      } else {
        state.searchError = true;
      }
      updateSearchState();
      resolve(state.searchIndex || {});
    };
    s.onerror = () => {
      state.searchLoading = false;
      state.searchError = true;
      searchIndexPromise = null;
      updateSearchState();
      reject(new Error('search index load failed'));
    };
    document.head.appendChild(s);
  });
  return searchIndexPromise;
}

/* ---------- Search matching ---------- */
function makeSnippet(body, tokens, q) {
  const text = String(body || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  let needle = state.mode === 'exact' ? q.trim().toLowerCase() : (tokens[0] || '');
  let idx = needle ? lower.indexOf(needle) : -1;
  if (idx < 0) {
    for (const t of tokens) { idx = lower.indexOf(t); if (idx >= 0) break; }
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 46);
  const end = Math.min(text.length, idx + 150);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function matchEntry(e, q, tokens) {
  const title = String(e.title || '').toLowerCase();
  const body = state.searchIndex ? String(state.searchIndex[e.id] || '').toLowerCase() : '';
  const phrase = q.toLowerCase();
  let titleMatch = false;
  let bodyMatch = false;

  if (state.mode === 'exact') {
    if (state.scope !== 'body') titleMatch = title.includes(phrase);
    if (state.scope !== 'title') bodyMatch = body.includes(phrase);
  } else {
    if (state.scope !== 'body') titleMatch = tokens.every(t => title.includes(t));
    if (state.scope !== 'title') bodyMatch = tokens.every(t => body.includes(t));
  }

  if (!titleMatch && !bodyMatch) return null;
  const snippet = bodyMatch ? makeSnippet(state.searchIndex[e.id], tokens, q) : '';
  const score = (titleMatch ? 100 : 0)
    + (bodyMatch ? 40 : 0)
    + (normalize(e.title) === normalize(q) ? 80 : 0);
  return { e, titleMatch, bodyMatch, snippet, score };
}

/* ---------- Shared rendering ---------- */
function sectionHead(kicker, title, note, count) {
  return '<div class="section-head">' +
    '<div>' +
      '<p class="section-kicker">' + escapeHtml(kicker) + '</p>' +
      '<h2>' + escapeHtml(title) + '</h2>' +
      '<p class="section-note">' + escapeHtml(note) + '</p>' +
    '</div>' +
    '<span class="section-count">' + count + ' 条</span>' +
  '</div>';
}

function rowHtml(e, tokens, snippet, showDate) {
  const meta = [e.cat, e.status];
  if (showDate && e.gbrq) meta.push(formatDate(e.gbrq));
  return '<button type="button" class="law-row" data-sec="' + escapeHtml(e.sec) + '" data-id="' + escapeHtml(e.id) + '">' +
    '<span class="law-no">' + pad4(e.indexNo) + '</span>' +
    '<span class="law-body">' +
      '<span class="law-title">' + highlight(e.title, tokens) + '</span>' +
      '<span class="law-meta">' + meta.map(x => highlight(String(x), tokens)).join(' · ') + '</span>' +
      (snippet ? '<span class="law-snippet">' + highlight(snippet, tokens) + '</span>' : '') +
    '</span>' +
    '<span class="law-state' + (e.hasText ? ' in' : '') + '">' + (e.hasText ? '已入库' : '未入库') + '</span>' +
    '<span class="law-arrow" aria-hidden="true">›</span>' +
  '</button>';
}

function groupByEra(entries) {
  const map = new Map();
  for (const e of entries) {
    const year = parseInt(String(e.gbrq || '').slice(0, 4), 10);
    const key = Number.isFinite(year) ? String(Math.floor(year / 10) * 10) : 'unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  }
  for (const arr of map.values()) arr.sort((a, b) => (a.indexNo || 0) - (b.indexNo || 0));
  return [...map.entries()].sort((a, b) => {
    if (a[0] === 'unknown') return 1;
    if (b[0] === 'unknown') return -1;
    return Number(a[0]) - Number(b[0]);
  });
}

/* ---------- Views ---------- */
function renderTimeView(entries, tokens) {
  const eras = groupByEra(entries);
  const frag = document.createDocumentFragment();

  for (const [key, items] of eras) {
    const label = key === 'unknown' ? '时间未详' : key + '—' + (Number(key) + 9);
    const sec = document.createElement('section');
    sec.className = 'law-section era-section';
    sec.id = 'era-' + key;
    sec.dataset.spy = '1';
    sec.innerHTML = sectionHead('CHRONOLOGY', label, '按公布日期从早到晚排列 · 索引编号即时间顺序', items.length);

    const list = document.createElement('div');
    list.className = 'law-items';
    list.innerHTML = items.map(e => rowHtml(e, tokens, '', true)).join('');
    sec.appendChild(list);
    frag.appendChild(sec);
  }
  lawList.appendChild(frag);
}

function renderCategoryView(entries, tokens) {
  const frag = document.createDocumentFragment();
  for (const secKey of SECTION_ORDER) {
    const secEntries = entries.filter(e => e.sec === secKey);
    if (!secEntries.length) continue;
    const meta = SECTION_META[secKey];
    const sec = document.createElement('section');
    sec.className = 'law-section';
    sec.id = 'sec-' + secKey;
    sec.dataset.spy = '1';
    sec.innerHTML = sectionHead(meta.en, meta.title, meta.note, secEntries.length);

    const cats = [];
    for (const e of secEntries) {
      let g = cats.find(x => x.name === e.cat);
      if (!g) { g = { name: e.cat, items: [] }; cats.push(g); }
      g.items.push(e);
    }
    cats.forEach(c => c.items.sort((a, b) => (a.indexNo || 0) - (b.indexNo || 0)));

    for (const cat of cats) {
      const showGroupHead = secKey === 'laws' || secKey === 'pending' || cats.length > 1;
      const group = document.createElement('div');
      const groupId = 'group-' + secKey + '--' + (cat.name || '');
      group.className = 'group';
      group.id = groupId;
      group.dataset.spy = '1';
      if (showGroupHead) {
        group.innerHTML = '<div class="group-head"><h3>' + escapeHtml(cat.name) + '</h3>' +
          '<span class="line"></span><span class="g-count">' + cat.items.length + '</span></div>';
      }
      const list = document.createElement('div');
      list.className = 'law-items';
      list.innerHTML = cat.items.map(e => rowHtml(e, tokens, '', false)).join('');
      group.appendChild(list);
      sec.appendChild(group);
    }
    frag.appendChild(sec);
  }
  lawList.appendChild(frag);
}

function renderSearchView(results, q, tokens) {
  const sorted = results.slice().sort((a, b) => b.score - a.score || (a.e.indexNo || 0) - (b.e.indexNo || 0));
  const scopeLabel = state.scope === 'all' ? '标题+正文' : state.scope === 'title' ? '仅标题' : '仅正文';
  const modeLabel = state.mode === 'exact' ? '精确匹配' : '模糊匹配';
  const note = '“' + q + '” · ' + scopeLabel + ' · ' + modeLabel + (state.searchError ? ' · 全文索引不可用' : '');

  const sec = document.createElement('section');
  sec.className = 'law-section search-result-section';
  sec.id = 'search-results';
  sec.dataset.spy = '1';
  sec.innerHTML = sectionHead('SEARCH RESULTS', '搜索结果', note, sorted.length);

  const list = document.createElement('div');
  list.className = 'law-items';
  list.innerHTML = sorted.map(r => rowHtml(r.e, tokens, r.snippet, true)).join('');
  sec.appendChild(list);
  lawList.appendChild(sec);
}

function renderLoading() {
  lawList.innerHTML = '<div class="empty"><div class="empty-seal" aria-hidden="true">搜</div>' +
    '<h3>正在加载全文索引…</h3><p>首次正文搜索需要加载本地全文索引，请稍候。</p></div>';
  emptyState.hidden = true;
  resultCount.textContent = '正在加载全文索引…';
}

function render() {
  const q = state.q.trim();
  const tokens = tokensOf(q);
  clearBtn.hidden = !state.q;
  lawList.innerHTML = '';
  lawList.dataset.view = state.sort;

  if (q && state.scope !== 'title' && !state.searchIndex && !state.searchError) {
    renderLoading();
    return;
  }

  let entries = LAW_DATA.filter(e => state.filter === 'all' || e.sec === state.filter);

  if (q) {
    const results = entries.map(e => matchEntry(e, q, tokens)).filter(Boolean);
    const titleCount = results.filter(r => r.titleMatch).length;
    const bodyCount = results.filter(r => r.bodyMatch).length;
    resultCount.textContent = '找到 ' + results.length + ' 条 · 标题 ' + titleCount + ' / 正文 ' + bodyCount;
    if (!results.length) {
      emptyState.hidden = false;
      updateActiveNav();
      return;
    }
    emptyState.hidden = true;
    renderSearchView(results, q, tokens);
  } else {
    if (!entries.length) {
      resultCount.textContent = '共 0 条索引';
      emptyState.hidden = false;
      updateActiveNav();
      return;
    }
    emptyState.hidden = true;
    if (state.sort === 'time') {
      resultCount.textContent = '共 ' + entries.length + ' 条 · 按公布时间从早到晚';
      renderTimeView(entries, tokens);
    } else {
      const label = state.filter === 'all' ? '' : ' · ' + sectionLabel(state.filter);
      resultCount.textContent = '共 ' + entries.length + ' 条索引' + label;
      renderCategoryView(entries, tokens);
    }
  }
  updateActiveNav();
}

/* ---------- Chips / controls / nav ---------- */
function buildChips() {
  chipsEl.innerHTML = '';
  for (const c of CHIP_META) {
    const n = c.key === 'all' ? LAW_DATA.length : countBy(c.key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (state.filter === c.key ? ' active' : '');
    btn.dataset.filter = c.key;
    btn.setAttribute('aria-pressed', state.filter === c.key ? 'true' : 'false');
    btn.innerHTML = escapeHtml(c.label) + ' <span class="n">' + n + '</span>';
    chipsEl.appendChild(btn);
  }
}

function buildNav() {
  sideNav.innerHTML = '';
  const filtered = LAW_DATA.filter(e => state.filter === 'all' || e.sec === state.filter);

  if (state.sort === 'time') {
    const eras = groupByEra(filtered);
    for (const [key, items] of eras) {
      const label = key === 'unknown' ? '时间未详' : key + '—' + (Number(key) + 9);
      const a = document.createElement('a');
      a.href = '#era-' + key;
      a.dataset.target = 'era-' + key;
      a.className = 'nav-sec';
      a.innerHTML = '<span>' + escapeHtml(label) + '</span><span class="nav-count">' + items.length + '</span>';
      sideNav.appendChild(a);
    }
    return;
  }

  for (const secKey of SECTION_ORDER) {
    const secEntries = filtered.filter(e => e.sec === secKey);
    if (!secEntries.length) continue;
    const a = document.createElement('a');
    a.href = '#sec-' + secKey;
    a.dataset.target = 'sec-' + secKey;
    a.className = 'nav-sec';
    a.innerHTML = '<span>' + escapeHtml(SECTION_META[secKey].nav || SECTION_META[secKey].title) + '</span><span class="nav-count">' + secEntries.length + '</span>';
    sideNav.appendChild(a);

    if (secKey === 'laws' || secKey === 'pending') {
      const cats = [];
      for (const e of secEntries) {
        let g = cats.find(x => x.name === e.cat);
        if (!g) { g = { name: e.cat, n: 0 }; cats.push(g); }
        g.n++;
      }
      for (const c of cats) {
        const catId = secKey + '--' + (c.name || '');
        const sub = document.createElement('a');
        sub.href = '#group-' + catId;
        sub.dataset.target = 'group-' + catId;
        sub.className = 'nav-sub';
        sub.innerHTML = '<span>' + escapeHtml(c.name) + '</span><span class="nav-count">' + c.n + '</span>';
        sideNav.appendChild(sub);
      }
    }
  }
}

function setupPanel() {
  const panel = document.getElementById('searchPanel');
  const toggle = document.getElementById('panelToggle');
  if (!panel || !toggle) return;

  function setCollapsed(collapsed, persist) {
    panel.hidden = collapsed;
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    const label = toggle.querySelector('.panel-toggle-text');
    if (label) label.textContent = collapsed ? '筛选' : '收起';
    if (persist) localStorage.setItem(PANEL_KEY, collapsed ? '1' : '0');
  }

  setCollapsed(localStorage.getItem(PANEL_KEY) === '1', false);
  toggle.addEventListener('click', () => setCollapsed(!panel.hidden, true));
}

function applySortUI() {
  document.querySelectorAll('[data-sort]').forEach(b => {
    const on = b.dataset.sort === state.sort;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function setActive(link) {
  sideNav.querySelectorAll('a').forEach(x => x.classList.toggle('active', x === link));
}

function updateActiveNav() {
  if (window.innerWidth <= 980) return;
  if (state.q) return;
  const targets = Array.from(document.querySelectorAll('[data-spy]'));
  if (!targets.length) return;
  let current = targets[0];
  for (const el of targets) {
    if (el.getBoundingClientRect().top <= 170) current = el;
    else break;
  }
  const link = sideNav.querySelector('a[data-target="' + current.id + '"]');
  if (link) setActive(link);
}

/* ---------- Search interactions ---------- */
let debounceTimer = null;
async function runSearch() {
  const token = ++searchToken;
  const q = state.q.trim();
  if (!q) { render(); return; }
  if (state.scope !== 'title' && !state.searchIndex && !state.searchError) {
    try {
      await ensureSearchIndex();
    } catch (e) { /* fall back to title */ }
    if (token !== searchToken) return;
  }
  render();
}

input.addEventListener('input', () => {
  state.q = input.value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSearch();
  }, 180);
});
clearBtn.addEventListener('click', () => {
  state.q = '';
  input.value = '';
  input.focus();
  render();
});
chipsEl.addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  state.filter = btn.dataset.filter;
  buildChips();
  buildNav();
  if (state.q) runSearch(); else render();
});
document.getElementById('emptyReset').addEventListener('click', () => {
  state.q = '';
  state.filter = 'all';
  input.value = '';
  buildChips();
  buildNav();
  render();
  input.focus();
});
sideNav.addEventListener('click', e => {
  const a = e.target.closest('a[data-target]');
  if (!a) return;
  e.preventDefault();
  if (state.q) {
    state.q = '';
    input.value = '';
    buildNav();
    render();
  }
  const el = document.getElementById(a.dataset.target);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(a);
  }
});

/* scope / mode / sort segmented controls */
document.querySelectorAll('[data-scope]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.scope = btn.dataset.scope;
    document.querySelectorAll('[data-scope]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (state.q) runSearch(); else render();
  });
});
document.querySelectorAll('[data-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (state.q) runSearch(); else render();
  });
});
document.querySelectorAll('[data-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.sort = btn.dataset.sort;
    localStorage.setItem(SORT_KEY, state.sort);
    applySortUI();
    buildNav();
    render();
  });
});

/* ---------- Scroll spy ---------- */
window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateActiveNav();
    scrollTicking = false;
  });
}, { passive: true });

/* ---------- Modal ---------- */
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
let lastFocus = null;

function openModal(e) {
  lastFocus = document.activeElement;
  document.getElementById('modalTitle').textContent = e.title;
  document.getElementById('modalCat').textContent = e.cat;
  document.getElementById('modalCat2').textContent = e.cat;
  document.getElementById('modalStatus').textContent = e.status;
  document.getElementById('modalStatus2').textContent = e.status;
  document.getElementById('modalNo').textContent = '#' + pad4(e.indexNo);
  const read = document.getElementById('modalRead');
  const empty = document.getElementById('modalEmpty');
  const bodyStatus = document.getElementById('modalBodyStatus');
  if (e.hasText && e.file) {
    read.href = e.file;
    read.hidden = false;
    empty.hidden = true;
    bodyStatus.textContent = '已入库（' + Number(e.chars || 0).toLocaleString('zh-CN') + ' 字）';
    bodyStatus.className = 'ok';
  } else {
    read.hidden = true;
    empty.hidden = false;
    bodyStatus.textContent = '暂未入库';
    bodyStatus.className = 'warn';
  }
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
lawList.addEventListener('click', e => {
  const row = e.target.closest('.law-row');
  if (!row) return;
  const item = LAW_DATA.find(x => x.id === row.dataset.id);
  if (item) openModal(item);
});
modalClose.addEventListener('click', closeModal);
document.getElementById('modalRead').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  if (e.target.dataset.close) closeModal();
});

/* ---------- Daily update check ---------- */
const LAST_CHECK_KEY = 'law-index-last-check';
function setUpdateStatus(text) {
  const el = document.getElementById('updateStatus');
  if (el) el.textContent = text;
}
async function checkForUpdates(force) {
  const today = localDate();
  const version = (META && META.generatedAt) ? META.generatedAt : '';
  const shortVersion = (META && META.dataDate) ? META.dataDate : (version ? version.slice(0, 10) : '—');

  if (!force && localStorage.getItem(LAST_CHECK_KEY) === today) {
    setUpdateStatus('数据版本 ' + shortVersion + ' · 今日已检查');
    return;
  }

  if (location.protocol === 'file:') {
    localStorage.setItem(LAST_CHECK_KEY, today);
    setUpdateStatus('本地模式 · 数据版本 ' + shortVersion);
    return;
  }

  setUpdateStatus('正在检查更新…');
  try {
    const res = await fetch('data/version.json?ts=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const v = await res.json();
    localStorage.setItem(LAST_CHECK_KEY, today);
    if (v.version && version && v.version !== version) {
      setUpdateStatus('发现新版本，正在刷新…');
      const url = new URL(location.href);
      url.searchParams.set('v', v.version);
      location.replace(url.toString());
      return;
    }
    setUpdateStatus('数据版本 ' + shortVersion + ' · 已是最新');
  } catch (err) {
    localStorage.setItem(LAST_CHECK_KEY, today);
    setUpdateStatus('本地模式 · 数据版本 ' + shortVersion);
  }
}
const updateBtn = document.getElementById('checkUpdateBtn');
if (updateBtn) updateBtn.addEventListener('click', () => checkForUpdates(true));

/* ---------- Keyboard ---------- */
document.addEventListener('keydown', e => {
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  const typing = tag === 'INPUT' || tag === 'TEXTAREA';
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    input.focus();
    input.select();
  }
  if (e.key === 'Escape') {
    if (!modal.hidden) closeModal();
    else if (state.q) { state.q = ''; input.value = ''; render(); }
  }
});

/* ---------- Boot ---------- */
function showDataError() {
  lawList.innerHTML = '<div class="empty"><div class="empty-seal" aria-hidden="true">!</div>' +
    '<h3>索引数据加载失败</h3><p>请确认 data/laws.js 文件存在，或通过本地服务器打开本页。</p></div>';
}
function init() {
  META = window.LAW_INDEX_DATA || {};
  LAW_DATA = Array.isArray(META.entries) ? META.entries : [];
  if (!LAW_DATA.length) { showDataError(); return; }

  // Stable chronological numbers fallback if an older data file lacks indexNo.
  if (LAW_DATA.some(e => !e.indexNo)) {
    const sorted = [...LAW_DATA].sort((a, b) => String(a.gbrq || '').localeCompare(String(b.gbrq || '')));
    sorted.forEach((e, i) => { e.indexNo = i + 1; });
  }

  const stored = LAW_DATA.filter(e => e.hasText).length;
  document.getElementById('statTotal').textContent = LAW_DATA.length;
  document.getElementById('statLaws').textContent = countBy('laws');
  document.getElementById('statPending').textContent = countBy('pending');
  document.getElementById('statStored').textContent = stored;
  document.getElementById('noticeTotal').textContent = LAW_DATA.length;
  document.getElementById('noticeStored').textContent = stored;
  document.getElementById('noticeMissing').textContent = LAW_DATA.length - stored;
  document.getElementById('footStored').textContent = stored;
  document.getElementById('footTotal').textContent = LAW_DATA.length;
  const dv = document.getElementById('dataVersion');
  const displayDate = (META.dataDate || (META.generatedAt || '').slice(0, 10) || '—');
  if (dv) dv.textContent = displayDate;
  const footerDate = document.getElementById('footerDate');
  if (footerDate) footerDate.textContent = displayDate;

  const savedSort = localStorage.getItem(SORT_KEY);
  if (savedSort === 'time' || savedSort === 'category') state.sort = savedSort;

  applySortUI();
  setupPanel();
  buildChips();
  buildNav();
  render();
  updateSearchState();
  checkForUpdates(false);
}

if (window.LAW_INDEX_DATA) {
  init();
} else {
  window.addEventListener('law-data-ready', init, { once: true });
  window.addEventListener('law-data-error', showDataError, { once: true });
}
