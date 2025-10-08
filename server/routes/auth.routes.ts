import express from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { sendOTPSchema, loginSchema } from '../validators/auth.validator';

const router = express.Router();

router.post('/send-otp', validate(sendOTPSchema), authController.sendOTP);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);

export default router;



