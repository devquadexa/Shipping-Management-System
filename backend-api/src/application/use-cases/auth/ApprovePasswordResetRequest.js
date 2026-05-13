/**
 * Approve Password Reset Request Use Case
 * Super Admin approves request and assigns temporary password
 */
const bcrypt = require('bcryptjs');

class ApprovePasswordResetRequest {
  constructor(passwordResetRepository, userRepository) {
    this.passwordResetRepository = passwordResetRepository;
    this.userRepository = userRepository;
  }

  async execute(requestId, temporaryPassword, adminUserId, notes = null) {
    if (!requestId || !temporaryPassword || !adminUserId) {
      throw new Error('Request ID, temporary password, and admin user ID are required');
    }

    if (temporaryPassword.length < 6) {
      throw new Error('Temporary password must be at least 6 characters long');
    }

    // Get the request
    const request = await this.passwordResetRepository.findById(requestId);
    if (!request) {
      throw new Error('Password reset request not found');
    }

    if (request.status !== 'Pending') {
      throw new Error('This request has already been processed');
    }

    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Update user's password and set temporary flags
    await this.userRepository.updatePassword(
      request.userId, 
      hashedPassword, 
      true,  // isTemporaryPassword
      true   // passwordResetRequired
    );

    // Update request status
    await this.passwordResetRepository.updateStatus(
      requestId, 
      'Approved', 
      adminUserId, 
      notes
    );

    return { 
      success: true, 
      message: 'Password reset request approved. Temporary password has been set.',
      temporaryPassword // Return to admin so they can share with user
    };
  }
}

module.exports = ApprovePasswordResetRequest;
