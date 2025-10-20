import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { profilePictureController } from '../controllers/profilePicture.controller';

const router = express.Router();

// Upload profile picture
router.post('/upload',
  authenticateToken,
  (req, res, next) => {
    if (req.upload) {
      req.upload.single('profilePicture')(req, res, next);
    } else {
      res.status(500).json({ success: false, error: 'Upload middleware not configured' });
    }
  },
  profilePictureController.uploadProfilePicture
);

// Delete profile picture
router.delete('/delete',
  authenticateToken,
  profilePictureController.deleteProfilePicture
);

export default router;

