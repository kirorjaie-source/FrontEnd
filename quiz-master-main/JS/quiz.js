
"use strict";

const $ = (id) => document.getElementById(id);

const STORAGE = {
  quizzes: "churchAdminQuizzes",
  questions: "churchAdminQuestions",
  results: "churchQuizResults",
  participant: "churchQuizCurrentParticipant"
};

function readStore(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const params = new URLSearchParams(window.location.search);
const requestedQuizId = params.get("quiz");

const allQuizzes = readStore(STORAGE.quizzes);
const allQuestions = readStore(STORAGE.questions);
const participant = readStore(STORAGE.participant, null);

const quiz = allQuizzes.find((item) =>
  item.id === requestedQuizId && item.status === "Ready"
) || (
  !requestedQuizId
    ? allQuizzes.find((item) => item.status === "Ready")
    : null
);

let questions = [];
let answers = [];
let currentIndex = 0;
let secondsLeft = 0;
let timerId = null;
let startedAt = Date.now();
let submitted = false;

function showError(message) {
  $("quiz-panel").hidden = true;
  $("result-panel").hidden = true;
  $("error-panel").hidden = false;
  $("error-message").textContent = message;
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function startTimer() {
  stopTimer();

  const duration = Number(quiz.timePerQuestion) || 30;

  secondsLeft = duration;
  $("timer").textContent = `Time: ${secondsLeft}s`;

  timerId = setInterval(() => {
    secondsLeft -= 1;

    $("timer").textContent = `Time: ${secondsLeft}s`;

    if (secondsLeft <= 0) {
      stopTimer();

      if (currentIndex < questions.length - 1) {
        currentIndex += 1;
        renderQuestion();
      } else {
        submitQuiz(true);
      }
    }
  }, 1000);
}

function renderQuestion() {
  if (submitted) return;

  const question = questions[currentIndex];

  if (!question) {
    showError("Could not load this question.");
    return;
  }

  $("question-number").textContent =
    `Question ${currentIndex + 1} of ${questions.length}`;

  $("progress-bar").style.width =
    `${((currentIndex + 1) / questions.length) * 100}%`;

  $("question-text").textContent = question.text;
  $("answer-list").replaceChildren();
  $("quiz-message").textContent = "";

  question.answers.forEach((answer, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "answer-option";

    if (answers[currentIndex] === index) {
      button.classList.add("selected");
    }

    const letter = document.createElement("span");
    letter.className = "answer-letter";
    letter.textContent = String.fromCharCode(65 + index);

    const label = document.createElement("span");
    label.textContent = answer;

    button.append(letter, label);

    button.addEventListener("click", () => {
      answers[currentIndex] = index;

      // Update the selection without resetting the question timer.
      $("answer-list").querySelectorAll(".answer-option").forEach(
        (option) => option.classList.remove("selected")
      );

      button.classList.add("selected");
    });

    $("answer-list").appendChild(button);
  });

  $("previous-button").disabled = currentIndex === 0;
  $("next-button").hidden = currentIndex === questions.length - 1;
  $("submit-button").hidden = currentIndex !== questions.length - 1;

  startTimer();
}

function submitQuiz(fromTimer = false) {
  if (submitted) return;

  if (!fromTimer) {
    const unanswered = answers.filter(
      (value) => value === undefined
    ).length;

    if (unanswered > 0) {
      const proceed = confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`
      );

      if (!proceed) return;
    }
  }

  stopTimer();
  submitted = true;

  const score = questions.reduce((total, question, index) => {
    return total + (
      answers[index] === Number(question.correct) ? 1 : 0
    );
  }, 0);

  const percentage = Math.round((score / questions.length) * 100);

  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - startedAt) / 1000)
  );

  const result = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: participant.fullName,
    studentCode: participant.studentCode,
    team: participant.team || "",
    quizId: quiz.id,
    quizTitle: quiz.title,
    score,
    total: questions.length,
    percentage,
    time: elapsedSeconds,
    date: new Date().toISOString()
  };

  const results = readStore(STORAGE.results);

  if (!Array.isArray(results)) {
    showError("Could not read the saved results. Please contact the admin.");
    return;
  }

  try {
    results.push(result);
    localStorage.setItem(STORAGE.results, JSON.stringify(results));
  } catch {
    showError("Could not save your result in this browser.");
    return;
  }

  $("quiz-panel").hidden = true;
  $("result-panel").hidden = false;

  $("result-heading").textContent =
    percentage >= 70 ? "Well done!" : "Quiz completed!";

  $("result-score").textContent =
    `${score} / ${questions.length} (${percentage}%)`;

  $("result-description").textContent =
    `Thank you, ${participant.fullName}. Your result has been saved.`;
}

function init() {
  if (
    !participant ||
    !participant.fullName ||
    !participant.studentCode
  ) {
    showError("Please register before starting the quiz.");
    return;
  }

  if (!quiz) {
    showError("There is no available quiz. Please contact the admin.");
    return;
  }

  if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
    showError("No questions have been added to the question bank yet.");
    return;
  }

  const validQuestions = allQuestions.filter((question) =>
    question &&
    question.id &&
    typeof question.text === "string" &&
    question.text.trim() !== "" &&
    Array.isArray(question.answers) &&
    question.answers.length === 4 &&
    question.answers.every(
      (answer) => String(answer).trim() !== ""
    ) &&
    Number.isInteger(Number(question.correct)) &&
    Number(question.correct) >= 0 &&
    Number(question.correct) <= 3
  );

  if (Array.isArray(quiz.questionIds)) {
    // New quizzes: use only the exact questions selected by the admin.
    const selectedIds = new Set(quiz.questionIds);

    questions = validQuestions.filter((question) =>
      selectedIds.has(question.id)
    );
  } else {
    // Older quizzes created before question selection was added.
    const matchingQuestions = validQuestions.filter(
      (question) => question.category === quiz.category
    );

    questions = matchingQuestions.length
      ? matchingQuestions
      : validQuestions;
  }

  if (questions.length === 0) {
    showError(
      "This quiz has no valid questions selected. Please contact the admin."
    );
    return;
  }

  $("quiz-title").textContent = quiz.title;
  $("quiz-description").textContent =
    quiz.description || "Choose the best answer for each question.";
  $("quiz-category").textContent = quiz.category || "General";

  answers = new Array(questions.length);

  $("previous-button").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      renderQuestion();
    }
  });

  $("next-button").addEventListener("click", () => {
    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      renderQuestion();
    }
  });

  $("submit-button").addEventListener("click", () => submitQuiz());

  renderQuestion();
}

document.addEventListener("DOMContentLoaded", init);
