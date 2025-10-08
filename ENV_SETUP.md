# Environment Variables Setup Guide

## Quick Start

Create these three files in your project root directory:

### 1. Create `.env.local`

```bash
# Copy and paste this into .env.local file

NODE_ENV=local
PORT=3001
DATABASE_URL=mongodb://localhost:27017/chat-app-local
JWT_SECRET=your-local-jwt-secret-key-change-this-in-production
# NEXT_PUBLIC_API_URL is optional - the app will auto-detect the correct API URL
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Create `.env.development`

```bash
# Copy and paste this into .env.development file

NODE_ENV=development
PORT=3001
DATABASE_URL=mongodb://localhost:27017/chat-app-dev
JWT_SECRET=your-dev-jwt-secret-key-change-this-in-production
# NEXT_PUBLIC_API_URL is optional - the app will auto-detect the correct API URL
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Create `.env.production`

```bash
# Copy and paste this into .env.production file

NODE_ENV=production
PORT=3001
DATABASE_URL=your-production-database-url
JWT_SECRET=your-production-jwt-secret-key-use-a-strong-random-key
NEXT_PUBLIC_API_URL=https://your-production-domain.com/api
```

## Using Different Environments

### For Local Development (default)
The app will automatically use `.env.local` when you run:
```bash
npm run dev
```

### For Development Environment
Set the NODE_ENV before running:
```bash
# On Windows (PowerShell)
$env:NODE_ENV="development"; npm run dev

# On macOS/Linux
NODE_ENV=development npm run dev
```

### For Production
```bash
# On Windows (PowerShell)
$env:NODE_ENV="production"; npm run build; npm run start

# On macOS/Linux
NODE_ENV=production npm run build && npm start
```

## Dynamic API URL Detection

The app now automatically detects the correct API URL based on how you're accessing it:

- **Localhost access** (`http://localhost:3000`) → API uses `http://localhost:3001/api`
- **Network access** (`http://192.168.1.10:3000`) → API uses `http://192.168.1.10:3001/api`

This means you can access the app from any device on your local network without manual configuration!

## Important Notes

1. **Never commit these files to Git** - They are already in `.gitignore`
2. **Change JWT_SECRET** in production to a strong, random string
3. **Update DATABASE_URL** with your actual database connection string
4. **NEXT_PUBLIC_API_URL is optional** - the app auto-detects the correct URL
5. **For production**, set `NEXT_PUBLIC_API_URL` to your actual domain

## Generating a Strong JWT Secret

Use one of these methods to generate a strong JWT secret:

### Method 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 2: OpenSSL
```bash
openssl rand -hex 64
```

### Method 3: Online Generator
Visit: https://www.grc.com/passwords.htm

Copy the generated string and use it as your JWT_SECRET.

