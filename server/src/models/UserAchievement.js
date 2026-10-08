import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  unlockedAt: { type: Date, default: Date.now }, progress: { type: Number, default: 0 },
});
schema.index({ userId: 1, achievementId: 1 }, { unique: true });
schema.index({ userId: 1, unlockedAt: -1 });
export const UserAchievement = mongoose.model('UserAchievement', schema);
