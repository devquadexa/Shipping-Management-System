/**
 * Check Overdue Invoices Use Case
 * Automatically updates job status to "Overdue" for unpaid invoices past due date
 */
class CheckOverdueInvoices {
  constructor(billRepository, jobRepository) {
    this.billRepository = billRepository;
    this.jobRepository = jobRepository;
  }

  async execute() {
    const now = new Date();
    
    // Get all unpaid bills
    const unpaidBills = await this.billRepository.findUnpaid();
    
    let updatedCount = 0;
    const updatedJobs = [];
    
    for (const bill of unpaidBills) {
      // Check if bill has a due date and is overdue
      if (bill.dueDate && now > new Date(bill.dueDate)) {
        // Get job
        const job = await this.jobRepository.findById(bill.jobId);
        
        if (!job) {
          console.log(`CheckOverdueInvoices - Job ${bill.jobId} not found`);
          continue;
        }
        
        // Only update if not already in final status or already overdue
        if (!['Payment Collected', 'Completed', 'Canceled', 'Overdue'].includes(job.status)) {
          console.log(`CheckOverdueInvoices - Updating job ${bill.jobId} to Overdue (was ${job.status})`);
          
          await this.jobRepository.updateStatus(bill.jobId, 'Overdue');
          await this.billRepository.update(bill.billId, { isOverdue: true });
          
          updatedCount++;
          updatedJobs.push({
            jobId: bill.jobId,
            billId: bill.billId,
            previousStatus: job.status,
            dueDate: bill.dueDate
          });
        }
      }
    }
    
    console.log(`CheckOverdueInvoices - Updated ${updatedCount} jobs to Overdue status`);
    
    return { 
      updatedCount,
      updatedJobs,
      checkedAt: now
    };
  }
}

module.exports = CheckOverdueInvoices;
