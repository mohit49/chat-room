@echo off
REM Chat App Setup Script for Windows
REM This script helps you set up the chat app for local development or VPS deployment

echo 🚀 Chat App Setup Script
echo ========================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Ask user for setup type
echo.
echo What type of setup do you want?
echo 1) Local development (localhost)
echo 2) VPS deployment (domain)
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo 🏠 Setting up for local development...
    npm run setup:local
    echo.
    echo ✅ Local development setup complete!
    echo.
    echo To start the app locally:
    echo   npm run dev:local
    echo.
    echo The app will be available at:
    echo   Frontend: http://localhost:3000
    echo   Backend: http://localhost:3001
) else if "%choice%"=="2" (
    echo 🌐 Setting up for VPS deployment...
    npm run setup:prod
    echo.
    echo ✅ VPS setup files created!
    echo.
    echo Next steps:
    echo 1. Edit .env.production with your domain settings
    echo 2. Build the app: npm run build
    echo 3. Start with domain: npm run start:domain
    echo.
    echo For detailed VPS deployment instructions, see VPS_DEPLOYMENT_GUIDE.md
) else (
    echo ❌ Invalid choice. Please run the script again and choose 1 or 2.
    pause
    exit /b 1
)

echo.
echo 🎉 Setup complete! Happy coding!
pause
