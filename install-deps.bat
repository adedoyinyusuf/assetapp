@echo off
echo Starting dependency installation...

:: Install Next.js and React
echo Installing Next.js and React...
call npm install next@14.2.3 react@18.2.0 react-dom@18.2.0 --save-exact
if %ERRORLEVEL% NEQ 0 goto error

:: Install TypeScript and types
echo Installing TypeScript and type definitions...
call npm install --save-dev typescript@5.3.3 @types/node@20.10.5 @types/react@18.2.45 @types/react-dom@18.2.18
if %ERRORLEVEL% NEQ 0 goto error

:: Install Font Awesome
echo Installing Font Awesome...
call npm install @fortawesome/fontawesome-svg-core@6.5.1 @fortawesome/free-solid-svg-icons@6.5.1 @fortawesome/react-fontawesome@0.2.2
if %ERRORLEVEL% NEQ 0 goto error

:: Install NextAuth and Prisma adapter
echo Installing NextAuth and Prisma adapter...
call npm install next-auth@4.24.11 @auth/prisma-adapter@2.10.0
if %ERRORLEVEL% NEQ 0 goto error

:: Install additional dependencies
echo Installing additional dependencies...
call npm install @hookform/resolvers@3.3.4 @prisma/client@5.8.1 @radix-ui/react-accordion@1.2.3 @radix-ui/react-alert-dialog@1.1.5
if %ERRORLEVEL% NEQ 0 goto error

call npm install @radix-ui/react-dropdown-menu@2.1.4 @radix-ui/react-label@2.1.1 @radix-ui/react-navigation-menu@1.1.8
if %ERRORLEVEL% NEQ 0 goto error

call npm install @radix-ui/react-select@2.1.4 @radix-ui/react-slot@1.0.2 @tailwindcss/forms@0.5.7 @tailwindcss/typography@0.5.10
if %ERRORLEVEL% NEQ 0 goto error

call npm install autoprefixer@10.4.16 bcryptjs@2.4.3 class-variance-authority@0.7.0 clsx@2.1.0 lucide-react@0.321.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install postcss@8.4.32 react-hook-form@7.49.3 recharts@2.12.7 sonner@1.4.1 tailwind-merge@2.2.1 zod@3.22.4
if %ERRORLEVEL% NEQ 0 goto error

:: Install dev dependencies
echo Installing development dependencies...
call npm install --save-dev @testing-library/jest-dom@6.4.2 @testing-library/react@14.2.1 @testing-library/user-event@14.5.2 @types/bcryptjs@2.4.6
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev @types/express@4.17.21 @types/jest@29.5.11 @types/pg@8.10.9 @typescript-eslint/eslint-plugin@6.16.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev @typescript-eslint/parser@6.16.0 eslint@8.56.0 eslint-config-next@14.2.3 eslint-config-prettier@9.1.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev eslint-import-resolver-typescript@3.6.1 eslint-plugin-import@2.29.1 eslint-plugin-jsx-a11y@6.8.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev eslint-plugin-prettier@5.1.3 eslint-plugin-react@7.33.2 eslint-plugin-react-hooks@4.6.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev eslint-plugin-unused-imports@3.1.0 jest@29.7.0 jest-environment-jsdom@29.7.0 postcss-import@15.1.0
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev postcss-nesting@12.0.2 prettier@3.1.1 prettier-plugin-tailwindcss@0.5.7 prisma@5.8.1
if %ERRORLEVEL% NEQ 0 goto error

call npm install --save-dev tailwindcss@3.4.1 ts-jest@29.1.2 ts-node@10.9.2
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo All dependencies installed successfully!
echo.
echo To start the development server, run:
echo   npm run dev
echo.
pause
goto end

:error
echo.
echo Error installing dependencies. Please check the error messages above.
pause
exit /b 1

:end
