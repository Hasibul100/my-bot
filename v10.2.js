/**
 * HRTrader — Browser console script (Multi-Platform: Quotex & Pocket Option)
 * Paste entire file into DevTools Console (F12) on the trading platform page.
 */
(function () {
  if (window.__HRTrader_ACTIVE__) {
    console.warn("HRTrader already running.");
    return;
  }

  const HRTrader_PASSWORD = "Jokar99T";
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
    "https://cdn.phototourl.com/free/2026-05-22-7e33af14-9942-4c1e-9c27-b94db59f36b5.png";
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
    baseBalance: null,
    lastBalance: null,
    lastDirection: "up",
    isTradeActive: false,
  };

  let shutdownTimerTimeout = null;
  let pendingAnimationId = null;
  let pendingBackupInterval = null;
  let balanceCheckInterval = null;

  // চার্ট গ্রিড ওভারলে (ঐচ্ছিক, শুধু ভিজ্যুয়াল গাইড — ট্রেড লজিকে প্রভাব ফেলে না)
  const gridOverlay = document.createElement("div");
  gridOverlay.id = "hrtrader-grid-overlay";
  gridOverlay.style.cssText =
    "position:fixed; inset:0; z-index:1; pointer-events:none; display:none; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr);";
  for (let i = 0; i < 36; i++) {
    const cell = document.createElement("div");
    cell.style.cssText = "border: 1px dashed rgba(0, 255, 102, 0.15);";
    gridOverlay.appendChild(cell);
  }
  document.body.appendChild(gridOverlay);

  function toggleGrid(show) {
    gridOverlay.style.display = show ? "grid" : "none";
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
      padding: 18px 16px 14px;
      border-radius: 14px;
      background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%);
      border: 1px solid rgba(0,255,102,0.35);
      box-shadow: 0 0 40px rgba(0,255,102,0.25), 0 12px 40px rgba(0,0,0,0.55);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #e8ffe8;
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

    <div class="hrtrader-row">
      <label>Scan delay (seconds)</label>
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

    <div class="hrtrader-row" style="display:flex; align-items:center; gap:8px;">
      <input id="hrtrader-grid-toggle" type="checkbox" style="width:auto;" />
      <label for="hrtrader-grid-toggle" style="margin:0;">Chart grid overlay</label>
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
  const maxTradesInput = panel.querySelector("#hrtrader-maxtrades-input");
  const shutdownInput = panel.querySelector("#hrtrader-shutdown-input");
  const minPayoutInput = panel.querySelector("#hrtrader-minpayout-input");
  const pendingTimeInput = panel.querySelector("#hrtrader-pending-time");
  const pendingDirSelect = panel.querySelector("#hrtrader-pending-dir");
  const pendingToggle = panel.querySelector("#hrtrader-pending-toggle");
  const gridToggle = panel.querySelector("#hrtrader-grid-toggle");
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
    maxTradesInput.value = String(settings.maxTrades);
    shutdownInput.value = String(settings.shutdownMin);
    minPayoutInput.value = String(settings.minPayout);
    pendingTimeInput.value = settings.pendingTime || getSafeFutureTimeHHMM();
    pendingDirSelect.value = settings.pendingDir;
    pendingToggle.checked = settings.pendingEnabled;
    gridToggle.checked = settings.showGrid;

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
    settings.delaySec = parseDelayInput();
    settings.direction = pendingDirection;
    settings.maxTrades = Math.max(1, parseInt(maxTradesInput.value, 10) || defaults.maxTrades);
    settings.shutdownMin = Math.max(1, parseInt(shutdownInput.value, 10) || defaults.shutdownMin);
    settings.minPayout = Math.max(1, Math.min(100, parseInt(minPayoutInput.value, 10) || defaults.minPayout));
    settings.pendingTime = pendingTimeInput.value.trim() || getSafeFutureTimeHHMM();
    settings.pendingDir = pendingDirSelect.value;
    settings.pendingEnabled = pendingToggle.checked;
    settings.showGrid = gridToggle.checked;

    delayInput.value = String(settings.delaySec);
    const stored = saveSettings(settings);
    toggleGrid(settings.showGrid);
    startShutdownTimer();
    startPendingScheduler();
    syncPanelUI();
    closePanel();
    console.log(
      "HRTrader: settings saved | delay:",
      settings.delaySec + "s",
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
      document.querySelector(".OmOPV .eB25d") || document.querySelector("#mobile-asset-btn .UI2Kh");
    if (payoutEl) {
      const num = parseInt(payoutEl.textContent.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  }

  function startBalanceTracker() {
    if (balanceCheckInterval) clearInterval(balanceCheckInterval);
    sessionStats.baseBalance = getAccountBalance();
    sessionStats.lastBalance = sessionStats.baseBalance;

    balanceCheckInterval = setInterval(() => {
      const current = getAccountBalance();
      if (current === null || sessionStats.lastBalance === null) return;
      if (current !== sessionStats.lastBalance) {
        if (!sessionStats.isTradeActive) {
          sessionStats.lastBalance = current;
          return;
        }
        if (current > sessionStats.lastBalance) {
          sessionStats.winCount++;
        } else if (current < sessionStats.lastBalance) {
          sessionStats.lossCount++;
        }
        sessionStats.isTradeActive = false;
        sessionStats.lastBalance = current;
        syncPanelUI();
      }
    }, 1000);
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

  function startShutdownTimer() {
    if (shutdownTimerTimeout) clearTimeout(shutdownTimerTimeout);
    shutdownTimerTimeout = setTimeout(() => {
      if (window.__HRTrader_STOP__) window.__HRTrader_STOP__();
    }, settings.shutdownMin * 60 * 1000);
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

    function checkTime() {
      if (!settings.pendingEnabled || isExecuted) return;

      let hh = null;
      let mm = null;
      // প্ল্যাটফর্মের লাইভ সার্ভার ঘড়ি (Quotex-স্পেসিফিক), না পেলে ডিভাইসের ঘড়ি দিয়ে ফলব্যাক
      const clockEl = document.querySelector(".xO39Y .jHgax") || document.querySelector(".jHgax");
      if (clockEl) {
        const cParts = clockEl.textContent.trim().split(":");
        if (cParts.length >= 2) {
          hh = parseInt(cParts[0], 10);
          mm = parseInt(cParts[1], 10);
        }
      }
      if (hh === null || mm === null || isNaN(hh) || isNaN(mm)) {
        const now = new Date();
        hh = now.getHours();
        mm = now.getMinutes();
      }

      if (hh === targetHH && mm === targetMM) {
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
    // ব্যাকগ্রাউন্ড ট্যাবে rAF থ্রটল হতে পারে বলে ব্যাকআপ ইন্টারভাল রাখা হলো
    pendingBackupInterval = setInterval(checkTime, 20);
  }

  let scanActive = false;
  let tradeTimer = null;
  let tapCount = 0;
  let tapSettleTimer = null;
  let lastTapAt = 0;

  // MULTI-PLATFORM BUTTON DETECTOR (Quotex & Pocket Option)
  function getTradeButtons() {
    // 1. Quotex selectors
    let upBtn = document.querySelector(".btn.btn-call") || document.querySelector(".btn-call");
    let downBtn = document.querySelector(".btn.btn-put") || document.querySelector(".btn-put");

    // 2. Pocket Option selectors (যদি Quotex-এরটা না পাওয়া যায়)
    if (!upBtn) {
      upBtn = document.querySelector(".btn-call") || 
              document.querySelector(".btn.call") || 
              document.querySelector('[data-action="call"]') ||
              document.querySelector('.divider-vertical[data-type="up"]') ||
              document.querySelector('.control__up .btn'); // Pocket Option specific fallback
    }
    if (!downBtn) {
      downBtn = document.querySelector(".btn-put") || 
                document.querySelector(".btn.put") || 
                document.querySelector('[data-action="put"]') ||
                document.querySelector('.divider-vertical[data-type="down"]') ||
                document.querySelector('.control__down .btn'); // Pocket Option specific fallback
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

  function executeTrade(customDir) {
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

    const { btn, dir } = pickTradeButton(customDir);
    if (!btn) {
      console.error("HRTrader: target button not found for platform/direction:", customDir || settings.direction);
      flashWidgetLabel("NO BTN", "#ff5252");
      stopScanSession();
      return false;
    }

    sessionStats.isTradeActive = true;
    safeTouchClick(btn);
    sessionStats.tradesCount++;
    sessionStats.lastDirection = dir;
    syncPanelUI();

    console.log(
      "HRTrader trade executed:",
      dir.toUpperCase(),
      "| payout:",
      payout === null ? "unknown" : payout + "%"
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

  function startAutoTrade() {
    if (scanActive) return;
    closePanel();
    scanActive = true;
    widget.classList.add("hrtrader-glow");
    scanOverlay.classList.add("hrtrader-scan-on");
    const delayMs = settings.delaySec * 1000;

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
    if (balanceCheckInterval) clearInterval(balanceCheckInterval);
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

  startBalanceTracker();
  startShutdownTimer();
  startPendingScheduler();
  syncPanelUI();
  console.log(
    "HRTrader Multi-Platform Loaded — Ready for Quotex / Pocket Option"
  );
  }

  showPasswordGate(initHRTrader);
})();
