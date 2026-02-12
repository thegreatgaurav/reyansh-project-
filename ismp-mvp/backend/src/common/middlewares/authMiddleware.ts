import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { env } from '../../config/env.js';
import { JwtPayload } from '../types/auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw createHttpError(401, 'Missing access token');
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    req.auth = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    next();
  } catch {
    throw createHttpError(401, 'Invalid token');
  }
}
