import express from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema } from '../validators/auth.validator';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), authController.resendVerification);

// Protected routes
router.get('/verification-status', authenticateToken, authController.getVerificationStatus);
router.post('/logout', authController.logout);

export default router;



