import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { updateMobileNumberService } from '../services/updateMobile.service';

export const updateMobileController = {
  async updateMobileNumber(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      const { newMobileNumber, otp } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      if (!newMobileNumber || !otp) {
        return res.status(400).json({
          success: false,
          error: 'Mobile number and OTP are required'
        });
      }

      // Validate mobile number format (10 digits)
      if (!/^\d{10}$/.test(newMobileNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mobile number format'
        });
      }

      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP format'
        });
      }

      const result = await updateMobileNumberService(userId, newMobileNumber, otp);

      if (result.success) {
        return res.json({
          success: true,
          message: 'Mobile number updated successfully',
          user: result.user
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.error || 'Failed to update mobile number'
        });
      }
    } catch (error: any) {
      console.error('Error updating mobile number:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  }
};


