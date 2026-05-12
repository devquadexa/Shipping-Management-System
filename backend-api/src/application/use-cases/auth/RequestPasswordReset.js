/**
 * Request Password Reset Use Case
 * Used when user clicks "Forgot Password" on login page
 */
const PasswordResetRequest = require('../../../domain/entities/PasswordResetRequest');

class RequestPasswordReset {
  constructor(userRepository, passwordResetRepository) {
    this.userRepository = userRepository;
    this.passwordResetRepository = passwordResetRepository;
  }

  async execute(username) {
    if (!username) {
      throw new Error('Username is required');
    }

    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { 
        success: true, 
        message: 'If the username exists, a password reset request has been sent to the administrator' 
      };
    }

    // Generate request ID
    const requestId = `PWRST${Date.now()}`;

    // Create password reset request
    const request = new PasswordResetRequest({
      requestId,
      userId: user.userId,
      userName: user.username,
      userFullName: user.fullName,
      requestedBy: user.userId, // Self-requested
      requestedByName: user.fullName,
      requestDate: new Date(),
      status: 'Pending'
    });

    await this.passwordResetRepository.create(request);

    return { 
      success: true, 
      message: 'Password reset request has been sent to the administrator' 
    };
  }
}

module.exports = RequestPasswordReset;
