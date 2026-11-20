import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPlayers, handler } from '../netlify/functions/quiz-leaderboard.mjs';
const submission = (name, score, extra = {}) => ({ data: {
  'player-name': name, 'correct-answers': String(score), 'public-leaderboard': 'yes', ...extra,
}});
test('adds scores and question totals per normalized nickname', () => {
  assert.deepEqual(rankPlayers([
    submission(' Alex ', 4), submission('alex', 9), submission('alex', 2),
    submission('Zoe', 10), submission('Bob', 9),
    submission(' Mary   Jane ', 7), submission('mary jane', 3),
  ]), [{name:'Zoe',score:10,total:10},{name:'Bob',score:9,total:10},{name:'Alex',score:15,total:30},{name:'Mary Jane',score:10,total:20}]);
});
test('ranks accuracy first, then total correct answers, then nickname', () => {
  assert.deepEqual(rankPlayers([
    submission('Single', 10), submission('Double', 10), submission('Double', 10),
    submission('Lower accuracy', 9), submission('Lower accuracy', 10),
    submission('Zoe', 8), submission('Amy', 8),
    submission('Half', 5), submission('Half twice', 5), submission('Half twice', 5),
  ]), [
    {name:'Double',score:20,total:20}, {name:'Single',score:10,total:10},
    {name:'Lower accuracy',score:19,total:20},
    {name:'Amy',score:8,total:10}, {name:'Zoe',score:8,total:10},
    {name:'Half twice',score:10,total:20}, {name:'Half',score:5,total:10},
  ]);
});
test('counts a retried attempt once while counting distinct attempts and legacy submissions', () => {
  assert.deepEqual(rankPlayers([
    submission('Alex', 7, {'attempt-id':'first'}),
    submission('alex', 7, {'attempt-id':'first'}),
    submission('Alex', 4, {'attempt-id':'second'}),
    submission('Alex', 0),
  ]), [{name:'Alex',score:11,total:30}]);
});
test('returns ten players and excludes private or malformed submissions', () => {
  const invalid = [submission('Private', 10, {'public-leaderboard': undefined}),
    submission('', 10), submission('Bad', 11), submission('Bad', -1),
    submission('Bad', ''), submission('Bad', 3.5), submission('x'.repeat(61), 10)];
  assert.deepEqual(rankPlayers(invalid), []);
  assert.equal(rankPlayers(Array.from({length:15}, (_, i) => submission(`Player ${i}`, i % 11))).length, 10);
  assert.deepEqual(rankPlayers([submission('Zero', 0)]), [{name:'Zero',score:0,total:10}]);
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
    assert.deepEqual(JSON.parse(result.body), {players:[{name:'Winner',score:10,total:10},{name:'First',score:300,total:1000}]});
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
