import { getLeaderboard } from '../services/leaderboard.service.js';
export const leaderboard = async (req, res) => res.json({ success: true, ...await getLeaderboard(req.query) });
