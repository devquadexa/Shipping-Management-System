# SaaS Architecture - Multi-Tenant Cargo Management System

## 🎯 Business Model

### Target Market
- Small to medium cargo companies in Sri Lanka and globally
- 10-500 employees per company
- Need for modern, mobile-friendly cargo management

### Pricing Tiers (Suggested)
1. **Starter** - $49/month
   - Up to 5 users
   - 100 jobs/month
   - Basic features
   
2. **Professional** - $149/month
   - Up to 20 users
   - 500 jobs/month
   - All features + API access
   
3. **Enterprise** - Custom pricing
   - Unlimited users
   - Unlimited jobs
   - Custom features + White-label

## 🏗️ Recommended Architecture

### Current Structure (Monolithic)
```
shipping-management-system/
├── client/          # Frontend (React)
├── server/          # Backend (Node.js)
└── database/        # SQL Server
```

### Proposed Structure (Decoupled SaaS)
```
cargo-saas-platform/
├── frontend/                    # Separate React App
│   ├── public/
│   ├── src/
│   └── package.json
│
├── backend-api/                 # Separate Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── config/
│   ├── tests/
│   └── package.json
│
├── database/                    # Database Scripts
│   ├── migrations/
│   ├── seeds/
│   └── schemas/
│
├── shared/                      # Shared Types/Utilities
│   ├── types/
│   └── constants/
│
├── admin-portal/               # Tenant Management
│   └── (Separate admin app)
│
└── docs/                       # API Documentation
    ├── api-docs/
    └── user-guides/
```

## 🔄 Decoupling Strategy

### Phase 1: Separate Repositories (Recommended)

#### Repository 1: Frontend
```
cargo-management-frontend/
├── public/
├── src/
│   ├── api/              # API client layer
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── utils/
│   └── config/
├── .env.example
├── package.json
└── README.md
```

**Benefits:**
- Independent deployment
- Different teams can work separately
- Version control per component
- Easier to white-label for clients

#### Repository 2: Backend API
```
cargo-management-api/
├── src/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customers.routes.js
│   │   ├── jobs.routes.js
│   │   ├── billing.routes.js
│   │   └── pettycash.routes.js
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── tenant.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── models/
│   ├── config/
│   │   ├── database.js
│   │   └── app.config.js
│   └── utils/
├── tests/
├── docs/
│   └── api-documentation.md
├── .env.example
├── package.json
└── README.md
```

**Benefits:**
- RESTful API can serve multiple frontends
- Mobile app can use same API
- Third-party integrations possible
- API versioning easier

#### Repository 3: Database Scripts
```
cargo-management-database/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_tenants.sql
│   └── 003_add_subscriptions.sql
├── seeds/
│   └── default_data.sql
├── stored-procedures/
├── functions/
└── README.md
```

### Phase 2: Multi-Tenancy Implementation

#### Database Strategy Options

**Option A: Separate Database per Tenant (Recommended for SaaS)**
```
Tenant1: SuperShineCargoDb
Tenant2: FastCargoDb
Tenant3: ExpressLogisticsDb
```

**Pros:**
- Complete data isolation
- Easy backup/restore per client
- Custom schema per client
- Better security
- Easier compliance (GDPR, etc.)

**Cons:**
- More databases to manage
- Higher infrastructure cost
- Complex migrations

**Option B: Shared Database with Tenant ID**
```sql
-- Add TenantId to all tables
ALTER TABLE Users ADD TenantId VARCHAR(50) NOT NULL;
ALTER TABLE Customers ADD TenantId VARCHAR(50) NOT NULL;
ALTER TABLE Jobs ADD TenantId VARCHAR(50) NOT NULL;
-- etc.

-- Row-level security
CREATE FUNCTION dbo.fn_TenantAccessPredicate(@TenantId VARCHAR(50))
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_TenantAccessPredicate_result
WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS VARCHAR(50));
```

**Pros:**
- Single database to manage
- Lower infrastructure cost
- Easier migrations
- Shared resources

**Cons:**
- Risk of data leakage
- Complex queries
- Harder to scale
- Compliance challenges

**Option C: Hybrid (Schema per Tenant)**
```
Database: CargoSaaS
├── Schema: tenant_supershine
├── Schema: tenant_fastcargo
└── Schema: tenant_express
```

### Phase 3: Tenant Management

#### New Tables Required

