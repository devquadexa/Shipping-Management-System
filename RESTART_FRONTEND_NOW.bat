@echo off
color 0C
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║          IMPORTANT: YOU MUST RESTART THE SERVER!          ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Hard refresh (Ctrl+Shift+R) does NOT load new React code!
echo You MUST restart the npm server!
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo FOLLOW THESE EXACT STEPS:
echo.
echo STEP 1: STOP THE FRONTEND SERVER
echo ────────────────────────────────
echo.
echo 1. Find your terminal/command prompt where "npm start" is running
echo 2. Click on that terminal window
echo 3. Press: Ctrl + C
echo 4. If it asks "Terminate batch job (Y/N)?", type: Y
echo 5. Wait until you see the command prompt (like C:\...)
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo STEP 2: START THE FRONTEND SERVER
echo ──────────────────────────────────
echo.
echo 1. In the SAME terminal window
echo 2. Type: cd client
echo 3. Press Enter
echo 4. Type: npm start
echo 5. Press Enter
echo 6. Wait for "Compiled successfully!" message
echo 7. Wait for browser to open automatically
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo STEP 3: CHECK THE BROWSER
echo ─────────────────────────
echo.
echo 1. Browser should open automatically to http://localhost:3000
echo 2. If not, manually go to: http://localhost:3000
echo 3. Login as Super Admin
echo 4. You should see the NEW dashboard with:
echo    - "📊 Executive Dashboard" header
echo    - Time period filter buttons
echo    - Financial Overview section (blue gradient)
echo    - Operations Overview section
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo STILL NOT WORKING?
echo.
echo Check these:
echo.
echo 1. Make sure you're in the CLIENT folder when running npm start
echo    Path should be: ...\Shipping Management System\client
echo.
echo 2. Check for errors in the terminal
echo    Look for red error messages
echo.
echo 3. Check browser console (F12)
echo    Look for JavaScript errors
echo.
echo 4. Make sure you're logged in as Super Admin or Admin
echo    Regular users see a different dashboard
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo If you see errors, take a screenshot and share it!
echo.
pause
