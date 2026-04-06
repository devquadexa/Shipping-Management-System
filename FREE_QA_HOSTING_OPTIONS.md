# Free QA Hosting Options - Complete Guide

This guide covers 100% FREE options to host your QA environment and share a link with your QA team.

---

## 🏆 Best Free Options Comparison

| Option | Setup Time | Uptime | Database | Best For |
|--------|------------|--------|----------|----------|
| **Render.com** | 20 min | 24/7 | ✅ Free PostgreSQL | Long-term QA |
| **Railway.app** | 15 min | 24/7 | ✅ Free (limited) | Quick setup |
| **Vercel + PlanetScale** | 25 min | 24/7 | ✅ Free MySQL | Frontend-heavy apps |
| **Ngrok** | 5 min | While PC on | ❌ Use local | Quick demos |
| **Oracle Cloud Free Tier** | 1 hour | 24/7 | ✅ Full VM | Full control |

---

## Option 1: Render.com (RECOMMENDED) ⭐

**Free Tier Includes:**
- 750 hours/month (enough for 24/7)
- PostgreSQL database (1GB)
- Automatic SSL
- Custom domain support
- Auto-deploy from Git

### Step-by-Step Setup

#### 1.1 Prepare Your Code

First, we need to adapt the app for PostgreSQL (Render doesn't offer free MSSQL):

**Create**: `backend-api/package.json` - Add PostgreSQL:
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "bcryptjs": "^3.0.3",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.3",
    "node-cron": "^4.2.1"
  }
}
```

**Note**: You'll need to create a PostgreSQL adapter or use the existing MSSQL setup with a paid database option.

#### 1.2 Sign Up for Render

1. Go to: https://render.com/
2. Sign up with GitHub (easiest)
3. Authorize Render to access your repositories

#### 1.3 Create PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Name: `supershine-qa-db`
3. Database: `supershine_qa`
4. User: `supershine_user`
5. Region: Choose closest to you
6. Plan: **Free**
7. Click "Create Database"
8. **Save the connection details** (Internal/External URLs)

#### 1.4 Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure:
   ```
   Name: supershine-backend-qa
   Region: Same as database
   Branch: main (or qa)
   Root Directory: backend-api
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```
4. Add Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   DB_HOST=[from Render database internal URL]
   DB_PORT=5432
   DB_DATABASE=supershine_qa
   DB_USER=supershine_user
   DB_PASSWORD=[from Render database]
   JWT_SECRET=[generate random string]
   JWT_EXPIRES_IN=7d
   ```
5. Click "Create Web Service"

#### 1.5 Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   ```
   Name: supershine-frontend-qa
   Branch: main (or qa)
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```
4. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://supershine-backend-qa.onrender.com
   ```
5. Click "Create Static Site"

#### 1.6 Initialize Database

Use Render's SQL console or connect via psql:
```sql
-- Run your schema creation scripts
-- You'll need to convert MSSQL syntax to PostgreSQL
```

#### 1.7 Share with QA

Your QA URL will be:
```
https://supershine-frontend-qa.onrender.com
```

**⚠️ Free Tier Limitations:**
- Services spin down after 15 minutes of inactivity
- First request after inactivity takes 30-60 seconds to wake up
- 750 hours/month (enough for one service 24/7)

---

## Option 2: Railway.app (Easiest Setup) 🚂

**Free Tier Includes:**
- $5 credit/month (enough for light QA usage)
- All databases supported
- Automatic SSL
- Easy deployment

### Step-by-Step Setup

#### 2.1 Sign Up

1. Go to: https://railway.app/
2. Sign up with GitHub
3. Verify email

#### 2.2 Create New Project

1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect your services

#### 2.3 Add Database

1. Click "New" → "Database" → "Add PostgreSQL"
   - Or use "Add MySQL" (closer to MSSQL)
2. Railway provisions database automatically
3. Note the connection variables

