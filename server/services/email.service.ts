import * as nodemailer from 'nodemailer';
import { otpStorageService } from './otpStorage.service';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure transporter with SMTP settings
    // Supports Gmail, Hostinger, and other SMTP providers
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const isSecurePort = port === 465; // Port 465 requires SSL/TLS
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: port,
      secure: isSecurePort, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password
      },
      // Additional options for better compatibility
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Send verification email with OTP
   */
  async sendVerificationEmail(email: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiry
    otpStorageService.storeOTP(email, otp, 10);

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"FlipyChat" <noreply@flipychat.com>',
      to: email,
      subject: 'Verify Your Email - FlipyChat',
      html: this.getVerificationEmailTemplate(otp),
    };

    try {
      // In development without email configuration, just return OTP
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log(`[DEV] Verification OTP for ${email}: ${otp}`);
        return otp; // Return OTP for development
      }

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return otp; // Return OTP for development display
    } catch (error) {
      console.error('Error sending verification email:', error);
      // In development, still return OTP even if email fails
      return otp;
    }
  }

  /**
   * Send password reset email with OTP
   */
  async sendPasswordResetEmail(email: string): Promise<string> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 10-minute expiry
    otpStorageService.storeOTP(email, otp, 10);

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"FlipyChat" <noreply@flipychat.com>',
      to: email,
      subject: 'Reset Your Password - FlipyChat',
      html: this.getPasswordResetEmailTemplate(otp),
    };

    try {
      // In development without email configuration, just return OTP
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log(`[DEV] Password Reset OTP for ${email}: ${otp}`);
        return otp;
      }

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
      return otp;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return otp;
    }
  }

  /**
   * Email template for verification
   */
  private getVerificationEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">FlipyChat</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                      Welcome to FlipyChat! To complete your registration, please use the verification code below:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                      <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      This code will expire in <strong>10 minutes</strong>.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      If you didn't create an account with FlipyChat, please ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} FlipyChat. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                      This platform is for users 16 years and older.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Email template for password reset
   */
  private getPasswordResetEmailTemplate(otp: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">FlipyChat</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
                      We received a request to reset your password. Use the code below to proceed:
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                      <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        ${otp}
                      </p>
                    </div>
                    
                    <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      This code will expire in <strong>10 minutes</strong>.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
                      If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} FlipyChat. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                      This platform is for users 16 years and older.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();

