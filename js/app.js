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

  if (!isFromTelegram && !isDevMode) {
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

// ════════════════════════════════════════════════════════════════
//  THEME SYSTEM
// ════════════════════════════════════════════════════════════════
function applyTheme(theme) {
  const root = document.documentElement;
  const btn = document.getElementById("themeBtn");
  root.setAttribute("data-theme", theme);
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";

  // Update logo
  const logo = document.getElementById("logoImg");
  if (logo) {
    logo.src = theme === "dark"
      ? "images/logo-dark.jpeg"
      : "images/logo-light.jpeg";
  }

  // Update Telegram header/bg
  try {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.setHeaderColor(theme === "dark" ? "#111111" : "#FFFFFF");
      tg.setBackgroundColor(theme === "dark" ? "#0A0A0A" : "#F4F0E8");
    }
  } catch (_) { }
}

function toggleTheme() {
  const cur = localStorage.getItem("imortifex_theme") || "dark";
  const next = cur === "dark" ? "light" : "dark";
  localStorage.setItem("imortifex_theme", next);
  applyTheme(next);
  toast("Tema: " + (next === "dark" ? "🌙 Dark" : "☀️ Light"), "ok");
}

// ════════════════════════════════════════════════════════════════
//  TELEGRAM ADMIN NOTIFICATION
// ════════════════════════════════════════════════════════════════
async function notifyAdmin(message) {
  try {
    await fetch("https://api.telegram.org/bot" + BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: ADMIN_CHAT, text: message, parse_mode: "HTML" })
    });
  } catch (_) { }
}

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════

// Apply theme ASAP saat DOM ready agar logo langsung tampil benar
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("imortifex_theme") || "dark";
  applyTheme(savedTheme);
});

window.addEventListener("load", async () => {
  // Apply saved theme again setelah semua asset load
  const savedTheme = localStorage.getItem("imortifex_theme") || "dark";
  applyTheme(savedTheme);

  // Telegram WebApp init
  try {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tgUser = tg.initDataUnsafe?.user;
    }
  } catch (_) { }

  // Dev fallback — gunakan non-admin ID agar tidak auto admin saat dev
  if (!tgUser) {
    // CATATAN: ?dev=1 hanya aktif di localhost, user_id ini hanya untuk dev
    tgUser = { id: 999999999, first_name: "Dev", last_name: "User" };
  }

  const uid = String(tgUser.id);
  const name = tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : "");
  appState.wallet.user_id = uid;
  appState.wallet.nama = name;
  appState.isAdmin = ADMIN_IDS.includes(uid);

  if (appState.isAdmin) {
    document.getElementById("adminMenuBtn").style.display = "flex";
  }

  // Init user
  try {
    const r = await api("init_user", { user_id: uid, name });
    if (r.ok) appState.wallet.saldo = r.saldo;
  } catch (_) { }

  await loadDashboard();
  loadProducts();
  loadUserOrders();

  // Topup input listener
  document.getElementById("topupCustom")?.addEventListener("input", function () {
    if (this.value) {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
      topupAmount = parseInt(this.value) || 0;
    }
    updateTopupDisplay();
  });
});

// ════════════════════════════════════════════════════════════════
//  API HELPER
// ════════════════════════════════════════════════════════════════
async function api(action, params = {}) {
  const allParams = { action, token: SECRET_TOKEN, user_id: appState.wallet.user_id, ...params };
  const qs = new URLSearchParams(allParams).toString();
  const res = await fetch(GAS_URL + "?" + qs);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

// ════════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const r = await api("get_dashboard");
    if (!r.ok) return;
    const { wallet, recent_orders, stats, config, featured, fake_msg } = r.data;

    appState.wallet = wallet;
    appState.config = config;

    setEl("homeBalance", wallet.saldo.toLocaleString("id"));
    setEl("homeBalanceRp", "≈ " + fmtRp(wallet.saldo * COIN_RATE));
    setEl("profileName", wallet.nama);
    setEl("profileId", "ID: " + wallet.user_id);
    setEl("profileAvatar", wallet.nama.charAt(0).toUpperCase());
    setEl("pfSaldo", wallet.saldo.toLocaleString("id"));
    setEl("pfOrders", stats.total_orders);
    setEl("pfDone", stats.done_orders);

    if (config.admin_username) setEl("adminContactDesc", config.admin_username + " · 08.00–22.00 WIB");

    if (config.rekening) {
      config.rekening.split("\n").forEach(line => {
        const l = line.trim();
        if (/BCA/i.test(l))     setEl("payBCAInfo",     l.replace(/BCA[\s:]+/i, "").trim() || "a/n iMortifex");
        if (/Mandiri/i.test(l)) setEl("payMandiriInfo", l.replace(/Mandiri[\s:]+/i, "").trim() || "a/n iMortifex");
      });
    }

    if (config.promo_active === "on" && config.promo_message) {
      setEl("promoMsg", "🔥 " + config.promo_message);
      show("promoBar");
    }

    if (fake_msg) { setEl("fakeMsg", fake_msg); show("fakeBar"); }

    if (featured && featured.length) {
      setEl("featuredList", featured.map(p => renderProduct(p, true)).join(""));
    }

    if (recent_orders && recent_orders.length) {
      setEl("recentOrdersList", recent_orders.map(o => renderOrderItem(o)).join(""));
    } else {
      setEl("recentOrdersList", emptyState("📋", "Belum ada order", "Order pertama kamu muncul di sini"));
    }
  } catch (e) {
    toast("Gagal memuat data. Cek koneksi.", "err");
  }
}

