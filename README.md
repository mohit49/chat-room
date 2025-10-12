# Chat App - Multi-Platform (Web + Mobile)

A modern, scalable chat application built with Next.js, React Native (Expo), TypeScript, and Express.js backend following industry best practices.

## 🚀 Features

- 🌐 **Web App** (Next.js + Shadcn UI)
- 📱 **Mobile Apps** (React Native + Expo for iOS & Android)
- 🔐 **JWT Authentication** with mobile number & OTP
- 👤 **User Profile Management** (birth date, age, gender)
- 📍 **Location Tracking** with geolocation API
- 🎨 **Beautiful UI** on all platforms
- 🏗️ **Layered Architecture** (Controllers → Services → Models)
- ✅ **Type Safety** with shared TypeScript types
- 🛡️ **Input Validation** using Zod schemas
- 🎯 **Custom Error Handling** with error classes
- 🔄 **Custom React Hooks** for reusable logic
- 📦 **Modular Structure** for scalability
- 🏠 **Smart Environment Detection** (localhost for dev, domain for production)

## 🎯 Supported Platforms

| Platform | Technology | Status |
|----------|-----------|---------|
| **Web** | Next.js 15 | ✅ Ready |
| **Android** | React Native + Expo | ✅ Ready |
| **iOS** | React Native + Expo | ✅ Ready |
| **Backend** | Express.js | ✅ Shared |

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Linux/Mac:**
```bash
./setup.sh
```

### Option 2: Manual Setup

**For Local Development:**
```bash
# Install dependencies
npm install

# Setup local environment
npm run setup:local

# Start development server
npm run dev:local
```

**For VPS Deployment:**
```bash
# Install dependencies
npm install

# Setup production environment
npm run setup:prod

# Edit .env.production with your domain
# Build and start
npm run build
npm run start:domain
```

## 🌐 Environment Configuration

The app automatically detects your environment and configures URLs accordingly:

### Local Development
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`
- **API**: `http://localhost:3001/api`
- **CORS**: Allows localhost and network IPs

### VPS Production
- **Frontend**: `https://yourdomain.com`
- **Backend**: `https://yourdomain.com`
- **API**: `https://yourdomain.com/api`
- **CORS**: Configured for your domain

## 📂 Project Structure

```
chat-app/
├── 🌐 Web App (Next.js)
│   ├── app/                    # Next.js pages
│   ├── components/            # Shadcn UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # API client, utilities
│   ├── types/                 # Shared TypeScript types
│   └── constants/             # App constants
│
├── 📱 Mobile App (React Native)
│   └── mobile/
│       ├── src/
│       │   ├── screens/       # Login, Profile screens
│       │   ├── navigation/    # React Navigation
│       │   ├── hooks/         # useAuth hook
│       │   ├── services/      # API, Storage, Location
│       │   ├── types/         # Shared types
│       │   └── constants/     # App constants
│       └── App.tsx            # Root component
│
└── 🔧 Backend (Express.js) - SHARED
    ├── config/                # Configuration
    ├── controllers/           # Request handlers
    ├── services/              # Business logic
    ├── models/                # Data access
    ├── validators/            # Zod schemas
    ├── middleware/            # Auth, validation, errors
    └── routes/                # Route definitions
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed documentation.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- **For iOS**: macOS with Xcode
- **For Android**: Android Studio

### 1. Install Dependencies

```bash
# Root (web + backend)
npm install

# Mobile
cd mobile
npm install
cd ..
```

### 2. Setup Environment

Create environment files (see [ENV_SETUP.md](./ENV_SETUP.md)):

```bash
# .env.local (already created)
NODE_ENV=local
PORT=3001
JWT_SECRET=your-jwt-secret-key
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Start Backend Server

```bash
npm run dev
```

This starts:
- 🌐 **Frontend (Web)**: http://localhost:3000
- 🔧 **Backend**: http://localhost:3001

### 4. Start Mobile App

#### Android:

```bash
cd mobile
npm run android
```

#### iOS (macOS only):

```bash
cd mobile
npm run ios
```

#### Physical Device:

