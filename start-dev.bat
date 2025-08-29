@echo off
echo Checking Node.js and npm versions...
node -v
npm -v

echo.
echo Starting development server...
call npm run dev

pause
