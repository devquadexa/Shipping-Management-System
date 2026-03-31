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
  
  async updateSettlementItem(req, res) {
    try {
      const { assignmentId, itemId } = req.params;
      const { itemName, actualCost } = req.body;
      const userId = req.user.userId;
      
      console.log('updateSettlementItem - assignmentId:', assignmentId, 'itemId:', itemId);
      console.log('updateSettlementItem - userId:', userId, 'data:', { itemName, actualCost });
      
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      const billRepository = this.container.resolve('billRepository');
      
      // 1. Get assignment to verify ownership and get jobId
      const assignment = await pettyCashAssignmentRepository.findById(parseInt(assignmentId));
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // 2. Verify this assignment belongs to the requesting user
      if (assignment.assignedTo !== userId) {
        return res.status(403).json({ message: 'You can only edit your own settlement items' });
      }
      
      // 3. Verify assignment is in "Settled" status
      if (assignment.status !== 'Settled') {
        return res.status(400).json({ message: 'Can only edit items in Settled status' });
      }
      
      // 4. Check if invoice has been generated for this job
      const bills = await billRepository.findByJob(assignment.jobId);
      if (bills && bills.length > 0) {
        return res.status(400).json({ message: 'Cannot edit - Invoice already generated for this job' });
      }
      
      // 5. Update the settlement item
      const updatedItem = await pettyCashAssignmentRepository.updateSettlementItem(
        parseInt(itemId),
        itemName,
        parseFloat(actualCost)
      );
      
      // 6. Recalculate assignment totals
      await pettyCashAssignmentRepository.recalculateAssignmentTotals(parseInt(assignmentId));
      
      res.json({ 
        message: 'Settlement item updated successfully',
        item: updatedItem
      });
    } catch (error) {
      console.error('Error in updateSettlementItem:', error);
      res.status(500).json({ message: error.message || 'Error updating settlement item' });
    }
  }
  
  async deleteSettlementItem(req, res) {
    try {
      const { assignmentId, itemId } = req.params;
      const userId = req.user.userId;
      
      console.log('deleteSettlementItem - assignmentId:', assignmentId, 'itemId:', itemId);
      console.log('deleteSettlementItem - userId:', userId);
      
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      const billRepository = this.container.resolve('billRepository');
      
      // 1. Get assignment to verify ownership and get jobId
      const assignment = await pettyCashAssignmentRepository.findById(parseInt(assignmentId));
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // 2. Verify this assignment belongs to the requesting user
      if (assignment.assignedTo !== userId) {
        return res.status(403).json({ message: 'You can only delete your own settlement items' });
      }
      
      // 3. Verify assignment is in "Settled" status
      if (assignment.status !== 'Settled') {
        return res.status(400).json({ message: 'Can only delete items in Settled status' });
      }
      
      // 4. Check if invoice has been generated for this job
      const bills = await billRepository.findByJob(assignment.jobId);
      if (bills && bills.length > 0) {
        return res.status(400).json({ message: 'Cannot delete - Invoice already generated for this job' });
      }
      
      // 5. Get settlement items count
      const items = await pettyCashAssignmentRepository.getSettlementItems(parseInt(assignmentId));
      if (items.length <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last settlement item' });
      }
      
      // 6. Delete the settlement item
      await pettyCashAssignmentRepository.deleteSettlementItem(parseInt(itemId));
      
      // 7. Recalculate assignment totals
      await pettyCashAssignmentRepository.recalculateAssignmentTotals(parseInt(assignmentId));
      
      res.json({ message: 'Settlement item deleted successfully' });
    } catch (error) {
      console.error('Error in deleteSettlementItem:', error);
      res.status(500).json({ message: error.message || 'Error deleting settlement item' });
    }
  }

  async closeAssignment(req, res) {
    try {
      const { id } = req.params;
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      await pettyCashAssignmentRepository.updateStatus(parseInt(id), 'Closed');
      res.json({ message: 'Assignment closed successfully' });
    } catch (error) {
      console.error('Error in closeAssignment:', error);
      res.status(500).json({ message: error.message || 'Error closing assignment' });
    }
  }

  async getGrouped(req, res) {
    try {
      const getGroupedAssignments = this.container.resolve('getGroupedAssignments');
      const grouped = await getGroupedAssignments.execute();
      res.json(grouped);
    } catch (error) {
      console.error('Error in getGrouped:', error);
      res.status(500).json({ message: 'Error fetching grouped assignments' });
    }
  }

  async getMyGrouped(req, res) {
    try {
      const getGroupedAssignments = this.container.resolve('getGroupedAssignments');
      const grouped = await getGroupedAssignments.execute(req.user.userId);
      res.json(grouped);
    } catch (error) {
      console.error('Error in getMyGrouped:', error);
      res.status(500).json({ message: 'Error fetching your grouped assignments' });
    }
  }

  async settleGroup(req, res) {
    try {
      const { groupId } = req.params;
      const settleGroupedAssignments = this.container.resolve('settleGroupedAssignments');
      const results = await settleGroupedAssignments.execute(groupId, req.body);
      res.json({ message: 'Group settled successfully', results });
    } catch (error) {
      console.error('Error in settleGroup:', error);
      res.status(500).json({ message: error.message || 'Error settling group' });
    }
  }

  async getAggregated(req, res) {
    try {
      const getAggregatedAssignments = this.container.resolve('getAggregatedAssignments');
      const aggregated = await getAggregatedAssignments.execute();
      res.json(aggregated);
    } catch (error) {
      console.error('Error in getAggregated:', error);
      res.status(500).json({ message: 'Error fetching aggregated assignments' });
    }
  }

  async getMyAggregated(req, res) {
    try {
      const getAggregatedAssignments = this.container.resolve('getAggregatedAssignments');
      const aggregated = await getAggregatedAssignments.execute(req.user.userId);
      res.json(aggregated);
    } catch (error) {
      console.error('Error in getMyAggregated:', error);
      res.status(500).json({ message: 'Error fetching your aggregated assignments' });
    }
  }

  async getWithChildren(req, res) {
    try {
      const getAssignmentsWithChildren = this.container.resolve('getAssignmentsWithChildren');
      const assignments = await getAssignmentsWithChildren.execute();
      res.json(assignments);
    } catch (error) {
      console.error('Error in getWithChildren:', error);
      res.status(500).json({ message: 'Error fetching assignments with children' });
    }
  }

  async getMyWithChildren(req, res) {
    try {
      const getAssignmentsWithChildren = this.container.resolve('getAssignmentsWithChildren');
      const assignments = await getAssignmentsWithChildren.execute(req.user.userId);
      res.json(assignments);
    } catch (error) {
      console.error('Error in getMyWithChildren:', error);
      res.status(500).json({ message: 'Error fetching your assignments with children' });
    }
  }

  async createSubAssignment(req, res) {
    try {
      const { id } = req.params;
      const createSubAssignment = this.container.resolve('createSubAssignment');
      const subAssignmentData = {
        ...req.body,
        assignedBy: req.user.userId
      };
      const subAssignment = await createSubAssignment.execute(parseInt(id), subAssignmentData);
      res.status(201).json(subAssignment);
    } catch (error) {
      console.error('Error in createSubAssignment:', error);
      res.status(500).json({ message: error.message || 'Error creating sub-assignment' });
    }
  }

  async getSubAssignments(req, res) {
    try {
      const { id } = req.params;
      const pettyCashAssignmentRepository = this.container.resolve('pettyCashAssignmentRepository');
      const subAssignments = await pettyCashAssignmentRepository.getSubAssignments(parseInt(id));
      res.json(subAssignments);
    } catch (error) {
      console.error('Error in getSubAssignments:', error);
      res.status(500).json({ message: 'Error fetching sub-assignments' });
    }
  }
}

module.exports = PettyCashAssignmentController;
