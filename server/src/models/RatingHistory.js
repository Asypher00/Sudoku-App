import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true }, gameId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  ratingBefore: Number, ratingChange: Number, ratingAfter: Number, difficulty: String,
  elapsedSeconds: Number, mistakes: Number, hintsUsed: Number,
}, { timestamps: true });
schema.index({ userId: 1, createdAt: -1 });
export const RatingHistory = mongoose.model('RatingHistory', schema);
