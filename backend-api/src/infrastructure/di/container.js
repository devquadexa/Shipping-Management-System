/**
 * Dependency Injection Container
 * Wires up all dependencies following Clean Architecture
 */
const { getConnection, sql } = require('../../config/database');

// Repositories
const MSSQLCustomerRepository = require('../repositories/MSSQLCustomerRepository');
const MSSQLJobRepository = require('../repositories/MSSQLJobRepository');
const MSSQLUserRepository = require('../repositories/MSSQLUserRepository');
const MSSQLBillRepository = require('../repositories/MSSQLBillRepository');
const MSSQLPettyCashRepository = require('../repositories/MSSQLPettyCashRepository');
const MSSQLContactPersonRepository = require('../repositories/MSSQLContactPersonRepository');
const MSSQLCategoryRepository = require('../repositories/MSSQLCategoryRepository');

// Customer Use Cases
const CreateCustomer = require('../../application/use-cases/customer/CreateCustomer');
const GetAllCustomers = require('../../application/use-cases/customer/GetAllCustomers');
const UpdateCustomer = require('../../application/use-cases/customer/UpdateCustomer');
const DeleteCustomer = require('../../application/use-cases/customer/DeleteCustomer');

// Job Use Cases
const CreateJob = require('../../application/use-cases/job/CreateJob');
const GetAllJobs = require('../../application/use-cases/job/GetAllJobs');
const GetJobById = require('../../application/use-cases/job/GetJobById');
const UpdateJobStatus = require('../../application/use-cases/job/UpdateJobStatus');
const AssignJob = require('../../application/use-cases/job/AssignJob');
const AddPayItem = require('../../application/use-cases/job/AddPayItem');

// Billing Use Cases
const CreateBill = require('../../application/use-cases/billing/CreateBill');
const GetAllBills = require('../../application/use-cases/billing/GetAllBills');
const GetBillById = require('../../application/use-cases/billing/GetBillById');
const MarkBillAsPaid = require('../../application/use-cases/billing/MarkBillAsPaid');

// Petty Cash Use Cases
const CreatePettyCashEntry = require('../../application/use-cases/pettycash/CreatePettyCashEntry');
const GetAllPettyCashEntries = require('../../application/use-cases/pettycash/GetAllPettyCashEntries');
const GetPettyCashBalance = require('../../application/use-cases/pettycash/GetPettyCashBalance');

// Auth Use Cases
const AuthenticateUser = require('../../application/use-cases/auth/AuthenticateUser');

class Container {
  constructor() {
    this.dependencies = {};
    this.setupRepositories();
    this.setupUseCases();
  }

  setupRepositories() {
    // Repository instances
    this.dependencies.contactPersonRepository = new MSSQLContactPersonRepository(getConnection, sql);
    this.dependencies.categoryRepository = new MSSQLCategoryRepository(getConnection, sql);
    this.dependencies.customerRepository = new MSSQLCustomerRepository(
      getConnection, 
      sql, 
      this.dependencies.contactPersonRepository,
      this.dependencies.categoryRepository
    );
    this.dependencies.jobRepository = new MSSQLJobRepository(getConnection, sql);
    this.dependencies.userRepository = new MSSQLUserRepository(getConnection, sql);
    this.dependencies.billRepository = new MSSQLBillRepository(getConnection, sql);
    this.dependencies.pettyCashRepository = new MSSQLPettyCashRepository(getConnection, sql);
  }

  setupUseCases() {
    const { customerRepository, jobRepository, userRepository, billRepository, pettyCashRepository } = this.dependencies;
    
    // Customer use cases
    this.dependencies.createCustomer = new CreateCustomer(customerRepository);
    this.dependencies.getAllCustomers = new GetAllCustomers(customerRepository);
    this.dependencies.updateCustomer = new UpdateCustomer(customerRepository);
    this.dependencies.deleteCustomer = new DeleteCustomer(customerRepository);
    
    // Job use cases
    this.dependencies.createJob = new CreateJob(jobRepository, customerRepository);
    this.dependencies.getAllJobs = new GetAllJobs(jobRepository);
    this.dependencies.getJobById = new GetJobById(jobRepository);
    this.dependencies.updateJobStatus = new UpdateJobStatus(jobRepository);
    this.dependencies.assignJob = new AssignJob(jobRepository, userRepository);
    this.dependencies.addPayItem = new AddPayItem(jobRepository);
    
    // Billing use cases
    this.dependencies.createBill = new CreateBill(billRepository, jobRepository);
    this.dependencies.getAllBills = new GetAllBills(billRepository);
    this.dependencies.getBillById = new GetBillById(billRepository);
    this.dependencies.markBillAsPaid = new MarkBillAsPaid(billRepository);
    
    // Petty Cash use cases
    this.dependencies.createPettyCashEntry = new CreatePettyCashEntry(pettyCashRepository);
    this.dependencies.getAllPettyCashEntries = new GetAllPettyCashEntries(pettyCashRepository);
    this.dependencies.getPettyCashBalance = new GetPettyCashBalance(pettyCashRepository);
    
    // Auth use cases
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    this.dependencies.authenticateUser = new AuthenticateUser(userRepository, jwtSecret);
  }

  get(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency '${name}' not found`);
    }
    return this.dependencies[name];
  }
}

// Singleton instance
const container = new Container();

module.exports = container;
