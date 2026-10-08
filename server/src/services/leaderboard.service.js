import { User } from '../models/User.js';
export async function getLeaderboard({ page, limit }) {
  const [users, total] = await Promise.all([
    User.find().sort({ rating: -1, _id: 1 }).skip((page - 1) * limit).limit(limit).select('rating stats.gamesCompleted'),
    User.countDocuments(),
  ]);
  return { players: users.map((user, index) => ({ rank: (page - 1) * limit + index + 1,
    userId: String(user._id), displayName: `Player #${String(user._id).slice(-4).toUpperCase()}`,
    rating: user.rating, gamesCompleted: user.stats.gamesCompleted })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
