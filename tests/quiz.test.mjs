import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createRound,
  answerQuestion,
  nextQuestion,
  isComplete,
} from "../static/js/quiz-engine.mjs";
const bank = JSON.parse(
  readFileSync(new URL("../static/quiz-questions.json", import.meta.url))
);
test("140 unique questions across fourteen named sets, four distinct titles and exactly one answer", () => {
  assert.equal(bank.sets.length, 14);
  assert.equal(new Set(bank.sets.map((set) => set.name)).size, 14);
  const titles = new Set();
  for (const [index, set] of bank.sets.entries()) {
    assert.equal(set.id, index + 1);
    assert.ok(typeof set.name === "string" && set.name.length > 0);
    assert.equal(set.questions.length, 10);
    for (const q of set.questions) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.equal(q.options.filter((option) => option === q.title).length, 1);
      assert.equal(new URL(q.preview).protocol, "https:");
      assert.match(q.id, /^\d+$/);
      titles.add(q.title);
    }
  }
  assert.equal(titles.size, 140);
});
test("only the first answer counts and unanswered questions cannot advance", () => {
  const round = createRound(bank.sets[0]);
  const q = round.set.questions[0];
  assert.equal(nextQuestion(round), false);
  assert.equal(answerQuestion(round, "invalid answer"), false);
  assert.equal(
    answerQuestion(
      round,
      q.options.find((option) => option !== q.title)
    ),
    true
  );
  assert.equal(answerQuestion(round, q.title), false);
  assert.equal(round.score, 0);
  assert.equal(nextQuestion(round), true);
  assert.equal(nextQuestion(round), false);
});
test("every set completes at ten with a perfect score and cannot score again", () => {
  for (const set of bank.sets) {
    const round = createRound(set);
    for (const q of set.questions) {
      assert.equal(isComplete(round), false);
      answerQuestion(round, q.title);
      nextQuestion(round);
    }
    assert.equal(isComplete(round), true);
    assert.equal(round.score, 10);
    assert.equal(answerQuestion(round, set.questions[0].title), false);
    assert.equal(nextQuestion(round), false);
  }
});
test("wrong and unavailable samples count as zero; mixed results total correctly", () => {
  const round = createRound(bank.sets[0]);
  round.set.questions.forEach((q, i) => {
    answerQuestion(
      round,
      i < 6
        ? q.title
        : i < 8
        ? null
        : q.options.find((option) => option !== q.title)
    );
    nextQuestion(round);
  });
  assert.equal(round.score, 6);
  assert.equal(isComplete(round), true);
});
