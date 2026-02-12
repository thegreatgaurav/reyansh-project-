import { Router } from 'express';
import { checkIn, checkOut, presencePing } from '../controllers/attendanceController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireRole } from '../../../common/middlewares/rbacMiddleware.js';

export const attendanceRoutes = Router();
attendanceRoutes.use(requireAuth, requireRole(['INDIVIDUAL']));
attendanceRoutes.post('/check-in', checkIn);
attendanceRoutes.post('/check-out', checkOut);
attendanceRoutes.post('/presence-ping', presencePing);