// ════════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════════
async function loadProducts() {
  try {
    const r = await api("get_products");
    if (!r.ok) return;
    appState.products = r.data;
    setEl("allProductsList", '<div style="padding:14px 0 0">' + r.data.map(p => renderProduct(p, false)).join("") + "</div>");
  } catch (_) { }
}

const PROD_ICONS = {
  "iCloud": "☁️", "Bypass": "🔓", "Region": "🌍", "Aktivasi": "📱",
  "Cek": "📊", "Unlock": "🔓", "IMEI": "📡", "Blacklist": "📊"
};
function getIcon(name) {
  for (const [k, v] of Object.entries(PROD_ICONS)) if (name.includes(k)) return v;
  return "📦";
}

function renderProduct(p, featured) {
  const on = String(p.status || "").toUpperCase() === "ON";
  const desc = String(p.description || "").replace(/^.\s/, "");
  return `<div class="prod-card${featured ? " featured" : ""}${!on ? " off" : ""}" onclick="${on ? `openOrderModal(${p.id})` : `toast('⚠️ Layanan sedang tidak tersedia','warn')`}">
    <div class="prod-icon">${getIcon(String(p.name || ""))}</div>
    <div class="prod-info">
      <div class="prod-name">${p.name}</div>
      <div class="prod-desc">${desc}</div>
    </div>
    <div class="prod-right">
      <div class="prod-price">${Number(p.price).toLocaleString("id")}<small> iCoin</small></div>
      <span class="badge ${on ? "b-on" : "b-off"}">${on ? "Aktif" : "Off"}</span>
    </div>
  </div>`;
}

// ════════════════════════════════════════════════════════════════
//  ORDERS (USER)
// ════════════════════════════════════════════════════════════════
async function loadUserOrders() {
  try {
    const r = await api("get_orders");
    if (!r.ok) return;
    allUserOrders = r.data;
    appState.orders = r.data;
    renderUserOrders();
    setEl("ordersSubtitle", r.total + " order");
  } catch (_) { }
}

function renderUserOrders() {
  const filtered = ordersFilter === "all" ? allUserOrders
    : allUserOrders.filter(o => String(o.status) === ordersFilter);
  if (!filtered.length) {
    setEl("ordersList", emptyState("📋", "Belum ada order", "Mulai order layanan pertama kamu"));
    return;
  }
  setEl("ordersList", filtered.map(o => renderOrderItem(o)).join(""));
}