#### 2.4 Configure Backend Service

1. Select backend service
2. Add environment variables:
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=[random string]
   ```
3. Set root directory: `backend-api`
4. Deploy

#### 2.5 Configure Frontend Service

1. Select frontend service
2. Add environment variables:
   ```
   REACT_APP_API_URL=${{backend.url}}
   ```
3. Set root directory: `frontend`
4. Deploy

#### 2.6 Get Your URL

Railway provides URLs like:
```
Backend: https://supershine-backend-production.up.railway.app
Frontend: https://supershine-frontend-production.up.railway.app
```

**⚠️ Free Tier Limitations:**
- $5 credit/month (~100-500 hours depending on usage)
- Services sleep after inactivity
- Credit resets monthly

---

## Option 3: Ngrok (Instant, Temporary) ⚡

**Best for**: Quick demos, short testing sessions, immediate access

### Step-by-Step Setup

#### 3.1 Install Ngrok

1. Download from: https://ngrok.com/download
2. Extract to a folder (e.g., `C:\ngrok`)
3. Sign up for free account at: https://dashboard.ngrok.com/signup
4. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

#### 3.2 Authenticate Ngrok

```bash
# Windows Command Prompt
cd C:\ngrok
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 3.3 Start Your Local Application

**Terminal 1 - Backend:**
```bash
cd backend-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Wait for both to start successfully.

#### 3.4 Expose Frontend with Ngrok

**Terminal 3:**
```bash
cd C:\ngrok
ngrok http 3000
```

You'll see output like:
```
Session Status: online
Forwarding: https://abc123def456.ngrok-free.app -> http://localhost:3000
```

#### 3.5 Share with QA

Send the ngrok URL to your QA team:
```
QA Environment: https://abc123def456.ngrok-free.app

Login:
Username: superadmin
Password: admin123

Note: This link is temporary and will change when I restart ngrok.
```

**⚠️ Limitations:**
- URL changes every time you restart ngrok
- Free tier: 1 online ngrok process at a time
- Your computer must stay on
- 40 connections/minute limit
- Session expires after 8 hours

**💡 Ngrok Pro ($8/month) removes these limits and gives you a fixed URL**

---

## Option 4: Oracle Cloud Free Tier (Most Powerful) 💪

**Free Forever Includes:**
- 2 AMD VMs (1/8 OCPU, 1GB RAM each)
- OR 4 ARM VMs (1 OCPU, 6GB RAM each)
- 200GB storage
- Full control like a VPS

### Step-by-Step Setup

#### 4.1 Sign Up

1. Go to: https://www.oracle.com/cloud/free/
2. Sign up (requires credit card for verification, but won't charge)
3. Complete verification

#### 4.2 Create VM Instance

1. Go to: Compute → Instances
2. Click "Create Instance"
3. Configure:
   ```
   Name: qa-supershine
   Image: Ubuntu 22.04
   Shape: VM.Standard.E2.1.Micro (Always Free)
   Network: Create new VCN
   Public IP: Assign
   SSH Keys: Generate or upload
   ```
4. Click "Create"
5. Note the Public IP address

#### 4.3 Configure Firewall

1. Go to: Networking → Virtual Cloud Networks
2. Click your VCN → Security Lists → Default Security List
3. Add Ingress Rules:
   ```
   Port 80 (HTTP): 0.0.0.0/0
   Port 443 (HTTPS): 0.0.0.0/0
   Port 22 (SSH): Your IP only
   ```

#### 4.4 Connect and Setup

```bash
# Connect via SSH
ssh ubuntu@YOUR_ORACLE_VM_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose -y

# Logout and login again for docker group to take effect
exit
ssh ubuntu@YOUR_ORACLE_VM_IP
```

#### 4.5 Deploy Application

```bash
# Clone your repository
git clone <your-repo-url> super-shine-cargo
cd super-shine-cargo

