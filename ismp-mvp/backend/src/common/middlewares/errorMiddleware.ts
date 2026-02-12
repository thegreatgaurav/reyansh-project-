import { NextFunction, Request, Response } from 'express';

export function errorMiddleware(err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction): void {
  const status = err.status ?? 500;
  res.status(status).json({
    error: {
      message: err.message,
      status
    }
  });
}
