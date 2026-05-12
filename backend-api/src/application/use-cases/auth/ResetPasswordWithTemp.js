/**
 * Reset Password With Temporary Password Use Case
 * Used when user logs in with temporary password and must set new password
 */
const bcrypt = require('bcryptjs');

class ResetPasswordWithTemp {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, temporaryPassword, newPassword) {
    if (!userId || !temporaryPassword || !newPassword) {
      throw new Error('User ID, temporary password, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify temporary password
    const isValidPassword = await bcrypt.compare(temporaryPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Temporary password is incorrect');
    }

    // Check if new password is same as temporary
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from temporary password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear temporary flags
    await this.userRepository.updatePassword(userId, hashedPassword, false, false);

    return { success: true, message: 'Password reset successfully' };
  }
}

module.exports = ResetPasswordWithTemp;
