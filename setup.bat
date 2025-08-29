@echo off
echo Starting project setup...

:: Remove existing node_modules and package-lock.json
if exist node_modules (
    echo Removing existing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

:: Clear npm cache
echo Cleaning npm cache...
npm cache clean --force

:: Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b %ERRORLEVEL%
)

:: Generate Prisma client
echo Generating Prisma client...
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to generate Prisma client
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Setup complete! You can now start the development server with:
echo   npm run dev

pause
