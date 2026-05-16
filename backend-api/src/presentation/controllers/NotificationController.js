const { getConnection, sql } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

class NotificationController {
  static async getNotifications(req, res) {
    const userId = req.user?.userId;
    console.log('Getting notifications for userId:', userId);

    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .query(`
          SELECT * FROM notifications 
          WHERE userId = @userId 
          ORDER BY createdDate DESC
        `);

      console.log('Notifications found:', result.recordset.length);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        message: 'Error fetching notifications',
        error: error.message
      });
    }
  }

  static async getUnreadCount(req, res) {
    const userId = req.user?.userId;
    console.log('Getting unread count for userId:', userId);

    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .query(`
          SELECT COUNT(*) as unreadCount FROM notifications 
          WHERE userId = @userId AND isRead = 0
        `);

      const unreadCount = result.recordset[0]?.unreadCount || 0;
      console.log('Unread count:', unreadCount);
      res.json({ unreadCount });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        message: 'Error fetching unread count',
        error: error.message
      });
    }
  }

  static async markAsRead(req, res) {
    const { notificationId } = req.params;
    const userId = req.user?.userId;

    try {
      const pool = await getConnection();

      await pool.request()
        .input('notificationId', sql.VarChar(50), notificationId)
        .input('userId', sql.VarChar(50), userId)
        .input('readDate', sql.DateTime, new Date())
        .query(`
          UPDATE notifications 
          SET isRead = 1, readDate = @readDate
          WHERE notificationId = @notificationId AND userId = @userId
        `);

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        message: 'Error marking notification as read',
        error: error.message
      });
    }
  }

  static async markAllAsRead(req, res) {
    const userId = req.user?.userId;

    try {
      const pool = await getConnection();

      await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .input('readDate', sql.DateTime, new Date())
        .query(`
          UPDATE notifications 
          SET isRead = 1, readDate = @readDate
          WHERE userId = @userId AND isRead = 0
        `);

      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        message: 'Error marking all notifications as read',
        error: error.message
      });
    }
  }

  static async createNotification(userId, type, title, message, relatedId = null) {
    try {
      console.log('Creating notification for userId:', userId, 'type:', type);
      const pool = await getConnection();
      const notificationId = uuidv4();

      await pool.request()
        .input('notificationId', sql.VarChar(50), notificationId)
        .input('userId', sql.VarChar(50), userId)
        .input('type', sql.VarChar(50), type)
        .input('title', sql.NVarChar(255), title)
        .input('message', sql.NVarChar(sql.MAX), message)
        .input('relatedId', sql.VarChar(50), relatedId)
        .input('createdDate', sql.DateTime, new Date())
        .query(`
          INSERT INTO notifications (
            notificationId, userId, type, title, message, relatedId, createdDate
          ) VALUES (
            @notificationId, @userId, @type, @title, @message, @relatedId, @createdDate
          )
        `);

      console.log('Notification created successfully:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationController;
