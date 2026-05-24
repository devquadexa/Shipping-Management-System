/**
 * Create Notification Use Case
 */
const Notification = require('../../../domain/entities/Notification');

class CreateNotification {
  constructor(notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  async execute(notificationData) {
    // Validate required fields
    if (!notificationData.userId || !notificationData.type || !notificationData.title || !notificationData.message) {
      throw new Error('userId, type, title, and message are required');
    }

    // Generate notification ID
    const notificationId = await this.notificationRepository.generateNextId();

    // Create notification entity
    const notification = new Notification({
      notificationId,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      relatedId: notificationData.relatedId || null,
      relatedType: notificationData.relatedType || null,
      metadata: notificationData.metadata || {},
      createdDate: new Date(),
      createdBy: notificationData.createdBy || null
    });

    // Validate
    const validation = notification.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Persist
    const createdNotification = await this.notificationRepository.create(notification);
    
    return createdNotification;
  }
}

module.exports = CreateNotification;
