import { RatingHistory } from '../models/RatingHistory.js';

const factor = { easy: 1, medium: 1.25, hard: 1.5, expert: 1.8 };
const expectedSeconds = { easy: 600, medium: 900, hard: 1200, expert: 1800 };

export function calculateRatingChange(game) {
  const speed = Math.max(0.5, Math.min(1.25, expectedSeconds[game.difficulty] / Math.max(game.elapsedSeconds, 60)));
  const score = 12 * factor[game.difficulty] * speed - 3 * game.mistakes - 5 * game.hintsUsed;
  return Math.max(-25, Math.min(35, Math.round(score)));
}

export async function recordRating(user, game, session) {
  const before = user.rating;
  const change = calculateRatingChange(game);
  user.rating = Math.max(0, before + change);
  user.highestRating = Math.max(user.highestRating, user.rating);
  game.ratingBefore = before;
  game.ratingChange = user.rating - before;
  game.ratingAfter = user.rating;
  await RatingHistory.create([{ userId: user._id, gameId: game._id, ratingBefore: before,
    ratingChange: game.ratingChange, ratingAfter: user.rating, difficulty: game.difficulty,
    elapsedSeconds: game.elapsedSeconds, mistakes: game.mistakes, hintsUsed: game.hintsUsed }], { session });
  return { before, change: game.ratingChange, after: user.rating };
}
