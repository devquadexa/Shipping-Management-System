/**
 * Payment Controller
 * Handles HTTP requests for payment operations
 */
class PaymentController {
  constructor(createPayment, getAllPayments, updatePaymentStatus, paymentRepository) {
    this.createPayment = createPayment;
    this.getAllPayments = getAllPayments;
    this.updatePaymentStatus = updatePaymentStatus;
    this.paymentRepository = paymentRepository;
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
        chequeAmount: req.body.chequeAmount,
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
      if (req.query.status) filters.status = req.query.status;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod;
      if (req.query.customerId) filters.customerId = req.query.customerId;
      if (req.query.jobId) filters.jobId = req.query.jobId;
      const payments = await this.getAllPayments.execute(filters);
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getPaymentsByBill(req, res) {
    try {
      const { billId } = req.params;
      if (!billId) return res.status(400).json({ message: 'Bill ID required' });
      
      const payments = await this.paymentRepository.findByBillId(billId);
      res.json(payments || []);
    } catch (error) {
      console.error('Get payments by bill error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: 'Status is required' });
      const payment = await this.updatePaymentStatus.execute(paymentId, status);
      res.json(payment);
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Update ALL payments with same cheque number (status change applies to whole cheque)
  async updateChequeStatus(req, res) {
    try {
      const { chequeNumber } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: 'Status is required' });

      const payments = await this.paymentRepository.findByChequeNumber(chequeNumber);
      if (!payments.length) return res.status(404).json({ message: 'Cheque not found' });

      const updated = await Promise.all(
        payments.map(p => this.updatePaymentStatus.execute(p.paymentId, status))
      );
      res.json({ updated: updated.length, chequeNumber, status });
    } catch (error) {
      console.error('Update cheque status error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  // Get all cheques for a customer that still have remaining balance
  async getChequesByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      if (!customerId) return res.status(400).json({ message: 'Customer ID required' });

      // Get all cheque payments for this customer
      const payments = await this.paymentRepository.findAll({
        customerId,
        paymentMethod: 'Cheque'
      });

      if (!payments.length) return res.json([]);

      // Group by cheque number
      const chequeMap = {};
      payments.forEach(p => {
        const key = p.chequeNumber;
        if (!key) return;
        if (!chequeMap[key]) {
          chequeMap[key] = {
            chequeNumber: key,
            chequeDate: p.chequeDate,
            chequeAmount: parseFloat(p.chequeAmount) || 0,
            bankName: p.bankName,
            status: p.status,
            totalAllocated: 0,
          };
        }
        chequeMap[key].totalAllocated += parseFloat(p.amount) || 0;
        // Use highest chequeAmount stored
        if (parseFloat(p.chequeAmount) > chequeMap[key].chequeAmount) {
          chequeMap[key].chequeAmount = parseFloat(p.chequeAmount);
        }
      });

      // Only return cheques with valid amount and remaining balance > 0
      const result = Object.values(chequeMap)
        .filter(c => c.chequeAmount > 0)
        .map(c => ({
          ...c,
          remainingBalance: c.chequeAmount - c.totalAllocated,
        }))
        .filter(c => c.remainingBalance > 0)
        .sort((a, b) => new Date(b.chequeDate) - new Date(a.chequeDate));

      res.json(result);
    } catch (error) {
      console.error('Get customer cheques error:', error);
      res.status(500).json({ message: error.message });
    }
  }
  async getChequeByNumber(req, res) {
    try {
      const { chequeNumber } = req.params;
      const trimmed = (chequeNumber || '').trim();

      // Reject obviously invalid inputs
      if (!trimmed || trimmed.length < 4) {
        return res.status(404).json({ message: 'Cheque not found' });
      }

      const payments = await this.paymentRepository.findByChequeNumber(trimmed);

      // No records found
      if (!payments.length) {
        return res.status(404).json({ message: 'Cheque not found' });
      }

      const first = payments[0];
      const chequeAmount = parseFloat(first.chequeAmount) || 0;

      // Only treat as a valid existing cheque if it has a proper chequeAmount set
      if (chequeAmount <= 0) {
        return res.status(404).json({ message: 'Cheque not found' });
      }

      const totalAllocated = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

      res.json({
        chequeNumber: first.chequeNumber,
        chequeDate: first.chequeDate,
        chequeAmount,
        bankName: first.bankName,
        customerName: first.customerName,
        customerId: first.customerId,
        status: first.status,
        totalAllocated,
        remainingBalance: chequeAmount - totalAllocated,
        linkedPayments: payments.map(p => ({
          paymentId: p.paymentId,
          jobId: p.jobId,
          invoiceNumber: p.invoiceNumber,
          amount: p.amount,
          paymentDate: p.paymentDate
        }))
      });
    } catch (error) {
      console.error('Get cheque error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = PaymentController;
