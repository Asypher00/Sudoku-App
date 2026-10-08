import mongoose from 'mongoose';
import { Game } from '../models/Game.js';
import { User } from '../models/User.js';
import { generateSudoku, isComplete, isValidBoard, isValidMove, cloneBoard } from './sudoku/index.js';
import { recordRating } from './rating.service.js';
import { evaluateAchievements } from './achievement.service.js';
import { publicGame } from '../serializers.js';
import { fail } from '../utils/errors.js';

const owns = (userId, gameId) => ({ _id: gameId, userId });
const elapsed = (game, now = new Date()) => Math.max(0, Math.floor((now - game.startedAt) / 1000));

async function getOwned(userId, gameId, withSolution = false, session = null) {
  let query = Game.findOne(owns(userId, gameId));
  if (withSolution) query = query.select('+solution');
  if (session) query = query.session(session);
  const game = await query;
  if (!game) fail(404, 'NOT_FOUND', 'Game not found.');
  return game;
}

function requireActive(game) {
  if (game.status === 'completed') fail(409, 'GAME_ALREADY_COMPLETED', 'Game is already completed.');
  if (game.status !== 'in_progress') fail(409, 'GAME_NOT_ACTIVE', 'Game is not active.');
}

export async function createGame(userId, difficulty) {
  if (await Game.exists({ userId, status: 'in_progress' })) fail(409, 'ACTIVE_GAME_EXISTS', 'Abandon the active game before starting a new one.');
  const { puzzle, solution } = generateSudoku(difficulty);
  try {
    const game = await Game.create({ userId, difficulty, puzzle, solution, currentBoard: cloneBoard(puzzle) });
    await User.updateOne({ _id: userId }, { $inc: { 'stats.gamesPlayed': 1 } });
    return publicGame(game);
  } catch (error) {
    if (error.code === 11000) fail(409, 'ACTIVE_GAME_EXISTS', 'Abandon the active game before starting a new one.');
    throw error;
  }
}

export async function activeGame(userId) {
  const game = await Game.findOne({ userId, status: 'in_progress' }).sort({ createdAt: -1 });
  return game ? publicGame(game) : null;
}

export async function getGame(userId, gameId) { return publicGame(await getOwned(userId, gameId)); }

export async function saveGame(userId, gameId, board, clientSeconds) {
  const game = await getOwned(userId, gameId);
  requireActive(game);
  if (board) {
    if (!isValidBoard(board)) fail(400, 'INVALID_GAME_STATE', 'Board is invalid.');
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) {
      if (game.puzzle[row][col] && board[row][col] !== game.puzzle[row][col]) fail(400, 'INVALID_GAME_STATE', 'Original clues cannot be changed.');
    }
    game.currentBoard = cloneBoard(board);
  }
  // Client time can advance the display, but never determine the completion result.
  if (clientSeconds !== undefined) game.elapsedSeconds = Math.min(clientSeconds, elapsed(game));
  game.lastPlayedAt = new Date();
  await game.save();
  return publicGame(game);
}

export async function makeMove(userId, gameId, row, col, value) {
  const game = await getOwned(userId, gameId);
  requireActive(game);
  if (game.puzzle[row][col]) fail(400, 'INVALID_MOVE', 'Original clues cannot be changed.');
  if (value !== 0 && !isValidMove(game.currentBoard, row, col, value)) {
    game.mistakes++;
    game.lastPlayedAt = new Date();
    await game.save();
    return { valid: false, mistakes: game.mistakes, reason: 'conflict' };
  }
  game.currentBoard[row][col] = value;
  game.markModified('currentBoard');
  game.lastPlayedAt = new Date();
  await game.save();
  return { valid: true, currentBoard: game.currentBoard, mistakes: game.mistakes };
}

export async function giveHint(userId, gameId) {
  const game = await getOwned(userId, gameId, true);
  requireActive(game);
  const empties = [];
  for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (!game.currentBoard[row][col]) empties.push({ row, col });
  if (!empties.length) fail(409, 'INVALID_GAME_STATE', 'No empty cells remain.');
  const { row, col } = empties[Math.floor(Math.random() * empties.length)];
  const value = game.solution[row][col];
  game.currentBoard[row][col] = value;
  game.markModified('currentBoard');
  game.hintsUsed++;
  game.lastPlayedAt = new Date();
  await game.save();
  return { hint: { row, col, value }, hintsUsed: game.hintsUsed, currentBoard: game.currentBoard };
}

export async function abandonGame(userId, gameId) {
  const game = await getOwned(userId, gameId);
  requireActive(game);
  const result = await Game.updateOne({ ...owns(userId, gameId), status: 'in_progress' }, { $set: { status: 'abandoned', lastPlayedAt: new Date(), elapsedSeconds: elapsed(game) } });
  if (!result.modifiedCount) fail(409, 'GAME_NOT_ACTIVE', 'Game is not active.');
  await User.updateOne({ _id: userId }, { $inc: { 'stats.gamesAbandoned': 1 } });
  return publicGame(await getOwned(userId, gameId));
}

async function finish(userId, gameId, session) {
  const game = await getOwned(userId, gameId, true, session);
  requireActive(game);
  if (!isComplete(game.currentBoard) || game.currentBoard.some((row, r) => row.some((value, c) => value !== game.solution[r][c]))) {
    fail(400, 'INVALID_GAME_STATE', 'Board does not match the solution.');
  }
  const now = new Date();
  const update = await Game.updateOne({ ...owns(userId, gameId), status: 'in_progress' },
    { $set: { status: 'completed', completedAt: now, lastPlayedAt: now, elapsedSeconds: elapsed(game, now) } }, { session });
  if (!update.modifiedCount) fail(409, 'GAME_ALREADY_COMPLETED', 'Game is already completed.');
  game.status = 'completed';
  game.completedAt = now;
  game.lastPlayedAt = now;
  game.elapsedSeconds = elapsed(game, now);
  const user = await User.findById(userId).session(session);
  user.stats.gamesCompleted++;
  user.stats.totalMistakes += game.mistakes;
  user.stats.totalHints += game.hintsUsed;
  user.stats.totalPlayTimeSeconds += game.elapsedSeconds;
  const best = user.stats.bestTimes[game.difficulty];
  if (best == null || game.elapsedSeconds < best) {
    user.stats.bestTimes[game.difficulty] = game.elapsedSeconds;
    user.markModified('stats.bestTimes');
  }
  const rating = await recordRating(user, game, session);
  await user.save({ session });
  await Game.updateOne({ _id: game._id, userId }, { $set: { ratingBefore: game.ratingBefore, ratingChange: game.ratingChange, ratingAfter: game.ratingAfter } }, { session });
  const newAchievements = await evaluateAchievements(user, game, session);
  return { completion: { gameId: String(game._id), difficulty: game.difficulty,
    elapsedSeconds: game.elapsedSeconds, mistakes: game.mistakes, hintsUsed: game.hintsUsed }, rating, newAchievements };
}

export async function completeGame(userId, gameId) {
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && !hello.msg?.includes('isdbgrid')) return finish(userId, gameId, null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await finish(userId, gameId, session); });
    return result;
  } finally { await session.endSession(); }
}

export async function gameHistory(userId, { page, limit, difficulty, status }) {
  const filter = { userId, ...(difficulty && { difficulty }), ...(status && { status }) };
  const [items, total] = await Promise.all([
    Game.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Game.countDocuments(filter),
  ]);
  return { games: items.map(publicGame), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
