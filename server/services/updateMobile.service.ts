import { userModelDB } from '../models/user.model';
import { otpStorageService } from './otpStorage.service';
import { ApiResponse } from '../../types';

export const updateMobileNumberService = async (
  userId: string,
  newMobileNumber: string,
  otp: string
): Promise<ApiResponse> => {
  try {
    // Verify OTP using shared OTP storage
    if (!otpStorageService.verifyOTP(newMobileNumber, otp)) {
      return {
        success: false,
        error: 'Invalid or expired OTP. Please request a new OTP.'
      };
    }

    // Check if mobile number is already in use by another user
    const existingUser = await userModelDB.findByMobileNumber(newMobileNumber);
    if (existingUser && existingUser.id !== userId) {
      return {
        success: false,
        error: 'This mobile number is already registered to another account'
      };
    }

    // Update mobile number
    const user = await userModelDB.updateUserMobileNumber(userId, newMobileNumber);

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // OTP is automatically cleared after verification in otpStorageService

    return {
      success: true,
      message: 'Mobile number updated successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          mobileNumber: user.mobileNumber,
          profile: user.profile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    };
  } catch (error: any) {
    console.error('Error in updateMobileNumberService:', error);
    return {
      success: false,
      error: error.message || 'Failed to update mobile number'
    };
  }
};

// Helper function to access OTP store (needed for OTP generation)
export const getOTPStore = () => otpStorageService;

