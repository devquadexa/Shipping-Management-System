@echo off
echo ========================================
echo FORCE REFRESH - CLEAR ALL CACHES
echo ========================================
echo.

echo Step 1: Clearing React build cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ React cache cleared
) else (
    echo ℹ No React cache found
)

if exist ".cache" (
    rmdir /s /q ".cache"
    echo ✓ .cache cleared
) else (
    echo ℹ No .cache found
)

if exist "build" (
    rmdir /s /q "build"
    echo ✓ Build folder cleared
) else (
    echo ℹ No build folder found
)

echo.
echo Step 2: Clearing npm cache...
call npm cache clean --force
echo ✓ npm cache cleared

echo.
echo ========================================
echo CACHE CLEARED SUCCESSFULLY
echo ========================================
echo.
echo Now:
echo 1. Stop the frontend if running (Ctrl+C)
echo 2. Run: npm start
echo 3. In browser, press Ctrl+Shift+Delete
echo 4. Clear "Cached images and files"
echo 5. Press Ctrl+Shift+R to hard refresh
echo.
pause
