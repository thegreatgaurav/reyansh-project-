import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../core/errors/api-error';

export interface AuthClaims {
  sub: string;
  role: 'ADMIN' | 'VENDOR' | 'INDIVIDUAL' | 'CUSTOMER';
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'UNAUTHORIZED', 'Missing token');
  const token = header.split(' ')[1];
  const claims = jwt.verify(token, env.jwtAccessSecret) as AuthClaims;
  (req as Request & { auth?: AuthClaims }).auth = claims;
  next();
};
