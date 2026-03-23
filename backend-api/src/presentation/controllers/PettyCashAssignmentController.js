class PettyCashAssignmentController {
  constructor(container) {
    this.container = container;
  }

  async create(req, res) {
    try {
      const createPettyCashAssignment = this.container.resolve('createPettyCashAssignment');
      const assignmentData = {
        ...req.body,
        assignedBy: req.user.userId
      };
      const assignment = await createPettyCashAssignment.execute(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error in create:', error);
      res.status(500).json({ message: error.message || 'Error creating petty cash assignment' });
    }
  }

  async getAll(req, res) {
    try {
      const getAllPettyCashAssignments = this.container.resolve('getAllPettyCashAssignments');
      const assignments = await getAllPettyCashAssignments.execute();
      res.json(assignments);
    } catch (error) {
      console.error('Error in getAll:', error);
      res.status(500).json({ message: 'Error fetching petty cash assignments' });
    }
  }

  async getMyAssignments(req, res) {
    try {
      const getUserPettyCashAssignments = this.container.resolve('getUserPettyCashAssignments');
      const assignments = await getUserPettyCashAssignments.execute(req.user.userId);
      res.json(assignments);
    } catch (error) {
      console.error('Error in getMyAssignments:', error);
      res.status(500).json({ message: 'Error fetching your assignments' });
    }
  }

  async getByJob(req, res) {
    try {
      const { jobId } = req.params;
      const assignmentId = req.query.assignmentId ? parseInt(req.query.assignmentId, 10) : null;
      console.log('getByJob controller - jobId:', jobId);
      console.log('getByJob controller - assignmentId:', assignmentId);
      console.log('getByJob controller - userId:', req.user.userId);
      console.log('getByJob controller - userRole:', req.user.role);
      
      const getPettyCashAssignmentByJob = this.container.resolve('getPettyCashAssignmentByJob');
      
      // For Waff Clerk, get only their assignment for this job
      // For Manager/Admin/Super Admin, get all assignments for this job
      const assignment = await getPettyCashAssignmentByJob.execute(jobId, req.user.userId, req.user.role, assignmentId);
      console.log('getByJob controller - assignment:', assignment);
      console.log('getByJob controller - assignment type:', typeof assignment);
      console.log('getByJob controller - assignment keys:', assignment ? Object.keys(assignment) : 'null');
      console.log('getByJob controller - settlementItems:', assignment?.settlementItems);
      
      if (!assignment) {
        console.log('getByJob controller - No assignment found, returning 404');
        return res.status(404).json({ message: 'No petty cash assignment found for this job' });
      }
      
      console.log('getByJob controller - Returning assignment');
      res.json(assignment);
    } catch (error) {
      console.error('Error in getByJob:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Error fetching assignment' });
    }
  }

  async getAllByJob(req, res) {
    try {
      const { jobId } = req.params;
      console.log('getAllByJob controller - jobId:', jobId);
      
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      
      // Get ALL assignments for this job (for Invoicing)
      const assignments = await pettyCashAssignmentRepository.getAllByJob(jobId);
      console.log('getAllByJob controller - assignments count:', assignments.length);
      
      res.json(assignments);
    } catch (error) {
      console.error('Error in getAllByJob:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Error fetching assignments' });
    }
  }

  async getSettlementItems(req, res) {
    try {
      const { id } = req.params;
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      const items = await pettyCashAssignmentRepository.getSettlementItems(parseInt(id));
      res.json(items);
    } catch (error) {
      console.error('Error in getSettlementItems:', error);
      res.status(500).json({ message: 'Error fetching settlement items' });
    }
  }

  async settle(req, res) {
    try {
      console.log('=== CONTROLLER SETTLE START ===');
      const { id } = req.params;
      console.log('controller settle - id:', id);
      console.log('controller settle - req.user:', req.user);
      console.log('controller settle - req.body:', req.body);
      
      const settlePettyCashAssignment = this.container.resolve('settlePettyCashAssignment');
      
      // Add paidBy to each item if not provided
      const settlementData = {
        ...req.body,
        items: req.body.items.map(item => ({
          ...item,
          paidBy: item.paidBy || req.user.userId
        }))
      };
      
      console.log('controller settle - settlementData:', settlementData);
      
      const assignment = await settlePettyCashAssignment.execute(parseInt(id), settlementData);
      console.log('controller settle - returned assignment:', assignment);
      console.log('=== CONTROLLER SETTLE END ===');
      res.json(assignment);
    } catch (error) {
      console.error('Error in settle:', error);
      res.status(500).json({ message: error.message || 'Error settling petty cash' });
    }
  }

  async getUserBalancesSummary(req, res) {
    try {
      const getUserBalancesSummary = this.container.resolve('getUserBalancesSummary');
      const balances = await getUserBalancesSummary.execute();
      res.json(balances);
    } catch (error) {
      console.error('Error in getUserBalancesSummary:', error);
      res.status(500).json({ message: 'Error fetching user balances summary' });
    }
  }
}

module.exports = PettyCashAssignmentController;
