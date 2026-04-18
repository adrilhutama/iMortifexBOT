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

// ════════════════════════════════════════════════════════════════
//  NATIVE PUSH HELPER
// ════════════════════════════════════════════════════════════════
async function showNativeNotification(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      const swReady = await navigator.serviceWorker.ready;
      swReady.showNotification(title, {
        body: body,
        icon: 'images/logo-dark.jpeg',
        vibrate: [200, 100, 200]
      });
    } catch (e) {
      new Notification(title, { body: body, icon: 'images/logo-dark.jpeg' });
    }
  }
}