function filterOrders(f, btn) {
  ordersFilter = f;
  document.querySelectorAll("#page-orders .seg-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderUserOrders();
}

function renderOrderItem(o) {
  const stCls = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail" };
  const stLbl = { Done: "✅ Done", Process: "⚙️ Process", Pending: "🕐 Pending", Failed: "❌ Failed" };
  const s = String(o.status || "Pending");
  return `<div class="ord-item" onclick="showOrderDetail('${o.order_id}')">
    <div class="ord-top">
      <div class="ord-id">${o.order_id}</div>
      <span class="badge ${stCls[s] || "b-pend"}">${stLbl[s] || s}</span>
    </div>
    <div class="ord-prod">${o.produk}</div>
    <div class="ord-imei">📱 ${o.imei}</div>
    <div class="ord-time">🕒 ${o.waktu}</div>
  </div>`;
}

async function showOrderDetail(order_id) {
  try {
    const r = await api("get_order_detail", { order_id });
    if (!r.ok) { toast("Order tidak ditemukan", "err"); return; }
    const o = r.data;
    const stL = { Done: "✅ Done", Process: "⚙️ Process", Pending: "🕐 Pending", Failed: "❌ Failed" };
    const stC = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail" };
    const s = String(o.status || "Pending");
    setEl("orderDetailBody", `
      <div class="dtl-row"><span class="dtl-key">Order ID</span><span class="dtl-val mono">${o.order_id}</span></div>
      <div class="dtl-row"><span class="dtl-key">Produk</span><span class="dtl-val">${o.produk}</span></div>
      <div class="dtl-row"><span class="dtl-key">IMEI</span><span class="dtl-val mono">${o.imei}</span></div>
      <div class="dtl-row"><span class="dtl-key">Status</span><span class="dtl-val"><span class="badge ${stC[s] || "b-pend"}">${stL[s] || s}</span></span></div>
      <div class="dtl-row"><span class="dtl-key">Waktu Order</span><span class="dtl-val">${o.waktu}</span></div>
    `);
    openModal("modalOrderDetail");
  } catch (_) { toast("Gagal memuat detail", "err"); }
}

// ════════════════════════════════════════════════════════════════
//  ORDER MODAL
// ════════════════════════════════════════════════════════════════
function openOrderModal(productId) {
  const p = appState.products.find(x => String(x.id) === String(productId));
  if (!p) { toast("Produk tidak ditemukan", "err"); return; }
  orderProduct = p;
  voucherData = null;

  setEl("orderModalTitle", p.name);
  setEl("orderProductInfo", `📦 <strong>${p.name}</strong><br>💰 Harga: <strong>${Number(p.price).toLocaleString("id")} iCoin</strong> (≈ ${fmtRp(Number(p.price) * COIN_RATE)})<br><br>${String(p.description || "").replace(/^.\s/, "")}`);
  document.getElementById("imeiInput").value = "";
  document.getElementById("voucherInput").value = "";
  const vr = document.getElementById("voucherResult");
  vr.className = "voucher-result"; vr.style.display = "none";
  updateOrderPrice();
  openModal("modalOrder");
}

function updateOrderPrice() {
  if (!orderProduct) return;
  const base = Number(orderProduct.price);
  const disc = voucherData ? Number(voucherData.discount_pct || 0) : 0;
  const discAmt = Math.floor(base * disc / 100);
  const total = base - discAmt;
  const saldo = appState.wallet.saldo;

  setEl("orderPriceBase", base.toLocaleString("id") + " iCoin");
  setEl("orderPriceTotal", total.toLocaleString("id") + " iCoin");
  setEl("orderSaldo", saldo.toLocaleString("id") + " iCoin");

  const discRow = document.getElementById("orderDiscRow");
  if (discAmt > 0) {
    discRow.style.display = "flex";
    setEl("orderDiscAmt", "-" + discAmt.toLocaleString("id") + " iCoin");
  } else {
    discRow.style.display = "none";
  }

  const btn = document.getElementById("btnConfirmOrder");
  const warn = document.getElementById("orderInsufficientWarn");
  if (saldo < total) {
    btn.disabled = true; btn.textContent = "Saldo Tidak Cukup";
    warn.style.display = "block";
  } else {
    btn.disabled = false; btn.textContent = "Konfirmasi Order";
    warn.style.display = "none";
  }
}

async function checkVoucher() {
  const code = document.getElementById("voucherInput").value.trim().toUpperCase();
  if (!code) { toast("Masukkan kode voucher", "warn"); return; }
  const vr = document.getElementById("voucherResult");
  vr.className = "voucher-result"; vr.textContent = "Mengecek..."; vr.style.display = "block";
  try {
    const r = await api("check_voucher", { code, product_id: orderProduct?.id });
    if (r.ok) {
      voucherData = r.voucher;
      vr.className = "voucher-result ok";
      vr.textContent = `✅ ${r.voucher.description} (Diskon ${r.voucher.discount_pct}%)`;
      updateOrderPrice();
    } else {
      voucherData = null;
      vr.className = "voucher-result err";
      vr.textContent = "❌ " + r.error;
      updateOrderPrice();
    }
  } catch (_) {
    vr.className = "voucher-result err";
    vr.textContent = "❌ Gagal mengecek voucher";
  }
}

async function confirmOrder() {
  const imei = document.getElementById("imeiInput").value.trim();
  if (!imei || !/^\d{15}$/.test(imei)) { toast("IMEI harus tepat 15 digit angka", "err"); return; }
  if (!orderProduct) { toast("Produk tidak dipilih", "err"); return; }

  showLoading("Memproses order...");
  try {
    const r = await api("create_order", {
      product_id: orderProduct.id,
      imei,
      nama: appState.wallet.nama,
      voucher_code: voucherData ? document.getElementById("voucherInput").value.trim().toUpperCase() : "",
    });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }

    appState.wallet.saldo = r.saldo_sekarang;
    setEl("homeBalance", r.saldo_sekarang.toLocaleString("id"));
    setEl("homeBalanceRp", "≈ " + fmtRp(r.saldo_sekarang * COIN_RATE));
    setEl("pfSaldo", r.saldo_sekarang.toLocaleString("id"));

    closeModal("modalOrder");
    toast("✅ Order berhasil! " + r.order_id, "ok");

    // Notif ke admin
    notifyAdmin(
      `🛒 <b>Order Baru!</b>\n\n` +
      `📋 <b>Order ID:</b> ${r.order_id}\n` +
      `👤 <b>User:</b> ${appState.wallet.nama} (${appState.wallet.user_id})\n` +
      `📦 <b>Produk:</b> ${r.produk}\n` +
      `📱 <b>IMEI:</b> <code>${r.imei}</code>\n` +
      `💰 <b>Dibayar:</b> ${Number(r.final_price).toLocaleString("id")} iCoin\n` +
      `🕒 <b>Waktu:</b> ${r.waktu}`
    );

    await loadUserOrders();

    setTimeout(() => {
      setEl("orderDetailBody", `
        <div class="ok-box">🎉 Order berhasil dibuat! Tim kami segera memproses.</div>
        <div class="dtl-row"><span class="dtl-key">Order ID</span><span class="dtl-val mono">${r.order_id}</span></div>
        <div class="dtl-row"><span class="dtl-key">Produk</span><span class="dtl-val">${r.produk}</span></div>
        <div class="dtl-row"><span class="dtl-key">IMEI</span><span class="dtl-val mono">${r.imei}</span></div>
        <div class="dtl-row"><span class="dtl-key">Dibayar</span><span class="dtl-val">${Number(r.final_price).toLocaleString("id")} iCoin</span></div>
        ${r.discount_pct > 0 ? `<div class="dtl-row"><span class="dtl-key">Hemat</span><span class="dtl-val" style="color:var(--ok)">-${Number(r.discount_amt).toLocaleString("id")} iCoin (${r.discount_pct}%)</span></div>` : ""}
        <div class="dtl-row"><span class="dtl-key">Sisa Saldo</span><span class="dtl-val">${Number(r.saldo_sekarang).toLocaleString("id")} iCoin</span></div>
        <div class="dtl-row"><span class="dtl-key">Waktu</span><span class="dtl-val">${r.waktu}</span></div>
        <div class="dtl-row"><span class="dtl-key">Status</span><span class="dtl-val"><span class="badge b-pend">🕐 Pending</span></span></div>
      `);
      openModal("modalOrderDetail");
    }, 500);
  } catch (e) {
    hideLoading();
    toast("❌ Gagal membuat order. Coba lagi.", "err");
  }
}

