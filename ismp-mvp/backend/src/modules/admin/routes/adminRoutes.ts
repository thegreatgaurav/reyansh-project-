import { Router } from 'express';
import { approveVerification, listPendingVerifications, listPlatformUsers, rejectVerification } from '../controllers/adminController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireRole } from '../../../common/middlewares/rbacMiddleware.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole(['ADMIN']));
adminRoutes.get('/verifications', listPendingVerifications);
adminRoutes.post('/verifications/:id/approve', approveVerification);
adminRoutes.post('/verifications/:id/reject', rejectVerification);
adminRoutes.get('/users', listPlatformUsers);
