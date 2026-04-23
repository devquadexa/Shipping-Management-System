/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */
class PaymentController {
  constructor(createPayment, getAllPayments, updatePaymentStatus) {
    this.createPayment = createPayment;
    this.getAllPayments = getAllPayments;
    this.updatePaymentStatus = updatePaymentStatus;
  }

  async create(req, res) {
    try {
      const paymentData = {
        jobId: req.body.jobId,
        customerId: req.body.customerId,
        customerName: req.body.customerName,
        invoiceNumber: req.body.invoiceNumber,
        billId: req.body.billId,
        paymentMethod: req.body.paymentMethod,
        paymentDate: req.body.paymentDate || new Date(),
        amount: req.body.amount,
        chequeNumber: req.body.chequeNumber,
        chequeDate: req.body.chequeDate,
        bankName: req.body.bankName,
        referenceNumber: req.body.referenceNumber,
        notes: req.body.notes,
        createdBy: req.user?.userId
      };
      
      const payment = await this.createPayment.execute(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};
      
      if (req.query.status) {
        filters.status = req.query.status;
      }
      
      if (req.query.paymentMethod) {
        filters.paymentMethod = req.query.paymentMethod;
      }
      
      if (req.query.customerId) {
        filters.customerId = req.query.customerId;
      }
      
      if (req.query.jobId) {
        filters.jobId = req.query.jobId;
      }
      
      const payments = await this.getAllPayments.execute(filters);
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const payment = await this.updatePaymentStatus.execute(paymentId, status);
      res.json(payment);
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = PaymentController;
