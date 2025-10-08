// Shared OTP storage service
// In production, use Redis or similar

class OTPStorageService {
  private otpStorage = new Map<string, { otp: string; expiry: number }>();

  // Store OTP with expiry
  storeOTP(mobileNumber: string, otp: string, expiryMinutes: number = 5): void {
    const expiry = Date.now() + expiryMinutes * 60 * 1000;
    this.otpStorage.set(mobileNumber, { otp, expiry });
    this.cleanupExpiredOTPs();
  }

  // Get OTP for mobile number
  getOTP(mobileNumber: string): { otp: string; expiry: number } | null {
    const data = this.otpStorage.get(mobileNumber);
    if (!data) return null;

    // Check if expired
    if (Date.now() > data.expiry) {
      this.otpStorage.delete(mobileNumber);
      return null;
    }

    return data;
  }

  // Verify OTP
  verifyOTP(mobileNumber: string, otp: string): boolean {
    const data = this.getOTP(mobileNumber);
    if (!data) return false;

    const isValid = data.otp === otp;
    if (isValid) {
      // Remove OTP after successful verification
      this.otpStorage.delete(mobileNumber);
    }
    return isValid;
  }

  // Remove OTP
  removeOTP(mobileNumber: string): void {
    this.otpStorage.delete(mobileNumber);
  }

  // Clean up expired OTPs
  private cleanupExpiredOTPs(): void {
    const now = Date.now();
    for (const [mobileNumber, data] of this.otpStorage.entries()) {
      if (now > data.expiry) {
        this.otpStorage.delete(mobileNumber);
      }
    }
  }

  // Get all stored OTPs (for debugging)
  getAllOTPs(): Map<string, { otp: string; expiry: number }> {
    return new Map(this.otpStorage);
  }
}

// Export singleton instance
export const otpStorageService = new OTPStorageService();

