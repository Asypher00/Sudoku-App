import * as play from '../controllers/play.controller.js';
import { playDifficulty, playStart, playId, playSave } from '../validators.js';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authInput, loginInput, gameInput, saveInput, moveInput, gameParams, historyQuery, leaderboardQuery } from '../validators.js';
import * as auth from '../controllers/auth.controller.js';
import * as game from '../controllers/game.controller.js';
import * as achievement from '../controllers/achievement.controller.js';
import { stats } from '../controllers/stats.controller.js';
import { leaderboard } from '../controllers/leaderboard.controller.js';

export const router = Router();
const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const authLimiter = rateLimit({ windowMs: env.loginRateWindowMs, limit: env.loginRateMax, standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts. Try again later.' } }),
});

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.post('/auth/register', authLimiter, validate(authInput), wrap(auth.registerUser));
router.post('/auth/login', authLimiter, validate(loginInput), wrap(auth.loginUser));
router.post('/auth/logout', wrap(auth.logoutUser));
router.get('/auth/me', requireAuth, wrap(auth.me));

router.get('/play', requireAuth, wrap(play.list));
router.post('/play/:difficulty', requireAuth, validate(playDifficulty, 'params'), validate(playStart), wrap(play.start));
router.put('/play/:id', requireAuth, validate(playId, 'params'), validate(playSave), wrap(play.save));

router.post('/games', requireAuth, validate(gameInput), wrap(game.create));
router.get('/games/active', requireAuth, wrap(game.active));
router.get('/games/history', requireAuth, validate(historyQuery, 'query'), wrap(game.history));
router.get('/games/:gameId', requireAuth, validate(gameParams, 'params'), wrap(game.get));
router.patch('/games/:gameId', requireAuth, validate(gameParams, 'params'), validate(saveInput), wrap(game.save));
router.post('/games/:gameId/move', requireAuth, validate(gameParams, 'params'), validate(moveInput), wrap(game.move));
router.post('/games/:gameId/hint', requireAuth, validate(gameParams, 'params'), wrap(game.hint));
router.post('/games/:gameId/complete', requireAuth, validate(gameParams, 'params'), wrap(game.complete));
router.post('/games/:gameId/abandon', requireAuth, validate(gameParams, 'params'), wrap(game.abandon));
router.get('/stats', requireAuth, wrap(stats));
router.get('/achievements', wrap(achievement.list));
router.get('/achievements/me', requireAuth, wrap(achievement.mine));
router.get('/achievements/progress', requireAuth, wrap(achievement.progress));
router.get('/leaderboard', validate(leaderboardQuery, 'query'), wrap(leaderboard));
