@echo off
REM Enhanced NPC Asset Management System Startup Script (Windows)
echo 🚀 Starting NPC Asset Management System with all enhanced features...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if PostgreSQL is running
echo 🔍 Checking PostgreSQL connection...
pg_isready -q
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not running. Starting Docker services...
    docker-compose up -d postgres redis
    timeout /t 10 /nobreak >nul
)

REM Check if Redis is running
echo 🔍 Checking Redis connection...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Redis is not running. Starting Redis...
    docker-compose up -d redis
    timeout /t 5 /nobreak >nul
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run prisma:generate

REM Start WebSocket server in background
echo 🌐 Starting WebSocket server...
start "WebSocket Server" cmd /k "node server/websocket-server.js"

REM Wait for WebSocket server to start
timeout /t 3 /nobreak >nul

REM Start Next.js development server
echo 🚀 Starting Next.js development server...
npm run dev

REM Cleanup on exit
echo 🧹 Cleaning up...
taskkill /f /im node.exe >nul 2>&1
echo ✅ All services stopped.
pause
