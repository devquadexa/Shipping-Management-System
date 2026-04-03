# QA Environment Hosting Guide

This guide explains how to set up a dedicated QA environment that your QA team can access via a shared URL.

---

## Hosting Options

### Option 1: Cloud VPS (Recommended for QA)
**Best for**: Remote QA team, multiple testers, stable environment

**Providers:**
- DigitalOcean (Droplets) - $6-12/month
- AWS EC2 (t2.micro/t2.small) - $8-20/month
- Linode - $5-10/month
- Vultr - $6-12/month
- Azure VM - $10-20/month

### Option 2: Local Network Hosting
**Best for**: QA team in same office, cost-free

**Requirements:**
- A dedicated PC/laptop that stays on
- Static local IP address
- Port forwarding on router (if accessing from outside)

### Option 3: Cloud Platform Services
**Best for**: Quick setup, managed infrastructure

**Providers:**
- Heroku (with ClearDB/JawsDB for database)
- Railway.app
- Render.com
- Fly.io

---

## Recommended Setup: Cloud VPS with Docker

This is the most straightforward and professional approach for QA environments.

### Step 1: Provision a VPS Server

#### 1.1 Choose a Provider
I recommend **DigitalOcean** for simplicity:
- Go to: https://www.digitalocean.com/
- Create an account
- Create a new Droplet

#### 1.2 Server Specifications (Minimum for QA)
```
OS: Ubuntu 22.04 LTS
RAM: 2GB (4GB recommended)
CPU: 1 vCPU (2 recommended)
Storage: 50GB SSD
Cost: ~$12/month
```

#### 1.3 Initial Server Setup
After creating the droplet, you'll receive:
- IP Address (e.g., 123.45.67.89)
- Root password (via email)

---

### Step 2: Server Configuration

#### 2.1 Connect to Server
```bash
# From your local machine
ssh root@YOUR_SERVER_IP

# Enter the password when prompted
```

#### 2.2 Update System
```bash
apt update && apt upgrade -y
```

#### 2.3 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

#### 2.4 Create Application User (Optional but recommended)
```bash
# Create user
adduser qauser

# Add to docker group
usermod -aG docker qauser

# Switch to new user
su - qauser
```

---

### Step 3: Deploy Application

#### 3.1 Upload Project Files
From your local machine:

```bash
# Option A: Using SCP
scp -r /path/to/super-shine-cargo root@YOUR_SERVER_IP:/home/qauser/

# Option B: Using Git (Recommended)
# On server:
cd /home/qauser
git clone <your-repository-url> super-shine-cargo
cd super-shine-cargo
```

#### 3.2 Configure Environment Variables
```bash
cd /home/qauser/super-shine-cargo

# Copy example env file
cp .env.example .env

# Edit the .env file
nano .env
```

Update these values:
```env
# Your server IP (use the VPS IP address)
SERVER_IP=123.45.67.89

# Database
DB_DATABASE=SuperShineCargoDb
DB_PASSWORD=QA_Strong_Password_2024!

# JWT Secret (generate a random string)
JWT_SECRET=qa_jwt_secret_key_random_string_here
```

#### 3.3 Start the Application
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### 3.4 Initialize Database
```bash
# Wait for SQL Server to be ready (30-60 seconds)
sleep 60

# Copy init script to database container
docker cp server/config/init-database.sql cargo_db:/tmp/

# Run initialization script
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "QA_Strong_Password_2024!" \
  -i /tmp/init-database.sql

# Verify tables created
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "QA_Strong_Password_2024!" \
  -d SuperShineCargoDb \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
```

---

### Step 4: Configure Domain (Optional but Recommended)

#### Option A: Use IP Address Directly
Your QA team can access:
```
http://YOUR_SERVER_IP
```

#### Option B: Use a Subdomain (Professional)
1. Purchase a domain (e.g., from Namecheap, GoDaddy)
2. Create a subdomain: `qa.yourdomain.com`
3. Point it to your server IP
4. Configure SSL (see Step 5)

Example DNS Configuration:
```
Type: A Record
Name: qa
Value: YOUR_SERVER_IP
TTL: 3600
```

---

### Step 5: Setup SSL/HTTPS (Recommended)

#### 5.1 Install Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

#### 5.2 Get SSL Certificate
```bash
# Stop frontend container temporarily
docker stop cargo_frontend

# Get certificate
certbot certonly --standalone -d qa.yourdomain.com

# Restart frontend
docker start cargo_frontend
```

