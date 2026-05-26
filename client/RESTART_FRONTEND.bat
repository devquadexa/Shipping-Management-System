@echo off
echo ========================================
echo RESTART FRONTEND WITH CACHE CLEAR
echo ========================================
echo.

echo Step 1: Clearing React build cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Cache cleared
) else (
    echo ℹ No cache found (this is fine)
)
echo.

echo Step 2: Starting frontend...
echo Wait for "Compiled successfully!" message
echo Then press Ctrl+Shift+R in browser to hard refresh
echo.
echo ========================================
echo.

npm start
