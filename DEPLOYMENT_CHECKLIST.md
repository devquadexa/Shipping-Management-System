# Quick Deployment Checklist

## Pre-Deployment
- [ ] Backup production database
- [ ] Note current Docker container status
- [ ] Commit all changes to Git

## Deployment Commands

### 1. Backup Database
```bash
ssh user@72.61.169.242
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourPassword' -Q "BACKUP DATABASE SuperShineCargoDb TO DISK = '/var/opt/mssql/backup/backup_$(date +%Y%m%d_%H%M%S).bak'"
```

### 2. Pull Latest Code
```bash
cd /path/to/project
git pull origin main
```

### 3. Run Database Migration
```bash
docker cp backend-api/src/config/ADD_PAYMENT_DETAILS_TO_BILLS.sql cargo_db:/tmp/
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourPassword' -d SuperShineCargoDb -i /tmp/ADD_PAYMENT_DETAILS_TO_BILLS.sql
```

### 4. Restart Backend
```bash
docker restart cargo_backend
sleep 15
docker logs cargo_backend --tail 50
```

### 5. Restart Frontend
```bash
docker restart cargo_frontend
sleep 15
docker logs cargo_frontend --tail 50
```

### 6. Verify
```bash
docker ps | grep cargo
curl http://localhost:5000/
```

## Post-Deployment Testing
- [ ] Test payment details feature
- [ ] Test container validation for vehicle shipments
- [ ] Test settlement edit/delete for Waff Clerk
- [ ] Check browser console for errors
- [ ] Check backend logs for errors

## If Issues Occur
```bash
# View logs
docker logs cargo_backend
docker logs cargo_frontend

# Restart again
docker restart cargo_backend cargo_frontend
```

## Success Indicators
- ✅ All containers running: `docker ps | grep cargo`
- ✅ Backend responds: `curl http://localhost:5000/`
- ✅ No errors in logs
- ✅ Website loads correctly
- ✅ All features working

---

**Estimated Time**: 15-30 minutes
**Backup Before Proceeding**: YES
**Rollback Plan**: Available in PRODUCTION_DEPLOYMENT_GUIDE.md
