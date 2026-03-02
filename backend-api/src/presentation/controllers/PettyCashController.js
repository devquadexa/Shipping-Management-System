/**
 * Petty Cash Controller
 * Handles HTTP requests for petty cash operations
 */
class PettyCashController {
  constructor(createPettyCashEntry, getAllPettyCashEntries, getPettyCashBalance) {
    this.createPettyCashEntry = createPettyCashEntry;
    this.getAllPettyCashEntries = getAllPettyCashEntries;
    this.getPettyCashBalance = getPettyCashBalance;
  }

  async create(req, res) {
    try {
      const entryData = {
        description: req.body.description,
        amount: req.body.amount,
        entryType: req.body.entryType,
        jobId: req.body.jobId || null
      };
      
      const entry = await this.createPettyCashEntry.execute(entryData, req.user.userId);
      res.status(201).json(entry);
    } catch (error) {
      console.error('Create petty cash entry error:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const filters = {};
      
      // Filter by user role
      if (req.user.role === 'User') {
        filters.createdBy = req.user.userId;
      }
      
      const result = await this.getAllPettyCashEntries.execute(filters);
      res.json(result);
    } catch (error) {
      console.error('Get petty cash entries error:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getBalance(req, res) {
    try {
      const balance = await this.getPettyCashBalance.execute();
      res.json({ balance });
    } catch (error) {
      console.error('Get balance error:', error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = PettyCashController;
