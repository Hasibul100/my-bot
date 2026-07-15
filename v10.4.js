/**
 * HRTrader — Browser console script (Multi-Platform: Quotex & Pocket Option)
 * Version: 10.4 (Optimized Scheduler, Advanced Grid, Auto Trade & Perfected PnL)
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
        position: fixed; inset: 0; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0, 0, 0, 0.72);
        font-family: system-ui, -apple-system, sans-serif;
      }
      #hrtrader-login-box {
        width: min(320px, calc(100vw - 32px)); padding: 22px 20px 18px;
        border-radius: 14px; background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%);
        border: 1px solid rgba(0, 255, 102, 0.4); box-shadow: 0 0 50px rgba(0, 255, 102, 0.2);
      }
      #hrtrader-login-box h3 { margin: 0 0 6px; text-align: center; color: #00ff66; font-size: 18px; letter-spacing: 0.08em; }
      #hrtrader-login-box p { margin: 0 0 14px; text-align: center; font-size: 12px; color: #9fd4ad; }
      #hrtrader-login-input {
        box-sizing: border-box; width: 100%; padding: 11px 12px; border-radius: 8px;
        border: 1px solid rgba(0, 255, 102, 0.35); background: rgba(0, 0, 0, 0.4); color: #fff; font-size: 15px; outline: none;
      }
      #hrtrader-login-input:focus { border-color: #00ff66; box-shadow: 0 0 0 2px rgba(0, 255, 102, 0.2); }
      #hrtrader-login-btn {
        width: 100%; margin-top: 12px; padding: 12px; border: none; border-radius: 8px;
        background: #00ff66; color: #052210; font-weight: 700; font-size: 14px; cursor: pointer;
      }
      #hrtrader-login-err { min-height: 18px; margin-top: 8px; text-align: center; font-size: 12px; color: #ff6b6b; font-weight: 600; }
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
      input.focus(); input.select();
    }

    btn.addEventListener("click", tryLogin);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); tryLogin(); }
    });
    setTimeout(() => input.focus(), 50);
  }

  function initHRTrader() {
    window.__HRTrader_ACTIVE__ = true;

    const LOGO_URL = "https://cdn.phototourl.com/free/2026-05-22-7e33af14-9942-4c1e-9c27-b94db59f36b5.png";
    const LABEL = "HRTrader";
    const STORAGE_KEY = "hrtrader_settings_v2";
    const TAP_REQUIRED = 3;
    const TAP_SETTLE_MS = 380;

    const defaults = {
      delayMode: "manual", // "manual" or "auto"
      delaySec: 10,
      direction: "random",
      maxTrades: 20,
      minPayout: 70,
      showGrid: false,
      gridLines: 4,
      gridOffset: 20,
      shutdownMin: 30,
      pendingTime: "",
      pendingDir: "up",
      pendingEnabled: false,
      autoTradeEnabled: false,
      autoTradeEndTime: ""
    };

    function getSafeFutureTimeHHMM(addMinutes = 1) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + addMinutes);
      return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    function loadSettings() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          return { ...defaults, ...s };
        }
      } catch (e) {}
      return { ...defaults };
    }

    function saveSettings(s) {
      const json = JSON.stringify(s);
      try { localStorage.setItem(STORAGE_KEY, json); return true; } catch {}
      return false;
    }

    let settings = loadSettings();
    if (!settings.pendingTime) settings.pendingTime = getSafeFutureTimeHHMM();
    if (!settings.autoTradeEndTime) settings.autoTradeEndTime = getSafeFutureTimeHHMM(30);

    let sessionStats = {
      tradesCount: 0, winCount: 0, lossCount: 0,
      lastBalance: null,
    };

    let pendingTimeoutId = null;
    let balanceCheckInterval = null;
    let autoTradeTimer = null;

    // Grid Customization Overlay (Horizontal Only)
    const gridOverlay = document.createElement("div");
    gridOverlay.id = "hrtrader-grid-overlay";
    gridOverlay.style.cssText = "position:fixed; inset:0; z-index:1; pointer-events:none; display:none; flex-direction:column; justify-content:space-between;";
    document.body.appendChild(gridOverlay);

    function buildGrid() {
      gridOverlay.innerHTML = "";
      if (!settings.showGrid) {
        gridOverlay.style.display = "none";
        return;
      }
      gridOverlay.style.display = "flex";
      gridOverlay.style.padding = `${settings.gridOffset}vh 0`;
      for (let i = 0; i < settings.gridLines; i++) {
        const line = document.createElement("div");
        line.style.cssText = "width: 100%; height: 1px; background: rgba(0, 255, 102, 0.4); box-shadow: 0 0 8px rgba(0,255,102,0.6);";
        gridOverlay.appendChild(line);
      }
    }
    buildGrid();

    const style = document.createElement("style");
    style.textContent = `
      #hrtrader-widget { position: fixed; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: grab; user-select: none; left: 16px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45)); transition: filter 0.25s ease; touch-action: none; }
      #hrtrader-widget.hrtrader-glow { filter: drop-shadow(0 0 12px #00ff66) drop-shadow(0 0 28px #00ff66); }
      #hrtrader-logo-wrap { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; pointer-events: none; }
      #hrtrader-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
      #hrtrader-label { font-family: system-ui, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.8); pointer-events: none; }
      #hrtrader-panel { position: fixed; z-index: 2147483647; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0; pointer-events: none; width: min(320px, calc(100vw - 32px)); padding: 18px 16px 14px; border-radius: 14px; background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%); border: 1px solid rgba(0,255,102,0.35); box-shadow: 0 0 40px rgba(0,255,102,0.25), 0 12px 40px rgba(0,0,0,0.55); font-family: system-ui, sans-serif; color: #e8ffe8; max-height: 90vh; overflow-y: auto; }
      #hrtrader-panel.hrtrader-panel-open { opacity: 1; pointer-events: auto; }
      #hrtrader-panel h3 { margin: 0 0 14px; font-size: 16px; font-weight: 700; text-align: center; color: #00ff66; }
      #hrtrader-panel h4 { margin: 14px 0 8px; font-size: 12px; color: #00ff66; text-transform: uppercase; border-bottom: 1px dashed rgba(0,255,102,0.2); padding-bottom: 4px; }
      .hrtrader-row { margin-bottom: 12px; }
      #hrtrader-panel label { display: block; font-size: 11px; color: #9fd4ad; margin-bottom: 4px; }
      .hrtrader-input-block { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.3); background: rgba(0,0,0,0.35); color: #fff; font-size: 13px; outline: none; }
      .hrtrader-input-block:focus { border-color: #00ff66; box-shadow: 0 0 0 2px rgba(0,255,102,0.2); }
      .hrtrader-save-btn { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #00ff66; color: #052210; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 10px; }
      .hrtrader-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .hrtrader-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
      .stat-badge { background: rgba(0,255,102,0.08); border: 1px solid rgba(0,255,102,0.2); padding: 8px; border-radius: 8px; text-align: center; }
      .stat-title { font-size: 10px; color: #9fd4ad; display: block; }
      .stat-val { font-size: 14px; font-weight: 700; color: #00ff66; }
      .stat-loss { color: #ff5252; }
      .switch-wrap { display: flex; align-items: center; justify-content: space-between; background: rgba(0,255,102,0.05); padding: 8px 10px; border-radius: 8px; border: 1px dashed rgba(0,255,102,0.2); margin-bottom: 10px; font-size: 12px; font-weight: 600; color: #00ff66; }
      .switch { position: relative; display: inline-block; width: 36px; height: 18px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; inset: 0; background-color: #223a2a; transition: .3s; border-radius: 18px; border: 1px solid rgba(0,255,102,0.3); }
      .slider:before { position: absolute; content: ""; height: 10px; width: 10px; left: 3px; bottom: 3px; background-color: #9fd4ad; transition: .3s; border-radius: 50%; }
      input:checked + .slider { background-color: #00ff66; border-color: #00ff66; }
      input:checked + .slider:before { transform: translateX(18px); background-color: #052210; }
      #hrtrader-dir-group, #hrtrader-delay-mode-group { display: flex; gap: 4px; }
      .toggle-btn { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.25); background: rgba(0,0,0,0.3); color: #dfffe8; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; }
      .toggle-btn.active { background: rgba(0,255,102,0.18); border-color: #00ff66; box-shadow: 0 0 10px rgba(0,255,102,0.2); color: #00ff66; }
      #hrtrader-panel-backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity 0.2s; }
      #hrtrader-panel-backdrop.hrtrader-backdrop-open { opacity: 1; pointer-events: auto; }
      #hrtrader-panel::-webkit-scrollbar { width: 4px; }
      #hrtrader-panel::-webkit-scrollbar-thumb { background: #00ff66; border-radius: 4px; }
    `;
    document.head.appendChild(style);

    const backdrop = document.createElement("div");
    backdrop.id = "hrtrader-panel-backdrop";

    const panel = document.createElement("div");
    panel.id = "hrtrader-panel";
    panel.innerHTML = `
      <h3>HRTrader Settings</h3>
      <div class="hrtrader-grid-3">
        <div class="stat-badge"><span class="stat-title">Trades</span><span id="stat-trades" class="stat-val">0</span></div>
        <div class="stat-badge"><span class="stat-title">Win</span><span id="stat-win" class="stat-val">0</span></div>
        <div class="stat-badge"><span class="stat-title">Loss</span><span id="stat-loss" class="stat-val stat-loss">0</span></div>
      </div>

      <h4>Trade Settings</h4>
      <div class="hrtrader-row">
        <label>Trade Direction</label>
        <div id="hrtrader-dir-group">
          <div class="toggle-btn" data-val="up">Up</div>
          <div class="toggle-btn" data-val="down">Down</div>
          <div class="toggle-btn" data-val="random">Random</div>
        </div>
      </div>
      
      <div class="hrtrader-row">
        <label>Delay Mode</label>
        <div id="hrtrader-delay-mode-group">
          <div class="toggle-btn" data-val="manual">Manual</div>
          <div class="toggle-btn" data-val="auto">Auto (0-60s)</div>
        </div>
      </div>
      <div class="hrtrader-row" id="manual-delay-wrapper">
        <label>Manual Delay (sec)</label>
        <input id="hrtrader-delay-input" class="hrtrader-input-block" type="number" min="1" max="120" />
      </div>

      <div class="hrtrader-grid-2">
        <div class="hrtrader-row"><label>Max Trades</label><input id="hrtrader-maxtrades" class="hrtrader-input-block" type="number" min="1"/></div>
        <div class="hrtrader-row"><label>Min Payout (%)</label><input id="hrtrader-minpayout" class="hrtrader-input-block" type="number" min="1" max="100"/></div>
      </div>

      <h4>Auto Trade Mode</h4>
      <div class="switch-wrap">
        <span>Enable Auto Loop</span>
        <label class="switch"><input type="checkbox" id="hrtrader-auto-toggle"><span class="slider"></span></label>
      </div>
      <div class="hrtrader-row">
        <label>Auto Trade End Time (HH:MM)</label>
        <input id="hrtrader-auto-end" class="hrtrader-input-block" type="text" placeholder="HH:MM" style="text-align:center;"/>
      </div>

      <h4>Pending Scheduler</h4>
      <div class="switch-wrap">
        <span>Enable Exact Time Trade</span>
        <label class="switch"><input type="checkbox" id="hrtrader-pending-toggle"><span class="slider"></span></label>
      </div>
      <div class="hrtrader-grid-2">
        <div class="hrtrader-row"><label>Time (HH:MM)</label><input id="hrtrader-pending-time" class="hrtrader-input-block" type="text" style="text-align:center;"/></div>
        <div class="hrtrader-row"><label>Direction</label>
          <select id="hrtrader-pending-dir" class="hrtrader-input-block">
            <option value="up">Up</option><option value="down">Down</option>
          </select>
        </div>
      </div>

      <h4>Grid Customization</h4>
      <div class="switch-wrap">
        <span>Show Horizontal Grid</span>
        <label class="switch"><input type="checkbox" id="hrtrader-grid-toggle"><span class="slider"></span></label>
      </div>
      <div class="hrtrader-grid-2">
        <div class="hrtrader-row"><label>Line Count</label><input id="hrtrader-grid-lines" class="hrtrader-input-block" type="number" min="1" max="20"/></div>
        <div class="hrtrader-row"><label>Offset (%)</label><input id="hrtrader-grid-offset" class="hrtrader-input-block" type="number" min="0" max="50"/></div>
      </div>

      <button type="button" id="hrtrader-save-all" class="hrtrader-save-btn">Save Settings</button>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    // Setup toggles
    function setupToggleGroup(groupId, stateKey, onChange) {
      const btns = panel.querySelectorAll(`#${groupId} .toggle-btn`);
      btns.forEach(btn => {
        btn.addEventListener("click", () => {
          btns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          settings[stateKey] = btn.dataset.val;
          if(onChange) onChange();
        });
      });
      function updateUI() {
        btns.forEach(b => b.classList.toggle("active", b.dataset.val === settings[stateKey]));
      }
      updateUI();
      return updateUI;
    }

    const updateDirUI = setupToggleGroup("hrtrader-dir-group", "direction");
    const updateDelayUI = setupToggleGroup("hrtrader-delay-mode-group", "delayMode", () => {
      panel.querySelector("#manual-delay-wrapper").style.display = settings.delayMode === "manual" ? "block" : "none";
    });

    function syncPanelUI() {
      panel.querySelector("#hrtrader-delay-input").value = settings.delaySec;
      panel.querySelector("#hrtrader-maxtrades").value = settings.maxTrades;
      panel.querySelector("#hrtrader-minpayout").value = settings.minPayout;
      panel.querySelector("#hrtrader-auto-toggle").checked = settings.autoTradeEnabled;
      panel.querySelector("#hrtrader-auto-end").value = settings.autoTradeEndTime;
      panel.querySelector("#hrtrader-pending-toggle").checked = settings.pendingEnabled;
      panel.querySelector("#hrtrader-pending-time").value = settings.pendingTime;
      panel.querySelector("#hrtrader-pending-dir").value = settings.pendingDir;
      panel.querySelector("#hrtrader-grid-toggle").checked = settings.showGrid;
      panel.querySelector("#hrtrader-grid-lines").value = settings.gridLines;
      panel.querySelector("#hrtrader-grid-offset").value = settings.gridOffset;

      panel.querySelector("#stat-trades").textContent = sessionStats.tradesCount;
      panel.querySelector("#stat-win").textContent = sessionStats.winCount;
      panel.querySelector("#stat-loss").textContent = sessionStats.lossCount;

      updateDirUI(); updateDelayUI();
    }

    function applyAllSettings() {
      settings.delaySec = Math.max(1, parseInt(panel.querySelector("#hrtrader-delay-input").value) || defaults.delaySec);
      settings.maxTrades = Math.max(1, parseInt(panel.querySelector("#hrtrader-maxtrades").value) || defaults.maxTrades);
      settings.minPayout = Math.max(1, parseInt(panel.querySelector("#hrtrader-minpayout").value) || defaults.minPayout);
      settings.autoTradeEnabled = panel.querySelector("#hrtrader-auto-toggle").checked;
      settings.autoTradeEndTime = panel.querySelector("#hrtrader-auto-end").value || getSafeFutureTimeHHMM(30);
      settings.pendingEnabled = panel.querySelector("#hrtrader-pending-toggle").checked;
      settings.pendingTime = panel.querySelector("#hrtrader-pending-time").value || getSafeFutureTimeHHMM();
      settings.pendingDir = panel.querySelector("#hrtrader-pending-dir").value;
      settings.showGrid = panel.querySelector("#hrtrader-grid-toggle").checked;
      settings.gridLines = Math.max(1, parseInt(panel.querySelector("#hrtrader-grid-lines").value) || 4);
      settings.gridOffset = Math.max(0, parseInt(panel.querySelector("#hrtrader-grid-offset").value) || 0);

      saveSettings(settings);
      buildGrid();
      startPendingScheduler();
      handleAutoTradeLoop();
      backdrop.classList.remove("hrtrader-backdrop-open");
      panel.classList.remove("hrtrader-panel-open");
    }

    panel.querySelector("#hrtrader-save-all").addEventListener("click", applyAllSettings);
    backdrop.addEventListener("click", () => {
      backdrop.classList.remove("hrtrader-backdrop-open");
      panel.classList.remove("hrtrader-panel-open");
    });
    panel.addEventListener("mousedown", e => e.stopPropagation());
    panel.addEventListener("touchstart", e => e.stopPropagation(), {passive:true});

    const widget = document.createElement("div");
    widget.id = "hrtrader-widget";
    widget.innerHTML = `<div id="hrtrader-logo-wrap"><img src="${LOGO_URL}" draggable="false" /></div><span id="hrtrader-label">${LABEL}</span>`;
    document.body.appendChild(widget);
    const widgetLabelEl = widget.querySelector("#hrtrader-label");

    function flashWidgetLabel(text, color) {
      widgetLabelEl.textContent = text; widgetLabelEl.style.color = color;
      setTimeout(() => { widgetLabelEl.textContent = LABEL; widgetLabelEl.style.color = ""; }, 2500);
    }

    // --- State-Machine PnL Tracker (Fixing the Race Condition) ---
    function getAccountBalance() {
      const targetEl = document.querySelector(".v2KPX.X6PB5") || document.querySelector(".v2KPX.lTzTl");
      if (targetEl && targetEl.parentElement) {
        const amtEl = targetEl.parentElement.querySelector(".Zt1hG");
        if (amtEl) return parseFloat(amtEl.textContent.replace(/[^0-9.]/g, "")) || null;
      }
      return null;
    }

    let tradeState = 0; // 0 = Idle, 1 = Placed (waiting for drop), 2 = Dropped (waiting for result)
    let preTradeBalance = 0;
    let fallbackLossTimer = null;

    function resetTradeState() {
      tradeState = 0;
      if (fallbackLossTimer) clearTimeout(fallbackLossTimer);
    }

    function startBalanceTracker() {
      if (balanceCheckInterval) clearInterval(balanceCheckInterval);
      sessionStats.lastBalance = getAccountBalance();

      balanceCheckInterval = setInterval(() => {
        const current = getAccountBalance();
        if (current === null || sessionStats.lastBalance === null) return;

        if (current !== sessionStats.lastBalance) {
          if (tradeState === 1 && current < sessionStats.lastBalance) {
            // Balance dropped -> Trade Entry Confirmed
            tradeState = 2;
          } else if (tradeState === 2 && current > sessionStats.lastBalance) {
            // Balance changed and went up -> Check Result
            if (current >= preTradeBalance) {
              sessionStats.winCount++;
              resetTradeState();
              syncPanelUI();
            }
          }
          sessionStats.lastBalance = current;
        }
      }, 300);
    }

    function getTradeButtons() {
      let upBtn = null, downBtn = null;
      const tc = document.querySelector("#trade-button");
      if (tc) {
        tc.querySelectorAll("button").forEach(btn => {
          const t = btn.textContent.trim().toLowerCase();
          if (t.includes("up")) upBtn = btn;
          else if (t.includes("down")) downBtn = btn;
        });
      }
      return { up: upBtn, down: downBtn };
    }

    function safeTouchClick(element) {
      if (!element) return;
      try {
        element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        setTimeout(() => {
          element.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
          element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          element.click();
        }, 10);
      } catch { element.click(); }
    }

    function executeTrade(customDir) {
      if (sessionStats.tradesCount >= settings.maxTrades) {
        flashWidgetLabel("MAX REACHED", "#ff5252");
        settings.autoTradeEnabled = false;
        return false;
      }
      
      const payoutEl = document.querySelector(".OmOPV .eB25d") || document.querySelector("#mobile-asset-btn .UI2Kh");
      const payout = payoutEl ? parseInt(payoutEl.textContent.replace(/[^0-9]/g, ""), 10) : null;
      
      if (payout !== null && payout < settings.minPayout) {
        flashWidgetLabel(`LOW ${payout}%`, "#ffb020");
        return false;
      }

      let dir = customDir || settings.direction;
      if (dir === "random") dir = Math.random() > 0.5 ? "up" : "down";
      const btns = getTradeButtons();
      const btn = dir === "up" ? btns.up : btns.down;

      if (!btn) {
        flashWidgetLabel("NO BTN", "#ff5252");
        return false;
      }

      // Initiate PnL tracking for this trade
      preTradeBalance = getAccountBalance() || sessionStats.lastBalance;
      tradeState = 1; 
      if(fallbackLossTimer) clearTimeout(fallbackLossTimer);
      // Fallback: If no win registered within 3 minutes, count as loss.
      fallbackLossTimer = setTimeout(() => {
        if (tradeState === 1 || tradeState === 2) {
          sessionStats.lossCount++;
          tradeState = 0;
          syncPanelUI();
        }
      }, 180000); 

      safeTouchClick(btn);
      sessionStats.tradesCount++;
      syncPanelUI();
      flashWidgetLabel(dir.toUpperCase(), "#00ff66");
      return true;
    }

    // --- Optimized Pending Scheduler (Zero Delay) ---
    function startPendingScheduler() {
      if (pendingTimeoutId) clearTimeout(pendingTimeoutId);
      if (!settings.pendingEnabled || !settings.pendingTime) return;

      const [targetHH, targetMM] = settings.pendingTime.split(":").map(Number);
      const now = new Date();
      const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHH, targetMM, 0, 0);
      
      let delayMs = targetTime.getTime() - Date.now();
      if (delayMs < 0) {
        // Time already passed for today
        settings.pendingEnabled = false;
        syncPanelUI();
        return;
      }

      pendingTimeoutId = setTimeout(() => {
        if (!settings.pendingEnabled) return;
        executeTrade(settings.pendingDir);
        settings.pendingEnabled = false;
        syncPanelUI();
      }, delayMs);
    }

    // --- Auto Trade Mode Loop ---
    function handleAutoTradeLoop() {
      if (autoTradeTimer) clearTimeout(autoTradeTimer);
      if (!settings.autoTradeEnabled) return;

      const now = new Date();
      const [endHH, endMM] = settings.autoTradeEndTime.split(":").map(Number);
      const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHH, endMM, 0, 0);

      if (now.getTime() >= endTime.getTime()) {
        settings.autoTradeEnabled = false;
        flashWidgetLabel("TIME UP", "#ffb020");
        syncPanelUI();
        return;
      }

      let delayMs = settings.delayMode === "auto" 
        ? Math.floor(Math.random() * 61) * 1000 
        : settings.delaySec * 1000;

      autoTradeTimer = setTimeout(() => {
        if (settings.autoTradeEnabled) {
          executeTrade();
          handleAutoTradeLoop(); // Schedule next
        }
      }, delayMs);
    }

    // Single click manual trigger
    let tapCount = 0; let tapTimer = null;
    widget.addEventListener("pointerup", (e) => {
      if(e.clientX - startX > 10 || e.clientY - startY > 10) return; // was a drag
      tapCount++;
      if (tapTimer) clearTimeout(tapTimer);
      if (tapCount >= TAP_REQUIRED) {
        tapCount = 0;
        syncPanelUI();
        backdrop.classList.add("hrtrader-backdrop-open");
        panel.classList.add("hrtrader-panel-open");
      } else {
        tapTimer = setTimeout(() => {
          if (tapCount === 1 && !settings.autoTradeEnabled) {
            executeTrade();
          }
          tapCount = 0;
        }, TAP_SETTLE_MS);
      }
    });

    // Drag Logic
    let dragging = false, startX, startY, initLeft, initTop;
    widget.addEventListener("pointerdown", e => {
      dragging = true; startX = e.clientX; startY = e.clientY;
      const rect = widget.getBoundingClientRect();
      initLeft = rect.left; initTop = rect.top;
    });
    document.addEventListener("pointermove", e => {
      if (!dragging) return;
      let nx = initLeft + (e.clientX - startX);
      let ny = initTop + (e.clientY - startY);
      widget.style.left = `${Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, nx))}px`;
      widget.style.top = `${Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, ny))}px`;
      widget.style.transform = "none";
    });
    document.addEventListener("pointerup", () => dragging = false);

    startBalanceTracker();
    startPendingScheduler();
    syncPanelUI();
    console.log("HRTrader v10.4 Loaded — PnL State-Machine & Precision Timers Active.");
  }

  showPasswordGate(initHRTrader);
})();