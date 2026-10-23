
"use strict";

const form = document.getElementById("registration-form");

const nameInput = document.getElementById("fullName");
const codeInput = document.getElementById("studentCode");
const teamInput = document.getElementById("team");

const nameError = document.getElementById("name-error");
const codeError = document.getElementById("code-error");
const formMessage = document.getElementById("form-message");

const successPanel = document.getElementById("success-panel");
const summary = document.getElementById("registration-summary");
const editButton = document.getElementById("edit-button");

const params = new URLSearchParams(window.location.search);

const roomCode = (
  params.get("room") ||
  params.get("code") ||
  ""
).trim();

const roomBanner = document.getElementById("room-banner");

if (roomCode && roomBanner) {
  const roomDisplay = document.getElementById("room-code-display");

  if (roomDisplay) {
    roomDisplay.textContent = roomCode.toUpperCase();
  }

  roomBanner.hidden = false;
}

function clearErrors() {
  nameError.textContent = "";
  codeError.textContent = "";
  formMessage.textContent = "";
}

function addSummaryRow(label, value) {
  const row = document.createElement("div");
  row.className = "summary-row";

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = value || "—";

  row.append(labelElement, valueElement);
  summary.appendChild(row);
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  clearErrors();

  const fullName = nameInput.value.trim().replace(/\s+/g, " ");
  const studentCode = codeInput.value.trim();
  const team = teamInput.value.trim();

  let isValid = true;

  if (fullName.length < 2) {
    nameError.textContent = "Please enter your full name.";
    isValid = false;
  }

  if (studentCode.length === 0) {
    codeError.textContent = "Please enter your student code.";
    isValid = false;
  }

  if (!isValid) return;

  let quizzes;

  try {
    quizzes = JSON.parse(
      localStorage.getItem("churchAdminQuizzes") || "[]"
    );
  } catch {
    formMessage.textContent = "Could not read the available quizzes.";
    return;
  }

  if (!Array.isArray(quizzes)) {
    formMessage.textContent = "The saved quiz data is invalid.";
    return;
  }

  const availableQuizzes = quizzes.filter(
    quiz => quiz.status === "Ready"
  );

  if (availableQuizzes.length === 0) {
    formMessage.textContent =
      "No quiz is ready yet. Please contact the admin.";
    return;
  }

  // If multiple quizzes are ready, use the first one for now.
  const activeQuiz = availableQuizzes[0];

  const registration = {
    fullName,
    studentCode,
    team,
    roomCode: roomCode || null,
    registeredAt: new Date().toISOString()
  };

  try {
    const storageKey = "churchQuizRegistrations";
    const savedData = JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    );

    if (!Array.isArray(savedData)) {
      throw new Error("Invalid registration data");
    }

    const alreadyRegistered = savedData.some(item =>
      String(item.studentCode || "").toLowerCase() ===
        studentCode.toLowerCase() &&
      String(item.roomCode || "").toLowerCase() ===
        String(roomCode || "").toLowerCase() &&
      String(item.quizId || "") === String(activeQuiz.id)
    );

    if (alreadyRegistered) {
      formMessage.textContent =
        "This student code is already registered for this quiz on this browser.";
      return;
    }

    savedData.push({
      ...registration,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title
    });

    localStorage.setItem(storageKey, JSON.stringify(savedData));

    localStorage.setItem(
      "churchQuizCurrentParticipant",
      JSON.stringify(registration)
    );
  } catch {
    formMessage.textContent =
      "Could not save your registration. Please try again.";
    return;
  }

  // Start the quiz directly after registration.
  window.location.href =
    "quiz.html?quiz=" + encodeURIComponent(activeQuiz.id);
});

if (editButton) {
  editButton.addEventListener("click", function () {
    if (successPanel) successPanel.hidden = true;
    if (form) form.hidden = false;

    const formHeader = document.querySelector(".form-header");

    if (formHeader) formHeader.hidden = false;
    if (roomBanner && roomCode) roomBanner.hidden = false;

    nameInput.focus();
  });
}

nameInput.addEventListener("input", function () {
  nameError.textContent = "";
  formMessage.textContent = "";
});

codeInput.addEventListener("input", function () {
  codeError.textContent = "";
  formMessage.textContent = "";
});
