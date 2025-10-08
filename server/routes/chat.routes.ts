import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { chatController } from '../controllers/chat.controller';
import { chatValidator } from '../validators/chat.validator';

const router = express.Router();

// Get room messages
router.get('/messages/:roomId', 
  authenticateToken,
  chatController.getRoomMessages
);

// Send message
router.post('/send',
  authenticateToken,
  validate(chatValidator.sendMessage),
  chatController.sendMessage
);

// Upload chat image
router.post('/upload-image',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('image')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  chatController.uploadImage
);

export default router;
