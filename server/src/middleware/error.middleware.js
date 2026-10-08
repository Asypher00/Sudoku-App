import { ApiError } from '../utils/errors.js';

export function notFound(_req, _res, next) { next(new ApiError(404, 'NOT_FOUND', 'Route not found.')); }

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;
  if (error instanceof ApiError) return res.status(error.status).json({ success: false, error: { code: error.code, message: error.message } });
  if (error.name === 'CastError') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid identifier.' } });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON.' } });
  if (error.code === 11000) return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Resource already exists.' } });
  console.error(error);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' } });
}
