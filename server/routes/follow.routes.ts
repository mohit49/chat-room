import express from 'express';
import { followController } from '../controllers/follow.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Follow routes
router.post('/:userId', followController.sendFollowRequest);
router.delete('/:userId', followController.unfollowUser);
router.delete('/request/:userId', followController.cancelFollowRequest);
router.post('/request/:requestId/accept', followController.acceptFollowRequest);
router.post('/request/:requestId/reject', followController.rejectFollowRequest);
router.get('/requests', followController.getFollowRequests);
router.get('/status/:userId', followController.getFollowStatus);

export default router;
