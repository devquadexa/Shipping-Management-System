/**
 * Cash Withdrawal Controller
 */
class CashWithdrawalController {
  constructor(createCashWithdrawal, getAllCashWithdrawals) {
    this.createCashWithdrawal = createCashWithdrawal;
    this.getAllCashWithdrawals = getAllCashWithdrawals;
  }

  async create(req, res) {
    try {
      const withdrawalData = {
        amount: req.body.amount,
        bankName: req.body.bankName,
        withdrawalDate: req.body.withdrawalDate,
        notes: req.body.notes,
        transactionType: req.body.transactionType || 'withdrawal'
      };
      
      const withdrawal = await this.createCashWithdrawal.execute(withdrawalData, req.user.userId);
      res.status(201).json(withdrawal);
    } catch (error) {
      console.error('Create cash withdrawal error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const withdrawals = await this.getAllCashWithdrawals.execute();
      res.json(withdrawals);
    } catch (error) {
      console.error('Get cash withdrawals error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = CashWithdrawalController;
