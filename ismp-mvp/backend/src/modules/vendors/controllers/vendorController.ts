import { Request, Response } from 'express';

export async function getVendorProfile(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ approvalStatus: 'PENDING' });
}

export async function linkPersonnel(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: 'Personnel linked to vendor code.' });
}

export async function listOpenJobs(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}

export async function assignGuard(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ message: 'Guard assigned to job.' });
}

export async function listDeployments(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ items: [] });
}
