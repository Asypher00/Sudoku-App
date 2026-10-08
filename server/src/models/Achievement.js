import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  code: { type: String, unique: true, required: true }, name: String, description: String, category: String,
  criteria: { type: new mongoose.Schema({ type: String, target: Number }, { _id: false }) },
  points: Number, isActive: { type: Boolean, default: true },
}, { timestamps: true });
export const Achievement = mongoose.model('Achievement', schema);
