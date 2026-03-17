/**
 * Dependency Injection Container
 * Wires up all dependencies following Clean Architecture
 */
const { getConnection, sql } = require('../../config/database');

// Repositories
const MSSQLCustomerRepository = require('../repositories/MSSQLCustomerRepository');
const MSSQLJobRepository = require('../repositories/MSSQLJobRepository');
const MSSQLJobAssignmentRepository = require('../repositories/MSSQLJobAssignmentRepository');
const MSSQLUserRepository = require('../repositories/MSSQLUserRepository');
const MSSQLBillRepository = require('../repositories/MSSQLBillRepository');
const MSSQLPettyCashRepository = require('../repositories/MSSQLPettyCashRepository');
const MSSQLContactPersonRepository = require('../repositories/MSSQLContactPersonRepository');
const MSSQLCategoryRepository = require('../repositories/MSSQLCategoryRepository');
const MSSQLPayItemTemplateRepository = require('../repositories/MSSQLPayItemTemplateRepository');
const MSSQLPettyCashAssignmentRepository = require('../repositories/MSSQLPettyCashAssignmentRepository');
const MSSQLOfficePayItemRepository = require('../repositories/MSSQLOfficePayItemRepository');
const MSSQLTransporterRepository = require('../repositories/MSSQLTransporterRepository');
const MSSQLCashBalanceSettlementRepository = require('../repositories/MSSQLCashBalanceSettlementRepository');

// Customer Use Cases
const CreateCustomer = require('../../application/use-cases/customer/CreateCustomer');
const GetAllCustomers = require('../../application/use-cases/customer/GetAllCustomers');
const UpdateCustomer = require('../../application/use-cases/customer/UpdateCustomer');
const DeleteCustomer = require('../../application/use-cases/customer/DeleteCustomer');
const CreateTransporter = require('../../application/use-cases/transporter/CreateTransporter');
const GetAllTransporters = require('../../application/use-cases/transporter/GetAllTransporters');
const UpdateTransporter = require('../../application/use-cases/transporter/UpdateTransporter');
const DeleteTransporter = require('../../application/use-cases/transporter/DeleteTransporter');

// Job Use Cases
const CreateJob = require('../../application/use-cases/job/CreateJob');
const GetAllJobs = require('../../application/use-cases/job/GetAllJobs');
const GetJobById = require('../../application/use-cases/job/GetJobById');
const UpdateJob = require('../../application/use-cases/job/UpdateJob');
const UpdateJobStatus = require('../../application/use-cases/job/UpdateJobStatus');
const AssignJob = require('../../application/use-cases/job/AssignJob');
const AssignMultipleUsersToJob = require('../../application/use-cases/job/AssignMultipleUsersToJob');
const RemoveUserFromJob = require('../../application/use-cases/job/RemoveUserFromJob');
const GetJobAssignments = require('../../application/use-cases/job/GetJobAssignments');
const GetUserJobs = require('../../application/use-cases/job/GetUserJobs');
const AddPayItem = require('../../application/use-cases/job/AddPayItem');
const ReplacePayItems = require('../../application/use-cases/job/ReplacePayItems');

// Billing Use Cases
const CreateBill = require('../../application/use-cases/billing/CreateBill');
const GetAllBills = require('../../application/use-cases/billing/GetAllBills');
const GetBillById = require('../../application/use-cases/billing/GetBillById');
const MarkBillAsPaid = require('../../application/use-cases/billing/MarkBillAsPaid');
const CheckOverdueInvoices = require('../../application/use-cases/billing/CheckOverdueInvoices');

// Accounting Use Cases
const GetAccountingDashboard = require('../../application/use-cases/accounting/GetAccountingDashboard');

// Petty Cash Use Cases
const CreatePettyCashEntry = require('../../application/use-cases/pettycash/CreatePettyCashEntry');
const GetAllPettyCashEntries = require('../../application/use-cases/pettycash/GetAllPettyCashEntries');
const GetPettyCashBalance = require('../../application/use-cases/pettycash/GetPettyCashBalance');
const GetAvailablePettyCashBalance = require('../../application/use-cases/pettycash/GetAvailablePettyCashBalance');

// Pay Item Template Use Cases
const GetAllPayItemTemplates = require('../../application/use-cases/payitemtemplate/GetAllPayItemTemplates');
const GetPayItemTemplatesByCategory = require('../../application/use-cases/payitemtemplate/GetPayItemTemplatesByCategory');
const CreatePayItemTemplate = require('../../application/use-cases/payitemtemplate/CreatePayItemTemplate');
const UpdatePayItemTemplate = require('../../application/use-cases/payitemtemplate/UpdatePayItemTemplate');
const DeletePayItemTemplate = require('../../application/use-cases/payitemtemplate/DeletePayItemTemplate');

