import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { UserModel } from '../database/schemas/user.schema';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const profilePictureController = {
  async uploadProfilePicture(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file provided' });
      }

      console.log('📸 Profile picture upload:', {
        userId,
        originalSize: (req.file.size / 1024).toFixed(2) + ' KB',
        mimeType: req.file.mimetype
      });

      // Validate file type
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ success: false, error: 'File must be an image' });
      }

      // Process and compress image
      let imageBuffer = req.file.buffer;
      const originalSizeKB = req.file.size / 1024;

      // Compress if larger than 200KB
      if (originalSizeKB > 200) {
        console.log('🔧 Compressing image from', originalSizeKB.toFixed(2), 'KB');
        
        imageBuffer = await sharp(req.file.buffer)
          .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();

        const compressedSizeKB = imageBuffer.length / 1024;
        console.log('✅ Compressed to', compressedSizeKB.toFixed(2), 'KB');
      }

      // Delete old profile picture if exists
      const user = await UserModel.findById(userId);
      if (user && user.profile.profilePicture?.type === 'upload' && user.profile.profilePicture.url) {
        const oldFilePath = path.join(process.cwd(), 'public', user.profile.profilePicture.url);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log('🗑️ Deleted old profile picture');
        }
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = '.jpg'; // Always save as JPEG
      const fileName = `${userId}_${timestamp}_${randomString}${fileExtension}`;
      
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      // Write file to disk
      fs.writeFileSync(filePath, imageBuffer);
      
      // Return relative URL
      const relativeUrl = `/uploads/profile-pictures/${fileName}`;
      
      console.log('✅ Profile picture uploaded:', relativeUrl);

      res.json({
        success: true,
        data: {
          url: relativeUrl
        }
      });
    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
    }
  },

  async deleteProfilePicture(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Delete file if it's an uploaded image
      if (user.profile.profilePicture?.type === 'upload' && user.profile.profilePicture.url) {
        const filePath = path.join(process.cwd(), 'public', user.profile.profilePicture.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Deleted profile picture file');
        }
      }

      // Update user profile to remove picture
      user.profile.profilePicture = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Profile picture deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error);
      res.status(500).json({ success: false, error: 'Failed to delete profile picture' });
    }
  }
};

