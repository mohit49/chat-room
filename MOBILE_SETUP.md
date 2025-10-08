# 📱 React Native Mobile App Setup

Your Chat App now supports **Android and iOS** using React Native with Expo!

## 🎯 What You Get

- ✅ **Native iOS App**
- ✅ **Native Android App**
- ✅ **Shared Backend** (same Express server)
- ✅ **Same Features** as web app
- ✅ **Modern Architecture** (matching web structure)
- ✅ **Native Performance**

---

## 📂 Project Structure

```
chat-app/
├── mobile/                      # React Native App (NEW)
│   ├── src/
│   │   ├── screens/            # Login, Profile screens
│   │   ├── navigation/         # React Navigation setup
│   │   ├── hooks/              # useAuth hook
│   │   ├── services/           # API, Storage, Location services
│   │   ├── types/              # Shared types
│   │   └── constants/          # App constants
│   ├── App.tsx                 # Root component
│   └── app.json                # Expo configuration
│
├── server/                      # Shared Backend (REUSED)
└── (web files...)              # Next.js Web App
```

---

## 🚀 Quick Start

### 1. Install Expo CLI (if not installed)

```bash
npm install -g expo-cli
```

### 2. Start the Backend Server

```bash
# In the root directory
npm run dev
```

This starts your Express backend on `http://localhost:3001`

### 3. Start the Mobile App

#### For Android Emulator:

```bash
cd mobile
npm run android
```

#### For iOS Simulator (macOS only):

```bash
cd mobile
npm run ios
```

#### For Physical Device:

```bash
cd mobile
npm start
```

Then scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app

---

## 📱 Testing Options

### Option 1: Android Emulator (Recommended for Windows)

1. **Install Android Studio**
2. **Setup AVD (Android Virtual Device)**
3. **Run:**
   ```bash
   cd mobile
   npm run android
   ```

### Option 2: iOS Simulator (macOS Only)

1. **Install Xcode**
2. **Run:**
   ```bash
   cd mobile
   npm run ios
   ```

### Option 3: Physical Device (Any OS)

1. **Install Expo Go** app on your phone
2. **Connect to same WiFi** as your computer
3. **Update API URL** in `mobile/src/constants/index.ts`:
   ```typescript
   export const API_BASE_URL = __DEV__
     ? 'http://YOUR_COMPUTER_IP:3001/api' // Replace with your IP
     : 'https://your-production-api.com/api';
   ```
4. **Run:**
   ```bash
   cd mobile
   npm start
   ```
5. **Scan QR code** with Expo Go (Android) or Camera (iOS)

---

## 🔧 Configuration

### Finding Your Computer's IP Address

#### Windows:
```bash
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

#### macOS/Linux:
```bash
ifconfig
# Look for inet address (e.g., 192.168.1.100)
```

### Update API URL for Physical Device

Edit `mobile/src/constants/index.ts`:

```typescript
export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:3001/api' // Your computer's IP
  : 'https://your-production-api.com/api';
```

---

## 📱 Features

### ✅ Implemented

- **Login with Mobile Number**
  - OTP authentication
  - Demo mode (123456)
  
- **Profile Management**
  - Update birth date
  - Update age
  - Select gender (Male/Female/Other)
  
- **Location Tracking**
  - Native geolocation
  - Permission handling
  - Reverse geocoding (address from coords)
  
- **Persistent Storage**
  - AsyncStorage for tokens
  - User data caching

### 🎨 UI/UX

- Modern, clean design
- Native components
- Platform-specific behavior
- Loading states
- Error handling
- Alert dialogs

---

## 🏗️ Architecture

### Same Pattern as Web App

```
Screens → Hooks → Services → Backend
   ↓        ↓        ↓
Navigation Types Constants
```

### Services

- **`api.service.ts`** - HTTP client (Axios)
- **`storage.service.ts`** - AsyncStorage wrapper
- **`location.service.ts`** - Expo Location wrapper

### Hooks

- **`useAuth`** - Authentication state & methods

### Navigation

- **React Navigation** (Native Stack Navigator)
- Login → Profile flow

---

## 🔐 Permissions

### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### iOS (`ios/Info.plist`)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to your location to update your profile.</string>
```

