# Email Authentication System Guide

## Overview

FlipyChat now uses email/password authentication instead of mobile OTP. This guide explains the new authentication system, email verification, and setup instructions.

## Features

- **Email/Password Authentication** - Secure login with bcrypt password hashing
- **Email Verification** - OTP sent via email for verification
- **Required Username** - All users must have a unique username
- **Verification Banner** - Unverified users see a banner on the home page
- **Development Mode** - OTP displayed in console/UI when email service not configured

## Authentication Flow

### Registration
1. User provides email, password, and username
2. Password is hashed with bcrypt (10 rounds)
3. User account is created with `emailVerified: false`
4. Verification email with 6-digit OTP is sent
5. User receives JWT token and can login
6. OTP is displayed in development mode

### Login
1. User provides email and password
2. Password is verified against hashed password in database
3. JWT token is issued
4. User can login even if email is not verified
5. Unverified users see verification banner on home page

### Email Verification
1. User clicks "Enter Code" in verification banner
2. Enters 6-digit OTP from email
3. OTP is validated (10-minute expiry)
4. `emailVerified` status is set to `true`
5. Banner disappears and full access is granted

## Email Service Configuration

### Development Mode (No Email Service)

When `EMAIL_USER` and `EMAIL_PASSWORD` are not set:
- OTPs are logged to console
- OTPs are displayed in the UI for testing
- No actual emails are sent

### Production Mode (Gmail SMTP)

1. **Create App-Specific Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Create an app password for "FlipyChat"
   - Copy the 16-character password

2. **Update `.env` or `local.env`:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM="FlipyChat" <noreply@flipychat.com>
```

3. **Restart Server:**
```bash
npm run dev
```

### Alternative Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM="FlipyChat" <noreply@flipychat.com>
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
EMAIL_FROM="FlipyChat" <noreply@flipychat.com>
```

## API Endpoints

### Register
```
POST /api/auth/register
Body: { email, password, username }
Response: { success, user, token, verificationOTP }
```

### Login
```
POST /api/auth/login
Body: { email, password }
Response: { success, user, token }
```

### Verify Email
```
POST /api/auth/verify-email
Body: { email, otp }
Response: { success, user }
```

### Resend Verification Email
```
POST /api/auth/resend-verification
Body: { email }
Response: { success, verificationOTP }
```

### Get Verification Status
```
GET /api/auth/verification-status
Headers: { Authorization: Bearer <token> }
Response: { success, emailVerified, email }
```

## Frontend Usage

### Using Auth Context

```tsx
import { useAuth } from '@/lib/contexts/AuthContext';

function MyComponent() {
  const {
    user,
    emailVerified,
    register,
    login,
    verifyEmail,
    resendVerification,
  } = useAuth();

  // Register
  const handleRegister = async () => {
    const result = await register('user@example.com', 'Password123', 'johndoe');
    if (result.success) {
      console.log('OTP:', result.verificationOTP); // Development only
    }
  };

  // Login
  const handleLogin = async () => {
    const success = await login('user@example.com', 'Password123');
    if (success) {
      console.log('Logged in!');
    }
  };

  // Verify Email
  const handleVerify = async () => {
    const success = await verifyEmail('user@example.com', '123456');
    if (success) {
      console.log('Email verified!');
    }
  };

  return (
    <div>
      {!emailVerified && <EmailVerificationBanner />}
      {/* Your content */}
    </div>
  );
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Username Requirements
- 3-20 characters
- Must start with letter or number
- Alphanumeric + special characters allowed
- No spaces
- Unique across platform

### Email Requirements
- Valid email format
- Unique across platform
- Case-insensitive

### Password Hashing
- bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Passwords never returned in API responses
- Password field excluded from queries by default

## Migration from Mobile OTP

### Breaking Changes
- `mobileNumber` field replaced with `email` field
- `username` is now required (was optional)
- `emailVerified` field added
- OTP now sent via email instead of SMS
- All existing users cleared from database

### Updated Fields

**User Model:**
```typescript
interface User {
  id: string;
  email: string;              // NEW - replaced mobileNumber
  username: string;           // Now required
  password?: string;          // NEW - hashed password
  emailVerified: boolean;     // NEW - verification status
  profile: UserProfile;
  lastSeen?: Date;
  onlineStatus?: OnlineStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

## Troubleshooting

### "Email already registered" Error
- Email addresses are unique
- Try a different email or use "Forgot Password" feature

### "Username already taken" Error
- Usernames are unique
- Try a different username

### "Invalid or expired OTP" Error
- OTPs expire after 10 minutes
- Click "Resend Code" to get a new OTP

### Emails Not Sending
1. Check environment variables are set correctly
2. Verify Gmail app-specific password is correct
3. Check console for OTP in development mode
4. Ensure EMAIL_HOST and EMAIL_PORT are correct

### Password Requirements Not Met
- Password must be at least 8 characters
- Include at least 1 uppercase, 1 lowercase, and 1 number
- Example: `Password123`

## Development Tips

### Testing Without Email Service

1. Leave `EMAIL_USER` and `EMAIL_PASSWORD` empty
2. OTPs will be logged to console
3. OTPs will be displayed in UI after registration
4. Copy and paste OTP to verify

### Testing With Email Service

1. Set up Gmail app-specific password
2. Update environment variables
3. Restart server
4. Register with a real email address
5. Check inbox for verification email

## Files Modified

### Backend
- `types/index.ts` - Updated User interface
- `server/database/schemas/user.schema.ts` - Email, password, emailVerified fields
- `server/services/email.service.ts` - NEW - Email service with Nodemailer
- `server/services/auth.service.ts` - Register, login, verify methods
- `server/controllers/auth.controller.ts` - New endpoints
- `server/validators/auth.validator.ts` - Email/password validation
- `server/routes/auth.routes.ts` - Updated routes
- `server/models/user.model.ts` - Email-based user lookup
- `server/models/storage.model.ts` - Updated storage methods

### Frontend
- `app/login/page.tsx` - Complete redesign with tabs
- `components/auth/EmailVerificationBanner.tsx` - NEW - Verification banner
- `app/home/page.tsx` - Added verification banner
- `app/profile/page.tsx` - Show email instead of mobile
- `lib/api/index.ts` - Updated API methods
- `lib/contexts/AuthContext.tsx` - Email auth methods
- `constants/index.ts` - Updated API endpoints

### Configuration
- `local.env` - Added email service config
- `env.example` - Added email service config

## Next Steps

1. Set up email service credentials
2. Test registration flow
3. Test email verification
4. Test login flow
5. Verify banner appears for unverified users
6. Test all features with verified account

