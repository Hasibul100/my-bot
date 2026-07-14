/**
 * HRTrader Pro Ultimate v5 — Live Dashboard Sync Edition
 * Target Selector: .deal-amount-input input.input-control__input[cite: 2]
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
        <p>মামা, পাসওয়ার্ডটা দিয়ে দিন</p>
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
      errEl.textContent = "ভুল পাসওয়ার্ড! আবার ট্রাই করুন।";
    }

    btn.addEventListener("click", tryLogin);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
    setTimeout(() => input.focus(), 50);
  }

  function initHRTrader() {
    window.__HRTrader_ACTIVE__ = true;

    const LOGO_URL = "https://cdn.phototourl.com/free/2026-05-22-7e33af14-9942-4c1e-9c27-b94db59f36b5.png";
    const STORAGE_KEY = "hrtrader_pro_settings_v5";
    const TAP_REQUIRED = 3;
    const TAP_SETTLE_MS = 380;
    const TAP_SEQUENCE_MS = 650;

    const defaults = {
      delaySec: 10,
      direction: "random",
      maxTrades: 20,
      martingaleMultiplier: 2.2,
      tpAmount: 50,
      slAmount: 30,
      showGrid: false,
      tradeAmount: 1,
      shutdownMin: 30,
      pendingTime: "",
      pendingAmount: 1,
      pendingDir: "up"
    };

    let sessionStats = { tradesCount: 0, currentMartingaleAmount: 1, baseBalance: null, lastDirection: "up", isMartingaleMode: false };
    let shutdownTimerTimeout = null;
    let pendingCheckInterval = null;

    function loadSettings() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return { ...defaults, ...JSON.parse(stored) };
      } catch {}
      return { ...defaults };
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

    // স্টাইলশীট
    const style = document.createElement("style");
    style.textContent = `
      #hrtrader-widget { position: fixed; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: grab; touch-action: none; user-select: none; left: 16px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45)); }
      #hrtrader-widget.hrtrader-glow { filter: drop-shadow(0 0 15px #00ff66); }
      #hrtrader-logo-wrap { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; pointer-events: none; border: 2px solid rgba(0,255,102,0.4); }
      #hrtrader-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
      #hrtrader-label { font-family: system-ui, sans-serif; font-size: 13px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px #000; }
      
      #hrtrader-panel { position: fixed; z-index: 2147483647; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; width: min(350px, calc(100vw - 20px)); max-height: 85vh; overflow-y: auto; padding: 20px; border-radius: 14px; background: linear-gradient(160deg, #07140b 0%, #050806 100%); border: 1px solid #00ff66; box-shadow: 0 12px 40px rgba(0,0,0,0.7); font-family: system-ui, sans-serif; color: #e8ffe8; }
      #hrtrader-panel.hrtrader-panel-open { display: block; }
      #hrtrader-panel h3 { margin: 0 0 12px; font-size: 18px; text-align: center; color: #00ff66; letter-spacing: 0.05em; border-bottom: 1px solid rgba(0,255,102,0.2); padding-bottom: 6px; }
      #hrtrader-panel h4 { margin: 10px 0 6px; font-size: 13px; color: #00ff66; text-transform: uppercase; letter-spacing: 0.03em; }
      
      .hrtrader-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
      .hrtrader-row { margin-bottom: 8px; }
      #hrtrader-panel label { display: block; font-size: 11px; color: #9fd4ad; margin-bottom: 3px; font-weight: 600; }
      #hrtrader-panel input, #hrtrader-panel select { box-sizing: border-box; width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.3); background: rgba(0,0,0,0.4); color: #fff; font-size: 13px; outline: none; }
      
      #hrtrader-dir-group { display: flex; gap: 6px; }
      #hrtrader-dir-group button { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.25); background: rgba(0,0,0,0.3); color: #dfffe8; font-size: 12px; font-weight: 600; cursor: pointer; }
      #hrtrader-dir-group button.hrtrader-dir-active { background: rgba(0,255,102,0.2); border-color: #00ff66; color: #00ff66; }
      
      .hrtrader-btn-action { display: block; width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 6px; background: #00ff66; color: #052210; font-weight: 700; font-size: 14px; cursor: pointer; text-align: center; }
      #hrtrader-panel-backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,0.6); display: none; }
      #hrtrader-panel-backdrop.hrtrader-backdrop-open { display: block; }
      
      .stat-badge { background: rgba(0,255,102,0.1); border: 1px solid rgba(0,255,102,0.2); padding: 8px; border-radius: 6px; text-align: center; font-size: 12px; }
      .stat-title { font-size: 10px; color: #9fd4ad; display: block; }
      .stat-val { font-size: 15px; font-weight: 700; color: #00ff66; }
      .section-divider { border-top: 1px dashed rgba(0, 255, 102, 0.2); margin: 15px 0 10px; }

      #hrtrader-scan-overlay { position: fixed; inset:0; z-index: 2147483645; pointer-events: none; display: none; }
      #hrtrader-scan-overlay.hrtrader-scan-on { display: block; }
      #hrtrader-scan-line { position: absolute; left: 0; width: 100%; height: 4px; background: #00ff66; box-shadow: 0 0 20px #00ff66; top: -5%; animation: hrtrader-scan-move 1.5s linear infinite; }
      @keyframes hrtrader-scan-move { 0% { top: -5%; } 100% { top: 105%; } }
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
      <h3>HRTrader Robot Dashboard</h3>
      
      <div class="hrtrader-grid-2" style="margin-bottom:10px;">
        <div class="stat-badge"><span class="stat-title">সেশন ট্রেড</span><span id="stat-trades" class="stat-val">0</span></div>
        <div class="stat-badge"><span class="stat-title">মার্টিনগেল সাইজ</span><span id="stat-martingale" class="stat-val">1x</span></div>
      </div>

      <h4>সাধারণ কনফিগারেশন</h4>
      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>ট্রেড অ্যামাউন্ট ($)</label>
          <input id="cfg-amount" type="number" min="1" />
        </div>
        <div class="hrtrader-row">
          <label>স্ক্যান ডিলে (সেকেন্ড)</label>
          <input id="cfg-delay" type="number" min="1" max="120" />
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

      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>মার্টিনগেল গুণিতক</label>
          <input id="cfg-multiplier" type="number" step="0.1" />
        </div>
        <div class="hrtrader-row">
          <label>অটো স্টপ টাইমার (মি.)</label>
          <input id="cfg-shutdown" type="number" min="1" />
        </div>
      </div>

      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>টেক প্রফিট ($)</label>
          <input id="cfg-tp" type="number" />
        </div>
        <div class="hrtrader-row">
          <label>স্টপ লস ($)</label>
          <input id="cfg-sl" type="number" />
        </div>
      </div>

      <div class="section-divider"></div>
      <h4>পেন্ডিং ট্রেড শিডিউলার (নির্দিষ্ট টাইম)</h4>
      
      <div class="hrtrader-row">
        <label>ট্রেড ওপেন টাইম (HH:MM:SS format)</label>
        <input id="cfg-pending-time" type="text" placeholder="যেমন: 14:35:00" />
      </div>
      
      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>পেন্ডিং অ্যামাউন্ট ($)</label>
          <input id="cfg-pending-amount" type="number" min="1" />
        </div>
        <div class="hrtrader-row">
          <label>পেন্ডিং ডিরেকশন</label>
          <select id="cfg-pending-dir">
            <option value="up">CALL (Up)</option>
            <option value="down">PUT (Down)</option>
          </select>
        </div>
      </div>

      <div class="hrtrader-row" style="display:flex; align-items:center; gap:10px; margin-top:10px;">
        <input id="cfg-grid" type="checkbox" style="width:auto; cursor:pointer;" />
        <label for="cfg-grid" style="margin:0; cursor:pointer; font-size:12px;">চার্ট অ্যানালাইসিস গ্রীড ওভারলে</label>
      </div>

      <button type="button" id="hrtrader-save-all" class="hrtrader-btn-action">সব সেটিংস সেভ করুন</button>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    const amountInput = panel.querySelector("#cfg-amount");
    const delayInput = panel.querySelector("#cfg-delay");
    const multInput = panel.querySelector("#cfg-multiplier");
    const shutdownInput = panel.querySelector("#cfg-shutdown");
    const tpInput = panel.querySelector("#cfg-tp");
    const slInput = panel.querySelector("#cfg-sl");
    const pendingTimeInput = panel.querySelector("#cfg-pending-time");
    const pendingAmountInput = panel.querySelector("#cfg-pending-amount");
    const pendingDirSelect = panel.querySelector("#cfg-pending-dir");
    const gridCheckbox = panel.querySelector("#cfg-grid");
    const dirButtons = panel.querySelectorAll("#hrtrader-dir-group button");
    let pendingDirection = settings.direction;

    function syncUI() {
      amountInput.value = settings.tradeAmount;
      delayInput.value = settings.delaySec;
      multInput.value = settings.martingaleMultiplier;
      shutdownInput.value = settings.shutdownMin;
      tpInput.value = settings.tpAmount;
      slInput.value = settings.slAmount;
      pendingTimeInput.value = settings.pendingTime;
      pendingAmountInput.value = settings.pendingAmount;
      pendingDirSelect.value = settings.pendingDir;
      gridCheckbox.checked = settings.showGrid;
      pendingDirection = settings.direction;
      
      dirButtons.forEach(b => b.classList.toggle("hrtrader-dir-active", b.dataset.dir === pendingDirection));
      panel.querySelector("#stat-trades").textContent = sessionStats.tradesCount;
      panel.querySelector("#stat-martingale").textContent = sessionStats.currentMartingaleAmount.toFixed(1) + "x";
    }

    dirButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        pendingDirection = btn.dataset.dir;
        dirButtons.forEach(b => b.classList.toggle("hrtrader-dir-active", b.dataset.dir === pendingDirection));
      });
    });

    // প্ল্যাটফর্মের রিয়েল ইনপুট বক্সে ডেটা লাইভ পুশ করার মেকানিজম[cite: 2]
    function setPlatformTradeAmount(amount) {
      let amountInputEl = document.querySelector(".deal-amount-input input.input-control__input");[cite: 2]
      if (amountInputEl) {
        amountInputEl.value = amount;
        amountInputEl.dispatchEvent(new Event('input', { bubbles: true }));
        amountInputEl.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`[HRTrader] Platform Investment set to: ${amount}$`);
      } else {
        console.warn("[HRTrader Warning] Platform amount input box not found!");
      }
    }

    function saveAll() {
      settings.tradeAmount = Math.max(1, parseFloat(amountInput.value) || 1);
      settings.delaySec = Math.max(1, parseInt(delayInput.value) || 10);
      settings.martingaleMultiplier = Math.max(1, parseFloat(multInput.value) || 2.2);
      settings.shutdownMin = Math.max(1, parseInt(shutdownInput.value) || 30);
      settings.tpAmount = Math.max(1, parseFloat(tpInput.value) || 50);
      settings.slAmount = Math.max(1, parseFloat(slInput.value) || 30);
      settings.pendingTime = pendingTimeInput.value.trim();
      settings.pendingAmount = Math.max(1, parseFloat(pendingAmountInput.value) || 1);
      settings.pendingDir = pendingDirSelect.value;
      settings.showGrid = gridCheckbox.checked;
      settings.direction = pendingDirection;

      saveSettings(settings);
      toggleGrid(settings.showGrid);
      
      // ড্যাশবোর্ডে সেভ করার সাথে সাথেই প্ল্যাটফর্মে বেস অ্যামাউন্ট সিঙ্ক হবে[cite: 2]
      setPlatformTradeAmount(settings.tradeAmount);
      
      startShutdownTimer();
      closePanel();
    }

    panel.querySelector("#hrtrader-save-all").addEventListener("click", saveAll);
    backdrop.addEventListener("click", closePanel);

    function openPanel() { syncUI(); backdrop.classList.add("hrtrader-backdrop-open"); panel.classList.add("hrtrader-panel-open"); }
    function closePanel() { backdrop.classList.remove("hrtrader-backdrop-open"); panel.classList.remove("hrtrader-panel-open"); }

    const widget = document.createElement("div");
    widget.id = "hrtrader-widget";
    widget.innerHTML = `
      <div id="hrtrader-logo-wrap"><img src="${LOGO_URL}" alt="HRTrader" draggable="false" /></div>
      <span id="hrtrader-label">HRTrader Pro</span>
    `;
    document.body.appendChild(widget);

    let scanActive = false, tradeTimer = null, tapCount = 0, tapSettleTimer = null, lastTapAt = 0;

    function getAccountBalance() {
      let liveBalEl = document.querySelector(".v2KPX.X6PB5 + .Zt1hG");
      let demoBalEl = document.querySelector(".v2KPX.lTzTl + .Zt1hG");
      let targetEl = liveBalEl || demoBalEl;
      if (targetEl) {
        let val = parseFloat(targetEl.textContent.replace(/[^0-9.]/g, ""));
        if (!isNaN(val)) return val;
      }
      return null;
    }

    function getTradeButtons() {
      let upBtn = document.querySelector(".KtjVk.JQZcs._5qIw.LzVPu");[cite: 2]
      let downBtn = document.querySelector(".KtjVk.twQq3._5qIw.LzVPu");[cite: 2]
      return { up: upBtn, down: downBtn };
    }

    function executePlatformTrade(customDir = null, customAmount = null) {
      if (sessionStats.tradesCount >= settings.maxTrades) {
        console.warn("HRTrader limit reached.");
        stopScanSession();
        return;
      }

      let currentBalance = getAccountBalance();
      if (currentBalance !== null) {
        if (sessionStats.baseBalance === null) sessionStats.baseBalance = currentBalance;
        let diff = currentBalance - sessionStats.baseBalance;
        if (diff >= settings.tpAmount || (Math.abs(diff) >= settings.slAmount && diff < 0)) {
          stopScanSession();
          return;
        }
      }

      const { up, down } = getTradeButtons();
      if (!up || !down) {
        stopScanSession();
        return;
      }

      let finalDir = customDir || settings.direction;
      if (finalDir === "random") finalDir = Math.random() > 0.5 ? "up" : "down";

      let finalAmount = customAmount || settings.tradeAmount;
      if (sessionStats.isMartingaleMode) {
        finalAmount = settings.tradeAmount * sessionStats.currentMartingaleAmount;
      }

      // ট্রেড নেওয়ার ঠিক আগ মুহূর্তে টার্গেট অ্যামাউন্টটি প্ল্যাটফর্মে পুশ করা হচ্ছে[cite: 2]
      setPlatformTradeAmount(finalAmount);

      let targetBtn = (finalDir === "up" ? up : down);

      try {
        targetBtn.click();
        ['mousedown', 'mouseup'].forEach(n => {
          targetBtn.dispatchEvent(new MouseEvent(n, { bubbles: true, cancelable: true, view: window }));
        });

        sessionStats.tradesCount++;
        sessionStats.lastDirection = finalDir; 

        let balanceBefore = currentBalance;
        setTimeout(() => {
          let balanceAfter = getAccountBalance();
          if (balanceAfter !== null && balanceBefore !== null) {
            if (balanceAfter < balanceBefore) {
              sessionStats.isMartingaleMode = true;
              sessionStats.currentMartingaleAmount *= settings.martingaleMultiplier;
              // লস রিকভারির জন্য সাথে সাথে সেম ডিরেকশনে পুশ করা হচ্ছে
              executePlatformTrade(sessionStats.lastDirection);
            } else {
              sessionStats.isMartingaleMode = false;
              sessionStats.currentMartingaleAmount = 1;
            }
          }
        }, 62000); 

      } catch(e) {
        console.error("Execution error: ", e);
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
        if (pendingCheckInterval) clearInterval(pendingCheckInterval);
      }, settings.shutdownMin * 60 * 1000);
    }

    function startPendingScheduler() {
      if (pendingCheckInterval) clearInterval(pendingCheckInterval);
      pendingCheckInterval = setInterval(() => {
        if (!settings.pendingTime) return;
        
        let now = new Date();
        let timeString = now.toTimeString().split(' ')[0];
        
        if (timeString === settings.pendingTime) {
          executePlatformTrade(settings.pendingDir, settings.pendingAmount);
          settings.pendingTime = ""; 
          document.querySelector("#cfg-pending-time").value = "";
          saveSettings(settings);
        }
      }, 1000);
    }

    function startAutoTrade() {
      if (scanActive) return;
      closePanel();
      scanActive = true;
      widget.classList.add("hrtrader-glow");
      scanOverlay.classList.add("hrtrader-scan-on");
      tradeTimer = setTimeout(() => { tradeTimer = null; executePlatformTrade(); }, settings.delaySec * 1000);
    }

    function stopScanSession() {
      widget.classList.remove("hrtrader-glow");
      scanOverlay.classList.remove("hrtrader-scan-on");
      scanActive = false;
      if (tradeTimer) { clearTimeout(tradeTimer); tradeTimer = null; }
    }

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
        if (tapCount === 1) { if (scanActive) stopScanSession(); else startAutoTrade(); }
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
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
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
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
      widget.style.left = Math.max(0, Math.min(startLeft + dx, window.innerWidth - 70)) + "px";
      widget.style.top = Math.max(0, Math.min(startTop + dy, window.innerHeight - 90)) + "px";
    }, { passive: true });

    document.addEventListener("touchend", () => { if (dragging) { dragging = false; if (!moved) registerTap(); } });

    startShutdownTimer();
    startPendingScheduler();
    
    // ইনিশিয়াল রান করার সময় একবার সিঙ্ক করে নিবে[cite: 2]
    setPlatformTradeAmount(settings.tradeAmount);

    console.log("HRTrader Ultimate v5 Synchronized Successfully!");
  }

  showPasswordGate(initHRTrader);
})();