# Create .env file
nano .env
```

Add:
```env
SERVER_IP=YOUR_ORACLE_VM_IP
DB_DATABASE=SuperShineCargoDb
DB_PASSWORD=Strong_QA_Password_123!
JWT_SECRET=$(openssl rand -base64 32)
```

```bash
# Start services
docker-compose up -d

# Wait for services
sleep 60

# Initialize database
docker cp server/config/init-database.sql cargo_db:/tmp/
docker exec cargo_db /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P "Strong_QA_Password_123!" \
  -i /tmp/init-database.sql

# Restart backend
docker restart cargo_backend

# Check status
docker-compose ps
```

#### 4.6 Configure Ubuntu Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 4.7 Share with QA

```
QA Environment: http://YOUR_ORACLE_VM_IP

Login:
Username: superadmin
Password: admin123
```

**✅ Advantages:**
- Completely FREE forever
- Full VM control
- 24/7 uptime
- Professional setup
- No time limits

---

## Option 5: Vercel (Frontend) + Supabase (Backend) 🆓

**Free Tier:**
- Vercel: Unlimited deployments
- Supabase: 500MB database, 2GB bandwidth

### Setup

#### 5.1 Supabase (Database + Backend API)

1. Go to: https://supabase.com/
2. Sign up with GitHub
3. Create new project:
   ```
   Name: supershine-qa
   Database Password: [strong password]
   Region: Choose closest
   ```
4. Wait for database to provision (2-3 minutes)

5. Create tables using SQL Editor:
   - Go to SQL Editor
   - Paste your `init-database.sql` (converted to PostgreSQL syntax)
   - Run

6. Create API endpoints using Supabase Functions or Edge Functions

#### 5.2 Vercel (Frontend)

1. Go to: https://vercel.com/
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   ```
   Framework: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```
6. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-project.supabase.co
   ```
7. Deploy

**Your QA URL:**
```
https://supershine-qa.vercel.app
```

---

## Option 6: GitHub Pages + Free Backend 📄

**For**: Static frontend with external API

### Frontend on GitHub Pages (Free)

```bash
# In your frontend directory
npm install gh-pages --save-dev

# Add to package.json
"homepage": "https://yourusername.github.io/super-shine-cargo",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

# Deploy
npm run deploy
```

### Backend Options:

**A. Glitch.com (Free)**
- Go to: https://glitch.com/
- Create new project
- Import from GitHub
- Free 24/7 hosting
- 4000 requests/hour limit

**B. Cyclic.sh (Free)**
- Go to: https://www.cyclic.sh/
- Connect GitHub
- Deploy backend
- Free tier: 10,000 requests/month

---

## 🎯 My Top 3 FREE Recommendations

### #1: Oracle Cloud Free Tier (Best Overall)

**Why:**
- ✅ Completely free forever
- ✅ Full VM with 1GB RAM
- ✅ Can run Docker + MSSQL
- ✅ 24/7 uptime
- ✅ Professional setup
- ✅ No limitations

**Setup Time**: 1 hour
**QA Access**: `http://YOUR_VM_IP`

**Follow**: Section "Option 4" above for detailed steps

---

### #2: Render.com (Easiest)

**Why:**
- ✅ Super easy setup
- ✅ Auto-deploy from Git
- ✅ Free PostgreSQL database
- ✅ Automatic SSL
- ✅ No credit card required

**Setup Time**: 20 minutes
**QA Access**: `https://your-app.onrender.com`

**Limitation**: Need to convert from MSSQL to PostgreSQL

**Detailed Steps:**

#### Step 1: Sign Up
1. Go to https://render.com/
2. Sign up with GitHub
3. Authorize Render

#### Step 2: Create PostgreSQL Database
1. Dashboard → "New +" → "PostgreSQL"
2. Name: `supershine-qa-db`
3. Database: `supershine_qa`
4. User: `supershine_user`
5. Region: Choose closest
6. Plan: **Free**
7. Click "Create Database"
8. Copy the "Internal Database URL"

