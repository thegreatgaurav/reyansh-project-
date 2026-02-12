import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.auth?.role;
    if (!role || !allowedRoles.includes(role)) {
      throw createHttpError(403, 'Forbidden');
    }
    next();
  };
}
