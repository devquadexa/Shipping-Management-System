const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const NotificationController = require('../controllers/NotificationController');

// Get unread notification count (must be before /:notificationId routes)
router.get('/unread-count', auth, NotificationController.getUnreadCount);

// Mark all notifications as read (must be before /:notificationId routes)
router.patch('/read-all', auth, NotificationController.markAllAsRead);

// Get all notifications for current user
router.get('/', auth, NotificationController.getNotifications);

// Mark notification as read
router.patch('/:notificationId/read', auth, NotificationController.markAsRead);

module.exports = router;