// ════════════════════════════════════════════════════════════════
//  TOPUP MODAL
// ════════════════════════════════════════════════════════════════
function openTopupModal() {
  topupAmount = 0; topupMethod = null;
  document.getElementById("topupCustom").value = "";
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
  document.querySelectorAll(".pay-item").forEach(p => p.classList.remove("sel"));
  document.getElementById("qrisWrap").style.display = "none";
  setEl("topupTotalAmt", "Rp —");
  setEl("topupCoinAmt", "— iCoin");
  openModal("modalTopup");
}

function selectTopupChip(amount, el) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("sel"));
  el.classList.add("sel");
  document.getElementById("topupCustom").value = "";
  topupAmount = amount;
  updateTopupDisplay();
}

function selectPayment(el, method) {
  document.querySelectorAll(".pay-item").forEach(p => p.classList.remove("sel"));
  el.classList.add("sel");
  topupMethod = method;
  // Show/hide QRIS image
  const qw = document.getElementById("qrisWrap");
  if (qw) qw.style.display = method === "QRIS" ? "block" : "none";
  setEl("payRekInfo", method !== "QRIS" ? `Pastikan transfer tepat ke no. rekening ${method} yang tertera.` : "");
}

function updateTopupDisplay() {
  const coins = topupAmount >= COIN_RATE ? Math.floor(topupAmount / COIN_RATE) : 0;
  setEl("topupTotalAmt", topupAmount > 0 ? fmtRp(topupAmount) : "Rp —");
  setEl("topupCoinAmt", coins > 0 ? coins.toLocaleString("id") + " iCoin" : "— iCoin");
}

async function submitTopup() {
  const customVal = parseInt(document.getElementById("topupCustom").value) || 0;
  if (customVal > 0) topupAmount = customVal;
  if (topupAmount < COIN_RATE * 10) { toast("⚠️ Minimal top up " + fmtRp(COIN_RATE * 10), "warn"); return; }
  if (!topupMethod) { toast("⚠️ Pilih metode pembayaran", "warn"); return; }

  showLoading("Mengirim permintaan...");
  try {
    const r = await api("submit_topup", { nama: appState.wallet.nama, nominal: topupAmount, method: topupMethod });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    closeModal("modalTopup");
    toast(`📤 Top up ${r.coins} iCoin dikirim ke admin!`, "ok");

    // Notif ke admin
    notifyAdmin(
      `💳 <b>Request Top Up Baru!</b>\n\n` +
      `👤 <b>User:</b> ${appState.wallet.nama} (${appState.wallet.user_id})\n` +
      `💵 <b>Nominal:</b> ${fmtRp(Number(r.nominal))}\n` +
      `💎 <b>iCoin:</b> ${r.coins} iCoin\n` +
      `💳 <b>Metode:</b> ${r.method}\n` +
      `🕒 <b>Waktu:</b> ${r.waktu}\n\n` +
      `⚡ Segera konfirmasi di Admin Panel!`
    );
  } catch (_) {
    hideLoading();
    toast("❌ Gagal. Coba lagi.", "err");
  }
}

// ════════════════════════════════════════════════════════════════
//  INFO & CONTACT
// ════════════════════════════════════════════════════════════════
function showInfo(type) {
  const titles = { syarat: "Syarat & Ketentuan", garansi: "Info Garansi" };
  setEl("infoTitle", titles[type] || "Info");
  setEl("infoBody", appState.config[type] || "Data tidak tersedia.");
  openModal("modalInfo");
}

function contactAdmin() {
  const admin = (appState.config.admin_username || "@Caz0rla").replace("@", "");
  try {
    if (window.Telegram?.WebApp) window.Telegram.WebApp.openTelegramLink("https://t.me/" + admin);
    else window.open("https://t.me/" + admin);
  } catch (_) { toast("Admin: @" + admin, "ok"); }
}

