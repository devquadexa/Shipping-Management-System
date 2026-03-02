# Super Shine Cargo Service - Management System

A comprehensive cargo shipping management system built with **Clean Architecture** and **SOLID** principles for Super Shine Cargo Service in Sri Lanka.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- SQL Server Express (running on port 53181)
- Database: SuperShineCargoDb

### Installation

1. **Clone the repository**
   ```powershell
   cd "Shipping Management System"
   ```

2. **Install Backend Dependencies**
   ```powershell
   cd backend-api
   npm install
   ```

3. **Install Frontend Dependencies**
   ```powershell
   cd ../frontend
   npm install
   ```

4. **Configure Environment**
   
   Backend `.env` file (`backend-api/.env`):
   ```env
   PORT=5000
   DB_SERVER=localhost
   DB_PORT=53181
   DB_NAME=SuperShineCargoDb
   DB_USER=SUPER_SHINE_CARGO
   DB_PASSWORD=1234SuperShineDB
   JWT_SECRET=your_jwt_secret_key_here
   ```

   Frontend `.env` file (`frontend/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

5. **Start the Application**

   Terminal 1 - Backend:
   ```powershell
   cd backend-api
   npm start
   ```

   Terminal 2 - Frontend:
   ```powershell
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Default Login: `superadmin` / `admin123`

---

## 📚 Documentation

### Essential Guides
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database setup and configuration
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[CLEAN_ARCHITECTURE_COMPLETE.md](CLEAN_ARCHITECTURE_COMPLETE.md)** - Complete Clean Architecture guide
- **[TESTING_CLEAN_ARCHITECTURE.md](TESTING_CLEAN_ARCHITECTURE.md)** - Testing guide and API examples

### Architecture & Planning
- **[OLD_ROUTES_REMOVED.md](OLD_ROUTES_REMOVED.md)** - Clean Architecture migration record
- **[SAAS_ARCHITECTURE.md](SAAS_ARCHITECTURE.md)** - SaaS transformation plan
- **[SAAS_CHECKLIST.md](SAAS_CHECKLIST.md)** - SaaS implementation checklist

---

## 🏗️ Architecture

This system follows **Clean Architecture** with complete separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  Controllers, Routes, HTTP, API                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Use Cases, Business Logic                                  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  Entities, Repository Interfaces, Business Rules            │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  Database, External Services, SQL Queries                   │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ SQL queries isolated in repository layer only
- ✅ Easy to test with mock repositories
- ✅ Easy to customize per client
- ✅ Easy to switch databases
- ✅ SOLID principles applied throughout

---

## 🎯 Features

### User Management
- Three user roles: Super Admin, Admin, User
- JWT-based authentication
- Role-based access control

### Customer Management
- Create, view, update, delete customers
- Customer registration tracking
- Email and phone validation

### Job Management
- Create and assign shipping jobs
- Track job status (Open, In Transit, Completed, Cancelled)
- Add pay items to jobs
- Origin and destination tracking
- Weight and shipping cost management

### Billing
- Generate bills for jobs
- Automatic tax calculation (10%)
- Payment status tracking
- Mark bills as paid/unpaid

### Petty Cash Management
- Track income and expense entries
- Real-time balance calculation
- Job-linked expenses
- User-specific entry tracking

---

## 🔐 User Roles & Permissions

### Super Admin
- Full system access
- User management
- All CRUD operations

### Admin
- Manage customers, jobs, billing, petty cash
- Cannot manage users
- Full access to business operations

### User
- View assigned jobs only
- Manage petty cash entries
- Limited access

---

## 📱 Technology Stack

### Frontend
- React.js
- Context API for state management
- Axios for API calls
- Responsive CSS (mobile-first)
- Navy Blue theme (#101036)

### Backend
- Node.js + Express.js
- Clean Architecture + SOLID principles
- JWT authentication
- SQL Server (MSSQL)
- Dependency Injection

---

## 🗄️ Database

**Server:** SQL Server Express  
**Port:** 53181  
**Database:** SuperShineCargoDb  
**Credentials:** SUPER_SHINE_CARGO / 1234SuperShineDB

### Tables
- Users
- Customers
- Jobs
- PayItems
- Bills
- PettyCash
- PettyCashBalance

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for complete schema and setup instructions.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users

### Customers
- `POST /api/customers` - Create customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `PATCH /api/jobs/:id/status` - Update job status
- `PATCH /api/jobs/:id/assign` - Assign job to user
- `POST /api/jobs/:id/pay-items` - Add pay item

### Billing
- `POST /api/billing` - Create bill
- `GET /api/billing` - Get all bills
- `GET /api/billing/:id` - Get bill by ID
- `PATCH /api/billing/:id/pay` - Mark bill as paid

### Petty Cash
- `POST /api/petty-cash` - Create entry
- `GET /api/petty-cash` - Get all entries
- `GET /api/petty-cash/balance` - Get balance

---

## 🧪 Testing

See [TESTING_CLEAN_ARCHITECTURE.md](TESTING_CLEAN_ARCHITECTURE.md) for:
- API testing with PowerShell
- Frontend testing checklist
- Role-based access testing
- Common issues and solutions

---

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production build instructions
- Environment configuration
- Server setup
- Database migration
- Security considerations

---

## 🎓 Clean Architecture Benefits

### Problem Solved: Client-Specific Customization

**Example:** Some clients need TIN field, others don't.

**Before (Tightly Coupled):**
```javascript
// SQL hard-coded everywhere ❌
router.post('/customers', async (req, res) => {
  await pool.request()
    .input('tin', sql.VarChar, req.body.tin)
    .query(`INSERT INTO Customers (..., TIN, ...) VALUES (...)`);
});
```

**After (Clean Architecture):**
```javascript
// Business logic unchanged ✅
class CreateCustomer {
  async execute(customerData) {
    return await this.customerRepository.create(customerData);
  }
}

// Client-specific repository ✅
class ClientBCustomerRepository extends MSSQLCustomerRepository {
  async create(customer) {
    const { tin, ...customerWithoutTin } = customer;
    return super.create(customerWithoutTin);
  }
}
```

**Result:** Client-specific changes in ONE place only!

---

## 📂 Project Structure

```
Shipping Management System/
├── backend-api/                 # Backend (Clean Architecture)
│   ├── src/
│   │   ├── domain/              # Entities & Repository Interfaces
│   │   ├── application/         # Use Cases (Business Logic)
│   │   ├── infrastructure/      # Repositories & Database
│   │   ├── presentation/        # Controllers & Routes
│   │   ├── middleware/          # Auth middleware
│   │   ├── config/              # Database config
│   │   └── index.js             # Entry point
│   ├── .env                     # Environment variables
│   └── package.json
│
├── frontend/                    # Frontend (React)
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── context/             # Auth context
│   │   ├── api/                 # API services
│   │   └── styles/              # CSS files
│   ├── public/
│   ├── .env                     # Environment variables
│   └── package.json
│
└── Documentation/               # All .md files
    ├── README.md                # This file
    ├── DATABASE_SETUP.md
    ├── DEPLOYMENT.md
    ├── CLEAN_ARCHITECTURE_COMPLETE.md
    ├── TESTING_CLEAN_ARCHITECTURE.md
    ├── OLD_ROUTES_REMOVED.md
    ├── SAAS_ARCHITECTURE.md
    └── SAAS_CHECKLIST.md
```

---

## 🔧 Development

### Backend Development
```powershell
cd backend-api
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```powershell
cd frontend
npm start  # React development server
```

### Adding New Features

Follow Clean Architecture pattern:

1. **Create Domain Entity** (`domain/entities/`)
2. **Create Repository Interface** (`domain/repositories/`)
3. **Create Use Cases** (`application/use-cases/`)
4. **Create Repository Implementation** (`infrastructure/repositories/`)
5. **Create Controller** (`presentation/controllers/`)
6. **Create Routes** (`presentation/routes/`)
7. **Register in DI Container** (`infrastructure/di/container.js`)

See [CLEAN_ARCHITECTURE_COMPLETE.md](CLEAN_ARCHITECTURE_COMPLETE.md) for detailed examples.

---

## 🌐 Currency & Localization

- **Currency:** Sri Lankan Rupees (LKR)
- **Location:** Sri Lanka
- **Language:** English
- **Date Format:** ISO 8601

---

## 🔮 Future Plans

See [SAAS_ARCHITECTURE.md](SAAS_ARCHITECTURE.md) for:
- Multi-tenant SaaS transformation
- White-label customization
- Pricing tiers
- Revenue projections
- 10-month implementation roadmap

---

## 📞 Support

For issues or questions:
1. Check [TESTING_CLEAN_ARCHITECTURE.md](TESTING_CLEAN_ARCHITECTURE.md) for common issues
2. Review [CLEAN_ARCHITECTURE_COMPLETE.md](CLEAN_ARCHITECTURE_COMPLETE.md) for architecture questions
3. Check [DATABASE_SETUP.md](DATABASE_SETUP.md) for database issues

---

## 📄 License

ISC

---

## ✅ System Status

- ✅ Clean Architecture implemented
- ✅ SOLID principles applied
- ✅ All modules migrated
- ✅ Old routes removed
- ✅ SQL queries isolated in repositories
- ✅ Ready for production
- ✅ Ready for client-specific customization
- ✅ Ready for SaaS transformation

---

**Built with ❤️ for Super Shine Cargo Service**
