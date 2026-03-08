# Super Shine Cargo Service Management System

A comprehensive cargo management system for Super Shine Cargo Service in Sri Lanka, built with Node.js, React, and SQL Server.

## 🚀 Features

### User Roles
- **Super Admin** - Full system access including user management and financial oversight
- **Admin** - Operational management without user administration
- **Manager** - Customer and job management with invoicing capabilities
- **User** - Limited access to assigned jobs and petty cash

### Core Modules
- **Dashboard** - Real-time operational and financial overview
- **Customer Manh contact persons
- **Job Management** - Shipment tracking with status workflow
- **Invoicing** - Automated billing with credit period tracking and overdue alerts
- **Petty Cash** - Assignment and settlement workflow with detailed tracking
- **Accounting** - Comprehensive financial reporting (Super Admin only)
- **User Management** - Role-based access control (Super Admin only)

### Key Features
- Clean Architecture with SOLID principles
- Role-based access control
- Automated overdue invoice detection
- Petty cash workflow with settlement tracking
- Professional UI with responsive design
- Real-time financial dashboards
- Credit period management
- Pay item templates by category

## 📋 Prerequisites

- Node.js v14 or higher
- SQL Server Express 2019 or higher
- SQL Server Management Studio (SSMS)
- Git

## 🛠️ Quick Start

### For New Developers

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd super-shine-cargo
   ```

2. **Setup Database**
](DATABASE_SETUP.md)
   - Quick summary:
     - Install SQL Server Express
     - Enable TCP/IP on port 1433
     - Run database setup scripts
     - Create Super Admin user

3. **Setup Backend**
   ```bash
   cd backend-api
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   node src/index.js
   ```

4. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

5. **Login**
   - Open http://localhost:3000
   - Username: `admin`
   - Password: `admin123`

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup instructions
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database configuration guide
- **[CLEAN_ARCHITECTURE.md](backend-api/CLEAN_ARCHITECTURE.md)** - Architecture documentation

## 🏗️ Project Structure

```
super-shine-cargo/
├── backend-api/          # Node.js backend (Clean Architecture)
│   ├── src/
│   │   ├── application/  # Use cases (business logic)
│   │   ├── domain/       # Entities and interfaces
│   │   ├── infrastructure/ # Repositories
│   │   ├── presentation/ # Controllers and routes
│   │   ├── middleware/   # Authentication
│   │   └── config/       # Database and migrations
│   └── package.json
│
├── frontend/             # React frontend
│   ├── src/
│   │   ├── api/         # API services
│   │   ├── components/  # React components
│   │   ├── context/     # Auth context
│   │   └── styles/      # CSS files
│   └── package.json
│
├── SETUP_GUIDE.md       # Detailed setup guide
├── DATABASE_SETUP.md    # Database setup guide
└── README.md           # This file
```

## 🔧 Technology Stack

### Backend
- Node.js with Express
- SQL Server (MSSQL)
- JWT Authentication
- Clean Architecture pattern
- Node-cron for scheduled tasks

### Frontend
- React 18
- React Router v6
- Context API for state management
- Fetch API for HTTP requests
- Professional CSS styling

## 🔐 Security

- JWT-based authentication
- Role-based access control
- SQL injection prevention
- Environment variable configuration
- Password encryption (recommended for production)

## 📊 Database Schema

Main tables:
- Users - System users with roles
- Customers - Customer information with contact persons
- Jobs - Shipment jobs with status tracking
- Bills - Invoices with payment tracking
- PettyCashAssignments - Petty cash workflow
- PayItemTemplates - Reusable pay items by category

## 🚦 API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- GET `/api/auth/users` - Get all users (Admin+)
- Ph/register` - Create user (Super Admin)

### Customers
- GET `/api/customers` - Get all customers
- POST `/api/customers` - Create customer
- PUT `/api/customers/:id` - Update customer (Admin+)
- DELETE `/api/customers/:id` - Deactivate customer (Admin+)

### Jobs
- GET `/api/jobs` - Get all jobs
- POST `/api/jobs` - Create job
- PUT `/api/jobs/:id/status` - Update job status
- POST `/api/jobs/:id/assign` - Assign job to user

### Billing
- GET `/api/billing` - Get all bills
- POST `/api/billing` - Cre(Admin+)
- PATCH `/api/billing/:id/pay` - Mark as paid (Admin+)

### Petty Cash
- GET `/api/petty-cash-assignments` - Get assignments
- POST `/api/petty-cash-assignments` - Create assignment (Admin+)
- POST `/api/petty-cash-assignments/:id/settle` - Settle assignment

### Accounting
- GET `/api/accounting/dashboard` - Get financial dashboard (Super Admin)

## 🎨 UI Theme

- Primary Color: Navy Blue (#101036)
- Professional, clean design
- Responsive layout for mobile and desktop
- Consistent color scheme throughout

## 📝 Default Credentials

**Super Admin:**
- Username: `admin`
- Password: `admin123`

⚠️ **Change password immediately after first login!**

## 🐛 Troubleshooting

See [SETUP_GUIDE.md](SETUP_GUIDE.md#troubleshooting) for common issues and solutions.

## 📞 Support

For setup issues or questions:
1. Check the documentation files
2. Review error logs in console
3. Verify database connection
4. Contact the development team

## 🔄 Version History

- **v2.0.0** (March 2026)
  - Added Manager role
nted Accounting dashboard
  - Added credit period tracking
  - Enhanced petty cash workflow
  - Improved UI/UX

- **v1.0.0** (Initial Release)
  - Core functionality
  - User management
  - Customer and job management
  - Basic invoicing

## 📄 License

Proprietary - Super Shine Cargo Service

---

**Developed for Super Shine Cargo Service, Sri Lanka**

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)
