import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { fail } from '../utils/errors.js';
import { publicUser } from '../serializers.js';

export async function register({ username, email, password }) {
  const identity = username ? { username: username.trim().toLowerCase() } : { email: email.trim().toLowerCase() };
  const duplicateCode = username ? 'USERNAME_ALREADY_EXISTS' : 'EMAIL_ALREADY_EXISTS';
  const duplicateMessage = username ? 'Username is already registered.' : 'Email is already registered.';
  if (await User.exists(identity)) fail(409, duplicateCode, duplicateMessage);
  const passwordHash = await bcrypt.hash(password, env.saltRounds);
  try {
    const user = await User.create({ ...identity, passwordHash });
    return { user: publicUser(user), token: signToken(user) };
  } catch (error) {
    if (error.code === 11000) fail(409, duplicateCode, duplicateMessage);
    throw error;
  }
}

export async function login({ username, email, password }) {
  const user = await User.findOne(username ? { username: username.trim().toLowerCase() } : { email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    fail(401, 'INVALID_CREDENTIALS', 'Invalid username/email or password.');
  }
  user.lastLoginAt = new Date();
  await user.save();
  return { user: publicUser(user), token: signToken(user) };
}

export const signToken = (user) => jwt.sign({ userId: String(user._id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
export const cookieOptions = () => ({
  httpOnly: true, secure: env.production, sameSite: 'lax', path: '/', maxAge: 2 * 24 * 60 * 60 * 1000,
});
