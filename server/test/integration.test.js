import { beforeAll, afterAll, test } from '@jest/globals';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';

const integration = process.env.MONGODB_TEST_URI ? test : test.skip;
let app;
let Game;
let RatingHistory;

beforeAll(async () => {
  if (!process.env.MONGODB_TEST_URI) return;
  process.env.JWT_SECRET ||= 'test-only-secret-at-least-32-characters-long';
  const database = `nudoku_test_${Date.now()}_${process.pid}`;
  await mongoose.connect(process.env.MONGODB_TEST_URI, { dbName: database });
  ({ app } = await import('../src/app.js'));
  ({ Game } = await import('../src/models/Game.js'));
  ({ RatingHistory } = await import('../src/models/RatingHistory.js'));
  const { seedAchievements } = await import('../src/services/achievement.service.js');
  await seedAchievements();
  await Game.init();
});

afterAll(async () => {
  if (!process.env.MONGODB_TEST_URI) return;
  try {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) await collection.drop();
  } finally {
    await mongoose.disconnect();
  }
});

integration('register, resume, solve, rate, unlock, rank, and enforce ownership', async () => {
  const player = request.agent(app);
  const email = `player-${Date.now()}@example.com`;
  const registered = await player.post('/api/auth/register').send({ email, password: 'password123' });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.rating, 1000);
  assert.ok(registered.headers['set-cookie'][0].includes('HttpOnly'));
  assert.equal((await player.get('/api/auth/me')).body.user.email, email);

  const created = await player.post('/api/games').send({ difficulty: 'easy' });
  assert.equal(created.status, 201);
  assert.equal('solution' in created.body.game, false);
  const gameId = created.body.game.id;
  assert.equal((await player.get('/api/games/active')).body.game.id, gameId);
  assert.equal((await player.post('/api/games').send({ difficulty: 'hard' })).body.error.code, 'ACTIVE_GAME_EXISTS');

  const other = request.agent(app);
  await other.post('/api/auth/register').send({ email: `other-${Date.now()}@example.com`, password: 'password123' });
  assert.equal((await other.get(`/api/games/${gameId}`)).status, 404);

  const stored = await Game.findById(gameId).select('+solution');
  const position = stored.puzzle.flat().findIndex((value) => value === 0);
  const row = Math.floor(position / 9);
  const col = position % 9;
  const moved = await player.post(`/api/games/${gameId}/move`).send({ row, col, value: stored.solution[row][col] });
  assert.equal(moved.body.valid, true);
  const saved = await player.patch(`/api/games/${gameId}`).send({ currentBoard: stored.solution, elapsedSeconds: 1 });
  assert.equal(saved.status, 200);
  assert.equal((await player.post(`/api/games/${gameId}/complete`)).status, 200);
  assert.equal((await player.post(`/api/games/${gameId}/complete`)).body.error.code, 'GAME_ALREADY_COMPLETED');
  assert.equal(await RatingHistory.countDocuments({ gameId }), 1);

  const stats = (await player.get('/api/stats')).body.stats;
  assert.equal(stats.gamesPlayed, 1);
  assert.equal(stats.gamesCompleted, 1);
  assert.equal(stats.rating, (await player.get('/api/auth/me')).body.user.rating);
  assert.ok(stats.achievementsUnlocked >= 2);
  assert.ok((await player.get('/api/achievements/me')).body.achievements.some((item) => item.code === 'FIRST_WIN' && item.unlocked));
  assert.ok((await player.get('/api/games/history')).body.games.some((item) => item.id === gameId && !('solution' in item)));
  const leaderboard = (await player.get('/api/leaderboard')).body.players;
  assert.ok(leaderboard.some((item) => item.userId === registered.body.user.id));
  assert.ok(leaderboard.every((item) => !('email' in item)));
  await player.post('/api/auth/logout');
  assert.equal((await player.get('/api/auth/me')).status, 401);
}, 120000);

