/**
 * Reject Password Reset Request Use Case
 * Super Admin rejects the password reset request
 */
class RejectPasswordResetRequest {
  constructor(passwordResetRepository) {
    this.passwordResetRepository = passwordResetRepository;
  }

  async execute(requestId, adminUserId, notes = null) {
    if (!requestId || !adminUserId) {
      throw new Error('Request ID and admin user ID are required');
    }

    // Get the request
    const request = await this.passwordResetRepository.findById(requestId);
    if (!request) {
      throw new Error('Password reset request not found');
    }

    if (request.status !== 'Pending') {
      throw new Error('This request has already been processed');
    }

    // Update request status
    await this.passwordResetRepository.updateStatus(
      requestId, 
      'Rejected', 
      adminUserId, 
      notes || 'Request rejected by administrator'
    );

    return { 
      success: true, 
      message: 'Password reset request has been rejected' 
    };
  }
}

module.exports = RejectPasswordResetRequest;
