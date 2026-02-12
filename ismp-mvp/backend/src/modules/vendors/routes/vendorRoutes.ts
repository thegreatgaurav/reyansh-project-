import { Router } from 'express';
import { assignGuard, getVendorProfile, linkPersonnel, listDeployments, listOpenJobs } from '../controllers/vendorController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireRole } from '../../../common/middlewares/rbacMiddleware.js';

export const vendorRoutes = Router();

vendorRoutes.use(requireAuth, requireRole(['VENDOR']));
vendorRoutes.get('/profile', getVendorProfile);
vendorRoutes.post('/personnel/link', linkPersonnel);
vendorRoutes.get('/jobs/open', listOpenJobs);
vendorRoutes.post('/jobs/:jobId/assign', assignGuard);
vendorRoutes.get('/deployments', listDeployments);
