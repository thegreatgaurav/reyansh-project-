import { Request, Response } from 'express';

export async function submitVendorOnboarding(_req: Request, res: Response): Promise<void> {
  res.status(202).json({ message: 'Vendor onboarding submitted for admin verification.' });
}

export async function submitIndividualOnboarding(_req: Request, res: Response): Promise<void> {
  res.status(202).json({ message: 'Individual onboarding submitted for admin verification.' });
}
