export function createRound(set) {
  if (!set || set.questions.length !== 10)
    throw new Error("A set needs ten questions.");
  return { set, index: 0, answers: [], score: 0 };
}
export function answerQuestion(round, choice) {
  const question = round.set.questions[round.index];
  if (!question || round.answers.length !== round.index) return false;
  if (choice !== null && !question.options.includes(choice)) return false;
  const correct = choice === question.title;
  round.answers.push({ choice, correct });
  if (correct) round.score++;
  return true;
}
export function nextQuestion(round) {
  if (round.answers.length !== round.index + 1) return false;
  round.index++;
  return true;
}
export function isComplete(round) {
  return (
    round.index === round.set.questions.length && round.answers.length === 10
  );
}
