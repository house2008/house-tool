'use strict';

const DATA = window.LAW_LIBRARY_DATA || { stats: {}, entries: [] };
const ENTRIES = DATA.entries || [];
const state = {
  q: '',
  type: 'all',
  year: 'all',
  scope: 'all',        // all | title | body
  mode: 'fuzzy',       // fuzzy | exact
  searchIndex: null,
  searchLoading: false,
  searchError: false
};

const input = document.getElementById('libSearch');
const listEl = document.getElementById('libList');
const chipsEl = document.getElementById('libChips');
const yearEl = document.getElementById('libYear');
const countEl = document.getElementById('libCount');
const emptyEl = document.getElementById('libEmpty');
const clearBtn = document.getElementById('libClear');
const panelEl = document.getElementById('libSearchPanel');
const panelToggle = document.getElementById('libPanelToggle');
const searchStatus = document.getElementById('libSearchStatus');
const PANEL_KEY = 'law-library-panel-collapsed';

let searchIndexPromise = null;
let timer = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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
function typeOrder() {
  return [...new Set(ENTRIES.map(e => e.type))];
}
function typeCount(type) {
  return ENTRIES.filter(e => e.type === type).length;
}
function statusClass(status) {
  if (status === '现行有效' || status === '尚未生效') return 'current';
  if (status === '有关决定') return 'decision';
  return 'history';
}

function itemHtml(e, snippet, tokens) {
  const tks = tokens || [];
  const title = tks.length ? highlight(e.title, tks) : escapeHtml(e.title);
  return '<div class="lib-item">' +
    '<div class="lib-item-main">' +
      '<a class="lib-item-title" href="' + escapeHtml(e.html) + '" target="_blank" rel="noopener">' + title + '</a>' +
      '<span class="lib-item-meta">' + escapeHtml(e.type) + ' · ' + escapeHtml(e.dateText) +
        ' · <span class="lib-status ' + statusClass(e.status) + '">' + escapeHtml(e.status) + '</span></span>' +
      (snippet ? '<span class="lib-item-snippet">' + highlight(snippet, tks) + '</span>' : '') +
    '</div>' +
    '<div class="lib-item-actions">' +
      '<a href="' + escapeHtml(e.docx) + '" download>DOCX</a>' +
      '<a class="read" href="' + escapeHtml(e.html) + '" target="_blank" rel="noopener">阅读 ›</a>' +
    '</div>' +
  '</div>';
}

function buildChips() {
  chipsEl.innerHTML = '';
  const all = document.createElement('button');
  all.type = 'button';
  all.className = 'lib-chip' + (state.type === 'all' ? ' active' : '');
  all.innerHTML = '全部 <span class="n">' + ENTRIES.length + '</span>';
  all.addEventListener('click', () => { state.type = 'all'; buildChips(); runSearch(); });
  chipsEl.appendChild(all);

  for (const type of typeOrder()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lib-chip' + (state.type === type ? ' active' : '');
    b.innerHTML = escapeHtml(type) + ' <span class="n">' + typeCount(type) + '</span>';
    b.addEventListener('click', () => { state.type = type; buildChips(); runSearch(); });
    chipsEl.appendChild(b);
  }
}

function buildYears() {
  const years = [...new Set(ENTRIES.map(e => e.year))].sort();
  yearEl.innerHTML = '<option value="all">全部年份</option>' +
    years.map(y => '<option value="' + y + '">' + (y === '0000' ? '日期未详' : y + '年') + '</option>').join('');
  yearEl.value = state.year;
}

/* ---------- Full-text search ---------- */
function updateSearchState() {
  if (!searchStatus) return;
  if (state.searchLoading) {
    searchStatus.hidden = false;
    searchStatus.textContent = '正在加载全文索引…';
  } else if (state.searchError) {
    searchStatus.hidden = false;
    searchStatus.textContent = '全文索引不可用，仅标题检索';
  } else if (state.searchIndex) {
    searchStatus.hidden = false;
    searchStatus.textContent = '全文索引已加载';
  } else {
    searchStatus.hidden = true;
  }
}
function ensureSearchIndex() {
  if (state.searchIndex) return Promise.resolve(state.searchIndex);
  if (searchIndexPromise) return searchIndexPromise;
  state.searchLoading = true;
  updateSearchState();
  searchIndexPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'data/library-search-index.js?v=' + encodeURIComponent(DATA.generatedAt || Date.now());
    s.async = true;
    s.onload = () => {
      state.searchLoading = false;
      if (window.LAW_LIBRARY_SEARCH && window.LAW_LIBRARY_SEARCH.entries) {
        state.searchIndex = window.LAW_LIBRARY_SEARCH.entries;
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
      reject(new Error('library search index load failed'));
    };
    document.head.appendChild(s);
  });
  return searchIndexPromise;
}
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
  const body = state.searchIndex ? String(state.searchIndex[e.id] || '').replace(/\s+/g, ' ').toLowerCase() : '';
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
  return {
    e,
    titleMatch,
    bodyMatch,
    snippet: bodyMatch ? makeSnippet(state.searchIndex[e.id], tokens, q) : '',
    score: (titleMatch ? 100 : 0) + (bodyMatch ? 40 : 0) + (normalize(e.title) === normalize(q) ? 80 : 0)
  };
}

