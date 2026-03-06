/**
 * Get Accounting Dashboard Use Case
 * Provides comprehensive financial overview for Super Admin
 */
class GetAccountingDashboard {
  constructor(jobRepository, billRepository, pettyCashAssignmentRepository, customerRepository) {
    this.jobRepository = jobRepository;
    this.billRepository = billRepository;
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
    this.customerRepository = customerRepository;
  }

  async execute() {
    console.log('GetAccountingDashboard - Starting...');
    
    // Get all jobs with their financial data
    const jobs = await this.jobRepository.findAll();
    console.log('GetAccountingDashboard - Found jobs:', jobs.length);
    
    // Get all bills
    const bills = await this.billRepository.findAll();
    console.log('GetAccountingDashboard - Found bills:', bills.length);
    
    // Get all petty cash assignments
    const pettyCashAssignments = await this.pettyCashAssignmentRepository.findAll();
    console.log('GetAccountingDashboard - Found petty cash assignments:', pettyCashAssignments.length);
    
    // Get all customers
    const customers = await this.customerRepository.findAll();
    console.log('GetAccountingDashboard - Found customers:', customers.length);
    
    // Build job-wise financial data
    const jobFinancials = [];
    
    for (const job of jobs) {
      // Get bill for this job
      const jobBills = bills.filter(b => b.jobId === job.jobId);
      const bill = jobBills.length > 0 ? jobBills[0] : null;
      
      // Get petty cash for this job
      const pettyCash = pettyCashAssignments.find(pc => pc.jobId === job.jobId);
      
      // Calculate actual cost from pay items
      const actualCost = job.payItems ? 
        job.payItems.reduce((sum, item) => sum + (parseFloat(item.actualCost) || 0), 0) : 0;
      
      // Calculate billing amount
      const billingAmount = bill ? parseFloat(bill.billingAmount || 0) : 0;
      
      // Calculate profit
      const profit = billingAmount - actualCost;
      
      // Payment status
      const isPaid = bill ? bill.paymentStatus === 'Paid' : false;
      const isOverdue = bill ? bill.isOverdue : false;
      
      // Calculate overdue days
      let overdueDays = 0;
      if (bill && bill.dueDate && !isPaid) {
        const dueDate = new Date(bill.dueDate);
        const today = new Date();
        if (today > dueDate) {
          overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        }
      }
      
      // Get customer info
      const customer = customers.find(c => c.customerId === job.customerId);
      
      jobFinancials.push({
        jobId: job.jobId,
        customerId: job.customerId,
        customerName: customer ? customer.name : job.customerId,
        openDate: job.openDate,
        status: job.status,
        pettyCashIssued: pettyCash ? parseFloat(pettyCash.amount || 0) : 0,
        actualCost: actualCost,
        billingAmount: billingAmount,
        profit: profit,
        isPaid: isPaid,
        isOverdue: isOverdue,
        overdueDays: overdueDays,
        invoiceDate: bill ? bill.invoiceDate : null,
        dueDate: bill ? bill.dueDate : null,
        billId: bill ? bill.billId : null
      });
    }
    
    // Calculate customer-wise outstanding
    const customerOutstanding = {};
    
    for (const customer of customers) {
      const customerJobs = jobFinancials.filter(j => j.customerId === customer.customerId);
      const unpaidJobs = customerJobs.filter(j => !j.isPaid && j.billingAmount > 0);
      
      const totalOutstanding = unpaidJobs.reduce((sum, job) => sum + job.billingAmount, 0);
      const overdueAmount = unpaidJobs
        .filter(j => j.isOverdue)
        .reduce((sum, job) => sum + job.billingAmount, 0);
      
      if (totalOutstanding > 0) {
        customerOutstanding[customer.customerId] = {
          customerId: customer.customerId,
          customerName: customer.name,
          totalOutstanding: totalOutstanding,
          overdueAmount: overdueAmount,
          unpaidJobsCount: unpaidJobs.length,
          overdueJobsCount: unpaidJobs.filter(j => j.isOverdue).length,
          creditPeriodDays: customer.creditPeriodDays || 30
        };
      }
    }
    
    // Calculate summary statistics
    const summary = {
      totalJobs: jobs.length,
      totalPettyCashIssued: jobFinancials.reduce((sum, j) => sum + j.pettyCashIssued, 0),
      totalActualCost: jobFinancials.reduce((sum, j) => sum + j.actualCost, 0),
      totalBillingAmount: jobFinancials.reduce((sum, j) => sum + j.billingAmount, 0),
      totalProfit: jobFinancials.reduce((sum, j) => sum + j.profit, 0),
      totalPaid: jobFinancials.filter(j => j.isPaid).reduce((sum, j) => sum + j.billingAmount, 0),
      totalOutstanding: jobFinancials.filter(j => !j.isPaid).reduce((sum, j) => sum + j.billingAmount, 0),
      totalOverdue: jobFinancials.filter(j => j.isOverdue).reduce((sum, j) => sum + j.billingAmount, 0),
      paidJobsCount: jobFinancials.filter(j => j.isPaid).length,
      unpaidJobsCount: jobFinancials.filter(j => !j.isPaid && j.billingAmount > 0).length,
      overdueJobsCount: jobFinancials.filter(j => j.isOverdue).length
    };
    
    console.log('GetAccountingDashboard - Summary:', summary);
    
    return {
      summary,
      jobFinancials,
      customerOutstanding: Object.values(customerOutstanding)
    };
  }
}

module.exports = GetAccountingDashboard;