```sql
-- Tenants Table
CREATE TABLE Tenants (
    TenantId VARCHAR(50) PRIMARY KEY,
    CompanyName VARCHAR(200) NOT NULL,
    Subdomain VARCHAR(100) UNIQUE NOT NULL,
    CustomDomain VARCHAR(200) NULL,
    DatabaseName VARCHAR(100) NOT NULL,
    SubscriptionTier VARCHAR(50) NOT NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    CreatedDate DATETIME DEFAULT GETDATE(),
    ExpiryDate DATETIME NULL,
    MaxUsers INT DEFAULT 5,
    MaxJobs INT DEFAULT 100,
    Features NVARCHAR(MAX), -- JSON
    BrandingConfig NVARCHAR(MAX), -- JSON (logo, colors, etc.)
    ContactEmail VARCHAR(200),
    ContactPhone VARCHAR(50)
);

-- Subscriptions Table
CREATE TABLE Subscriptions (
    SubscriptionId VARCHAR(50) PRIMARY KEY,
    TenantId VARCHAR(50) NOT NULL,
    PlanName VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    BillingCycle VARCHAR(50), -- Monthly, Yearly
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NULL,
    Status VARCHAR(50) DEFAULT 'Active',
    AutoRenew BIT DEFAULT 1,
    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Usage Tracking
CREATE TABLE UsageMetrics (
    MetricId VARCHAR(50) PRIMARY KEY,
    TenantId VARCHAR(50) NOT NULL,
    MetricType VARCHAR(50), -- Users, Jobs, Storage, API Calls
    MetricValue INT NOT NULL,
    RecordedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);

-- Audit Log
CREATE TABLE AuditLog (
    LogId VARCHAR(50) PRIMARY KEY,
    TenantId VARCHAR(50) NOT NULL,
    UserId VARCHAR(50),
    Action VARCHAR(100) NOT NULL,
    EntityType VARCHAR(50),
    EntityId VARCHAR(50),
    Details NVARCHAR(MAX),
    IpAddress VARCHAR(50),
    Timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (TenantId) REFERENCES Tenants(TenantId)
);
```

## 🔐 Authentication & Authorization

### Multi-Tenant Auth Flow

```javascript
// Tenant identification strategies

// 1. Subdomain-based
// supershine.cargosaas.com
// fastcargo.cargosaas.com

// 2. Custom domain
// app.supershine.lk
// app.fastcargo.lk

// 3. Path-based
// cargosaas.com/supershine
// cargosaas.com/fastcargo

// Middleware
const tenantMiddleware = async (req, res, next) => {
  // Extract tenant from subdomain
  const subdomain = req.hostname.split('.')[0];
  
  // Or from custom domain
  const customDomain = req.hostname;
  
  // Fetch tenant info
  const tenant = await getTenantBySubdomain(subdomain);
  
  if (!tenant || tenant.status !== 'Active') {
    return res.status(403).json({ message: 'Tenant not found or inactive' });
  }
  
  // Check subscription
  if (tenant.expiryDate && new Date() > new Date(tenant.expiryDate)) {
    return res.status(402).json({ message: 'Subscription expired' });
  }
  
  // Attach tenant to request
  req.tenant = tenant;
  
  // Set database context
  await setDatabaseContext(tenant.databaseName);
  
  next();
};
```

## 🎨 White-Label Customization

### Frontend Customization

```javascript
// config/branding.js
export const getBranding = (tenantId) => {
  return {
    companyName: tenant.companyName,
    logo: tenant.brandingConfig.logo,
    primaryColor: tenant.brandingConfig.primaryColor,
    secondaryColor: tenant.brandingConfig.secondaryColor,
    favicon: tenant.brandingConfig.favicon,
    customCSS: tenant.brandingConfig.customCSS
  };
};

// App.js
const App = () => {
  const [branding, setBranding] = useState(null);
  
  useEffect(() => {
    // Fetch branding based on subdomain
    const subdomain = window.location.hostname.split('.')[0];
    fetchBranding(subdomain).then(setBranding);
  }, []);
  
  return (
    <ThemeProvider theme={branding}>
      <Router>
        {/* App content */}
      </Router>
    </ThemeProvider>
  );
};
```

## 📡 API Design

### RESTful API Structure

```
Base URL: https://api.cargosaas.com/v1

Authentication:
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/logout

Customers:
GET    /customers
POST   /customers
GET    /customers/:id
PUT    /customers/:id
DELETE /customers/:id

Jobs:
GET    /jobs
POST   /jobs
GET    /jobs/:id
PUT    /jobs/:id
PATCH  /jobs/:id/status
POST   /jobs/:id/pay-items
PATCH  /jobs/:id/assign

Billing:
GET    /billing
POST   /billing
GET    /billing/:id
PATCH  /billing/:id/pay

Petty Cash:
GET    /petty-cash
POST   /petty-cash
GET    /petty-cash/balance

Users:
GET    /users
POST   /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id

Tenants (Admin only):
GET    /tenants
POST   /tenants
GET    /tenants/:id
PUT    /tenants/:id
PATCH  /tenants/:id/status

Subscriptions:
GET    /subscriptions
POST   /subscriptions
GET    /subscriptions/:id
PUT    /subscriptions/:id

Reports:
GET    /reports/dashboard
GET    /reports/jobs
GET    /reports/revenue
GET    /reports/usage
```

### API Versioning

```javascript
// v1/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/customers', require('./customers.routes'));
router.use('/jobs', require('./jobs.routes'));
// etc.

module.exports = router;

// server.js
app.use('/api/v1', require('./v1/routes'));
app.use('/api/v2', require('./v2/routes')); // Future version
```

## 🚀 Deployment Architecture

### Microservices Approach (Advanced)

