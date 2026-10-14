/* Aichance chat emoji: ":name:" shortcodes render as images, with a type-ahead
 * picker. Shared by the homepage and community chats. Loads emoji-list.txt lazily
 * (first time an attached input is focused) so it never slows initial page load.
 *
 * Usage per page:
 *   1) <script src="emoji-chat.js"></script>  (classic script, before the chat module)
 *   2) wrap rendered text:  EmojiChat.emojify(esc(text))
 *   Inputs #chatInput and #homeChatInput are auto-attached on DOMContentLoaded.
 */
(function () {
  'use strict';
  var IMG_BASE = 'https://user.uploads.dev/file/';
  var COLS = 6, MAX_RESULTS = 300;

  var names = [];            // insertion-ordered emoji names
  var urls = new Map();      // name -> url
  var lower = new Map();     // lowercased name -> canonical name (case-insensitive lookup)
  var loadPromise = null;

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch('/emoji-list.txt')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (text) {
        var linesArr = text.split('\n');
        for (var i = 0; i < linesArr.length; i++) {
          var line = linesArr[i];
          var eq = line.indexOf('=');
          if (eq === -1) continue;
          var name = line.slice(0, eq).trim();
          var file = line.slice(eq + 1).trim();
          if (!name || !file) continue;
          if (!/^https?:\/\//.test(file)) file = IMG_BASE + file;
          if (!urls.has(name)) { urls.set(name, file); names.push(name); lower.set(name.toLowerCase(), name); }
        }
        return urls.size;
      })
      .catch(function (e) { console.warn('emoji-list load failed', e); return 0; });
    return loadPromise;
  }

  function urlFor(name) {
    if (urls.has(name)) return urls.get(name);
    var c = lower.get(name.toLowerCase());
    return c ? urls.get(c) : null;
  }

  // Replace :name: in ALREADY-ESCAPED html with <img>. Colons survive esc(), so safe.
  function emojify(escapedHtml) {
    if (!escapedHtml) return escapedHtml;
    return escapedHtml.replace(/:([a-zA-Z0-9_+\-]{2,40}):/g, function (full, name) {
      var u = urlFor(name);
      // alt/title use the bare name (no colons) so re-running emojify can't double-wrap
      return u ? '<img class="chat-emo" loading="lazy" src="' + u + '" alt="' + name + '" title="' + name + '">' : full;
    });
  }

  function search(q) {
    q = q.toLowerCase();
    var starts = [], contains = [];
    for (var i = 0; i < names.length; i++) {
      var n = names[i], ln = n.toLowerCase();
      if (ln.indexOf(q) === 0) { if (starts.push(n) >= MAX_RESULTS) break; }
      else if (contains.length < MAX_RESULTS && ln.indexOf(q) !== -1) contains.push(n);
    }
    return starts.concat(contains).slice(0, MAX_RESULTS);
  }

  function escHtml(s) { return s.replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  var menu = null;
  function ensureMenu() {
    if (menu) return menu;
    menu = document.createElement('div');
    menu.className = 'emoji-menu';
    menu.setAttribute('role', 'listbox');
    document.body.appendChild(menu);
    return menu;
  }

  function attach(input) {
    if (!input || input._emojiAttached) return;
    input._emojiAttached = true;
    var items = [], activeIdx = 0, matchStart = -1;

    input.addEventListener('focus', load, { once: true });

    function close() { if (menu) menu.classList.remove('open'); items = []; matchStart = -1; }

    function position() {
      var r = input.getBoundingClientRect();
      menu.style.left = r.left + 'px';
      menu.style.width = r.width + 'px';
      var top = r.top - menu.offsetHeight - 6;
      if (top < 8) top = 8;
      menu.style.top = top + 'px';
    }

    function render(q) {
      ensureMenu();
      menu.innerHTML = '<div class="emoji-menu-title">Emoji matching :' + escHtml(q) + '</div><div class="emoji-grid">' +
        items.map(function (n, i) {
          return '<div class="emoji-item' + (i === activeIdx ? ' active' : '') + '" data-i="' + i + '" title=":' + escHtml(n) + ':">' +
            '<img loading="lazy" src="' + urls.get(n) + '" alt=""><span class="emoji-name">' + escHtml(n) + '</span></div>';
        }).join('') + '</div>';
      menu.classList.add('open');
      menu._pick = pick;
      position();
    }

    function onInput() {
      if (!urls.size) { load().then(function () { onInput(); }); }
      var pos = input.selectionStart;
      var before = input.value.slice(0, pos);
      var m = before.match(/(?:^|\s):([a-zA-Z0-9_+\-]{0,30})$/);
      if (!m || urls.size === 0) { close(); return; }
      items = search(m[1]);
      if (!items.length) { close(); return; }
      matchStart = pos - m[1].length - 1; // index of the ":"
      activeIdx = 0;
      render(m[1]);
    }

    function pick(i) {
      var name = items[i];
      if (name == null) return;
      var pos = input.selectionStart;
      input.value = input.value.slice(0, matchStart) + ':' + name + ': ' + input.value.slice(pos);
      var caret = matchStart + name.length + 3;
      input.setSelectionRange(caret, caret);
      input.focus();
      close();
    }

    function updateActive() {
      var els = menu.querySelectorAll('.emoji-item');
      for (var i = 0; i < els.length; i++) els[i].classList.toggle('active', i === activeIdx);
    }

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function (e) {
      if (!menu || !menu.classList.contains('open')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); activeIdx = (activeIdx + 1) % items.length; updateActive(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); activeIdx = (activeIdx - 1 + items.length) % items.length; updateActive(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + COLS) % items.length; updateActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - COLS + items.length) % items.length; updateActive(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(activeIdx); }
      else if (e.key === 'Escape') { close(); }
    }, true);
    input.addEventListener('blur', function () { setTimeout(close, 150); });
  }

  // delegate clicks on the (single, body-level) menu
  document.addEventListener('mousedown', function (e) {
    if (!menu) return;
    var el = e.target.closest && e.target.closest('.emoji-item');
    if (el && menu.contains(el) && menu._pick) {
      e.preventDefault();
      menu._pick(+el.dataset.i);
    }
  });

  // styles
  var css = document.createElement('style');
  css.textContent =
    '.chat-emo{width:28px;height:28px;object-fit:contain;vertical-align:middle;margin:0 2px;display:inline-block}' +
    '.msg-text,.home-msg-text{line-height:1.4}' +
    '.msg-reply-ref .chat-emo,.home-msg-reply-ref .chat-emo{width:16px;height:16px;vertical-align:-3px}' +
    '.emoji-menu{position:fixed;display:none;z-index:9999;background:#23262d;border:1px solid #343842;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.45);overflow:hidden}' +
    '.emoji-menu.open{display:block}' +
    '.emoji-menu-title{padding:8px 12px 4px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a90a0}' +
    '.emoji-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:6px;max-height:340px;overflow-y:auto;overflow-x:hidden}' +
    '.emoji-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 2px 5px;cursor:pointer;border-radius:8px;color:#c9ced6}' +
    '.emoji-item img{width:30px;height:30px;object-fit:contain}' +
    '.emoji-item .emoji-name{font-size:9px;max-width:100%;text-align:center;word-break:break-all;line-height:1.2;color:#9aa0ab}' +
    '.emoji-item.active{background:#343a46;color:#fff}' +
    '.emo-pop{position:fixed;display:none;z-index:10001;background:#23262d;border:1px solid #343842;border-radius:12px;padding:12px;box-shadow:0 12px 34px rgba(0,0,0,.5);flex-direction:column;align-items:center;gap:7px}' +
    '.emo-pop.open{display:flex}' +
    '.emo-pop img{width:104px;height:104px;object-fit:contain}' +
    '.emo-pop code{font-size:12px;color:#c9ced6;background:#1a1d23;padding:3px 8px;border-radius:6px;user-select:all}';
  (document.head || document.documentElement).appendChild(css);

  // re-render :name: in already-displayed messages (they render before the list loads)
  function sweep() {
    var els = document.querySelectorAll('.msg-text, .home-msg-text');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.innerHTML.indexOf(':') !== -1) el.innerHTML = emojify(el.innerHTML);
    }
  }

  function autoAttach() {
    ['#chatInput', '#homeChatInput'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) attach(el);
    });
    // eager-load so messages show images on page load, then fix any already rendered
    load().then(function () { sweep(); setTimeout(sweep, 1500); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoAttach);
  else autoAttach();

  // click an inline emoji in a message -> show enlarged preview + its :name:
  var emoPop = null;
  document.addEventListener('click', function (e) {
    var em = e.target.closest && e.target.closest('.chat-emo');
    if (em) {
      e.stopPropagation();
      if (!emoPop) { emoPop = document.createElement('div'); emoPop.className = 'emo-pop'; document.body.appendChild(emoPop); }
      var nm = em.getAttribute('alt') || em.getAttribute('title') || '';
      emoPop.innerHTML = '<img src="' + em.src + '" alt=""><code>:' + nm.replace(/[<>&]/g, '') + ':</code>';
      emoPop.classList.add('open');
      var r = em.getBoundingClientRect();
      emoPop.style.left = Math.min(Math.max(8, r.left - 40), window.innerWidth - emoPop.offsetWidth - 8) + 'px';
      var top = r.top - emoPop.offsetHeight - 8;
      emoPop.style.top = (top < 8 ? r.bottom + 8 : top) + 'px';
      return;
    }
    if (emoPop && !e.target.closest('.emo-pop')) emoPop.classList.remove('open');
  });

  window.EmojiChat = { emojify: emojify, attach: attach, load: load };
})();
