import { ApiError } from '../utils/errors.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(new ApiError(400, 'VALIDATION_ERROR', result.error.issues[0]?.message || 'Invalid request.'));
  req[source] = result.data;
  next();
};
