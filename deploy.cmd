@echo off

echo.
echo ====== Azure Deployment Script ======
echo.

echo Setting environment variables...
set NODE_ENV=production

echo Installing Node.js dependencies (production only)...
if exist "package.json" (
    call npm ci --production --silent
    if errorlevel 1 goto error
)

echo Building application...
if exist "package.json" (
    call npm run build
    if errorlevel 1 goto error
)

echo Cleaning up cache and temporary files...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache" 2>nul
if exist ".npm" rmdir /s /q ".npm" 2>nul
if exist "temp-page.html" del "temp-page.html" 2>nul
if exist "replit.md" del "replit.md" 2>nul

echo Running database migrations...
if exist "package.json" (
    call npm run db:migrate
    if errorlevel 1 echo Warning: Migration failed, continuing...
)

echo.
echo ====== Deployment Completed Successfully ======
echo.
goto end

:error
echo.
echo ====== An error occurred during deployment ======
echo.
exit /b 1

:end
echo.
echo Deployment finished.
