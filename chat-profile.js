/* Aichance chat profile: a gear button opens a settings panel where a user sets a
 * nickname + profile-pic URL (stored in localStorage). Avatars/nicknames ride along
 * in each message. Shared by homepage and community chat. Pure client-side.
 *
 * Per page:
 *   <script src="chat-profile.js"></script>
 *   sendMessage(): merge ChatProfile.get() into msgData
 *   renderMsg(): prepend ChatProfile.avatarImg(data.avatar); show data.nickname||userId
 */
(function () {
  'use strict';
  var NICK = 'fpai-chat-nick', AV = 'fpai-chat-avatar';

  function get() {
    return {
      nickname: (localStorage.getItem(NICK) || '').slice(0, 24),
      avatar: (localStorage.getItem(AV) || '').slice(0, 400)
    };
  }
  function escAttr(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function avatarImg(url) {
    if (!url || !/^https?:\/\//.test(url)) return '';
    return '<img class="chat-avatar" loading="lazy" src="' + escAttr(url) + '" alt="" onerror="this.style.display=\'none\'">';
  }

  // ---- image upload to the project's own Firebase Storage ----
  var FB = {
    apiKey: "AIzaSyD6ZVj5BcG3k5Yz855Gnqzl9OJfxw2e1rc",
    authDomain: "fpai-chat.firebaseapp.com",
    databaseURL: "https://fpai-chat-default-rtdb.firebaseio.com",
    projectId: "fpai-chat",
    storageBucket: "fpai-chat.firebasestorage.app",
    messagingSenderId: "578450557983",
    appId: "1:578450557983:web:c3da39cf03cb6b1eddd92a"
  };
  function uploadToStorage(file) {
    return Promise.all([
      import('https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js')
    ]).then(function (mods) {
      var appMod = mods[0], st = mods[1];
      var app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FB);
      var storage = st.getStorage(app);
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      var path = 'avatars/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      var r = st.ref(storage, path);
      return st.uploadBytes(r, file, { contentType: file.type }).then(function () { return st.getDownloadURL(r); });
    });
  }

  var modal = null;
  function buildModal() {
    if (modal) return;
    modal = document.createElement('div');
    modal.className = 'cp-overlay';
    modal.innerHTML =
      '<div class="cp-modal" role="dialog" aria-label="Chat settings">' +
      '<div class="cp-head">Chat settings</div>' +
      '<label class="cp-label">Nickname <span>(optional, shown instead of your ID)</span></label>' +
      '<input class="cp-input" id="cpNick" maxlength="24" placeholder="Optional nickname">' +
      '<label class="cp-label">Profile pic URL <span>(paste an image link)</span></label>' +
      '<input class="cp-input" id="cpAvatar" maxlength="400" placeholder="https://.../me.jpg">' +
      '<div class="cp-uprow"><button type="button" class="cp-upbtn" id="cpUpload">⬆ Upload image</button><span class="cp-upstatus" id="cpUpStatus"></span></div>' +
      '<input type="file" id="cpFile" accept="image/*" style="display:none">' +
      '<div class="cp-preview" id="cpPrev"></div>' +
      '<div class="cp-actions"><button class="cp-btn cp-cancel" id="cpCancel">Cancel</button><button class="cp-btn cp-save" id="cpSave">Save</button></div>' +
      '</div>';
    document.body.appendChild(modal);

    var nick = modal.querySelector('#cpNick');
    var av = modal.querySelector('#cpAvatar');
    var prev = modal.querySelector('#cpPrev');
    function refreshPrev() { prev.innerHTML = avatarImg(av.value.trim()) + '<span>' + (escAttr(nick.value.trim()) || 'Preview') + '</span>'; }
    av.addEventListener('input', refreshPrev);
    nick.addEventListener('input', refreshPrev);

    var fileInput = modal.querySelector('#cpFile');
    var upBtn = modal.querySelector('#cpUpload');
    var upStatus = modal.querySelector('#cpUpStatus');
    upBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) { upStatus.textContent = 'Image too large (max 3 MB)'; return; }
      upStatus.textContent = 'Uploading…'; upBtn.disabled = true;
      uploadToStorage(f).then(function (url) {
        av.value = url; refreshPrev(); upStatus.textContent = 'Uploaded ✓';
      }).catch(function (e) {
        console.warn('upload failed', e);
        upStatus.textContent = 'Upload failed — check Storage rules';
      }).then(function () { upBtn.disabled = false; fileInput.value = ''; });
    });
    modal.querySelector('#cpCancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelector('#cpSave').addEventListener('click', function () {
      localStorage.setItem(NICK, nick.value.trim().slice(0, 24));
      localStorage.setItem(AV, av.value.trim().slice(0, 400));
      closeModal();
    });
  }
  function openModal() {
    buildModal();
    var p = get();
    modal.querySelector('#cpNick').value = p.nickname;
    modal.querySelector('#cpAvatar').value = p.avatar;
    modal.querySelector('#cpPrev').innerHTML = avatarImg(p.avatar) + '<span>' + (escAttr(p.nickname) || 'Preview') + '</span>';
    modal.classList.add('open');
  }
  function closeModal() { if (modal) modal.classList.remove('open'); }

  function gearBtn() {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cp-gear';
    b.title = 'Chat settings (nickname & profile pic)';
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94a7.49 7.49 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.61.22L2.69 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.49 7.49 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.33.61.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.19.11.47.02.61-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>';
    b.addEventListener('click', openModal);
    return b;
  }

  function init() {
    // put a gear button in each chat input bar, before the send button
    [['#chatInput', '.chat-input-bar'], ['#homeChatInput', '.home-chat-input-bar']].forEach(function (pair) {
      var input = document.querySelector(pair[0]);
      if (!input) return;
      var bar = input.closest(pair[1]) || input.parentElement;
      if (!bar || bar.querySelector('.cp-gear')) return;
      var send = bar.querySelector('.chat-send, .home-chat-send, button');
      var g = gearBtn();
      if (send) bar.insertBefore(g, send); else bar.appendChild(g);
    });
  }

  var css = document.createElement('style');
  css.textContent =
    '.chat-avatar{width:22px;height:22px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;background:#2a2e36}' +
    '.cp-gear{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;flex:0 0 auto;border:none;border-radius:10px;background:#eef0f5;color:#555;cursor:pointer}' +
    '.cp-gear:hover{background:#e2e5ee;color:#222}' +
    '.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:10000}' +
    '.cp-overlay.open{display:flex}' +
    '.cp-modal{width:min(420px,92vw);background:#fff;border-radius:14px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.3)}' +
    '.cp-head{font-size:1.1rem;font-weight:700;margin-bottom:14px;color:#111}' +
    '.cp-label{display:block;font-size:.8rem;font-weight:600;color:#333;margin:12px 0 5px}' +
    '.cp-label span{font-weight:400;color:#888}' +
    '.cp-input{width:100%;padding:10px 12px;border:1px solid #d5d8e0;border-radius:9px;font:inherit;outline:none}' +
    '.cp-input:focus{border-color:#6C63FF}' +
    '.cp-uprow{display:flex;align-items:center;gap:10px;margin-top:8px}' +
    '.cp-upbtn{padding:7px 12px;border-radius:8px;border:1px dashed #b8bccb;background:#f6f7fb;color:#555;font:inherit;font-size:.82rem;cursor:pointer}' +
    '.cp-upbtn:hover{background:#eef0f7}.cp-upbtn:disabled{opacity:.6;cursor:default}' +
    '.cp-upstatus{font-size:.8rem;color:#888}' +
    '.cp-preview{display:flex;align-items:center;gap:8px;margin-top:14px;min-height:28px;color:#555;font-size:.9rem}' +
    '.cp-preview img{width:32px;height:32px;border-radius:50%;object-fit:cover}' +
    '.cp-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}' +
    '.cp-btn{padding:9px 18px;border-radius:9px;border:none;font:inherit;font-weight:600;cursor:pointer}' +
    '.cp-cancel{background:#eef0f5;color:#444}' +
    '.cp-save{background:#6C63FF;color:#fff}' +
    '.msg-reply-ref,.home-msg-reply-ref{cursor:pointer}' +
    '.msg-flash{animation:msgFlash 1.6s ease}' +
    '@keyframes msgFlash{0%,100%{background:transparent}25%{background:rgba(108,99,255,.22)}}';
  (document.head || document.documentElement).appendChild(css);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // clicking a reply quote jumps to (and flashes) the original message
  document.addEventListener('click', function (e) {
    var ref = e.target.closest && e.target.closest('.msg-reply-ref[data-jump], .home-msg-reply-ref[data-jump]');
    if (!ref) return;
    var id = ref.getAttribute('data-jump');
    if (!id) return;
    var sel = '[data-msg-id="' + ((window.CSS && CSS.escape) ? CSS.escape(id) : id) + '"]';
    var target = document.querySelector(sel);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('msg-flash');
    setTimeout(function () { target.classList.remove('msg-flash'); }, 1600);
  });

  window.ChatProfile = { get: get, avatarImg: avatarImg, open: openModal };
})();
