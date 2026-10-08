import { getStats } from '../services/stats.service.js';
export const stats = async (req, res) => res.json({ success: true, stats: await getStats(req.user.id) });
