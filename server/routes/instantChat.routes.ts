import { Router } from 'express';
import { instantChatController, uploadMiddleware } from '../controllers/instantChat.controller';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Create instant chat (requires auth)
router.post('/create', authenticateToken, instantChatController.createInstantChat);

// Get instant chat details (no auth required for joining via link)
router.get('/:chatId', instantChatController.getInstantChat);

// Join instant chat (optional auth - can be anonymous)
router.post('/:chatId/join', optionalAuth, instantChatController.joinInstantChat);

// Get messages (no auth required - uses chatId)
router.get('/:chatId/messages', instantChatController.getChatMessages);

// Send message (no auth required - uses senderId)
router.post('/:chatId/messages', instantChatController.sendMessage);

// Upload image (no auth required)
router.post('/upload-image', uploadMiddleware.image, instantChatController.uploadImage);

// Upload audio (no auth required)
router.post('/upload-audio', uploadMiddleware.audio, instantChatController.uploadAudio);

// Delete message (no auth required - validates senderId in body)
router.delete('/:chatId/messages/:messageId', instantChatController.deleteMessage);

// End instant chat (requires auth)
router.post('/:chatId/end', authenticateToken, instantChatController.endInstantChat);

export default router;

