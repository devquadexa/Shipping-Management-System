/**
 * Create Bill Use Case
 */
const Bill = require('../../../domain/entities/Bill');

class CreateBill {
  constructor(billRepository, jobRepository, customerRepository) {
    this.billRepository = billRepository;
    this.jobRepository = jobRepository;
    this.customerRepository = customerRepository;
  }

  async execute(billData) {
    console.log('CreateBill - Received billData:', billData);
    
    // Verify job exists
    const job = await this.jobRepository.findById(billData.jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    console.log('CreateBill - Found job:', job);
    
    // Get customer to fetch credit period
    const customer = await this.customerRepository.findById(job.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }
    
    console.log('CreateBill - Found customer with credit period:', customer.creditPeriodDays);
    
    // Calculate actual cost from pay items
    const actualCost = billData.actualCost || 0;
    const billingAmount = billData.billingAmount || 0;
    
    console.log('CreateBill - Calculated values:', { actualCost, billingAmount });
    
    // Calculate invoice date and due date
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + (customer.creditPeriodDays || 30));
    
    console.log('CreateBill - Invoice dates:', { 
      invoiceDate: invoiceDate.toISOString(), 
      dueDate: dueDate.toISOString(),
      creditPeriodDays: customer.creditPeriodDays 
    });
    
    // Create bill entity
    const bill = new Bill({
      billId: await this.billRepository.generateNextId(),
      jobId: billData.jobId,
      customerId: job.customerId,
      amount: billingAmount,
      actualCost: actualCost,
      billingAmount: billingAmount,
      profit: billingAmount - actualCost,
      paymentStatus: 'Unpaid',
      invoiceNumber: billData.invoiceNumber || null,
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      isOverdue: false
    });
    
    console.log('CreateBill - Created bill entity (before tax):', {
      billId: bill.billId,
      actualCost: bill.actualCost,
      billingAmount: bill.billingAmount,
      profit: bill.profit,
      invoiceDate: bill.invoiceDate,
      dueDate: bill.dueDate
    });
    
    // Validate
    const validation = bill.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    // No tax - total equals billing amount
    bill.calculateTax(0);
    
    // Calculate profit
    bill.calculateProfit();
    
    console.log('CreateBill - Final bill (after tax):', {
      billId: bill.billId,
      actualCost: bill.actualCost,
      billingAmount: bill.billingAmount,
      profit: bill.profit,
      tax: bill.tax,
      total: bill.total
    });
    
    // Persist
    const savedBill = await this.billRepository.create(bill);
    console.log('CreateBill - Saved bill:', savedBill);
    
    // Update job status to "Pending Payment"
    console.log('CreateBill - Updating job status to Pending Payment');
    await this.jobRepository.updateStatus(billData.jobId, 'Pending Payment');
    console.log('CreateBill - Job status updated successfully');
    
    return savedBill;
  }
}

module.exports = CreateBill;
