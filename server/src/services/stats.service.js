import { UserAchievement } from '../models/UserAchievement.js';
import { User } from '../models/User.js';

export async function getStats(userId) {
  const [user, achievementsUnlocked] = await Promise.all([User.findById(userId), UserAchievement.countDocuments({ userId })]);
  const stats = user.stats;
  return { gamesPlayed: stats.gamesPlayed, gamesCompleted: stats.gamesCompleted,
    gamesAbandoned: stats.gamesAbandoned, averageTime: stats.gamesCompleted ? Math.round(stats.totalPlayTimeSeconds / stats.gamesCompleted) : 0,
    bestTimes: stats.bestTimes, totalMistakes: stats.totalMistakes, totalHints: stats.totalHints,
    rating: user.rating, highestRating: user.highestRating, achievementsUnlocked };
}
