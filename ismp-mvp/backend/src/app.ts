import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { requestIdMiddleware } from './common/middlewares/requestIdMiddleware.js';
import { errorMiddleware } from './common/middlewares/errorMiddleware.js';
import { authRoutes } from './modules/auth/routes/authRoutes.js';
import { onboardingRoutes } from './modules/onboarding/routes/onboardingRoutes.js';
import { adminRoutes } from './modules/admin/routes/adminRoutes.js';
import { vendorRoutes } from './modules/vendors/routes/vendorRoutes.js';
import { individualRoutes } from './modules/individuals/routes/individualRoutes.js';
import { customerRoutes } from './modules/customers/routes/customerRoutes.js';
import { attendanceRoutes } from './modules/attendance/routes/attendanceRoutes.js';
import { fileRoutes } from './modules/files/routes/fileRoutes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);
app.use(pinoHttp());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/individual', individualRoutes);
app.use('/api/v1/customer', customerRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/files', fileRoutes);

app.use(errorMiddleware);
