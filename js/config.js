// ════════════════════════════════════════════════════════════════
//  iMortifex Mini App — app.js
// ════════════════════════════════════════════════════════════════

// ── TELEGRAM-ONLY GATE ──────────────────────────────────────────
// Blokir akses langsung dari browser biasa (bukan Telegram WebApp)
(function checkTelegramGate() {
  const tg = window.Telegram?.WebApp;
  // initData hanya ada jika dibuka dari Telegram WebApp yang valid
  const isFromTelegram = tg && tg.initData && tg.initData.length > 0;

  // DEV MODE: bypass gate jika di localhost dengan param ?dev=1
  const isDevMode = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    && new URLSearchParams(window.location.search).get("dev") === "1";

  // PWA Standalone Mode Check
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (!isFromTelegram && !isDevMode && !isPWA) {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.innerHTML = `
        <div style="
          min-height:100vh;
          background:#0A0A0A;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          font-family:'Sora',sans-serif;
          padding:32px 24px;
          text-align:center;
          gap:20px;
        ">
          <img src="images/logo-dark.jpeg" style="width:90px;border-radius:16px;opacity:.9">
          <div>
            <div style="font-size:22px;font-weight:700;color:#F0EAD6;margin-bottom:8px">iMortifex</div>
            <div style="font-size:12px;letter-spacing:3px;color:#C9922A;text-transform:uppercase;margin-bottom:28px">another dimension</div>
            <div style="font-size:32px;margin-bottom:12px">🔒</div>
            <div style="font-size:16px;font-weight:600;color:#F0EAD6;margin-bottom:10px">Akses Hanya via Telegram</div>
            <div style="font-size:13px;color:#A08060;line-height:1.7;max-width:280px">
              Mini App ini hanya bisa dibuka melalui bot Telegram resmi kami.<br>
              Silakan buka melalui Telegram.
            </div>
          </div>
          <a
            href="https://t.me/iMortifex_bot"
            style="
              display:inline-block;
              margin-top:8px;
              padding:13px 28px;
              background:#C9922A;
              color:#0A0A0A;
              font-weight:700;
              font-size:14px;
              border-radius:50px;
              text-decoration:none;
            "
          >Buka di Telegram →</a>
          <div style="font-size:11px;color:#5C4A32;margin-top:4px">© iMortifex · another dimension</div>
        </div>
      `;
    });
    // Stop semua eksekusi JS berikutnya
    throw new Error("BLOCKED: Access only allowed via Telegram WebApp");
  }
})();

// ── CONFIG ──────────────────────────────────────────────────────
const GAS_URL = "https://script.google.com/macros/s/AKfycbw913Ga8IC_9a9mRo-6VP3ryMr9mqo6j_5WplFMBPGPRIGtytTADWR_OrXkvg7Jrqg2/exec";
const SECRET_TOKEN = "iMortifex_Secret_2024_xK9mP3qR7vL2nW5";
const ADMIN_IDS = ["794732662"];
const COIN_RATE = 1000;

// Telegram Bot (untuk notif admin)
const BOT_TOKEN = "8598358362:AAH2rpAeJPHkbs204x3yxQmJQXhzBNkZFVs";
const ADMIN_CHAT = "794732662";

// ── STATE ────────────────────────────────────────────────────────
let tgUser = null;
let appState = { wallet: { saldo: 0, nama: "User", user_id: "" }, config: {}, products: [], orders: [], isAdmin: false };
let orderProduct = null;
let voucherData = null;
let topupAmount = 0;
let topupMethod = null;
let adjTargetUser = null;
let updateStatusOrderId = null;
let admOrderFilter = "all";
let admOrderPage = 0;
let allOrders = [];
let allUsers = [];
let allUserOrders = [];
let ordersFilter = "all";

