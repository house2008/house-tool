(function () {
  'use strict';

  var textRoot = document.querySelector('.law-text');
  var topbar = document.querySelector('.law-topbar');
  var topbarRight = topbar && topbar.querySelector('.topbar-right');
  if (!textRoot || !topbar || !topbarRight) return;

  var supportsHighlight = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
  if (!supportsHighlight) return;

  var state = {
    keywords: [],
    matches: [],
    active: null,
    index: 0
  };

  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'find-toggle';
  toggle.textContent = '检索';
  toggle.title = '页内检索（Ctrl+F）';
  topbarRight.insertBefore(toggle, topbarRight.firstChild);

  var panel = document.createElement('div');
  panel.className = 'find-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="find-inner">' +
      '<div class="find-row">' +
        '<svg class="find-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">' +
          '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>' +
        '</svg>' +
        '<input id="lawFindInput" type="search" autocomplete="off" spellcheck="false" placeholder="输入关键词，多个关键词用空格分隔" aria-label="页内检索">' +
        '<span class="find-count" id="lawFindCount" aria-live="polite">0 / 0</span>' +
        '<button class="find-nav" id="lawFindPrev" type="button" title="上一个（Shift+Enter）">↑</button>' +
        '<button class="find-nav" id="lawFindNext" type="button" title="下一个（Enter）">↓</button>' +
        '<button class="find-close" id="lawFindClose" type="button" title="关闭（Esc）">×</button>' +
      '</div>' +
      '<div class="find-chips" id="lawFindChips"></div>' +
    '</div>';
  topbar.insertAdjacentElement('afterend', panel);

  var input = panel.querySelector('#lawFindInput');
  var countEl = panel.querySelector('#lawFindCount');
  var chipsEl = panel.querySelector('#lawFindChips');
  var prevBtn = panel.querySelector('#lawFindPrev');
  var nextBtn = panel.querySelector('#lawFindNext');
  var closeBtn = panel.querySelector('#lawFindClose');
  var timer = null;

  chipsEl.innerHTML = '<span class="find-hint">多个关键词用空格分隔；点击关键词可定位</span>';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function parseKeywords(q) {
    var out = [];
    var re = /"([^"]+)"|“([^”]+)”|([^\s,，、;；]+)/g;
    var m;
    while ((m = re.exec(q))) {
      var k = (m[1] || m[2] || m[3] || '').trim();
      if (k) out.push(k);
    }
    return out.filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function collectMatches() {
    state.matches = [];
    if (!state.keywords.length) return;

    var walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if (!p || p.closest('.law-source, script, style')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var node;
    while ((node = walker.nextNode())) {
      var text = node.nodeValue;
      var lower = text.toLowerCase();
      var nodeMatches = [];
      for (var i = 0; i < state.keywords.length; i++) {
        var keyword = state.keywords[i];
        var needle = keyword.toLowerCase();
        var idx = 0;
        while ((idx = lower.indexOf(needle, idx)) !== -1) {
          nodeMatches.push({ node: node, start: idx, end: idx + keyword.length, keyword: keyword });
          idx += Math.max(1, keyword.length);
        }
      }
      nodeMatches.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
      for (var j = 0; j < nodeMatches.length; j++) state.matches.push(nodeMatches[j]);
    }
  }

  function visibleMatches() {
    if (!state.active) return state.matches;
    return state.matches.filter(function (m) { return m.keyword === state.active; });
  }

  function rangeFor(m) {
    var r = document.createRange();
    r.setStart(m.node, m.start);
    r.setEnd(m.node, m.end);
    return r;
  }

  function clearHighlights() {
    if (CSS.highlights) {
      CSS.highlights.delete('law-find');
      CSS.highlights.delete('law-find-current');
    }
  }

  function setHighlights(ranges, name) {
    if (!CSS.highlights) return;
    if (ranges.length) {
      var h = new Highlight();
      for (var i = 0; i < ranges.length; i++) h.add(ranges[i]);
      CSS.highlights.set(name, h);
    } else {
      CSS.highlights.delete(name);
    }
  }

  function scrollToRange(range) {
    var rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      var el = range.startContainer.parentElement;
      if (el) el.scrollIntoView({ block: 'center' });
      return;
    }
    if (rect.top < 150 || rect.bottom > window.innerHeight - 90) {
      window.scrollTo({ top: window.scrollY + rect.top - 150, behavior: 'smooth' });
    }
  }

  function update() {
    var ranges = state.matches.map(rangeFor);
    setHighlights(ranges, 'law-find');

    var visible = visibleMatches();
    if (visible.length) {
      if (state.index >= visible.length) state.index = 0;
      if (state.index < 0) state.index = visible.length - 1;
      var current = rangeFor(visible[state.index]);
      setHighlights([current], 'law-find-current');
      countEl.textContent = (state.index + 1) + ' / ' + visible.length;
      scrollToRange(current);
    } else {
      CSS.highlights.delete('law-find-current');
      countEl.textContent = '0 / 0';
    }

    var chips = chipsEl.querySelectorAll('.find-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i].dataset.keyword === (state.active || '__all__'));
    }
  }

  function buildChips() {
    chipsEl.innerHTML = '';
    if (!state.keywords.length) {
      chipsEl.innerHTML = '<span class="find-hint">多个关键词用空格分隔；点击关键词可定位</span>';
      return;
    }

    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'find-chip';
    all.dataset.keyword = '__all__';
    all.innerHTML = '全部 <span class="n">' + state.matches.length + '</span>';
    all.addEventListener('click', function () {
      state.active = null;
      state.index = 0;
      update();
    });
    chipsEl.appendChild(all);

    for (var i = 0; i < state.keywords.length; i++) {
      var keyword = state.keywords[i];
      var n = state.matches.filter(function (m) { return m.keyword === keyword; }).length;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'find-chip';
      b.dataset.keyword = keyword;
      b.innerHTML = escapeHtml(keyword) + ' <span class="n">' + n + '</span>';
      b.addEventListener('click', (function (k) {
        return function () {
          state.active = k;
          state.index = 0;
          update();
        };
      })(keyword));
      chipsEl.appendChild(b);
    }
  }

  function runSearch() {
    state.keywords = parseKeywords(input.value);
    state.active = null;
    state.index = 0;
    collectMatches();
    buildChips();
    update();
  }

  function next(dir) {
    var visible = visibleMatches();
    if (!visible.length) return;
    state.index = (state.index + dir + visible.length) % visible.length;
    update();
  }

  function openPanel() {
    panel.hidden = false;
    toggle.classList.add('active');
    input.focus();
    input.select();
    if (input.value.trim()) runSearch();
  }

  function closePanel() {
    panel.hidden = true;
    toggle.classList.remove('active');
    state.keywords = [];
    state.matches = [];
    state.active = null;
    state.index = 0;
    clearHighlights();
    chipsEl.innerHTML = '<span class="find-hint">多个关键词用空格分隔；点击关键词可定位</span>';
    countEl.textContent = '0 / 0';
  }

  toggle.addEventListener('click', function () {
    if (panel.hidden) openPanel(); else closePanel();
  });
  closeBtn.addEventListener('click', closePanel);
  prevBtn.addEventListener('click', function () { next(-1); });
  nextBtn.addEventListener('click', function () { next(1); });

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 160);
  });
  input.addEventListener('search', function () {
    if (!input.value) runSearch();
  });

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openPanel();
      return;
    }
    if (e.key === 'Escape' && !panel.hidden) {
      e.preventDefault();
      closePanel();
      return;
    }
    if (!panel.hidden && e.key === 'Enter' && document.activeElement === input) {
      e.preventDefault();
      next(e.shiftKey ? -1 : 1);
      return;
    }
    if (!panel.hidden && e.key === 'F3') {
      e.preventDefault();
      next(e.shiftKey ? -1 : 1);
    }
  });

  window.addEventListener('beforeprint', clearHighlights);
  window.addEventListener('afterprint', function () {
    if (!panel.hidden) update();
  });
})();
