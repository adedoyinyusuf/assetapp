@echo off
echo Verifying Node.js installation...

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check Node.js version
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
set NODE_VERSION=%NODE_VERSION:v=%

echo Node.js version: %NODE_VERSION%

:: Verify npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check npm version
for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
echo npm version: %NPM_VERSION%

echo.
echo Creating a test project to verify installation...
mkdir test-node 2>nul
cd test-node

:: Create a simple package.json
echo {
  "name": "test-node",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
} > package.json

:: Install a simple package
echo Installing a test package...
call npm install chalk@5.3.0

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to install test package. There might be permission or network issues.
    echo.
    echo Try running this command manually in an administrator command prompt:
    echo   npm install -g npm@latest
    echo   npm cache clean --force
    echo.
    pause
    cd ..
    rmdir /s /q test-node
    exit /b 1
)

echo.
echo Node.js and npm are working correctly!

:: Clean up
cd ..
rmdir /s /q test-node

echo.
echo Now let's try to install the project dependencies...
call npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to install project dependencies.
    echo.
    echo Try these steps manually:
    echo 1. Open Command Prompt as Administrator
    echo 2. Run: npm install -g npm@latest
    echo 3. Run: npm cache clean --force
    echo 4. Navigate to the project directory
    echo 5. Run: npm install --legacy-peer-deps
    echo.
    pause
    exit /b 1
)

echo.
echo Installation completed successfully!
echo You can now start the development server with:
echo   npm run dev
echo.
pause
