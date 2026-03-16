@echo off
echo ========================================
echo Restarting Frontend Development Server
echo ========================================
echo.
echo Stopping any running processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Starting frontend server...
cd frontend
start cmd /k "npm start"
echo.
echo ========================================
echo Frontend server is starting...
echo Wait for "Compiled successfully!" message
echo Then refresh your browser with Ctrl+Shift+R
echo ========================================
pause
