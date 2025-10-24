import express from 'express';
import { userController } from '../controllers/user.controller';
import { updateMobileController } from '../controllers/updateMobile.controller';
import { messageController } from '../controllers/message.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, updateLocationSchema } from '../validators/user.validator';

const router = express.Router();

// Public route for landing page - no authentication required
router.get('/public', userController.getPublicUsers);

// All other routes require authentication
router.use(authenticateToken);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/location', validate(updateLocationSchema), userController.updateLocation);
router.put('/update-mobile', updateMobileController.updateMobileNumber);
router.get('/messages', messageController.getUsersWithMessages);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);

export default router;

