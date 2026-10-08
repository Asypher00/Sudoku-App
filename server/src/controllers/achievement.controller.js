import { User } from '../models/User.js';
import { getDefinitions, getMine, getProgress } from '../services/achievement.service.js';
export const list = async (_req, res) => res.json({ success: true, achievements: await getDefinitions() });
export const mine = async (req, res) => res.json({ success: true, achievements: await getMine(req.user.id) });
export const progress = async (req, res) => res.json({ success: true, progress: await getProgress(await User.findById(req.user.id)) });
