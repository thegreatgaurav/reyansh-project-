import { Router } from 'express';
import { getCurrentAssignment } from '../controllers/individualController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';
import { requireRole } from '../../../common/middlewares/rbacMiddleware.js';

export const individualRoutes = Router();
individualRoutes.use(requireAuth, requireRole(['INDIVIDUAL']));
individualRoutes.get('/assignment/current', getCurrentAssignment);
