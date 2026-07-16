/**
 * HRTrader — Browser console script (Multi-Platform: Quotex & Pocket Option)
 * Paste entire file into DevTools Console (F12) on the trading platform page.
 */
(function () {
  if (window.__HRTrader_ACTIVE__) {
    console.warn("HRTrader already running.");
    return;
  }

  const HRTrader_PASSWORD = "ilovehr420";
  const PW_STORAGE_KEY = "hrtrader_saved_password";

  function getSavedPassword() {
    try {
      return (
        localStorage.getItem(PW_STORAGE_KEY) ||
        sessionStorage.getItem(PW_STORAGE_KEY) ||
        ""
      );
    } catch {
      return "";
    }
  }

  function rememberPassword(pw) {
    try {
      localStorage.setItem(PW_STORAGE_KEY, pw);
    } catch {
      try {
        sessionStorage.setItem(PW_STORAGE_KEY, pw);
      } catch {
        /* ignore */
      }
    }
  }

  function showPasswordGate(onSuccess) {
    const loginStyle = document.createElement("style");
    loginStyle.id = "hrtrader-login-style";
    loginStyle.textContent = `
      #hrtrader-login-overlay {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.72);
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }
      #hrtrader-login-box {
        width: min(320px, calc(100vw - 32px));
        padding: 22px 20px 18px;
        border-radius: 14px;
        background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%);
        border: 1px solid rgba(0, 255, 102, 0.4);
        box-shadow: 0 0 50px rgba(0, 255, 102, 0.2);
      }
      #hrtrader-login-box h3 {
        margin: 0 0 6px;
        text-align: center;
        color: #00ff66;
        font-size: 18px;
        letter-spacing: 0.08em;
      }
      #hrtrader-login-box p {
        margin: 0 0 14px;
        text-align: center;
        font-size: 12px;
        color: #9fd4ad;
      }
      #hrtrader-login-input {
        box-sizing: border-box;
        width: 100%;
        padding: 11px 12px;
        border-radius: 8px;
        border: 1px solid rgba(0, 255, 102, 0.35);
        background: rgba(0, 0, 0, 0.4);
        color: #fff;
        font-size: 15px;
        outline: none;
      }
      #hrtrader-login-input:focus {
        border-color: #00ff66;
        box-shadow: 0 0 0 2px rgba(0, 255, 102, 0.2);
      }
      #hrtrader-login-btn {
        width: 100%;
        margin-top: 12px;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: #00ff66;
        color: #052210;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      #hrtrader-login-err {
        min-height: 18px;
        margin-top: 8px;
        text-align: center;
        font-size: 12px;
        color: #ff6b6b;
        font-weight: 600;
      }
    `;
    document.head.appendChild(loginStyle);

    const overlay = document.createElement("div");
    overlay.id = "hrtrader-login-overlay";
    overlay.innerHTML = `
      <div id="hrtrader-login-box">
        <h3>HRTrader Login</h3>
        <p>Enter password to continue</p>
        <input id="hrtrader-login-input" type="password" autocomplete="current-password" />
        <button type="button" id="hrtrader-login-btn">Enter</button>
        <p id="hrtrader-login-err"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector("#hrtrader-login-input");
    const errEl = overlay.querySelector("#hrtrader-login-err");
    const btn = overlay.querySelector("#hrtrader-login-btn");

    input.value = getSavedPassword();

    function tryLogin() {
      const pw = input.value;
      if (pw === HRTrader_PASSWORD) {
        rememberPassword(pw);
        overlay.remove();
        loginStyle.remove();
        initHRTrader();
        return;
      }
      errEl.textContent = "Wrong password";
      input.focus();
      input.select();
    }

    btn.addEventListener("click", tryLogin);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        tryLogin();
      }
    });

    setTimeout(() => input.focus(), 50);
    if (input.value) {
      setTimeout(() => input.select(), 60);
    }
  }

  function initHRTrader() {
    window.__HRTrader_ACTIVE__ = true;

  const LOGO_URL =
    "https://cdn.phototourl.com/free/2026-07-16-8d5127f8-ef94-4f14-8f35-627a4e8d9409.png";
  const LABEL = "HRTrader";
  const STORAGE_KEY = "hrtrader_settings_v1";
  const TAP_REQUIRED = 3;
  const TAP_SETTLE_MS = 380;
  const TAP_SEQUENCE_MS = 650;

  const defaults = {
    delaySec: 10,
    direction: "random",
    maxTrades: 20,
    minPayout: 70,
    showGrid: false,
    shutdownMin: 30,
    pendingTime: "",
    pendingDir: "up",
    pendingEnabled: false,
    delayMode: "manual",
    gridLineCount: 5,
    gridLinePositions: null,
    autoTradeEnabled: false,
    autoTradeDurationMin: 30,
    analysisMode: false,
    analysisMaxWaitMin: 10,
    strategies: { emaRsi: true, pattern: true, runningCandle: false },
    strategyMatchMode: "all",
    apiKey: "",
    tradingPair: "EUR/USD",
  };

  function getSafeFutureTimeHHMM() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function parseStored(raw) {
    if (!raw) return null;
    const s = JSON.parse(raw);
    const delaySec = Math.max(1, Math.min(120, Number(s.delaySec) || defaults.delaySec));
    const direction = ["up", "down", "random"].includes(s.direction)
      ? s.direction
      : defaults.direction;
    const maxTrades = Math.max(1, Number(s.maxTrades) || defaults.maxTrades);
    const minPayout = Math.max(1, Math.min(100, Number(s.minPayout) || defaults.minPayout));
    const showGrid = Boolean(s.showGrid);
    const shutdownMin = Math.max(1, Number(s.shutdownMin) || defaults.shutdownMin);
    const pendingDir = ["up", "down"].includes(s.pendingDir) ? s.pendingDir : defaults.pendingDir;
    const pendingEnabled = Boolean(s.pendingEnabled);
    const pendingTime = /^\d{1,2}:\d{2}$/.test(s.pendingTime) ? s.pendingTime : getSafeFutureTimeHHMM();
    const delayMode = ["auto", "manual"].includes(s.delayMode) ? s.delayMode : defaults.delayMode;
    const gridLineCount = Math.max(1, Math.min(30, Number(s.gridLineCount) || defaults.gridLineCount));
    const gridLinePositions = Array.isArray(s.gridLinePositions) ? s.gridLinePositions : null;
    const autoTradeEnabled = Boolean(s.autoTradeEnabled);
    const autoTradeDurationMin = Math.max(1, Number(s.autoTradeDurationMin) || defaults.autoTradeDurationMin);
    const analysisMode = Boolean(s.analysisMode);
    const analysisMaxWaitMin = Math.max(1, Number(s.analysisMaxWaitMin) || defaults.analysisMaxWaitMin);
    const strategies = {
      emaRsi:
        s.strategies && typeof s.strategies.emaRsi === "boolean" ? s.strategies.emaRsi : defaults.strategies.emaRsi,
      pattern:
        s.strategies && typeof s.strategies.pattern === "boolean"
          ? s.strategies.pattern
          : defaults.strategies.pattern,
      runningCandle:
        s.strategies && typeof s.strategies.runningCandle === "boolean"
          ? s.strategies.runningCandle
          : defaults.strategies.runningCandle,
    };
    const strategyMatchMode = ["any", "all"].includes(s.strategyMatchMode)
      ? s.strategyMatchMode
      : defaults.strategyMatchMode;
    const apiKey = typeof s.apiKey === "string" ? s.apiKey.trim() : defaults.apiKey;
    const tradingPair = typeof s.tradingPair === "string" && s.tradingPair.trim() ? s.tradingPair.trim() : defaults.tradingPair;
    return {
      delaySec,
      direction,
      maxTrades,
      minPayout,
      showGrid,
      shutdownMin,
      pendingTime,
      pendingDir,
      pendingEnabled,
      delayMode,
      gridLineCount,
      gridLinePositions,
      autoTradeEnabled,
      autoTradeDurationMin,
      analysisMode,
      analysisMaxWaitMin,
      strategies,
      strategyMatchMode,
      apiKey,
      tradingPair,
    };
  }

  function loadSettings() {
    const sources = [
      () => localStorage.getItem(STORAGE_KEY),
      () => sessionStorage.getItem(STORAGE_KEY),
      () => {
        const b = window.__HRTrader_SETTINGS_BACKUP__;
        return b ? JSON.stringify(b) : null;
      },
    ];
    for (const get of sources) {
      try {
        const parsed = parseStored(get());
        if (parsed) return parsed;
      } catch {
        /* try next */
      }
    }
    return { ...defaults };
  }

  function saveSettings(s) {
    const json = JSON.stringify(s);
    window.__HRTrader_SETTINGS_BACKUP__ = { ...s };
    let ok = false;
    try {
      localStorage.setItem(STORAGE_KEY, json);
      ok = true;
    } catch {
      /* blocked */
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, json);
      ok = true;
    } catch {
      /* blocked */
    }
    return ok;
  }

  let settings = loadSettings();

  let sessionStats = {
    tradesCount: 0,
    winCount: 0,
    lossCount: 0,
    lastDirection: "up",
  };

  let shutdownTimerTimeout = null;
  let pendingAnimationId = null;
  let pendingBackupInterval = null;
  let autoTradeTimeout = null;
  let autoTradeEndTime = null;
  let analysisCache = { direction: null, timestamp: 0 };

  // চার্ট গ্রিড ওভারলে — শুধু Horizontal লাইন, সংখ্যা ও অবস্থান কাস্টমাইজযোগ্য
  const gridOverlay = document.createElement("div");
  gridOverlay.id = "hrtrader-grid-overlay";
  gridOverlay.style.cssText =
    "position:fixed; inset:0; z-index:5; pointer-events:none; display:none;";
  document.body.appendChild(gridOverlay);

  function buildGridLines() {
    gridOverlay.innerHTML = "";
    const count = Math.max(1, Math.min(30, settings.gridLineCount || 5));
    let positions = settings.gridLinePositions;
    if (!Array.isArray(positions) || positions.length !== count) {
      positions = Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * 100);
      settings.gridLinePositions = positions;
    }
    positions.forEach((pos, idx) => {
      const line = document.createElement("div");
      line.className = "hrtrader-grid-line";
      line.style.cssText = `position:absolute; left:0; right:0; top:${pos}%; height:16px; margin-top:-8px; pointer-events:auto; cursor:ns-resize; touch-action:none;`;
      const tick = document.createElement("div");
      tick.style.cssText =
        "position:absolute; left:0; right:0; top:8px; border-top:1px dashed rgba(0,255,102,0.4);";
      line.appendChild(tick);

      let dragging = false;
      const onDrag = (clientY) => {
        const rect = gridOverlay.getBoundingClientRect();
        let pct = ((clientY - rect.top) / rect.height) * 100;
        pct = Math.max(0, Math.min(100, pct));
        line.style.top = pct + "%";
        settings.gridLinePositions[idx] = pct;
      };
      line.addEventListener("pointerdown", (e) => {
        dragging = true;
        try {
          line.setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      line.addEventListener("pointermove", (e) => {
        if (dragging) onDrag(e.clientY);
      });
      line.addEventListener("pointerup", () => {
        if (dragging) {
          dragging = false;
          saveSettings(settings);
        }
      });
      gridOverlay.appendChild(line);
    });
  }

  function toggleGrid(show) {
    gridOverlay.style.display = show ? "block" : "none";
    if (show) buildGridLines();
  }
  toggleGrid(settings.showGrid);

  const style = document.createElement("style");
  style.textContent = `
    #hrtrader-widget {
      position: fixed;
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: grab;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45));
      transition: filter 0.25s ease;
    }
    #hrtrader-widget.hrtrader-glow {
      filter: drop-shadow(0 0 12px #00ff66) drop-shadow(0 0 28px #00ff66)
        drop-shadow(0 0 48px rgba(0,255,102,0.55));
    }
    #hrtrader-widget:active { cursor: grabbing; }
    #hrtrader-logo-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      background: rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    #hrtrader-logo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
    #hrtrader-label {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #fff;
      text-shadow: 0 1px 4px rgba(0,0,0,0.8);
      pointer-events: none;
    }
    #hrtrader-widget.hrtrader-glow #hrtrader-label {
      color: #b8ffd4;
      text-shadow: 0 0 8px #00ff66, 0 0 18px #00ff66, 0 0 32px rgba(0,255,102,0.8);
    }
    #hrtrader-scan-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483645;
      pointer-events: none;
      overflow: hidden;
      display: none;
    }
    #hrtrader-scan-overlay.hrtrader-scan-on { display: block; }
    #hrtrader-scan-line {
      position: absolute;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(
        180deg,
        #3ad67f 0%,
        #22c464 16%,
        #14ad56 40%,
        #009e4a 58%,
        #008a40 82%,
        rgba(0, 110, 48, 0.55) 100%
      );
      box-shadow:
        0 -88px 130px rgba(0, 220, 115, 1),
        0 -68px 100px rgba(0, 200, 100, 1),
        0 -50px 78px rgba(0, 185, 92, 0.98),
        0 -34px 58px rgba(0, 170, 85, 0.96),
        0 -22px 40px rgba(0, 155, 78, 0.94),
        0 -12px 26px rgba(0, 140, 72, 0.9),
        0 -6px 14px rgba(0, 125, 65, 0.88),
        0 0 28px rgba(0, 150, 75, 0.85),
        0 0 55px rgba(0, 130, 65, 0.55);
      top: -8%;
      animation: hrtrader-scan-move 1.45s linear infinite;
    }
    @keyframes hrtrader-scan-move {
      0% { top: -8%; }
      100% { top: 108%; }
    }
    #hrtrader-panel {
      position: fixed;
      z-index: 2147483647;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      opacity: 0;
      pointer-events: none;
      width: min(300px, calc(100vw - 32px));
      max-height: calc(100vh - 48px);
      max-height: calc(100dvh - 48px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
      padding: 18px 16px 14px;
      border-radius: 14px;
      background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%);
      border: 1px solid rgba(0,255,102,0.35);
      box-shadow: 0 0 40px rgba(0,255,102,0.25), 0 12px 40px rgba(0,0,0,0.55);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #e8ffe8;
    }
    #hrtrader-panel::-webkit-scrollbar {
      width: 5px;
    }
    #hrtrader-panel::-webkit-scrollbar-thumb {
      background: rgba(0,255,102,0.35);
      border-radius: 4px;
    }
    #hrtrader-panel.hrtrader-panel-open {
      opacity: 1;
      pointer-events: auto;
    }
    #hrtrader-panel h3 {
      margin: 0 0 14px;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      color: #00ff66;
      letter-spacing: 0.06em;
    }
    #hrtrader-panel .hrtrader-row {
      margin-bottom: 14px;
    }
    #hrtrader-panel label {
      display: block;
      font-size: 12px;
      color: #9fd4ad;
      margin-bottom: 6px;
    }
    #hrtrader-panel .hrtrader-input-block {
      display: block;
      width: 100%;
    }
    #hrtrader-panel .hrtrader-time-input {
      box-sizing: border-box;
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(0,255,102,0.3);
      background: rgba(0,0,0,0.35);
      color: #fff;
      font-size: 15px;
      font-family: inherit;
      outline: none;
      -webkit-appearance: none;
      appearance: none;
    }
    #hrtrader-panel .hrtrader-time-input:focus {
      border-color: #00ff66;
      box-shadow: 0 0 0 2px rgba(0,255,102,0.2);
    }
    #hrtrader-panel .hrtrader-time-input::-webkit-outer-spin-button,
    #hrtrader-panel .hrtrader-time-input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    #hrtrader-panel .hrtrader-time-input[type="number"] {
      -moz-appearance: textfield;
    }
    #hrtrader-panel .hrtrader-save-btn {
      flex-shrink: 0;
      padding: 10px 14px;
      border: none;
      border-radius: 8px;
      background: #00ff66;
      color: #052210;
      font-weight: 700;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
    }
    #hrtrader-panel .hrtrader-save-btn:active {
      background: #00e65c;
    }
    #hrtrader-panel .hrtrader-save-btn-block {
      display: block;
      width: 100%;
      margin-top: 4px;
      padding: 12px 14px;
      font-size: 14px;
    }
    #hrtrader-dir-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #hrtrader-dir-group button {
      padding: 11px 12px;
      border-radius: 8px;
      border: 1px solid rgba(0,255,102,0.25);
      background: rgba(0,0,0,0.3);
      color: #dfffe8;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    #hrtrader-dir-group button.hrtrader-dir-active {
      background: rgba(0,255,102,0.18);
      border-color: #00ff66;
      box-shadow: 0 0 16px rgba(0,255,102,0.35);
      color: #00ff66;
    }
    #hrtrader-panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      pointer-events: none;
    }
    #hrtrader-panel-backdrop.hrtrader-backdrop-open {
      opacity: 1;
      pointer-events: auto;
    }
    #hrtrader-panel-hint {
      margin: 10px 0 0;
      font-size: 11px;
      text-align: center;
      color: #6a9a78;
      line-height: 1.35;
    }
    #hrtrader-save-status {
      min-height: 18px;
      margin: 8px 0 0;
      font-size: 12px;
      text-align: center;
      color: #00ff66;
      font-weight: 600;
    }
    #hrtrader-panel button,
    #hrtrader-panel input {
      touch-action: manipulation;
    }
    .hrtrader-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .hrtrader-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin-bottom: 14px;
    }
    .stat-badge {
      background: rgba(0,255,102,0.08);
      border: 1px solid rgba(0,255,102,0.2);
      padding: 8px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-title { font-size: 10px; color: #9fd4ad; display: block; }
    .stat-val { font-size: 14px; font-weight: 700; color: #00ff66; }
    .stat-win { color: #00ff66; }
    .stat-loss { color: #ff5252; }
    .section-divider {
      border-top: 1px dashed rgba(0, 255, 102, 0.2);
      margin: 14px 0 10px;
    }
    #hrtrader-panel h4 {
      margin: 0 0 8px;
      font-size: 12px;
      color: #00ff66;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .switch-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(0, 255, 102, 0.05);
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px dashed rgba(0, 255, 102, 0.2);
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #00ff66;
    }
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0;
      background-color: #223a2a; transition: .3s; border-radius: 20px;
      border: 1px solid rgba(0, 255, 102, 0.3);
    }
    .slider:before {
      position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px;
      background-color: #9fd4ad; transition: .3s; border-radius: 50%;
    }
    input:checked + .slider { background-color: #00ff66; border-color: #00ff66; }
    input:checked + .slider:before { transform: translateX(20px); background-color: #052210; }
    .time-control-group { display: flex; gap: 4px; align-items: center; }
    .time-btn {
      padding: 8px 10px;
      background: rgba(0, 255, 102, 0.15);
      border: 1px solid #00ff66;
      color: #00ff66;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);

  const scanOverlay = document.createElement("div");
  scanOverlay.id = "hrtrader-scan-overlay";
  scanOverlay.innerHTML = '<div id="hrtrader-scan-line"></div>';
  document.body.appendChild(scanOverlay);

  const backdrop = document.createElement("div");
  backdrop.id = "hrtrader-panel-backdrop";

  const panel = document.createElement("div");
  panel.id = "hrtrader-panel";
  panel.innerHTML = `
    <h3>HRTrader Settings</h3>

    <div class="hrtrader-grid-3">
      <div class="stat-badge"><span class="stat-title">Trades</span><span id="stat-trades" class="stat-val">0</span></div>
      <div class="stat-badge"><span class="stat-title">Win</span><span id="stat-win" class="stat-val stat-win">0</span></div>
      <div class="stat-badge"><span class="stat-title">Loss</span><span id="stat-loss" class="stat-val stat-loss">0</span></div>
    </div>

    <div class="switch-wrap">
      <span>Auto Analyze (0-60s random delay)</span>
      <label class="switch">
        <input type="checkbox" id="hrtrader-delaymode-toggle">
        <span class="slider"></span>
      </label>
    </div>

    <div class="hrtrader-row">
      <label>Scan delay (seconds) — Manual Analyze</label>
      <input id="hrtrader-delay-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" max="120" step="1" />
    </div>

    <div class="hrtrader-grid-2">
      <div class="hrtrader-row">
        <label>Max trades / session</label>
        <input id="hrtrader-maxtrades-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" />
      </div>
      <div class="hrtrader-row">
        <label>Auto-stop (min)</label>
        <input id="hrtrader-shutdown-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" />
      </div>
    </div>

    <div class="hrtrader-row">
      <label>Min payout (%)</label>
      <input id="hrtrader-minpayout-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" max="100" />
    </div>

    <div class="hrtrader-row">
      <label>Trade direction</label>
      <div id="hrtrader-dir-group">
        <button type="button" data-dir="up">Up</button>
        <button type="button" data-dir="down">Down</button>
        <button type="button" data-dir="random">Random</button>
      </div>
    </div>

    <div class="section-divider"></div>
    <h4>Auto Trade Mode</h4>

    <div class="switch-wrap">
      <span>Enable Auto Trade Mode</span>
      <label class="switch">
        <input type="checkbox" id="hrtrader-autotrade-toggle">
        <span class="slider"></span>
      </label>
    </div>

    <div class="hrtrader-row">
      <label>Run duration (minutes)</label>
      <input id="hrtrader-autotrade-duration" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" />
    </div>

    <div class="section-divider"></div>
    <h4>Pending scheduler</h4>

    <div class="switch-wrap">
      <span>Enable pending trade</span>
      <label class="switch">
        <input type="checkbox" id="hrtrader-pending-toggle">
        <span class="slider"></span>
      </label>
    </div>

    <div class="hrtrader-row">
      <label>Trade time (HH:MM)</label>
      <div class="time-control-group">
        <button type="button" class="time-btn" id="hrtrader-time-minus">-1m</button>
        <input id="hrtrader-pending-time" class="hrtrader-time-input" type="text" placeholder="HH:MM" style="text-align:center;" />
        <button type="button" class="time-btn" id="hrtrader-time-plus">+1m</button>
      </div>
    </div>

    <div class="hrtrader-row">
      <label>Pending direction</label>
      <select id="hrtrader-pending-dir" class="hrtrader-time-input hrtrader-input-block">
        <option value="up">Up</option>
        <option value="down">Down</option>
      </select>
    </div>

    <div class="section-divider"></div>
    <h4>Real Market Analysis</h4>

    <div class="switch-wrap">
      <span>Enable (EMA+RSI, real forex data)</span>
      <label class="switch">
        <input type="checkbox" id="hrtrader-analysis-toggle">
        <span class="slider"></span>
      </label>
    </div>

    <div class="hrtrader-row">
      <label>Twelve Data API key</label>
      <input id="hrtrader-apikey-input" class="hrtrader-time-input hrtrader-input-block" type="text" placeholder="আপনার API key" autocomplete="off" />
    </div>

    <div class="hrtrader-row">
      <label>Trading pair (Twelve Data format)</label>
      <input id="hrtrader-pair-input" class="hrtrader-time-input hrtrader-input-block" type="text" placeholder="EUR/USD" />
      <p style="font-size:10px; color:#9fd4ad; margin:4px 0 0;">OTC পেয়ারে real market data মেলে না — শুধু আসল ফরেক্স পেয়ারে কাজ করবে।</p>
    </div>

    <div class="hrtrader-row">
      <label>Strategies (একাধিক সিলেক্ট করা যায়)</label>
      <div class="hrtrader-row" style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <input id="hrtrader-strategy-emarsi" type="checkbox" style="width:auto;" />
        <label for="hrtrader-strategy-emarsi" style="margin:0;">EMA + RSI</label>
      </div>
      <div class="hrtrader-row" style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
        <input id="hrtrader-strategy-pattern" type="checkbox" style="width:auto;" />
        <label for="hrtrader-strategy-pattern" style="margin:0;">Candlestick Pattern</label>
      </div>
      <div class="hrtrader-row" style="display:flex; align-items:center; gap:8px;">
        <input id="hrtrader-strategy-running" type="checkbox" style="width:auto;" />
        <label for="hrtrader-strategy-running" style="margin:0;">Running Candle (চলমান candle-এর দিকে)</label>
      </div>
    </div>

    <div class="hrtrader-row">
      <label>মেলানোর নিয়ম (Match mode)</label>
      <select id="hrtrader-matchmode-select" class="hrtrader-time-input hrtrader-input-block">
        <option value="all">সবগুলো একমত হলে তবেই (কড়া, কম ট্রেড)</option>
        <option value="any">যেকোনো একটা কনফার্ম হলেই (দ্রুত, বেশি ট্রেড)</option>
      </select>
    </div>

    <div class="hrtrader-row">
      <label>Max wait for confirmed signal (min)</label>
      <input id="hrtrader-analysiswait-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" />
      <p style="font-size:10px; color:#9fd4ad; margin:4px 0 0;">সিলেক্ট করা strategy-গুলো শর্ত না মেলা পর্যন্ত অপেক্ষা করবে, random নেবে না — এত সময় পার হলে এই ট্রেড স্কিপ হবে।</p>
    </div>

    <div class="section-divider"></div>
    <h4>Chart grid</h4>

    <div class="hrtrader-row" style="display:flex; align-items:center; gap:8px;">
      <input id="hrtrader-grid-toggle" type="checkbox" style="width:auto;" />
      <label for="hrtrader-grid-toggle" style="margin:0;">Show horizontal grid lines</label>
    </div>

    <div class="hrtrader-row">
      <label>Number of lines</label>
      <input id="hrtrader-gridcount-input" class="hrtrader-time-input hrtrader-input-block" type="number" min="1" max="30" />
      <p style="font-size:10px; color:#9fd4ad; margin:4px 0 0;">লাইনগুলো সরাসরি চার্টের উপর ড্র্যাগ করে অবস্থান বদলানো যায়।</p>
    </div>

    <button type="button" id="hrtrader-save-all" class="hrtrader-save-btn hrtrader-save-btn-block">Save</button>
    <p id="hrtrader-save-status"></p>
    <p id="hrtrader-panel-hint">3 taps on icon to open · tap outside to close</p>
  `;
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  panel.addEventListener("mousedown", (e) => e.stopPropagation());
  panel.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  panel.addEventListener("touchend", (e) => e.stopPropagation());

  const delayInput = panel.querySelector("#hrtrader-delay-input");
  const delayModeToggle = panel.querySelector("#hrtrader-delaymode-toggle");
  const maxTradesInput = panel.querySelector("#hrtrader-maxtrades-input");
  const shutdownInput = panel.querySelector("#hrtrader-shutdown-input");
  const minPayoutInput = panel.querySelector("#hrtrader-minpayout-input");
  const pendingTimeInput = panel.querySelector("#hrtrader-pending-time");
  const pendingDirSelect = panel.querySelector("#hrtrader-pending-dir");
  const pendingToggle = panel.querySelector("#hrtrader-pending-toggle");
  const gridToggle = panel.querySelector("#hrtrader-grid-toggle");
  const gridCountInput = panel.querySelector("#hrtrader-gridcount-input");
  const autoTradeToggle = panel.querySelector("#hrtrader-autotrade-toggle");
  const autoTradeDurationInput = panel.querySelector("#hrtrader-autotrade-duration");
  const analysisToggle = panel.querySelector("#hrtrader-analysis-toggle");
  const apiKeyInput = panel.querySelector("#hrtrader-apikey-input");
  const pairInput = panel.querySelector("#hrtrader-pair-input");
  const analysisWaitInput = panel.querySelector("#hrtrader-analysiswait-input");
  const strategyEmaRsiCheckbox = panel.querySelector("#hrtrader-strategy-emarsi");
  const strategyPatternCheckbox = panel.querySelector("#hrtrader-strategy-pattern");
  const strategyRunningCheckbox = panel.querySelector("#hrtrader-strategy-running");
  const matchModeSelect = panel.querySelector("#hrtrader-matchmode-select");
  const statTrades = panel.querySelector("#stat-trades");
  const statWin = panel.querySelector("#stat-win");
  const statLoss = panel.querySelector("#stat-loss");
  const saveStatus = panel.querySelector("#hrtrader-save-status");
  const dirButtons = panel.querySelectorAll("#hrtrader-dir-group button");
  let saveStatusTimer = null;
  let pendingDirection = settings.direction;

  function modifyMinutes(amount) {
    const cur = pendingTimeInput.value.trim();
    const parts = cur.split(":");
    let hh = parseInt(parts[0], 10) || 0;
    let mm = parseInt(parts[1], 10) || 0;
    const d = new Date();
    d.setHours(hh);
    d.setMinutes(mm + amount);
    pendingTimeInput.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function syncDirectionUI(dir) {
    dirButtons.forEach((btn) => {
      btn.classList.toggle("hrtrader-dir-active", btn.dataset.dir === dir);
    });
  }

  function syncPanelUI() {
    delayInput.value = String(settings.delaySec);
    delayModeToggle.checked = settings.delayMode === "auto";
    delayInput.disabled = settings.delayMode === "auto";
    maxTradesInput.value = String(settings.maxTrades);
    shutdownInput.value = String(settings.shutdownMin);
    minPayoutInput.value = String(settings.minPayout);
    pendingTimeInput.value = settings.pendingTime || getSafeFutureTimeHHMM();
    pendingDirSelect.value = settings.pendingDir;
    pendingToggle.checked = settings.pendingEnabled;
    gridToggle.checked = settings.showGrid;
    gridCountInput.value = String(settings.gridLineCount);
    autoTradeToggle.checked = settings.autoTradeEnabled;
    autoTradeDurationInput.value = String(settings.autoTradeDurationMin);
    analysisToggle.checked = settings.analysisMode;
    apiKeyInput.value = settings.apiKey;
    pairInput.value = settings.tradingPair;
    analysisWaitInput.value = String(settings.analysisMaxWaitMin);
    strategyEmaRsiCheckbox.checked = settings.strategies.emaRsi;
    strategyPatternCheckbox.checked = settings.strategies.pattern;
    strategyRunningCheckbox.checked = settings.strategies.runningCandle;
    matchModeSelect.value = settings.strategyMatchMode;

    pendingDirection = settings.direction;
    syncDirectionUI(pendingDirection);

    statTrades.textContent = sessionStats.tradesCount;
    statWin.textContent = sessionStats.winCount;
    statLoss.textContent = sessionStats.lossCount;
  }

  function openPanel() {
    syncPanelUI();
    backdrop.classList.add("hrtrader-backdrop-open");
    panel.classList.add("hrtrader-panel-open");
  }

  function closePanel() {
    backdrop.classList.remove("hrtrader-backdrop-open");
    panel.classList.remove("hrtrader-panel-open");
    saveStatus.textContent = "";
  }

  function parseDelayInput() {
    const n = Number(String(delayInput.value).trim());
    if (!Number.isFinite(n) || n < 1) return defaults.delaySec;
    return Math.max(1, Math.min(120, Math.round(n)));
  }

  function applyAllSettings() {
    const prevGridCount = settings.gridLineCount;
    settings.delaySec = parseDelayInput();
    settings.direction = pendingDirection;
    settings.delayMode = delayModeToggle.checked ? "auto" : "manual";
    settings.maxTrades = Math.max(1, parseInt(maxTradesInput.value, 10) || defaults.maxTrades);
    settings.shutdownMin = Math.max(1, parseInt(shutdownInput.value, 10) || defaults.shutdownMin);
    settings.minPayout = Math.max(1, Math.min(100, parseInt(minPayoutInput.value, 10) || defaults.minPayout));
    settings.pendingTime = pendingTimeInput.value.trim() || getSafeFutureTimeHHMM();
    settings.pendingDir = pendingDirSelect.value;
    settings.pendingEnabled = pendingToggle.checked;
    settings.showGrid = gridToggle.checked;
    settings.gridLineCount = Math.max(1, Math.min(30, parseInt(gridCountInput.value, 10) || defaults.gridLineCount));
    if (settings.gridLineCount !== prevGridCount) settings.gridLinePositions = null; // লাইন সংখ্যা বদলালে পজিশন রিসেট
    const wasAutoTradeEnabled = settings.autoTradeEnabled;
    settings.autoTradeEnabled = autoTradeToggle.checked;
    settings.autoTradeDurationMin = Math.max(
      1,
      parseInt(autoTradeDurationInput.value, 10) || defaults.autoTradeDurationMin
    );
    settings.analysisMode = analysisToggle.checked;
    settings.apiKey = apiKeyInput.value.trim();
    settings.tradingPair = pairInput.value.trim() || defaults.tradingPair;
    settings.analysisMaxWaitMin = Math.max(1, parseInt(analysisWaitInput.value, 10) || defaults.analysisMaxWaitMin);
    settings.strategies = {
      emaRsi: strategyEmaRsiCheckbox.checked,
      pattern: strategyPatternCheckbox.checked,
      runningCandle: strategyRunningCheckbox.checked,
    };
    settings.strategyMatchMode = matchModeSelect.value === "any" ? "any" : "all";
    analysisCache = { direction: null, timestamp: 0 }; // সেটিংস বদলালে ক্যাশ বাতিল

    delayInput.value = String(settings.delaySec);
    const stored = saveSettings(settings);
    toggleGrid(settings.showGrid);
    startShutdownTimer();
    startPendingScheduler();
    if (settings.autoTradeEnabled && !wasAutoTradeEnabled) {
      startAutoTradeMode();
    } else if (!settings.autoTradeEnabled) {
      stopAutoTradeMode();
    }
    syncPanelUI();
    closePanel();
    console.log(
      "HRTrader: settings saved | delay:",
      settings.delayMode === "auto" ? "auto (0-60s)" : settings.delaySec + "s",
      "| dir:",
      settings.direction,
      stored ? "" : "(storage blocked)"
    );
  }

  function bindPanelAction(el, handler) {
    let lock = false;
    const run = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      if (lock) return;
      lock = true;
      setTimeout(() => {
        lock = false;
      }, 300);
      handler();
    };
    el.addEventListener("pointerup", run);
    el.addEventListener("click", run);
  }

  bindPanelAction(panel.querySelector("#hrtrader-save-all"), applyAllSettings);

  function onSettingsEnter(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      applyAllSettings();
    }
  }
  delayInput.addEventListener("keydown", onSettingsEnter);
  maxTradesInput.addEventListener("keydown", onSettingsEnter);
  shutdownInput.addEventListener("keydown", onSettingsEnter);
  minPayoutInput.addEventListener("keydown", onSettingsEnter);
  gridCountInput.addEventListener("keydown", onSettingsEnter);
  autoTradeDurationInput.addEventListener("keydown", onSettingsEnter);
  apiKeyInput.addEventListener("keydown", onSettingsEnter);
  pairInput.addEventListener("keydown", onSettingsEnter);
  analysisWaitInput.addEventListener("keydown", onSettingsEnter);

  panel.querySelector("#hrtrader-time-plus").addEventListener("click", () => modifyMinutes(1));
  panel.querySelector("#hrtrader-time-minus").addEventListener("click", () => modifyMinutes(-1));

  dirButtons.forEach((btn) => {
    bindPanelAction(btn, () => {
      pendingDirection = btn.dataset.dir;
      syncDirectionUI(pendingDirection);
    });
  });

  bindPanelAction(backdrop, closePanel);

  const widget = document.createElement("div");
  widget.id = "hrtrader-widget";
  widget.innerHTML = `
    <div id="hrtrader-logo-wrap"><img src="${LOGO_URL}" alt="HRTrader" draggable="false" /></div>
    <span id="hrtrader-label">${LABEL}</span>
  `;
  document.body.appendChild(widget);

  const widgetLabelEl = widget.querySelector("#hrtrader-label");
  const widgetLabelDefaultText = widgetLabelEl.textContent;
  let flashLabelTimeout = null;

  // স্ক্যান স্কিপ/ফেইল হলে (payout কম, বাটন না পাওয়া, max trades) উইজেটের লেবেলে
  // সংক্ষিপ্ত কারণ দেখানো হয়, যাতে শুধু console না দেখেও বোঝা যায় কেন ট্রেড হলো না।
  function flashWidgetLabel(text, color) {
    if (flashLabelTimeout) clearTimeout(flashLabelTimeout);
    widgetLabelEl.textContent = text;
    widgetLabelEl.style.color = color;
    flashLabelTimeout = setTimeout(() => {
      widgetLabelEl.textContent = widgetLabelDefaultText;
      widgetLabelEl.style.color = "";
      flashLabelTimeout = null;
    }, 2500);
  }

  // ব্যালেন্স ও পেআউট সিলেক্টর — এই মুহূর্তে শুধু Quotex-এর জন্য টেস্ট করা।
  // Pocket Option-এ এই সিলেক্টরগুলো মিলবে না, তাই getAccountBalance/getCurrentPayoutPercent
  // null রিটার্ন করবে। সেক্ষেত্রে win/loss স্ট্যাট এবং min-payout ফিল্টার কাজ করবে না,
  // কিন্তু মূল ট্রেড প্লেসমেন্ট (getTradeButtons, নিচে) দুই প্ল্যাটফর্মেই কাজ করবে —
  // অর্থাৎ এই সিলেক্টর না মিললেও বট থেমে যাবে না।
  function getAccountBalance() {
    const liveBalEl = document.querySelector(".v2KPX.X6PB5");
    const demoBalEl = document.querySelector(".v2KPX.lTzTl");
    const targetEl = liveBalEl || demoBalEl;
    if (targetEl && targetEl.parentElement) {
      const amtEl = targetEl.parentElement.querySelector(".Zt1hG");
      if (amtEl) {
        const val = parseFloat(amtEl.textContent.replace(/[^0-9.]/g, ""));
        if (!isNaN(val)) return val;
      }
    }
    return null;
  }

  function getCurrentPayoutPercent() {
    const payoutEl =
      document.querySelector(".OmOPV .eB25d") ||
      document.querySelector("#mobile-asset-btn .UI2Kh") ||
      document.querySelector("#tab-active .ElyTP");
    if (payoutEl) {
      const num = parseInt(payoutEl.textContent.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  }

  // বর্তমানে সিলেক্ট করা asset/pair-এর নাম (যেমন "EUR/USD" বা "NZD/CAD (OTC)")।
  // #tab-active হলো সক্রিয় asset ট্যাব, তার ভেতরের .WRocw span-এ নাম থাকে।
  function getCurrentAssetName() {
    const nameEl =
      document.querySelector("#tab-active .WRocw") || document.querySelector('[id="tab-active"] .WRocw');
    if (nameEl) return nameEl.textContent.trim();
    const mobileAsset = document.querySelector("#mobile-asset-btn");
    if (mobileAsset) return mobileAsset.textContent.trim();
    return null;
  }

  // ট্রেডের মেয়াদ (expiry) রিড করি প্ল্যাটফর্মের টাইমার ইনপুট থেকে (format "HH:MM:SS")।
  // এটা না পেলে নিরাপদ ডিফল্ট ৫ সেকেন্ড ধরি।
  function getTradeDurationMs() {
    const timerInput = document.querySelector(".TKeTa input");
    if (timerInput && timerInput.value) {
      const parts = timerInput.value.split(":").map(Number);
      if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
        const ms = (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
        if (ms > 0) return ms;
      }
    }
    return 5000;
  }

  // === WIN/LOSS ডিটেকশন ফিক্স ===
  // আগের ভার্সন প্রতি সেকেন্ডে balance-এর পরিবর্তন দেখে সিদ্ধান্ত নিতো, কিন্তু ট্রেড
  // ওপেন হওয়ার সাথে সাথেই স্টেক কেটে নেওয়া হয় (balance সাথে সাথে কমে যায়) — এই সাময়িক
  // কমাটাকেই ভুলভাবে LOSS হিসেবে গণনা করে ফেলতো, তারপর আসল ফলাফল (win হলে যে বৃদ্ধি
  // পরে আসে) আর গণনা হতো না। ফলে জেতা ট্রেডও মাঝে মাঝে LOSS দেখাতো।
  //
  // নতুন পদ্ধতি: ট্রেড বসানোর ঠিক আগের balance রেকর্ড করি, তারপর ট্রেডের মেয়াদ শেষ হওয়ার
  // (+বাফার) পর একবারই balance চেক করি — শেষ balance আগের চেয়ে বেশি হলে WIN
  // (স্টেক ফেরত + লাভ), নাহলে LOSS। মাঝের সাময়িক ওঠানামা উপেক্ষা করা হয়।
  function scheduleResultCheck(preTradeBalance) {
    if (preTradeBalance === null) {
      console.warn("HRTrader: balance selector not found — win/loss গণনা করা যাবে না এই ট্রেডের জন্য।");
      return;
    }
    const durationMs = getTradeDurationMs();
    setTimeout(() => {
      const finalBalance = getAccountBalance();
      if (finalBalance === null) {
        console.warn("HRTrader: ফলাফল যাচাই করা যায়নি (balance পড়া যায়নি)।");
        return;
      }
      if (finalBalance > preTradeBalance) {
        sessionStats.winCount++;
      } else {
        sessionStats.lossCount++;
      }
      syncPanelUI();
    }, durationMs + 1500); // ট্রেড ক্লোজ হওয়ার পর নেটওয়ার্ক/UI ল্যাগের জন্য ১.৫s বাফার
  }

  // রিয়েল ক্লিকের ফিল দিতে সিকোয়েন্সিয়াল পয়েন্টার/মাউস ইভেন্ট সিমুলেশন
  function safeTouchClick(element) {
    if (!element) return;
    try {
      const pDown = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, isPrimary: true });
      const mDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      element.dispatchEvent(pDown);
      element.dispatchEvent(mDown);
      setTimeout(() => {
        const pUp = new PointerEvent("pointerup", { bubbles: true, cancelable: true, isPrimary: true });
        const mUp = new MouseEvent("mouseup", { bubbles: true, cancelable: true });
        element.dispatchEvent(pUp);
        element.dispatchEvent(mUp);
        element.click();
      }, 10);
    } catch (err) {
      element.click();
    }
  }

  // === Real Market Analysis (Twelve Data API, EMA + RSI + Candlestick Pattern) ===
  // OTC/synthetic ডেটা না, আসল ফরেক্স মার্কেট ডেটা দিয়ে দিক নির্ধারণ করে।
  // ৮ সেকেন্ড ক্যাশ রাখা হয় যাতে বারবার ট্রেড করলেও ফ্রি API rate limit-এ না লাগে।
  async function fetchCandles(symbol, interval, outputsize) {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
      symbol
    )}&interval=${interval}&outputsize=${outputsize}&apikey=${encodeURIComponent(settings.apiKey)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data || data.status === "error" || !Array.isArray(data.values)) {
      throw new Error((data && data.message) || "Twelve Data থেকে ডেটা পাওয়া যায়নি");
    }
    // API নতুন-থেকে-পুরনো ক্রমে ডেটা দেয়, হিসাবের জন্য পুরনো-থেকে-নতুন লাগবে
    return data.values
      .map((v) => ({
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
      }))
      .reverse();
  }

  function calcEMA(closes, period) {
    if (closes.length < period) return closes[closes.length - 1];
    const k = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  }

  function calcRSI(closes, period) {
    if (closes.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  // সর্বশেষ candle (আর তার আগেরটা) দেখে সাধারণ candlestick pattern চিনি:
  // Bullish/Bearish Engulfing, Hammer (bullish reversal), Shooting Star (bearish reversal), Doji (indecision)
  function detectCandlePattern(candles) {
    if (!candles || candles.length < 2) return null;
    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];
    const body = (c) => Math.abs(c.close - c.open);
    const range = (c) => c.high - c.low;
    const upperWick = (c) => c.high - Math.max(c.open, c.close);
    const lowerWick = (c) => Math.min(c.open, c.close) - c.low;

    if (prev.close < prev.open && curr.close > curr.open && curr.open <= prev.close && curr.close >= prev.open) {
      return "up"; // Bullish Engulfing
    }
    if (prev.close > prev.open && curr.close < curr.open && curr.open >= prev.close && curr.close <= prev.open) {
      return "down"; // Bearish Engulfing
    }
    if (range(curr) > 0 && body(curr) / range(curr) < 0.1) {
      return null; // Doji — সিদ্ধান্তহীনতা, কোনো সিগনাল না
    }
    if (range(curr) > 0 && lowerWick(curr) > body(curr) * 2 && upperWick(curr) < body(curr)) {
      return "up"; // Hammer
    }
    if (range(curr) > 0 && upperWick(curr) > body(curr) * 2 && lowerWick(curr) < body(curr)) {
      return "down"; // Shooting Star
    }
    return null;
  }

  // এখন থেকে analysis mode-এ থাকলে কোনো random ট্রেড হবে না। শুধু তখনই direction দেবে
  // যখন EMA+RSI আর candlestick pattern দুটোই একমত (confirmed) — নাহলে null রিটার্ন করবে,
  // caller (waitForConfirmedSignal) তখন অপেক্ষা করবে পরবর্তী confirmed সিগনালের জন্য।
  // প্রতিটা strategy আলাদাভাবে সিগনাল দেয় (up/down/null); dashboard থেকে কোনগুলো
  // চালু থাকবে আর কীভাবে মেলাবে (any/all) সেটা ঠিক করা যায়।
  function computeStrategySignals(candles, closes) {
    const ema9 = calcEMA(closes.slice(-30), 9);
    const ema21 = calcEMA(closes.slice(-30), 21);
    const rsi = calcRSI(closes, 14);
    let emaRsiSignal = null;
    if (ema9 > ema21 && rsi < 70) emaRsiSignal = "up";
    else if (ema9 < ema21 && rsi > 30) emaRsiSignal = "down";

    const patternSignal = detectCandlePattern(candles);

    // Running Candle: সর্বশেষ (এখনো চলমান/সাম্প্রতিক) candle সবুজ হলে UP, লাল হলে DOWN —
    // ট্রেন্ড-কন্টিনিউয়েশন ধরনের সাধারণ momentum strategy।
    const lastCandle = candles[candles.length - 1];
    let runningSignal = null;
    if (lastCandle) {
      if (lastCandle.close > lastCandle.open) runningSignal = "up";
      else if (lastCandle.close < lastCandle.open) runningSignal = "down";
    }

    return {
      emaRsi: { signal: emaRsiSignal, detail: `EMA9=${ema9.toFixed(5)} EMA21=${ema21.toFixed(5)} RSI=${rsi.toFixed(1)}` },
      pattern: { signal: patternSignal, detail: patternSignal || "none" },
      runningCandle: {
        signal: runningSignal,
        detail: lastCandle ? `open=${lastCandle.open} close=${lastCandle.close}` : "n/a",
      },
    };
  }

  const STRATEGY_LABELS = { emaRsi: "EMA+RSI", pattern: "Pattern", runningCandle: "Running Candle" };
  const STRATEGY_ORDER = ["emaRsi", "pattern", "runningCandle"];

  function evaluateStrategies(signals) {
    const enabledKeys = STRATEGY_ORDER.filter((k) => settings.strategies[k]);
    if (enabledKeys.length === 0) {
      return { direction: null, confirmed: false, source: "কোনো strategy সিলেক্ট করা নেই" };
    }
    const activeSignals = enabledKeys.map((k) => ({ key: k, signal: signals[k].signal })).filter((s) => s.signal);

    if (settings.strategyMatchMode === "any") {
      // যেকোনো একটা চালু strategy সিগনাল দিলেই সেটা দিয়ে ট্রেড — দ্রুত কিন্তু কম কড়াকড়ি
      if (activeSignals.length > 0) {
        const first = activeSignals[0];
        return {
          direction: first.signal,
          confirmed: true,
          source: `${STRATEGY_LABELS[first.key]} confirmed (any-mode)`,
        };
      }
      return { direction: null, confirmed: false, source: "কোনো strategy সিগনাল দেয়নি — waiting" };
    }

    // "all" মোড: সিলেক্ট করা সবগুলো strategy-কে সিগনাল দিতে হবে এবং একই দিকে একমত হতে হবে
    if (activeSignals.length === enabledKeys.length) {
      const allSame = activeSignals.every((s) => s.signal === activeSignals[0].signal);
      if (allSame) {
        const names = activeSignals.map((s) => STRATEGY_LABELS[s.key]).join("+");
        return { direction: activeSignals[0].signal, confirmed: true, source: `${names} (confirmed, all-mode)` };
      }
      return { direction: null, confirmed: false, source: "strategy-গুলো একমত না — waiting" };
    }
    return { direction: null, confirmed: false, source: "সব strategy সিগনাল দেয়নি — waiting" };
  }

  async function getMarketAnalysisSignal() {
    if (!settings.apiKey || !settings.tradingPair) {
      return { direction: null, confirmed: false, source: "no-api-key" };
    }
    const now = Date.now();
    if (analysisCache.timestamp && now - analysisCache.timestamp < 8000) {
      return analysisCache;
    }
    try {
      const candles = await fetchCandles(settings.tradingPair, "1min", 50);
      const closes = candles.map((c) => c.close);
      const signals = computeStrategySignals(candles, closes);
      const result = evaluateStrategies(signals);

      console.log(
        `HRTrader analysis [${settings.tradingPair}] mode=${settings.strategyMatchMode}: ` +
          `emaRsi=${signals.emaRsi.signal || "-"} (${signals.emaRsi.detail}) | ` +
          `pattern=${signals.pattern.signal || "-"} | runningCandle=${signals.runningCandle.signal || "-"} → ` +
          `${result.direction ? result.direction.toUpperCase() : "WAIT"} (${result.source})`
      );
      analysisCache = { ...result, timestamp: now };
      return analysisCache;
    } catch (err) {
      console.error("HRTrader: market analysis ব্যর্থ হয়েছে।", err);
      return { direction: null, confirmed: false, source: "api-error" };
    }
  }

  // confirmed সিগনাল না পাওয়া পর্যন্ত অপেক্ষা করে (maxWaitMs পর্যন্ত), প্রতি ৩ সেকেন্ডে চেক করে।
  // ৮s cache নিজে থেকেই আসল API কল সীমিত রাখে, তাই ৩s পোলিং rate limit-এ প্রভাব ফেলে না।
  async function waitForConfirmedSignal(maxWaitMs) {
    const startedAt = Date.now();
    while (settings.analysisMode) {
      const result = await getMarketAnalysisSignal();
      if (result.confirmed && result.direction) return result.direction;
      if (Date.now() - startedAt >= maxWaitMs) return null;
      flashWidgetLabel("WAITING…", "#ffb020");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return null;
  }

  function startShutdownTimer() {
    if (shutdownTimerTimeout) clearTimeout(shutdownTimerTimeout);
    shutdownTimerTimeout = setTimeout(() => {
      if (window.__HRTrader_STOP__) window.__HRTrader_STOP__();
    }, settings.shutdownMin * 60 * 1000);
  }

  // প্ল্যাটফর্ম ঘড়ি (DOM টেক্সট, যেটা সাইটের নিজস্ব ১-সেকেন্ড সাইকেলে আপডেট হয়) বনাম
  // ডিভাইসের ঘড়ির অফসেট একবার মাপি। এরপর প্রতি টিকে আর DOM পার্স করতে হয় না —
  // এটাই আগের ১-১.৫s দেরির মূল কারণ ছিল, কারণ DOM টেক্সট নিজেই সেকেন্ডে একবার আপডেট হয়।
  // === শিডিউল ট্রেডের বাকি ১-১.৫s দেরির আসল কারণ ===
  // আগের calibration একবার ঘড়ির DOM টেক্সট রিড করে অফসেট বসাতো। কিন্তু সেই টেক্সট নিজেই
  // সেকেন্ডে একবার আপডেট হয় — অর্থাৎ আমরা "১৫:৫৬:০২" পড়লেও, আসলে সেই সেকেন্ডের ঠিক কোন
  // মুহূর্তে (শুরুতে না শেষে) পড়েছি তা অজানা, ফলে অফসেটেই ~০-১ সেকেন্ড ত্রুটি ঢুকে যেতো।
  // এখন DOM টেক্সট পরিবর্তনের ঠিক মুহূর্তটা (সেকেন্ড-বাউন্ডারি) ধরার চেষ্টা করি — সেই মুহূর্তের
  // device timestamp-ই নতুন সেকেন্ডের প্রকৃত শুরু, তাই অফসেট মিলিসেকেন্ড-নির্ভুল হয়ে যায়।
  function calibratePlatformOffset(callback, maxWaitMs) {
    const clockEl = document.querySelector(".xO39Y .jHgax") || document.querySelector(".jHgax");
    if (!clockEl) {
      callback(0);
      return;
    }
    const initialText = clockEl.textContent.trim();
    const startedAt = Date.now();
    let rafId = null;

    function offsetFromText(text) {
      const parts = text.split(":").map(Number);
      if (parts.length < 2 || parts.some((n) => isNaN(n))) return null;
      const now = new Date();
      const platformTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        parts[0],
        parts[1],
        parts.length >= 3 ? parts[2] : 0,
        0
      );
      return platformTime.getTime() - Date.now();
    }

    function poll() {
      const text = clockEl.textContent.trim();
      if (text !== initialText) {
        const offset = offsetFromText(text);
        if (offset !== null) {
          callback(offset);
          return;
        }
      }
      if (Date.now() - startedAt > (maxWaitMs || 1500)) {
        // সেকেন্ড-বাউন্ডারি সময়মতো ধরা না গেলে সাধারণ স্ন্যাপশট অফসেট দিয়ে ফলব্যাক করি
        callback(offsetFromText(clockEl.textContent.trim()) || 0);
        return;
      }
      rafId = requestAnimationFrame(poll);
    }
    rafId = requestAnimationFrame(poll);
  }

  function computeTargetTimestamp(targetHH, targetMM, offsetMs) {
    const now = new Date();
    let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHH, targetMM, 0, 0);
    target = new Date(target.getTime() - offsetMs); // ডিভাইস-ঘড়ির ফ্রেমে কনভার্ট
    if (target.getTime() < Date.now() - 2000) {
      target = new Date(target.getTime() + 24 * 60 * 60 * 1000); // টার্গেট পার হয়ে গেলে পরের দিনে সরাই
    }
    return target.getTime();
  }

  function startPendingScheduler() {
    if (pendingAnimationId) cancelAnimationFrame(pendingAnimationId);
    if (pendingBackupInterval) clearInterval(pendingBackupInterval);
    pendingAnimationId = null;
    pendingBackupInterval = null;

    if (!settings.pendingEnabled || !settings.pendingTime) return;

    const parts = settings.pendingTime.split(":");
    const targetHH = parseInt(parts[0], 10) || 0;
    const targetMM = parseInt(parts[1], 10) || 0;
    let isExecuted = false;

    calibratePlatformOffset((offsetMs) => {
      if (!settings.pendingEnabled || isExecuted) return; // ক্যালিব্রেশন চলাকালীন কেউ বন্ধ করে দিলে
      const targetTimestamp = computeTargetTimestamp(targetHH, targetMM, offsetMs);

      function checkTime() {
        if (!settings.pendingEnabled || isExecuted) return;
        if (Date.now() >= targetTimestamp) {
          isExecuted = true;
          settings.pendingEnabled = false;
          saveSettings(settings);
          if (pendingBackupInterval) clearInterval(pendingBackupInterval);
          executeTrade(settings.pendingDir);
          syncPanelUI();
          return;
        }
        if (!isExecuted) pendingAnimationId = requestAnimationFrame(checkTime);
      }

      pendingAnimationId = requestAnimationFrame(checkTime);
      // ব্যাকগ্রাউন্ড ট্যাবে rAF থ্রটল হতে পারে বলে ব্যাকআপ ইন্টারভাল; Date.now() টাইমস্ট্যাম্প
      // তুলনা করছি বলে ১০ms রেজোলিউশনেও নির্ভুল থাকবে
      pendingBackupInterval = setInterval(checkTime, 10);
    }, 1500);
  }

  let scanActive = false;
  let tradeTimer = null;
  let tapCount = 0;
  let tapSettleTimer = null;
  let lastTapAt = 0;

  // MULTI-PLATFORM BUTTON DETECTOR (Quotex & Pocket Option)
  function getTradeButtons() {
    // ১. আসল প্ল্যাটফর্ম DOM (আপলোড করা HTML থেকে কনফার্ম করা):
    // #trade-button এর ভেতরে দুটো button, ভেতরের .oQ4Z4 span-এ "Up"/"Down" টেক্সট।
    // hashed CSS ক্লাস (KtjVk/JQZcs/twQq3 ইত্যাদি) বিল্ডের সাথে বদলাতে পারে,
    // তাই স্থিতিশীল #trade-button ID + টেক্সট লেবেল দিয়ে খুঁজছি — ক্লাসনেম দিয়ে না।
    let upBtn = null;
    let downBtn = null;
    const tradeContainer = document.querySelector("#trade-button");
    if (tradeContainer) {
      const buttons = tradeContainer.querySelectorAll("button");
      buttons.forEach((btn) => {
        const labelEl = btn.querySelector(".oQ4Z4");
        const text = (labelEl ? labelEl.textContent : btn.textContent).trim().toLowerCase();
        if (text.includes("up")) upBtn = btn;
        else if (text.includes("down")) downBtn = btn;
      });
      // টেক্সট ম্যাচ না করলে (ভবিষ্যতে ভাষা/লেবেল বদলালে) পজিশন ধরে ফলব্যাক: ১ম=Up, ২য়=Down
      if (!upBtn && !downBtn && buttons.length >= 2) {
        upBtn = buttons[0];
        downBtn = buttons[1];
      }
    }

    // ২. পুরনো/অন্য প্ল্যাটফর্ম ফলব্যাক সিলেক্টর (যদি #trade-button একদমই না মেলে)
    if (!upBtn) {
      upBtn =
        document.querySelector(".btn.btn-call") ||
        document.querySelector(".btn-call") ||
        document.querySelector('[data-action="call"]') ||
        document.querySelector('.divider-vertical[data-type="up"]') ||
        document.querySelector(".control__up .btn");
    }
    if (!downBtn) {
      downBtn =
        document.querySelector(".btn.btn-put") ||
        document.querySelector(".btn-put") ||
        document.querySelector('[data-action="put"]') ||
        document.querySelector('.divider-vertical[data-type="down"]') ||
        document.querySelector(".control__down .btn");
    }

    return { up: upBtn, down: downBtn };
  }

  function pickTradeButton(customDir) {
    const { up, down } = getTradeButtons();
    if (!up && !down) return { btn: null, dir: null };
    let dir = customDir || settings.direction;
    if (dir === "random") {
      const pool = [];
      if (up) pool.push("up");
      if (down) pool.push("down");
      dir = pool[Math.floor(Math.random() * pool.length)];
    }
    const btn = dir === "up" ? up : down;
    if (btn) return { btn, dir };
    // অনুরোধ করা দিকের বাটন না পাওয়া গেলেও, যেটা পাওয়া গেছে সেটা দিয়েই ট্রেড করি
    // (আগের ভার্সনের রেজিলিয়েন্স ধরে রাখতে — নাহলে সিলেক্টর একটু বদলালেই বট বসে যায়)
    if (up) return { btn: up, dir: "up" };
    if (down) return { btn: down, dir: "down" };
    return { btn: null, dir: null };
  }

  async function executeTrade(customDir) {
    if (sessionStats.tradesCount >= settings.maxTrades) {
      console.warn("HRTrader: max trades reached for this session.");
      flashWidgetLabel("MAX", "#ff5252");
      stopScanSession();
      return false;
    }

    const payout = getCurrentPayoutPercent();
    if (payout !== null && payout < settings.minPayout) {
      console.warn(`HRTrader: payout too low (${payout}%), trade skipped.`);
      flashWidgetLabel(`LOW ${payout}%`, "#ffb020");
      stopScanSession();
      return false;
    }
    // payout === null মানে সিলেক্টর মেলেনি (যেমন Pocket Option-এ) — এক্ষেত্রে
    // ফিল্টার আটকাচ্ছি না, শুধু ট্রেড চালিয়ে যাচ্ছি যাতে বট থেমে না যায়।

    // Pending schedule-এর মতো এক্সপ্লিসিট দিক না থাকলে, Real Market Analysis অন থাকলে
    // তা দিয়ে দিক ঠিক করি; নাহলে settings.direction (up/down/random) ব্যবহার হয়।
    let dirOverride = customDir;
    if (!dirOverride && settings.analysisMode) {
      const currentAsset = getCurrentAssetName();

      // OTC পেয়ার broker-জেনারেটেড সিন্থেটিক ডেটা — real market (Twelve Data) analysis
      // এখানে অর্থহীন, বরং বিভ্রান্তিকর (মনে হবে "analysis" করেছে, আসলে প্রাসঙ্গিকই না)।
      // তাই analysis mode অন থাকলে OTC পেয়ারে ট্রেড স্কিপ করে দেওয়া হচ্ছে।
      if (currentAsset && /OTC/i.test(currentAsset)) {
        console.warn(
          `HRTrader: বর্তমান asset "${currentAsset}" একটি OTC পেয়ার — real market data দিয়ে অ্যানালাইসিস প্রাসঙ্গিক না, ট্রেড স্কিপ করা হলো।`
        );
        flashWidgetLabel("OTC SKIP", "#ff5252");
        stopScanSession();
        return false;
      }

      // প্ল্যাটফর্মে সিলেক্ট করা পেয়ার আর settings-এ দেওয়া tradingPair না মিললেও স্কিপ করি,
      // নাহলে ভুল পেয়ারের analysis দিয়ে ভিন্ন পেয়ারে ট্রেড হয়ে যেতে পারে।
      if (currentAsset) {
        const normalizedCurrent = currentAsset.replace(/\(.*?\)/g, "").replace(/\s+/g, "").toUpperCase();
        const normalizedSetting = settings.tradingPair.replace(/\s+/g, "").toUpperCase();
        if (normalizedCurrent && normalizedCurrent !== normalizedSetting) {
          console.warn(
            `HRTrader: প্ল্যাটফর্মে সিলেক্ট করা "${currentAsset}" আর settings-এর trading pair "${settings.tradingPair}" মেলেনি — ট্রেড স্কিপ করা হলো।`
          );
          flashWidgetLabel("PAIR MISMATCH", "#ffb020");
          stopScanSession();
          return false;
        }
      }

      flashWidgetLabel("ANALYZING…", "#00ff66");
      dirOverride = await waitForConfirmedSignal(settings.analysisMaxWaitMin * 60 * 1000);
      if (!dirOverride) {
        console.warn(
          `HRTrader: ${settings.analysisMaxWaitMin} মিনিটের মধ্যে কোনো confirmed সিগনাল পাওয়া যায়নি — ট্রেড স্কিপ করা হলো (random নেওয়া হয়নি)।`
        );
        flashWidgetLabel("NO SIGNAL", "#ff5252");
        stopScanSession();
        return false;
      }
    }

    const { btn, dir } = pickTradeButton(dirOverride);
    if (!btn) {
      console.error("HRTrader: target button not found for platform/direction:", dirOverride || settings.direction);
      flashWidgetLabel("NO BTN", "#ff5252");
      stopScanSession();
      return false;
    }

    const preTradeBalance = getAccountBalance();
    safeTouchClick(btn);
    sessionStats.tradesCount++;
    sessionStats.lastDirection = dir;
    scheduleResultCheck(preTradeBalance);
    syncPanelUI();

    console.log(
      "HRTrader trade executed:",
      dir.toUpperCase(),
      "| payout:",
      payout === null ? "unknown" : payout + "%",
      settings.analysisMode && !customDir ? "| via market analysis" : ""
    );

    stopScanSession();
    return true;
  }

  function stopScanSession() {
    widget.classList.remove("hrtrader-glow");
    scanOverlay.classList.remove("hrtrader-scan-on");
    scanActive = false;
    if (tradeTimer) {
      clearTimeout(tradeTimer);
      tradeTimer = null;
    }
  }

  function getScanDelayMs() {
    // Auto Analyze: প্রতিবার ০-৬০ সেকেন্ডের মধ্যে র‍্যান্ডম ডিলে
    // Manual Analyze: ব্যবহারকারীর নির্ধারিত ফিক্সড ডিলে (settings.delaySec)
    if (settings.delayMode === "auto") return Math.floor(Math.random() * 60000);
    return settings.delaySec * 1000;
  }

  function stopAutoTradeMode() {
    if (autoTradeTimeout) {
      clearTimeout(autoTradeTimeout);
      autoTradeTimeout = null;
    }
    autoTradeEndTime = null;
  }

  function runAutoTradeCycle() {
    if (!settings.autoTradeEnabled) return;
    if (Date.now() >= autoTradeEndTime) {
      console.log("HRTrader: Auto Trade সময় শেষ, স্বয়ংক্রিয়ভাবে বন্ধ হচ্ছে।");
      settings.autoTradeEnabled = false;
      saveSettings(settings);
      flashWidgetLabel("AUTO OFF", "#9fd4ad");
      syncPanelUI();
      stopAutoTradeMode();
      return;
    }
    if (sessionStats.tradesCount >= settings.maxTrades) {
      console.warn("HRTrader: max trades reached, Auto Trade বন্ধ হচ্ছে।");
      settings.autoTradeEnabled = false;
      saveSettings(settings);
      syncPanelUI();
      stopAutoTradeMode();
      return;
    }
    const delayMs = getScanDelayMs();
    autoTradeTimeout = setTimeout(async () => {
      const placed = await executeTrade();
      // ট্রেড আসলে বসেছে হলে তার মেয়াদ শেষ হওয়া পর্যন্ত অপেক্ষা করি; স্কিপ হলে (যেমন
      // confirmed signal-এর অপেক্ষায় থেকে সময় শেষ হয়ে গেছে) শীঘ্রই আবার চেষ্টা করি
      const waitMs = placed ? getTradeDurationMs() + 2000 : 5000;
      autoTradeTimeout = setTimeout(runAutoTradeCycle, waitMs);
    }, delayMs);
  }

  function startAutoTradeMode() {
    stopAutoTradeMode();
    if (!settings.autoTradeEnabled) return;
    autoTradeEndTime = Date.now() + settings.autoTradeDurationMin * 60 * 1000;
    runAutoTradeCycle();
  }

  function startAutoTrade() {
    if (scanActive) return;
    closePanel();
    scanActive = true;
    widget.classList.add("hrtrader-glow");
    scanOverlay.classList.add("hrtrader-scan-on");
    const delayMs = getScanDelayMs();

    tradeTimer = setTimeout(() => {
      tradeTimer = null;
      executeTrade();
    }, delayMs);
  }

  function resetTapCounter() {
    tapCount = 0;
    if (tapSettleTimer) {
      clearTimeout(tapSettleTimer);
      tapSettleTimer = null;
    }
  }

  function registerTap() {
    if (panel.classList.contains("hrtrader-panel-open")) return;

    const now = Date.now();
    if (now - lastTapAt > TAP_SEQUENCE_MS) tapCount = 0;
    lastTapAt = now;
    tapCount += 1;

    if (tapSettleTimer) {
      clearTimeout(tapSettleTimer);
      tapSettleTimer = null;
    }

    if (tapCount >= TAP_REQUIRED) {
      resetTapCounter();
      openPanel();
      return;
    }

    tapSettleTimer = setTimeout(() => {
      tapSettleTimer = null;
      if (tapCount === 1) {
        if (scanActive) {
          stopScanSession();
        } else {
          startAutoTrade();
        }
      }
      tapCount = 0;
    }, TAP_SETTLE_MS);
  }

  /* ——— Drag (mouse + touch) ——— */
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  const DRAG_THRESHOLD = 8;

  function clampPosition(left, top) {
    const rect = widget.getBoundingClientRect();
    const maxL = window.innerWidth - rect.width;
    const maxT = window.innerHeight - rect.height;
    return {
      left: Math.max(0, Math.min(left, maxL)),
      top: Math.max(0, Math.min(top, maxT)),
    };
  }

  function onPointerDown(clientX, clientY) {
    dragging = true;
    moved = false;
    const r = widget.getBoundingClientRect();
    startX = clientX;
    startY = clientY;
    startLeft = r.left;
    startTop = r.top;
    widget.style.transform = "none";
    widget.style.left = startLeft + "px";
    widget.style.top = startTop + "px";
  }

  function onPointerMove(clientX, clientY) {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      moved = true;
    }
    const pos = clampPosition(startLeft + dx, startTop + dy);
    widget.style.left = pos.left + "px";
    widget.style.top = pos.top + "px";
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    if (!moved) {
      registerTap();
    }
  }

  widget.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onPointerDown(e.clientX, e.clientY);
  });

  widget.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      onPointerDown(t.clientX, t.clientY);
    },
    { passive: false }
  );

  document.addEventListener("mousemove", (e) => {
    onPointerMove(e.clientX, e.clientY);
  });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (!dragging || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    },
    { passive: false }
  );

  document.addEventListener("mouseup", onPointerUp);
  document.addEventListener("touchend", onPointerUp);
  document.addEventListener("touchcancel", onPointerUp);

  window.__HRTrader_STOP__ = function () {
    stopScanSession();
    resetTapCounter();
    closePanel();
    if (shutdownTimerTimeout) clearTimeout(shutdownTimerTimeout);
    if (pendingAnimationId) cancelAnimationFrame(pendingAnimationId);
    if (pendingBackupInterval) clearInterval(pendingBackupInterval);
    stopAutoTradeMode();
    widget.remove();
    scanOverlay.remove();
    backdrop.remove();
    panel.remove();
    gridOverlay.remove();
    style.remove();
    delete window.__HRTrader_ACTIVE__;
    delete window.__HRTrader_STOP__;
    console.log("HRTrader removed.");
  };

  startShutdownTimer();
  startPendingScheduler();
  startAutoTradeMode();
  syncPanelUI();
  console.log(
    "HRTrader Multi-Platform Loaded — Ready for Quotex / Pocket Option"
  );
  }

  showPasswordGate(initHRTrader);
})();
