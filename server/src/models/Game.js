import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], required: true },
  puzzle: { type: [[Number]], required: true }, solution: { type: [[Number]], required: true, select: false },
  currentBoard: { type: [[Number]], required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  elapsedSeconds: { type: Number, default: 0 }, mistakes: { type: Number, default: 0 }, hintsUsed: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now }, lastPlayedAt: { type: Date, default: Date.now }, completedAt: Date,
  ratingBefore: Number, ratingChange: Number, ratingAfter: Number,
}, { timestamps: true });
schema.index({ userId: 1, status: 1 });
schema.index({ userId: 1, createdAt: -1 });
schema.index({ userId: 1 }, { unique: true, partialFilterExpression: { status: 'in_progress' }, name: 'one_active_game_per_user' });
export const Game = mongoose.model('Game', schema);
