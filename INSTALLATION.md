# Salty Cards - Installation Guide

## Prerequisites
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Make sure Docker Desktop is running (you'll see the whale icon in your system tray)

## Installation Steps

### Windows
1. Extract the ZIP file to any location (e.g., C:\SaltyCards)
2. Double-click `start.bat`
3. Wait for the application to start (first time takes 2-3 minutes)
4. Open your browser and go to: http://localhost:3000

### To Stop the Application
- Double-click `stop.bat`

## Troubleshooting

### "Docker is not installed"
- Download and install Docker Desktop from the link above
- Restart your computer after installation

### "Docker is not running"
- Open Docker Desktop from Start Menu
- Wait for it to fully start (whale icon turns steady)
- Try running start.bat again

### "Port 3000 is already in use"
- Another application is using port 3000
- Close any other local servers
- Or edit docker-compose.yml and change "3000:3000" to "8080:3000"
- Then access at http://localhost:8080

## First Time Setup
After starting, you may need to:
1. Create an admin account at http://localhost:3000/register
2. Configure shop settings in the dashboard

## Support
For issues, contact: support@saltycards.com