import * as nodemailer from 'nodemailer';
import { otpStorageService } from './otpStorage.service';

// Email template types
export enum EmailTemplate {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password_reset',
  FORGOT_PASSWORD = 'forgot_password',
  DAILY_UPDATE = 'daily_update',
  WELCOME = 'welcome',
  NOTIFICATION = 'notification',
}

// Email data interfaces
export interface VerificationEmailData {
  email: string;
  otp: string;
  username?: string;
}

export interface PasswordResetEmailData {
  email: string;
  otp: string;
  username?: string;
}

export interface WelcomeEmailData {
  email: string;
  username: string;
}

export interface DailyUpdateEmailData {
  email: string;
  username: string;
  updates: {
    newMessages: number;
    newFollowers: number;
    roomInvites: number;
  };
}

export interface NotificationEmailData {
  email: string;
  username: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

export type EmailData = 
  | VerificationEmailData 
  | PasswordResetEmailData 
  | WelcomeEmailData 
  | DailyUpdateEmailData 
  | NotificationEmailData;

export class EmailService {
  private transporter: nodemailer.Transporter;
  private isProduction: boolean;

  constructor() {
    // Configure transporter with SMTP settings
    // Supports Gmail, Hostinger, and other SMTP providers
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const isSecurePort = port === 465; // Port 465 requires SSL/TLS
    this.isProduction = process.env.NODE_ENV === 'production';
    
    const hasEmailConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
    
    // Log email configuration status (enhanced for debugging)
    console.log('📧 Email Service Configuration:');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Host: ${process.env.EMAIL_HOST || 'NOT SET'}`);
    console.log(`   Port: ${port} (${isSecurePort ? 'SSL' : 'STARTTLS'})`);
    console.log(`   User: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`   Password: ${process.env.EMAIL_PASSWORD ? `***SET*** (length: ${process.env.EMAIL_PASSWORD.length}, last 4: ***${process.env.EMAIL_PASSWORD.slice(-4)})` : 'NOT SET'}`);
    console.log(`   From: ${process.env.EMAIL_FROM || 'NOT SET'}`);
    
    // Debug: Show if password contains special characters
    if (process.env.EMAIL_PASSWORD) {
      const hasSpecialChars = /[^a-zA-Z0-9]/.test(process.env.EMAIL_PASSWORD);
      console.log(`   Password has special chars: ${hasSpecialChars ? 'YES' : 'NO'}`);
    }
    
    // In production, email configuration is REQUIRED
    if (this.isProduction && !hasEmailConfig) {
      console.error('❌ FATAL: Email configuration is required in production!');
      console.error('   Please set EMAIL_USER and EMAIL_PASSWORD in .env.production');
      throw new Error('Email configuration missing in production environment');
    }
    
    if (hasEmailConfig) {
      console.log(`   Status: ✅ CONFIGURED - Emails will be sent`);
    } else {
      console.log(`   Status: ⚠️  DEMO MODE (Local development - OTP shown in console)`);
    }
    
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: port,
      secure: isSecurePort, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Additional options for better compatibility
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Generic method to send any type of email
   */
  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    options?: {
      attachments?: any[];
      cc?: string;
      bcc?: string;
    }
  ): Promise<void> {
    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      if (this.isProduction) {
        throw new Error('Email configuration missing in production');
      }
      // In development, just log
      console.log(`📧 [DEMO MODE] Email to ${to}: ${subject}`);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"FlipyChat" <noreply@flipychat.com>',
      to,
      subject,
      html: htmlContent,
      ...options,
    };

