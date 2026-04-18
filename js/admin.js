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
  const stC = { Done: "b-done", Process: "b-proc", Pending: "b-pend", Failed: "b-fail", Repeat: "b-repeat", Refund: "b-refund" };
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
  const noteEl = document.getElementById("adminStatusNote");
  if (noteEl) noteEl.value = "";
  openModal("modalUpdateStatus");
}

async function setOrderStatus(status) {
  if (!updateStatusOrderId) return;
  const noteEl = document.getElementById("adminStatusNote");
  const note = noteEl ? noteEl.value.trim() : "";
  showLoading("Mengupdate status...");
  try {
    const r = await api("admin_update_order_status", { order_id: updateStatusOrderId, status, note });
    hideLoading();
    if (!r.ok) { toast("❌ " + r.error, "err"); return; }
    closeModal("modalUpdateStatus");
    toast(`✅ ${r.order_id} → ${status}`, "ok");
    
    // Auto-refresh saldo jika status Refund
    if (status === "Refund") {
      try {
        const ur = await api("init_user", { user_id: appState.wallet.user_id, name: appState.wallet.nama });
        if (ur.ok) {
           appState.wallet.saldo = ur.saldo;
           setEl("homeBalance", ur.saldo.toLocaleString("id"));
           setEl("homeBalanceRp", "≈ " + fmtRp(ur.saldo * COIN_RATE));
           setEl("pfSaldo", ur.saldo.toLocaleString("id"));
        }
      } catch(e) {}
    }
    
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