function renderLoading() {
  countEl.textContent = '正在加载全文索引…';
  listEl.innerHTML = '<div class="lib-empty"><h3>正在加载全文索引…</h3><p>首次正文搜索需要加载本地全文索引，请稍候。</p></div>';
  emptyEl.hidden = true;
}

function render() {
  const q = state.q.trim();
  const tokens = tokensOf(q);

  if (q && state.scope !== 'title' && !state.searchIndex && !state.searchError) {
    renderLoading();
    return;
  }

  const base = ENTRIES.filter(e => {
    if (state.type !== 'all' && e.type !== state.type) return false;
    if (state.year !== 'all' && e.year !== state.year) return false;
    return true;
  });

  listEl.innerHTML = '';

  if (q) {
    const results = base.map(e => matchEntry(e, q, tokens)).filter(Boolean)
      .sort((a, b) => b.score - a.score || a.e.type.localeCompare(b.e.type, 'zh') ||
        a.e.year.localeCompare(b.e.year) || a.e.title.localeCompare(b.e.title, 'zh'));
    const titleCount = results.filter(r => r.titleMatch).length;
    const bodyCount = results.filter(r => r.bodyMatch).length;
    countEl.textContent = '找到 ' + results.length + ' 份 · 标题 ' + titleCount + ' / 正文 ' + bodyCount;

    if (!results.length) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    const sec = document.createElement('section');
    sec.className = 'lib-type';
    sec.innerHTML = '<div class="lib-type-head"><h2>搜索结果</h2><span class="n">' + results.length + ' 份</span></div>' +
      '<div class="lib-items">' + results.map(r => itemHtml(r.e, r.snippet, tokens)).join('') + '</div>';
    listEl.appendChild(sec);
    return;
  }

  countEl.textContent = '共 ' + base.length + ' 份';
  if (!base.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  const groups = new Map();
  for (const e of base) {
    if (!groups.has(e.type)) groups.set(e.type, new Map());
    const years = groups.get(e.type);
    if (!years.has(e.year)) years.set(e.year, []);
    years.get(e.year).push(e);
  }

  for (const [type, years] of groups) {
    const sec = document.createElement('section');
    sec.className = 'lib-type';
    let html = '<div class="lib-type-head"><h2>' + escapeHtml(type) + '</h2><span class="n">' +
      [...years.values()].reduce((n, a) => n + a.length, 0) + ' 份</span></div>';
    for (const [year, items] of [...years.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      html += '<div class="lib-year"><div class="lib-year-head"><h3>' +
        (year === '0000' ? '日期未详' : year + '年') + '</h3><span class="line"></span><span class="n">' +
        items.length + '</span></div><div class="lib-items">' +
        items.map(e => itemHtml(e, '', [])).join('') + '</div></div>';
    }
    sec.innerHTML = html;
    listEl.appendChild(sec);
  }
}

async function runSearch() {
  const q = state.q.trim();
  if (q && state.scope !== 'title' && !state.searchIndex && !state.searchError) {
    renderLoading();
    try {
      await ensureSearchIndex();
    } catch (e) { /* fall back to title */ }
  }
  render();
}

function updateClear() {
  clearBtn.hidden = !state.q;
}

function setPanelCollapsed(collapsed, persist) {
  panelEl.hidden = collapsed;
  panelToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  const label = panelToggle.querySelector('.lib-panel-text');
  if (label) label.textContent = collapsed ? '筛选' : '收起';
  if (persist) localStorage.setItem(PANEL_KEY, collapsed ? '1' : '0');
}

input.addEventListener('input', () => {
  state.q = input.value;
  updateClear();
  clearTimeout(timer);
  timer = setTimeout(runSearch, 180);
});
clearBtn.addEventListener('click', () => {
  state.q = '';
  input.value = '';
  updateClear();
  render();
  input.focus();
});
yearEl.addEventListener('change', () => { state.year = yearEl.value; runSearch(); });
panelToggle.addEventListener('click', () => setPanelCollapsed(!panelEl.hidden, true));

document.querySelectorAll('[data-lib-scope]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.scope = btn.dataset.libScope;
    document.querySelectorAll('[data-lib-scope]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    runSearch();
  });
});
document.querySelectorAll('[data-lib-mode]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.mode = btn.dataset.libMode;
    document.querySelectorAll('[data-lib-mode]').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    runSearch();
  });
});

document.addEventListener('keydown', e => {
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    input.focus();
    input.select();
  } else if (e.key === 'Escape' && state.q) {
    state.q = '';
    input.value = '';
    updateClear();
    render();
  }
});

document.getElementById('statTotal').textContent = DATA.stats.total || ENTRIES.length;
document.getElementById('statTitles').textContent = DATA.stats.uniqueTitles || 0;
document.getElementById('statCurrent').textContent = DATA.stats.current || 0;
document.getElementById('statHistory').textContent = DATA.stats.historical || 0;

setPanelCollapsed(localStorage.getItem(PANEL_KEY) === '1', false);
updateClear();
buildChips();
buildYears();
render();
