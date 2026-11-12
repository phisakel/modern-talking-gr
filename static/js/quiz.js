import {
  createRound,
  answerQuestion,
  nextQuestion,
  isComplete,
} from "./quiz-engine.mjs";
const $ = (id) => document.getElementById(id);
const audio = $("quiz-audio");
const form = $("quiz-save");
async function loadLeaderboard() {
  const status = $("leaderboard-status");
  const table = $("leaderboard-table");
  const retry = $("leaderboard-retry");
  retry.hidden = true;
  status.textContent = "Loading the top scores…";
  try {
    const response = await fetch("/.netlify/functions/quiz-leaderboard", {
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("Leaderboard unavailable");
    const { players } = await response.json();
    if (!Array.isArray(players)) throw new Error("Invalid leaderboard");
    $("leaderboard-players").replaceChildren();
    players.slice(0, 10).forEach(({ name, score }, index) => {
      const row = document.createElement("tr");
      [index + 1, name, `${score} / 10`].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
      $("leaderboard-players").append(row);
    });
    table.hidden = players.length === 0;
    status.textContent = players.length ? "" : "No scores yet. Play a set and save your score to be the first!";
  } catch {
    status.textContent = table.hidden
      ? "Top scores are temporarily unavailable. Please try again shortly."
      : "We couldn’t refresh the top scores. Showing the last loaded results.";
    retry.hidden = false;
  }
}
$("leaderboard-retry").addEventListener("click", loadLeaderboard);
let bank,
  round,
  player,
  attempt,
  saving = false,
  saved = false;
function show(screen) {
  ["quiz-setup", "quiz-play", "quiz-results"].forEach(
    (id) => ($(id).hidden = id !== screen)
  );
}
async function loadBank() {
  $("quiz-loading").hidden = false;
  $("quiz-loading").textContent = "Getting the music ready…";
  $("quiz-reload").hidden = true;
  try {
    const response = await fetch("/quiz-questions.json");
    if (!response.ok) throw new Error("Question bank unavailable");
    bank = await response.json();
    if (
      bank.sets.length !== 10 ||
      bank.sets.some((set) => set.questions.length !== 10)
    )
      throw new Error("Invalid question bank");
    $("quiz-loading").hidden = true;
    show("quiz-setup");
  } catch {
    $("quiz-loading").textContent =
      "We couldn’t load the quiz. Check your connection and try again.";
    $("quiz-reload").hidden = false;
  }
}
function stopAudio() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}
function renderQuestion() {
  const q = round.set.questions[round.index];
  stopAudio();
  audio.src = q.preview;
  $("quiz-set-label").textContent = `Set ${String(round.set.id).padStart(
    2,
    "0"
  )}`;
  $("quiz-score").textContent = `${round.score} correct`;
  $("quiz-progress").value = round.index;
  $("question-number").textContent = `Question ${round.index + 1} of 10`;
  $("quiz-feedback").textContent = "";
  $("audio-status").textContent = "";
  $("quiz-skip").hidden = true;
  $("quiz-next").disabled = true;
  $("quiz-next").textContent =
    round.index === 9 ? "See my result →" : "Next question →";
  $("quiz-answers").replaceChildren();
  q.options.forEach((title, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-answer";
    const letter = document.createElement("span");
    letter.className = "quiz-answer-letter";
    letter.textContent = "ABCD"[index];
    letter.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = title;
    button.append(letter, label);
    button.addEventListener("click", () => choose(title));
    $("quiz-answers").append(button);
  });
  $("question-heading").focus();
}
function choose(choice) {
  if (!answerQuestion(round, choice)) return;
  audio.pause();
  const q = round.set.questions[round.index];
  Array.from($("quiz-answers").children).forEach((button, index) => {
    button.disabled = true;
    if (q.options[index] === q.title) button.classList.add("is-correct");
    else if (q.options[index] === choice) button.classList.add("is-incorrect");
  });
  $("quiz-feedback").textContent =
    choice === null
      ? `Skipped. The title was “${q.title}”.`
      : choice === q.title
      ? `Correct! It’s “${q.title}”.`
      : `Not quite. The correct title is “${q.title}”.`;
  $("quiz-score").textContent = `${round.score} correct`;
  $("quiz-progress").value = round.index + 1;
  $("quiz-skip").hidden = true;
  $("quiz-next").disabled = false;
  $("quiz-next").focus();
}
function finish() {
  stopAudio();
  show("quiz-results");
  $("result-player").textContent = `${player} · Set ${String(
    round.set.id
  ).padStart(2, "0")}`;
  $("result-score").textContent = round.score;
  $("result-message").textContent =
    round.score === 10
      ? "A perfect ten. You know every note."
      : round.score >= 7
      ? "You know your Modern Talking. Keep the music playing!"
      : "Every listen is a new discovery. Try another set!";
  const values = {
    "player-name": player,
    "set-number": round.set.id,
    "correct-answers": round.score,
    "quiz-version": bank.version,
    "attempt-id": attempt,
  };
  Object.entries(values).forEach(
    ([name, value]) => (form.elements.namedItem(name).value = value)
  );
  $("quiz-review-list").replaceChildren();
  round.set.questions.forEach((q, index) => {
    const item = document.createElement("li");
    const title = document.createElement("a");
    title.href = `/song/${q.id}/`;
    title.textContent = q.title;
    const result = document.createElement("span");
    const answer = round.answers[index];
    result.textContent = answer.correct
      ? "Correct"
      : answer.choice === null
      ? "Sample skipped · 0 points"
      : `Your answer: ${answer.choice}`;
    result.className = answer.correct ? "quiz-review-correct" : "quiz-help";
    item.append(title, result);
    $("quiz-review-list").append(item);
  });
  $("results-heading").focus();
}
$("quiz-start").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("player-name");
  player = input.value.trim();
  input.setCustomValidity(player ? "" : "Please enter your name or nickname.");
  if (!input.reportValidity()) return;
  round = createRound(
    bank.sets.find(
      (set) =>
        set.id === Number(new FormData(event.currentTarget).get("quiz-set"))
    )
  );
  attempt = crypto.randomUUID();
  saved = false;
  $("save-score").disabled = false;
  $("save-score").textContent = "Save score";
  $("save-status").textContent = "";
  show("quiz-play");
  renderQuestion();
});
$("player-name").addEventListener("input", () =>
  $("player-name").setCustomValidity("")
);
$("quiz-next").addEventListener("click", () => {
  if (!nextQuestion(round)) return;
  isComplete(round) ? finish() : renderQuestion();
});
$("quiz-skip").addEventListener("click", () => choose(null));
audio.addEventListener("error", () => {
  if (!audio.getAttribute("src") || !round || isComplete(round)) return;
  $("audio-status").textContent =
    "This sample could not play. Try play again, or skip it for 0 points.";
  $("quiz-skip").hidden = round.answers.length !== round.index;
});
audio.addEventListener("playing", () => {
  $("audio-status").textContent = "";
  $("quiz-skip").hidden = true;
});
$("quiz-again").addEventListener("click", () => {
  if (saving) return;
  show("quiz-setup");
  $("player-name").focus();
});
$("quiz-reload").addEventListener("click", loadBank);
window.addEventListener("pagehide", stopAudio);
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!round || !isComplete(round) || saving || saved) return;
  // Netlify removes this attribute when it registers the form at deploy time.
  if (form.hasAttribute("data-netlify")) {
    $("save-status").textContent =
      "Score saving is not available in this preview. You can still play all ten sets.";
    return;
  }
  saving = true;
  $("save-score").disabled = true;
  $("quiz-again").disabled = true;
  $("save-status").textContent = "Saving your score…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("/quiz/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Save failed");
    saved = true;
    $("save-score").textContent = "Score submitted";
    $("save-status").textContent =
      "Thank you! Your score has been submitted. The leaderboard may take a little time to update.";
    loadLeaderboard();
  } catch {
    $("save-status").textContent =
      "We couldn’t confirm your score was saved. Your result is still here; please try again.";
    $("save-score").disabled = false;
  } finally {
    clearTimeout(timeout);
    saving = false;
    $("quiz-again").disabled = false;
  }
});
loadBank();
loadLeaderboard();
