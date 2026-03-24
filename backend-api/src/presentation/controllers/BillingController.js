/**
 * Billing Controller
 * Handles HTTP requests for billing operations
 */
class BillingController {
  constructor(createBill, getAllBills, getBillById, markBillAsPaid) {
    this.createBill = createBill;
    this.getAllBills = getAllBills;
    this.getBillById = getBillById;
    this.markBillAsPaid = markBillAsPaid;
  }

  async create(req, res) {
    try {
      const billData = {
        jobId: req.body.jobId,
        customerId: req.body.customerId,
        amount: req.body.amount,
        actualCost: req.body.actualCost,
        billingAmount: req.body.billingAmount,
        invoiceNumber: req.body.invoiceNumber
      };
      
      console.log('BillingController.create - Received request body:', req.body);
      console.log('BillingController.create - Extracted billData:', billData);
      
      const bill = await this.createBill.execute(billData);
      res.status(201).json(bill);
    } catch (error) {
      console.error('Create bill error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};
      
      if (req.query.paymentStatus) {
        filters.paymentStatus = req.query.paymentStatus;
      }
      
      const bills = await this.getAllBills.execute(filters);
      res.json(bills);
    } catch (error) {
      console.error('Get bills error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const bill = await this.getBillById.execute(req.params.id);
      res.json(bill);
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(404).json({ message: error.message });
    }
  }

  async markAsPaid(req, res) {
    try {
      const paymentDetails = {
        paymentMethod: req.body.paymentMethod,
        chequeNumber: req.body.chequeNumber,
        chequeDate: req.body.chequeDate,
        chequeAmount: req.body.chequeAmount,
        bankName: req.body.bankName
      };
      
      const bill = await this.markBillAsPaid.execute(req.params.id, paymentDetails);
      res.json(bill);
    } catch (error) {
      console.error('Mark bill paid error:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = BillingController;
