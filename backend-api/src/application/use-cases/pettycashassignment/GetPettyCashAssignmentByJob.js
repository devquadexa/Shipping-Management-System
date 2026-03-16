class GetPettyCashAssignmentByJob {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(jobId, userId, userRole) {
    // For Waff Clerk, get only their assignment for this job
    if (userRole === 'Waff Clerk') {
      return await this.pettyCashAssignmentRepository.getByJobAndUser(jobId, userId);
    }
    
    // For Manager/Admin/Super Admin, get all assignments for this job
    return await this.pettyCashAssignmentRepository.getByJob(jobId);
  }
}

module.exports = GetPettyCashAssignmentByJob;
