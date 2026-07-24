(function () {
  'use strict';

  // ── 1. Read config from this script tag's src params ──────────────────────
  var me = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var src    = me ? me.src : '';
  var params = new URLSearchParams(src.split('?')[1] || '');
  var ORIGIN  = src.split('/dialer-embed.js')[0];
  var DIALER_ID = params.get('id')       || '';
  var USERID    = params.get('userid')   || '';
  var EXT       = params.get('ext')      || '';
  var PHONE     = params.get('phone')    || '';

  // Don't load if no dialer id or both userid/ext are template tags (un-replaced)
  var isTemplate = function(v) { return !v || !v.trim() || v === 'undefined' || v === 'null' || v.includes('{{') || v.includes('}}'); };
  if (!DIALER_ID || (isTemplate(USERID) && isTemplate(EXT))) return;

  var NS = '__3cxDialer__';
  if (window[NS]) return; // already loaded
  window[NS] = true;

  // ── 2. Inject Google Font + intl-tel-input CSS ───────────────────────────
  function injectCSS(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
  injectCSS('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  injectCSS('https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/css/intlTelInput.css');

  // ── 3. Inject widget CSS ──────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '#_3cx_fab{display:none;position:fixed;bottom:20px;right:20px;height:38px;padding:0 14px;border-radius:19px;',
    'background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;align-items:center;',
    'gap:7px;font-size:12px;font-weight:600;font-family:Inter,sans-serif;border:none;outline:none;',
    'cursor:grab;user-select:none;box-shadow:0 4px 14px rgba(37,99,235,.45);z-index:2147483646;',
    'transition:box-shadow .2s;}',
    '#_3cx_fab:hover{box-shadow:0 6px 18px rgba(37,99,235,.55);}',
    '#_3cx_fab:active{cursor:grabbing;}',
    '#_3cx_fab svg{width:16px;height:16px;}',

    '#_3cx_popup{display:none;position:fixed;bottom:66px;right:20px;width:220px;height:380px;',
    'background:#fff;border-radius:18px;box-shadow:0 12px 48px rgba(0,0,0,.18);',
    'flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.07);',
    'z-index:2147483645;opacity:0;transform:translateY(10px) scale(.96);pointer-events:none;',
    'transition:opacity .22s ease,transform .22s cubic-bezier(.16,1,.3,1);font-family:Inter,sans-serif;}',
    '#_3cx_popup._3cx_active{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',

    '._3cx_tabs{display:flex;background:linear-gradient(135deg,#1e40af,#2563eb);padding:0 4px;}',
    '._3cx_tab{flex:1;padding:11px 0;text-align:center;font-size:12px;font-weight:600;',
    'color:rgba(255,255,255,.6);cursor:pointer;border-bottom:2px solid transparent;transition:all .18s;}',
    '._3cx_tab._3cx_tab_active{color:#fff;border-bottom-color:#fff;}',
    '._3cx_close{background:transparent;border:none;color:rgba(255,255,255,0.6);font-size:14px;font-weight:500;padding:0 10px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color 0.15s;}',
    '._3cx_close:hover{color:#fff;}',

    '._3cx_tc{display:none;flex:1;flex-direction:column;position:relative;}',
    '._3cx_tc._3cx_tc_active{display:flex;}',
    '#_3cx_tab_dialer{overflow:hidden;}',
    '#_3cx_tab_history{overflow-y:auto;max-height:340px;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,0.15) transparent;}',
    '#_3cx_tab_history::-webkit-scrollbar{width:4px;}',
    '#_3cx_tab_history::-webkit-scrollbar-track{background:transparent;}',
    '#_3cx_tab_history::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:4px;}',
    '#_3cx_tab_history::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,0.3);}',

    '._3cx_status{display:flex;align-items:center;justify-content:center;gap:5px;',
    'padding:8px 0 4px;font-size:11px;font-weight:500;color:#6b7280;}',
    '._3cx_dot{width:7px;height:7px;border-radius:50%;background:#22c55e;',
    'box-shadow:0 0 0 2px rgba(34,197,94,.25);animation:_3cx_blink 2s infinite;}',
    '@keyframes _3cx_blink{0%,100%{opacity:1}50%{opacity:.5}}',

    '._3cx_dc{flex:1;padding:8px 14px 12px;display:flex;flex-direction:column;}',
    '._3cx_iw{margin-bottom:10px;width:100%;}',
    '._3cx_iw .iti{width:100%;}',
    '._3cx_iw .iti__selected-flag{padding:0 2px 0 4px!important;}',
    '._3cx_iw .iti__selected-dial-code{font-size:11px!important;font-weight:600!important;margin-left:2px!important;}',
    '._3cx_iw .iti__flag{transform:scale(.75);}',
    '._3cx_iw .iti__country-list{border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);border:1px solid #e5e7eb;font-size:13px;}',
    '._3cx_iw .iti__arrow{border-top-width:3px!important;margin-left:1px!important;}',
    '#_3cx_phone{width:100%;font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;border:none;',
    'border-bottom:1.5px solid #e5e7eb;padding:4px 4px 4px 62px;color:#111827;outline:none;',
    'background:transparent;transition:border-color .18s;letter-spacing:.5px;}',
    '#_3cx_phone:focus{border-bottom-color:#2563eb;}',
    '#_3cx_phone::placeholder{color:#d1d5db;font-weight:400;}',

    '._3cx_kp{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;}',
    '._3cx_key{background:#f3f4f6;border:none;border-radius:10px;height:42px;display:flex;',
    'flex-direction:column;align-items:center;justify-content:center;cursor:pointer;',
    'transition:background .1s,transform .1s;user-select:none;}',
    '._3cx_key:hover{background:#e5e7eb;}',
    '._3cx_key:active{transform:scale(.92);background:#d1d5db;}',
    '._3cx_kn{font-size:17px;font-weight:700;color:#111827;line-height:1;}',
    '._3cx_kl{font-size:8px;font-weight:600;color:#6b7280;letter-spacing:1.2px;margin-top:1px;height:9px;}',

    '._3cx_ar{display:flex;justify-content:center;align-items:center;gap:16px;}',
    '._3cx_sp{width:36px;}',
    '#_3cx_call{width:46px;height:46px;border-radius:50%;border:none;',
    'background:linear-gradient(145deg,#22c55e,#16a34a);color:#fff;display:flex;',
    'align-items:center;justify-content:center;cursor:pointer;',
    'box-shadow:0 4px 14px rgba(34,197,94,.4);transition:transform .15s,box-shadow .15s;}',
    '#_3cx_call:hover{transform:scale(1.07);box-shadow:0 6px 18px rgba(34,197,94,.5);}',
    '#_3cx_call:active{transform:scale(.94);}',
    '#_3cx_call.disabled{opacity:.4;pointer-events:none;}',
    '#_3cx_call svg{width:20px;height:20px;fill:currentColor;}',
    '#_3cx_del{background:#f3f4f6;border:none;border-radius:50%;width:36px;height:36px;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;',
    'transition:background .15s,color .15s;}',
    '#_3cx_del:hover{background:#e5e7eb;color:#111827;}',
    '#_3cx_del svg{width:16px;height:16px;}',

    '#_3cx_overlay{position:absolute;inset:0;background:linear-gradient(160deg,#eff6ff,#fff 60%);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'opacity:0;pointer-events:none;transition:opacity .28s;z-index:10;}',
    '#_3cx_overlay._3cx_active{opacity:1;pointer-events:all;}',
    '._3cx_pc{width:64px;height:64px;border-radius:50%;background:rgba(37,99,235,.1);',
    'display:flex;align-items:center;justify-content:center;margin-bottom:16px;',
    'animation:_3cx_pulse 2s infinite;}',
    '._3cx_pc svg{width:28px;height:28px;color:#2563eb;}',
    '._3cx_pc._3cx_conn{background:rgba(34,197,94,.12);animation:_3cx_pg 2s infinite;}',
    '._3cx_pc._3cx_conn svg{color:#22c55e;}',
    '@keyframes _3cx_pulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}',
    '@keyframes _3cx_pg{0%{box-shadow:0 0 0 0 rgba(34,197,94,.4)}70%{box-shadow:0 0 0 16px transparent}100%{box-shadow:0 0 0 0 transparent}}',
    '#_3cx_stitle{font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;}',
    '#_3cx_sdesc{font-size:11px;color:#6b7280;text-align:center;padding:0 20px;line-height:1.5;}',
    '#_3cx_timer{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;color:#22c55e;margin-top:10px;}',

    '._3cx_hl{list-style:none;padding:8px 10px;margin:0;display:flex;flex-direction:column;gap:8px;}',
    '._3cx_hi{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,0.03);transition:all .15s ease;}',
    '._3cx_hi:hover{border-color:#cbd5e1;box-shadow:0 3px 8px rgba(0,0,0,0.06);background:#f8fafc;}',
    '._3cx_hi_main{display:flex;align-items:center;justify-content:space-between;gap:8px;}',
    '._3cx_hin{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;}',
    '._3cx_hnum{font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '._3cx_hm{display:flex;align-items:center;gap:6px;font-size:10px;color:#64748b;}',
    '._3cx_hs{font-weight:600;font-size:9.5px;padding:2px 7px;border-radius:12px;display:inline-flex;align-items:center;line-height:1;}',
    '._3cx_hs._3cx_conn{background:#dcfce7;color:#15803d;}',
    '._3cx_hs._3cx_miss{background:#fee2e2;color:#b91c1c;}',
    '._3cx_actions{display:flex;align-items:center;gap:6px;flex-shrink:0;}',
    '._3cx_rd,._3cx_rec_btn{border:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s ease;}',
    '._3cx_rd{background:rgba(37,99,235,.08);color:#2563eb;}',
    '._3cx_rd:hover{background:#2563eb;color:#fff;transform:scale(1.06);}',
    '._3cx_rec_btn{background:rgba(124,58,237,.1);color:#7c3aed;}',
    '._3cx_rec_btn:hover{background:#7c3aed;color:#fff;transform:scale(1.06);}',
    '._3cx_rec_btn._3cx_playing{background:#7c3aed;color:#fff;box-shadow:0 0 0 3px rgba(124,58,237,.25);}',
    '._3cx_player_box{display:none;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;align-items:center;gap:8px;margin-top:2px;}',
    '._3cx_player_box._3cx_open{display:flex;}',
    '._3cx_player_toggle{background:#7c3aed;color:#fff;border:none;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s;}',
    '._3cx_player_toggle:hover{background:#6d28d9;}',
    '._3cx_player_toggle svg{width:11px;height:11px;fill:currentColor;}',
    '._3cx_player_track{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0;}',
    '._3cx_player_seek{width:100%;height:4px;border-radius:2px;accent-color:#7c3aed;cursor:pointer;margin:0;}',
    '._3cx_player_meta{display:flex;justify-content:space-between;font-size:9px;font-weight:600;color:#64748b;}',
    '._3cx_player_dl{color:#64748b;background:transparent;border:none;padding:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .15s;}',
    '._3cx_player_dl:hover{color:#0f172a;}',
    '._3cx_empty{padding:36px 20px;text-align:center;color:#6b7280;font-size:12px;}',
    '#_3cx_err{display:none;background:#fee2e2;color:#991b1b;padding:8px 12px;border-radius:8px;',
    'font-size:11px;text-align:center;margin-bottom:10px;font-weight:500;}',
  ].join('');
  document.head.appendChild(style);

  // ── 4. Inject HTML ────────────────────────────────────────────────────────
  var html = [
    '<div id="_3cx_popup">',
    '  <div class="_3cx_tabs">',
    '    <div class="_3cx_tab _3cx_tab_active" data-tab="dialer">Dialpad</div>',
    '    <div class="_3cx_tab" data-tab="history" id="_3cx_tab_hist_btn">History</div>',
    '    <button class="_3cx_close" id="_3cx_close_btn" title="Close">✕</button>',
    '  </div>',

    '  <div id="_3cx_tab_dialer" class="_3cx_tc _3cx_tc_active">',
    '    <div class="_3cx_dc">',
    '      <div id="_3cx_err"></div>',
    '      <div class="_3cx_status"><div class="_3cx_dot"></div><span id="_3cx_ext_txt">Loading...</span></div>',
    '      <div class="_3cx_iw"><input type="tel" id="_3cx_phone" placeholder="Phone number" autocomplete="off"/></div>',
    '      <div class="_3cx_kp">',
    '        <div class="_3cx_key" data-val="1"><span class="_3cx_kn">1</span><span class="_3cx_kl"></span></div>',
    '        <div class="_3cx_key" data-val="2"><span class="_3cx_kn">2</span><span class="_3cx_kl">ABC</span></div>',
    '        <div class="_3cx_key" data-val="3"><span class="_3cx_kn">3</span><span class="_3cx_kl">DEF</span></div>',
    '        <div class="_3cx_key" data-val="4"><span class="_3cx_kn">4</span><span class="_3cx_kl">GHI</span></div>',
    '        <div class="_3cx_key" data-val="5"><span class="_3cx_kn">5</span><span class="_3cx_kl">JKL</span></div>',
    '        <div class="_3cx_key" data-val="6"><span class="_3cx_kn">6</span><span class="_3cx_kl">MNO</span></div>',
    '        <div class="_3cx_key" data-val="7"><span class="_3cx_kn">7</span><span class="_3cx_kl">PQRS</span></div>',
    '        <div class="_3cx_key" data-val="8"><span class="_3cx_kn">8</span><span class="_3cx_kl">TUV</span></div>',
    '        <div class="_3cx_key" data-val="9"><span class="_3cx_kn">9</span><span class="_3cx_kl">WXYZ</span></div>',
    '        <div class="_3cx_key" data-val="*"><span class="_3cx_kn">*</span><span class="_3cx_kl"></span></div>',
    '        <div class="_3cx_key" data-val="0"><span class="_3cx_kn">0</span><span class="_3cx_kl">+</span></div>',
    '        <div class="_3cx_key" data-val="#"><span class="_3cx_kn">#</span><span class="_3cx_kl"></span></div>',
    '      </div>',
    '      <div class="_3cx_ar">',
    '        <div class="_3cx_sp"></div>',
    '        <button id="_3cx_call"><svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></button>',
    '        <button id="_3cx_del"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6H5a2 2 0 00-2 2v8a2 2 0 002 2h7l5-6-5-6z"/></svg></button>',
    '      </div>',
    '    </div>',
    '    <div id="_3cx_overlay">',
    '      <div class="_3cx_pc" id="_3cx_pc"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg></div>',
    '      <div id="_3cx_stitle">Connecting...</div>',
    '      <div id="_3cx_sdesc"></div>',
    '      <div id="_3cx_timer" style="display:none">00:00</div>',
    '      <button id="_3cx_hangup" style="margin-top:20px;width:46px;height:46px;border-radius:50%;border:none;background:linear-gradient(145deg,#ef4444,#dc2626);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 14px rgba(239,68,68,.4);">',
    '        <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)"/></svg>',
    '      </button>',
    '    </div>',
    '  </div>',

    '  <div id="_3cx_tab_history" class="_3cx_tc">',
    '    <ul class="_3cx_hl" id="_3cx_hist"><li class="_3cx_empty">Loading history...</li></ul>',
    '  </div>',
    '</div>',

    '<button id="_3cx_fab">',
    '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
    '    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>',
    '  </svg>',
    '  <span>Dialer</span>',
    '</button>',
  ].join('\n');

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  // ── 5. Load intl-tel-input JS then boot ──────────────────────────────────
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/intlTelInput.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js', function () {
      boot();
    });
  });

  // ── 6. Main boot logic ───────────────────────────────────────────────────
  function boot() {
    var fab       = document.getElementById('_3cx_fab');
    var popup     = document.getElementById('_3cx_popup');
    var input     = document.getElementById('_3cx_phone');
    var btnCall   = document.getElementById('_3cx_call');
    var btnDel    = document.getElementById('_3cx_del');
    var overlay   = document.getElementById('_3cx_overlay');
    var errBanner = document.getElementById('_3cx_err');

    // ── intl-tel-input ──────────────────────────────────────────────────────
    var iti = window.intlTelInput(input, {
      initialCountry: 'ae',
      preferredCountries: ['ae', 'sa', 'gb', 'us', 'in'],
      separateDialCode: true
    });

    // Filter out non-phone characters and auto-detect country as user types
    input.addEventListener('input', function () {
      input.value = input.value.replace(/[^\d\+\-\s\(\)\.]/g, '');
      var num = iti.getNumber();
      if (num && num.length > 4) {
        try { iti.setNumber(num); } catch (e) {}
      }
    });

    // ── Resolve extension via API ────────────────────────────────────────────
    var extension = '';
    var apiBase   = ORIGIN;

    function resolveAgent() {
      if (USERID && !isTemplate(USERID)) {
        return fetch(apiBase + '/api/dialer/resolve-agent?dialerId=' + DIALER_ID + '&userid=' + encodeURIComponent(USERID))
          .then(function(r){
            if (!r.ok) return null;
            return r.json();
          })
          .then(function(d){
            if (d && d.extension && !isTemplate(d.extension)) {
              extension = d.extension;
            } else {
              extension = '';
            }
          })
          .catch(function(){
            extension = '';
          });
      }
      if (EXT && !isTemplate(EXT)) {
        extension = EXT;
        return Promise.resolve();
      }
      extension = '';
      return Promise.resolve();
    }

    resolveAgent().then(function () {
      if (!extension || isTemplate(extension)) {
        fab.style.display   = 'none';
        popup.style.display = 'none';
        return;
      }
      fab.style.display   = 'flex';
      popup.style.display = 'flex';
      document.getElementById('_3cx_ext_txt').textContent = 'Agent Extension: ' + extension;

      // pre-fill phone
      if (PHONE && !isTemplate(PHONE)) {
        setTimeout(function(){ try { iti.setNumber(PHONE); } catch(e){} }, 400);
      }
    });

    // ── GHL Auto-detect: phone + contactId from page URL/DOM ──────────────────
    var ghlContactId = '';

    function extractGhlContactId() {
      // Matches: /contacts/detail/<id> anywhere in the URL
      var m = window.location.href.match(/\/contacts\/detail\/([A-Za-z0-9_-]+)/);
      return m ? m[1] : '';
    }

    function readGhlPhone() {
      // GoHighLevel renders the phone in: input[id="contact.phone"] or .hr-input-phone
      var el = document.querySelector('input[id="contact.phone"], input.hr-input-phone[type="tel"]');
      return el ? (el.value || '').trim() : '';
    }

    function applyGhlAutoDetect() {
      var newContactId = extractGhlContactId();
      if (newContactId) ghlContactId = newContactId;

      // Only auto-fill phone when on a contact detail page
      if (!newContactId) return;

      // Wait briefly for the SPA to render the input
      var attempts = 0;
      var tryFill = function () {
        var phone = readGhlPhone();
        if (phone) {
          try { iti.setNumber(phone); } catch (e) {}
          // Show a subtle "auto-filled" badge on FAB for 2s
          var fab = document.getElementById('_3cx_fab');
          if (fab) {
            var span = fab.querySelector('span');
            if (span) {
              var orig = span.textContent;
              span.textContent = 'Ready ✓';
              setTimeout(function () { span.textContent = orig; }, 2000);
            }
          }
        } else if (attempts < 20) {
          attempts++;
          setTimeout(tryFill, 250);
        }
      };
      tryFill();
    }

    // Run on load
    applyGhlAutoDetect();

    // Observe SPA navigation via URL polling (GHL uses History API)
    var _ghlLastHref = window.location.href;
    setInterval(function () {
      if (window.location.href !== _ghlLastHref) {
        _ghlLastHref = window.location.href;
        // Small delay to let SPA render the new page
        setTimeout(applyGhlAutoDetect, 600);
      }
    }, 500);

    // Also watch DOM for the phone input being added/changed (handles in-page re-renders)
    var _ghlObserver = new MutationObserver(function () {
      if (extractGhlContactId()) {
        var phone = readGhlPhone();
        if (phone) {
          var cur = '';
          try { cur = iti.getNumber(); } catch (e) {}
          if (!cur || cur.replace(/[^\d]/g, '').length < 4) {
            try { iti.setNumber(phone); } catch (e) {}
          }
        }
      }
    });
    _ghlObserver.observe(document.body, { childList: true, subtree: true });

    // ── Tabs ─────────────────────────────────────────────────────────────────
    var tabBtns = document.querySelectorAll('#_3cx_popup ._3cx_tab');
    var tabContents = document.querySelectorAll('#_3cx_popup ._3cx_tc');
    tabBtns.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.dataset.tab;
        tabBtns.forEach(function(t){ t.classList.remove('_3cx_tab_active'); });
        tabContents.forEach(function(tc){ tc.classList.remove('_3cx_tc_active'); });
        tab.classList.add('_3cx_tab_active');
        var tcEl = document.getElementById('_3cx_tab_' + target);
        if (tcEl) tcEl.classList.add('_3cx_tc_active');
        if (target === 'history') loadHistory();
      });
    });

    // ── Keypad Logic ─────────────────────────────────────────────────────────
    var pressTimer;
    var isLongPress = false;

    document.querySelectorAll('._3cx_key').forEach(function (key) {
      var handlePressStart = function () {
        if (!extension) return;
        isLongPress = false;
        var val = key.getAttribute('data-val');

        if (val === '0') {
          pressTimer = setTimeout(function () {
            isLongPress = true;
            input.value += '+';
            try { iti.setNumber(input.value); } catch (e) {}
            key.style.background = '#cbd5e1';
            setTimeout(function () { key.style.background = ''; }, 200);
          }, 600);
        }
      };

      var handlePressEnd = function () {
        if (!extension) return;
        var val = key.getAttribute('data-val');

        if (val === '0') {
          clearTimeout(pressTimer);
          if (!isLongPress) {
            input.value += val;
            try { iti.setNumber(input.value); } catch (e) {}
          }
        } else {
          input.value += val;
          try { iti.setNumber(input.value); } catch (e) {}
        }
      };

      key.addEventListener('mousedown', handlePressStart);
      key.addEventListener('mouseup', handlePressEnd);
      key.addEventListener('mouseleave', function () { clearTimeout(pressTimer); });

      key.addEventListener('touchstart', function (e) { e.preventDefault(); handlePressStart(); });
      key.addEventListener('touchend', function (e) { e.preventDefault(); handlePressEnd(); });
    });

    btnDel.addEventListener('click', function() {
      input.value = input.value.slice(0, -1);
    });

    // ── Call & Status Polling Logic ──────────────────────────────────────────
    var pollInterval;
    var callTimerInterval;
    var secondsElapsed = 0;

    function formatTime(s) {
      var m = Math.floor(s / 60).toString().padStart(2, '0');
      var sec = (s % 60).toString().padStart(2, '0');
      return m + ':' + sec;
    }

    btnCall.addEventListener('click', function() {
      if (btnCall.classList.contains('disabled')) return;
      var rawVal = input.value.trim();
      var cleanDigits = rawVal.replace(/[\s\-\+\(\)\.]/g, '');
      var destination = (iti && iti.getNumber) ? iti.getNumber() : cleanDigits;
      if (!rawVal || /[a-zA-Z]/.test(rawVal) || !/^\d{7,15}$/.test(cleanDigits) || (iti && iti.isValidNumber && !iti.isValidNumber())) {
        showErr('Please enter a valid phone number (7 to 15 digits).');
        return;
      }

      showOverlay('Calling...', 'Please answer your 3CX app or desk phone first.');

      fetch(apiBase + '/api/dialer/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialerId: DIALER_ID, extension: extension, destination: destination, pageUrl: window.location.href || document.referrer, contactId: ghlContactId || '' })
      })
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (d.error) {
          resetDialer();
          showErr(d.error);
          return;
        }

        // Start Polling
        var wasConnected = false;
        var idleCount = 0;

        pollInterval = setInterval(function () {
          fetch(apiBase + '/api/dialer/status?dialerId=' + DIALER_ID + '&extension=' + extension + '&destination=' + encodeURIComponent(destination) + '&duration=' + secondsElapsed + '&callId=' + (d.callId || ''))
            .then(function(r) { return r.json(); })
            .then(function(statusData) {
              if (statusData.state === 'connected') {
                idleCount = 0;
                if (!wasConnected) {
                  wasConnected = true;
                  document.getElementById('_3cx_pc').classList.add('_3cx_conn');
                  document.getElementById('_3cx_stitle').textContent = 'Call Connected';
                  document.getElementById('_3cx_sdesc').textContent = 'Conversation started.';
                  document.getElementById('_3cx_timer').style.display = 'block';
                  secondsElapsed = 0;
                  document.getElementById('_3cx_timer').textContent = '00:00';

                  clearInterval(callTimerInterval);
                  callTimerInterval = setInterval(function () {
                    secondsElapsed++;
                    document.getElementById('_3cx_timer').textContent = formatTime(secondsElapsed);
                  }, 1000);
                }
              } else if (statusData.state === 'idle') {
                idleCount++;
                if (wasConnected || idleCount >= 2) {
                  document.getElementById('_3cx_pc').classList.remove('_3cx_conn');
                  document.getElementById('_3cx_stitle').textContent = wasConnected ? 'Call Ended' : 'Call Ended / Cancelled';
                  document.getElementById('_3cx_sdesc').textContent = wasConnected ? ('Duration: ' + formatTime(secondsElapsed)) : 'The call did not connect.';
                  clearInterval(callTimerInterval);
                  clearInterval(pollInterval);

                  setTimeout(function () {
                    resetDialer();
                    if (document.querySelector('[data-tab="history"]').classList.contains('_3cx_tab_active')) {
                      histLoaded = false;
                      loadHistory();
                    }
                  }, 3000);
                }
              } else {
                idleCount = 0; // ringing state
              }
            })
            .catch(function () {});
        }, 2500);
      })
      .catch(function(e){ resetDialer(); showErr(e.message); });
    });

    document.getElementById('_3cx_hangup').addEventListener('click', function() {
      fetch(apiBase + '/api/dialer/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dialerId: DIALER_ID, extension: extension })
      }).finally(function(){
        resetDialer();
      });
    });

    function resetDialer() {
      clearInterval(pollInterval);
      clearInterval(callTimerInterval);
      overlay.classList.remove('_3cx_active');
      document.getElementById('_3cx_timer').style.display = 'none';
      document.getElementById('_3cx_pc').classList.remove('_3cx_conn');
      secondsElapsed = 0;
    }

    // ── Overlay helpers ──────────────────────────────────────────────────────
    function showOverlay(title, desc) {
      document.getElementById('_3cx_stitle').textContent = title;
      document.getElementById('_3cx_sdesc').textContent  = desc || '';
      overlay.classList.add('_3cx_active');
    }

    function showErr(msg) {
      errBanner.style.display = 'block';
      errBanner.textContent = msg;
      setTimeout(function(){ errBanner.style.display = 'none'; }, 5000);
    }

    // ── History & Audio Recording Player ───────────────────────────────────────
    var histLoaded = false;
    var activeAudio = null;
    var activeCallId = null;

    function stopActiveAudio() {
      if (activeAudio) {
        try { activeAudio.pause(); } catch(e){}
        activeAudio = null;
      }
      if (activeCallId) {
        var prevBox = document.getElementById('_3cx_pbox_' + activeCallId);
        var prevBtn = document.getElementById('_3cx_rbtn_' + activeCallId);
        if (prevBox) prevBox.classList.remove('_3cx_open');
        if (prevBtn) {
          prevBtn.classList.remove('_3cx_playing');
          prevBtn.setAttribute('title', 'Play Recording');
        }
        activeCallId = null;
      }
    }

    function loadHistory() {
      if (histLoaded) return;
      histLoaded = true;
      var list = document.getElementById('_3cx_hist');
      fetch(apiBase + '/api/dialer/history?dialerId=' + DIALER_ID + '&extension=' + extension)
        .then(function(r){ return r.json(); })
        .then(function(calls) {
          if (!calls.length) { list.innerHTML = '<li class="_3cx_empty">No recent calls</li>'; return; }
          list.innerHTML = calls.map(function(c) {
            var d = new Date(c.createdAt);
            var time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var isConnected = c.status === 'Completed' || c.status === 'Connected';
            var dur = c.duration_seconds ? formatTime(c.duration_seconds) : '';
            var hasRecording = !!(c.recording_token || c.recording_id);
            var recToken = c.recording_token;
            var listenUrl = recToken ? (apiBase + '/recordings/' + recToken + '/listen') : '';
            var downloadUrl = recToken ? (apiBase + '/recordings/' + recToken + '/download') : '';

            return '<li class="_3cx_hi" id="_3cx_hi_' + c.id + '">' +
              '<div class="_3cx_hi_main">' +
                '<div class="_3cx_hin">' +
                  '<span class="_3cx_hnum">' + (c.destination || '—') + '</span>' +
                  '<div class="_3cx_hm">' +
                    '<span class="_3cx_hs ' + (isConnected ? '_3cx_conn' : '_3cx_miss') + '">' + (isConnected ? 'Connected' : c.status) + '</span>' +
                    '<span>•</span>' +
                    '<span>' + time + '</span>' +
                    (dur ? '<span>• ' + dur + '</span>' : '') +
                  '</div>' +
                '</div>' +
                '<div class="_3cx_actions">' +
                  (hasRecording ?
                    '<button class="_3cx_rec_btn" id="_3cx_rbtn_' + c.id + '" data-id="' + c.id + '" data-url="' + listenUrl + '" data-dl="' + downloadUrl + '" title="Play Recording">' +
                      '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
                    '</button>' : '') +
                  '<button class="_3cx_rd" data-num="' + (c.destination||'') + '" title="Redial">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>' +
                  '</button>' +
                '</div>' +
              '</div>' +
              (hasRecording ?
                '<div class="_3cx_player_box" id="_3cx_pbox_' + c.id + '">' +
                  '<button class="_3cx_player_toggle" id="_3cx_ptog_' + c.id + '" title="Play/Pause">' +
                    '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
                  '</button>' +
                  '<div class="_3cx_player_track">' +
                    '<input type="range" class="_3cx_player_seek" id="_3cx_pseek_' + c.id + '" value="0" min="0" max="100"/>' +
                    '<div class="_3cx_player_meta">' +
                      '<span id="_3cx_ptime_' + c.id + '">00:00</span>' +
                      '<span id="_3cx_pdur_' + c.id + '">' + (dur || '00:00') + '</span>' +
                    '</div>' +
                  '</div>' +
                  '<a class="_3cx_player_dl" href="' + downloadUrl + '" target="_blank" download title="Download Recording">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>' +
                  '</a>' +
                '</div>' : '') +
            '</li>';
          }).join('');

          list.querySelectorAll('._3cx_rd').forEach(function(btn) {
            btn.addEventListener('click', function() {
              try { iti.setNumber(btn.dataset.num); } catch(e){}
              document.querySelector('[data-tab="dialer"]').click();
            });
          });

          list.querySelectorAll('._3cx_rec_btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var callId = btn.dataset.id;
              var url = btn.dataset.url;
              var box = document.getElementById('_3cx_pbox_' + callId);
              var seek = document.getElementById('_3cx_pseek_' + callId);
              var timeTxt = document.getElementById('_3cx_ptime_' + callId);
              var durTxt = document.getElementById('_3cx_pdur_' + callId);
              var togBtn = document.getElementById('_3cx_ptog_' + callId);

              if (activeCallId === callId && activeAudio) {
                if (activeAudio.paused) {
                  activeAudio.play();
                  btn.classList.add('_3cx_playing');
                  if (togBtn) togBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                } else {
                  activeAudio.pause();
                  btn.classList.remove('_3cx_playing');
                  if (togBtn) togBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                }
                return;
              }

              // Stop any other active audio
              stopActiveAudio();

              if (!url) return;

              box.classList.add('_3cx_open');
              btn.classList.add('_3cx_playing');

              var audio = new Audio(url);
              activeAudio = audio;
              activeCallId = callId;

              if (togBtn) togBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

              audio.addEventListener('loadedmetadata', function() {
                if (durTxt && !isNaN(audio.duration)) durTxt.textContent = formatTime(Math.floor(audio.duration));
              });

              audio.addEventListener('timeupdate', function() {
                if (!isNaN(audio.duration) && audio.duration > 0) {
                  var pct = (audio.currentTime / audio.duration) * 100;
                  if (seek) seek.value = pct;
                  if (timeTxt) timeTxt.textContent = formatTime(Math.floor(audio.currentTime));
                }
              });

              audio.addEventListener('ended', function() {
                btn.classList.remove('_3cx_playing');
                if (togBtn) togBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                if (seek) seek.value = 0;
                if (timeTxt) timeTxt.textContent = '00:00';
              });

              if (seek) {
                seek.addEventListener('input', function() {
                  if (activeAudio && !isNaN(activeAudio.duration)) {
                    activeAudio.currentTime = (seek.value / 100) * activeAudio.duration;
                  }
                });
              }

              if (togBtn) {
                togBtn.onclick = function() {
                  if (!activeAudio) return;
                  if (activeAudio.paused) {
                    activeAudio.play();
                    btn.classList.add('_3cx_playing');
                    togBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                  } else {
                    activeAudio.pause();
                    btn.classList.remove('_3cx_playing');
                    togBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                  }
                };
              }

              audio.play().catch(function(e){ console.error('Audio play error:', e); });
            });
          });
        })
        .catch(function(){ list.innerHTML = '<li class="_3cx_empty">Failed to load history</li>'; });
    }

    // ── Draggable FAB ─────────────────────────────────────────────────────────
    var isDragging = false, startX, startY, startLeft, startTop, didDrag = false;
    var THRESHOLD  = 6;

    function applyFabPos(left, top) {
      var w = fab.offsetWidth || 120, h = fab.offsetHeight || 40;
      fab.style.left   = Math.max(8, Math.min(left, window.innerWidth  - w - 8)) + 'px';
      fab.style.top    = Math.max(8, Math.min(top,  window.innerHeight - h - 8)) + 'px';
      fab.style.right  = 'auto';
      fab.style.bottom = 'auto';
    }

    function positionPopup() {
      var r = fab.getBoundingClientRect(), pW = 220, pH = 380;
      var pTop  = r.top - pH - 8, pLeft = r.right - pW;
      if (pTop  < 8) pTop  = r.bottom + 8;
      if (pLeft < 8) pLeft = 8;
      if (pLeft + pW > window.innerWidth - 8) pLeft = window.innerWidth - pW - 8;
      popup.style.top    = pTop  + 'px';
      popup.style.left   = pLeft + 'px';
      popup.style.right  = 'auto';
      popup.style.bottom = 'auto';
    }

    requestAnimationFrame(function() {
      try {
        var sp = JSON.parse(localStorage.getItem('_3cx_fab_pos') || 'null');
        if (sp) applyFabPos(sp.left, sp.top);
      } catch(e) {}
    });

    window.addEventListener('resize', function() {
      if (!fab.style.left) return;
      var r = fab.getBoundingClientRect();
      applyFabPos(r.left, r.top);
    });

    fab.addEventListener('pointerdown', function(e) {
      startX = e.clientX; startY = e.clientY;
      var r = fab.getBoundingClientRect(); startLeft = r.left; startTop = r.top;
      isDragging = true; didDrag = false;
      fab.setPointerCapture(e.pointerId);
      fab.style.transition = 'none';
    });
    fab.addEventListener('pointermove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!didDrag && (Math.abs(dx) > THRESHOLD || Math.abs(dy) > THRESHOLD)) {
        didDrag = true;
        popup.classList.remove('_3cx_active');
      }
      if (didDrag) applyFabPos(startLeft + dx, startTop + dy);
    });
    fab.addEventListener('pointerup', function() {
      if (!isDragging) return;
      isDragging = false;
      fab.style.transition = '';
      if (didDrag) {
        var r = fab.getBoundingClientRect();
        localStorage.setItem('_3cx_fab_pos', JSON.stringify({ left: r.left, top: r.top }));
      } else {
        positionPopup();
        popup.classList.toggle('_3cx_active');
      }
      didDrag = false;
    });
    fab.addEventListener('pointercancel', function() { isDragging = false; didDrag = false; fab.style.transition = ''; });

    document.getElementById('_3cx_close_btn').addEventListener('click', function() {
      popup.classList.remove('_3cx_active');
    });
  }
})();
