import { Request, Response } from 'express';

export async function createJobPost(_req: Request, res: Response): Promise<void> {
  res.status(201).json({ message: 'Job posted successfully.' });
}

export async function getAssignedGuards(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}

export async function getAttendanceLogs(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}
