@echo off
echo WeCruiting CV-Builder wird gestartet...

start "WeCruiting Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul
start "WeCruiting Frontend" cmd /k "cd /d "%~dp0frontend" && npx vite"

echo.
echo Beide Server laufen. Bitte oeffnen Sie:
echo http://localhost:5173
echo.
start http://localhost:5173
