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

  // PWA Session Cache / Dev fallback
  if (tgUser && tgUser.id) {
    localStorage.setItem("imx_user", JSON.stringify(tgUser));
  } else {
    const saved = localStorage.getItem("imx_user");
    if (saved) {
      try { tgUser = JSON.parse(saved); } catch (e) {}
    } else {
      tgUser = { id: 999999999, first_name: "Dev", last_name: "User" };
    }
  }

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Request Notification Permissions
  if ('Notification' in window && Notification.permission !== 'denied') {
    setTimeout(() => { Notification.requestPermission(); }, 2500);
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

