#!/bin/bash

echo "=========================================="
echo "Payment Routes Diagnostic Script"
echo "=========================================="
echo ""

echo "1. Checking if payment routes file exists..."
if [ -f "src/presentation/routes/paymentRoutes.js" ]; then
    echo "   ✅ paymentRoutes.js exists"
else
    echo "   ❌ paymentRoutes.js NOT FOUND"
    exit 1
fi
echo ""

echo "2. Checking if payment routes are imported in index.js..."
if grep -q "paymentRoutes" src/index.js; then
    echo "   ✅ paymentRoutes imported in index.js"
    grep "paymentRoutes" src/index.js
else
    echo "   ❌ paymentRoutes NOT imported in index.js"
fi
echo ""

echo "3. Checking if payment routes are registered..."
if grep -q "app.use.*payments.*paymentRoutes" src/index.js; then
    echo "   ✅ Payment routes registered"
    grep "app.use.*payments" src/index.js
else
    echo "   ❌ Payment routes NOT registered"
fi
echo ""

echo "4. Checking if payment repository exists..."
if [ -f "src/infrastructure/repositories/MSSQLPaymentRepository.js" ]; then
    echo "   ✅ MSSQLPaymentRepository.js exists"
else
    echo "   ❌ MSSQLPaymentRepository.js NOT FOUND"
fi
echo ""

echo "5. Checking if payment use cases exist..."
if [ -d "src/application/use-cases/payment" ]; then
    echo "   ✅ Payment use cases directory exists"
    ls -la src/application/use-cases/payment/
else
    echo "   ❌ Payment use cases directory NOT FOUND"
fi
echo ""

echo "6. Checking if Payments table exists in database..."
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -d SuperShineCargoDb -Q "SELECT COUNT(*) as TableExists FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments'" -h -1 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Database connection successful"
else
    echo "   ❌ Database connection failed"
fi
echo ""

echo "7. Checking if backend container is running..."
if docker ps | grep -q cargo_backend; then
    echo "   ✅ Backend container is running"
    docker ps | grep cargo_backend
else
    echo "   ❌ Backend container is NOT running"
fi
echo ""

echo "8. Testing payment API endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/payments/all)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
    echo "   ✅ Payment endpoint responding (HTTP $RESPONSE - auth required)"
elif [ "$RESPONSE" = "404" ]; then
    echo "   ❌ Payment endpoint NOT FOUND (HTTP 404)"
    echo "   → Backend needs to be rebuilt!"
else
    echo "   ⚠️  Unexpected response: HTTP $RESPONSE"
fi
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""

echo "Next Steps:"
echo "1. If any ❌ found, run: git pull origin main"
echo "2. Rebuild backend: docker compose build --no-cache backend"
echo "3. Restart backend: docker compose up -d backend"
echo "4. Check logs: docker logs cargo_backend --tail 50"