#### 5.3 Update Docker Compose
Edit `docker-compose.yml` to use HTTPS:
```yaml
frontend:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

### Step 6: Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## QA Environment Access

### Share with QA Team

**Access URL:**
```
http://YOUR_SERVER_IP
# or
https://qa.yourdomain.com
```

**Default Login Credentials:**
```
Username: superadmin
Password: admin123
Role: Super Admin
```

**Create QA-Specific Users:**
1. Login as superadmin
2. Go to Settings → User Management
3. Create users for each QA tester:
   - QA Tester 1 (Admin role)
   - QA Tester 2 (Manager role)
   - QA Tester 3 (Waff Clerk role)

---

## QA Environment Management

### Resetting QA Database
```bash
# Backup current state
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -Q "BACKUP DATABASE SuperShineCargoDb TO DISK = '/var/opt/mssql/backup/qa_backup.bak'"

# Drop and recreate database
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -Q "DROP DATABASE SuperShineCargoDb; CREATE DATABASE SuperShineCargoDb;"

# Re-run init script
docker cp server/config/init-database.sql cargo_db:/tmp/
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -i /tmp/init-database.sql
```

### Viewing Logs
```bash
# Backend logs
docker logs cargo_backend -f

# Frontend logs
docker logs cargo_frontend -f

# Database logs
docker logs cargo_db -f

# All logs
docker-compose logs -f
```

### Restarting Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker restart cargo_backend
docker restart cargo_frontend
docker restart cargo_db
```

### Updating QA Environment
```bash
# Pull latest code
cd /home/qauser/super-shine-cargo
git pull origin qa-branch  # or main branch

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check status
docker-compose ps
```

---

## Cost Breakdown (Monthly)

### Cloud VPS Option
```
VPS Server (2GB RAM):     $12/month
Domain (optional):        $1/month (annual)
SSL Certificate:          FREE (Let's Encrypt)
-----------------------------------
Total:                    ~$12-13/month
```

### Local Network Option
```
Electricity cost:         ~$5-10/month
Internet (existing):      $0
-----------------------------------
Total:                    ~$5-10/month
```

---

## Alternative: Quick QA Setup with Ngrok (Temporary)

If you want to quickly share your local environment without setting up a server:

### 1. Install Ngrok
- Download from: https://ngrok.com/download
- Sign up for free account
- Install and authenticate