```
┌─────────────────┐
│   Load Balancer │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Web 1 │ │ Web 2 │  (Frontend - Static)
└───────┘ └───────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ API 1 │ │ API 2 │  (Backend - Node.js)
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────┐
│  Database Pool  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ DB 1  │ │ DB 2  │  (Per Tenant)
└───────┘ └───────┘
```

### Container Strategy

```yaml
# docker-compose.saas.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=https://api.cargosaas.com
    depends_on:
      - api
  
  api:
    build: ./backend-api
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=sqlserver
    depends_on:
      - sqlserver
    deploy:
      replicas: 3  # Scale API instances
  
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${DB_PASSWORD}
    volumes:
      - sqldata:/var/opt/mssql
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
  
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - frontend
      - api

volumes:
  sqldata:
```

## 💰 Monetization Features

### Usage Tracking

```javascript
// Track API calls
const usageTracker = async (req, res, next) => {
  const tenant = req.tenant;
  
  // Increment API call count
  await incrementUsage(tenant.tenantId, 'API_CALLS');
  
  // Check limits
  const usage = await getUsage(tenant.tenantId);
  if (usage.apiCalls > tenant.maxApiCalls) {
    return res.status(429).json({ 
      message: 'API limit exceeded. Please upgrade your plan.' 
    });
  }
  
  next();
};

// Track job creation
const trackJobCreation = async (tenantId) => {
  await incrementUsage(tenantId, 'JOBS_CREATED');
  
  const usage = await getUsage(tenantId);
  const limit = await getLimit(tenantId, 'JOBS');
  
  if (usage.jobsCreated >= limit) {
    throw new Error('Job limit reached. Please upgrade your plan.');
  }
};
```

### Billing Integration

```javascript
// Stripe integration example
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createSubscription = async (tenantId, planId) => {
  const tenant = await getTenant(tenantId);
  
  const subscription = await stripe.subscriptions.create({
    customer: tenant.stripeCustomerId,
    items: [{ price: planId }],
    metadata: { tenantId }
  });
  
  await updateTenantSubscription(tenantId, subscription);
  
  return subscription;
};
```

## 📊 Admin Portal Features

### Super Admin Dashboard
- Tenant management
- Subscription management
- Usage analytics
- Revenue reports
- System health monitoring
- Support tickets

### Tenant Admin Dashboard
- User management
- Branding customization
- Subscription details
- Usage statistics
- Billing history
- Support

## 🔒 Security Enhancements

### Data Isolation
```javascript
// Ensure tenant isolation in all queries
const getCustomers = async (tenantId) => {
  return await db.query(
    'SELECT * FROM Customers WHERE TenantId = @tenantId',
    { tenantId }
  );
};

// Middleware to enforce tenant context
const enforceTenantContext = (req, res, next) => {
  // Ensure all queries include tenant filter
  req.db = createTenantScopedDb(req.tenant.tenantId);
  next();
};
```

### Rate Limiting per Tenant
```javascript
const rateLimit = require('express-rate-limit');

const createTenantLimiter = (tenant) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: tenant.subscriptionTier === 'Enterprise' ? 1000 : 100,
    keyGenerator: (req) => req.tenant.tenantId
  });
};
```

## 📈 Scalability Considerations

### Horizontal Scaling
- Load balancer (Nginx, AWS ALB)
- Multiple API instances
- Database read replicas
- Redis for session/cache
- CDN for static assets

### Vertical Scaling
- Upgrade server resources
- Database optimization
- Query caching
- Connection pooling

## 🎯 Migration Path

### Step 1: Restructure Current Code (Week 1-2)
1. Separate frontend and backend repos
2. Create API client layer in frontend
3. Standardize API responses
4. Add API documentation

### Step 2: Add Multi-Tenancy (Week 3-4)
1. Add Tenants table
2. Implement tenant middleware
3. Add TenantId to all tables
4. Test data isolation

### Step 3: White-Label Support (Week 5-6)
1. Add branding configuration
2. Dynamic theming in frontend
3. Subdomain routing
4. Custom domain support

### Step 4: Admin Portal (Week 7-8)
1. Build tenant management UI
2. Subscription management
3. Usage tracking
4. Billing integration

### Step 5: Production Deployment (Week 9-10)
1. Set up infrastructure
2. Deploy first tenant
3. Testing and optimization
4. Go-live

## 📝 Recommended Next Steps

1. **Immediate (This Week)**
   - Create separate Git repositories
   - Set up API documentation
   - Plan database migration strategy

2. **Short Term (This Month)**
   - Implement tenant middleware
   - Add multi-tenancy to database
   - Create admin portal mockups

3. **Medium Term (Next 3 Months)**
   - Build admin portal
   - Implement billing
   - Add usage tracking
   - Beta testing with 2-3 clients

4. **Long Term (6+ Months)**
   - Mobile app development
   - Advanced analytics
   - Third-party integrations
   - International expansion

---

**Recommendation:** Start with **separate repositories** and **database-per-tenant** approach for maximum flexibility and security. This positions you well for SaaS growth while maintaining data isolation and customization capabilities.
