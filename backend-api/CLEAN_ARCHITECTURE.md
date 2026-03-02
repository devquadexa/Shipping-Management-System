# Clean Architecture Implementation

## 🏗️ Architecture Overview

This backend follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (Controllers, Routes, HTTP, API)                           │
│  - CustomerController                                        │
│  - AuthController                                            │
│  - Routes                                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  (Use Cases, Business Logic)                                │
│  - CreateCustomer                                            │
│  - AuthenticateUser                                          │
│  - AssignJob                                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  (Entities, Repository Interfaces, Business Rules)          │
│  - Customer Entity                                           │
│  - ICustomerRepository Interface                             │
│  - Business validation logic                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  (Database, External Services, Implementations)             │
│  - MSSQLCustomerRepository                                   │
│  - Database connection                                       │
│  - SQL queries                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
backend-api/src/
├── domain/                          # Core business logic
│   ├── entities/                    # Business entities
│   │   ├── Customer.js              # Customer domain model
│   │   ├── Job.js
│   │   ├── User.js
│   │   ├── Bill.js
│   │   └── PettyCashEntry.js
│   └── repositories/                # Repository interfaces
│       ├── ICustomerRepository.js   # Contract for customer data access
│       ├── IJobRepository.js
│       ├── IUserRepository.js
│       ├── IBillRepository.js
│       └── IPettyCashRepository.js
│
├── application/                     # Use cases
│   └── use-cases/
│       ├── customer/
│       │   ├── CreateCustomer.js    # Business logic for creating customer
│       │   ├── GetAllCustomers.js
│       │   ├── UpdateCustomer.js
│       │   └── DeleteCustomer.js
│       ├── job/
│       │   ├── CreateJob.js
│       │   └── AssignJob.js
│       └── auth/
│           └── AuthenticateUser.js
│
├── infrastructure/                  # External concerns
│   ├── repositories/                # Repository implementations
│   │   ├── MSSQLCustomerRepository.js  # SQL Server implementation
│   │   ├── MSSQLJobRepository.js
│   │   └── MSSQLUserRepository.js
│   └── di/
│       └── container.js             # Dependency injection
│
├── presentation/                    # API layer
│   ├── controllers/
│   │   ├── CustomerController.js    # HTTP request handling
│   │   └── AuthController.js
│   └── routes/
│       ├── customers.js             # Route definitions
│       └── auth.js
│
├── middleware/                      # Cross-cutting concerns
│   └── auth.js                      # JWT authentication
│
├── config/                          # Configuration
│   └── database.js                  # Database connection
│
└── index-clean.js                   # Application entry point
```

## 🎯 SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)
Each class has one reason to change:
- **Entities**: Only change when business rules change
- **Use Cases**: Only change when business logic changes
- **Repositories**: Only change when data access changes
- **Controllers**: Only change when API contract changes

### 2. Open/Closed Principle (OCP)
Open for extension, closed for modification:
- **Repository Interface**: Can add new implementations without changing use cases
- **Use Cases**: Can add new use cases without modifying existing ones

### 3. Liskov Substitution Principle (LSP)
Implementations can be substituted:
- Any `ICustomerRepository` implementation can replace another
- `MSSQLCustomerRepository` can be replaced with `MongoDBCustomerRepository`

### 4. Interface Segregation Principle (ISP)
Clients don't depend on unused methods:
- Repository interfaces are focused and specific
- Each use case only depends on methods it needs

### 5. Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions:
- Use cases depend on `ICustomerRepository` interface
- Not on `MSSQLCustomerRepository` implementation

## 🔄 Data Flow Example

### Creating a Customer:

```
1. HTTP Request
   POST /api/customers
   Body: { name, email, phone, address }
   
2. CustomerController.create()
   - Receives HTTP request
   - Extracts data
   - Calls use case
   
3. CreateCustomer.execute()
   - Creates Customer entity
   - Validates business rules
   - Checks for duplicates
   - Calls repository
   
4. MSSQLCustomerRepository.create()
   - Converts entity to SQL
   - Executes INSERT query
   - Returns created entity
   
5. Response flows back up
   - Use case returns customer
   - Controller returns JSON
   - HTTP 201 Created
```

## 💡 Key Benefits

### 1. Testability
```javascript
// Easy to test use cases with mock repositories
const mockRepository = {
  create: jest.fn(),
  findByEmail: jest.fn()
};

const useCase = new CreateCustomer(mockRepository);
// Test business logic without database
```

### 2. Flexibility
```javascript
// Easy to switch databases
// From MSSQL:
const repo = new MSSQLCustomerRepository(db, sql);

// To MongoDB:
const repo = new MongoDBCustomerRepository(mongoClient);

// Use case code doesn't change!
```

### 3. Client-Specific Customization
```javascript
// Client A: Needs TIN number
class ClientACustomerRepository extends MSSQLCustomerRepository {
  async create(customer) {
    // Include TIN in SQL
    return super.create(customer);
  }
}

