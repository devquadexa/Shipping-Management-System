/**
 * Get Password Reset Requests Use Case
 * Used by Super Admin to view all password reset requests
 */
class GetPasswordResetRequests {
  constructor(passwordResetRepository) {
    this.passwordResetRepository = passwordResetRepository;
  }

  async execute(status = null) {
    if (status === 'Pending') {
      return await this.passwordResetRepository.findPendingRequests();
    }
    
    return await this.passwordResetRepository.findAll();
  }
}

module.exports = GetPasswordResetRequests;
