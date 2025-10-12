#!/bin/bash

# Production startup script for flipychat.com

echo "🚀 Starting Chat App for flipychat.com"

# Set production environment variables
export NODE_ENV=production
export DOMAIN=flipychat.com
export USE_HTTPS=true
export NEXT_PUBLIC_API_URL=https://flipychat.com/api
export FRONTEND_URL=https://flipychat.com
export BACKEND_URL=https://flipychat.com
export CORS_ORIGIN=https://flipychat.com
export DATABASE_URL=mongodb://localhost:27017/chat-app-prod
export JWT_SECRET=your-super-secure-production-secret-key-change-this

echo "📦 Building with production environment..."
npm run build:prod

echo "🌐 Starting production server..."
npm run start:domain