// Client B: Doesn't need TIN
class ClientBCustomerRepository extends MSSQLCustomerRepository {
  async create(customer) {
    // Exclude TIN from SQL
    const { tin, ...customerWithoutTin } = customer;
    return super.create(customerWithoutTin);
  }
}
```

### 4. Maintainability
- Business logic in one place (use cases)
- Database logic in one place (repositories)
- Easy to find and fix bugs
- Clear dependencies

## 🔧 How to Use

### Adding a New Feature

**Example: Add "Get Customer by Email" feature**

1. **Add method to interface** (domain/repositories/ICustomerRepository.js):
```javascript
async findByEmail(email) {
  throw new Error('Method not implemented');
}
```

2. **Implement in repository** (infrastructure/repositories/MSSQLCustomerRepository.js):
```javascript
async findByEmail(email) {
  const pool = await this.db();
  const result = await pool.request()
    .input('email', this.sql.VarChar, email)
    .query('SELECT * FROM Customers WHERE Email = @email');
  return result.recordset[0] ? this.mapToEntity(result.recordset[0]) : null;
}
```

3. **Create use case** (application/use-cases/customer/GetCustomerByEmail.js):
```javascript
class GetCustomerByEmail {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute(email) {
    const customer = await this.customerRepository.findByEmail(email);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }
}
```

4. **Add to controller** (presentation/controllers/CustomerController.js):
```javascript
async getByEmail(req, res) {
  try {
    const customer = await this.getCustomerByEmail.execute(req.query.email);
    res.json(customer);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}
```

5. **Add route** (presentation/routes/customers.js):
```javascript
router.get('/by-email', auth, (req, res) => 
  customerController.getByEmail(req, res)
);
```

### Client-Specific Customization

**Example: Client doesn't need TIN field**

1. **Create custom repository**:
```javascript
class CustomClientRepository extends MSSQLCustomerRepository {
  async create(customer) {
    // Override to exclude TIN
    const pool = await this.db();
    await pool.request()
      .input('customerId', this.sql.VarChar, customer.customerId)
      .input('name', this.sql.VarChar, customer.name)
      .input('phone', this.sql.VarChar, customer.phone)
      .input('email', this.sql.VarChar, customer.email)
      .input('address', this.sql.VarChar, customer.address)
      // TIN field excluded
      .query(`
        INSERT INTO Customers (CustomerId, Name, Phone, Email, Address)
        VALUES (@customerId, @name, @phone, @email, @address)
      `);
    return customer;
  }
}
```

2. **Update DI container**:
```javascript
// In container.js
if (process.env.CLIENT_ID === 'custom_client') {
  this.dependencies.customerRepository = new CustomClientRepository(getConnection, sql);
} else {
  this.dependencies.customerRepository = new MSSQLCustomerRepository(getConnection, sql);
}
```

## 🧪 Testing

### Unit Testing Use Cases
```javascript
describe('CreateCustomer', () => {
  it('should create customer with valid data', async () => {
    const mockRepo = {
      generateNextId: jest.fn().mockResolvedValue('CUST0001'),
      findByEmail: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ customerId: 'CUST0001' })
    };

    const useCase = new CreateCustomer(mockRepo);
    const result = await useCase.execute({
      name: 'Test Customer',
      email: 'test@example.com',
      phone: '1234567890',
      address: 'Test Address'
    });

    expect(result.customerId).toBe('CUST0001');
    expect(mockRepo.create).toHaveBeenCalled();
  });
});
```

### Integration Testing
```javascript
describe('Customer API', () => {
  it('should create customer via API', async () => {
    const response = await request(app)
      .post('/api/customers')
      .send({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Test Address'
      })
      .expect(201);

    expect(response.body.customerId).toBeDefined();
  });
});
```

## 📊 Comparison: Old vs New

### Old Structure (Tightly Coupled)
```javascript
// routes/customers.js
router.post('/', async (req, res) => {
  const pool = await getConnection();
  // SQL directly in route ❌
  await pool.request()
    .input('name', sql.VarChar, req.body.name)
    .query('INSERT INTO Customers...');
});
```

**Problems:**
- ❌ Business logic mixed with database logic
- ❌ Hard to test
- ❌ Hard to change database
- ❌ Hard to customize per client
- ❌ Violates SOLID principles

### New Structure (Clean Architecture)
```javascript
// presentation/controllers/CustomerController.js
async create(req, res) {
  const customer = await this.createCustomer.execute(req.body);
  res.json(customer);
}

// application/use-cases/customer/CreateCustomer.js
async execute(customerData) {
  const customer = new Customer(customerData);
  customer.validate();
  return await this.customerRepository.create(customer);
}

// infrastructure/repositories/MSSQLCustomerRepository.js
async create(customer) {
  // SQL only here ✅
  await pool.request().query('INSERT INTO Customers...');
}
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Easy to test each layer
- ✅ Easy to change database
- ✅ Easy to customize per client
- ✅ Follows SOLID principles

## 🚀 Migration Strategy

### Phase 1: ✅ Completed
- Domain entities created
- Repository interfaces defined
- Customer & Auth use cases implemented
- DI container set up

### Phase 2: ✅ Completed
- Jobs module migrated
- Billing module migrated
- PettyCash module migrated
- All use cases implemented
- All controllers created
- All clean routes created
- index-clean.js updated

### Phase 3: Future
- Add unit tests
- Add integration tests
- Performance optimization
- Multi-tenant support

## 📚 Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

## ✅ Summary

Your backend now follows Clean Architecture with:
- ✅ Clear layer separation
- ✅ SOLID principles
- ✅ Testable code
- ✅ Flexible and maintainable
- ✅ Ready for multi-tenant SaaS
- ✅ Easy client-specific customization

The TIN number example you mentioned can now be handled by simply creating a custom repository implementation for that specific client, without touching any business logic!
