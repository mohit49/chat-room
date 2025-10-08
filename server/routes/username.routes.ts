import express from 'express';
import { usernameController } from '../controllers/username.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateUsernameSchema, checkUsernameSchema } from '../validators/username.validator';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/check', validate(checkUsernameSchema), usernameController.checkAvailability);
router.put('/update', validate(updateUsernameSchema), usernameController.updateUsername);

export default router;


