import { z } from 'zod';

const difficulty = z.enum(['easy', 'medium', 'hard', 'expert']);
const status = z.enum(['in_progress', 'completed', 'abandoned']);
const board = z.array(z.array(z.number().int().min(0).max(9)).length(9)).length(9);
const identity = {
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, or underscores.').optional(),
  email: z.string().trim().email().max(254).optional(),
};
const hasIdentity = (value) => Boolean(value.username) !== Boolean(value.email);
export const authInput = z.object({ ...identity, password: z.string().min(8).max(128).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes.') }).strict().refine(hasIdentity, 'Provide either a username or an email.');
export const loginInput = z.object({ ...identity, password: z.string().min(1).max(128) }).strict().refine(hasIdentity, 'Provide either a username or an email.');
export const gameInput = z.object({ difficulty }).strict();
export const saveInput = z.object({ currentBoard: board.optional(), elapsedSeconds: z.number().int().min(0).max(315360000).optional() }).strict().refine((value) => value.currentBoard !== undefined || value.elapsedSeconds !== undefined, 'No game data supplied.');
export const moveInput = z.object({ row: z.number().int().min(0).max(8), col: z.number().int().min(0).max(8), value: z.number().int().min(0).max(9) }).strict();
export const gameParams = z.object({ gameId: z.string().regex(/^[a-f\d]{24}$/i) });
export const historyQuery = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20), difficulty: difficulty.optional(), status: status.optional() });
export const leaderboardQuery = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });

export const playDifficulty = z.object({ difficulty: z.enum(['easy', 'medium', 'hard']) });
export const playStart = z.object({ reset: z.boolean().optional(), timeZone: z.string().max(100).refine((value) => { try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; } }, 'Invalid timezone.').optional() }).strict();
export const playId = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) });
export const playSave = z.object({ board, notes: z.array(z.array(z.array(z.number().int().min(1).max(9)).max(9)).length(9)).length(9), seconds: z.number().int().min(0).max(315360000), mistakes: z.number().int().min(0).max(3), hintsUsed: z.number().int().min(0).max(3) }).strict();
