/**
 * Transporter Payment Controller
 * Handles HTTP requests for transporter payment operations
 */
class TransporterPaymentController {
  constructor(createTransporterPayment, getTransporterPayments, updateTransporterPaymentStatus) {
    this.createTransporterPayment = createTransporterPayment;
    this.getTransporterPayments = getTransporterPayments;
    this.updateTransporterPaymentStatus = updateTransporterPaymentStatus;
  }

  async create(req, res) {
    try {
      const { jobId, amount, paymentMethod, chequeNumber, chequeDate, chequeAmount, bankName, notes } = req.body;
      const userId = req.user?.userId || req.user?.id;
      const userName = req.user?.name || req.user?.fullName || req.user?.username || 'System';

      const payment = await this.createTransporterPayment.execute(jobId, {
        amount,
        paymentMethod,
        chequeNumber,
        chequeDate,
        chequeAmount,
        bankName,
        notes,
        paidBy: userId,
        paidByName: userName,
      });

      res.status(201).json({
        success: true,
        message: 'Transporter payment recorded successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Error creating transporter payment:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error recording payment',
      });
    }
  }

  async getByTransporter(req, res) {
    try {
      const { transporterId } = req.params;
      const { status, fromDate, toDate } = req.query;

      const payments = await this.getTransporterPayments.execute(transporterId, {
        status,
        fromDate,
        toDate,
      });

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      console.error('Error fetching transporter payments:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching payments',
      });
    }
  }

  async updateStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;

      const payment = await this.updateTransporterPaymentStatus.execute(paymentId, status);

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: payment,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Error updating payment status',
      });
    }
  }
}

module.exports = TransporterPaymentController;
