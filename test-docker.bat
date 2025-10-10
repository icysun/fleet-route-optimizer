@echo off
echo 🐳 Running Docker Integration Tests Locally
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo 🧹 Cleaning up previous containers...
docker compose -f docker-compose.test.yml down >nul 2>&1

echo 🔨 Building and running tests...
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from api

set TEST_RESULT=%errorlevel%

echo.
echo 🧹 Cleaning up test containers...
docker compose -f docker-compose.test.yml down >nul 2>&1

if %TEST_RESULT% equ 0 (
    echo ✅ Docker tests passed!
) else (
    echo ❌ Docker tests failed!
)

pause
exit /b %TEST_RESULT%