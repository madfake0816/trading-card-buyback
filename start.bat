@echo off
echo ========================================
echo   Salty Cards - Starting Application
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo Starting Salty Cards...
echo.
docker-compose up -d

echo.
echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo Your application is now running at:
echo   ''
echo.
echo To stop the application, run: stop.bat
echo.
pause