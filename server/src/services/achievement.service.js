import { Achievement } from '../models/Achievement.js';
import { UserAchievement } from '../models/UserAchievement.js';
import { Game } from '../models/Game.js';
import { env } from '../config/env.js';

const definitions = [
  ['FIRST_WIN', 'First Solve', 'Complete your first Sudoku.', 'games_completed', 1, 10],
  ['TEN_WINS', 'Ten Wins', 'Complete 10 Sudoku games.', 'games_completed', 10, 20],
  ['FIFTY_WINS', 'Fifty Wins', 'Complete 50 Sudoku games.', 'games_completed', 50, 50],
  ['HARD_SOLVER', 'Hard Solver', 'Complete a Hard Sudoku.', 'hard_completion', 1, 20],
  ['EXPERT_SOLVER', 'Expert Solver', 'Complete an Expert Sudoku.', 'expert_completion', 1, 30],
  ['NO_MISTAKES', 'Clean Solve', 'Complete a Sudoku without mistakes.', 'zero_mistakes', 1, 15],
  ['SPEED_SOLVER', 'Speed Solver', 'Complete an Easy Sudoku within the speed threshold.', 'speed_easy', 1, 15],
  ['CONSISTENT_PLAYER', 'Consistent Player', 'Complete 5 games.', 'games_completed', 5, 15],
];

export async function seedAchievements() {
  await Achievement.bulkWrite(definitions.map(([code, name, description, type, target, points]) => ({
    updateOne: { filter: { code }, update: { $setOnInsert: { code, name, description, category: 'progress', criteria: { type, target }, points, isActive: true } }, upsert: true },
  })));
}

function currentProgress(definition, user, game) {
  switch (definition.criteria.type) {
    case 'games_completed': return user.stats.gamesCompleted;
    case 'hard_completion': return game?.difficulty === 'hard' ? 1 : 0;
    case 'expert_completion': return game?.difficulty === 'expert' ? 1 : 0;
    case 'zero_mistakes': return game?.mistakes === 0 ? 1 : 0;
    case 'speed_easy': return game?.difficulty === 'easy' && game.elapsedSeconds <= env.speedSolverSeconds ? 1 : 0;
    default: return 0;
  }
}

export async function evaluateAchievements(user, game, session) {
  const definitions = await Achievement.find({ isActive: true }).session(session);
  const existing = await UserAchievement.find({ userId: user._id }).session(session);
  const unlocked = new Set(existing.map((item) => String(item.achievementId)));
  const newly = definitions.filter((definition) => !unlocked.has(String(definition._id)) && currentProgress(definition, user, game) >= definition.criteria.target);
  if (newly.length) await UserAchievement.insertMany(newly.map((definition) => ({ userId: user._id, achievementId: definition._id, progress: definition.criteria.target })), { session });
  return newly.map(({ code, name, points }) => ({ code, name, points }));
}

export async function getDefinitions() {
  const items = await Achievement.find({ isActive: true }).sort({ _id: 1 });
  return items.map(({ code, name, description, category, criteria, points }) => ({ code, name, description, category, criteria, points }));
}

export async function getMine(userId) {
  const [definitions, unlocked] = await Promise.all([
    Achievement.find({ isActive: true }).sort({ _id: 1 }),
    UserAchievement.find({ userId }),
  ]);
  const byId = new Map(unlocked.map((item) => [String(item.achievementId), item]));
  return definitions.map((definition) => ({ code: definition.code, name: definition.name,
    description: definition.description, unlocked: byId.has(String(definition._id)),
    unlockedAt: byId.get(String(definition._id))?.unlockedAt || null }));
}

export async function getProgress(user) {
  const [definitions, unlocked, completed] = await Promise.all([
    Achievement.find({ isActive: true }).sort({ _id: 1 }),
    UserAchievement.find({ userId: user._id }),
    // Historical conditional achievements need server-owned game history for progress.
    Game.find({ userId: user._id, status: 'completed' }).select('difficulty mistakes elapsedSeconds'),
  ]);
  const byId = new Set(unlocked.map((item) => String(item.achievementId)));
  return definitions.map((definition) => {
    let current = user.stats.gamesCompleted;
    const type = definition.criteria.type;
    if (type === 'hard_completion') current = completed.filter((game) => game.difficulty === 'hard').length;
    if (type === 'expert_completion') current = completed.filter((game) => game.difficulty === 'expert').length;
    if (type === 'zero_mistakes') current = completed.filter((game) => game.mistakes === 0).length;
    if (type === 'speed_easy') current = completed.filter((game) => game.difficulty === 'easy' && game.elapsedSeconds <= env.speedSolverSeconds).length;
    return { code: definition.code, current: Math.min(current, definition.criteria.target), target: definition.criteria.target, unlocked: byId.has(String(definition._id)) };
  });
}
