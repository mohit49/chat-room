# Getting Started Guide

## 🚀 Quick Start

Follow these simple steps to get your chat app running:

### Step 1: Verify Environment Files

Make sure you have these three files in your root directory:
- ✅ `.env.local`
- ✅ `.env.development`
- ✅ `.env.production`

These should already be created. If not, refer to `ENV_SETUP.md`.

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Start the Application

Run this single command to start both the frontend and backend:

```bash
npm run dev
```

This will start:
- 🌐 **Frontend (Next.js)**: http://localhost:3000
- 🔧 **Backend (Express)**: http://localhost:3001

### Step 4: Open in Browser

Navigate to: **http://localhost:3000**

You should see the login page!

## 📱 Testing the App

### Login Process

1. **Enter Mobile Number**
   - Type any mobile number (e.g., `+1234567890`)
   - Click "Send OTP"

2. **Enter OTP**
   - In development mode, the mock OTP will be displayed (usually `123456`)
   - Enter the OTP and click "Verify & Login"

3. **You're In!**
   - You'll be redirected to your profile page

### Profile Management

1. **Update Personal Info**
   - Birth Date: Select your date of birth
   - Age: Enter your age
   - Gender: Select from Male, Female, or Other
   - Click "Update Profile"

2. **Update Location**
   - Click "Update Current Location"
   - Allow browser location access when prompted
   - Your coordinates will be displayed

## 🎨 UI Features

The app is built with Shadcn UI, featuring:
- 🎯 Modern, clean design
- 📱 Fully responsive
- 🌈 Beautiful gradient backgrounds
- ✨ Smooth animations
- 🎭 Professional form components

## 🔍 API Testing

You can test the backend API directly:

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Send OTP
```bash
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890", "otp": "123456"}'
```

## 🛠️ Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

**Option 1**: Stop the other application
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -ti:3000 | xargs kill
```

**Option 2**: Change the port in `.env.local`

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Restart TypeScript server in your IDE
# Or run type checking
npx tsc --noEmit
```

## 📁 Project Structure Overview

```
chat-app/
├── 🎨 Frontend (Next.js)
│   ├── app/
│   │   ├── login/        → Login page
│   │   └── profile/      → Profile management
│   ├── components/ui/    → Shadcn components
│   └── lib/              → Utilities & API client
│
└── 🔧 Backend (Express)
    └── server/
        ├── routes/       → API endpoints
        ├── middleware/   → Auth middleware
        └── utils/        → Storage & helpers
```

## 🎯 Next Steps

1. **Add Database**: Replace in-memory storage with MongoDB/PostgreSQL
2. **SMS Integration**: Integrate Twilio or similar for real OTP
3. **More Features**: Add chat functionality, user search, etc.
4. **Deploy**: Deploy to Vercel (frontend) and Railway/Heroku (backend)

## 🆘 Need Help?

- Check `README.md` for detailed documentation
- See `ENV_SETUP.md` for environment configuration
- Review the code comments for implementation details

## 🎉 Enjoy Building!

Your chat app is now ready for development. Happy coding! 🚀

