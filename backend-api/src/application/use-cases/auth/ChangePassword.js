/**
 * Change Password Use Case
 * Used when user changes password from profile (knows old password)
 */
const bcrypt = require('bcryptjs');

class ChangePassword {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, oldPassword, newPassword) {
    if (!userId || !oldPassword || !newPassword) {
      throw new Error('User ID, old password, and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.updatePassword(userId, hashedPassword, false, false);

    return { success: true, message: 'Password changed successfully' };
  }
}

module.exports = ChangePassword;
