/**
 * Create Transporter Payment Use Case
 * Records a payment for transporter costs
 */
class CreateTransporterPayment {
  constructor(transporterPaymentRepository, jobRepository, transporterRepository) {
    this.transporterPaymentRepository = transporterPaymentRepository;
    this.jobRepository = jobRepository;
    this.transporterRepository = transporterRepository;
  }

  async execute(jobId, paymentData) {
    // Validate input
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (!paymentData.paymentMethod) {
      throw new Error('Payment method is required');
    }

    // Get job to verify it exists and get transporter info
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Find transporter cost pay item
    // Supports both old format "transporter cost" and new format "transporter cost (from ...)"
    const transporterPayItem = (job.payItems || []).find(item => {
      const label = (item?.description || item?.name || '').toLowerCase().trim();
      return label === 'transporter cost' || label.startsWith('transporter cost (from');
    });

    if (!transporterPayItem) {
      throw new Error('No transporter cost found for this job');
    }

    // Validate payment amount doesn't exceed remaining balance
    const itemAmount = parseFloat(transporterPayItem.billingAmount || transporterPayItem.amount || 0) || 0;
    const currentPaidAmount = parseFloat(transporterPayItem.paidAmount || 0) || 0;
    const remainingBalance = itemAmount - currentPaidAmount;

    if (paymentData.amount > remainingBalance) {
      throw new Error(`Payment amount exceeds remaining balance of LKR ${remainingBalance.toFixed(2)}`);
    }

    // Validate cheque details if payment method is Cheque
    if (paymentData.paymentMethod === 'Cheque') {
      if (!paymentData.chequeNumber) {
        throw new Error('Cheque number is required for cheque payments');
      }
      if (!paymentData.chequeDate) {
        throw new Error('Cheque date is required for cheque payments');
      }
      if (!paymentData.chequeAmount || paymentData.chequeAmount <= 0) {
        throw new Error('Cheque amount must be greater than 0');
      }
    }

    // Get transporter ID from transporter name
    let transporterId = null;
    if (job.transporter) {
      const transporter = await this.transporterRepository.findByName(job.transporter);
      if (transporter) {
        transporterId = transporter.transporterId;
      }
    }

    if (!transporterId) {
      throw new Error('Transporter not found for this job');
    }

    // Create payment record
    const payment = await this.transporterPaymentRepository.create({
      jobId,
      transporterId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: new Date(),
      status: 'Pending',
      chequeNumber: paymentData.chequeNumber || null,
      chequeDate: paymentData.chequeDate || null,
      chequeAmount: paymentData.chequeAmount || null,
      bankName: paymentData.bankName || null,
      paidBy: paymentData.paidBy,
      paidByName: paymentData.paidByName,
      notes: paymentData.notes || null,
    });

    return payment;
  }
}

module.exports = CreateTransporterPayment;
