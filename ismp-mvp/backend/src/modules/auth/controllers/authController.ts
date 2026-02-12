import { Request, Response } from 'express';
import { loginSchema } from '../validators/authValidators.js';
import { loginWithEmail } from '../services/authService.js';

export async function loginController(req: Request, res: Response): Promise<void> {
  const payload = loginSchema.parse(req.body);
  const { accessToken, refreshToken } = await loginWithEmail(payload.email, payload.password, payload.role);

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });

  res.status(200).json({ accessToken });
}

export async function logoutController(_req: Request, res: Response): Promise<void> {
  res.clearCookie('refresh_token');
  res.status(204).send();
}
