import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as randomChatController from '../controllers/randomChat.controller';

const router = Router();

// Get available users with optional filters
router.get('/available-users', authenticateToken, randomChatController.getAvailableUsers);

// Get user's active session
router.get('/active-session', authenticateToken, randomChatController.getActiveSession);

// End session
router.post('/end-session/:sessionId', authenticateToken, randomChatController.endSession);

// Get session messages
router.get('/messages/:sessionId', authenticateToken, randomChatController.getSessionMessages);

export default router;


