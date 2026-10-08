import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  puzzle: [[Number]], solution: [[Number]], board: [[Number]],
  notes: { type: [[[Number]]], default: () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])) },
  seconds: { type: Number, default: 0 }, mistakes: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 }, completed: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ userId: 1, difficulty: 1 }, { unique: true });
export const PlaySession = mongoose.model('PlaySession', schema);
