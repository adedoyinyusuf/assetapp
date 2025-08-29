@echo off
echo Starting Next.js development server...
cd /d %~dp0fresh-nextjs

:: Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo Starting development server...
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to start development server
    echo.
    echo Try these steps manually:
    echo 1. Open Command Prompt as Administrator
    echo 2. Run: cd /d "%~dp0fresh-nextjs"
    echo 3. Run: npm install
    echo 4. Run: npm run dev
    echo.
    pause
    exit /b 1
)

pause
