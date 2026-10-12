(function () {
  'use strict';

  var START_TIME = Date.now();

  var GREETINGS = [
    'welcome back, operator.',
    'system initialized. ready for input.',
    'connection established. you are in.',
    'terminal online. hack the planet.',
    'access granted. what will you build?',
    'boot sequence complete. let\'s code.',
    'all systems nominal. proceed.',
    'hello, world. again.',
    'root session active. enjoy.',
    'matrix loaded. follow the white rabbit.'
  ];

  var ENGINES = [
    { id: 'ddg', name: 'DuckDuckGo', icon: 'D', color: 'a', url: 'https://duckduckgo.com/?q=', suggest: 'https://duckduckgo.com/ac/?q={q}&type=list' },
    { id: 'google', name: 'Google', icon: 'G', color: 'g', url: 'https://www.google.com/search?q=', suggest: null },
    { id: 'bing', name: 'Bing', icon: 'B', color: 'c', url: 'https://www.bing.com/search?q=', suggest: null },
    { id: 'baidu', name: 'Baidu', icon: 'Bd', color: 'm', url: 'https://www.baidu.com/s?wd=', suggest: null }
  ];

  var QUICK_LINKS = [
    { name: 'GitHub', url: 'https://github.com', icon: 'g', color: 'g' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'S', color: 'c' },
    { name: 'MDN', url: 'https://developer.mozilla.org', icon: 'M', color: 'c' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'D', color: 'a' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'H', color: 'a' },
    { name: 'V2EX', url: 'https://www.v2ex.com', icon: 'V', color: 'm' },
    { name: 'Reddit', url: 'https://reddit.com', icon: 'R', color: 'm' }
  ];

  var currentEngineIdx = 0;
  var customLinks = [];
  var hiddenLinks = [];
  var suggestTimer = null;
  var userLat = null;
  var userLon = null;

  // matrixEnabled：矩阵雨背景开关；weatherEnabled：天气显示开关。两者都会被写入 localStorage。
  var matrixEnabled = true;
  var weatherEnabled = true;
  // geoFailed：本页生命周期内浏览器定位是否已失败过。失败后再次点击天气直接走「手动填城市」，
  // 免得用户反复点、等 10 秒、再被拒一次。
  var geoFailed = false;

  // 矩阵雨运行期状态，拆到模块级是为了让启动 / 停止可以被开关按钮随时调用。
  var matrixCanvas = null;
  var matrixCtx = null;
  var matrixRafId = 0;
  var matrixCols = 0;
  var matrixDrops = [];
  var matrixW = 0;
  var matrixH = 0;
  var MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFabcdef{}[]|/\\<>?;:\'"`~!@#$%^&*()_+-=';

  function $(id) { return document.getElementById(id); }

  function loadCustomLinks() {
    try {
      var raw = localStorage.getItem('geek_newtab_links');
      if (raw) customLinks = JSON.parse(raw);
    } catch (e) {}
  }

  function saveCustomLinks() {
    try { localStorage.setItem('geek_newtab_links', JSON.stringify(customLinks)); } catch (e) {}
  }

  function loadHiddenLinks() {
    try {
      var raw = localStorage.getItem('geek_newtab_hidden');
      if (raw) hiddenLinks = JSON.parse(raw);
    } catch (e) {}
  }

  function saveHiddenLinks() {
    try { localStorage.setItem('geek_newtab_hidden', JSON.stringify(hiddenLinks)); } catch (e) {}
  }

  function loadEnginePref() {
    try {
      var idx = localStorage.getItem('geek_newtab_engine');
      if (idx !== null && !isNaN(idx)) currentEngineIdx = parseInt(idx, 10);
      if (currentEngineIdx < 0 || currentEngineIdx >= ENGINES.length) currentEngineIdx = 0;
    } catch (e) {}
  }

  function saveEnginePref() {
    try { localStorage.setItem('geek_newtab_engine', String(currentEngineIdx)); } catch (e) {}
  }

  function getDomain(url) {
    return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
  }

  /**
   * 按当前窗口尺寸重置画布，并重新随机生成每一列雨滴的初始位置。
   * @returns {void}
   */
  function matrixResize() {
    if (!matrixCanvas) return;
    matrixW = matrixCanvas.width = window.innerWidth;
    matrixH = matrixCanvas.height = window.innerHeight;
    matrixCols = Math.floor(matrixW / 16);
    matrixDrops = [];
    for (var i = 0; i < matrixCols; i++) {
      matrixDrops[i] = Math.random() * -100;
    }
  }

  /**
   * 绘制一帧矩阵雨，并在帧尾预约下一帧。只有 matrixRafId 非 0 时才会被调用。
   * @returns {void}
   */
  function matrixDraw() {
    if (!matrixCtx) return;
    matrixCtx.fillStyle = 'rgba(5,5,5,.06)';
    matrixCtx.fillRect(0, 0, matrixW, matrixH);
    matrixCtx.font = '14px monospace';

    for (var i = 0; i < matrixDrops.length; i++) {
      var ch = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      var x = i * 16;
      var y = matrixDrops[i] * 16;

      // 越接近屏幕底部越暗，用三档绿色表现纵深层次
      var alpha = Math.max(0.05, 1 - (y / matrixH));
      if (alpha > 0.6) matrixCtx.fillStyle = '#00ff41';
      else if (alpha > 0.25) matrixCtx.fillStyle = '#00cc33';
      else matrixCtx.fillStyle = '#006618';

      matrixCtx.fillText(ch, x, y);

      if (y > matrixH && Math.random() > 0.975) {
        matrixDrops[i] = 0;
      } else {
        matrixDrops[i] += 0.4 + Math.random() * 0.8;
      }
    }

    matrixRafId = requestAnimationFrame(matrixDraw);
  }

  /**
   * 启动矩阵雨动画。重复调用不会叠加出多个动画循环。
   * @returns {void}
   */
  function matrixStart() {
    if (!matrixCtx || matrixRafId) return;
    matrixResize();
    matrixRafId = requestAnimationFrame(matrixDraw);
  }

  /**
   * 停止矩阵雨动画并清空画布，停止后不再占用 CPU。
   * @returns {void}
   */
  function matrixStop() {
    if (matrixRafId) {
      cancelAnimationFrame(matrixRafId);
      matrixRafId = 0;
    }
    if (matrixCtx) matrixCtx.clearRect(0, 0, matrixW, matrixH);
  }

  /**
   * 设置矩阵雨开关状态，同时写入 localStorage 并刷新状态栏 MODE 显示。
   * @param {boolean} enabled - true 开启矩阵雨，false 关闭
   * @returns {void}
   */
  function setMatrix(enabled) {
    matrixEnabled = !!enabled;
    try { localStorage.setItem('geek_newtab_matrix', matrixEnabled ? '1' : '0'); } catch (e) {}
    if (matrixEnabled) matrixStart(); else matrixStop();
    updateModeUI();
  }

  /**
   * 切换矩阵雨开关（状态栏 MODE 按钮的点击处理函数）。
   * @returns {void}
   */
  function toggleMatrix() {
    setMatrix(!matrixEnabled);
  }

  /**
   * 刷新状态栏 MODE 按钮的文案与无障碍状态：开启显示 HACKER，关闭显示 OFF。
   * @returns {void}
   */
  function updateModeUI() {
    var el = $('modeToggle');
    if (!el) return;
    el.textContent = matrixEnabled ? 'HACKER' : 'OFF';
    el.classList.toggle('off', !matrixEnabled);
    el.title = matrixEnabled ? '点击关闭矩阵雨背景' : '点击开启矩阵雨背景';
    el.setAttribute('aria-pressed', matrixEnabled ? 'true' : 'false');
  }

  /**
   * 读取矩阵雨开关偏好，未设置过时默认开启。
   * @returns {boolean} 当前偏好下的矩阵雨开关状态
   */
  function loadMatrixPref() {
    try {
      var raw = localStorage.getItem('geek_newtab_matrix');
      if (raw !== null) matrixEnabled = raw === '1';
    } catch (e) {}
    return matrixEnabled;
  }

  /**
   * 初始化矩阵雨：取得画布上下文、绑定窗口缩放、读取偏好并按偏好决定是否启动。
   * @returns {void}
   */
  function initMatrix() {
    matrixCanvas = $('matrixBg');
    if (!matrixCanvas) return;
    matrixCtx = matrixCanvas.getContext('2d');
    if (!matrixCtx) return;

    window.addEventListener('resize', function () {
      if (matrixEnabled) matrixResize();
    });

    loadMatrixPref();
    updateModeUI();

    var btn = $('modeToggle');
    if (btn) btn.addEventListener('click', toggleMatrix);

    if (matrixEnabled) matrixStart();
  }

  function initClock() {
    var timeEl = $('timeDisplay');
    var dateEl = $('dateDisplay');

    function tick() {
      var now = new Date();
      var h = String(now.getHours()).padStart(2, '0');
      var m = String(now.getMinutes()).padStart(2, '0');
      var s = String(now.getSeconds()).padStart(2, '0');

      timeEl.textContent = h + ':' + m + ':' + s;

      var y = now.getFullYear();
      var mo = String(now.getMonth() + 1).padStart(2, '0');
      var d = String(now.getDate()).padStart(2, '0');
      var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      dateEl.textContent = days[now.getDay()] + ' ' + y + '/' + mo + '/' + d;
    }

    tick();
    setInterval(tick, 1000);
  }

  function typeGreeting() {
    var el = $('greeting');
    if (!el) return;

    var text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    var idx = 0;

    function step() {
      if (idx < text.length) {
        el.textContent += text.charAt(idx);
        idx++;
        setTimeout(step, 35 + Math.random() * 40);
      }
    }

    setTimeout(step, 400);
  }

  function renderEngineDropdown() {
    var dd = $('engineDropdown');
    if (!dd) return;
    dd.innerHTML = '';
    for (var i = 0; i < ENGINES.length; i++) {
      (function (eng, idx) {
        var btn = document.createElement('button');
        btn.className = 's-d-item' + (idx === currentEngineIdx ? ' active' : '');
        btn.type = 'button';

        var ic = document.createElement('span');
        ic.className = 's-d-icon ' + eng.color;
        ic.textContent = eng.icon;

        var nm = document.createElement('span');
        nm.className = 's-d-name';
        nm.textContent = eng.name;

        var ur = document.createElement('span');
        ur.className = 's-d-url';
        ur.textContent = getDomain(eng.url);

        btn.appendChild(ic);
        btn.appendChild(nm);
        btn.appendChild(ur);

        btn.addEventListener('click', function () {
          currentEngineIdx = idx;
          saveEnginePref();
          updateEngineUI();
          closeDropdown();
        });

        dd.appendChild(btn);
      })(ENGINES[i], i);
    }
  }

  function updateEngineUI() {
    var eng = ENGINES[currentEngineIdx];
    var iconEl = $('engineIcon');
    if (iconEl) iconEl.textContent = eng.icon;
  }

  function openDropdown() {
    var dd = $('engineDropdown');
    if (!dd) return;
    renderEngineDropdown();
    dd.classList.add('show');
  }

  function closeDropdown() {
    var dd = $('engineDropdown');
    if (dd) dd.classList.remove('show');
  }

  function toggleDropdown() {
    var dd = $('engineDropdown');
    if (!dd || dd.classList.contains('show')) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function showSuggest(items) {
    var el = $('suggestList');
    if (!el) return;
    el.innerHTML = '';

    if (!items || items.length === 0) {
      el.classList.remove('show');
      return;
    }

    for (var i = 0; i < Math.min(items.length, 8); i++) {
      (function (text) {
        var item = document.createElement('button');
        item.className = 'ss-item';
        item.type = 'button';

        var t = document.createElement('span');
        t.className = 'ss-text';
        t.textContent = text;

        var h = document.createElement('span');
        h.className = 'ss-hint';
        h.textContent = ENGINES[currentEngineIdx].name;

        item.appendChild(t);
        item.appendChild(h);

        item.addEventListener('click', function () {
          doSearch(text);
        });

        el.appendChild(item);
      })(items[i]);
    }

    el.classList.add('show');
  }

  function hideSuggest() {
    var el = $('suggestList');
    if (el) el.classList.remove('show');
  }

  function fetchSuggest(q) {
    var eng = ENGINES[currentEngineIdx];
    if (!eng.suggest || q.length === 0) {
      hideSuggest();
      return;
    }

    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(function () {
      var url = eng.suggest.replace('{q}', encodeURIComponent(q));

      var xhr = new XMLHttpRequest();
      try {
        xhr.open('GET', url, true);
      } catch (e) {
        hideSuggest();
        return;
      }
      xhr.timeout = 3000;

      xhr.onload = function () {
        if (xhr.status !== 200) { hideSuggest(); return; }
        try {
          var data = JSON.parse(xhr.responseText);
          var items = [];
          if (Array.isArray(data)) {
            if (data.length > 0 && Array.isArray(data[1])) {
              items = data[1];
            } else if (typeof data[0] === 'string') {
              items = data;
            }
          }
          showSuggest(items.slice(0, 8));
        } catch (e) {
          hideSuggest();
        }
      };

      xhr.onerror = function () { hideSuggest(); };
      xhr.ontimeout = function () { hideSuggest(); };
      try { xhr.send(); } catch (e) { hideSuggest(); }
    }, 250);
  }

  function doSearch(q) {
    if (!q) return;
    hideSuggest();
    var eng = ENGINES[currentEngineIdx];
    window.open(eng.url + encodeURIComponent(q), '_blank');
  }

  function initSearch() {
    var form = $('searchForm');
    var input = $('searchInput');
    var engineBtn = $('engineBtn');

    loadEnginePref();
    updateEngineUI();

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        doSearch(input.value.trim());
      });
    }

    if (input) {
      input.addEventListener('input', function () {
        fetchSuggest(input.value.trim());
      });
      input.addEventListener('focus', function () {
        if (input.value.trim().length > 0) fetchSuggest(input.value.trim());
      });
      input.addEventListener('blur', function () {
        setTimeout(hideSuggest, 200);
      });
      input.focus();
    }

    if (engineBtn) {
      engineBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
      });
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('.s-engine')) return;
      closeDropdown();
    });
  }

  function createLinkIcon(link) {
    var wrap = document.createElement('div');
    wrap.className = 'lnk-icon ' + (link.color || 'g');
    wrap.textContent = link.icon || '?';
    return wrap;
  }

  function renderLinks() {
    var container = $('quickLinks');
    if (!container) return;
    container.innerHTML = '';

    var idx = 0;
    for (var i = 0; i < QUICK_LINKS.length; i++) {
      if (hiddenLinks.indexOf(i) !== -1) continue;

      (function (link, linkIdx) {
        var a = document.createElement('a');
        a.className = 'lnk';
        a.href = link.url;
        a.target = '_blank';
        a.style.animationDelay = (idx * 60) + 'ms';

        var iconWrap = createLinkIcon(link);

        var infoDiv = document.createElement('div');
        infoDiv.className = 'lnk-info';

        var nameDiv = document.createElement('div');
        nameDiv.className = 'lnk-name';
        nameDiv.textContent = link.name;

        var urlDiv = document.createElement('div');
        urlDiv.className = 'lnk-url';
        urlDiv.textContent = getDomain(link.url);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(urlDiv);

        var delBtn = document.createElement('button');
        delBtn.className = 'lnk-del';
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.title = 'Remove link';
        delBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          hiddenLinks.push(linkIdx);
          saveHiddenLinks();
          renderLinks();
        });

        a.appendChild(iconWrap);
        a.appendChild(infoDiv);
        a.appendChild(delBtn);
        container.appendChild(a);
        idx++;
      })(QUICK_LINKS[i], i);
    }

    for (var j = 0; j < customLinks.length; j++) {
      (function (link, cIdx) {
        var a = document.createElement('a');
        a.className = 'lnk';
        a.href = link.url;
        a.target = '_blank';
        a.style.animationDelay = (idx * 60) + 'ms';

        var iconWrap = createLinkIcon(link);

        var infoDiv = document.createElement('div');
        infoDiv.className = 'lnk-info';

        var nameDiv = document.createElement('div');
        nameDiv.className = 'lnk-name';
        nameDiv.textContent = link.name;

        var urlDiv = document.createElement('div');
        urlDiv.className = 'lnk-url';
        urlDiv.textContent = getDomain(link.url);

        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(urlDiv);

        var delBtn = document.createElement('button');
        delBtn.className = 'lnk-del';
        delBtn.type = 'button';
        delBtn.textContent = '×';
        delBtn.title = 'Remove link';
        delBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          customLinks.splice(cIdx, 1);
          saveCustomLinks();
          renderLinks();
        });

        a.appendChild(iconWrap);
        a.appendChild(infoDiv);
        a.appendChild(delBtn);
        container.appendChild(a);
        idx++;
      })(customLinks[j], j);
    }

    var addBtn = document.createElement('button');
    addBtn.className = 'lnk-add';
    addBtn.type = 'button';
    addBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> ADD LINK';
    addBtn.addEventListener('click', openAddModal);
    container.appendChild(addBtn);

    // 只有确实删过内置链接时才显示恢复入口，避免平时占着位置
    if (hiddenLinks.length) {
      var restoreBtn = document.createElement('button');
      restoreBtn.className = 'lnk-reset';
      restoreBtn.type = 'button';
      restoreBtn.title = '恢复被删除的内置链接（不影响自己添加的链接）';
      restoreBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> RESTORE';
      restoreBtn.addEventListener('click', restoreDefaultLinks);
      container.appendChild(restoreBtn);
    }
  }

  /**
   * 恢复全部被删除的内置快捷链接（QUICK_LINKS），自己添加的 customLinks 不受影响。
   * 没有删过任何内置链接时不做任何事。
   * @returns {void}
   */
  function restoreDefaultLinks() {
    if (!hiddenLinks.length) return;
    hiddenLinks = [];
    saveHiddenLinks();
    renderLinks();
  }

  function openAddModal() {
    var overlay = document.querySelector('.add-modal-overlay');
    if (!overlay) createAddModal();
    overlay = document.querySelector('.add-modal-overlay');
    if (overlay) overlay.classList.add('show');
  }

  function closeAddModal() {
    var overlay = document.querySelector('.add-modal-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  function createAddModal() {
    var overlay = document.createElement('div');
    overlay.className = 'add-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'add-modal';
    modal.innerHTML =
      '<div class="am-title">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
        'ADD SHORTCUT' +
      '</div>' +
      '<div class="am-field">' +
        '<label class="am-label">Name</label>' +
        '<input type="text" class="am-input" id="addName" placeholder="e.g. My Blog"/>' +
      '</div>' +
      '<div class="am-field">' +
        '<label class="am-label">URL</label>' +
        '<input type="text" class="am-input" id="addUrl" placeholder="https://example.com"/>' +
      '</div>' +
      '<div class="am-actions">' +
        '<button type="button" class="am-btn am-btn-cancel" id="addCancel">Cancel</button>' +
        '<button type="button" class="am-btn am-btn-save" id="addSave">Save Link</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeAddModal();
    });

    var cancelBtn = overlay.querySelector('#addCancel');
    var saveBtn = overlay.querySelector('#addSave');
    var nameInput = overlay.querySelector('#addName');
    var urlInput = overlay.querySelector('#addUrl');

    if (cancelBtn) cancelBtn.addEventListener('click', closeAddModal);

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var name = (nameInput.value || '').trim();
        var url = (urlInput.value || '').trim();

        if (!name || !url) return;

        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }

        var domain = getDomain(url);
        var colors = ['g', 'c', 'a', 'm'];
        var color = colors[customLinks.length % colors.length];

        var newLink = {
          name: name,
          url: url,
          icon: name.charAt(0).toUpperCase(),
          color: color
        };

        customLinks.push(newLink);
        saveCustomLinks();
        renderLinks();
        closeAddModal();
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var saveBtn2 = overlay.querySelector('#addSave');
          if (saveBtn2) saveBtn2.click();
        }
      });
    }
  }

  function initQuote() {
    var textEl = $('quoteText');
    if (!textEl) return;

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://v1.hitokoto.cn/?encode=json&lang=cn', true);
      xhr.timeout = 5000;

      xhr.onload = function () {
        if (xhr.status !== 200) { textEl.textContent = 'the universe speaks in silence.'; return; }
        try {
          var data = JSON.parse(xhr.responseText);
          textEl.textContent = data.hitokoto || 'the universe speaks in silence.';
        } catch (e) { textEl.textContent = 'the universe speaks in silence.'; }
      };
      xhr.onerror = function () { textEl.textContent = 'the universe speaks in silence.'; };
      xhr.ontimeout = function () { textEl.textContent = 'the universe speaks in silence.'; };
      xhr.send();
    } catch (e) { textEl.textContent = 'the universe speaks in silence.'; }
  }

  /**
   * 缓存天气用的经纬度。
   * city 传空时不会把缓存里已有的城市名冲掉——浏览器定位本身得不到城市名，
   * 若直接覆盖，用户手动设过的城市会在下一次刷新后丢失。
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @param {string} [city] - 城市名，可选；手动设置城市时写入，定位得到时留空
   * @returns {void}
   */
  function saveWeatherLoc(lat, lon, city) {
    try {
      if (!city) {
        var prev = loadWeatherLoc();
        city = prev && prev.city ? prev.city : '';
      }
      localStorage.setItem('geek_weather_loc', JSON.stringify({
        lat: lat, lon: lon, city: city, ts: Date.now()
      }));
    } catch (e) {}
  }

  /**
   * 读取缓存的经纬度，取不到或数据损坏时返回 null。
   * @returns {?{lat: number, lon: number, city: string, ts: number}} 缓存的定位信息，无缓存时为 null
   */
  function loadWeatherLoc() {
    try {
      var raw = localStorage.getItem('geek_weather_loc');
      if (raw) {
        var data = JSON.parse(raw);
        if (data && typeof data.lat === 'number' && typeof data.lon === 'number') return data;
      }
    } catch (e) {}
    return null;
  }

  /**
   * 把城市名解析成经纬度。这是定位失败时的兜底方案，不依赖任何浏览器权限。
   * @param {string} name - 城市名，支持中文，例如「北京」「Tokyo」
   * @param {function} cb - 回调 (err, place) => void；成功时 place 为 {lat, lon, city}，失败时 err 为 Error
   * @returns {void}
   */
  function geocodeCity(name, cb) {
    var url = 'https://geocoding-api.open-meteo.com/v1/search'
      + '?name=' + encodeURIComponent(name)
      + '&count=1&language=zh&format=json';

    var xhr = new XMLHttpRequest();
    try { xhr.open('GET', url, true); } catch (e) { cb(e); return; }
    xhr.timeout = 8000;

    xhr.onload = function () {
      if (xhr.status !== 200) { cb(new Error('服务返回 ' + xhr.status)); return; }
      var data;
      try { data = JSON.parse(xhr.responseText); } catch (e) { cb(e); return; }

      if (!data.results || !data.results.length) {
        cb(new Error('找不到「' + name + '」，换个写法试试'));
        return;
      }

      var r = data.results[0];
      // 行政区名和城市名相同时只显示一次，避免出现「北京, 北京」
      var label = r.admin1 && r.admin1 !== r.name ? r.name + ', ' + r.admin1 : r.name;
      cb(null, { lat: r.latitude, lon: r.longitude, city: label });
    };
    xhr.onerror = function () { cb(new Error('网络请求失败')); };
    xhr.ontimeout = function () { cb(new Error('请求超时')); };
    try { xhr.send(); } catch (e) { cb(e); }
  }

  /**
   * 反向地理编码：把经纬度反查成城市名。浏览器定位只返回经纬度、不带地名，
   * 所以定位成功后需要再调一次这个接口。查不到不影响天气显示，静默失败即可。
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @param {function} cb - 回调 (err, name) => void；成功时 name 是城市名，取不到时为 ''
   * @returns {void}
   */
  function reverseGeocode(lat, lon, cb) {
    var url = 'https://api.bigdatacloud.net/data/reverse-geocode-client'
      + '?latitude=' + lat
      + '&longitude=' + lon
      + '&localityLanguage=zh';

    var xhr = new XMLHttpRequest();
    try { xhr.open('GET', url, true); } catch (e) { cb(e); return; }
    xhr.timeout = 8000;

    xhr.onload = function () {
      if (xhr.status !== 200) { cb(new Error('服务返回 ' + xhr.status)); return; }
      try {
        var data = JSON.parse(xhr.responseText);
        // 逐级兜底：城市 → 一级行政区 → 本地化名称
        var name = data.city || data.principalSubdivision || data.locality || '';
        cb(null, name);
      } catch (e) { cb(e); }
    };
    xhr.onerror = function () { cb(new Error('网络请求失败')); };
    xhr.ontimeout = function () { cb(new Error('请求超时')); };
    try { xhr.send(); } catch (e) { cb(e); }
  }

  /**
   * 拼接天气区域的文案。有城市名时在末尾追加「· 城市」，例如
   * `24°C / Clear / 47% · 北京市`。
   * @param {number} temp - 温度（四舍五入后的整数）
   * @param {string} wname - 天气现象英文名
   * @param {number} humid - 相对湿度百分比
   * @param {string} [city] - 城市名，可选
   * @returns {void}
   */
  function renderWeatherText(temp, wname, humid, city) {
    var text = temp + '°C / ' + wname + ' / ' + humid + '%';
    if (city) text += ' · ' + city;
    setWeatherText(text);
  }

  /**
   * 定位成功后补查城市名：天气先显示出来，城市名查到了再追加，并写进缓存。
   * 这样下次开新标签页直接就有城市名，不用重复请求。
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {void}
   */
  function resolveCityName(lat, lon) {
    reverseGeocode(lat, lon, function (err, name) {
      if (err || !name) return;

      // 请求飞行途中用户可能已关闭天气、或已经手动改了城市，过期结果直接丢弃
      var saved = loadWeatherLoc();
      if (!weatherEnabled) return;
      if (!saved || Math.abs(saved.lat - lat) > 0.001 || Math.abs(saved.lon - lon) > 0.001) return;

      saveWeatherLoc(lat, lon, name);

      // 只有当前确实显示着天气时才追加，避免把城市名拼到「loading...」这类文案后面。
      // 这里判断的是"含不含温度符号"，不能写成 === 0：温度可能是 24°C，符号在第 3 位。
      var el = $('weatherText');
      if (!el) return;
      var txt = el.textContent;
      if (!txt || txt.indexOf('°C') === -1 || txt.indexOf('·') !== -1) return;
      el.textContent = txt + ' · ' + name;
    });
  }

  /**
   * 按经纬度请求实时天气，并把结果缓存下来供下次使用。
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @param {string} [city] - 城市名，可选；没有时会在天气显示后后台反查一次
   * @returns {void}
   */
  function fetchWeatherByCoords(lat, lon, city) {
    var el = $('weatherInfo');
    if (!el || !weatherEnabled) return;

    setWeatherText('loading...');
    el.style.cursor = 'wait';

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;

    xhr.onload = function () {
      el.style.cursor = 'pointer';
      // 请求飞行途中用户可能已把天气关掉，此时丢弃结果，避免"关了又冒出来"
      if (!weatherEnabled) return;
      if (xhr.status !== 200) {
        setWeatherText('retry >>');
        return;
      }

      try {
        var data = JSON.parse(xhr.responseText);
        var cur = data.current;
        if (!cur) {
          setWeatherText('retry >>');
          return;
        }

        var temp = Math.round(cur.temperature_2m);
        var humid = cur.relative_humidity_2m;
        var code = cur.weather_code;

        var weatherNames = {
          0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
          45: 'Foggy', 48: 'Depositing rime fog',
          51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
          61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
          71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
          80: 'Slight showers', 81: 'Moderate showers', 85: 'Violent showers',
          95: 'Thunderstorm'
        };

        var wname = weatherNames[code] || 'Unknown';
        renderWeatherText(temp, wname, humid, city);
        // 拿到天气才算这次定位真的可用，同时把城市名一起存下来
        saveWeatherLoc(lat, lon, city);
        // 浏览器定位拿不到地名，这里后台补一次，查到后会自动追加到界面上
        if (!city) resolveCityName(lat, lon);
      } catch (e) {
        setWeatherText('retry >>');
      }
    };

    xhr.onerror = function () {
      el.style.cursor = 'pointer';
      if (!weatherEnabled) return;
      setWeatherText('retry >>');
    };
    xhr.ontimeout = function () {
      el.style.cursor = 'pointer';
      if (!weatherEnabled) return;
      setWeatherText('retry >>');
    };
    xhr.send();
  }

  /**
   * 写入天气区域的文字内容。
   * 天气区域现在是「文字 + 关闭按钮」的复合结构，不能再直接给外层元素赋 textContent
   * （那样会把里面的关闭按钮一起抹掉），所以统一通过这个函数改内部文字节点。
   * @param {string} text - 要显示的文字
   * @returns {void}
   */
  function setWeatherText(text) {
    var el = $('weatherText');
    if (el) el.textContent = text;
  }

  /**
   * 读取天气开关偏好，未设置过时默认开启。
   * @returns {boolean} 当前偏好下的天气开关状态
   */
  function loadWeatherPref() {
    try {
      var raw = localStorage.getItem('geek_newtab_weather');
      if (raw !== null) weatherEnabled = raw === '1';
    } catch (e) {}
    return weatherEnabled;
  }

  /**
   * 把天气开关状态写入 localStorage。
   * @returns {void}
   */
  function saveWeatherPref() {
    try { localStorage.setItem('geek_newtab_weather', weatherEnabled ? '1' : '0'); } catch (e) {}
  }

  /**
   * 设置天气开关状态：关闭时置灰并显示 weather off；开启时按缓存坐标立即刷新一次天气，
   * 没有缓存坐标则提示用户点击授权定位。
   * @param {boolean} enabled - true 开启天气，false 关闭
   * @returns {void}
   */
  function setWeather(enabled) {
    weatherEnabled = !!enabled;
    saveWeatherPref();

    var el = $('weatherInfo');
    if (!el) return;
    el.classList.toggle('off', !weatherEnabled);

    if (!weatherEnabled) {
      setWeatherText('weather off');
      el.title = '点击开启天气显示';
      return;
    }

    el.title = '点击刷新天气';
    var saved = loadWeatherLoc();
    if (saved) {
      userLat = saved.lat;
      userLon = saved.lon;
      fetchWeatherByCoords(userLat, userLon, saved.city);
    } else {
      setWeatherText('click >>');
    }
  }

  /**
   * 关闭城市设置弹窗。
   * @returns {void}
   */
  function closeCityModal() {
    var overlay = document.querySelector('.city-modal-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  /**
   * 创建城市设置弹窗。DOM 只在第一次调用时构建，之后复用同一个节点。
   * @returns {void}
   */
  function createCityModal() {
    var overlay = document.createElement('div');
    overlay.className = 'city-modal-overlay';

    var modal = document.createElement('div');
    modal.className = 'add-modal';
    modal.innerHTML =
      '<div class="am-title">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
        'SET CITY' +
      '</div>' +
      '<div class="am-hint">浏览器定位不可用时，可直接用城市名查询，支持中文。</div>' +
      '<div class="am-field">' +
        '<label class="am-label">City</label>' +
        '<input type="text" class="am-input" id="cityInput" placeholder="e.g. 北京" autocomplete="off" spellcheck="false"/>' +
      '</div>' +
      '<div class="am-err" id="cityErr"></div>' +
      '<div class="am-actions">' +
        '<button type="button" class="am-btn am-btn-cancel" id="cityCancel">Cancel</button>' +
        '<button type="button" class="am-btn am-btn-save" id="citySave">查询</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var input = modal.querySelector('#cityInput');
    var errEl = modal.querySelector('#cityErr');
    var saveBtn = modal.querySelector('#citySave');
    var cancelBtn = modal.querySelector('#cityCancel');

    // 点击遮罩空白处关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCityModal();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', closeCityModal);

    /**
     * 提交城市名：查坐标 → 写入缓存 → 拉天气 → 关闭弹窗。
     * @returns {void}
     */
    function submit() {
      var name = (input.value || '').trim();
      if (!name) {
        errEl.textContent = '请先输入城市名';
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = '查询中...';
      errEl.textContent = '';

      geocodeCity(name, function (err, place) {
        saveBtn.disabled = false;
        saveBtn.textContent = '查询';

        if (err) {
          errEl.textContent = err.message;
          return;
        }

        saveWeatherLoc(place.lat, place.lon, place.city);
        geoFailed = false;

        // 手动设城市即视为开启天气
        weatherEnabled = true;
        saveWeatherPref();
        var box = $('weatherInfo');
        if (box) box.classList.remove('off');

        closeCityModal();
        fetchWeatherByCoords(place.lat, place.lon, place.city);
      });
    }

    if (saveBtn) saveBtn.addEventListener('click', submit);

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    }
  }

  /**
   * 打开城市设置弹窗（定位失败时的兜底入口）。
   * @returns {void}
   */
  function openCityModal() {
    var overlay = document.querySelector('.city-modal-overlay');
    if (!overlay) createCityModal();

    overlay = document.querySelector('.city-modal-overlay');
    if (!overlay) return;

    overlay.classList.add('show');
    var input = overlay.querySelector('#cityInput');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  /**
   * 天气区域点击处理，优先级依次为：
   * 1) 天气是关闭的 → 重新开启
   * 2) 已有缓存坐标 → 直接刷新天气
   * 3) 本页定位已失败过 → 直接弹城市设置框，不再重复请求定位
   * 4) 其余情况 → 请求浏览器定位，失败则提示并引导手动填城市
   * @returns {void}
   */
  function handleWeatherClick() {
    if (!weatherEnabled) {
      setWeather(true);
      return;
    }

    var saved = loadWeatherLoc();
    if (saved) {
      userLat = saved.lat;
      userLon = saved.lon;
      fetchWeatherByCoords(userLat, userLon, saved.city);
      return;
    }

    if (geoFailed) {
      openCityModal();
      return;
    }

    var el = $('weatherInfo');
    if (!el) return;

    if (!navigator.geolocation) {
      geoFailed = true;
      setWeatherText('set city >>');
      el.title = '点击手动设置城市';
      return;
    }

    setWeatherText('locating...');
    el.style.cursor = 'wait';

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        el.style.cursor = 'pointer';
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        geoFailed = false;
        fetchWeatherByCoords(userLat, userLon);
      },
      function (err) {
        el.style.cursor = 'pointer';
        // 定位走不通（被拒 / 拿不到 / 超时）统一降级成手动填城市，
        // 下一次点击天气就直接弹框，不再让用户干等
        geoFailed = true;
        setWeatherText('set city >>');
        el.title = '定位不可用，点击手动设置城市';
        el.setAttribute('data-geo-error', String(err.code));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  /**
   * 初始化天气组件：读取开关偏好、绑定三个交互入口，并按状态决定首次是否请求天气。
   * @returns {void}
   */
  function initWeather() {
    var el = $('weatherInfo');
    if (!el) return;

    loadWeatherPref();
    el.addEventListener('click', handleWeatherClick);

    // 悬停时出现的两个小按钮：✎ 手动设城市、× 关闭天气。
    // 都阻止冒泡，否则会连带触发外层的刷新点击。
    var cityBtn = $('weatherCity');
    if (cityBtn) {
      cityBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openCityModal();
      });
    }

    var offBtn = $('weatherOff');
    if (offBtn) {
      offBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setWeather(false);
      });
    }

    if (!weatherEnabled) {
      el.classList.add('off');
      setWeatherText('weather off');
      el.title = '点击开启天气显示';
      return;
    }

    var saved = loadWeatherLoc();
    if (saved) {
      userLat = saved.lat;
      userLon = saved.lon;
      fetchWeatherByCoords(userLat, userLon, saved.city);
    } else {
      setWeatherText('click >>');
      el.title = '点击获取定位并显示天气';
    }
  }

  /**
   * 更新便签标题栏的字数统计。
   * @param {HTMLElement} area - 便签输入框
   * @param {HTMLElement} countEl - 显示字数的元素
   * @returns {void}
   */
  function updateNoteCount(area, countEl) {
    if (!area || !countEl) return;
    var n = area.value.length;
    countEl.textContent = n + ' 字';
  }

  /**
   * 初始化一块便签：读回上次写的内容、绑定输入自动保存、初始化字数统计。
   * 内容直接存 localStorage，关掉浏览器也不会丢。
   * @param {string} areaId - textarea 的元素 id
   * @param {string} countId - 字数统计的元素 id
   * @param {string} storageKey - localStorage 键名
   * @returns {void}
   */
  function initNote(areaId, countId, storageKey) {
    var area = $(areaId);
    if (!area) return;
    var countEl = $(countId);

    try { area.value = localStorage.getItem(storageKey) || ''; } catch (e) {}
    updateNoteCount(area, countEl);

    var timer = null;

    // 打字时防抖保存，避免每敲一个字都写一次 localStorage
    area.addEventListener('input', function () {
      updateNoteCount(area, countEl);
      clearTimeout(timer);
      timer = setTimeout(function () {
        try { localStorage.setItem(storageKey, area.value); } catch (e) {}
      }, 400);
    });

    // 失焦或关闭页面时立刻落盘，防止防抖窗口内的输入丢失
    function flush() {
      clearTimeout(timer);
      try { localStorage.setItem(storageKey, area.value); } catch (e) {}
    }
    area.addEventListener('blur', flush);
    window.addEventListener('beforeunload', flush);
  }

  /**
   * 绑定一块便签的折叠 / 展开，并记住折叠状态。
   * 折叠后便签只剩标题栏那一条，高度由内容决定；展开时恢复与终端窗口等高。
   * @param {string} sideId - 便签所在 aside 的元素 id
   * @param {string} btnId - 折叠按钮的元素 id
   * @param {string} storageKey - localStorage 键名，存 '1'（折叠）或 '0'（展开）
   * @returns {void}
   */
  function initNoteToggle(sideId, btnId, storageKey) {
    var side = $(sideId);
    var btn = $(btnId);
    if (!side || !btn) return;

    var note = side.querySelector('.note');
    if (!note) return;

    var collapsed = false;
    try { collapsed = localStorage.getItem(storageKey) === '1'; } catch (e) {}
    note.classList.toggle('collapsed', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      collapsed = !collapsed;
      note.classList.toggle('collapsed', collapsed);
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      btn.title = collapsed ? '展开便签' : '折叠便签';
      try { localStorage.setItem(storageKey, collapsed ? '1' : '0'); } catch (e) {}

      // 折叠时正在输入的便签要先落盘，否则展开回来会丢字
      var area = note.querySelector('.note-body');
      if (collapsed && area) {
        area.dispatchEvent(new Event('blur'));
      }
    });
  }

  function initUptime() {
    var el = $('uptime');
    if (!el) return;

    function update() {
      var diff = Date.now() - START_TIME;
      var sec = Math.floor(diff / 1000);
      var min = Math.floor(sec / 60);
      var hr = Math.floor(min / 60);
      var day = Math.floor(hr / 24);

      el.textContent =
        day + 'd ' +
        (hr % 24) + 'h ' +
        (min % 60) + 'm';
    }

    update();
    setInterval(update, 60000);
  }

  function initSysInfo() {
    var el = $('sysInfo');
    if (!el) return;

    try {
      var ua = navigator.userAgent;
      var os = 'unknown';

      if (ua.indexOf('Windows') !== -1) os = 'windows';
      else if (ua.indexOf('Mac') !== -1) os = 'macos';
      else if (ua.indexOf('Linux') !== -1) os = 'linux';
      else if (ua.indexOf('Android') !== -1) os = 'android';
      else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1) os = 'ios';

      el.textContent = os + ' // kernel ok';
    } catch (e) {
      el.textContent = 'system ready';
    }
  }

  loadCustomLinks();
  loadHiddenLinks();

  initNote('noteLeft', 'noteCountLeft', 'geek_note_left');
  initNote('noteRight', 'noteCountRight', 'geek_note_right');
  initNoteToggle('sideLeft', 'noteToggleLeft', 'geek_note_left_collapsed');
  initNoteToggle('sideRight', 'noteToggleRight', 'geek_note_right_collapsed');

  initMatrix();
  initClock();
  typeGreeting();
  initSearch();
  renderLinks();
  initQuote();
  initWeather();
  initUptime();
  initSysInfo();
})();
