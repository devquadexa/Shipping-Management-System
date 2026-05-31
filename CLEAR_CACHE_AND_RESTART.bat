@echo off
echo ========================================
echo   SHIPPING MANAGEMENT SYSTEM
echo   Cache Clear and Restart Helper
echo ========================================
echo.
echo This script will help you restart the frontend server.
echo You still need to manually clear browser cache!
echo.
echo ========================================
echo   STEP 1: RESTART FRONTEND SERVER
echo ========================================
echo.
echo Please follow these steps:
echo.
echo 1. Go to your terminal where "npm start" is running
echo 2. Press Ctrl+C to stop the server
echo 3. Wait 3 seconds
echo 4. Type: npm start
echo 5. Wait for "Compiled successfully!" message
echo.
pause
echo.
echo ========================================
echo   STEP 2: CLEAR BROWSER CACHE
echo ========================================
echo.
echo Now clear your browser cache:
echo.
echo METHOD A - Full Cache Clear (RECOMMENDED):
echo   1. Press Ctrl+Shift+Delete in your browser
echo   2. Select "Cached images and files"
echo   3. Select "All time" from dropdown
echo   4. Click "Clear data"
echo.
echo METHOD B - Hard Refresh:
echo   1. Press Ctrl+Shift+R (NOT just F5!)
echo   2. Do this 2-3 times
echo.
echo METHOD C - Test in Incognito:
echo   1. Press Ctrl+Shift+N
echo   2. Go to http://localhost:3000
echo   3. Login and test
echo.
pause
echo.
echo ========================================
echo   STEP 3: VERIFY CHANGES
echo ========================================
echo.
echo After clearing cache:
echo.
echo 1. Press F12 to open DevTools
echo 2. Go to Console tab
echo 3. Click on a notification
echo 4. You should see debug messages starting with:
echo    "=== NOTIFICATION CLICK DEBUG ==="
echo 5. The page should redirect automatically
echo.
echo For Layout:
echo 1. Check there's no large gap between navbar and content
echo 2. Spacing should be professional and compact
echo.
pause
echo.
echo ========================================
echo   TROUBLESHOOTING
echo ========================================
echo.
echo If it still doesn't work:
echo.
echo 1. Try a different browser (Chrome, Edge, Firefox)
echo 2. Check Console (F12) for red error messages
echo 3. Verify both servers are running:
echo    - Frontend: http://localhost:3000
echo    - Backend: http://localhost:5000
echo.
echo Read FIX_BROWSER_CACHE_ISSUE.md for detailed help!
echo.
pause