    try {
      console.log(`📧 Sending email to ${to}: ${subject}...`);
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${to}`);
    } catch (error: any) {
      console.error('❌ Error sending email:', error.message || error);
      if (error.code) {
        console.error(`   Error Code: ${error.code}`);
      }
      if (error.response) {
        console.error(`   Response: ${error.response}`);
      }
      
      // In production, throw error - don't allow fallback
      if (this.isProduction) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      
      // In development, just log the error
      console.log(`   [DEV] Email send failed but continuing...`);
    }
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send verification email with OTP
   */
  async sendVerificationEmail(email: string, username?: string): Promise<string> {
    const otp = this.generateOTP();
    
    // Store OTP with 10-minute expiry
    otpStorageService.storeOTP(email, otp, 10);

    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        if (this.isProduction) {
          throw new Error('Email configuration missing in production');
        }
        // In development, use demo mode
        console.log(`📧 [DEMO MODE] Verification OTP for ${email}: ${otp}`);
        console.log(`   (Local development - email not sent)`);
        return otp;
      }

      const htmlContent = this.getVerificationEmailTemplate({ email, otp, username });
      await this.sendEmail(email, 'Verify Your Email - FlipyChat', htmlContent);
      
      // In development, also show OTP in console for convenience
      if (!this.isProduction) {
        console.log(`   [DEV] OTP: ${otp}`);
      }
      
      return otp;
    } catch (error: any) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // In production, throw error - don't allow fallback
      if (isProduction) {
        throw new Error(`Failed to send verification email: ${error.message}`);
      }
      
      // In development, show OTP as fallback
      console.log(`   [DEV FALLBACK] OTP for ${email}: ${otp}`);
      return otp;
    }
  }

  /**
   * Send password reset email with OTP
   */
  async sendPasswordResetEmail(email: string, username?: string): Promise<string> {
    const otp = this.generateOTP();
    
    // Store OTP with 10-minute expiry
    otpStorageService.storeOTP(email, otp, 10);

    try {
      // Check if email configuration is available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        if (this.isProduction) {
          throw new Error('Email configuration missing in production');
        }
        // In development, use demo mode
        console.log(`📧 [DEMO MODE] Password Reset OTP for ${email}: ${otp}`);
        console.log(`   (Local development - email not sent)`);
        return otp;
      }

      const htmlContent = this.getPasswordResetEmailTemplate({ email, otp, username });
      await this.sendEmail(email, 'Reset Your Password - FlipyChat', htmlContent);
      
      // In development, also show OTP in console for convenience
      if (!this.isProduction) {
        console.log(`   [DEV] OTP: ${otp}`);
      }
      
      return otp;
    } catch (error: any) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // In production, throw error - don't allow fallback
      if (isProduction) {
        throw new Error(`Failed to send password reset email: ${error.message}`);
      }
      
      // In development, show OTP as fallback
      console.log(`   [DEV FALLBACK] OTP for ${email}: ${otp}`);
      return otp;
    }
  }

  /**
   * Send welcome email (no OTP)
   */
  async sendWelcomeEmail(email: string, username: string): Promise<void> {
    const htmlContent = this.getWelcomeEmailTemplate({ email, username });
    await this.sendEmail(email, 'Welcome to FlipyChat! 🎉', htmlContent);
  }

  /**
   * Send daily update email
   */
  async sendDailyUpdateEmail(data: DailyUpdateEmailData): Promise<void> {
    const htmlContent = this.getDailyUpdateEmailTemplate(data);
    await this.sendEmail(data.email, 'Your Daily FlipyChat Update 📊', htmlContent);
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(data: NotificationEmailData): Promise<void> {
    const htmlContent = this.getNotificationEmailTemplate(data);
    await this.sendEmail(data.email, data.title, htmlContent);
  }

  // ==================== EMAIL TEMPLATES ====================

  /**
   * Get base email template wrapper with white background
   */
  private getBaseEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #ffffff;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                ${content}
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Get email header with logo
   */
  private getEmailHeader(title: string): string {
    return `
      <tr>
        <td style="padding: 30px; background-color: #ffffff; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e0e0e0;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center">
                <div style="display: inline-block; text-align: center;">
                  <!-- Logo -->
                  <div style="margin-bottom: 10px;">
                    <img src="https://flipychat.com/_next/image?url=%2Flogo-icon.png&w=32&q=75" alt="FlipyChat Logo" style="width: 60px; height: 60px; border-radius: 12px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                  </div>
                  <!-- Brand Name -->
                  <h1 style="margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">
                    FlipyChat
                  </h1>
                  ${title !== 'FlipyChat' ? `<p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;">${title}</p>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  /**
   * Get email footer with gradient
   */
  private getEmailFooter(): string {
    return `
      <tr>
        <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0 0 8px 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center">
                <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 14px; font-weight: 600;">
                  FlipyChat
                </p>
                <p style="margin: 0 0 10px 0; color: rgba(255,255,255,0.9); font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} FlipyChat. All rights reserved.
                </p>
                <p style="margin: 0 0 15px 0; color: rgba(255,255,255,0.8); font-size: 11px; text-align: center;">
                  This platform is for users 16 years and older.
                </p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                  <a href="https://flipychat.com" style="color: #ffffff; text-decoration: none; font-size: 12px; margin: 0 10px;">Home</a>
                  <span style="color: rgba(255,255,255,0.5);">•</span>
                  <a href="https://flipychat.com/privacy-policy" style="color: #ffffff; text-decoration: none; font-size: 12px; margin: 0 10px;">Privacy Policy</a>
                  <span style="color: rgba(255,255,255,0.5);">•</span>
                  <a href="https://flipychat.com/about" style="color: #ffffff; text-decoration: none; font-size: 12px; margin: 0 10px;">About</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  /**
   * Verification email template
   */
  private getVerificationEmailTemplate(data: VerificationEmailData): string {
    const content = `
      ${this.getEmailHeader('FlipyChat')}
      
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Verify Your Email</h2>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            ${data.username ? `Hi ${data.username}!` : 'Welcome to FlipyChat!'} To complete your registration, please use the verification code below:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
            <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${data.otp}
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
      
      ${this.getEmailFooter()}
    `;
    
    return this.getBaseEmailTemplate(content);
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(data: PasswordResetEmailData): string {
    const content = `
      ${this.getEmailHeader('FlipyChat')}
      
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Reset Your Password</h2>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            ${data.username ? `Hi ${data.username},` : 'Hello,'} We received a request to reset your password. Use the code below to proceed:
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
            <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${data.otp}
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
      
      ${this.getEmailFooter()}
    `;
    
    return this.getBaseEmailTemplate(content);
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(data: WelcomeEmailData): string {
    const content = `
      ${this.getEmailHeader('Welcome to FlipyChat! 🎉')}
      
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hi ${data.username}!</h2>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            We're excited to have you join FlipyChat! Get ready to chat with random strangers and make new connections.
          </p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
            <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 20px;">🚀 Get Started</h3>
            <ul style="margin: 0; padding-left: 20px; color: #ffffff; font-size: 14px; line-height: 1.8;">
              <li>Complete your profile to connect with more people</li>
              <li>Join random chats and meet strangers instantly</li>
              <li>Create or join chat rooms on topics you love</li>
              <li>Enable notifications to never miss a message</li>
            </ul>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.5;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </td>
      </tr>
      
      ${this.getEmailFooter()}
    `;
    
    return this.getBaseEmailTemplate(content);
  }

  /**
   * Daily update email template
   */
  private getDailyUpdateEmailTemplate(data: DailyUpdateEmailData): string {
    const { newMessages, newFollowers, roomInvites } = data.updates;
    const hasUpdates = newMessages > 0 || newFollowers > 0 || roomInvites > 0;
    
    const content = `
      ${this.getEmailHeader('Your Daily Update 📊')}
      
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Hi ${data.username}!</h2>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            ${hasUpdates ? "Here's what happened while you were away:" : "No new activity today, but there's always tomorrow!"}
          </p>
          
          ${hasUpdates ? `
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
            ${newMessages > 0 ? `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #667eea; font-size: 32px; font-weight: bold;">${newMessages}</p>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;">New Message${newMessages > 1 ? 's' : ''}</p>
            </div>
            ` : ''}
            
            ${newFollowers > 0 ? `
            <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #667eea; font-size: 32px; font-weight: bold;">${newFollowers}</p>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;">New Follower${newFollowers > 1 ? 's' : ''}</p>
            </div>
            ` : ''}
            
            ${roomInvites > 0 ? `
            <div>
              <p style="margin: 0; color: #667eea; font-size: 32px; font-weight: bold;">${roomInvites}</p>
              <p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;">Room Invite${roomInvites > 1 ? 's' : ''}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://flipychat.com/home" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
              Check Your Updates
            </a>
          </div>
          ` : ''}
        </td>
      </tr>
      
      ${this.getEmailFooter()}
    `;
    
    return this.getBaseEmailTemplate(content);
  }

  /**
   * Generic notification email template
   */
  private getNotificationEmailTemplate(data: NotificationEmailData): string {
    const content = `
      ${this.getEmailHeader('FlipyChat Notification')}
      
      <tr>
        <td style="padding: 40px 30px;">
          <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">${data.title}</h2>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            Hi ${data.username},
          </p>
          <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.5;">
            ${data.message}
          </p>
          
          ${data.actionUrl && data.actionText ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: bold;">
              ${data.actionText}
            </a>
          </div>
          ` : ''}
        </td>
      </tr>
      
      ${this.getEmailFooter()}
    `;
    
    return this.getBaseEmailTemplate(content);
  }
}

export const emailService = new EmailService();
