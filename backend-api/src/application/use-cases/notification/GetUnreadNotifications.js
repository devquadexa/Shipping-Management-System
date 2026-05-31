/**
 * Get Unread Notifications Use Case
 */
class GetUnreadNotifications {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId, limit = 50, offset = 0) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const notifications = await this.notificationRepository.findUnreadByUserId(userId, limit, offset);
    const unreadCount = await this.notificationRepository.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
      total: notifications.length
    };
  }
}

module.exports = GetUnreadNotifications;
