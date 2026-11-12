import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPlayers, handler } from '../netlify/functions/quiz-leaderboard.mjs';
const submission = (name, score, extra = {}) => ({ data: {
  'player-name': name, 'correct-answers': String(score), 'public-leaderboard': 'yes', ...extra,
}});
test('keeps the best score per normalized nickname, ordering ties alphabetically', () => {
  assert.deepEqual(rankPlayers([
    submission(' Alex ', 4), submission('alex', 9), submission('alex', 2),
    submission('Zoe', 10), submission('Bob', 9),
    submission(' Mary   Jane ', 7), submission('mary jane', 3),
  ]), [{name:'Zoe',score:10},{name:'alex',score:9},{name:'Bob',score:9},{name:'Mary Jane',score:7}]);
});
test('returns ten players and excludes private or malformed submissions', () => {
  const invalid = [submission('Private', 10, {'public-leaderboard': undefined}),
    submission('', 10), submission('Bad', 11), submission('Bad', -1),
    submission('Bad', ''), submission('Bad', 3.5), submission('x'.repeat(61), 10)];
  assert.deepEqual(rankPlayers(invalid), []);
  assert.equal(rankPlayers(Array.from({length:15}, (_, i) => submission(`Player ${i}`, i % 11))).length, 10);
  assert.deepEqual(rankPlayers([submission('Zero', 0)]), [{name:'Zero',score:0}]);
});
test('endpoint paginates and exposes only leaderboard fields; handles upstream failure', async () => {
  const oldFetch = globalThis.fetch;
  const oldToken = process.env.QUIZ_NETLIFY_API_TOKEN;
  const oldForm = process.env.QUIZ_NETLIFY_FORM_ID;
  try {
    process.env.QUIZ_NETLIFY_API_TOKEN = 'test-token';
    process.env.QUIZ_NETLIFY_FORM_ID = 'test-form';
    const urls = [];
    globalThis.fetch = async (url) => {
      urls.push(url);
      return { ok:true, json:async () => urls.length === 1
        ? Array.from({length:100}, () => submission('First', 3, {ip:'private'}))
        : [submission('Winner', 10)] };
    };
    const result = await handler({httpMethod:'GET'});
    assert.equal(result.statusCode, 200);
    assert.match(urls[1], /page=2$/);
    assert.deepEqual(JSON.parse(result.body), {players:[{name:'Winner',score:10},{name:'First',score:3}]});
    globalThis.fetch = async () => ({ok:false});
    assert.equal((await handler({httpMethod:'GET'})).statusCode, 503);
    assert.equal((await handler({httpMethod:'POST'})).statusCode, 405);
    delete process.env.QUIZ_NETLIFY_API_TOKEN;
    assert.equal((await handler({httpMethod:'GET'})).statusCode, 503);
  } finally {
    globalThis.fetch = oldFetch;
    for (const [key,value] of Object.entries({QUIZ_NETLIFY_API_TOKEN:oldToken,QUIZ_NETLIFY_FORM_ID:oldForm})) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
