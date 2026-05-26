import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Notifications.css';

function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'unread' ? '/api/notifications/unread' : '/api/notifications';
      const response = await axios.get(endpoint, {
        params: { limit: 100 }
      });
      
      let notifs = response.data.notifications || [];
      
      // Filter read notifications if needed
      if (filter === 'read') {
        notifs = notifs.filter(n => n.isRead);
      }
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      console.log('Notification clicked:', notification);
      
      // Mark as read if unread
      if (!notification.isRead) {
        await axios.patch(`/api/notifications/${notification.notificationId}/read`);
      }
      
      // Navigate based on notification type
      navigateToRelatedPage(notification);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const navigateToRelatedPage = (notification) => {
    const { type, relatedType, relatedId, metadata } = notification;
    
    // Parse metadata if it's a string
    let parsedMetadata = metadata;
    if (typeof metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
        parsedMetadata = {};
      }
    }
    
    console.log('Navigating with:', { type, relatedType, relatedId, metadata: parsedMetadata });

    switch (type) {
      case 'JOB_ASSIGNED':
      case 'JOB_UPDATED':
        console.log('Navigating to /jobs');
        navigate('/jobs', { 
          state: { 
            highlightJobId: parsedMetadata?.jobId || relatedId,
            scrollToJob: true 
          } 
        });
        break;

      case 'PETTY_CASH_ASSIGNED':
        console.log('Navigating to /petty-cash');
        navigate('/petty-cash', { 
          state: { 
            highlightAssignmentId: parsedMetadata?.assignmentId || relatedId,
            scrollToAssignment: true,
            jobId: parsedMetadata?.jobId
          } 
        });
        break;

      case 'BILL_GENERATED':
      case 'PAYMENT_RECEIVED':
        console.log('Navigating to /billing');
        navigate('/billing', { 
          state: { 
            highlightBillId: parsedMetadata?.billId || relatedId,
            scrollToBill: true 
          } 
        });
        break;

      case 'SETTLEMENT_COMPLETED':
        console.log('Navigating to /petty-cash');
        navigate('/petty-cash', { 
          state: { 
            highlightAssignmentId: parsedMetadata?.assignmentId || relatedId,
            scrollToAssignment: true 
          } 
        });
        break;

      default:
        console.log('Unknown notification type, navigating to /');
        navigate('/');
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'JOB_ASSIGNED':
        return '📋';
      case 'PETTY_CASH_ASSIGNED':
        return '💰';
      case 'JOB_UPDATED':
        return '🔄';
      case 'BILL_GENERATED':
        return '📄';
      case 'PAYMENT_RECEIVED':
        return '💳';
      case 'SETTLEMENT_COMPLETED':
        return '✅';
      case 'PASSWORD_RESET_APPROVED':
        return '🔓';
      case 'PASSWORD_RESET_REJECTED':
        return '🔒';
      case 'USER_CREATED':
        return '👤';
      case 'SYSTEM_ALERT':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <div className="notifications-page-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <button className="mark-all-read-button" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="notifications-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>

        {loading ? (
          <div className="notifications-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="empty-icon">🔔</span>
            <h2>No notifications</h2>
            <p>
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications." 
                : filter === 'read'
                ? "No read notifications yet."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="notifications-list-page">
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-card-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-card-content">
                  <div className="notification-card-header">
                    <h3 className="notification-card-title">{notification.title}</h3>
                    {!notification.isRead && <div className="unread-indicator"></div>}
                  </div>
                  <p className="notification-card-message">{notification.message}</p>
                  <div className="notification-card-footer">
                    <span className="notification-card-time">{formatDate(notification.createdDate)}</span>
                    <span className="notification-card-type">{notification.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
