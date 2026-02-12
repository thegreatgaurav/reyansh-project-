import { Request, Response } from 'express';

export async function getCurrentAssignment(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ assignment: null });
}