// Petty Cash Assignment Use Cases
const CreatePettyCashAssignment = require('../../application/use-cases/pettycashassignment/CreatePettyCashAssignment');
const GetAllPettyCashAssignments = require('../../application/use-cases/pettycashassignment/GetAllPettyCashAssignments');
const GetUserPettyCashAssignments = require('../../application/use-cases/pettycashassignment/GetUserPettyCashAssignments');
const GetPettyCashAssignmentByJob = require('../../application/use-cases/pettycashassignment/GetPettyCashAssignmentByJob');
const SettlePettyCashAssignment = require('../../application/use-cases/pettycashassignment/SettlePettyCashAssignment');
const GetUserBalancesSummary = require('../../application/use-cases/pettycashassignment/GetUserBalancesSummary');

// Office Pay Item Use Cases
const CreateOfficePayItem = require('../../application/use-cases/officepayitem/CreateOfficePayItem');
const GetOfficePayItemsByJob = require('../../application/use-cases/officepayitem/GetOfficePayItemsByJob');
const UpdateOfficePayItem = require('../../application/use-cases/officepayitem/UpdateOfficePayItem');
const DeleteOfficePayItem = require('../../application/use-cases/officepayitem/DeleteOfficePayItem');

// Cash Balance Settlement Use Cases
const CreateCashBalanceSettlement = require('../../application/use-cases/cashbalancesettlement/CreateCashBalanceSettlement');
const GetCashBalanceSettlements = require('../../application/use-cases/cashbalancesettlement/GetCashBalanceSettlements');
const ApproveCashBalanceSettlement = require('../../application/use-cases/cashbalancesettlement/ApproveCashBalanceSettlement');
const CompleteCashBalanceSettlement = require('../../application/use-cases/cashbalancesettlement/CompleteCashBalanceSettlement');
const RejectCashBalanceSettlement = require('../../application/use-cases/cashbalancesettlement/RejectCashBalanceSettlement');

// Auth Use Cases
const AuthenticateUser = require('../../application/use-cases/auth/AuthenticateUser');

