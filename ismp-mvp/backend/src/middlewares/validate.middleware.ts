import { Request, Response, NextFunction } from 'express';

export const validate = (_schema: unknown) => (_req: Request, _res: Response, next: NextFunction) => {
  // Plug zod/joi schema parsing here.
  next();
};
