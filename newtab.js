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

  function initMatrix() {
    var c = $('matrixBg');
    if (!c) return;
    var ctx = c.getContext('2d');
    var w, h, cols, drops;
    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFabcdef{}[]|/\\<>?;:\'"`~!@#$%^&*()_+-=';

    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
      cols = Math.floor(w / 16);
      drops = [];
      for (var i = 0; i < cols; i++) {
        drops[i] = Math.random() * -100;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.fillStyle = 'rgba(5,5,5,.06)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '14px monospace';

      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        var x = i * 16;
        var y = drops[i] * 16;

        var alpha = Math.max(0.05, 1 - (y / h));
        if (alpha > 0.6) {
          ctx.fillStyle = '#00ff41';
        } else if (alpha > 0.25) {
          ctx.fillStyle = '#00cc33';
        } else {
          ctx.fillStyle = '#006618';
        }

        ctx.fillText(ch, x, y);

        if (y > h && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += 0.4 + Math.random() * 0.8;
        }
      }

      requestAnimationFrame(draw);
    }

    draw();
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

  function saveWeatherLoc(lat, lon) {
    try { localStorage.setItem('geek_weather_loc', JSON.stringify({ lat: lat, lon: lon, ts: Date.now() })); } catch (e) {}
  }

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

  function fetchWeatherByCoords(lat, lon) {
    var el = $('weatherInfo');
    if (!el) return;

    el.textContent = 'loading...';
    el.style.cursor = 'wait';

    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;

    xhr.onload = function () {
      el.style.cursor = 'pointer';
      if (xhr.status !== 200) {
        el.textContent = 'retry >>';
        return;
      }

      try {
        var data = JSON.parse(xhr.responseText);
        var cur = data.current;
        if (!cur) {
          el.textContent = 'retry >>';
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
        el.textContent = temp + '°C / ' + wname + ' / ' + humid + '%';
        saveWeatherLoc(lat, lon);
      } catch (e) {
        el.textContent = 'retry >>';
      }
    };

    xhr.onerror = function () {
      el.style.cursor = 'pointer';
      el.textContent = 'retry >>';
    };
    xhr.ontimeout = function () {
      el.style.cursor = 'pointer';
      el.textContent = 'retry >>';
    };
    xhr.send();
  }

  function initWeather() {
    var el = $('weatherInfo');
    if (!el) return;

    var saved = loadWeatherLoc();
    if (saved) {
      userLat = saved.lat;
      userLon = saved.lon;
      fetchWeatherByCoords(userLat, userLon);
      return;
    }

    el.textContent = 'click >>';
    el.style.cursor = 'pointer';
    el.title = 'Click to get location & weather';

    el.addEventListener('click', function () {
      if (navigator.geolocation) {
        el.textContent = 'locating...';
        el.style.cursor = 'wait';

        navigator.geolocation.getCurrentPosition(
          function (pos) {
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;
            fetchWeatherByCoords(userLat, userLon);
          },
          function (err) {
            el.style.cursor = 'pointer';
            var msg = 'denied';
            if (err.code === 1) msg = 'denied';
            else if (err.code === 2) msg = 'unavailable';
            else if (err.code === 3) msg = 'timeout';
            el.textContent = msg + ' >>';
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        el.textContent = 'no geo >>';
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
