import { PlaySession } from '../models/PlaySession.js';
import { User } from '../models/User.js';
import { generateSudoku } from '../services/sudoku/generator.js';
import { fail } from '../utils/errors.js';

const publicSession = (game) => ({ id: String(game._id), difficulty: game.difficulty,
  puzzle: game.puzzle, solution: game.solution, board: game.board, notes: game.notes,
  seconds: game.seconds, mistakes: game.mistakes, hintsUsed: game.hintsUsed, completed: game.completed });
export async function list(req, res) {
  const games = await PlaySession.find({ userId: req.user.id });
  const user = await User.findById(req.user.id);
  res.json({ success: true, games: games.map(publicSession), activity: user.playDays || [] });
}
export async function start(req, res) {
  const query = { userId: req.user.id, difficulty: req.params.difficulty };
  let game = await PlaySession.findOne(query);
  if (!game || game.completed || req.body.reset) {
    const { puzzle, solution } = generateSudoku(req.params.difficulty === 'hard' ? 'expert' : req.params.difficulty);
    game = await PlaySession.findOneAndUpdate(query, { $set: { puzzle, solution, board: puzzle,
      notes: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])),
      seconds: 0, mistakes: 0, hintsUsed: 0, completed: false } }, { upsert: true, new: true });
  }
  // A calendar day counts once, when a player opens a difficulty, in their timezone.
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: req.body.timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const user = await User.findByIdAndUpdate(req.user.id, { $addToSet: { playDays: day } }, { new: true });
  res.json({ success: true, game: publicSession(game), activity: user.playDays });
}
export async function save(req, res) {
  const game = await PlaySession.findOne({ _id: req.params.id, userId: req.user.id });
  if (!game) fail(404, 'NOT_FOUND', 'Saved game not found.');
  if (game.completed || game.mistakes >= 3) {
    // Retrying a save after a dropped response must remain safe.
    const same = JSON.stringify(game.board) === JSON.stringify(req.body.board) && JSON.stringify(game.notes) === JSON.stringify(req.body.notes) && game.mistakes === req.body.mistakes && game.hintsUsed === req.body.hintsUsed && game.seconds === req.body.seconds;
    if (same) return res.json({ success: true, game: publicSession(game) });
    fail(409, 'GAME_FINISHED', 'This game has finished.');
  }
  const { board, notes, seconds, mistakes, hintsUsed } = req.body;
  if (board.some((row, r) => row.some((value, c) => (game.puzzle[r][c] && value !== game.puzzle[r][c]) || (value && value !== game.solution[r][c])))) fail(400, 'INVALID_BOARD', 'Board contains an invalid answer.');
  game.board = board; game.notes = notes; game.seconds = Math.max(game.seconds, seconds);
  game.mistakes = Math.max(game.mistakes, mistakes); game.hintsUsed = Math.max(game.hintsUsed, hintsUsed);
  game.completed = board.every((row, r) => row.every((value, c) => value === game.solution[r][c]));
  await game.save();
  res.json({ success: true, game: publicSession(game) });
}
