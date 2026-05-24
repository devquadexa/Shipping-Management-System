/**
 * Notification Controller
 * Handles notification-related HTTP requests
 */
class NotificationController {
  constructor(
    createNotification,
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  ) {
    this.createNotification = createNotification;
    this.getUserNotifications = getUserNotifications;
    this.getUnreadNotifications = getUnreadNotifications;
    this.markNotificationAsRead = markNotificationAsRead;
    this.markAllNotificationsAsRead = markAllNotificationsAsRead;
  }

  async create(req, res) {
    try {
      const notification = await this.createNotification.execute(req.body);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async getMyNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const result = await this.getUserNotifications.execute(req.user.userId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getMyUnreadNotifications(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      const result = await this.getUnreadNotifications.execute(req.user.userId, limit, offset);
      res.json(result);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      res.status(500).json({ message: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const notification = await this.markNotificationAsRead.execute(notificationId);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(400).json({ message: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const result = await this.markAllNotificationsAsRead.execute(req.user.userId);
      res.json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = NotificationController;
