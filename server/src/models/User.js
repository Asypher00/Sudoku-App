import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  gamesPlayed: { type: Number, default: 0 }, gamesCompleted: { type: Number, default: 0 },
  gamesAbandoned: { type: Number, default: 0 }, totalMistakes: { type: Number, default: 0 },
  totalHints: { type: Number, default: 0 }, totalPlayTimeSeconds: { type: Number, default: 0 },
  bestTimes: { easy: Number, medium: Number, hard: Number, expert: Number },
}, { _id: false });

const schema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  playDays: { type: [String], default: [] },
  passwordHash: { type: String, required: true, select: false },
  rating: { type: Number, default: 1000 }, highestRating: { type: Number, default: 1000 },
  stats: { type: statsSchema, default: () => ({}) }, lastLoginAt: Date,
}, { timestamps: true });
schema.index({ rating: -1 });
export const User = mongoose.model('User', schema);