#### Step 3: Deploy Backend
1. Dashboard → "New +" → "Web Service"
2. Connect repository
3. Configure:
   ```
   Name: supershine-backend-qa
   Region: Same as database
   Branch: main
   Root Directory: backend-api
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
4. Environment Variables:
   ```
   PORT=5000
   NODE_ENV=production
   DATABASE_URL=[paste Internal Database URL]
   JWT_SECRET=your_random_secret_key_here
   JWT_EXPIRES_IN=7d
   ```
5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. Copy the service URL (e.g., `https://supershine-backend-qa.onrender.com`)

#### Step 4: Initialize Database
1. Go to your database in Render dashboard
2. Click "Connect" → "External Connection"
3. Use a PostgreSQL client or Render's web shell
4. Run your schema creation SQL (converted to PostgreSQL)

#### Step 5: Deploy Frontend
1. Dashboard → "New +" → "Static Site"
2. Connect repository
3. Configure:
   ```
   Name: supershine-frontend-qa
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```
4. Environment Variables:
   ```
   REACT_APP_API_URL=https://supershine-backend-qa.onrender.com
   ```
5. Click "Create Static Site"
6. Wait for build (3-5 minutes)

#### Step 6: Share with QA
```
QA Environment: https://supershine-frontend-qa.onrender.com

Login:
Username: superadmin
Password: admin123

Note: First load may take 30-60 seconds (free tier spins down after inactivity)
```

---

### #3: Ngrok (Quickest for Immediate Testing)

**Why:**
- ✅ Setup in 5 minutes
- ✅ No code changes needed
- ✅ Use your local MSSQL database
- ✅ Perfect for quick demos

**Setup Time**: 5 minutes
**QA Access**: `https://random-url.ngrok-free.app`

**Detailed Steps:**

#### Step 1: Download and Install
1. Go to: https://ngrok.com/download
2. Download for Windows
3. Extract to `C:\ngrok`

#### Step 2: Sign Up and Authenticate
1. Sign up at: https://dashboard.ngrok.com/signup
2. Get your auth token: https://dashboard.ngrok.com/get-started/your-authtoken
3. Run:
   ```bash
   cd C:\ngrok
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

#### Step 3: Start Your Application Locally

**Terminal 1 - Backend:**
```bash
cd backend-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Wait for both to start (backend on port 5000, frontend on port 3000)

#### Step 4: Expose with Ngrok

**Terminal 3:**
```bash
cd C:\ngrok
ngrok http 3000
```

You'll see:
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

#### Step 5: Share with QA

```
QA Environment: https://abc123.ngrok-free.app

Login:
Username: superadmin
Password: admin123

⚠️ Important:
- This link is active only while my computer is on
- Link will change if I restart ngrok
- I'll send new link if it changes
```

**💡 Pro Tips:**
- Keep your laptop plugged in and prevent sleep
- Use a stable internet connection
- Consider ngrok paid plan ($8/month) for fixed URL

---

## Option 7: Combination Approach (Smart & Free)

### Frontend: Vercel (Free)
- Deploy frontend to Vercel
- Free SSL, CDN, unlimited bandwidth
- URL: `https://supershine-qa.vercel.app`

### Backend: Render.com (Free)
- Deploy backend to Render
- Free 750 hours/month
- URL: `https://supershine-backend.onrender.com`

### Database: Choose One
- **Supabase**: Free PostgreSQL (500MB)
- **PlanetScale**: Free MySQL (5GB)
- **ElephantSQL**: Free PostgreSQL (20MB)
- **Clever Cloud**: Free PostgreSQL (256MB)

### Setup Steps:

#### 1. Deploy Backend to Render
```bash
# Follow Render.com steps above for backend only
```

#### 2. Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: supershine-qa
# - Directory: ./
# - Override settings? No

