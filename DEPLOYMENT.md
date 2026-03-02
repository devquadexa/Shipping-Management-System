# Production Deployment Guide - Super Shine Cargo Service

## Overview
This guide covers deploying the Super Shine Cargo Service system as a production web application with mobile support.

## Pre-Deployment Checklist

### 1. Code Optimization
- ✅ Mobile-responsive CSS implemented
- ✅ Table scrolling for mobile devices
- ✅ Touch-friendly buttons (44px minimum)
- ✅ Viewport meta tags configured
- ✅ PWA manifest added

### 2. Security Hardening

#### Backend Security
```javascript
// Add to server/index.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

#### Environment Variables
- Never commit `.env` file
- Use strong JWT secret
- Use strong database passwords
- Enable SSL/TLS for database

### 3. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX IX_Jobs_CreatedDate ON Jobs(CreatedDate DESC);
CREATE INDEX IX_Bills_CreatedDate ON Bills(CreatedDate DESC);
CREATE INDEX IX_PettyCash_Date ON PettyCash(Date DESC);
```

## Deployment Options

### Option 1: Traditional Hosting (IIS + SQL Server)

#### Requirements
- Windows Server 2016 or later
- IIS 10 or later
- SQL Server 2016 or later
- Node.js 14+ installed

#### Steps

1. **Prepare Backend**
```bash
# Build for production
npm install --production
```

2. **Prepare Frontend**
```bash
cd client
npm run build
```

3. **Configure IIS**
- Install IISNode
- Create new website
- Point to build folder for frontend
- Configure reverse proxy for backend API

4. **Configure SQL Server**
- Create production database
- Run init-database.sql
- Configure firewall rules
- Enable SSL/TLS

5. **Environment Configuration**
Create production `.env`:
```env
DB_USER=production_user
DB_PASSWORD=StrongPassword123!
DB_SERVER=production-server
DB_PORT=1433
DB_NAME=SuperShineCargoDb
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
```

### Option 2: Cloud Hosting (Azure)

#### Azure App Service + Azure SQL

1. **Create Azure SQL Database**
```bash
az sql server create --name supershine-sql --resource-group SuperShine --location southeastasia
az sql db create --resource-group SuperShine --server supershine-sql --name SuperShineCargoDb
```

2. **Deploy Backend**
```bash
az webapp create --resource-group SuperShine --plan SuperShinePlan --name supershine-api --runtime "NODE|18-lts"
az webapp config appsettings set --resource-group SuperShine --name supershine-api --settings @appsettings.json
```

3. **Deploy Frontend**
```bash
cd client
npm run build
az storage blob upload-batch --account-name supershinestatic --destination '$web' --source ./build
```

4. **Configure Custom Domain**
```bash
az webapp config hostname add --webapp-name supershine-api --resource-group SuperShine --hostname api.supershine.lk
```

### Option 3: Docker Deployment

#### Dockerfile for Backend
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server ./server
COPY .env ./
EXPOSE 5000
CMD ["node", "server/index.js"]
```

#### Dockerfile for Frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_SERVER=sqlserver
      - DB_NAME=SuperShineCargoDb
    depends_on:
      - sqlserver
  
  frontend:
    build:
      context: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
  
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrong@Password
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

volumes:
  sqldata:
```

## Mobile Optimization

### Features Implemented
1. **Responsive Design**
   - Breakpoints: 480px, 768px, 1024px
   - Flexible grid layouts
   - Touch-friendly UI elements

2. **Mobile Navigation**
   - Collapsible menu
   - Full-width buttons
   - Larger touch targets

3. **Table Handling**
   - Horizontal scrolling
   - Responsive font sizes
   - Compact view on mobile

4. **Forms**
   - Stacked layout on mobile
   - 16px font size (prevents iOS zoom)
   - Full-width inputs

5. **PWA Support**
   - Manifest.json configured
   - Installable on mobile devices
   - Offline-ready (can be enhanced)

### Testing Mobile Responsiveness

1. **Chrome DevTools**
```
F12 → Toggle Device Toolbar → Test various devices
```

2. **Real Device Testing**
- iOS Safari
- Android Chrome
- Various screen sizes

3. **Responsive Test Tools**
- BrowserStack
- LambdaTest
- Responsively App

## Performance Optimization

### Backend
1. **Enable Compression**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Database Connection Pooling**
Already implemented in `database.js`

3. **Caching**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 });
```

### Frontend
1. **Code Splitting**
```javascript
const Dashboard = React.lazy(() => import('./components/Dashboard'));
```

2. **Image Optimization**
- Use WebP format
- Lazy loading
- Responsive images

3. **Bundle Size**
```bash
npm run build
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'
```

## SSL/HTTPS Configuration

### Let's Encrypt (Free SSL)
```bash
certbot --nginx -d supershine.lk -d www.supershine.lk
```

### IIS SSL
1. Request certificate from CA
2. Import to IIS
3. Bind to website
4. Force HTTPS redirect

## Monitoring & Logging

### Application Insights (Azure)
```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPINSIGHTS_KEY).start();
```

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server/index.js --name supershine-api
pm2 startup
pm2 save
```

### Log Management
```javascript
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Backup Strategy

### Database Backup
```sql
-- Daily backup
BACKUP DATABASE SuperShineCargoDb
TO DISK = 'D:\Backups\SuperShine_Daily.bak'
WITH INIT, COMPRESSION;

-- Create maintenance plan in SQL Server
```

### Automated Backups
```bash
# Windows Task Scheduler
# Run daily at 2 AM
sqlcmd -S localhost -Q "BACKUP DATABASE SuperShineCargoDb TO DISK='D:\Backups\SuperShine_%date:~-4,4%%date:~-10,2%%date:~-7,2%.bak'"
```

## Post-Deployment

### 1. Health Checks
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});
```

### 2. Monitoring Endpoints
- `/health` - Server health
- `/api/health/db` - Database connectivity

### 3. Update DNS
Point domain to server IP:
```
A Record: supershine.lk → Your-Server-IP
CNAME: www → supershine.lk
```

### 4. Configure Firewall
```bash
# Allow HTTP/HTTPS
netsh advfirewall firewall add rule name="HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="HTTPS" dir=in action=allow protocol=TCP localport=443
```

## Maintenance

### Regular Tasks
- Daily database backups
- Weekly security updates
- Monthly performance review
- Quarterly disaster recovery test

### Update Procedure
1. Test in staging environment
2. Backup production database
3. Deploy during low-traffic hours
4. Monitor for errors
5. Rollback if needed

## Troubleshooting

### Common Issues

1. **Mobile Layout Issues**
   - Clear browser cache
   - Check viewport meta tag
   - Test in incognito mode

2. **Database Connection**
   - Verify firewall rules
   - Check connection string
   - Test with SQL Server Management Studio

3. **Performance Issues**
   - Enable compression
   - Optimize database queries
   - Add caching layer

## Support Contacts

- Technical Support: tech@supershine.lk
- Database Admin: dba@supershine.lk
- Emergency: +94-XXX-XXXXXX

## Rollback Plan

1. Keep previous version backup
2. Document all changes
3. Test rollback procedure
4. Have rollback scripts ready

```bash
# Rollback script
pm2 stop supershine-api
git checkout previous-version
npm install
pm2 start supershine-api
```

## Success Metrics

- Page load time < 3 seconds
- Mobile usability score > 90
- Uptime > 99.9%
- Database response time < 100ms
- Zero security vulnerabilities

---

**Last Updated:** February 2026
**Version:** 1.0.0
