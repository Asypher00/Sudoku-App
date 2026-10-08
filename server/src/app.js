import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { ApiError } from './utils/errors.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { router } from './routes/router.js';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
const allowedOrigins = new Set([env.clientUrl]);
if (!env.production) {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}
app.use(cors({ origin: (origin, callback) => callback(null, allowedOrigins.has(origin) ? origin : false), credentials: true }));
app.use((req, _res, next) => {
  if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) return next(new ApiError(403, 'FORBIDDEN', 'Origin is not allowed.'));
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use('/api', router);
app.use(notFound);
app.use(errorHandler);
