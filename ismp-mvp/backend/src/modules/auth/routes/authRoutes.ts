import { Router } from 'express';
import { loginController, logoutController } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/login', loginController);
authRoutes.post('/logout', logoutController);
