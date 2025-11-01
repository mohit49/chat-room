# Testing Email Authentication System

## Quick Start Testing Guide

### Step 1: Start the Application

```bash
npm run dev
```

The application will start in development mode:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- OTPs will be displayed in console and UI

### Step 2: Test Registration

1. Navigate to http://localhost:3000/login
2. Click the "Register" tab
3. Fill in the form:
   - **Email:** test@example.com
   - **Username:** testuser
   - **Password:** Password123 (must have uppercase, lowercase, number, 8+ chars)
4. Click "Create Account"
5. You should see:
   - "Registration Successful" toast
   - Green box with 6-digit OTP displayed
   - Automatically logged in

### Step 3: Verify Email

#### Option A: From Home Page Banner
1. You'll be redirected to /home
2. Yellow verification banner appears at top
3. Click "Enter Code"
4. Enter the 6-digit OTP (or click "Fill OTP" if shown)
5. Click "Verify"
6. Banner disappears
7. Email verified!

#### Option B: Resend OTP
1. Click "Resend Code" in the banner
2. New OTP will be displayed
3. Enter new OTP and verify

### Step 4: Test Login

1. Logout (profile menu → Logout)
2. Navigate to /login
3. Click "Login" tab
4. Enter:
   - **Email:** test@example.com
   - **Password:** Password123
5. Click "Login"
6. Successfully logged in!

### Step 5: Test Unverified User Experience

1. Register a second user without verifying email
2. After login, yellow banner appears
3. Features may be restricted (depending on implementation)
4. Verify email to remove banner

## Development Mode Features

### OTP Display
- OTPs are logged to server console
- OTPs are displayed in the UI after registration
- No actual emails sent (unless EMAIL_USER configured)

### Console Output Examples

**Registration:**
```
[DEV] Verification OTP for test@example.com: 123456
🔐 Registration successful: testuser
```

**Login:**
```
🔐 Login successful: testuser
```

**Email Verification:**
```
🔐 Email verified successfully
```

## Common Test Scenarios

### Scenario 1: New User Full Flow
1. Register → See OTP → Login automatically → See banner → Verify email → Banner gone

### Scenario 2: Login Before Verification
1. Register → Don't verify → Logout → Login → See banner → Verify → Banner gone

### Scenario 3: Duplicate Email
1. Register with test@example.com
2. Try to register again with same email
3. Should see "Email already registered" error

### Scenario 4: Duplicate Username
1. Register with username "testuser"
2. Try to register another account with same username
3. Should see "Username already taken" error

### Scenario 5: Weak Password
1. Try to register with password "weak"
2. Should see validation error
3. Password must have uppercase, lowercase, number, 8+ characters

### Scenario 6: Invalid OTP
1. Register
2. Try to verify with wrong OTP (e.g., 000000)
3. Should see "Invalid or expired OTP" error

### Scenario 7: Expired OTP
1. Register
2. Wait 11 minutes
3. Try to verify with original OTP
4. Should see "Invalid or expired OTP" error
5. Click "Resend Code" to get new OTP

## Verification Status API Test

### Using curl or Postman

**Get Verification Status:**
```bash
curl -X GET http://localhost:3001/api/auth/verification-status \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "emailVerified": false,
  "email": "test@example.com"
}
```

## Email Service Testing (Production Mode)

### Setup Gmail for Testing

1. **Enable 2FA on Gmail:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other"
   - Name it "FlipyChat Dev"
   - Copy the 16-character password

3. **Update local.env:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your app password (remove spaces)
EMAIL_FROM="FlipyChat" <noreply@flipychat.com>
```

4. **Restart Server:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

5. **Test Registration:**
   - Register with a real email address
   - Check your inbox for verification email
   - Email should have FlipyChat branding and OTP
   - Use OTP to verify

## Troubleshooting

### No OTP Displayed
- Check server console for OTP
- Verify EMAIL_USER and EMAIL_PASSWORD are empty (for dev mode)
- OTP should be in registration API response

### Email Not Received
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Check server console for email sending errors
- Verify Gmail app password is correct (16 chars, no spaces)

### "Invalid email or password" Error
- Verify email is correct (case-insensitive)
- Verify password matches exactly (case-sensitive)
- Check if user exists in database

### Banner Not Appearing
- Verify user.emailVerified is false
- Check browser console for errors
- Refresh the page

### Verification Not Working
- Check OTP is correct (6 digits)
- OTP expires after 10 minutes
- Click "Resend Code" for new OTP
- Check server logs for errors

## Expected Behavior Checklist

- [x] Can register with email/password/username
- [x] OTP displayed in development mode
- [x] Automatically logged in after registration
- [x] Verification banner appears for unverified users
- [x] Can verify email with OTP
- [x] Banner disappears after verification
- [x] Can resend verification email
- [x] Can login with email/password
- [x] Email shown in profile and header
- [x] Username is required and unique
- [x] Password requirements enforced
- [x] Invalid credentials rejected
- [x] Duplicate email/username rejected

## Sample Test Users

After testing, you should have created:

```
Email: test@example.com
Username: testuser
Password: Password123
Status: Verified

Email: user2@example.com  
Username: seconduser
Password: SecurePass123
Status: Unverified (to test banner)
```

## Next Steps After Testing

1. Configure production email service
2. Update password requirements if needed
3. Add "Forgot Password" feature (uses same OTP system)
4. Add email change functionality (with verification)
5. Add account deletion with email confirmation
6. Consider adding social login (Google, Facebook)

## Support

If you encounter any issues:
1. Check `EMAIL_AUTH_GUIDE.md` for detailed documentation
2. Check server console for error messages
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
5. Try clearing browser cache and cookies

