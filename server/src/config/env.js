import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  production: process.env.NODE_ENV === 'production',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  loginRateWindowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 900000),
  loginRateMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 100),
  speedSolverSeconds: Number(process.env.SPEED_SOLVER_SECONDS || 300),
};

export function validateEnv() {
  if (!env.mongoUri) throw new Error('MONGODB_URI is required');
  if (!env.jwtSecret || env.jwtSecret.length < 32 || env.jwtSecret === 'replace_with_a_long_random_secret') {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters');
  }
  if (!Number.isInteger(env.port) || env.port < 1) throw new Error('Invalid PORT');
}
