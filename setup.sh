#!/bin/bash

# Chat App Setup Script
# This script helps you set up the chat app for local development or VPS deployment

echo "🚀 Chat App Setup Script"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Ask user for setup type
echo ""
echo "What type of setup do you want?"
echo "1) Local development (localhost)"
echo "2) VPS deployment (domain)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo "🏠 Setting up for local development..."
        npm run setup:local
        echo ""
        echo "✅ Local development setup complete!"
        echo ""
        echo "To start the app locally:"
        echo "  npm run dev:local"
        echo ""
        echo "The app will be available at:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend: http://localhost:3001"
        ;;
    2)
        echo "🌐 Setting up for VPS deployment..."
        npm run setup:prod
        echo ""
        echo "✅ VPS setup files created!"
        echo ""
        echo "Next steps:"
        echo "1. Edit .env.production with your domain settings"
        echo "2. Build the app: npm run build"
        echo "3. Start with domain: npm run start:domain"
        echo ""
        echo "For detailed VPS deployment instructions, see VPS_DEPLOYMENT_GUIDE.md"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete! Happy coding!"
