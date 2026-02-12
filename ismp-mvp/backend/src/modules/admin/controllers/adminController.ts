import { Request, Response } from 'express';

export async function listPendingVerifications(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}

export async function approveVerification(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: 'Verification approved and code generated.' });
}

export async function rejectVerification(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: 'Verification rejected.' });
}

export async function listPlatformUsers(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}
