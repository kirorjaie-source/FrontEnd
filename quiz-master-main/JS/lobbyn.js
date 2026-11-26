"use strict";

/* lobbyn.js — شاشة الانتظار (الـ Host). البيانات من Api فقط. */

const PLAYER_PAGE = "playern.html";       // صفحة دخول اللاعب (PIN + الاسم)
const HOST_GAME_PAGE = "host-gamen.html"; // صفحة اللعب عند المدرّس
const ADMIN_PAGE = "adminn.html";
const LOGIN_PAGE = "loginn.html";

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

function drawQr(elementId, text, size) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = "";
  if (typeof QRCode === "function") {
    try {
      new QRCode(el, { text, width: size, height: size, colorDark: "#0B1E36", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
      return;
    } catch (e) { console.warn("QR failed:", e); }
  }
  el.innerHTML = `<div style="font:600 12px/1.4 sans-serif;word-break:break-all;color:#0B1E36;max-width:${size}px">${escapeHTML(text)}</div>`;
}

let lastPlayersSignature = null;

function updatePlayersUI(players) {
  const container = document.getElementById("players-list");
  const countDisplay = document.getElementById("player-count-num");
  if (!container || !countDisplay) return;

  if (!players || players.length === 0) {
    if (lastPlayersSignature !== "") {
      container.innerHTML = `<div class="waiting-badge">Waiting for participants...</div>`;
      countDisplay.textContent = "0";
      lastPlayersSignature = "";
    }
    return;
  }

  const signature = players.map((p) => `${p.nickname}:${p.avatar ?? ""}`).join("|");
  if (signature === lastPlayersSignature) return;
  lastPlayersSignature = signature;

  countDisplay.textContent = players.length;
  container.innerHTML = players.map((p) => {
    const emoji = window.Kok?.avatarEmoji(p.avatar);
    return `<div class="player-tag">${emoji ? emoji + " " : ""}${escapeHTML(p.nickname)}</div>`;
  }).join("");
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;
  overlay.style.opacity = "0";
  setTimeout(() => { overlay.style.display = "none"; }, 500);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!Api.auth.requireLogin(LOGIN_PAGE)) return;

  const session = Api.game.current();
  if (!session) {
    alert("No active session found. Returning to Dashboard.");
    window.location.href = ADMIN_PAGE;
    return;
  }

  const pin = session.roomCode;
  document.getElementById("display-pin").textContent = pin;
  document.getElementById("modal-display-pin").textContent = pin;
  document.getElementById("quiz-title-display").textContent = session.quizTitle || "";
  document.querySelectorAll(".join-host").forEach((el) => { el.textContent = window.location.host || "localhost"; });

  // رابط صفحة اللاعب
  const playerPath = window.location.pathname.replace(/[^/]*$/, PLAYER_PAGE);
  const joinUrl = `${window.location.origin}${playerPath}?pin=${encodeURIComponent(pin)}`;
  drawQr("qrcode-small", joinUrl, 70);
  drawQr("qrcode-large", joinUrl, 400);

  setTimeout(hideLoadingOverlay, 1200);

  const qrModal = document.getElementById("qr-modal");
  document.getElementById("qr-trigger")?.addEventListener("click", () => { qrModal.style.display = "flex"; });
  document.getElementById("qr-close-btn")?.addEventListener("click", () => { qrModal.style.display = "none"; });
  qrModal?.addEventListener("click", (e) => { if (e.target === qrModal) qrModal.style.display = "none"; });

  // عرض اللاعبين المحفوظين فوراً أثناء الاتصال بالسيرفر
  try {
    const cached = JSON.parse(localStorage.getItem("churchQuizPlayers") || "[]");
    if (Array.isArray(cached) && cached.length) updatePlayersUI(cached);
  } catch { /* ignore */ }

  const refreshPlayers = async () => {
    try {
      const list = await Api.game.players(pin);
      updatePlayersUI(list);
    } catch (e) {
      console.warn("players refresh failed", e);
    }
  };

  document.getElementById("btn-start-game")?.addEventListener("click", async () => {
    const players = await Api.game.players(pin);
    if (!players.length) return alert("Wait for at least one player to join first.");
    window.location.href = HOST_GAME_PAGE;
  });

  // تحديث فوري عند وصول أي حدث من SignalR
  Api.realtime.on("PlayerJoined", () => setTimeout(refreshPlayers, 50));
  Api.realtime.on("UpdatePlayerList", () => setTimeout(refreshPlayers, 50));
  Api.realtime.on("PlayerLeft", () => setTimeout(refreshPlayers, 50));
  Api.realtime.on("StateChanged", () => setTimeout(refreshPlayers, 50));

  // الاتصال بالـ Hub كمدرّس واسترجاع اللاعبين الموجودين بالفعل في الغرفة
  try {
    await Api.realtime.connect({ pin, role: "host" });
    await refreshPlayers();
  } catch (err) {
    console.error("Hub connection failed:", err);
    alert("Could not connect to the live server: " + (err.message || err.code));
  }

  setInterval(refreshPlayers, 1500);
});