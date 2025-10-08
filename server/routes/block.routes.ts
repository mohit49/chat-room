import express from 'express';
import { blockController } from '../controllers/block.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Block routes
router.post('/:userId', blockController.blockUser);
router.delete('/:userId', blockController.unblockUser);
router.get('/', blockController.getBlockedUsers);
router.get('/check/:userId', blockController.isUserBlocked);

export default router;