# Set environment variable
vercel env add REACT_APP_API_URL production
# Enter: https://supershine-backend.onrender.com

# Deploy to production
vercel --prod
```

#### 3. Share URL
```
QA Environment: https://supershine-qa.vercel.app
```

---

## Database Conversion: MSSQL to PostgreSQL

Since most free tiers offer PostgreSQL/MySQL, here's a quick conversion guide:

### Key Differences:

| MSSQL | PostgreSQL |
|-------|------------|
| `VARCHAR(50)` | `VARCHAR(50)` ✅ Same |
| `DATETIME` | `TIMESTAMP` |
| `BIT` | `BOOLEAN` |
| `GETDATE()` | `NOW()` |
| `TOP 10` | `LIMIT 10` |
| `[TableName]` | `"TableName"` |

### Conversion Tool:
Use this online tool: https://www.sqlines.com/online

Or I can help you convert your `init-database.sql` script.

---

## Quick Comparison Table

| Feature | Oracle Cloud | Render.com | Ngrok | Railway |
|---------|--------------|------------|-------|---------|
| **Cost** | FREE | FREE | FREE | FREE ($5 credit) |
| **Setup** | 1 hour | 20 min | 5 min | 15 min |
| **Database** | MSSQL ✅ | PostgreSQL | Local MSSQL ✅ | Any |
| **Uptime** | 24/7 | 24/7 | While PC on | 24/7 |
| **URL** | Fixed IP | Fixed URL | Changes | Fixed URL |
| **SSL** | Manual | Auto | Auto | Auto |
| **Best For** | Long-term | Easy setup | Quick test | Balanced |

---

## My Recommendation for Your Situation

### If you want ZERO cost and can keep PC on:
→ **Use Ngrok** (5 minutes setup)
- No code changes needed
- Keep using MSSQL
- Perfect for short-term QA cycles

### If you want professional 24/7 QA environment:
→ **Use Oracle Cloud Free Tier** (1 hour setup)
- Completely free forever
- Full VM control
- Can use Docker + MSSQL
- Professional and reliable

### If you want easiest setup:
→ **Use Render.com** (20 minutes setup)
- Super simple
- Auto-deploy from Git
- Need to convert to PostgreSQL

---

## Step-by-Step: Ngrok (Recommended for Quick Start)

Since you want free and quick, here's the complete Ngrok setup:

### 1. Download Ngrok
```
https://ngrok.com/download
```

### 2. Install and Authenticate
```bash
# Extract to C:\ngrok
cd C:\ngrok

# Sign up and get token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 3. Start Your App
```bash
# Terminal 1
cd path\to\backend-api
npm run dev

# Terminal 2
cd path\to\frontend
npm start
```

### 4. Expose with Ngrok
```bash
# Terminal 3
cd C:\ngrok
ngrok http 3000
```

### 5. Share the URL
Copy the `https://xxxxx.ngrok-free.app` URL and share with QA team.

**That's it!** Your QA team can now access the application from anywhere.

---

## Need Help Converting to PostgreSQL?

If you choose Render.com or Railway and need help converting your MSSQL database to PostgreSQL, I can:

1. Convert your `init-database.sql` script
2. Update your repository code to use PostgreSQL
3. Create migration scripts
4. Test the conversion

Just let me know!

---

## Summary

**Fastest & Easiest (5 min)**: Ngrok
- ✅ No code changes
- ✅ Keep MSSQL
- ❌ Computer must stay on
- ❌ URL changes

**Most Professional (1 hour)**: Oracle Cloud
- ✅ Free forever
- ✅ Full control
- ✅ 24/7 uptime
- ❌ Requires server management

**Easiest Cloud (20 min)**: Render.com
- ✅ Auto-deploy
- ✅ 24/7 uptime
- ❌ Need PostgreSQL conversion

**Which one would you like to proceed with?** I can provide detailed setup assistance for any option!
