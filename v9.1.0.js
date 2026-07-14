/**
 * HRTrader Pro v9.9 — Ultimate Universal Fix (Mobile & PC)
 * 100% Fixed: Touch Sensitivity, Safe Event Dispatcher, Zero-Lag Pending & Scan.
 */
(function () {
  if (window.__HRTrader_ACTIVE__) {
    console.warn("HRTrader already running.");
    return;
  }

  const HRTrader_PASSWORD = "Jokar99T";
  const PW_STORAGE_KEY = "hrtrader_saved_password";

  function getSavedPassword() {
    try { return localStorage.getItem(PW_STORAGE_KEY) || sessionStorage.getItem(PW_STORAGE_KEY) || ""; } catch { return ""; }
  }

  function rememberPassword(pw) {
    try { localStorage.setItem(PW_STORAGE_KEY, pw); } catch { try { sessionStorage.setItem(PW_STORAGE_KEY, pw); } catch {} }
  }

  function showPasswordGate(onSuccess) {
    const loginStyle = document.createElement("style");
    loginStyle.id = "hrtrader-login-style";
    loginStyle.textContent = `
      #hrtrader-login-overlay { position: fixed; inset: 0; z-index: 2147483647; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.8); font-family: system-ui, sans-serif; }
      #hrtrader-login-box { width: min(320px, calc(100vw - 32px)); padding: 25px 20px; border-radius: 14px; background: linear-gradient(160deg, #0d1f14 0%, #0a0f0c 100%); border: 1px solid #00ff66; box-shadow: 0 0 50px rgba(0, 255, 102, 0.25); }
      #hrtrader-login-box h3 { margin: 0 0 6px; text-align: center; color: #00ff66; font-size: 20px; letter-spacing: 0.05em; }
      #hrtrader-login-box p { margin: 0 0 15px; text-align: center; font-size: 12px; color: #9fd4ad; }
      #hrtrader-login-input { box-sizing: border-box; width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 255, 102, 0.4); background: rgba(0, 0, 0, 0.5); color: #fff; font-size: 16px; outline: none; text-align: center; }
      #hrtrader-login-btn { width: 100%; margin-top: 15px; padding: 12px; border: none; border-radius: 8px; background: #00ff66; color: #052210; font-weight: 700; font-size: 15px; cursor: pointer; }
      #hrtrader-login-err { min-height: 18px; margin-top: 10px; text-align: center; font-size: 12px; color: #ff6b6b; font-weight: 600; }
    `;
    document.head.appendChild(loginStyle);

    const overlay = document.createElement("div");
    overlay.id = "hrtrader-login-overlay";
    overlay.innerHTML = `
      <div id="hrtrader-login-box">
        <h3>HRTrader Pro Control</h3>
        <p>মামা, পাসওয়ার্ডটা দিয়ে দিন</p>
        <input id="hrtrader-login-input" type="password" autocomplete="current-password" />
        <button type="button" id="hrtrader-login-btn">লগইন করুন</button>
        <p id="hrtrader-login-err"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector("#hrtrader-login-input");
    const errEl = overlay.querySelector("#hrtrader-login-err");
    const btn = overlay.querySelector("#hrtrader-login-btn");

    input.value = getSavedPassword();

    function tryLogin() {
      if (input.value === HRTrader_PASSWORD) {
        rememberPassword(input.value);
        overlay.remove();
        loginStyle.remove();
        initHRTrader();
        return;
      }
      errEl.textContent = "ভুল পাসওয়ার্ড! আবার ট্রাই করুন।";
    }

    btn.addEventListener("click", tryLogin);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
    setTimeout(() => input.focus(), 50);
  }

  function initHRTrader() {
    window.__HRTrader_ACTIVE__ = true;

    const STORAGE_KEY = "hrtrader_pro_settings_v9";
    const TAP_REQUIRED = 3;
    const TAP_SETTLE_MS = 350;
    const TAP_SEQUENCE_MS = 600;

    function getSafeFutureTimeHHMM() {
      let now = new Date();
      now.setMinutes(now.getMinutes() + 1);
      let hh = String(now.getHours()).padStart(2, '0');
      let mm = String(now.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }

    const defaults = {
      delaySec: 10,
      direction: "random",
      maxTrades: 20,
      minPayout: 70,
      showGrid: false,
      shutdownMin: 30,
      pendingTime: "",
      pendingDir: "up",
      pendingEnabled: false
    };

    let sessionStats = { 
      tradesCount: 0, 
      winCount: 0, 
      lossCount: 0, 
      baseBalance: null, 
      lastBalance: null,
      lastDirection: "up",
      isTradeActive: false
    };

    let shutdownTimerTimeout = null;
    let pendingAnimationId = null;
    let pendingBackupInterval = null;
    let balanceCheckInterval = null;

    function loadSettings() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          let parsed = JSON.parse(stored);
          if(!parsed.pendingTime) parsed.pendingTime = getSafeFutureTimeHHMM();
          return { ...defaults, ...parsed };
        }
      } catch {}
      return { ...defaults, pendingTime: getSafeFutureTimeHHMM() };
    }

    function saveSettings(s) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); return true; } catch { return false; }
    }

    let settings = loadSettings();

    // চার্ট গ্রিড ওভারলে
    const gridOverlay = document.createElement("div");
    gridOverlay.id = "hrtrader-grid-overlay";
    gridOverlay.style.cssText = "position:fixed; inset:0; z-index:1; pointer-events:none; display:none; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr);";
    for(let i=0; i<36; i++) {
      const cell = document.createElement("div");
      cell.style.cssText = "border: 1px dashed rgba(0, 255, 102, 0.15);";
      gridOverlay.appendChild(cell);
    }
    document.body.appendChild(gridOverlay);

    function toggleGrid(show) { gridOverlay.style.display = show ? "grid" : "none"; }
    toggleGrid(settings.showGrid);

    const style = document.createElement("style");
    style.textContent = `
      #hrtrader-widget { position: fixed; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: grab; touch-action: none; user-select: none; left: 20px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6)); width: 68px; }
      #hrtrader-widget.hrtrader-glow { filter: drop-shadow(0 0 20px #00ff66); }
      #hrtrader-logo-wrap { width: 56px; height: 56px; border-radius: 50%; background: radial-gradient(circle, #0a1f12 0%, #040805 100%); display: flex; align-items: center; justify-content: center; pointer-events: none; border: 2.5px solid #00ff66; box-shadow: inset 0 0 10px rgba(0,255,102,0.5); }
      #hrtrader-label { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 800; color: #00ff66; text-shadow: 0 2px 4px #000; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(0,0,0,0.7); padding: 2px 6px; border-radius: 10px; border: 1px solid rgba(0,255,102,0.2); white-space: nowrap; }
      
      #hrtrader-panel { position: fixed; z-index: 2147483647; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; width: min(350px, calc(100vw - 20px)); max-height: 85vh; overflow-y: auto; padding: 20px; border-radius: 14px; background: linear-gradient(160deg, #07140b 0%, #050806 100%); border: 1px solid #00ff66; box-shadow: 0 12px 40px rgba(0,0,0,0.7); font-family: system-ui, sans-serif; color: #e8ffe8; }
      #hrtrader-panel.hrtrader-panel-open { display: block; }
      #hrtrader-panel h3 { margin: 0 0 12px; font-size: 18px; text-align: center; color: #00ff66; letter-spacing: 0.05em; border-bottom: 1px solid rgba(0,255,102,0.2); padding-bottom: 6px; }
      #hrtrader-panel h4 { margin: 10px 0 6px; font-size: 13px; color: #00ff66; text-transform: uppercase; letter-spacing: 0.03em; }
      
      .hrtrader-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
      .hrtrader-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
      .hrtrader-row { margin-bottom: 8px; }
      #hrtrader-panel label { display: block; font-size: 11px; color: #9fd4ad; margin-bottom: 3px; font-weight: 600; }
      #hrtrader-panel input, #hrtrader-panel select { box-sizing: border-box; width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.3); background: rgba(0,0,0,0.4); color: #fff; font-size: 13px; outline: none; }
      
      #hrtrader-dir-group { display: flex; gap: 6px; }
      #hrtrader-dir-group button { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.25); background: rgba(0,0,0,0.3); color: #dfffe8; font-size: 12px; font-weight: 600; cursor: pointer; }
      #hrtrader-dir-group button.hrtrader-dir-active { background: rgba(0,255,102,0.2); border-color: #00ff66; color: #00ff66; }
      
      .time-control-group { display: flex; gap: 4px; align-items: center; }
      .time-btn { padding: 8px 10px; background: rgba(0, 255, 102, 0.15); border: 1px solid #00ff66; color: #00ff66; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; white-space: nowrap; }
      .time-btn:hover { background: rgba(0, 255, 102, 0.3); }

      .hrtrader-btn-action { display: block; width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 6px; background: #00ff66; color: #052210; font-weight: 700; font-size: 14px; cursor: pointer; text-align: center; }
      #hrtrader-panel-backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,0.6); display: none; }
      #hrtrader-panel-backdrop.hrtrader-backdrop-open { display: block; }
      
      .stat-badge { background: rgba(0,255,102,0.1); border: 1px solid rgba(0,255,102,0.2); padding: 8px; border-radius: 6px; text-align: center; font-size: 12px; }
      .stat-title { font-size: 10px; color: #9fd4ad; display: block; }
      .stat-val { font-size: 14px; font-weight: 700; color: #00ff66; }
      .stat-win { color: #00ff66; }
      .stat-loss { color: #ff5252; }
      .section-divider { border-top: 1px dashed rgba(0, 255, 102, 0.2); margin: 15px 0 10px; }

      .switch-wrap { display: flex; align-items: center; justify-content: space-between; background: rgba(0, 255, 102, 0.05); padding: 8px 12px; border-radius: 8px; border: 1px dashed rgba(0, 255, 102, 0.2); margin-bottom: 10px; }
      .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; inset: 0; background-color: #223a2a; transition: .3s; border-radius: 22px; border: 1px solid rgba(0, 255, 102, 0.3); }
      .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: #9fd4ad; transition: .3s; border-radius: 50%; }
      input:checked + .slider { background-color: #00ff66; border-color: #00ff66; }
      input:checked + .slider:before { transform: translateX(22px); background-color: #052210; }

      #hrtrader-scan-overlay { position: fixed; inset:0; z-index: 2147483645; pointer-events: none; display: none; }
      #hrtrader-scan-overlay.hrtrader-scan-on { display: block; }
      #hrtrader-scan-line { position: absolute; left: 0; width: 100%; height: 4px; background: #00ff66; box-shadow: 0 0 20px #00ff66; top: -5%; animation: hrtrader-scan-move 1.5s linear infinite; }
      @keyframes hrtrader-scan-move { 0% { top: -5%; } 100% { top: 105%; } }
    `;
    document.body.appendChild(style);

    const scanOverlay = document.createElement("div");
    scanOverlay.id = "hrtrader-scan-overlay";
    scanOverlay.innerHTML = '<div id="hrtrader-scan-line"></div>';
    document.body.appendChild(scanOverlay);

    const backdrop = document.createElement("div");
    backdrop.id = "hrtrader-panel-backdrop";

    const panel = document.createElement("div");
    panel.id = "hrtrader-panel";
    panel.innerHTML = `
      <h3>HRTrader Robot Dashboard (v9.9)</h3>
      
      <div class="hrtrader-grid-3">
        <div class="stat-badge"><span class="stat-title">টোটাল ট্রেড</span><span id="stat-trades" class="stat-val">0</span></div>
        <div class="stat-badge"><span class="stat-title">লাভ (WIN)</span><span id="stat-win" class="stat-val stat-win">0</span></div>
        <div class="stat-badge"><span class="stat-title">লস (LOSS)</span><span id="stat-loss" class="stat-val stat-loss">0</span></div>
      </div>

      <h4>সাধারণ কনফিগারেশন</h4>
      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>স্ক্যান ডিলে (সেকেন্ড)</label>
          <input id="cfg-delay" type="number" min="1" max="120" />
        </div>
        <div class="hrtrader-row">
          <label>অটো স্টপ টাইমার (মি.)</label>
          <input id="cfg-shutdown" type="number" min="1" />
        </div>
      </div>

      <div class="hrtrader-row">
        <label>ট্রেড ডিরেকশন</label>
        <div id="hrtrader-dir-group">
          <button type="button" data-dir="up">CALL (Up)</button>
          <button type="button" data-dir="down">PUT (Down)</button>
          <button type="button" data-dir="random">Random</button>
        </div>
      </div>

      <div class="hrtrader-row">
        <label>মিনিমাম পেআউট পার্সেন্ট (%)</label>
        <input id="cfg-min-payout" type="number" min="1" max="100" />
      </div>

      <div class="section-divider"></div>
      <h4>পেন্ডিং ট্রেড শিডিউলার</h4>

      <div class="switch-wrap">
        <span style="font-size: 12px; font-weight: bold; color: #00ff66;">পেন্ডিং ট্রেড চালু করুন (ON/OFF)</span>
        <label class="switch">
          <input type="checkbox" id="cfg-pending-toggle">
          <span class="slider"></span>
        </label>
      </div>
      
      <div class="hrtrader-row">
        <label>ট্রেড ওপেন TIME (HH:MM)</label>
        <div class="time-control-group">
          <button type="button" class="time-btn" id="time-minus">-1 min</button>
          <input id="cfg-pending-time" type="text" placeholder="HH:MM" style="text-align: center; font-weight: bold; font-size: 15px; color: #00ff66;" />
          <button type="button" class="time-btn" id="time-plus">+1 min</button>
        </div>
      </div>
      
      <div class="hrtrader-row">
        <label>পেন্ডিং ডিরেকশন</label>
        <select id="cfg-pending-dir">
          <option value="up">CALL (Up)</option>
          <option value="down">PUT (Down)</option>
        </select>
      </div>

      <div class="hrtrader-row" style="display:flex; align-items:center; gap:10px; margin-top:15px;">
        <input id="cfg-grid" type="checkbox" style="width:auto; cursor:pointer;" />
        <label for="cfg-grid" style="margin:0; cursor:pointer; font-size:12px;">চার্ট গ্রীড ওভারলে</label>
      </div>

      <button type="button" id="hrtrader-save-all" class="hrtrader-btn-action">সেটিংস সেভ করুন</button>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    const delayInput = panel.querySelector("#cfg-delay");
    const shutdownInput = panel.querySelector("#cfg-shutdown");
    const minPayoutInput = panel.querySelector("#cfg-min-payout");
    const pendingTimeInput = panel.querySelector("#cfg-pending-time");
    const pendingDirSelect = panel.querySelector("#cfg-pending-dir");
    const pendingToggle = panel.querySelector("#cfg-pending-toggle");
    const gridCheckbox = panel.querySelector("#cfg-grid");
    const dirButtons = panel.querySelectorAll("#hrtrader-dir-group button");
    
    let currentSelectedDirection = settings.direction;

    function modifyMinutes(amount) {
      let currentVal = pendingTimeInput.value.trim();
      let parts = currentVal.split(":");
      let hh = parseInt(parts[0]) || 0;
      let mm = parseInt(parts[1]) || 0;
      let d = new Date();
      d.setHours(hh);
      d.setMinutes(mm + amount);
      let newHH = String(d.getHours()).padStart(2, '0');
      let newMM = String(d.getMinutes()).padStart(2, '0');
      pendingTimeInput.value = `${newHH}:${newMM}`;
    }

    panel.querySelector("#time-plus").addEventListener("click", () => modifyMinutes(1));
    panel.querySelector("#time-minus").addEventListener("click", () => modifyMinutes(-1));

    function syncUI() {
      delayInput.value = settings.delaySec;
      shutdownInput.value = settings.shutdownMin;
      minPayoutInput.value = settings.minPayout;
      pendingTimeInput.value = settings.pendingTime || getSafeFutureTimeHHMM();
      pendingDirSelect.value = settings.pendingDir;
      pendingToggle.checked = settings.pendingEnabled;
      gridCheckbox.checked = settings.showGrid;
      
      currentSelectedDirection = settings.direction;
      dirButtons.forEach(b => b.classList.toggle("hrtrader-dir-active", b.dataset.dir === currentSelectedDirection));
      
      panel.querySelector("#stat-trades").textContent = sessionStats.tradesCount;
      panel.querySelector("#stat-win").textContent = sessionStats.winCount;
      panel.querySelector("#stat-loss").textContent = sessionStats.lossCount;
    }

    dirButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        currentSelectedDirection = btn.dataset.dir;
        dirButtons.forEach(b => b.classList.toggle("hrtrader-dir-active", b.dataset.dir === currentSelectedDirection));
      });
    });

    function saveAll() {
      settings.delaySec = Math.max(1, parseInt(delayInput.value) || 10);
      settings.shutdownMin = Math.max(1, parseInt(shutdownInput.value) || 30);
      settings.minPayout = Math.max(1, parseInt(minPayoutInput.value) || 70);
      settings.pendingTime = pendingTimeInput.value.trim();
      settings.pendingDir = pendingDirSelect.value;
      settings.pendingEnabled = pendingToggle.checked;
      settings.showGrid = gridCheckbox.checked;
      settings.direction = currentSelectedDirection;

      saveSettings(settings);
      toggleGrid(settings.showGrid);
      
      startShutdownTimer();
      startPendingScheduler(); 
      closePanel();
    }

    panel.querySelector("#hrtrader-save-all").addEventListener("click", saveAll);
    backdrop.addEventListener("click", closePanel);

    function openPanel() { syncUI(); backdrop.classList.add("hrtrader-backdrop-open"); panel.classList.add("hrtrader-panel-open"); }
    function closePanel() { backdrop.classList.remove("hrtrader-backdrop-open"); panel.classList.remove("hrtrader-panel-open"); }

    const widget = document.createElement("div");
    widget.id = "hrtrader-widget";
    widget.innerHTML = `
      <div id="hrtrader-logo-wrap">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a3 3 0 0 0-3 3v1H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4V5a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v1h-2V5zm-6 3h14v10H5V8zm4 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-6 4h6v1H9v-1z" fill="#00ff66"/>
        </svg>
      </div>
      <span id="hrtrader-label">HRTrader</span>
    `;
    document.body.appendChild(widget);

    let scanActive = false, tradeTimer = null, tapCount = 0, tapSettleTimer = null, lastTapAt = 0;

    // ১. ফিক্সড ব্যালেন্স সিলেক্টর[span_0](start_span)[span_0](end_span)
    function getAccountBalance() {
      let liveBalEl = document.querySelector(".v2KPX.X6PB5");
      let demoBalEl = document.querySelector(".v2KPX.lTzTl");
      let targetEl = liveBalEl || demoBalEl;
      if (targetEl && targetEl.parentElement) {
        let amtEl = targetEl.parentElement.querySelector(".Zt1hG");
        if (amtEl) {
          let val = parseFloat(amtEl.textContent.replace(/[^0-9.]/g, ""));
          if (!isNaN(val)) return val;
        }
      }
      return null;
    }

    // ২. ফিক্সড পেআউট পার্সেন্টেজ রিডার[span_1](start_span)[span_1](end_span)
    function getCurrentPayoutPercent() {
      let payoutEl = document.querySelector(".OmOPV .eB25d") || document.querySelector("#mobile-asset-btn .UI2Kh");
      if (payoutEl) {
        let num = parseInt(payoutEl.textContent.replace(/[^0-9]/g, ''));
        if (!isNaN(num) && num > 0) return num;
      }
      return 80; 
    }

    function startBalanceTracker() {
      if (balanceCheckInterval) clearInterval(balanceCheckInterval);
      sessionStats.baseBalance = getAccountBalance();
      sessionStats.lastBalance = sessionStats.baseBalance;

      balanceCheckInterval = setInterval(() => {
        let current = getAccountBalance();
        if (current === null || sessionStats.lastBalance === null) return;
        if (current !== sessionStats.lastBalance) {
          if (!sessionStats.isTradeActive) {
            sessionStats.lastBalance = current;
            return;
          }
          if (current > sessionStats.lastBalance) {
            sessionStats.winCount++;
            sessionStats.isTradeActive = false;
          }
          sessionStats.lastBalance = current;
        }
      }, 1000);
    }

    function getTradeButtons() {
      let upBtn = document.querySelector(".KtjVk.JQZcs._5qIw.LzVPu") || document.querySelector(".btn-up");
      let downBtn = document.querySelector(".KtjVk.twQq3._5qIw.LzVPu") || document.querySelector(".btn-down");
      return { up: upBtn, down: downBtn };
    }

    // ৩. ক্র্যাশ-ফ্রি এবং আল্ট্রা-ফাস্ট টাচ ইভেন্ট জেনারেটর
    function safeTouchClick(element) {
      if (!element) return;
      try {
        // রিয়েল ক্লিকের ফিল দিতে সিকোয়েন্সিয়াল সিমুলেশন
        const pDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true });
        const mDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        const pUp = new PointerEvent('pointerup', { bubbles: true, cancelable: true, isPrimary: true });
        const mUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
        
        element.dispatchEvent(pDown);
        element.dispatchEvent(mDown);
        
        setTimeout(() => {
          element.dispatchEvent(pUp);
          element.dispatchEvent(mUp);
          element.click(); // ফাইনাল ফোর্স ক্লিক
        }, 10);
      } catch (err) {
        // কোনো কারণে ফেইল হলে ডিরেক্ট স্ট্যান্ডার্ড ক্লিক রান করবে
        element.click();
      }
    }

    function executePlatformTrade(customDir = null) {
      if (sessionStats.tradesCount >= settings.maxTrades) {
        stopScanSession();
        return;
      }

      let currentPayout = getCurrentPayoutPercent();
      if (currentPayout < settings.minPayout) {
        console.warn(`Payout too low (${currentPayout}%). Skipped.`);
        stopScanSession();
        return;
      }

      const { up, down } = getTradeButtons();
      if (!up || !down) {
        console.error("Trade buttons not found!");
        stopScanSession();
        return;
      }

      let finalDir = customDir || settings.direction;
      if (finalDir === "random") finalDir = Math.random() > 0.5 ? "up" : "down";

      let targetBtn = (finalDir === "up" ? up : down);
      try {
        sessionStats.isTradeActive = true;
        
        // সেফ ফাস্ট টাচ ক্লিক রান করুন
        safeTouchClick(targetBtn);

        sessionStats.tradesCount++;
        sessionStats.lastDirection = finalDir; 
        console.log(`[HRTrader] Target Fired: ${finalDir} | Payout: ${currentPayout}%`);
      } catch(e) {
        console.error("Execution click error: ", e);
        sessionStats.isTradeActive = false;
      }
      stopScanSession();
    }

    function startShutdownTimer() {
      if (shutdownTimerTimeout) clearTimeout(shutdownTimerTimeout);
      shutdownTimerTimeout = setTimeout(() => {
        window.__HRTrader_ACTIVE__ = false;
        widget.remove();
        gridOverlay.remove();
        panel.remove();
        backdrop.remove();
        if (pendingAnimationId) cancelAnimationFrame(pendingAnimationId);
        if (pendingBackupInterval) clearInterval(pendingBackupInterval);
        if (balanceCheckInterval) clearInterval(balanceCheckInterval);
      }, settings.shutdownMin * 60 * 1000);
    }

    // ৪. ডোম ক্লক ও হাই-স্পিড ডুয়াল সিঙ্ক শিডিউলার[span_2](start_span)[span_2](end_span)
    function startPendingScheduler() {
      if (pendingAnimationId) cancelAnimationFrame(pendingAnimationId);
      if (pendingBackupInterval) clearInterval(pendingBackupInterval);
      pendingAnimationId = null;
      pendingBackupInterval = null;
      
      if (!settings.pendingEnabled || !settings.pendingTime) return;
      
      const targetParts = settings.pendingTime.split(":");
      const targetHH = parseInt(targetParts[0]) || 0;
      const targetMM = parseInt(targetParts[1]) || 0;

      console.log(`[HRTrader] Scheduler Armed for ${settings.pendingTime}. Mobile hybrid mode active.`);
      
      let isExecuted = false;

      function checkTimeHighPrecision() {
        if (!settings.pendingEnabled || isExecuted) return;

        let currentHH = null;
        let currentMM = null;

        // প্ল্যাটফর্মের লাইভ সার্ভার ঘড়ি ট্র্যাক[span_3](start_span)[span_3](end_span)
        let platformClockEl = document.querySelector(".xO39Y .jHgax") || document.querySelector(".jHgax");
        if (platformClockEl) {
          let pParts = platformClockEl.textContent.trim().split(":");[span_4](start_span)[span_4](end_span)
          if (pParts.length >= 2) {
            currentHH = parseInt(pParts[0]);
            currentMM = parseInt(pParts[1]);
          }
        }

        if (currentHH === null || currentMM === null || isNaN(currentHH) || isNaN(currentMM)) {
          const now = new Date();
          currentHH = now.getHours();
          currentMM = now.getMinutes();
        }

        if (currentHH === targetHH && currentMM === targetMM) {
          isExecuted = true;
          settings.pendingEnabled = false; 
          saveSettings(settings);
          
          if (pendingBackupInterval) clearInterval(pendingBackupInterval);
          
          executePlatformTrade(settings.pendingDir);
          syncUI();
          return; 
        }

        if (!isExecuted) {
          pendingAnimationId = requestAnimationFrame(checkTimeHighPrecision);
        }
      }

      pendingAnimationId = requestAnimationFrame(checkTimeHighPrecision);
      pendingBackupInterval = setInterval(checkTimeHighPrecision, 20); // ২০ms ফাস্ট লুপ (মোবাইল প্রুফ)
    }

    // ৫. মোবাইল ফিক্সড স্ক্যান টাইমার (পাওয়ার সেভিং ব্রেকার)
    function startAutoTrade() {
      if (scanActive) return;
      closePanel();
      scanActive = true;
      widget.classList.add("hrtrader-glow");
      scanOverlay.classList.add("hrtrader-scan-on");

      let elapsedMs = 0;
      let targetMs = settings.delaySec * 1000;

      if (tradeTimer) clearInterval(tradeTimer);
      
      tradeTimer = setInterval(() => {
        elapsedMs += 100;
        if (elapsedMs >= targetMs) {
          clearInterval(tradeTimer);
          tradeTimer = null;
          executePlatformTrade();
        }
      }, 100); 
    }

    function stopScanSession() {
      widget.classList.remove("hrtrader-glow");
      scanOverlay.classList.remove("hrtrader-scan-on");
      scanActive = false;
      if (tradeTimer) { clearInterval(tradeTimer); tradeTimer = null; }
    }

    // ৬. মোবাইল টাচ-উইগেল ও সেন্সিটিভিটি প্রোটেকশন (উইজেট ট্যাপ ফিক্স)
    function registerTap() {
      if (panel.classList.contains("hrtrader-panel-open")) return;
      const now = Date.now();
      if (now - lastTapAt > TAP_SEQUENCE_MS) tapCount = 0;
      lastTapAt = now;
      tapCount++;

      if (tapSettleTimer) clearTimeout(tapSettleTimer);

      if (tapCount >= TAP_REQUIRED) {
        tapCount = 0;
        openPanel();
        return;
      }

      tapSettleTimer = setTimeout(() => {
        tapSettleTimer = null;
        if (tapCount === 1) { 
          if (scanActive) stopScanSession(); 
          else startAutoTrade(); 
        }
        tapCount = 0;
      }, TAP_SETTLE_MS);
    }

    let dragging = false, moved = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    
    widget.addEventListener("mousedown", (e) => {
      e.preventDefault(); dragging = true; moved = false;
      const r = widget.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY; startLeft = r.left; startTop = r.top;
    });

    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      let dx = e.clientX - startX; let dy = e.clientY - startY;
      // ১৫ পিক্সেলের বেশি সরলে ড্র্যাগ ধরবে, এর কম হলে নরমাল ট্যাপ হবে (সেন্সিটিভিটি ফিক্স)
      if (Math.abs(dx) > 15 || Math.abs(dy) > 15) moved = true;
      widget.style.transform = "none";
      widget.style.left = Math.max(0, Math.min(startLeft + dx, window.innerWidth - 70)) + "px";
      widget.style.top = Math.max(0, Math.min(startTop + dy, window.innerHeight - 90)) + "px";
    });

    document.addEventListener("mouseup", () => { if (dragging) { dragging = false; if (!moved) registerTap(); } });

    widget.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      dragging = true; moved = false;
      const r = widget.getBoundingClientRect();
      startX = e.touches[0].clientX; startY = e.touches[0].clientY; startLeft = r.left; startTop = r.top;
    }, { passive: true });

    document.addEventListener("touchmove", (e) => {
      if (!dragging) return;
      let dx = e.touches[0].clientX - startX; let dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 15 || Math.abs(dy) > 15) moved = true;
      widget.style.left = Math.max(0, Math.min(startLeft + dx, window.innerWidth - 70)) + "px";
      widget.style.top = Math.max(0, Math.min(startTop + dy, window.innerHeight - 90)) + "px";
    }, { passive: true });

    document.addEventListener("touchend", () => { if (dragging) { dragging = false; if (!moved) registerTap(); } });

    startShutdownTimer();
    startPendingScheduler();
    startBalanceTracker();

    console.log("HRTrader Ultimate Mobile-Ready Pro v9.9 Active!");
  }

  showPasswordGate(initHRTrader);
})();
