@echo off
echo Cleaning up previous installation...
rmdir /s /q node_modules
rmdir /s /q .next
del package-lock.json

echo Installing dependencies...
call npm install --legacy-peer-deps

echo Installation complete!
pause
