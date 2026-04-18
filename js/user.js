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
  const stCls = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail", Repeat: "b-repeat", Refund: "b-refund" };
  const stLbl = { Done: "✅ Done", Process: "⚙️ Process", Pending: "🕐 Pending", Failed: "❌ Failed", Repeat: "🔁 Repeat", Refund: "💸 Refund" };
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
    const stL = { Done: "✅ Done", Process: "⚙️ Process", Pending: "🕐 Pending", Failed: "❌ Failed", Repeat: "🔁 Repeat", Refund: "💸 Refund" };
    const stC = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail", Repeat: "b-repeat", Refund: "b-refund" };
    const s = String(o.status || "Pending");
    setEl("orderDetailBody", `
      <div class="dtl-row"><span class="dtl-key">Order ID</span><span class="dtl-val mono">${o.order_id}</span></div>
      <div class="dtl-row"><span class="dtl-key">Produk</span><span class="dtl-val">${o.produk}</span></div>
      <div class="dtl-row"><span class="dtl-key">IMEI</span><span class="dtl-val mono">${o.imei}</span></div>
      <div class="dtl-row"><span class="dtl-key">Status</span><span class="dtl-val"><span class="badge ${stC[s] || "b-pend"}">${stL[s] || s}</span></span></div>
      ${o.note ? `<div class="dtl-row" style="flex-direction:column;align-items:flex-start;gap:4px"><span class="dtl-key">Catatan Admin</span><span class="dtl-val" style="text-align:left;line-height:1.4;color:var(--txt2);font-size:12px;width:100%">${o.note}</span></div>` : ""}
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
    showNativeNotification("🛒 Order Berhasil!", "Pembelian " + r.produk + " (Order " + r.order_id + ") sedang diproses.");

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
    showNativeNotification("💳 Top-Up Pending", "Permintaan pengisian " + r.coins + " iCoin telah dikirim menunggu konfirmasi.");

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