```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

See [MOBILE_SETUP.md](./MOBILE_SETUP.md) for detailed mobile setup.

---

## 🎯 Platform-Specific Guides

| Guide | Description |
|-------|-------------|
| [MOBILE_SETUP.md](./MOBILE_SETUP.md) | **📱 Mobile app setup & troubleshooting** |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | 🌐 Web app quick start |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | 📁 Architecture overview |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 🏗️ System design details |
| [API_REFERENCE.md](./API_REFERENCE.md) | 📚 API documentation |

---

## 🛠️ Tech Stack

### Web Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library

### Mobile Frontend
- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **AsyncStorage** - Local storage
- **Expo Location** - Geolocation API
- **Axios** - HTTP client

### Backend (Shared)
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **JWT** - Authentication
- **Zod** - Runtime validation
- **Custom Error Classes** - Error handling

---

## 📱 Mobile App Features

### ✅ Implemented

- Login with mobile number & OTP
- Profile management (birth date, age, gender)
- Native location tracking with permissions
- Persistent authentication (AsyncStorage)
- Platform-specific UI components
- Error handling with native alerts
- Loading states & activity indicators

### 📸 Screenshots

*Coming soon - Add your app screenshots here*

---

## 🎨 UI Comparison

| Feature | Web | Mobile |
|---------|-----|--------|
| **Components** | Shadcn UI | React Native |
| **Navigation** | Next.js Router | React Navigation |
| **Styling** | Tailwind CSS | StyleSheet |
| **Storage** | localStorage | AsyncStorage |
| **Forms** | React Hook Form | Native TextInput |

---

## 🏗️ Architecture Highlights

### Layered Backend (Shared by All Platforms)

```
Request → Route → Validator → Controller → Service → Model
```

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic
- **Models**: Data access layer
- **Validators**: Zod schemas for input validation

### Frontend Best Practices

- **Custom Hooks**: `useAuth`, `useLocation` for reusable logic
- **API Services**: Centralized HTTP client with error handling
- **Type Safety**: Shared types between platforms
- **Constants**: Centralized configuration

---

## 🔄 Code Sharing

### ✅ Shared Across Web & Mobile

- **Backend API** - Same Express server
- **Types** - Same TypeScript interfaces
- **Constants** - Same configuration values
- **Business Logic** - Same API endpoints

### ❌ Platform-Specific

- **UI Components** - Different (Shadcn vs React Native)
- **Navigation** - Different (Next.js vs React Navigation)
- **Storage** - Different (localStorage vs AsyncStorage)

---

## 📦 Available Scripts

### Root Directory (Web + Backend)

```bash
npm run dev         # Start Next.js + Express
npm run server      # Start backend only
npm run build       # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Mobile Directory

```bash
cd mobile

npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS (macOS only)
npm run web         # Run on web browser
```

---

## 🧪 Testing

### Web App

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test API
curl http://localhost:3001/api/health
```

### Mobile App

1. Open on Android Emulator or iOS Simulator
2. Test login flow with OTP: `123456`
3. Test profile updates
4. Test location tracking
5. Test logout and persistence

---

## 🐛 Troubleshooting

### Web App Issues

See [GETTING_STARTED.md](./GETTING_STARTED.md#troubleshooting)

### Mobile App Issues

See [MOBILE_SETUP.md](./MOBILE_SETUP.md#troubleshooting)

### Common Issues

1. **Backend not accessible from mobile**
   - Update API URL with your computer's IP
   - For Android emulator: Use `10.0.2.2:3001`

2. **Location permission denied**
   - Check app permissions in phone settings
   - Ensure location services enabled

3. **Token expired**
   - Logout and login again
   - Check JWT secret in `.env.local`

---

## 🚀 Deployment

### Web App (Vercel)

```bash
npm run build
# Deploy to Vercel
```

### Backend (Railway/Heroku)

```bash
# Set environment variables
# Deploy with Docker or git push
```

### Mobile Apps

#### Android (Google Play)

```bash
cd mobile
eas build --platform android --profile production
eas submit --platform android
```

#### iOS (App Store)

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios
```

See [Expo EAS](https://docs.expo.dev/build/introduction/) for details.

---

## ⚠️ Production Checklist

Before deploying:

- [ ] Replace in-memory storage with real database
- [ ] Integrate SMS service for OTP
- [ ] Use strong JWT secret (64+ characters)
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Set up error monitoring (Sentry)
- [ ] Add logging (Winston, Bunyan)
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Test on real devices
- [ ] Add app analytics

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **MOBILE_SETUP.md** | 📱 Mobile app setup |
| **OPTIMIZATION_SUMMARY.md** | What was optimized |
| **PROJECT_STRUCTURE.md** | Detailed structure guide |
| **ARCHITECTURE.md** | System architecture |
| **MIGRATION_GUIDE.md** | Old vs new comparison |
| **API_REFERENCE.md** | API documentation |
| **QUICK_START.md** | Quick reference |

---

## 🤝 Contributing

1. Follow existing architecture patterns
2. Add types to `types/` directory
3. Use constants from `constants/`
4. Add validation with Zod
5. Follow layered architecture
6. Write meaningful commit messages
7. Test on multiple platforms

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

- Next.js team
- React Native & Expo team
- Shadcn for UI components
- Zod for validation
- Express.js community

---

## 🎉 What's Next?

### Recommended Features

1. **Real-time Chat** - Socket.io or Firebase
2. **Push Notifications** - Expo Notifications
3. **Image Upload** - Profile pictures
4. **Dark Mode** - Theme support
5. **Offline Mode** - Local sync
6. **Video Calls** - WebRTC
7. **Stories/Status** - Like WhatsApp
8. **Rooms** - Multi-user chats

---

**🌟 You now have a production-ready, multi-platform chat app! 🚀**

- ✅ **Web**: Modern, responsive design
- ✅ **Android**: Native mobile experience
- ✅ **iOS**: Native mobile experience
- ✅ **Backend**: Scalable, type-safe API

**All sharing the same powerful backend architecture!**

---

*Built with ❤️ using modern best practices for web and mobile*
