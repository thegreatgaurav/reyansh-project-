import { Router } from 'express';
import { createPresignedUpload } from '../controllers/fileController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';

export const fileRoutes = Router();
fileRoutes.post('/presign', requireAuth, createPresignedUpload);
