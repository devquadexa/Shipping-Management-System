/**
 * Notification Routes
 */
const express = require('express');
const { auth } = require('../../middleware/auth');

module.exports = (container) => {
  const router = express.Router();

  const notificationController = new (require('../controllers/NotificationController'))(
    container.get('createNotification'),
    container.get('getUserNotifications'),
    container.get('getUnreadNotifications'),
    container.get('markNotificationAsRead'),
    container.get('markAllNotificationsAsRead')
  );

  // Get current user's notifications
  router.get('/', auth, (req, res) => notificationController.getMyNotifications(req, res));

  // Get current user's unread notifications
  router.get('/unread', auth, (req, res) => notificationController.getMyUnreadNotifications(req, res));

  // Mark specific notification as read
  router.patch('/:notificationId/read', auth, (req, res) => notificationController.markAsRead(req, res));

  // Mark all notifications as read
  router.patch('/mark-all-read', auth, (req, res) => notificationController.markAllAsRead(req, res));

  return router;
};
