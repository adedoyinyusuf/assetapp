@echo off
REM NPC Asset Management System - Development Setup Script (Windows)
echo 🚀 Setting up NPC Asset Management System for development...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% LSS 18 (
    echo ❌ Node.js version 18+ is required. Current version: 
    node --version
    pause
    exit /b 1
)

echo ✅ Node.js version: 
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Copy environment file
if not exist .env (
    echo 🔧 Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit .env file with your database credentials
) else (
    echo ✅ .env file already exists
)

REM Generate Prisma client
echo 🗄️  Generating Prisma client...
npm run prisma:generate

REM Setup database
echo 🗄️  Setting up database...
npm run db:setup

REM Seed database (optional)
set /p SEED_DB="🌱 Would you like to seed the database with sample data? (y/n): "
if /i "%SEED_DB%"=="y" (
    echo 🌱 Seeding database...
    npm run prisma:seed
)

echo ✅ Setup complete!
echo.
echo 🚀 To start development server:
echo    npm run dev
echo.
echo 🧪 To run tests:
echo    npm test
echo.
echo 📊 To open Prisma Studio:
echo    npm run prisma:studio
echo.
echo 🔧 To lint and fix code:
echo    npm run lint:fix
echo.
pause
