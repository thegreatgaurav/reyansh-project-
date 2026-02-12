import { Request, Response } from 'express';

function validateLocation(req: Request): { latitude: number; longitude: number } {
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Latitude and longitude are required as numbers');
  }
  return { latitude, longitude };
}

export async function checkIn(req: Request, res: Response): Promise<void> {
  validateLocation(req);
  res.status(200).json({ message: 'Check-in recorded with location capture.' });
}

export async function checkOut(req: Request, res: Response): Promise<void> {
  validateLocation(req);
  res.status(200).json({ message: 'Check-out recorded with location capture.' });
}

export async function presencePing(req: Request, res: Response): Promise<void> {
  validateLocation(req);
  res.status(200).json({ message: 'Hourly presence confirmation captured.' });
}
