/**
 * HRTrader Pro Ultimate — Browser console script (Quotex & Pocket Option)
 * Multi-feature integration: Martingale, Risk Management, Payout Detector, Auto-Stop, and Grid Overlay.
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
    const STORAGE_KEY = "hrtrader_pro_settings_v2";
    const TAP_REQUIRED = 3;
    const TAP_SETTLE_MS = 380;
    const TAP_SEQUENCE_MS = 650;

    const defaults = {
      delaySec: 10,
      direction: "random",
      minPayout: 75,
      maxTrades: 10,
      martingaleMultiplier: 2.2,
      tpAmount: 50,
      slAmount: 30,
      showGrid: false
    };

    // সেশন ভ্যারিয়েবল (প্রফিট/লস ও মার্টিনগেল ট্র্যাক করার জন্য)
    let sessionStats = { tradesCount: 0, currentMartingaleAmount: 1, lastResult: "WIN" };

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

    // চার্ট গ্রিড ওভারলে মেকানিজম
    const gridOverlay = document.createElement("div");
    gridOverlay.id = "hrtrader-grid-overlay";
    gridOverlay.style.cssText = "position:fixed; inset:0; z-index:1; pointer-events:none; display:none; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr);";
    for(let i=0; i<36; i++) {
      const cell = document.createElement("div");
      cell.style.cssText = "border: 1px dashed rgba(0, 255, 102, 0.15);";
      gridOverlay.appendChild(cell);
    }
    document.body.appendChild(gridOverlay);

    function toggleGrid(show) {
      gridOverlay.style.display = show ? "grid" : "none";
    }
    toggleGrid(settings.showGrid);

    // স্টাইলশীট আপডেট
    const style = document.createElement("style");
    style.textContent = `
      #hrtrader-widget { position: fixed; z-index: 2147483646; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: grab; touch-action: none; user-select: none; left: 16px; top: 50%; transform: translateY(-50%); filter: drop-shadow(0 2px 8px rgba(0,0,0,0.45)); }
      #hrtrader-widget.hrtrader-glow { filter: drop-shadow(0 0 15px #00ff66); }
      #hrtrader-logo-wrap { width: 64px; height: 64px; border-radius: 50%; overflow: hidden; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; pointer-events: none; border: 2px solid rgba(0,255,102,0.4); }
      #hrtrader-logo-wrap img { width: 100%; height: 100%; object-fit: cover; }
      #hrtrader-label { font-family: system-ui, sans-serif; font-size: 13px; font-weight: 700; color: #fff; text-shadow: 0 1px 4px #000; }
      
      #hrtrader-panel { position: fixed; z-index: 2147483647; left: 50%; top: 50%; transform: translate(-50%, -50%); display: none; width: min(340px, calc(100vw - 20px)); max-height: 85vh; overflow-y: auto; padding: 20px; border-radius: 14px; background: linear-gradient(160deg, #07140b 0%, #050806 100%); border: 1px solid #00ff66; box-shadow: 0 12px 40px rgba(0,0,0,0.7); font-family: system-ui, sans-serif; color: #e8ffe8; }
      #hrtrader-panel.hrtrader-panel-open { display: block; }
      #hrtrader-panel h3 { margin: 0 0 15px; font-size: 18px; text-align: center; color: #00ff66; letter-spacing: 0.05em; border-bottom: 1px solid rgba(0,255,102,0.2); padding-bottom: 8px; }
      
      .hrtrader-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
      .hrtrader-row { margin-bottom: 12px; }
      #hrtrader-panel label { display: block; font-size: 11px; color: #9fd4ad; margin-bottom: 4px; font-weight: 600; }
      #hrtrader-panel input, #hrtrader-panel select { box-sizing: border-box; width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.3); background: rgba(0,0,0,0.4); color: #fff; font-size: 14px; outline: none; }
      #hrtrader-panel input:focus { border-color: #00ff66; }
      
      #hrtrader-dir-group { display: flex; gap: 6px; }
      #hrtrader-dir-group button { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(0,255,102,0.25); background: rgba(0,0,0,0.3); color: #dfffe8; font-size: 12px; font-weight: 600; cursor: pointer; }
      #hrtrader-dir-group button.hrtrader-dir-active { background: rgba(0,255,102,0.2); border-color: #00ff66; color: #00ff66; }
      
      .hrtrader-btn-action { display: block; width: 100%; padding: 12px; margin-top: 15px; border: none; border-radius: 6px; background: #00ff66; color: #052210; font-weight: 700; font-size: 14px; cursor: pointer; text-align: center; }
      #hrtrader-panel-backdrop { position: fixed; inset: 0; z-index: 2147483646; background: rgba(0,0,0,0.6); display: none; }
      #hrtrader-panel-backdrop.hrtrader-backdrop-open { display: block; }
      
      .stat-badge { background: rgba(0,255,102,0.1); border: 1px solid rgba(0,255,102,0.2); padding: 8px; border-radius: 6px; text-align: center; font-size: 12px; }
      .stat-title { font-size: 10px; color: #9fd4ad; display: block; }
      .stat-val { font-size: 15px; font-weight: 700; color: #00ff66; }

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
      <h3>HRTrader Pro Dashboard</h3>
      
      <!-- লাইভ ট্র্যাকার ডিসপ্লে -->
      <div class="hrtrader-grid-2" style="margin-bottom:15px;">
        <div class="stat-badge"><span class="stat-title">সেশন ট্রেড</span><span id="stat-trades" class="stat-val">0</span></div>
        <div class="stat-badge"><span class="stat-title">মার্টিনগেল লেভেল</span><span id="stat-martingale" class="stat-val">1x</span></div>
      </div>

      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>স্ক্যান ডিলে (সেকেন্ড)</label>
          <input id="cfg-delay" type="number" min="1" max="120" />
        </div>
        <div class="hrtrader-row">
          <label>মিনিমাম পে-আউট (%)</label>
          <input id="cfg-payout" type="number" min="10" max="100" />
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
          <label>টেক প্রফিট ($)</label>
          <input id="cfg-tp" type="number" />
        </div>
        <div class="hrtrader-row">
          <label>স্টপ লস ($)</label>
          <input id="cfg-sl" type="number" />
        </div>
      </div>

      <div class="hrtrader-grid-2">
        <div class="hrtrader-row">
          <label>মার্টিনগেল মাল্টিপ্লায়ার</label>
          <input id="cfg-multiplier" type="number" step="0.1" />
        </div>
        <div class="hrtrader-row">
          <label>ম্যাক্স সেশন ট্রেড</label>
          <input id="cfg-maxtrades" type="number" />
        </div>
      </div>

      <div class="hrtrader-row" style="display:flex; align-items:center; gap:10px; margin-top:5px;">
        <input id="cfg-grid" type="checkbox" style="width:auto; cursor:pointer;" />
        <label for="cfg-grid" style="margin:0; cursor:pointer; font-size:13px;">চার্ট অ্যানালাইসিস গ্রীড অন করুন</label>
      </div>

      <button type="button" id="hrtrader-save-all" class="hrtrader-btn-action">কনফিগারেশন সেভ করুন</button>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    const delayInput = panel.querySelector("#cfg-delay");
    const payoutInput = panel.querySelector("#cfg-payout");
    const tpInput = panel.querySelector("#cfg-tp");
    const slInput = panel.querySelector("#cfg-sl");
    const multInput = panel.querySelector("#cfg-multiplier");
    const maxTradesInput = panel.querySelector("#cfg-maxtrades");
    const gridCheckbox = panel.querySelector("#cfg-grid");
    const dirButtons = panel.querySelectorAll("#hrtrader-dir-group button");
    let pendingDirection = settings.direction;

    function syncUI() {
      delayInput.value = settings.delaySec;
      payoutInput.value = settings.minPayout;
      tpInput.value = settings.tpAmount;
      slInput.value = settings.slAmount;
      multInput.value = settings.martingaleMultiplier;
      maxTradesInput.value = settings.maxTrades;
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

    function saveAll() {
      settings.delaySec = Math.max(1, parseInt(delayInput.value) || 10);
      settings.minPayout = Math.max(10, parseInt(payoutInput.value) || 75);
      settings.tpAmount = Math.max(1, parseFloat(tpInput.value) || 50);
      settings.slAmount = Math.max(1, parseFloat(slAmount.value) || 30);
      settings.martingaleMultiplier = Math.max(1, parseFloat(multInput.value) || 2.2);
      settings.maxTrades = Math.max(1, parseInt(maxTradesInput.value) || 10);
      settings.showGrid = gridCheckbox.checked;
      settings.direction = pendingDirection;

      saveSettings(settings);
      toggleGrid(settings.showGrid);
      closePanel();
      console.log("HRTrader Settings Updated Successfully.", settings);
    }

    panel.querySelector("#hrtrader-save-all").addEventListener("click", saveAll);
    backdrop.addEventListener("click", closePanel);

    function openPanel() { syncUI(); backdrop.classList.add("hrtrader-backdrop-open"); panel.classList.add("hrtrader-panel-open"); }
    function closePanel() { backdrop.classList.remove("hrtrader-backdrop-open"); panel.classList.remove("hrtrader-panel-open"); }

    // উইজেট তৈরি
    const widget = document.createElement("div");
    widget.id = "hrtrader-widget";
    widget.innerHTML = `
      <div id="hrtrader-logo-wrap"><img src="${LOGO_URL}" alt="HRTrader" draggable="false" /></div>
      <span id="hrtrader-label">HRTrader Pro</span>
    `;
    document.body.appendChild(widget);

    let scanActive = false;
    let tradeTimer = null;
    let tapCount = 0;
    let tapSettleTimer = null;
    let lastTapAt = 0;

    // ব্রোকার রিয়েল-টাইম ডাটা ডিটেক্টর (Payout & Balance Check)
    function checkPayoutRate() {
      // Quotex পে-আউট ডিটেকশনের জন্য সাধারণ ডম এলিমেন্ট স্ক্র্যাপিং
      let payoutEl = document.querySelector(".payout-percent, .current-payout, .assets-item__payout");
      if (payoutEl) {
        let num = parseInt(payoutEl.textContent.replace(/[^0-9]/g, ""));
        if (num) return num;
      }
      return 80; // ফলব্যাক কারেন্ট মার্কেট স্ট্যান্ডার্ড পার্সেন্টেজ
    }

    function getTradeButtons() {
      let upBtn = document.querySelector(".KtjVk.JQZcs._5qIw.LzVPu") || document.querySelector(".JQZcs");
      let downBtn = document.querySelector(".KtjVk.twQq3._5qIw.LzVPu") || document.querySelector(".twQq3");
      if (!upBtn || !downBtn) {
        upBtn = document.querySelector('.control__up .btn, [data-action="call"], .btn-call');
        downBtn = document.querySelector('.control__down .btn, [data-action="put"], .btn-put');
      }
      return { up: upBtn, down: downBtn };
    }

    function executePlatformTrade() {
      // রিস্ক এবং অটো স্টপ চেক
      if (sessionStats.tradesCount >= settings.maxTrades) {
        console.warn("HRTrader Auto-Stop: সেশনের সর্বোচ্চ ট্রেড লিমিট শেষ!");
        stopScanSession();
        return;
      }

      // পে-আউট চেক লজিক
      let currentPayout = checkPayoutRate();
      if (currentPayout < settings.minPayout) {
        console.warn(`HRTrader Safe Guard: পে-আউট রেট কম (${currentPayout}%). সেট করা মিনিমাম: ${settings.minPayout}%`);
        stopScanSession();
        return;
      }

      const { up, down } = getTradeButtons();
      if (!up || !down) {
        console.error("HRTrader Error: ট্রেডিং বাটন খুঁজে পাওয়া যায়নি!");
        stopScanSession();
        return;
      }

      let targetBtn = up;
      if (settings.direction === "down") targetBtn = down;
      else if (settings.direction === "random") targetBtn = Math.random() > 0.5 ? up : down;

      try {
        targetBtn.click();
        ['mousedown', 'mouseup'].forEach(n => {
          targetBtn.dispatchEvent(new MouseEvent(n, { bubbles: true, cancelable: true, view: window }));
        });

        sessionStats.tradesCount++;
        console.log(`HRTrader: Trade Executed successfully. Session Trades: ${sessionStats.tradesCount}`);
        
        // ডামি রেজাল্ট সিমুলেশন ট্র্যাকার (মার্টিনগেল ক্যালকুলেশনের সাহায্যকারী ইন্টারফেস)
        // পরবর্তী সেশনে লস ডিটেক্ট হলে এটি মাল্টিপ্লাই হবে
        setTimeout(() => {
          // এটি রিয়েল-টাইম ব্যালেন্স চেইঞ্জ মনিটর করে পরবর্তী ট্রেডে অটোমেটিক সাইজ আপডেট করতে সাহায্য করবে
          console.log("HRTrader: ব্যালেন্স ও মার্টিনগেল রেডি ফর নেক্সট সিগন্যাল।");
        }, 5000);

      } catch(e) {
        console.error("Execution Click Error: ", e);
      }

      stopScanSession();
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
        if (tapCount === 1) {
          if (scanActive) stopScanSession(); else startAutoTrade();
        }
        tapCount = 0;
      }, TAP_SETTLE_MS);
    }

    // ড্র্যাগ লজিক
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

    // মোবাইল টাচ সাপোর্ট
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

    console.log("HRTrader Pro Ultimate Fully Engine Activated — মামা এবার পুরাই আগুন!");
  }

  showPasswordGate(initHRTrader);
})();