integration('username signup, duplicate rejection, logout, and login restore the same account', async () => {
  const player = request.agent(app);
  const username = `tester_${Date.now()}`;
  const password = 'test-password-123';
  const registered = await player.post('/api/auth/register').send({ username, password });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.username, username);
  assert.equal('passwordHash' in registered.body.user, false);
  assert.equal((await player.get('/api/auth/me')).body.user.id, registered.body.user.id);
  assert.equal((await request(app).post('/api/auth/register').send({ username: username.toUpperCase(), password })).status, 409);
  assert.equal((await player.post('/api/auth/logout')).status, 200);
  assert.equal((await player.get('/api/auth/me')).status, 401);
  assert.equal((await player.post('/api/auth/login').send({ username, password: 'incorrect-password' })).status, 401);
  const loggedIn = await player.post('/api/auth/login').send({ username: username.toUpperCase(), password });
  assert.equal(loggedIn.status, 200);
  assert.equal(loggedIn.body.user.id, registered.body.user.id);
  assert.equal((await player.get('/api/auth/me')).body.user.id, registered.body.user.id);
  await player.post('/api/auth/logout');
}, 30000);

integration('per-account difficulty saves preserve answers and notes, enforce loss, reset, and daily activity', async () => {
  const player = request.agent(app);
  const email = `save-${Date.now()}@example.com`;
  await player.post('/api/auth/register').send({ email, password: 'password123' });
  const medium = (await player.post('/api/play/medium').send({ timeZone: 'Asia/Kolkata' })).body.game;
  assert.ok(medium);
  const position = medium.puzzle.flat().findIndex((value) => !value);
  const row = Math.floor(position / 9), col = position % 9;
  medium.notes[row][col] = [1, 2, 3];
  const payload = () => ({ board: medium.board, notes: medium.notes, seconds: 15, mistakes: medium.mistakes, hintsUsed: medium.hintsUsed });
  assert.equal((await player.put(`/api/play/${medium.id}`).send(payload())).status, 200);
  await player.post('/api/auth/logout');
  assert.equal((await player.get('/api/play')).status, 401);
  await player.post('/api/auth/login').send({ email, password: 'password123' });
  const resumed = (await player.post('/api/play/medium').send({})).body.game;
  assert.equal(resumed.id, medium.id);
  assert.deepEqual(resumed.notes[row][col], [1, 2, 3]);
  assert.equal(resumed.mistakes, 0);
  medium.board[row][col] = medium.solution[row][col]; medium.notes[row][col] = [];
  assert.equal((await player.put(`/api/play/${medium.id}`).send(payload())).status, 200);
  const easy = (await player.post('/api/play/easy').send({})).body.game;
  assert.notEqual(easy.id, medium.id);
  assert.deepEqual((await player.post('/api/play/medium').send({})).body.game.board, medium.board);
  const hard = (await player.post('/api/play/hard').send({})).body.game;
  const hardClues = hard.puzzle.flat().filter(Boolean).length;
  assert.ok(hardClues >= 22 && hardClues <= 26);
  medium.mistakes = 3;
  assert.equal((await player.put(`/api/play/${medium.id}`).send(payload())).status, 200);
  assert.equal((await player.put(`/api/play/${medium.id}`).send(payload())).status, 200);
  assert.equal((await player.put(`/api/play/${medium.id}`).send({ ...payload(), mistakes: 4 })).status, 400);
  assert.equal((await player.put(`/api/play/${medium.id}`).send({ ...payload(), seconds: 16 })).status, 409);
  assert.equal((await player.post('/api/play/medium').send({})).body.game.mistakes, 3);
  const reset = (await player.post('/api/play/medium').send({ reset: true })).body.game;
  assert.equal(reset.mistakes, 0); assert.equal(reset.seconds, 0);
  assert.deepEqual(reset.board, reset.puzzle);
  assert.notDeepEqual(reset.puzzle, medium.puzzle);
  const complete = await player.put(`/api/play/${reset.id}`).send({ board: reset.solution, notes: reset.notes, seconds: 20, mistakes: 0, hintsUsed: 0 });
  assert.equal(complete.body.game.completed, true);
  const fresh = (await player.post('/api/play/medium').send({})).body.game;
  assert.equal(fresh.completed, false); assert.notDeepEqual(fresh.puzzle, reset.puzzle);
  const all = (await player.get('/api/play')).body;
  assert.equal(all.games.length, 3);
  assert.equal(new Set(all.activity).size, all.activity.length);
  const other = request.agent(app);
  await other.post('/api/auth/register').send({ email: `isolated-${Date.now()}@example.com`, password: 'password123' });
  assert.deepEqual((await other.get('/api/play')).body.games, []);
  assert.equal((await other.put(`/api/play/${fresh.id}`).send({ board: fresh.board, notes: fresh.notes, seconds: 0, mistakes: 0, hintsUsed: 0 })).status, 404);
}, 180000);
