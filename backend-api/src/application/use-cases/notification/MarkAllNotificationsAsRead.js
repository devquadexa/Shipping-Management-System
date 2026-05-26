/**
 * Mark All Notifications As Read Use Case
 */
class MarkAllNotificationsAsRead {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const result = await this.notificationRepository.markAllAsRead(userId);
    
    return result;
  }
}

module.exports = MarkAllNotificationsAsRead;
