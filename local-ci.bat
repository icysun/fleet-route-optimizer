@echo off
echo 🚀 Fleet Route Optimizer - Quick Local Tests
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Run the quick tests
node scripts\quick-test.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ All essential checks passed! Your code is ready to push.
    echo.
    echo 💡 Quick commands:
    echo    git add .
    echo    git commit -m "your message"
    echo    git push
) else (
    echo.
    echo ❌ Some checks failed. Please fix the issues above.
)

pause