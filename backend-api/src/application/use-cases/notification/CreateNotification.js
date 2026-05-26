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

    console.log(`[CreateNotification] Creating notification for user ${notificationData.userId}, type: ${notificationData.type}`);

    // Generate notification ID
    const notificationId = await this.notificationRepository.generateNextId();
    console.log(`[CreateNotification] Generated notification ID: ${notificationId}`);

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
    console.log(`[CreateNotification] Persisting notification to database`);
    const createdNotification = await this.notificationRepository.create(notification);
    console.log(`[CreateNotification] Notification created successfully: ${JSON.stringify(createdNotification)}`);
    
    return createdNotification;
  }
}

module.exports = CreateNotification;
