class GetAllPettyCashAssignments {
  constructor(pettyCashAssignmentRepository) {
    this.pettyCashAssignmentRepository = pettyCashAssignmentRepository;
  }

  async execute() {
    return await this.pettyCashAssignmentRepository.getAll();
  }
}

module.exports = GetAllPettyCashAssignments;
