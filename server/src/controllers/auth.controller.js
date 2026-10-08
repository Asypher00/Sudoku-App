import { User } from '../models/User.js';
import { register, login, cookieOptions } from '../services/auth.service.js';
import { publicUser } from '../serializers.js';

export const registerUser = async (req, res) => {
  const result = await register(req.body);
  res.cookie('nudoku_session', result.token, cookieOptions());
  res.status(201).json({ success: true, user: result.user });
};
export const loginUser = async (req, res) => {
  const result = await login(req.body);
  res.cookie('nudoku_session', result.token, cookieOptions());
  res.json({ success: true, user: result.user });
};
export const logoutUser = async (_req, res) => {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  res.clearCookie('nudoku_session', options).json({ success: true });
};
export const me = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user: publicUser(user) });
};
