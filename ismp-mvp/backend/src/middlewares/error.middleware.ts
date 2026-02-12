import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../core/errors/api-error';

export const errorMiddleware = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
  }
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected error' } });
};
