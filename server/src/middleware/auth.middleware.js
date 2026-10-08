import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { fail } from '../utils/errors.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.nudoku_session;
    if (!token) fail(401, 'UNAUTHORIZED', 'Authentication required.');
    let decoded;
    try { decoded = jwt.verify(token, env.jwtSecret); }
    catch { fail(401, 'UNAUTHORIZED', 'Invalid or expired session.'); }
    if (!mongoose.isValidObjectId(decoded.userId)) fail(401, 'UNAUTHORIZED', 'Invalid session.');
    const user = await User.findById(decoded.userId);
    if (!user) fail(401, 'UNAUTHORIZED', 'Authentication required.');
    req.user = { id: String(user._id) };
    next();
  } catch (error) { next(error); }
}
