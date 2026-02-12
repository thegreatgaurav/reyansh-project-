import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../core/errors/api-error';
import { AuthClaims } from './auth.middleware';

export const requireRole = (...roles: AuthClaims['role'][]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const role = (req as Request & { auth?: AuthClaims }).auth?.role;
    if (!role || !roles.includes(role)) throw new ApiError(403, 'FORBIDDEN', 'Insufficient role');
    next();
  };
