(function() {
  const WIDGET_ID   = '__WIDGET_ID__';
  const SERVER_URL  = '__SERVER_URL__';
  const PRIMARY     = '__COLOR_PRIMARY__';
  const BTN_COLOR   = '__COLOR_BUTTON_TEXT__';
  const TITLE       = '__WIDGET_TITLE__';
  const SUBTITLE    = '__WIDGET_SUBTITLE__';
  const BTN_TEXT    = '__WIDGET_BUTTON_TEXT__';
  const SUCCESS_H   = '__WIDGET_SUCCESS_TITLE__';
  const SUCCESS_MSG = '__WIDGET_SUCCESS_MSG__';
  const TOOLTIP     = '__TOOLTIP_TEXT__';
  const TOOLTIP_AUTOHIDE = __TOOLTIP_AUTOHIDE__;
  const TOOLTIP_AUTOHIDE_SEC = __TOOLTIP_AUTOHIDE_SEC__;
  const REQ_EMAIL   = __REQUIRE_EMAIL__;
  const REQ_LAST    = __REQUIRE_LASTNAME__;
  const LOGO_URL    = '__LOGO_URL__';
  const POSITION    = '__POSITION__';
  const POPUP_STYLE = '__POPUP_STYLE__';
  const RADIUS      = __BORDER_RADIUS__;
  const BTN_SIZE    = __BTN_SIZE__;
  const FONT_FAMILY = '__FONT_FAMILY__';
  const SHOW_AGENT  = __SHOW_AGENT__;
  const AV_SHAPE    = '__AVATAR_SHAPE__';
  const AV_BORDER   = '__AVATAR_BORDER_COLOR__';
  const AV_STATUS   = '__AGENT_STATUS_TEXT__';
  const FIELDS_ORDER= '__FIELDS_ORDER__';
  const ANIM_STYLE  = '__ANIMATION_STYLE__';
  const TOOLTIP_STYLE = '__TOOLTIP_STYLE__';
  const OVERLAY_BLUR= __OVERLAY_BLUR__;
  const CUSTOM_CSS  = '__CUSTOM_CSS__';
  const SHOW_BRANDING= __SHOW_BRANDING__;
  const BRANDING_TEXT = '__BRANDING_TEXT__';
  const BRANDING_URL  = '__BRANDING_URL__';
  const THEME_STYLE  = '__THEME_STYLE__';
  const AGENT_BG_URL = '__AGENT_BG_URL__';
  const W_WIDTH     = __WIDGET_WIDTH__;
  const W_HEIGHT    = '__WIDGET_HEIGHT__';
  const LOGO_HEIGHT = '__LOGO_HEIGHT__';
  const LOGO_WIDTH  = '__LOGO_WIDTH__';
  const logoHeightStyle = !isNaN(LOGO_HEIGHT) ? `${LOGO_HEIGHT}px` : LOGO_HEIGHT;
  const logoWidthStyle = !isNaN(LOGO_WIDTH) ? `${LOGO_WIDTH}px` : LOGO_WIDTH;
  const SUCCESS_ICON = '__ICON_SUCCESS_HTML__';
  const FAILED_ICON  = '__ICON_FAILED_HTML__';
  const SUCCESS_ICON_STYLE = '__ICON_SUCCESS_STYLE__';
  const FAILED_ICON_STYLE  = '__ICON_FAILED_STYLE__';
  // Office hours configuration
  const OFFICE_CLOSED       = __OFFICE_CLOSED__;
  const OFFICE_OUT_TITLE    = '__OFFICE_OUT_TITLE__';
  const OFFICE_OUT_SUBTITLE = '__OFFICE_OUT_SUBTITLE__';
  const OFFICE_OUT_MSG      = '__OFFICE_OUT_MSG__';
  const OFFICE_OUT_STATUS      = '__OFFICE_OUT_STATUS__';
  const OFFICE_OUT_SUB         = '__OFFICE_OUT_SUB__';
  const AGENT_ROTATION_ENABLED = __AGENT_ROTATION_ENABLED__;
  const RING_TIMEOUT = __RING_TIMEOUT__;

  // Prevent double-loading
  if (document.getElementById('cx-widget-container')) return;

  /* ─── Helpers ──────────────────────────────────────────────────── */
  function addCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    (document.head || document.documentElement).appendChild(l);
  }
  function addScript(src, cb) {
    if (document.querySelector(`script[src="${src}"]`)) { cb && cb(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = cb || function(){};
    s.onerror = function() { console.error('Failed to load script: ' + src); };
    (document.head || document.documentElement).appendChild(s);
  }

  /* ─── Load intl-tel-input assets immediately ───────────────────── */
  const ITI_BASE = 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build';
  addCSS(`${ITI_BASE}/css/intlTelInput.min.css`);

  // Load font from Google Fonts dynamically if it's not a standard web safe font
  const webSafeFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Arial', 'sans-serif'];
  if (FONT_FAMILY && !webSafeFonts.includes(FONT_FAMILY)) {
    addCSS(`https://fonts.googleapis.com/css2?family=${FONT_FAMILY.replace(/\\s+/g, '+')}:wght@400;600;700;800&display=swap`);
  }

  // Dynamic layout / position configs
  let positionStyles = '';
  if (POSITION === 'bottom-left') {
    positionStyles = 'bottom: 24px; left: 24px;';
  } else if (POSITION === 'top-right') {
    positionStyles = 'top: 24px; right: 24px;';
  } else if (POSITION === 'top-left') {
    positionStyles = 'top: 24px; left: 24px;';
  } else {
    positionStyles = 'bottom: 24px; right: 24px;';
  }

  let tooltipStyles = 'bottom: 70px; right: 0;';
  let tooltipArrow = 'bottom: -7px; right: 18px; border-top-color: #fff; border-bottom: none;';
  if (POSITION.includes('left')) {
    tooltipStyles = 'bottom: 70px; left: 0;';
    tooltipArrow = 'bottom: -7px; left: 18px; border-top-color: #fff; border-bottom: none;';
  }
  if (POSITION.includes('top')) {
    tooltipStyles = 'top: 70px; right: 0;';
    tooltipArrow = 'top: -7px; right: 18px; border-bottom-color: #fff; border-top: none;';
    if (POSITION.includes('left')) {
      tooltipStyles = 'top: 70px; left: 0;';
      tooltipArrow = 'top: -7px; left: 18px; border-bottom-color: #fff; border-top: none;';
    }
  }

  let modalPositionStyles = '';
  if (POPUP_STYLE === 'center') {
    modalPositionStyles = `
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      bottom: auto; right: auto;
      width: 90%; max-width: ${W_WIDTH}px;
      height: ${W_HEIGHT === 'auto' ? 'auto' : W_HEIGHT + 'px'};
    `;
  } else {
    let bottomVal = '96px';
    let topVal = 'auto';
    let rightVal = POSITION.includes('right') ? '24px' : 'auto';
    let leftVal = POSITION.includes('left') ? '24px' : 'auto';
    if (POSITION.includes('top')) {
      bottomVal = 'auto';
      topVal = '96px';
    }
    modalPositionStyles = `
      position: fixed;
      bottom: ${bottomVal}; top: ${topVal};
      right: ${rightVal}; left: ${leftVal};
      width: ${W_WIDTH}px;
      height: ${W_HEIGHT === 'auto' ? 'auto' : W_HEIGHT + 'px'};
      transform: translateY(14px) scale(.97);
    `;
  }

  let avatarRadius = '50%';
  if (AV_SHAPE === 'rounded') avatarRadius = '12px';
  if (AV_SHAPE === 'square') avatarRadius = '0';

  /* ─── Widget CSS ───────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    #cx-widget-container *, #cx-modal *, #cx-widget-container *::before, #cx-modal *::before, #cx-widget-container *::after, #cx-modal *::after {
      box-sizing: border-box;
      font-family: '${FONT_FAMILY}', 'Inter', -apple-system, sans-serif;
    }
    #cx-widget-container { position: fixed; ${positionStyles} z-index: 2147483600; }

    /* FAB */
    #cx-widget-button {
      width: ${BTN_SIZE}px; height: ${BTN_SIZE}px; border-radius: 50%;
      background: ${PRIMARY}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,.3);
      transition: transform .2s, box-shadow .2s, border-radius .2s; outline: none;
      position: relative;
    }
    #cx-widget-button:hover { transform: scale(1.1); animation: none; box-shadow: 0 8px 28px rgba(0,0,0,.4); }
    #cx-widget-button svg   { width: ${BTN_SIZE * 0.43}px; height: ${BTN_SIZE * 0.43}px; fill: ${BTN_COLOR}; }

    /* FAB Styles Overrides */
    #cx-widget-container.cx-fab-squircle #cx-widget-button {
      border-radius: 16px !important;
    }
    
    #cx-widget-container.cx-fab-pill #cx-widget-button {
      width: auto !important;
      padding: 0 20px !important;
      border-radius: 50px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px;
    }
    #cx-widget-container.cx-fab-pill #cx-widget-button::after {
      content: 'Call Us';
      font-size: 13px;
      font-weight: 700;
      color: ${BTN_COLOR};
      white-space: nowrap;
    }

    #cx-widget-container.cx-fab-dock {
      bottom: 0 !important;
      right: 32px !important;
      left: auto !important;
      top: auto !important;
    }
    #cx-widget-container.cx-fab-dock #cx-widget-button {
      height: 48px !important;
      width: auto !important;
      padding: 0 24px !important;
      border-radius: 12px 12px 0 0 !important;
      box-shadow: 0 -4px 16px rgba(0,0,0,0.15) !important;
      display: flex !important;
      align-items: center !important;
    }
    #cx-widget-container.cx-fab-dock #cx-widget-button::after {
      content: 'Call Us';
      font-size: 13px;
      font-weight: 700;
      color: ${BTN_COLOR};
      margin-left: 8px;
    }

    #cx-widget-container.cx-fab-glow #cx-widget-button {
      box-shadow: 0 0 0 0 ${PRIMARY}80;
      animation: cx-fab-glow-anim 2s infinite !important;
    }
    @keyframes cx-fab-glow-anim {
      0% { box-shadow: 0 0 0 0 ${PRIMARY}60; }
      70% { box-shadow: 0 0 0 15px ${PRIMARY}00; }
      100% { box-shadow: 0 0 0 0 ${PRIMARY}00; }
    }

    #cx-widget-container.cx-fab-double-ring #cx-widget-button {
      animation: cx-fab-pulse-slow 3s infinite;
    }
    #cx-widget-container.cx-fab-double-ring::before,
    #cx-widget-container.cx-fab-double-ring::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid ${PRIMARY};
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    }
    #cx-widget-container.cx-fab-double-ring::before {
      animation: cx-ring-expand-1 3s infinite;
    }
    #cx-widget-container.cx-fab-double-ring::after {
      animation: cx-ring-expand-2 3s infinite;
    }
    @keyframes cx-fab-pulse-slow {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes cx-ring-expand-1 {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes cx-ring-expand-2 {
      0% { transform: scale(1); opacity: 0.5; }
      50% { opacity: 0.8; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    #cx-widget-container.cx-fab-glass #cx-widget-button {
      background: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(14px) saturate(180%);
      -webkit-backdrop-filter: blur(14px) saturate(180%);
      border: 1.5px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
    }
    #cx-widget-container.cx-fab-glass #cx-widget-button svg {
      fill: #fff !important;
    }

    #cx-widget-container.cx-fab-minimal #cx-widget-button {
      width: ${BTN_SIZE * 0.75}px !important;
      height: ${BTN_SIZE * 0.75}px !important;
      box-shadow: 0 3px 12px rgba(0,0,0,0.2) !important;
    }
    #cx-widget-container.cx-fab-minimal #cx-widget-button svg {
      width: ${BTN_SIZE * 0.3}px !important;
      height: ${BTN_SIZE * 0.3}px !important;
    }

    #cx-widget-container.cx-fab-left-tab {
      left: 0 !important;
      right: auto !important;
      top: 50% !important;
      bottom: auto !important;
      transform: translateY(-50%) !important;
    }
    #cx-widget-container.cx-fab-left-tab #cx-widget-button {
      height: 44px !important;
      width: auto !important;
      padding: 0 16px !important;
      border-radius: 0 10px 10px 0 !important;
      box-shadow: 4px 0 16px rgba(0,0,0,0.18) !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px;
    }
    #cx-widget-container.cx-fab-left-tab #cx-widget-button::after {
      content: 'Call Us';
      font-size: 12px;
      font-weight: 700;
      color: ${BTN_COLOR};
      white-space: nowrap;
    }

    #cx-widget-container.cx-fab-right-tab {
      right: 0 !important;
      left: auto !important;
      top: 50% !important;
      bottom: auto !important;
      transform: translateY(-50%) !important;
    }
    #cx-widget-container.cx-fab-right-tab #cx-widget-button {
      height: 44px !important;
      width: auto !important;
      padding: 0 16px !important;
      border-radius: 10px 0 0 10px !important;
      box-shadow: -4px 0 16px rgba(0,0,0,0.18) !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px;
    }
    #cx-widget-container.cx-fab-right-tab #cx-widget-button::after {
      content: 'Call Us';
      font-size: 12px;
      font-weight: 700;
      color: ${BTN_COLOR};
      white-space: nowrap;
    }

    #cx-widget-container.cx-fab-pulse #cx-widget-button {
      animation: cx-anim-pulse 2.5s infinite;
    }
    #cx-widget-container.cx-fab-bounce #cx-widget-button {
      animation: cx-anim-bounce 2.5s infinite;
    }
    #cx-widget-container.cx-fab-spin #cx-widget-button {
      animation: cx-anim-spin 10s linear infinite;
    }

    @keyframes cx-anim-pulse {
      0%,100% { box-shadow: 0 4px 20px rgba(0,0,0,.3); }
      50%      { box-shadow: 0 4px 20px rgba(0,0,0,.3), 0 0 0 8px ${PRIMARY}25; }
    }
    @keyframes cx-anim-bounce {
      0%,100% { transform: translateY(0); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes cx-anim-spin {
      0%       { transform: rotate(0deg); }
      100%     { transform: rotate(360deg); }
    }
    @keyframes cx-anim-none {}

    /* Tooltip Base */
    #cx-tooltip {
      position: absolute; ${tooltipStyles}
      border-radius: 12px;
      padding: 11px 34px 11px 14px;
      min-width: 200px; max-width: 240px;
      font-size: 13px; line-height: 1.5;
      transition: all 0.3s ease;
    }
    #cx-tooltip::after {
      content: ''; position: absolute;
      ${tooltipArrow}
      border: 7px solid transparent;
    }
    #cx-tooltip-x {
      position: absolute; top: 7px; right: 10px;
      background: none; border: none; font-size: 15px;
      cursor: pointer; line-height: 1; padding: 0;
      transition: opacity 0.2s;
    }

    /* Tooltip Styles */
    /* 1. Classic (Default) */
    .cx-tooltip-classic {
      background: #fff;
      color: #333;
      box-shadow: 0 6px 24px rgba(0,0,0,.14);
    }
    .cx-tooltip-classic::after { border-top-color: #fff; border-bottom-color: #fff; }
    .cx-tooltip-classic #cx-tooltip-x { color: #bbb; }

    /* 2. Glass */
    .cx-tooltip-glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #111;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }
    .cx-tooltip-glass::after { border-top-color: rgba(255, 255, 255, 0.7); border-bottom-color: rgba(255, 255, 255, 0.7); }
    .cx-tooltip-glass #cx-tooltip-x { color: #777; }

    /* 3. Solid (Primary Color) */
    .cx-tooltip-solid {
      background: ${PRIMARY};
      color: ${BTN_COLOR};
      box-shadow: 0 6px 20px ${PRIMARY}66;
    }
    .cx-tooltip-solid::after { border-top-color: ${PRIMARY}; border-bottom-color: ${PRIMARY}; }
    .cx-tooltip-solid #cx-tooltip-x { color: ${BTN_COLOR}; opacity: 0.8; }

    /* 4. Dark */
    .cx-tooltip-dark {
      background: #1f2937;
      color: #f9fafb;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    }
    .cx-tooltip-dark::after { border-top-color: #1f2937; border-bottom-color: #1f2937; }
    .cx-tooltip-dark #cx-tooltip-x { color: #9ca3af; }

    /* 5. Neon */
    .cx-tooltip-neon {
      background: #000;
      color: #fff;
      border: 1px solid ${PRIMARY};
      box-shadow: 0 0 10px ${PRIMARY};
    }
    .cx-tooltip-neon::after {
      width: 10px !important;
      height: 10px !important;
      background: #000;
      border-bottom: 1px solid ${PRIMARY} !important;
      border-right: 1px solid ${PRIMARY} !important;
      border-top: none !important;
      border-left: none !important;
      transform: rotate(45deg);
      bottom: -6px !important;
      box-shadow: 4px 4px 8px -3px ${PRIMARY};
    }
    .cx-tooltip-neon #cx-tooltip-x { color: #888; }

    /* 6. Colorful Gradient */
    .cx-tooltip-gradient {
      background: linear-gradient(135deg, ${PRIMARY}, #7c3aed);
      color: #fff;
      box-shadow: 0 4px 15px ${PRIMARY}88;
      border: none;
    }
    .cx-tooltip-gradient::after { border-top-color: ${PRIMARY}; border-bottom-color: ${PRIMARY}; }
    .cx-tooltip-gradient #cx-tooltip-x { color: rgba(255,255,255,0.8); }

    /* 7. Outlined Border */
    .cx-tooltip-border {
      background: #fff;
      color: #333;
      border: 2px solid ${PRIMARY};
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 12px;
    }
    .cx-tooltip-border::after {
      width: 10px !important;
      height: 10px !important;
      background: #fff;
      border-bottom: 2px solid ${PRIMARY} !important;
      border-right: 2px solid ${PRIMARY} !important;
      border-top: none !important;
      border-left: none !important;
      transform: rotate(45deg);
      bottom: -6px !important;
    }
    .cx-tooltip-border #cx-tooltip-x { color: #888; }

    /* 8. Deep Shadow */
    .cx-tooltip-shadow {
      background: #fff;
      color: #222;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25), 0 5px 15px rgba(0,0,0,0.15);
      transform: translateY(-4px);
    }
    .cx-tooltip-shadow::after { border-top-color: #fff; border-bottom-color: #fff; }
    .cx-tooltip-shadow #cx-tooltip-x { color: #666; }

    /* 9. Minimalist */
    .cx-tooltip-minimal {
      background: #f4f4f5;
      color: #18181b;
      padding: 6px 12px;
      font-weight: 500;
      letter-spacing: 0.3px;
      border-radius: 4px;
      box-shadow: none;
      border: 1px solid #e4e4e7;
    }
    .cx-tooltip-minimal::after { display: none; }
    .cx-tooltip-minimal #cx-tooltip-x { color: #a1a1aa; top: 2px; right: 4px; padding: 2px; }

    /* 10. Playful Bubble */
    .cx-tooltip-bubble {
      background: ${PRIMARY};
      color: ${BTN_COLOR};
      border-radius: 30px;
      padding: 10px 20px;
      font-weight: 700;
      box-shadow: 0 4px 14px ${PRIMARY}66;
    }
    .cx-tooltip-bubble::after { border-top-color: ${PRIMARY}; border-bottom-color: ${PRIMARY}; }
    .cx-tooltip-bubble #cx-tooltip-x { color: ${BTN_COLOR}; opacity: 0.7; top: 50%; transform: translateY(-50%); right: 8px; }

    /* Overlay */
    #cx-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.5); z-index: 2147483601;
      backdrop-filter: blur(${OVERLAY_BLUR}px);
      -webkit-backdrop-filter: blur(${OVERLAY_BLUR}px);
    }
    #cx-overlay.show { display: block; }

    /* Modal */
    #cx-modal {
      display: none;
      background: #fff;
      border-radius: ${RADIUS}px;
      box-shadow: 0 24px 64px rgba(0,0,0,.22);
      z-index: 2147483602;
      overflow: hidden;
      opacity: 0;
      transition: opacity .28s ease, transform .28s ease;
      ${modalPositionStyles}
    }
    #cx-modal.show {
      display: block; opacity: 1;
      transform: ${POPUP_STYLE === 'center' ? 'translate(-50%, -50%) scale(1)' : 'none'};
    }
    @media(max-width: 400px) {
      #cx-modal {
        ${POPUP_STYLE === 'center' ? 'width:90%' : 'right: 10px; bottom: 84px; width: calc(100vw - 20px);'}
      }
    }

    /* Modal header */
    .cx-hd { background: ${PRIMARY}; padding: 18px 18px 14px; position: relative; }
    .cx-hd h2 { margin: 0 0 3px; font-size: 15px; font-weight: 700; color: ${BTN_COLOR}; padding-right: 28px; line-height: 1.4; }
    .cx-hd p  { margin: 0; font-size: 13px; color: ${BTN_COLOR}; opacity: .88; }
    .cx-hd-x  {
      position: absolute; top: 10px; right: 10px;
      background: rgba(255,255,255,.2); border: none;
      color: ${BTN_COLOR}; width: 28px; height: 28px;
      border-radius: 50%; cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .cx-hd-x:hover { background: rgba(255,255,255,.35); }

    /* Agent profile */
    #cx-agent { text-align: center; padding: 14px 16px 0; background: #f8fafc; border-bottom: 1px solid #eef0f3; }
    #cx-av    { width: 54px; height: 54px; border-radius: ${avatarRadius}; object-fit: cover; border: 3px solid ${AV_BORDER || PRIMARY}; margin: 0 auto 5px; display: block; }
    #cx-av-name { font-size: 14px; font-weight: 700; color: #111; }
    #cx-av-sub  { font-size: 12px; color: #888; margin-bottom: 12px; }

    /* Form */
    .cx-body { padding: 15px 18px 18px; }
    .cx-fg    { margin-bottom: 11px; }
    .cx-fg label { display: block; font-size: 11px; font-weight: 700; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .cx-inp   {
      width: 100%; padding: 10px 12px;
      border: 1.5px solid #e5e7eb; border-radius: 9px;
      font-size: 14px; color: #111; outline: none;
      transition: border-color .18s, box-shadow .18s;
    }
    .cx-inp:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px ${PRIMARY}22; }

    /* ── intl-tel-input: make it look native ── */
    .cx-iti-wrap { width: 100%; }
    .cx-iti-wrap .iti { width: 100%; }
    .cx-iti-wrap .iti__flag-container { z-index: 2147483610; }
    .cx-iti-wrap .iti__selected-flag {
      background: #f9fafb;
      border-radius: 9px 0 0 9px;
      border-right: 1.5px solid #e5e7eb;
      padding: 0 8px 0 10px;
    }
    .cx-iti-wrap .iti__selected-flag:hover { background: #f3f4f6; }
    .cx-iti-wrap input[type="tel"] {
      width: 100%;
      padding: 10px 12px 10px 90px !important;
      border: 1.5px solid #e5e7eb !important;
      border-radius: 9px !important;
      font-size: 14px !important;
      color: #111 !important;
      outline: none !important;
      height: 44px;
      transition: border-color .18s, box-shadow .18s;
    }
    .cx-iti-wrap input[type="tel"]:focus {
      border-color: ${PRIMARY} !important;
      box-shadow: 0 0 0 3px ${PRIMARY}22 !important;
    }
    .cx-iti-wrap .iti__dropdown-content {
      z-index: 2147483615 !important;
      border-radius: 12px;
      box-shadow: 0 10px 32px rgba(0,0,0,.18);
      border: 1px solid #e5e7eb;
    }
    .cx-iti-wrap .iti__search-input { border-radius: 8px; border: 1.5px solid #e5e7eb; margin: 8px; width: calc(100% - 16px); }
    #cx-phone-err { color: #ef4444; font-size: 11px; margin-top: 4px; display: none; }
    .iti--container { z-index: 2147483647 !important; }

    /* Resilient fallbacks for intl-tel-input list styles */
    .iti__country-list {
      list-style: none !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      position: absolute !important;
      z-index: 2147483615 !important;
      max-height: 200px !important;
      overflow-y: auto !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 32px rgba(0,0,0,.18) !important;
      width: 300px !important;
    }
    .iti__country {
      display: flex !important;
      align-items: center !important;
      padding: 8px 12px !important;
      gap: 8px !important;
      cursor: pointer !important;
      font-size: 13px !important;
      color: #333 !important;
      list-style-type: none !important;
    }
    .iti__country:hover { background: #f3f4f6 !important; }
    .iti__flag { margin-right: 6px !important; }
    .iti__country-name { color: #111 !important; }
    .iti__dial-code { color: #6b7280 !important; font-size: 12px !important; }

    /* Submit */
    .cx-btn {
      width: 100%; background: ${PRIMARY}; color: ${BTN_COLOR};
      border: none; padding: 13px; border-radius: 10px;
      font-size: 15px; font-weight: 700; cursor: pointer;
      transition: opacity .18s, transform .1s; margin-top: 6px;
    }
    .cx-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
    .cx-btn:disabled { opacity: .5; cursor: not-allowed; }

    /* Success */
    .cx-ok { padding: 30px 18px; text-align: center; }
    .cx-ok-icon { font-size: 52px; display: block; margin-bottom: 10px; }
    .cx-ok h3 { margin: 0 0 8px; font-size: 19px; font-weight: 800; color: #111; }
    .cx-ok p  { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; }

    /* Fancy Countdown Timer */
    .cx-timer-wrap {
      position: relative; width: 72px; height: 72px; margin: 0 auto 12px;
    }
    .cx-timer-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .cx-timer-bg { fill: none; stroke: #eef0f3; stroke-width: 4.5; }
    .cx-timer-progress {
      fill: none; stroke: ${PRIMARY}; stroke-width: 4.5; stroke-linecap: round;
      transition: stroke-dashoffset 1s linear;
    }
    .cx-timer-text {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 19px; font-weight: 700; color: #111;
    }

    /* Agent cycle transition & Progress ring */
    #cx-agent-content * { transition: opacity 0.22s ease-in-out; }
    .cx-fade-out { opacity: 0 !important; }

    .cx-av-container {
      position: relative;
      width: 72px;
      height: 72px;
      margin: 0 auto 8px;
      display: inline-block;
    }
    .cx-av-ring-svg {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 114%;
      height: 114%;
      transform: translate(-50%, -50%) rotate(-90deg);
      transform-origin: center;
      pointer-events: none;
      z-index: 2;
    }
    .cx-av-ring-bg {
      fill: none;
      stroke: ${THEME_STYLE === 'split' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)'};
      stroke-width: 3;
    }
    .cx-av-ring-progress {
      fill: none;
      stroke: ${THEME_STYLE === 'split' ? BTN_COLOR : PRIMARY};
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.1s linear;
    }
    #cx-av {
      width: 72px !important;
      height: 72px !important;
      border-radius: 50% !important;
      object-fit: cover;
      display: block;
      margin: 0 !important;
      border: 3px solid transparent !important;
    }

    /* ─── Themes ─────────────────────────────────────────────────── */
    /* 1. Classic Theme (Classic Banner) */
    #cx-modal.cx-theme-classic .cx-hd { background: ${PRIMARY}; }
    #cx-modal.cx-theme-classic .cx-hd h2, #cx-modal.cx-theme-classic .cx-hd p { color: ${BTN_COLOR}; }

    /* 2. Modern Theme (Minimalist Rounded Card) */
    #cx-modal.cx-theme-modern { border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.12); border: 1px solid #eef2f6; }
    #cx-modal.cx-theme-modern .cx-hd { background: transparent; border-bottom: none; padding: 24px 24px 10px; }
    #cx-modal.cx-theme-modern .cx-hd h2 { color: ${PRIMARY}; font-size: 17px; }
    #cx-modal.cx-theme-modern .cx-hd p { color: #6b7280; font-size: 13px; }
    #cx-modal.cx-theme-modern .cx-hd-x { background: #f3f4f6; color: #4b5563; }
    #cx-modal.cx-theme-modern #cx-agent { background: #f8fafc; border-bottom: none; margin: 0 24px; border-radius: 12px; padding: 12px; }
    #cx-modal.cx-theme-modern .cx-body { padding: 18px 24px 24px; }
    #cx-modal.cx-theme-modern .cx-btn { border-radius: 12px; }

    /* 3. Compact Theme (Clean Inline Pill/Bubble) */
    #cx-modal.cx-theme-compact { width: 280px; border-radius: 20px; }
    #cx-modal.cx-theme-compact .cx-hd { background: transparent; padding: 16px 16px 4px; text-align: center; }
    #cx-modal.cx-theme-compact .cx-hd h2 { font-size: 14px; color: #111; padding-right: 0; }
    #cx-modal.cx-theme-compact .cx-hd p { display: none; }
    #cx-modal.cx-theme-compact #cx-agent { display: none !important; }
    #cx-modal.cx-theme-compact #cx-logo-wrap { display: none !important; }
    #cx-modal.cx-theme-compact .cx-body { padding: 10px 16px 16px; }
    #cx-modal.cx-theme-compact .cx-inp { padding: 8px 10px; font-size: 13px; }
    #cx-modal.cx-theme-compact .cx-iti-wrap input[type="tel"] { padding-left: 80px !important; height: 38px; }
    #cx-modal.cx-theme-compact .cx-btn { padding: 10px; font-size: 13px; }

    /* 4. Split Theme (Two-Column Agent & Form Split Panel) */
    @media(min-width: 501px) {
      #cx-modal.cx-theme-split {
        display: grid !important;
        grid-template-columns: 40% 60%;
        grid-template-rows: auto 1fr auto;
        width: 500px;
        min-height: 380px;
        align-items: stretch;
      }
      #cx-modal.cx-theme-split.show { display: grid !important; }
      
      #cx-modal.cx-theme-split .cx-hd {
        grid-column: 2;
        grid-row: 1;
        background: transparent;
        padding: 20px 20px 10px;
      }
      #cx-modal.cx-theme-split .cx-hd h2 { color: #111; }
      #cx-modal.cx-theme-split .cx-hd p { color: #6b7280; }
      #cx-modal.cx-theme-split .cx-hd-x { z-index: 10; color: #111; background: #f3f4f6; }
      
      #cx-modal.cx-theme-split #cx-logo-wrap {
        grid-column: 2;
        grid-row: 1;
        position: relative;
        margin-top: 45px;
        background: transparent !important;
      }
      
      #cx-modal.cx-theme-split #cx-agent {
        grid-column: 1;
        grid-row: 1 / span 3;
        height: 100%;
        background: ${AGENT_BG_URL ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${AGENT_BG_URL})` : PRIMARY};
        background-size: cover;
        background-position: center;
        display: flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        border-bottom: none;
        border-right: 1px solid #eef0f3;
      }
      #cx-modal.cx-theme-split #cx-av { width: 72px; height: 72px; border-color: ${BTN_COLOR}; }
      #cx-modal.cx-theme-split #cx-av-name { color: ${BTN_COLOR}; margin-top: 8px; }
      #cx-modal.cx-theme-split #cx-av-sub { color: ${BTN_COLOR}; opacity: 0.85; margin-bottom: 0; }
      
      #cx-modal.cx-theme-split .cx-body {
        grid-column: 2;
        grid-row: 2;
        padding: 10px 20px 20px;
      }
      #cx-modal.cx-theme-split .cx-ok {
        grid-column: 2;
        grid-row: 2;
        padding: 20px;
      }
      #cx-modal.cx-theme-split #cx-brand-wrap {
        grid-column: 2;
        grid-row: 3;
        background: transparent !important;
        padding: 0 0 14px;
      }
    }
    @media(max-width: 500px) {
      #cx-modal {
        max-width: calc(100vw - 32px) !important;
        max-height: 92vh !important;
        overflow-y: auto !important;
        width: calc(100vw - 32px) !important;
        height: auto !important;
        left: 16px !important;
        right: 16px !important;
        bottom: ${POPUP_STYLE === 'center' ? 'auto' : '84px'} !important;
        top: ${POPUP_STYLE === 'center' ? '50%' : 'auto'} !important;
        transform: ${POPUP_STYLE === 'center' ? 'translateY(-50%) scale(1)' : 'none'} !important;
      }
      #cx-modal.cx-theme-split {
        display: block !important;
        min-height: auto;
      }
      #cx-modal.cx-theme-split #cx-agent {
        display: block !important;
        background: ${AGENT_BG_URL ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${AGENT_BG_URL})` : PRIMARY};
        background-size: cover;
        background-position: center;
        padding: 16px;
      }
      #cx-modal.cx-theme-split #cx-av-name, #cx-theme-split #cx-av-sub { color: ${BTN_COLOR}; }
      #cx-modal.cx-theme-split #cx-av { border-color: ${BTN_COLOR}; }
      #cx-modal.cx-theme-split .cx-hd { background: transparent; }
      #cx-modal.cx-theme-split .cx-hd h2 { color: #111; }
      #cx-modal.cx-theme-split .cx-hd p { color: #6b7280; }
      #cx-modal.cx-theme-split .cx-hd-x { color: #111; background: #f3f4f6; }
    }

    /* 5. Neon Theme (Futuristic Neon Glow) */
    #cx-modal.cx-theme-neon {
      background: #0f172a;
      border: 1px solid ${PRIMARY};
      box-shadow: 0 0 25px ${PRIMARY}80;
    }
    #cx-modal.cx-theme-neon .cx-hd { background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.08); }
    #cx-modal.cx-theme-neon .cx-hd h2 { color: #f8fafc; }
    #cx-modal.cx-theme-neon .cx-hd p { color: #94a3b8; }
    #cx-modal.cx-theme-neon .cx-hd-x { background: rgba(255,255,255,0.08); color: #f8fafc; }
    #cx-modal.cx-theme-neon .cx-hd-x:hover { background: rgba(255,255,255,0.18); }
    #cx-modal.cx-theme-neon #cx-agent { background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.08); }
    #cx-modal.cx-theme-neon #cx-av-name { color: #f8fafc; }
    #cx-modal.cx-theme-neon #cx-av-sub { color: #94a3b8; }
    #cx-modal.cx-theme-neon .cx-fg label { color: ${PRIMARY}; text-shadow: 0 0 5px ${PRIMARY}44; }
    #cx-modal.cx-theme-neon .cx-inp {
      background: transparent;
      border: none;
      border-bottom: 2px solid #334155;
      border-radius: 0;
      color: #f8fafc;
      padding: 8px 0;
    }
    #cx-modal.cx-theme-neon .cx-inp:focus {
      border-bottom-color: ${PRIMARY};
      box-shadow: none;
    }
    #cx-modal.cx-theme-neon .cx-iti-wrap .iti__selected-flag { background: transparent; border-right: none; border-bottom: 2px solid #334155; border-radius: 0; }
    #cx-modal.cx-theme-neon .cx-iti-wrap input[type="tel"] {
      background: transparent !important;
      border: none !important;
      border-bottom: 2px solid #334155 !important;
      border-radius: 0 !important;
      color: #f8fafc !important;
      padding-left: 76px !important;
    }
    #cx-modal.cx-theme-neon .cx-iti-wrap input[type="tel"]:focus {
      border-bottom-color: ${PRIMARY} !important;
      box-shadow: none !important;
    }
    #cx-modal.cx-theme-neon #cx-brand-wrap { background: #0f172a !important; }
    #cx-modal.cx-theme-neon #cx-brand-wrap a { color: #475569; }
    #cx-modal.cx-theme-neon .cx-ok h3 { color: #f8fafc; }
    #cx-modal.cx-theme-neon .cx-ok p { color: #94a3b8; }

    /* 6. Glassmorphism Theme */
    #cx-modal.cx-theme-glass {
      background: rgba(255,255,255,0.18) !important;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1.5px solid rgba(255,255,255,0.35) !important;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22) !important;
    }
    #cx-modal.cx-theme-glass .cx-hd { background: rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.2); }
    #cx-modal.cx-theme-glass .cx-hd h2 { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
    #cx-modal.cx-theme-glass .cx-hd p { color: rgba(255,255,255,0.82); }
    #cx-modal.cx-theme-glass .cx-hd-x { background: rgba(255,255,255,0.25); color: #fff; }
    #cx-modal.cx-theme-glass #cx-agent { background: rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.15); }
    #cx-modal.cx-theme-glass #cx-av-name { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
    #cx-modal.cx-theme-glass #cx-av-sub { color: rgba(255,255,255,0.75); }
    #cx-modal.cx-theme-glass .cx-body { background: transparent; }
    #cx-modal.cx-theme-glass .cx-fg label { color: rgba(255,255,255,0.75); }
    #cx-modal.cx-theme-glass .cx-inp { background: rgba(255,255,255,0.18) !important; border: 1.5px solid rgba(255,255,255,0.3) !important; color: #fff !important; border-radius: 8px !important; }
    #cx-modal.cx-theme-glass .cx-inp:focus { border-color: rgba(255,255,255,0.6) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.1) !important; }
    #cx-modal.cx-theme-glass .cx-iti-wrap .iti__selected-flag { background: rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.2); border-radius: 8px 0 0 8px; }
    #cx-modal.cx-theme-glass .cx-iti-wrap input[type="tel"] { background: rgba(255,255,255,0.18) !important; border: 1.5px solid rgba(255,255,255,0.3) !important; color: #fff !important; }
    #cx-modal.cx-theme-glass #cx-brand-wrap { background: rgba(255,255,255,0.06) !important; }
    #cx-modal.cx-theme-glass #cx-brand-wrap a { color: rgba(255,255,255,0.55); }
    #cx-modal.cx-theme-glass .cx-ok h3 { color: #fff; }
    #cx-modal.cx-theme-glass .cx-ok p { color: rgba(255,255,255,0.75); }

    /* 7. Dark Elegance Theme */
    #cx-modal.cx-theme-dark { background: #111827; border: 1px solid #1f2937; box-shadow: 0 32px 80px rgba(0,0,0,0.6); }
    #cx-modal.cx-theme-dark .cx-hd { background: linear-gradient(135deg, #1f2937, #111827); border-bottom: 1px solid rgba(255,255,255,0.05); }
    #cx-modal.cx-theme-dark .cx-hd h2 { color: #f9fafb; }
    #cx-modal.cx-theme-dark .cx-hd p { color: #9ca3af; }
    #cx-modal.cx-theme-dark .cx-hd-x { background: rgba(255,255,255,0.08); color: #f9fafb; }
    #cx-modal.cx-theme-dark #cx-agent { background: #1a2235; border-bottom: 1px solid rgba(255,255,255,0.05); }
    #cx-modal.cx-theme-dark #cx-av-name { color: #f9fafb; }
    #cx-modal.cx-theme-dark #cx-av-sub { color: #6b7280; }
    #cx-modal.cx-theme-dark .cx-body { background: #111827; }
    #cx-modal.cx-theme-dark .cx-fg label { color: #6b7280; }
    #cx-modal.cx-theme-dark .cx-inp { background: #1f2937 !important; border: 1.5px solid #374151 !important; color: #f9fafb !important; border-radius: 8px !important; }
    #cx-modal.cx-theme-dark .cx-inp:focus { border-color: ${PRIMARY} !important; }
    #cx-modal.cx-theme-dark .cx-iti-wrap .iti__selected-flag { background: #1f2937; border-right: 1px solid #374151; }
    #cx-modal.cx-theme-dark .cx-iti-wrap input[type="tel"] { background: #1f2937 !important; border: 1.5px solid #374151 !important; color: #f9fafb !important; }
    #cx-modal.cx-theme-dark #cx-brand-wrap { background: #111827 !important; }
    #cx-modal.cx-theme-dark #cx-brand-wrap a { color: #4b5563; }
    #cx-modal.cx-theme-dark .cx-ok h3 { color: #f9fafb; }
    #cx-modal.cx-theme-dark .cx-ok p { color: #9ca3af; }

    /* 8. Gradient Wave Theme */
    #cx-modal.cx-theme-wave { background: #fff; }
    #cx-modal.cx-theme-wave .cx-hd {
      background: linear-gradient(135deg, ${PRIMARY} 0%, #7c3aed 100%);
      padding-bottom: 28px;
      position: relative;
    }
    #cx-modal.cx-theme-wave .cx-hd h2 { color: #fff; }
    #cx-modal.cx-theme-wave .cx-hd p { color: rgba(255,255,255,0.85); }
    #cx-modal.cx-theme-wave .cx-hd-x { background: rgba(255,255,255,0.25); color: #fff; }
    #cx-modal.cx-theme-wave #cx-agent { background: #fafafa; border-bottom: 1px solid #f0f0f0; }

    /* 9. Floating Card Theme */
    #cx-modal.cx-theme-floating {
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.08);
      border: none;
      overflow: hidden;
    }
    #cx-modal.cx-theme-floating .cx-hd {
      background: ${PRIMARY};
      text-align: center;
      padding: 20px 20px 36px;
      border-bottom: none;
      clip-path: ellipse(100% 80% at 50% 0%);
      position: relative;
      z-index: 1;
      will-change: clip-path;
      transform: translateZ(0);
    }
    #cx-modal.cx-theme-floating .cx-hd h2 { color: ${BTN_COLOR}; font-size: 15px; font-weight: 800; padding-right: 0; }
    #cx-modal.cx-theme-floating .cx-hd p { color: rgba(255,255,255,0.8); font-size: 12px; }
    #cx-modal.cx-theme-floating .cx-hd-x { background: rgba(255,255,255,0.2); color: #fff; }
    #cx-modal.cx-theme-floating #cx-agent {
      background: transparent;
      border-bottom: none;
      padding: 0 14px 14px;
      margin-top: -28px;
      position: relative;
      z-index: 5;
    }
    #cx-modal.cx-theme-floating .cx-av-container { width: 60px; height: 60px; margin: 0 auto 6px; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.22)); }
    #cx-modal.cx-theme-floating #cx-av { width: 60px !important; height: 60px !important; border: 3px solid #fff !important; }
    #cx-modal.cx-theme-floating #cx-av-name { color: #111; font-size: 13px; font-weight: 700; }
    #cx-modal.cx-theme-floating #cx-av-sub { color: #6b7280; font-size: 11px; margin-bottom: 4px; }
    #cx-modal.cx-theme-floating .cx-body { padding: 2px 20px 20px; }
    #cx-modal.cx-theme-floating .cx-inp { border-radius: 12px; background: #f9fafb; border: 1.5px solid #e5e7eb !important; }
    #cx-modal.cx-theme-floating .cx-iti-wrap input[type="tel"] { border-radius: 12px !important; background: #f9fafb !important; }
    #cx-modal.cx-theme-floating .cx-btn { border-radius: 14px; }
    #cx-modal.cx-theme-floating #cx-brand-wrap { border-top: 1px solid #f3f4f6; }

    /* 10. Corporate Pro Theme */
    #cx-modal.cx-theme-corporate {
      background: #fff;
      border-radius: 8px;
      border: none;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      overflow: hidden;
    }
    #cx-modal.cx-theme-corporate .cx-hd {
      background: ${PRIMARY};
      padding: 16px 16px 14px;
      border-bottom: none;
      position: relative;
    }
    #cx-modal.cx-theme-corporate .cx-hd::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 5px;
      background: rgba(255,255,255,0.3);
    }
    #cx-modal.cx-theme-corporate .cx-hd h2 { color: ${BTN_COLOR}; font-size: 13px; font-weight: 800; letter-spacing: -0.2px; }
    #cx-modal.cx-theme-corporate .cx-hd p { color: rgba(255,255,255,0.75); font-size: 11px; }
    #cx-modal.cx-theme-corporate .cx-hd-x { background: rgba(255,255,255,0.2); color: #fff; }
    #cx-modal.cx-theme-corporate #cx-agent {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      text-align: left;
      padding: 10px 14px;
      background: #f8fafc;
      border-bottom: 2px solid #e5e7eb;
      border-left: 5px solid ${PRIMARY};
    }
    #cx-modal.cx-theme-corporate .cx-av-container { width: 38px; height: 38px; flex-shrink: 0; margin: 0; }
    #cx-modal.cx-theme-corporate #cx-av { width: 38px !important; height: 38px !important; margin: 0 !important; }
    #cx-modal.cx-theme-corporate #cx-av-name { font-size: 12px; font-weight: 700; text-align: left; color: #111; }
    #cx-modal.cx-theme-corporate #cx-av-sub { font-size: 10px; text-align: left; margin-bottom: 0; color: #6b7280; }
    #cx-modal.cx-theme-corporate .cx-body { padding: 12px 14px 14px; border-left: 5px solid #f3f4f6; }
    #cx-modal.cx-theme-corporate .cx-fg label { color: #6b7280; font-weight: 700; letter-spacing: 0.3px; }
    #cx-modal.cx-theme-corporate .cx-inp { border-radius: 4px; border: 1px solid #d1d5db; background: #fafafa; }
    #cx-modal.cx-theme-corporate .cx-iti-wrap input[type="tel"] { border-radius: 4px !important; border: 1px solid #d1d5db !important; background: #fafafa !important; }
    #cx-modal.cx-theme-corporate .cx-btn { border-radius: 4px; font-weight: 800; letter-spacing: 0.5px; }
    #cx-modal.cx-theme-corporate #cx-brand-wrap { border-left: 5px solid #f3f4f6 !important; }
  `;
  document.head.appendChild(style);

  // Generate dynamic form fields based on order
  const order = (FIELDS_ORDER || 'first_name,last_name,email,phone').split(',');
  let formHtml = '';
  order.forEach(field => {
    if (field === 'first_name') {
      formHtml += `
        <div class="cx-fg">
          <label>First Name <span style="color:#ef4444">*</span></label>
          <input type="text" id="cx-fname" class="cx-inp" placeholder="John" required autocomplete="given-name">
        </div>
      `;
    } else if (field === 'last_name') {
      if (REQ_LAST) {
        formHtml += `
          <div class="cx-fg">
            <label>Last Name</label>
            <input type="text" id="cx-lname" class="cx-inp" placeholder="Doe" autocomplete="family-name">
          </div>
        `;
      }
    } else if (field === 'email') {
      if (REQ_EMAIL) {
        formHtml += `
          <div class="cx-fg">
            <label>Email <span style="color:#ef4444">*</span></label>
            <input type="email" id="cx-email" class="cx-inp" placeholder="john@example.com" autocomplete="email">
          </div>
        `;
      }
    } else if (field === 'phone') {
      formHtml += `
        <div class="cx-fg">
          <label>Phone Number <span style="color:#ef4444">*</span></label>
          <div class="cx-iti-wrap">
            <input type="tel" id="cx-phone" autocomplete="tel">
          </div>
          <div id="cx-phone-err">Please enter a valid phone number.</div>
        </div>
      `;
    }
  });

  let agentLogoHtml = '';
  if (THEME_STYLE === 'split' && LOGO_URL) {
    agentLogoHtml = `
      <div class="cx-logo-agent" style="margin-bottom: 20px; text-align: center;">
        <img src="${LOGO_URL}" style="max-height: 28px; max-width: 100px; object-fit: contain; filter: brightness(0) invert(1);">
      </div>
    `;
  }

    /* ─── Widget HTML ──────────────────────────────────────────────── */
    const actualTitle      = OFFICE_CLOSED ? OFFICE_OUT_TITLE : (TITLE || 'Need Expert Advice?');
    const actualSubtitle   = OFFICE_CLOSED ? OFFICE_OUT_SUBTITLE : (SUBTITLE || 'We will call you in 55 seconds!');
    const actualBtnText    = OFFICE_CLOSED ? 'Submit Inquiry' : (BTN_TEXT || 'Call me!');
    const actualSuccessH   = OFFICE_CLOSED ? 'Inquiry Received' : (SUCCESS_H || 'Calling you now…');
    const actualSuccessMsg = OFFICE_CLOSED ? OFFICE_OUT_MSG : (SUCCESS_MSG || 'Please keep your phone nearby. An agent will connect shortly.');

    let headerLogoHtml = '';
    if (THEME_STYLE === 'floating' && LOGO_URL) {
      const filterStyle = BTN_COLOR === '#ffffff' ? 'filter: brightness(0) invert(1);' : '';
      headerLogoHtml = `
        <div class="cx-logo-header" style="margin-bottom: 12px; text-align: center; display: flex; align-items: center; justify-content: center;">
          <img src="${LOGO_URL}" style="max-height: 30px; max-width: ${logoWidthStyle}; object-fit: contain; ${filterStyle}">
        </div>
      `;
    }

    document.body.insertAdjacentHTML('beforeend', `
    <div id="cx-widget-container" class="cx-fab-${ANIM_STYLE}">
      <div id="cx-tooltip" class="cx-tooltip-${TOOLTIP_STYLE}">
        <button id="cx-tooltip-x" aria-label="Close">&times;</button>
        ${OFFICE_CLOSED ? OFFICE_OUT_TITLE : (TOOLTIP || 'Click here — we will call you in 55 seconds!')}
      </div>
      <button id="cx-widget-button" aria-label="Call us">
        <svg viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
      </button>
    </div>

    <div id="cx-overlay"></div>

    <div id="cx-modal" class="cx-theme-${THEME_STYLE}" role="dialog" aria-modal="true" aria-label="Call us">
      <div class="cx-hd">
        <button class="cx-hd-x" id="cx-modal-x" aria-label="Close">&times;</button>
        ${headerLogoHtml}
        <h2>${actualTitle}</h2>
        <p>${actualSubtitle}</p>
      </div>

      <div id="cx-logo-wrap" style="display:none; text-align:center; padding:12px 14px 0; background:#f8fafc;">
        <img id="cx-logo" src="${LOGO_URL}" style="max-height:${logoHeightStyle}; max-width:${logoWidthStyle}; object-fit:contain;">
      </div>

      <div id="cx-agent" style="display:none">
        ${OFFICE_CLOSED ? `
          <div style="text-align: center; color: ${THEME_STYLE === 'split' ? BTN_COLOR : '#111'}; margin: auto 0; padding: 10px 0; width: 100%;">
            <div style="font-size: 38px; margin-bottom: 8px;">⏳</div>
            <div style="font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: ${THEME_STYLE === 'split' ? BTN_COLOR : PRIMARY};">${OFFICE_OUT_STATUS}</div>
            <div style="font-size: 11px; opacity: 0.8; margin-top: 4px; padding: 0 10px; line-height: 1.4;">${OFFICE_OUT_SUB}</div>
          </div>
        ` : `
          <div id="cx-agent-content" style="width: 100%;">
            ${agentLogoHtml}
            <div class="cx-av-container">
              <svg class="cx-av-ring-svg" viewBox="0 0 76 76">
                <circle class="cx-av-ring-bg" cx="38" cy="38" r="33" />
                <circle class="cx-av-ring-progress" id="cx-av-ring" cx="38" cy="38" r="33" />
              </svg>
              <img id="cx-av" src="" alt="Agent" style="display:none;">
            </div>
            <div id="cx-av-name"></div>
            <div id="cx-av-sub">${AV_STATUS || 'Will answer your call'}</div>
          </div>
        `}
      </div>

      <div class="cx-body" id="cx-form-wrap">
        <form id="cx-form" novalidate>
          ${formHtml}
          <button type="submit" class="cx-btn" id="cx-submit">${actualBtnText}</button>
        </form>
      </div>

      <div class="cx-ok" id="cx-ok-wrap" style="display:none">
        <div id="cx-success-badge-container"></div>
        <h3>${actualSuccessH}</h3>
        <p>${actualSuccessMsg}</p>
      </div>
      <div id="cx-brand-wrap" style="display:none; text-align:center; padding: 0 0 16px; font-size:11px; color:#9ca3af; background:#fff; font-weight:500;">
        <a href="${BRANDING_URL}" target="_blank" style="color:#9ca3af; text-decoration:none; opacity:0.85;">${BRANDING_TEXT}</a>
      </div>
    </div>
  `);

  if (SHOW_BRANDING) {
    document.getElementById('cx-brand-wrap').style.display = 'block';
  }


  if (CUSTOM_CSS) {
    const customStyle = document.createElement('style');
    customStyle.textContent = CUSTOM_CSS;
    (document.head || document.documentElement).appendChild(customStyle);
  }

  /* ─── Refs ─────────────────────────────────────────────────────── */
  const $fab      = document.getElementById('cx-widget-button');
  const $tooltip  = document.getElementById('cx-tooltip');
  const $tipX     = document.getElementById('cx-tooltip-x');
  const $overlay  = document.getElementById('cx-overlay');
  const $modal    = document.getElementById('cx-modal');
  const $modalX   = document.getElementById('cx-modal-x');
  const $form     = document.getElementById('cx-form');
  const $formWrap = document.getElementById('cx-form-wrap');
  const $okWrap   = document.getElementById('cx-ok-wrap');
  const $submit   = document.getElementById('cx-submit');
  const $phoneInp = document.getElementById('cx-phone');

  let iti = null;
  let agentExt = null;
  let itiReady = false;

  // Real-time input filtering for phone field
  if ($phoneInp) {
    $phoneInp.addEventListener('input', function() {
      this.value = this.value.replace(/[^\d\+\-\s\(\)\.]/g, '');
    });
  }

  /* ─── Init intl-tel-input (load JS lazily on first open) ────────── */
  function initITI(done) {
    if (!$phoneInp) { done(); return; }
    if (itiReady) { done(); return; }
    addScript(`${ITI_BASE}/js/intlTelInput.min.js`, function() {
      iti = window.intlTelInput($phoneInp, {
        utilsScript: `${ITI_BASE}/js/utils.js`,
        initialCountry: 'auto',
        geoIpLookup: function(cb) {
          fetch('https://ipapi.co/json/')
            .then(r => r.json()).then(d => cb(d.country_code))
            .catch(() => cb('ae'));
        },
        preferredCountries: ['ae', 'sa', 'us', 'gb', 'in'],
        countrySearch: true,
        dropdownContainer: document.body,
      });
      itiReady = true;
      done();
    });
  }

  /* ─── Open ─────────────────────────────────────────────────────── */
  $fab.addEventListener('click', async () => {
    const activeCallId = sessionStorage.getItem('cx_active_call_id');
    if (activeCallId) {
      await checkActiveCall();
      return;
    }

    $modal.classList.add('show');
    $overlay.classList.add('show');
    $tooltip.style.display = 'none';
    $fab.style.animation = 'none';

    initITI(() => {}); // fire and forget — ITI loads in background

    if (LOGO_URL && THEME_STYLE !== 'split' && THEME_STYLE !== 'floating') {
      document.getElementById('cx-logo-wrap').style.display = 'block';
    }

    // Fetch agent or show offline card
    if (OFFICE_CLOSED) {
      document.getElementById('cx-agent').style.display = '';
    } else if (SHOW_AGENT) {
      try {
        const r = await fetch(`${SERVER_URL}/api/widget/${WIDGET_ID}/available-agents`);
        if (r.ok) {
          const { agents } = await r.json();
          if (agents && agents.length > 0) {
            window.cxAvailableAgents = agents;
            
            // Retrieve last shown index from sessionStorage for round-robin starting agent
            let cxAgentIndex = parseInt(sessionStorage.getItem('cx_last_agent_index') || '-1', 10);
            cxAgentIndex = (cxAgentIndex + 1) % window.cxAvailableAgents.length;
            sessionStorage.setItem('cx_last_agent_index', cxAgentIndex);

            function displayAgent(agent) {
              if (!agent) return;
              agentExt = agent.extension;
              const $ag = document.getElementById('cx-agent');
              const $av = document.getElementById('cx-av');
              const $name = document.getElementById('cx-av-name');
              const $sub = document.getElementById('cx-av-sub');
              
              if ($av) {
                $av.src = agent.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.firstName)}&background=${PRIMARY.replace('#','')}&color=fff&size=128`;
                $av.style.display = 'block';
              }
              if ($name) {
                $name.textContent = `${agent.firstName} ${agent.lastName || ''}`.trim();
              }
              if ($sub) {
                $sub.textContent = AV_STATUS || 'Will answer your call';
              }
              if ($ag) $ag.style.display = '';
            }

            // Show starting agent immediately
            displayAgent(window.cxAvailableAgents[cxAgentIndex]);

            const $ringSvg = document.querySelector('.cx-av-ring-svg');
            const $ring = document.getElementById('cx-av-ring');
            const circumference = 2 * Math.PI * 33; // ~207.35

            if ($ringSvg) {
              // Hide ring if rotation is disabled or if there's only 1 agent
              if (!AGENT_ROTATION_ENABLED || window.cxAvailableAgents.length <= 1) {
                $ringSvg.style.display = 'none';
              } else {
                $ringSvg.style.display = '';
                if ($ring) {
                  $ring.style.strokeDasharray = circumference;
                  $ring.style.strokeDashoffset = circumference;
                }
              }
            }

            // Cycle agents every 15 seconds with smooth progress ring updates (if enabled)
            if (window.cxAgentCycleInterval) clearInterval(window.cxAgentCycleInterval);
            if (AGENT_ROTATION_ENABLED && window.cxAvailableAgents.length > 1) {
              let elapsedMs = 0;
              const cycleDuration = 15000;
              const stepMs = 100;

              window.cxAgentCycleInterval = setInterval(() => {
                const $okWrap = document.getElementById('cx-ok-wrap');
                if ($okWrap && $okWrap.style.display === 'block') {
                  clearInterval(window.cxAgentCycleInterval);
                  return;
                }

                elapsedMs += stepMs;
                
                // Update ring dashoffset
                if ($ring) {
                  const progress = Math.min(1, elapsedMs / cycleDuration);
                  $ring.style.strokeDashoffset = circumference * (1 - progress);
                }

                if (elapsedMs >= cycleDuration) {
                  elapsedMs = 0;
                  
                  // Rotate with fade animation targeting agent content wrapper
                  const $content = document.getElementById('cx-agent-content');
                  if ($content) {
                    $content.classList.add('cx-fade-out');
                    setTimeout(() => {
                      cxAgentIndex = (cxAgentIndex + 1) % window.cxAvailableAgents.length;
                      sessionStorage.setItem('cx_last_agent_index', cxAgentIndex);
                      displayAgent(window.cxAvailableAgents[cxAgentIndex]);
                      $content.classList.remove('cx-fade-out');
                    }, 220);
                  }
                }
              }, stepMs);
            }
          }
        }
      } catch {}
    }
  });

  /* ─── Close ─────────────────────────────────────────────────────── */
  function closeAll() {
    $modal.classList.remove('show');
    $overlay.classList.remove('show');
    
    const activeCallId = sessionStorage.getItem('cx_active_call_id');
    if (!activeCallId) {
      setTimeout(reset, 300);
    }
  }
  function reset() {
    if (window.cxTimerInterval) {
      clearInterval(window.cxTimerInterval);
      window.cxTimerInterval = null;
    }
    if (window.cxAgentCycleInterval) {
      clearInterval(window.cxAgentCycleInterval);
      window.cxAgentCycleInterval = null;
    }
    $formWrap.style.display = 'block';
    $okWrap.style.display   = 'none';
    $form.reset();
    const $phoneErr = document.getElementById('cx-phone-err');
    if ($phoneErr) $phoneErr.style.display = 'none';
    $submit.disabled = false;
    $submit.textContent = OFFICE_CLOSED ? 'Submit Inquiry' : (BTN_TEXT || 'Call me!');
    document.getElementById('cx-agent').style.display = 'none';
    agentExt = null;
  }


  $modalX.addEventListener('click', closeAll);
  // $overlay.addEventListener('click', closeAll); // Clicking outside does not close the widget now
  $tipX.addEventListener('click', e => { e.stopPropagation(); $tooltip.style.display = 'none'; });
  if (TOOLTIP_AUTOHIDE) {
    setTimeout(() => { $tooltip && ($tooltip.style.display = 'none'); }, TOOLTIP_AUTOHIDE_SEC * 1000);
  }

  /* ─── Submit ────────────────────────────────────────────────────── */
  $form.addEventListener('submit', async e => {
    e.preventDefault();
    const $phoneErr = document.getElementById('cx-phone-err');
    if ($phoneErr) $phoneErr.style.display = 'none';

    const firstName = document.getElementById('cx-fname') ? document.getElementById('cx-fname').value.trim() : '';
    const lastName  = document.getElementById('cx-lname')  ? document.getElementById('cx-lname').value.trim()  : '';
    const email     = document.getElementById('cx-email')  ? document.getElementById('cx-email').value.trim()  : '';

    // Validate phone
    let phone = '';
    const rawVal = $phoneInp ? $phoneInp.value.trim() : '';
    const cleanDigits = rawVal.replace(/[\s\-\+\(\)\.]/g, '');

    if (!rawVal || /[a-zA-Z]/.test(rawVal) || !/^\d{7,15}$/.test(cleanDigits)) {
      if ($phoneErr) {
        $phoneErr.textContent = 'Please enter a valid phone number (7 to 15 digits).';
        $phoneErr.style.display = 'block';
      }
      if ($phoneInp) $phoneInp.focus();
      return;
    }

    if (iti && $phoneInp) {
      if (!iti.isValidNumber()) {
        if ($phoneErr) {
          $phoneErr.textContent = 'Please enter a valid phone number for the selected country.';
          $phoneErr.style.display = 'block';
        }
        $phoneInp.focus();
        return;
      }
      phone = iti.getNumber().replace(/^\+/, '');
    } else if ($phoneInp) {
      phone = cleanDigits;
    }

    if ($form.checkValidity && !$form.checkValidity()) {
      alert('Please fill all required fields correctly.');
      return;
    }

    $submit.disabled = true;
    $submit.textContent = OFFICE_CLOSED ? 'Submitting…' : 'Connecting…';

    try {
      const res = await fetch(`${SERVER_URL}/api/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId: WIDGET_ID, firstName, lastName, email, phone, agentExtension: agentExt }),
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        const callId = d.callId;

        $formWrap.style.display = 'none';
        $okWrap.style.display   = 'block';

        const $badgeContainer = document.getElementById('cx-success-badge-container');

        if ($badgeContainer) {
          if (OFFICE_CLOSED) {
            $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${SUCCESS_ICON_STYLE}">${SUCCESS_ICON}</span>`;
          } else {
            if (callId) {
              sessionStorage.setItem('cx_active_call_id', callId);
              sessionStorage.setItem('cx_call_start_time', Date.now());
              sessionStorage.setItem('cx_call_start_duration', RING_TIMEOUT || 55);
            }
            startCallMonitoring(callId, false);
          }
        }
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || 'Something went wrong. Please try again.');
        $submit.disabled = false;
        $submit.textContent = OFFICE_CLOSED ? 'Submit Inquiry' : (BTN_TEXT || 'Call me!');
      }
    } catch {
      alert('Network error. Please try again.');
      $submit.disabled = false;
      $submit.textContent = OFFICE_CLOSED ? 'Submit Inquiry' : (BTN_TEXT || 'Call me!');
    }
  });

  // Call monitoring function
  function startCallMonitoring(callId, isAlreadyAnswered, initialSecondsOverride) {
    const $badgeContainer = document.getElementById('cx-success-badge-container');
    const $successHeadline = document.getElementById('cx-ok-wrap') ? document.getElementById('cx-ok-wrap').querySelector('h3') : null;
    const $successMsg = document.getElementById('cx-ok-wrap') ? document.getElementById('cx-ok-wrap').querySelector('p') : null;

    if (!$badgeContainer) return;

    if (isAlreadyAnswered) {
      $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${SUCCESS_ICON_STYLE}">${SUCCESS_ICON}</span>`;
      if ($successHeadline) $successHeadline.textContent = 'Call Connected!';
      if ($successMsg) $successMsg.textContent = 'You are now connected with our agent. Enjoy talking!';
      
      // Still poll for completion/fail to clean up storage
      if (window.cxStatusPollInterval) clearInterval(window.cxStatusPollInterval);
      window.cxStatusPollInterval = setInterval(async () => {
        try {
          const sResp = await fetch(`${SERVER_URL}/api/call/${callId}/status`);
          if (sResp.ok) {
            const statusData = await sResp.json();
            if (['Completed', 'Failed', 'Missed', 'Abandoned'].includes(statusData.status) || ['Completed', 'Failed', 'Missed', 'Abandoned'].includes(statusData.outcome)) {
              clearInterval(window.cxStatusPollInterval);
              sessionStorage.removeItem('cx_active_call_id');
              sessionStorage.removeItem('cx_call_start_time');
              sessionStorage.removeItem('cx_call_start_duration');
            }
          }
        } catch (e) {}
      }, 3000);
      return;
    }

    const maxSeconds = RING_TIMEOUT || 55;
    let secondsLeft = initialSecondsOverride !== undefined ? initialSecondsOverride : maxSeconds;

    $badgeContainer.innerHTML = `
      <div class="cx-timer-wrap">
        <svg class="cx-timer-svg" viewBox="0 0 80 80">
          <circle class="cx-timer-bg" cx="40" cy="40" r="34" />
          <circle class="cx-timer-progress" id="cx-timer-circle" cx="40" cy="40" r="34" />
        </svg>
        <div class="cx-timer-text" id="cx-timer-countdown">${secondsLeft}</div>
      </div>
    `;
    
    const $circle = document.getElementById('cx-timer-circle');
    const $text = document.getElementById('cx-timer-countdown');
    const circumference = 2 * Math.PI * 34; // ~213.63
    
    if ($circle) {
      $circle.style.strokeDasharray = circumference;
      const initialOffset = circumference * (1 - secondsLeft / maxSeconds);
      $circle.style.strokeDashoffset = initialOffset;
    }
    
    if (window.cxTimerInterval) clearInterval(window.cxTimerInterval);
    if (window.cxStatusPollInterval) clearInterval(window.cxStatusPollInterval);

    // 1. Timer countdown loop
    window.cxTimerInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft < 0) {
        clearInterval(window.cxTimerInterval);
        clearInterval(window.cxStatusPollInterval);
        $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${SUCCESS_ICON_STYLE}">${SUCCESS_ICON}</span>`;
        sessionStorage.removeItem('cx_active_call_id');
        sessionStorage.removeItem('cx_call_start_time');
        sessionStorage.removeItem('cx_call_start_duration');
        return;
      }
      if ($text) $text.textContent = secondsLeft;
      if ($circle) {
        const offset = circumference * (1 - secondsLeft / maxSeconds);
        $circle.style.strokeDashoffset = offset;
      }
    }, 1000);

    // 2. Real-time call status polling loop (every 2.5s)
    if (callId) {
      window.cxStatusPollInterval = setInterval(async () => {
        try {
          const sResp = await fetch(`${SERVER_URL}/api/call/${callId}/status`);
          if (sResp.ok) {
            const statusData = await sResp.json();
            
            // A. If call is Answered
            if (statusData.status === 'Answered') {
              clearInterval(window.cxTimerInterval);
              window.cxTimerInterval = null;
              $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${SUCCESS_ICON_STYLE}">${SUCCESS_ICON}</span>`;
              if ($successHeadline) $successHeadline.textContent = 'Call Connected!';
              if ($successMsg) $successMsg.textContent = 'You are now connected with our agent. Enjoy talking!';
            }
            
            // B. If call failed/completed/missed
            if (['Completed', 'Failed', 'Missed', 'Abandoned'].includes(statusData.status) || ['Completed', 'Failed', 'Missed', 'Abandoned'].includes(statusData.outcome)) {
              clearInterval(window.cxTimerInterval);
              clearInterval(window.cxStatusPollInterval);
              sessionStorage.removeItem('cx_active_call_id');
              sessionStorage.removeItem('cx_call_start_time');
              sessionStorage.removeItem('cx_call_start_duration');

              if (statusData.status === 'Completed' || statusData.outcome === 'Answered') {
                $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${SUCCESS_ICON_STYLE}">${SUCCESS_ICON}</span>`;
                if ($successHeadline) $successHeadline.textContent = 'Call Finished';
                if ($successMsg) $successMsg.textContent = 'Thank you for talking with us!';
              } else {
                $badgeContainer.innerHTML = `<span class="cx-ok-icon" style="${FAILED_ICON_STYLE}">${FAILED_ICON}</span>`;
                if ($successHeadline) $successHeadline.textContent = 'All Agents Busy';
                if ($successMsg) $successMsg.textContent = 'We apologize. All agents are currently busy. We have saved your details and will call you back shortly!';
              }
              return;
            }

            // C. If active extension changed (failover retry!)
            if (statusData.agentExtension) {
              const $av = document.getElementById('cx-av');
              const $name = document.getElementById('cx-av-name');
              const $sub = document.getElementById('cx-av-sub');
              
              if ($av && statusData.agentAvatarUrl) {
                $av.src = statusData.agentAvatarUrl;
              } else if ($av && statusData.agentName) {
                $av.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(statusData.agentName)}&background=${PRIMARY.replace('#','')}&color=fff&size=128`;
              }
              
              if ($name && statusData.agentName) {
                $name.textContent = statusData.agentName;
              }
              if ($sub) {
                $sub.textContent = `Dialing (Ext ${statusData.agentExtension})...`;
              }
            }
          }
        } catch (e) {
          console.error('[3CX] Status poll failed:', e.message);
        }
      }, 2500);
    }
  }

  // Active call recovery function
  async function checkActiveCall() {
    const activeCallId = sessionStorage.getItem('cx_active_call_id');
    if (!activeCallId) return;

    try {
      const sResp = await fetch(`${SERVER_URL}/api/call/${activeCallId}/status`);
      if (sResp.ok) {
        const statusData = await sResp.json();
        
        // If the call is still in progress
        if (['Initiated', 'Ringing', 'Answered'].includes(statusData.status)) {
          // Open the widget automatically
          $modal.classList.add('show');
          $overlay.classList.add('show');
          $tooltip.style.display = 'none';
          $fab.style.animation = 'none';
          
          initITI(() => {});
          
          // Show success screen
          $formWrap.style.display = 'none';
          $okWrap.style.display   = 'block';
          
          // Resume agent info display
          if (statusData.agentExtension) {
            const $ag = document.getElementById('cx-agent');
            const $av = document.getElementById('cx-av');
            const $name = document.getElementById('cx-av-name');
            const $sub = document.getElementById('cx-av-sub');
            
            if ($av) {
              $av.src = statusData.agentAvatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(statusData.agentName || 'Agent')}&background=${PRIMARY.replace('#','')}&color=fff&size=128`;
              $av.style.display = 'block';
            }
            if ($name && statusData.agentName) {
              $name.textContent = statusData.agentName;
            }
            if ($sub) {
              $sub.textContent = statusData.status === 'Answered' ? 'Call Connected!' : `Dialing (Ext ${statusData.agentExtension})...`;
            }
            if ($ag) $ag.style.display = '';
          }
          
          // Calculate remaining seconds
          let remaining = undefined;
          const startTimeStr = sessionStorage.getItem('cx_call_start_time');
          const durationStr = sessionStorage.getItem('cx_call_start_duration');
          if (startTimeStr && statusData.status !== 'Answered') {
            const startTime = parseInt(startTimeStr, 10);
            const duration = parseInt(durationStr, 10) || (RING_TIMEOUT || 55);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            remaining = Math.max(0, duration - elapsed);
          }

          // Start monitoring
          startCallMonitoring(activeCallId, statusData.status === 'Answered', remaining);
        } else {
          sessionStorage.removeItem('cx_active_call_id');
          sessionStorage.removeItem('cx_call_start_time');
          sessionStorage.removeItem('cx_call_start_duration');
          reset();
        }
      } else {
        sessionStorage.removeItem('cx_active_call_id');
        sessionStorage.removeItem('cx_call_start_time');
        sessionStorage.removeItem('cx_call_start_duration');
        reset();
      }
    } catch (e) {
      console.error('[3CX] Active call restoration failed:', e);
      sessionStorage.removeItem('cx_active_call_id');
      sessionStorage.removeItem('cx_call_start_time');
      sessionStorage.removeItem('cx_call_start_duration');
      reset();
    }
  }

  // Restore active call on load
  checkActiveCall();

})();
