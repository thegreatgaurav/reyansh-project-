import { Router } from 'express';
import { submitIndividualOnboarding, submitVendorOnboarding } from '../controllers/onboardingController.js';
import { requireAuth } from '../../../common/middlewares/authMiddleware.js';

export const onboardingRoutes = Router();

onboardingRoutes.post('/vendor', requireAuth, submitVendorOnboarding);
onboardingRoutes.post('/individual', requireAuth, submitIndividualOnboarding);
