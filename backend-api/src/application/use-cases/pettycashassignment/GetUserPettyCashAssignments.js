class GetUserPettyCashAssignments {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute(userId) {
    return await this.pettyCashAssignmentRepository.getByUser(userId);
  }
}

module.exports = GetUserPettyCashAssignments;
