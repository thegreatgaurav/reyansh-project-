import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.post('/auth/login', (_req, res) => res.status(200).json({ message: 'login handler' }));
router.post('/auth/refresh', (_req, res) => res.status(200).json({ message: 'refresh handler' }));
router.post('/auth/logout', requireAuth, (_req, res) => res.status(200).json({ message: 'logout handler' }));

router.post('/vendors/onboarding', requireAuth, requireRole('VENDOR'), (_req, res) => {
  res.status(201).json({ message: 'vendor onboarding submitted' });
});

router.post('/individuals/onboarding', requireAuth, requireRole('INDIVIDUAL'), (_req, res) => {
  res.status(201).json({ message: 'individual onboarding submitted' });
});

router.get('/admin/verifications/vendors', requireAuth, requireRole('ADMIN'), (_req, res) => {
  res.status(200).json({ message: 'pending vendor verifications' });
});

router.patch('/admin/vendors/:id/approve', requireAuth, requireRole('ADMIN'), (_req, res) => {
  res.status(200).json({ message: 'vendor approved + code generated' });
});

router.patch('/admin/individuals/:id/approve', requireAuth, requireRole('ADMIN'), (_req, res) => {
  res.status(200).json({ message: 'individual approved + code generated' });
});

router.post('/customer/jobs', requireAuth, requireRole('CUSTOMER'), (_req, res) => {
  res.status(201).json({ message: 'job posted' });
});

router.post('/vendor/jobs/:id/assign', requireAuth, requireRole('VENDOR'), (_req, res) => {
  res.status(201).json({ message: 'guard assigned to job' });
});

router.post('/attendance/check-in', requireAuth, requireRole('INDIVIDUAL'), (_req, res) => {
  res.status(201).json({ message: 'check-in logged with location' });
});

router.post('/attendance/hourly', requireAuth, requireRole('INDIVIDUAL'), (_req, res) => {
  res.status(201).json({ message: 'hourly confirmation logged' });
});

router.post('/attendance/check-out', requireAuth, requireRole('INDIVIDUAL'), (_req, res) => {
  res.status(201).json({ message: 'check-out logged with location' });
});

export default router;