// ════════════════════════════════════════════════════════════════
//  ADMIN: TABS
// ════════════════════════════════════════════════════════════════
function switchAdminTab(tab, btn) {
  document.querySelectorAll(".adm-tab").forEach(t => t.style.display = "none");
  document.querySelectorAll(".atab").forEach(b => b.classList.remove("active"));
  document.getElementById("adm-" + tab).style.display = "block";
  btn.classList.add("active");

  if (tab === "dashboard") loadAdminDashboard();
  else if (tab === "topup") loadAdminTopup();
  else if (tab === "orders") loadAdminOrders();
  else if (tab === "products") loadAdminProducts();
  else if (tab === "users") loadAdminUsers();
  else if (tab === "vouchers") loadAdminVouchers();
  else if (tab === "settings") loadAdminSettings();
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────
async function loadAdminDashboard() {
  try {
    const r = await api("admin_get_dashboard");
    if (!r.ok) return;
    const { summary, recent_orders } = r.data;

    if (summary.pending_topup > 0) {
      const pb = document.getElementById("pendingBadge");
      pb.textContent = summary.pending_topup; pb.style.display = "";
    }

    setEl("admStats", `
      <div class="stat-mini gold"><div class="stat-mini-val">${fmtRp(summary.total_revenue)}</div><div class="stat-mini-lbl">Total Revenue</div></div>
      <div class="stat-mini blue"><div class="stat-mini-val">${summary.total_users}</div><div class="stat-mini-lbl">Total User</div></div>
      <div class="stat-mini"><div class="stat-mini-val">${summary.total_orders}</div><div class="stat-mini-lbl">Total Order</div></div>
      <div class="stat-mini red"><div class="stat-mini-val">${summary.pending_topup}</div><div class="stat-mini-lbl">Topup Pending</div></div>
      <div class="stat-mini ok"><div class="stat-mini-val">${summary.done_orders}</div><div class="stat-mini-lbl">Order Done</div></div>
      <div class="stat-mini"><div class="stat-mini-val" style="color:var(--warn)">${summary.pending_orders + summary.process_orders}</div><div class="stat-mini-lbl">Order Aktif</div></div>
    `);

    if (recent_orders && recent_orders.length) {
      setEl("admRecentOrders", `<div style="background:var(--d2);border:1px solid var(--border2);border-radius:var(--r);padding:4px 14px">` +
        recent_orders.map(o => renderAdminOrderRow(o, true)).join("") + `</div>`);
    } else {
      setEl("admRecentOrders", emptyState("📋", "Belum ada order", ""));
    }
  } catch (e) { setEl("admStats", `<div class="warn-box">Gagal memuat data admin.</div>`); }
}

// ── ADMIN TOPUP ───────────────────────────────────────────────
async function loadAdminTopup() {
  setEl("admTopupList", `<div class="shimmer sk-card2"></div>`);
  try {
    const r = await api("admin_get_topup_pending");
    if (!r.ok) return;
    if (!r.data.length) { setEl("admTopupList", emptyState("💳", "Tidak ada topup pending", "Semua bersih ✅")); return; }
    setEl("admTopupList", r.data.map(t => `
      <div class="topup-item">
        <div class="topup-item-hd">
          <div>
            <div class="topup-name">${t.nama}</div>
            <div class="topup-id">ID: ${t.user_id}</div>
          </div>
          <span class="badge b-pend">Pending</span>
        </div>
        <div class="topup-amt">${fmtRp(Number(t.nominal))}</div>
        <div class="topup-coin">→ ${Math.floor(Number(t.nominal) / COIN_RATE).toLocaleString("id")} iCoin</div>
        <div class="topup-time">🕒 ${t.waktu} · ${t.bukti || t.method || "-"}</div>
        <div class="topup-actions">
          <button class="btn-s btn-ok"     style="flex:1;margin:0" onclick="admApproveTopup(${t._idx})">✅ Approve</button>
          <button class="btn-s btn-danger" style="flex:1;margin:0" onclick="admRejectTopup(${t._idx})">❌ Reject</button>
        </div>
      </div>`).join(""));
  } catch (_) { setEl("admTopupList", `<div class="warn-box">Gagal memuat.</div>`); }
}

async function admApproveTopup(idx) {
  showLoading("Approving...");
  try {
    const r = await api("admin_approve_topup", { topup_idx: idx });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast(`✅ Approved: +${r.coins} iCoin untuk ${r.nama}`, "ok");
    loadAdminTopup();
  } catch (_) { hideLoading(); toast("❌ Gagal approve", "err"); }
}

async function admRejectTopup(idx) {
  showLoading("Rejecting...");
  try {
    const r = await api("admin_reject_topup", { topup_idx: idx });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast(`❌ Rejected: ${r.nama}`, "warn");
    loadAdminTopup();
  } catch (_) { hideLoading(); toast("❌ Gagal reject", "err"); }
}

// ── ADMIN ORDERS ──────────────────────────────────────────────
async function loadAdminOrders(page) {
  if (page !== undefined) admOrderPage = page;
  setEl("admOrdersList", `<div class="shimmer sk-card2"></div>`);
  try {
    const r = await api("admin_get_all_orders", { page: admOrderPage, status_filter: admOrderFilter });
    if (!r.ok) return;
    allOrders = r.data;
    renderAdminOrdersList(r);
  } catch (_) { setEl("admOrdersList", `<div class="warn-box">Gagal memuat.</div>`); }
}

function renderAdminOrdersList(r) {
  if (!r.data.length) { setEl("admOrdersList", emptyState("📋", "Tidak ada order", "")); setEl("admOrdersPager", ""); return; }
  setEl("admOrdersList", `<div style="background:var(--d2);border:1px solid var(--border2);border-radius:var(--r);padding:4px 14px">` +
    r.data.map(o => renderAdminOrderRow(o, false)).join("") + `</div>`);
  const pages = r.pages || 1;
  if (pages > 1) {
    let pg = "";
    for (let i = 0; i < pages; i++) pg += `<button class="seg-btn${i === admOrderPage ? " active" : ""}" onclick="loadAdminOrders(${i})">${i + 1}</button>`;
    setEl("admOrdersPager", pg);
  } else { setEl("admOrdersPager", ""); }
}

function renderAdminOrderRow(o, compact) {
  const stC = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail" };
  const s = String(o.status || "Pending");
  return `<div class="order-row" onclick="openUpdateStatus('${o.order_id}','${o.produk || ""}','${s}','${o.nama_user || ""}')">
    <div class="order-row-info">
      <div class="order-row-id">${o.order_id}</div>
      <div class="order-row-prod">${o.produk}</div>
      <div class="order-row-user">👤 ${o.nama_user} · ${o.waktu}</div>
      ${!compact ? `<div class="order-row-imei">📱 ${o.imei}</div>` : ""}
    </div>
    <span class="badge ${stC[s] || "b-pend"}">${s}</span>
  </div>`;
}

function admFilterOrders(f, btn) {
  admOrderFilter = f; admOrderPage = 0;
  document.querySelectorAll("#adm-orders .seg-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  loadAdminOrders();
}

function admSearchOrders(q) {
  if (!q.trim()) { renderAdminOrdersList({ data: allOrders, pages: 1 }); return; }
  const filt = allOrders.filter(o =>
    String(o.order_id || "").toLowerCase().includes(q.toLowerCase()) ||
    String(o.imei || "").includes(q) ||
    String(o.nama_user || "").toLowerCase().includes(q.toLowerCase())
  );
  renderAdminOrdersList({ data: filt, pages: 1 });
}

function openUpdateStatus(order_id, produk, currentStatus, nama) {
  updateStatusOrderId = order_id;
  setEl("statusOrderInfo", `<strong>${order_id}</strong><br>${produk}<br>👤 ${nama}<br>Status saat ini: <span class="badge">${currentStatus}</span>`);
  openModal("modalUpdateStatus");
}

async function setOrderStatus(status) {
  if (!updateStatusOrderId) return;
  showLoading("Mengupdate status...");
  try {
    const r = await api("admin_update_order_status", { order_id: updateStatusOrderId, status });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    closeModal("modalUpdateStatus");
    toast(`✅ ${r.order_id} → ${status}`, "ok");
    loadAdminOrders();
  } catch (_) { hideLoading(); toast("❌ Gagal update", "err"); }
}

// ── ADMIN PRODUCTS ────────────────────────────────────────────
async function loadAdminProducts() {
  setEl("admProductsList", `<div class="shimmer sk-card"></div>`);
  try {
    const r = await api("admin_get_products");
    if (!r.ok) return;
    setEl("admProductsList", r.data.map(p => {
      const on = String(p.status || "").toUpperCase() === "ON";
      return `<div class="prod-card${!on ? " off" : ""}">
        <div class="prod-icon">${getIcon(String(p.name || ""))}</div>
        <div class="prod-info">
          <div class="prod-name">${p.name}</div>
          <div class="prod-desc">${Number(p.price).toLocaleString("id")} iCoin</div>
        </div>
        <div class="prod-right">
          <span class="badge ${on ? "b-on" : "b-off"}">${on ? "ON" : "OFF"}</span>
          <button class="btn-sm" onclick="admToggleProduct('${p.id}',this)" style="margin-top:4px">${on ? "Matikan" : "Aktifkan"}</button>
        </div>
      </div>`;
    }).join(""));
  } catch (_) { setEl("admProductsList", `<div class="warn-box">Gagal memuat.</div>`); }
}

async function admToggleProduct(pid, btn) {
  btn.disabled = true;
  try {
    const r = await api("admin_toggle_product", { product_id: pid });
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast(`${r.new_status === "ON" ? "🟢" : "🔴"} ${r.name} → ${r.new_status}`, "ok");
    loadAdminProducts();
    loadProducts();
  } catch (_) { toast("❌ Gagal toggle", "err"); }
  btn.disabled = false;
}

// ── ADMIN USERS ───────────────────────────────────────────────
async function loadAdminUsers(search) {
  setEl("admUsersList", `<div class="shimmer sk-card2"></div>`);
  try {
    const r = await api("admin_get_wallets", { search: search || "" });
    if (!r.ok) return;
    allUsers = r.data;
    renderAdminUsers(r.data);
  } catch (_) { setEl("admUsersList", `<div class="warn-box">Gagal memuat.</div>`); }
}

function renderAdminUsers(users) {
  if (!users.length) { setEl("admUsersList", emptyState("👤", "Tidak ada user", "")); return; }
  setEl("admUsersList", users.map(u => `
    <div class="topup-item">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="topup-name">${u.nama}</div>
          <div class="topup-id">ID: ${u.user_id}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:700;color:var(--gold);font-family:var(--mono)">${Number(u.saldo).toLocaleString("id")} iC</div>
          <div style="font-size:11px;color:var(--txt2)">📦 ${u.total_orders || 0} order</div>
        </div>
      </div>
      <button class="btn-sm" onclick="openAdjSaldo('${u.user_id}','${u.nama}',${u.saldo})" style="margin-top:10px;width:100%">💰 Adjust Saldo</button>
    </div>`).join(""));
}

function admSearchUsers(q) {
  const filt = allUsers.filter(u =>
    String(u.user_id || "").includes(q) ||
    String(u.nama || "").toLowerCase().includes(q.toLowerCase())
  );
  renderAdminUsers(filt);
}

function openAdjSaldo(uid, nama, saldo) {
  adjTargetUser = { uid, nama, saldo };
  setEl("adjUserInfo", `👤 ${nama} (${uid})<br>Saldo saat ini: <strong>${Number(saldo).toLocaleString("id")} iCoin</strong>`);
  document.getElementById("adjDeltaInput").value = "";
  openModal("modalAdjSaldo");
}

async function submitAdjSaldo() {
  const delta = parseInt(document.getElementById("adjDeltaInput").value);
  if (isNaN(delta) || delta === 0) { toast("Masukkan angka yang valid", "warn"); return; }
  if (!adjTargetUser) return;
  showLoading("Mengupdate saldo...");
  try {
    const r = await api("admin_adjust_saldo", { target_uid: adjTargetUser.uid, delta });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    closeModal("modalAdjSaldo");
    const sign = delta > 0 ? "+" : "";
    toast(`✅ ${r.nama}: ${sign}${delta.toLocaleString("id")} iCoin → ${Number(r.new_saldo).toLocaleString("id")} iCoin`, "ok");
    loadAdminUsers();
  } catch (_) { hideLoading(); toast("❌ Gagal adjust", "err"); }
}

// ── ADMIN VOUCHERS ────────────────────────────────────────────
async function loadAdminVouchers() {
  setEl("admVouchersList", `<div class="shimmer sk-card"></div>`);
  try {
    const r = await api("admin_get_vouchers");
    if (!r.ok) return;
    const active = r.data.filter(v => String(v.status || "").toLowerCase() === "active");
    const inactive = r.data.filter(v => String(v.status || "").toLowerCase() !== "active");
    const renderV = (v, isActive) => {
      const used = Number(v.used_count || 0), max = Number(v.max_uses || 0);
      return `<div class="topup-item" style="${!isActive ? "opacity:.5" : ""}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-family:var(--mono);font-size:14px;font-weight:700;color:var(--gold-l)">${v.code}</div>
            <div style="font-size:11px;color:var(--txt2);margin-top:2px">${v.description}</div>
          </div>
          <span class="badge ${isActive ? "b-on" : "b-off"}">${isActive ? "Aktif" : "Nonaktif"}</span>
        </div>
        <div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--txt2)">
          <span>💸 <strong style="color:var(--gold)">${v.discount_pct}%</strong></span>
          <span>🔢 ${used}/${max > 0 ? max : "∞"}</span>
          <span>🏷️ ${v.type || "-"}</span>
        </div>
        ${v.allowed_users ? `<div style="font-size:11px;color:var(--txt3);margin-top:4px">👥 ${v.allowed_users}</div>` : ""}
        ${isActive ? `<button class="btn-s btn-danger" style="margin-top:10px" onclick="admDeactivateVoucher('${v.code}')">Nonaktifkan</button>` : ""}
      </div>`;
    };
    let html = active.map(v => renderV(v, true)).join("") || emptyState("🎟️", "Tidak ada voucher aktif", "");
    if (inactive.length) html += `<div style="font-size:11px;color:var(--txt3);margin:12px 0 6px">NONAKTIF</div>` + inactive.map(v => renderV(v, false)).join("");
    setEl("admVouchersList", html);
  } catch (_) { setEl("admVouchersList", `<div class="warn-box">Gagal memuat.</div>`); }
}

function openCreateVoucherModal() { openModal("modalCreateVoucher"); }

async function submitCreateVoucher() {
  const code = document.getElementById("vcCode").value.trim().toUpperCase();
  const type = document.getElementById("vcType").value;
  const disc = parseInt(document.getElementById("vcDisc").value);
  const max = parseInt(document.getElementById("vcMax").value) || 0;
  const allow = document.getElementById("vcAllowed").value.trim();
  const desc = document.getElementById("vcDesc").value.trim();

  if (!code) { toast("Kode voucher wajib", "warn"); return; }
  if (!disc || disc < 1 || disc > 100) { toast("Diskon harus 1–100%", "warn"); return; }

  showLoading("Membuat voucher...");
  try {
    const r = await api("admin_create_voucher", { code, type, discount_pct: disc, max_uses: max, allowed_users: allow, description: desc });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    closeModal("modalCreateVoucher");
    toast(`✅ Voucher ${code} dibuat (${disc}% off)`, "ok");
    loadAdminVouchers();
  } catch (_) { hideLoading(); toast("❌ Gagal membuat voucher", "err"); }
}

async function admDeactivateVoucher(code) {
  showLoading("Menonaktifkan...");
  try {
    const r = await api("admin_deactivate_voucher", { code });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast(`✅ Voucher ${code} dinonaktifkan`, "ok");
    loadAdminVouchers();
  } catch (_) { hideLoading(); toast("❌ Gagal", "err"); }
}

// ── ADMIN SETTINGS ────────────────────────────────────────────
async function loadAdminSettings() {
  try {
    const r = await api("get_config");
    if (!r.ok) return;
    const cfg = r.data;
    const globalOn = String(cfg.service_global || "on").toLowerCase() === "on";
    const promoOn = String(cfg.promo_active || "off").toLowerCase() === "on";
    const faOn = String(cfg.fake_activity || "on").toLowerCase() === "on";

    setEl("admSettingsContent", `
      <div style="margin-top:8px">
        <div class="sec-title mb8">🔧 Pengaturan Layanan</div>
        <div style="background:var(--d2);border:1px solid var(--border2);border-radius:var(--r);padding:4px 14px">
          <div class="toggle-wrap">
            <div><div class="toggle-label">Layanan Global</div><div class="menu-desc">Buka/tutup semua layanan</div></div>
            <label class="toggle"><input type="checkbox" ${globalOn ? "checked" : ""} onchange="admToggleGlobal(this)"><span class="toggle-slider"></span></label>
          </div>
          <div class="sep"></div>
          <div class="toggle-wrap">
            <div><div class="toggle-label">Promo Banner</div><div class="menu-desc">Tampilkan banner promo di beranda</div></div>
            <label class="toggle"><input type="checkbox" ${promoOn ? "checked" : ""} onchange="admTogglePromo(this)"><span class="toggle-slider"></span></label>
          </div>
          <div class="sep"></div>
          <div class="toggle-wrap">
            <div><div class="toggle-label">Fake Activity</div><div class="menu-desc">Pesan aktivitas di beranda</div></div>
            <label class="toggle"><input type="checkbox" ${faOn ? "checked" : ""} onchange="admToggleFakeActivity(this)"><span class="toggle-slider"></span></label>
          </div>
        </div>
        <div class="sec-title mb8" style="margin-top:18px">📢 Pesan Promo</div>
        <div class="fg">
          <textarea class="fi" id="promoMsgInput" rows="3" placeholder="Pesan promo...">${cfg.promo_message || ""}</textarea>
          <button class="btn-sm" onclick="admSavePromoMsg()" style="margin-top:8px;width:100%">Simpan Pesan Promo</button>
        </div>
        <div class="sec-title mb8" style="margin-top:18px">🔍 Cari Data</div>
        <div class="fg fi-row">
          <input class="fi" id="admGlobalSearch" placeholder="Cari order / IMEI / user...">
          <button class="btn-sm" onclick="admGlobalSearch()" style="flex-shrink:0;padding:0 14px">Cari</button>
        </div>
        <div id="admSearchResult"></div>
      </div>
    `);
  } catch (_) { setEl("admSettingsContent", `<div class="warn-box">Gagal memuat.</div>`); }
}

async function admToggleGlobal(cb) {
  try {
    const r = await api("admin_toggle_global");
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast(`${r.service_global === "on" ? "🟢 Layanan AKTIF" : "🔴 Layanan DITUTUP"}`, "ok");
  } catch (_) { toast("❌ Gagal toggle", "err"); }
}

async function admTogglePromo(cb) {
  try {
    const active = cb.checked ? "on" : "off";
    const r = await api("admin_set_promo", { active });
    if (!r.ok) toast("❌ Gagal", "err");
    else toast(`Promo ${active === "on" ? "🟢 AKTIF" : "🔴 NONAKTIF"}`, "ok");
  } catch (_) { toast("❌ Gagal", "err"); }
}

async function admToggleFakeActivity(cb) {
  try {
    const r = await api("admin_toggle_fake_activity");
    if (!r.ok) toast("❌ Gagal", "err");
    else toast(`Fake activity ${r.fake_activity === "on" ? "🟢 AKTIF" : "🔴 NONAKTIF"}`, "ok");
  } catch (_) { toast("❌ Gagal", "err"); }
}

async function admSavePromoMsg() {
  const msg = document.getElementById("promoMsgInput")?.value?.trim();
  if (!msg) { toast("Pesan kosong", "warn"); return; }
  showLoading("Menyimpan...");
  try {
    const r = await api("admin_set_promo", { message: msg });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    toast("✅ Pesan promo disimpan", "ok");
    appState.config.promo_message = msg;
  } catch (_) { hideLoading(); toast("❌ Gagal", "err"); }
}

async function admGlobalSearch() {
  const q = document.getElementById("admGlobalSearch")?.value?.trim();
  if (!q || q.length < 2) { toast("Minimal 2 karakter", "warn"); return; }
  showLoading("Mencari...");
  try {
    const r = await api("admin_search", { query: q });
    hideLoading();
    if (!r.ok) { setEl("admSearchResult", `<div class="warn-box">${r.error}</div>`); return; }
    const { orders, wallets } = r.data;
    let html = `<div style="margin-top:12px">`;
    if (orders.length) {
      html += `<div class="sec-title mb8">📦 Order (${orders.length})</div>`;
      html += `<div style="background:var(--d2);border:1px solid var(--border2);border-radius:var(--r);padding:4px 14px">`;
      html += orders.map(o => renderAdminOrderRow(o, false)).join("") + "</div>";
    }
    if (wallets.length) {
      html += `<div class="sec-title mb8" style="margin-top:12px">👤 User (${wallets.length})</div>`;
      html += wallets.map(w => `<div style="background:var(--d2);border:1px solid var(--border2);border-radius:var(--r);padding:11px 13px;margin-bottom:6px">👤 <strong>${w.nama}</strong> · ${w.user_id} · ${Number(w.saldo).toLocaleString("id")} iCoin</div>`).join("");
    }
    if (!orders.length && !wallets.length) html += emptyState("🔍", "Tidak ada hasil", "Coba kata kunci lain");
    html += "</div>";
    setEl("admSearchResult", html);
  } catch (_) { hideLoading(); toast("❌ Gagal cari", "err"); }
}

// ════════════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ════════════════════════════════════════════════════════════════
function showPage(name) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const pg = document.getElementById("page-" + name);
  const nav = document.getElementById("nav-" + name);
  if (pg) pg.classList.add("active");
  if (nav) nav.classList.add("active");
  window.scrollTo(0, 0);

  if (name === "orders") renderUserOrders();
  if (name === "admin" && appState.isAdmin) {
    document.querySelectorAll(".adm-tab").forEach(t => t.style.display = "none");
    document.getElementById("adm-dashboard").style.display = "block";
    loadAdminDashboard();
  }
}

// ════════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add("open"); document.body.style.overflow = "hidden"; }
function closeModal(id) { document.getElementById(id).classList.remove("open"); document.body.style.overflow = ""; }

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".m-overlay").forEach(o => {
    o.addEventListener("click", e => { if (e.target === o) closeModal(o.id); });
  });
});

// ════════════════════════════════════════════════════════════════
//  LOADING
// ════════════════════════════════════════════════════════════════
function showLoading(msg) {
  setEl("loadingText", msg || "Memproses...");
  document.getElementById("loadingOverlay").classList.add("show");
}
function hideLoading() { document.getElementById("loadingOverlay").classList.remove("show"); }

// ════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════
let toastTimer;
function toast(msg, type) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = "toast " + (type || "") + " show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
}

// ════════════════════════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════════════════════════
function setEl(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function show(id) { const el = document.getElementById(id); if (el) el.style.display = "block"; }
function fmtRp(n) { return "Rp " + Number(n).toLocaleString("id"); }
function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-ico">${icon}</div><div class="empty-title">${title}</div>${sub ? `<div class="empty-sub">${sub}</div>` : ""}</div>`;
}