These are automatically configured in `app.json`.

---

## 📦 Dependencies

### Core

- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation library

### Features

- **@react-native-async-storage/async-storage** - Local storage
- **expo-location** - Geolocation
- **axios** - HTTP client
- **@react-native-picker/picker** - Platform-specific picker

---

## 🐛 Troubleshooting

### 1. Cannot Connect to Backend

**Problem**: Network request failed

**Solution**: Update API URL with your computer's IP

```typescript
// mobile/src/constants/index.ts
export const API_BASE_URL = 'http://YOUR_IP:3001/api';
```

### 2. Android Emulator Can't Reach localhost

**Problem**: Android emulator can't access `localhost:3001`

**Solution**: Use `10.0.2.2` instead

```typescript
export const API_BASE_URL = 'http://10.0.2.2:3001/api';
```

### 3. Location Permission Denied

**Problem**: Location services not working

**Solution**: 
- Check app permissions in phone settings
- Ensure location services are enabled
- Restart the app

### 4. Expo Go Not Connecting

**Problem**: Can't scan QR code

**Solution**:
- Ensure same WiFi network
- Check firewall settings
- Try `npm start -- --tunnel`

### 5. Build Errors

**Problem**: Module not found

**Solution**:
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
```

---

## 🎨 Customization

### Colors

Edit `mobile/src/constants/index.ts`:

```typescript
export const COLORS = {
  primary: '#3b82f6',    // Change to your brand color
  secondary: '#8b5cf6',
  // ...
};
```

### App Name & Icon

Edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "icon": "./assets/icon.png"
  }
}
```

---

## 📱 Building for Production

### Android APK

```bash
cd mobile
eas build --platform android
```

### iOS IPA (macOS only)

```bash
cd mobile
eas build --platform ios
```

### Setup EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
```

See [Expo EAS Build docs](https://docs.expo.dev/build/introduction/) for details.

---

## 🔄 Sharing Code Between Web & Mobile

### Currently Shared

- ✅ **Backend** - Same Express server
- ✅ **Types** - Same interfaces (copied)
- ✅ **Constants** - Same values (adapted for mobile)
- ✅ **API logic** - Same endpoints

### Platform-Specific

- ❌ **UI Components** - Different (Shadcn vs React Native)
- ❌ **Navigation** - Different (Next.js vs React Navigation)
- ❌ **Storage** - Different (localStorage vs AsyncStorage)
- ❌ **Routing** - Different (file-based vs navigator)

### Future: Monorepo Setup

For better code sharing, consider:

1. **Nx** or **Turborepo** for monorepo
2. **Shared packages** for types, constants, API client
3. **Platform adapters** for storage, navigation

---

## 📚 Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Location API](https://docs.expo.dev/versions/latest/sdk/location/)

---

## 🎯 Next Steps

### Recommended Enhancements

1. **Add Real OTP** - Integrate Twilio/AWS SNS
2. **Add Push Notifications** - Expo Notifications
3. **Add Chat Features** - Real-time messaging
4. **Add Image Upload** - Profile pictures
5. **Add Dark Mode** - Theme support
6. **Add Offline Mode** - Sync when online
7. **Add Analytics** - Track usage
8. **Add Crash Reporting** - Sentry/Bugsnag

### Performance Optimization

- Implement React Navigation animations
- Add image caching
- Optimize API calls
- Add loading skeletons

---

## ✅ Testing Checklist

- [ ] Login flow works
- [ ] OTP is received (or mock OTP displayed)
- [ ] Profile updates successfully
- [ ] Location permission requested
- [ ] Location updates successfully
- [ ] Logout works
- [ ] App persists login state
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] Keyboard dismisses properly

---

## 🎊 Success!

Your app now runs on:
- ✅ **Web** (Next.js)
- ✅ **Android** (React Native)
- ✅ **iOS** (React Native)

**All using the same backend! 🚀**

---

*Happy Mobile Development!* 📱


