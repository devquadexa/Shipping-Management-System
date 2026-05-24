/**
 * Mark Notification As Read Use Case
 */
class MarkNotificationAsRead {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(notificationId) {
    if (!notificationId) {
      throw new Error('Notification ID is required');
    }

    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = await this.notificationRepository.markAsRead(notificationId);
    
    return updatedNotification;
  }
}

module.exports = MarkNotificationAsRead;
