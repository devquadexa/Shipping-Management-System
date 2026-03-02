# Repository Pattern Explanation

## What's the Difference Between ICustomerRepository and MSSQLCustomerRepository?

This is a fundamental design pattern in Clean Architecture called the **Repository Pattern** with **Dependency Inversion Principle**.

---

## 1. ICustomerRepository (Interface/Contract)

**Location:** `backend-api/src/domain/repositories/ICustomerRepository.js`

**Purpose:** Defines WHAT operations can be done, but NOT HOW to do them.

### Key Points:
- ✅ Lives in the **Domain Layer** (business logic layer)
- ✅ Defines the "contract" or "interface" - a list of methods that MUST exist
- ✅ All methods throw errors because they're NOT meant to be used directly
- ✅ Database-agnostic (doesn't care if you use SQL Server, MySQL, MongoDB, etc.)
- ✅ Represents the business requirements

### Example:
```javascript
class ICustomerRepository {
  async create(customer) {
    throw new Error('Method not implemented');
  }
  
  async findById(customerId) {
    throw new Error('Method not implemented');
  }
}
```

**Think of it as:** A blueprint or contract that says "Any customer repository MUST have these methods"

---

## 2. MSSQLCustomerRepository (Implementation)

**Location:** `backend-api/src/infrastructure/repositories/MSSQLCustomerRepository.js`

**Purpose:** Implements HOW to actually do the operations using SQL Server.

### Key Points:
- ✅ Lives in the **Infrastructure Layer** (technical implementation layer)
- ✅ **Extends** ICustomerRepository (inherits the contract)
- ✅ Contains ACTUAL working code with SQL queries
- ✅ Database-specific (knows about SQL Server, connection pools, SQL syntax)
- ✅ Implements all the methods defined in the interface

### Example:
```javascript
class MSSQLCustomerRepository extends ICustomerRepository {
  async create(customer) {
    const pool = await this.db();
    await pool.request()
      .input('customerId', this.sql.VarChar, customer.customerId)
      .query('INSERT INTO Customers...');
    return customer;
  }
  
  async findById(customerId) {
    const pool = await this.db();
    const result = await pool.request()
      .query('SELECT * FROM Customers WHERE...');
    return this.mapToEntity(result.recordset[0]);
  }
}
```

**Think of it as:** The actual worker that does the job using SQL Server

---

## Why This Design?

### 1. **Flexibility - Easy to Switch Databases**

If you want to switch from SQL Server to PostgreSQL or MongoDB:

```javascript
// Just create a new implementation!
class PostgreSQLCustomerRepository extends ICustomerRepository {
  async create(customer) {
    // PostgreSQL-specific code here
  }
}

class MongoDBCustomerRepository extends ICustomerRepository {
  async create(customer) {
    // MongoDB-specific code here
  }
}
```

Your business logic (use cases) doesn't need to change at all!

### 2. **Testability - Easy to Mock**

For testing, you can create a fake repository:

```javascript
class FakeCustomerRepository extends ICustomerRepository {
  async create(customer) {
    // Just store in memory for testing
    this.customers.push(customer);
    return customer;
  }
}
```

### 3. **Separation of Concerns**

- **Domain Layer** (ICustomerRepository): "I need to save a customer"
- **Infrastructure Layer** (MSSQLCustomerRepository): "I'll save it to SQL Server"

Business logic doesn't know or care about database details!

### 4. **Dependency Inversion Principle (SOLID)**

```
❌ BAD: Use Case → SQL Server (tightly coupled)
✅ GOOD: Use Case → ICustomerRepository ← MSSQLCustomerRepository
```

The use case depends on the interface, not the implementation.

---

## Real-World Analogy

### ICustomerRepository = Restaurant Menu
- Lists what dishes are available
- Doesn't tell you HOW to cook them
- Same menu can be used by different chefs

### MSSQLCustomerRepository = Chef's Recipe
- Actual instructions on HOW to make the dish
- Specific ingredients and techniques
- Different chefs (databases) can make the same dish differently

---

## How They Work Together

### 1. Use Case (Business Logic)
```javascript
class CreateCustomer {
  constructor(customerRepository) {  // ← Receives ICustomerRepository
    this.customerRepository = customerRepository;
  }

  async execute(customerData) {
    const customer = new Customer(customerData);
    // Calls the interface method
    return await this.customerRepository.create(customer);
  }
}
```

### 2. Dependency Injection Container
```javascript
// Wire up the actual implementation
const customerRepository = new MSSQLCustomerRepository(db, sql);
const createCustomer = new CreateCustomer(customerRepository);
```

### 3. At Runtime
```
User Request 
  → Controller 
  → Use Case (uses ICustomerRepository interface)
  → MSSQLCustomerRepository (actual SQL code runs)
  → SQL Server Database
```

---

## Benefits in Your Project

### Current Setup:
- ✅ Using SQL Server via MSSQLCustomerRepository
- ✅ Business logic is database-independent
- ✅ Easy to test without a real database
- ✅ Can switch databases in the future without changing business logic

### If You Want to Add Another Database:
1. Create `PostgreSQLCustomerRepository extends ICustomerRepository`
2. Implement all the methods with PostgreSQL code
3. Update the DI container to use the new repository
4. **No changes needed** in use cases, controllers, or entities!

---

## Summary

| Aspect | ICustomerRepository | MSSQLCustomerRepository |
|--------|-------------------|------------------------|
| **Layer** | Domain (Business) | Infrastructure (Technical) |
| **Purpose** | Define contract | Implement contract |
| **Contains** | Method signatures | Actual SQL code |
| **Database** | Agnostic | SQL Server specific |
| **Can be used directly?** | ❌ No (throws errors) | ✅ Yes (working code) |
| **Changes when** | Business requirements change | Database technology changes |

---

## Key Takeaway

**ICustomerRepository** = "What operations do we need?" (Contract)  
**MSSQLCustomerRepository** = "How do we do them with SQL Server?" (Implementation)

This separation makes your code:
- 🔄 Flexible (easy to change databases)
- 🧪 Testable (easy to mock)
- 📦 Maintainable (clear separation of concerns)
- 🎯 Professional (follows industry best practices)

This is why your Super Shine Cargo Service system is built with **Clean Architecture**! 🚢
