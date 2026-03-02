# Super Shine Cargo Service - Backend API

Node.js/Express REST API for Super Shine Cargo Service management system.

## Features

- RESTful API architecture
- JWT authentication
- Role-based access control
- SQL Server database integration
- Comprehensive error handling

## Tech Stack

- Node.js
- Express.js
- MSSQL (Microsoft SQL Server)
- JWT for authentication
- bcrypt for password hashing

## Project Structure

```
backend-api/
├── src/
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   └── init-database.sql  # Database schema
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js            # Authentication & user management
│   │   ├── customers.js       # Customer management
│   │   ├── jobs.js            # Job management
│   │   ├── billing.js         # Billing & invoicing
│   │   └── pettyCash.js       # Petty cash tracking
│   └── index.js               # Application entry point
├── .env                       # Environment configuration
├── .env.example
└── package.json
```

## Installation

```bash
npm install
```

## Database Setup

1. Ensure SQL Server Express is running on localhost:53181
2. Create database: `SuperShineCargoDb`
3. Run the SQL script: `src/config/init-database.sql`

The script creates:
- Users table (with default superadmin user)
- Customers table
- Jobs table
- PayItems table
- Bills table
- BillItems table
- PettyCash table
- PettyCashBalance table

## Configuration

Create a `.env` file (or use the existing one):

```env
PORT=5000
NODE_ENV=development

DB_SERVER=localhost
DB_PORT=53181
DB_DATABASE=SuperShineCargoDb
DB_USER=sa
DB_PASSWORD=your_password
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server runs on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Create new user (Super Admin only)
- `GET /api/auth/users` - List all users (Super Admin only)
- `PUT /api/auth/users/:id` - Update user (Super Admin only)
- `DELETE /api/auth/users/:id` - Delete user (Super Admin only)

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Jobs
- `GET /api/jobs` - List all jobs
- `POST /api/jobs` - Create job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/assign` - Assign job to user

### Billing
- `GET /api/billing/pay-items` - List pay items
- `POST /api/billing/pay-items` - Create pay item
- `PUT /api/billing/pay-items/:id` - Update pay item
- `DELETE /api/billing/pay-items/:id` - Delete pay item
- `GET /api/billing/bills` - List all bills
- `POST /api/billing/bills` - Create bill
- `GET /api/billing/bills/:id` - Get bill details

### Petty Cash
- `GET /api/petty-cash` - List petty cash entries
- `POST /api/petty-cash` - Create petty cash entry
- `GET /api/petty-cash/balance` - Get current balance
- `POST /api/petty-cash/balance` - Update balance

## Authentication

All endpoints (except login) require JWT token in header:
```
Authorization: Bearer <token>
```

## User Roles

- **Super Admin** - Full access to all features
- **Admin** - Manage customers, jobs, billing, petty cash
- **User** - View assigned jobs, manage petty cash

## Default User

- Username: superadmin
- Password: admin123
- Role: Super Admin

## Error Handling

API returns consistent error responses:
```json
{
  "message": "Error description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Role-based access control
- SQL injection prevention with parameterized queries
- CORS enabled for frontend communication