### 2. Start Your Local Application
```bash
# Terminal 1: Backend
cd backend-api
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### 3. Expose Frontend with Ngrok
```bash
# Terminal 3
ngrok http 3000
```

### 4. Share the URL
Ngrok will provide a public URL like:
```
https://abc123.ngrok.io
```

**Limitations:**
- URL changes every time you restart ngrok (unless paid plan)
- Session timeout after 8 hours on free plan
- Not suitable for long-term QA
- Your computer must stay on

---

## Recommended QA Environment Setup

For a professional QA environment, I recommend:

### Setup A: Dedicated QA Server (Best)
```
✅ DigitalOcean Droplet ($12/month)
✅ Ubuntu 22.04 LTS
✅ Docker + Docker Compose
✅ Subdomain: qa.yourdomain.com
✅ SSL Certificate (Let's Encrypt)
✅ Automated backups
✅ 24/7 availability
```

### Setup B: Shared Development Server
```
✅ Use existing development server
✅ Create separate database: SuperShineCargoDb_QA
✅ Run on different ports (5001, 3001)
✅ Access via: http://dev-server-ip:3001
```

### Setup C: Temporary Testing (Quick)
```
✅ Use Ngrok to expose local environment
✅ Good for: Quick demos, short testing sessions
✅ Not good for: Long-term QA, multiple testers
```

---

## Security Considerations for QA Environment

### 1. Access Control
- Use strong passwords
- Create separate QA user accounts
- Don't use production credentials
- Consider IP whitelisting

### 2. Data Isolation
- Use separate database from production
- Use test/dummy data only
- Don't copy production data to QA

### 3. Network Security
- Enable firewall (ufw)
- Use HTTPS (SSL certificate)
- Keep server updated
- Monitor access logs

### 4. Backup Strategy
- Daily automated backups
- Keep backups for 7 days
- Test restore process

---

## QA Environment Checklist

Before sharing with QA team:

- [ ] Server is accessible via URL
- [ ] Application loads without errors
- [ ] Database is initialized with schema
- [ ] Default superadmin user works
- [ ] All features are functional
- [ ] Test data is loaded (optional)
- [ ] SSL certificate is configured (if using domain)
- [ ] Firewall is configured
- [ ] Backup system is in place
- [ ] Documentation is shared with QA team
- [ ] QA user accounts are created
- [ ] Access credentials are shared securely

---

## QA Testing Workflow

### For QA Team:
1. **Access**: Navigate to QA environment URL
2. **Login**: Use provided credentials
3. **Test**: Follow test cases and scenarios
4. **Report**: Log bugs with screenshots and steps
5. **Retest**: Verify fixes in QA environment before production

### For Development Team:
1. **Deploy**: Push changes to QA environment
2. **Notify**: Inform QA team of new features/fixes
3. **Monitor**: Check logs for errors
4. **Fix**: Address reported bugs
5. **Redeploy**: Update QA environment with fixes

---

## Monitoring and Maintenance

### Daily Tasks
- Check if all containers are running
- Review error logs
- Monitor disk space

### Weekly Tasks
- Update system packages
- Review and clean old logs
- Test backup restoration
- Check SSL certificate expiry

### Monthly Tasks
- Security updates
- Performance optimization
- Database cleanup
- Review access logs

---

## Quick Start Commands

```bash
# SSH into QA server
ssh root@YOUR_QA_SERVER_IP

# Navigate to project
cd /home/qauser/super-shine-cargo

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart all services
docker-compose restart

# Update application
git pull origin qa-branch
docker-compose up -d --build

# Reset database
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -Q "DROP DATABASE SuperShineCargoDb; CREATE DATABASE SuperShineCargoDb;"
docker cp server/config/init-database.sql cargo_db:/tmp/
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -i /tmp/init-database.sql
docker restart cargo_backend
```

---

## Troubleshooting

### QA can't access the URL
1. Check if server is running: `docker-compose ps`
2. Check firewall: `ufw status`
3. Verify ports are open: `netstat -tulpn | grep -E '80|443|3000|5000'`
4. Check DNS propagation (if using domain): https://dnschecker.org/

### Application is slow
1. Check server resources: `htop` or `top`
2. Check Docker stats: `docker stats`
3. Consider upgrading server RAM
4. Optimize database queries

### Database connection errors
1. Check if DB container is running: `docker ps | grep cargo_db`
2. Check DB logs: `docker logs cargo_db`
3. Verify credentials in `.env` file
4. Test connection: `docker exec cargo_db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "PASSWORD" -Q "SELECT 1"`

---

## Cost Comparison

| Option | Setup Time | Monthly Cost | Pros | Cons |
|--------|------------|--------------|------|------|
| DigitalOcean VPS | 1-2 hours | $12 | Professional, reliable, 24/7 | Requires server management |
| AWS EC2 | 2-3 hours | $10-20 | Scalable, many features | Complex setup, variable pricing |
| Ngrok (Free) | 5 minutes | $0 | Instant, no setup | Temporary, URL changes, limited hours |
| Ngrok (Paid) | 5 minutes | $8 | Fixed URL, unlimited | Computer must stay on |
| Local Network | 30 minutes | $0 | Free, full control | Only accessible in office |

---

## My Recommendation

For your QA environment, I recommend:

### Setup: DigitalOcean Droplet + Docker

**Why:**
- ✅ Professional and reliable
- ✅ QA team can access from anywhere
- ✅ Easy to manage with Docker
- ✅ Can reset/rebuild easily
- ✅ Separate from production
- ✅ Cost-effective (~$12/month)

**Steps:**
1. Create DigitalOcean account
2. Create Ubuntu 22.04 droplet (2GB RAM)
3. Follow Step 2 (Server Configuration)
4. Follow Step 3 (Deploy Application)
5. Share IP address with QA team
6. Optionally: Add subdomain like `qa.supershinecargo.cloud`

---

## Detailed DigitalOcean Setup

### 1. Create Droplet

1. Go to https://www.digitalocean.com/
2. Click "Create" → "Droplets"
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($12/month - 2GB RAM, 1 CPU, 50GB SSD)
   - **Datacenter**: Choose closest to your location
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `qa-supershine-cargo`
4. Click "Create Droplet"
5. Note the IP address (e.g., 123.45.67.89)

### 2. Initial Server Setup

```bash
# Connect to server
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install Git
apt install git -y

# Create project directory
mkdir -p /opt/super-shine-cargo
cd /opt/super-shine-cargo
```

### 3. Deploy Application

```bash
# Clone repository (or upload files)
git clone <your-repo-url> .

# Or if uploading from local:
# On your local machine:
# scp -r /path/to/project/* root@YOUR_DROPLET_IP:/opt/super-shine-cargo/

# Create .env file
cat > .env << EOF
SERVER_IP=YOUR_DROPLET_IP
DB_DATABASE=SuperShineCargoDb
DB_PASSWORD=QA_Strong_Password_2024!
JWT_SECRET=$(openssl rand -base64 32)
EOF

# Start services
docker-compose up -d

# Wait for services to start
sleep 60

# Initialize database
docker cp server/config/init-database.sql cargo_db:/tmp/
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "QA_Strong_Password_2024!" \
  -i /tmp/init-database.sql

# Restart backend to ensure connection
docker restart cargo_backend

# Check all services are running
docker-compose ps
```

### 4. Verify Deployment

```bash
# Test backend
curl http://localhost:5000/

# Test frontend
curl http://localhost:80/ | head -20

# Check logs
docker-compose logs --tail=50
```

### 5. Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (if using SSL)
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 6. Share with QA Team

Send this information to your QA team:

```
QA Environment Access

URL: http://YOUR_DROPLET_IP
(or https://qa.yourdomain.com if you configured a domain)

Default Login:
Username: superadmin
Password: admin123

Your QA Account:
Username: [will be created]
Password: [will be provided]

Notes:
- This is a dedicated QA environment
- Feel free to test all features
- Data can be reset anytime
- Report bugs with screenshots and steps to reproduce
```

---

## Maintenance Scripts

### Create a maintenance script: `qa-maintenance.sh`

```bash
#!/bin/bash

echo "=== QA Environment Maintenance ==="

# Check services
echo "Checking services..."
docker-compose ps

# Check disk space
echo "Disk space:"
df -h

# Check memory
echo "Memory usage:"
free -h

# Clean old logs
echo "Cleaning old logs..."
docker system prune -f

# Backup database
echo "Backing up database..."
BACKUP_FILE="qa_backup_$(date +%Y%m%d_%H%M%S).bak"
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "YOUR_PASSWORD" \
  -Q "BACKUP DATABASE SuperShineCargoDb TO DISK = '/var/opt/mssql/backup/$BACKUP_FILE'"

echo "Maintenance complete!"
```

Make it executable:
```bash
chmod +x qa-maintenance.sh
```

Run weekly:
```bash
./qa-maintenance.sh
```

---

## Alternative: Railway.app (Easiest Cloud Deployment)

If you want the simplest setup:

### 1. Sign up at Railway.app
- Go to: https://railway.app/
- Sign up with GitHub

### 2. Create New Project
- Click "New Project"
- Choose "Deploy from GitHub repo"
- Connect your repository

### 3. Add Database
- Click "New" → "Database" → "Add MSSQL"
- Railway will provision a database

### 4. Configure Environment Variables
Add these in Railway dashboard:
```
PORT=5000
NODE_ENV=production
DB_SERVER=[Railway provides]
DB_PORT=[Railway provides]
DB_DATABASE=[Railway provides]
DB_USER=[Railway provides]
DB_PASSWORD=[Railway provides]
JWT_SECRET=[generate random string]
```

### 5. Deploy
- Railway automatically deploys
- You get a URL like: `https://your-app.railway.app`

**Pros:**
- Extremely easy setup
- Automatic deployments
- Free tier available
- Built-in SSL

**Cons:**
- Limited free tier
- Less control
- Can be more expensive at scale

---

## Summary

**For Professional QA Environment:**
→ Use DigitalOcean VPS with Docker (~$12/month)

**For Quick Testing:**
→ Use Ngrok to expose local environment (free, temporary)

**For Easiest Setup:**
→ Use Railway.app or Render.com (free tier available)

**For Office-Only QA:**
→ Host on local network PC (free)

---

## Next Steps

1. Choose your hosting option
2. Follow the relevant setup steps
3. Initialize the database
4. Create QA user accounts
5. Share access URL with QA team
6. Set up monitoring and backups
7. Document any QA-specific configurations

---

## Support

If you need help with setup:
1. Check the troubleshooting section
2. Review Docker logs
3. Verify all environment variables
4. Test database connection
5. Check firewall settings

---

**Questions?** Feel free to ask for clarification on any step!