// Controllers
const CashBalanceSettlementController = require('../../presentation/controllers/CashBalanceSettlementController');

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
    this.dependencies.jobAssignmentRepository = new MSSQLJobAssignmentRepository(getConnection, sql);
    this.dependencies.userRepository = new MSSQLUserRepository(getConnection, sql);
    this.dependencies.billRepository = new MSSQLBillRepository(getConnection, sql);
    this.dependencies.pettyCashRepository = new MSSQLPettyCashRepository(getConnection, sql);
    this.dependencies.payItemTemplateRepository = new MSSQLPayItemTemplateRepository(getConnection, sql);
    this.dependencies.pettyCashAssignmentRepository = new MSSQLPettyCashAssignmentRepository(getConnection, sql);
    this.dependencies.officePayItemRepository = new MSSQLOfficePayItemRepository(getConnection, sql);
    this.dependencies.transporterRepository = new MSSQLTransporterRepository(getConnection, sql);
    this.dependencies.cashBalanceSettlementRepository = new MSSQLCashBalanceSettlementRepository(getConnection, sql);
  }

  setupUseCases() {
    const {
      customerRepository,
      jobRepository,
      jobAssignmentRepository,
      userRepository,
      billRepository,
      pettyCashRepository,
      payItemTemplateRepository,
      pettyCashAssignmentRepository,
      officePayItemRepository,
      transporterRepository,
      cashBalanceSettlementRepository,
    } = this.dependencies;
    
    // Customer use cases
    this.dependencies.createCustomer = new CreateCustomer(customerRepository);
    this.dependencies.getAllCustomers = new GetAllCustomers(customerRepository);
    this.dependencies.updateCustomer = new UpdateCustomer(customerRepository);
    this.dependencies.deleteCustomer = new DeleteCustomer(customerRepository);
    this.dependencies.createTransporter = new CreateTransporter(transporterRepository);
    this.dependencies.getAllTransporters = new GetAllTransporters(transporterRepository);
    this.dependencies.updateTransporter = new UpdateTransporter(transporterRepository);
    this.dependencies.deleteTransporter = new DeleteTransporter(transporterRepository);
    
    // Job use cases
    this.dependencies.createJob = new CreateJob(jobRepository, customerRepository);
    this.dependencies.getAllJobs = new GetAllJobs(jobRepository);
    this.dependencies.getJobById = new GetJobById(jobRepository);
    this.dependencies.updateJob = new UpdateJob(jobRepository);
    this.dependencies.updateJobStatus = new UpdateJobStatus(jobRepository);
    this.dependencies.assignJob = new AssignJob(jobRepository, userRepository);
    this.dependencies.assignMultipleUsersToJob = new AssignMultipleUsersToJob(jobRepository, userRepository, jobAssignmentRepository);
    this.dependencies.removeUserFromJob = new RemoveUserFromJob(jobRepository, userRepository, jobAssignmentRepository);
    this.dependencies.getJobAssignments = new GetJobAssignments(jobRepository, jobAssignmentRepository);
    this.dependencies.getUserJobs = new GetUserJobs(userRepository, jobAssignmentRepository);
    this.dependencies.addPayItem = new AddPayItem(jobRepository);
    this.dependencies.replacePayItems = new ReplacePayItems(jobRepository);
    
    // Billing use cases
    this.dependencies.createBill = new CreateBill(billRepository, jobRepository, customerRepository);
    this.dependencies.getAllBills = new GetAllBills(billRepository);
    this.dependencies.getBillById = new GetBillById(billRepository);
    this.dependencies.markBillAsPaid = new MarkBillAsPaid(billRepository);
    this.dependencies.checkOverdueInvoices = new CheckOverdueInvoices(billRepository, jobRepository);
    
    // Petty Cash use cases
    this.dependencies.createPettyCashEntry = new CreatePettyCashEntry(pettyCashRepository);
    this.dependencies.getAllPettyCashEntries = new GetAllPettyCashEntries(pettyCashRepository);
    this.dependencies.getPettyCashBalance = new GetPettyCashBalance(pettyCashRepository);
    this.dependencies.getAvailablePettyCashBalance = new GetAvailablePettyCashBalance(pettyCashRepository, pettyCashAssignmentRepository);
    
    // Pay Item Template use cases
    this.dependencies.getAllPayItemTemplates = new GetAllPayItemTemplates(payItemTemplateRepository);
    this.dependencies.getPayItemTemplatesByCategory = new GetPayItemTemplatesByCategory(payItemTemplateRepository);
    this.dependencies.createPayItemTemplate = new CreatePayItemTemplate(payItemTemplateRepository);
    this.dependencies.updatePayItemTemplate = new UpdatePayItemTemplate(payItemTemplateRepository);
    this.dependencies.deletePayItemTemplate = new DeletePayItemTemplate(payItemTemplateRepository);
    
    // Petty Cash Assignment use cases
    this.dependencies.createPettyCashAssignment = new CreatePettyCashAssignment(pettyCashAssignmentRepository);
    this.dependencies.getAllPettyCashAssignments = new GetAllPettyCashAssignments(pettyCashAssignmentRepository);
    this.dependencies.getUserPettyCashAssignments = new GetUserPettyCashAssignments(pettyCashAssignmentRepository);
    this.dependencies.getPettyCashAssignmentByJob = new GetPettyCashAssignmentByJob(pettyCashAssignmentRepository);
    this.dependencies.settlePettyCashAssignment = new SettlePettyCashAssignment(pettyCashAssignmentRepository);
    this.dependencies.getUserBalancesSummary = new GetUserBalancesSummary(pettyCashAssignmentRepository);
    
    // Office Pay Item use cases
    this.dependencies.createOfficePayItem = new CreateOfficePayItem(officePayItemRepository, jobRepository);
    this.dependencies.getOfficePayItemsByJob = new GetOfficePayItemsByJob(officePayItemRepository);
    this.dependencies.updateOfficePayItem = new UpdateOfficePayItem(officePayItemRepository);
    this.dependencies.deleteOfficePayItem = new DeleteOfficePayItem(officePayItemRepository);
    
    // Accounting use cases
    this.dependencies.getAccountingDashboard = new GetAccountingDashboard(
      jobRepository, 
      billRepository, 
      pettyCashAssignmentRepository, 
      customerRepository
    );
    
    // Auth use cases
    const jwtSecret = process.env.JWT_SECRET || 'default_secret';
    this.dependencies.authenticateUser = new AuthenticateUser(userRepository, jwtSecret);
    
    // Cash Balance Settlement use cases
    this.dependencies.CreateCashBalanceSettlement = new CreateCashBalanceSettlement(cashBalanceSettlementRepository);
    this.dependencies.GetCashBalanceSettlements = new GetCashBalanceSettlements(cashBalanceSettlementRepository);
    this.dependencies.ApproveCashBalanceSettlement = new ApproveCashBalanceSettlement(cashBalanceSettlementRepository);
    this.dependencies.CompleteCashBalanceSettlement = new CompleteCashBalanceSettlement(cashBalanceSettlementRepository);
    this.dependencies.RejectCashBalanceSettlement = new RejectCashBalanceSettlement(cashBalanceSettlementRepository);
    this.dependencies.CashBalanceSettlementRepository = cashBalanceSettlementRepository;
    
    // Controllers
    this.dependencies.CashBalanceSettlementController = new CashBalanceSettlementController(this);
  }

  get(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency '${name}' not found`);
    }
    return this.dependencies[name];
  }

  resolve(name) {
    return this.get(name);
  }
}

// Singleton instance
const container = new Container();

module.exports = container;
