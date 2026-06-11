/**
 * Notification Domain Entity
 * Represents a system notification for users
 */
class Notification {
  constructor({
    notificationId,
    userId,
    type, // 'JOB_ASSIGNED', 'PETTY_CASH_ASSIGNED', 'JOB_UPDATED', 'PAYMENT_RECEIVED', 'BILL_GENERATED', 'SETTLEMENT_COMPLETED'
    title,
    message,
    relatedId = null, // jobId or assignmentId
    relatedType = null, // 'Job', 'PettyCashAssignment', 'Bill', etc.
    isRead = false,
    readDate = null,
    metadata = {},
    createdDate = new Date(),
    createdBy = null
  }) {
    this.notificationId = notificationId;
    this.userId = userId;
    this.type = type;
    this.title = title;
    this.message = message;
    this.relatedId = relatedId;
    this.relatedType = relatedType;
    this.isRead = isRead;
    this.readDate = readDate;
    this.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    this.createdDate = createdDate;
    this.createdBy = createdBy;
  }

  validate() {
    const errors = [];
    
    if (!this.userId) errors.push('User ID is required');
    if (!this.type) errors.push('Notification type is required');
    if (!this.title) errors.push('Title is required');
    if (!this.message) errors.push('Message is required');
    
    const validTypes = [
      'JOB_ASSIGNED',
      'PETTY_CASH_ASSIGNED',
      'JOB_UPDATED',
      'PAYMENT_RECEIVED',
      'BILL_GENERATED',
      'SETTLEMENT_COMPLETED',
      'PASSWORD_RESET_APPROVED',
      'PASSWORD_RESET_REJECTED',
      'USER_CREATED',
      'SYSTEM_ALERT',
      'invoice_review',
      'invoice_review_approved',
      'invoice_review_rejected'
    ];
    
    if (!validTypes.includes(this.type)) {
      errors.push(`Invalid notification type: ${this.type}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  markAsRead() {
    this.isRead = true;
    this.readDate = new Date();
  }

  markAsUnread() {
    this.isRead = false;
    this.readDate = null;
  }

  getMetadata() {
    return this.metadata;
  }

  setMetadata(metadata) {
    this.metadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  }

  toJSON() {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      relatedId: this.relatedId,
      relatedType: this.relatedType,
      isRead: this.isRead,
      readDate: this.readDate,
      metadata: this.metadata,
      createdDate: this.createdDate,
      createdBy: this.createdBy
    };
  }
}

module.exports = Notification;
