import { Router } from 'express';
import { createJobPost, getAssignedGuards, getAttendanceLogs } from '../controllers/customerController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireRole } from '../../../common/middlewares/rbacMiddleware.js';

export const customerRoutes = Router();
customerRoutes.use(requireAuth, requireRole(['CUSTOMER']));
customerRoutes.post('/jobs', createJobPost);
customerRoutes.get('/jobs/:id/guards', getAssignedGuards);
customerRoutes.get('/jobs/:id/attendance', getAttendanceLogs);
