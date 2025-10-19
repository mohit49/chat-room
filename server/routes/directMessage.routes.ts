import express from 'express';
import { directMessageController } from '../controllers/directMessage.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Direct message routes
router.post('/', directMessageController.sendDirectMessage);
router.get('/:userId', directMessageController.getDirectMessages);
router.get('/', directMessageController.getConversations);
router.put('/seen/:otherUserId', directMessageController.markMessagesAsSeen);
router.delete('/:messageId', directMessageController.deleteMessage);
router.delete('/conversation/:userId', directMessageController.deleteConversation);

export default router;
