import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/NotificationBell.css';

function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/unread', {
        params: { limit: 10 }
      });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (e, notification) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('=== NOTIFICATION CLICK DEBUG ===');
    console.log('1. Click event fired');
    console.log('2. Notification:', notification);
    
    try {
      // Mark as read first
      console.log('3. Marking as read...');
      await axios.patch(`/api/notifications/${notification.notificationId}/read`);
      console.log('4. Marked as read successfully');
      
      // Close dropdown
      setIsOpen(false);
      
      // Navigate based on notification type
      console.log('5. Navigating...');
      navigateToRelatedPage(notification);
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('ERROR in handleNotificationClick:', error);
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
        // Navigate to Jobs page
        console.log('Navigating to /jobs');
        navigate('/jobs', { 
          state: { 
            highlightJobId: parsedMetadata?.jobId || relatedId,
            scrollToJob: true 
          } 
        });
        break;

      case 'PETTY_CASH_ASSIGNED':
        // Navigate to Petty Cash page
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
        // Navigate to Billing page
        console.log('Navigating to /billing');
        navigate('/billing', { 
          state: { 
            highlightBillId: parsedMetadata?.billId || relatedId,
            scrollToBill: true 
          } 
        });
        break;

      case 'SETTLEMENT_COMPLETED':
        // Navigate to Petty Cash page
        console.log('Navigating to /petty-cash');
        navigate('/petty-cash', { 
          state: { 
            highlightAssignmentId: parsedMetadata?.assignmentId || relatedId,
            scrollToAssignment: true 
          } 
        });
        break;

      case 'PASSWORD_RESET_APPROVED':
      case 'PASSWORD_RESET_REJECTED':
      case 'USER_CREATED':
        // Navigate to Dashboard
        console.log('Navigating to /');
        navigate('/');
        break;

      default:
        // Default to dashboard for unknown types
        console.log('Unknown notification type, navigating to /');
        navigate('/');
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await axios.patch('/api/notifications/mark-all-read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
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
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
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

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-button" 
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-overlay" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn" 
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                >
                  {loading ? 'Marking...' : 'Mark all as read'}
                </button>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <span className="no-notif-icon">🔔</span>
                  <p>No new notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={(e) => handleNotificationClick(e, notification)}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ cursor: 'pointer' }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatDate(notification.createdDate)}</div>
                    </div>
                    {!notification.isRead && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="notification-footer">
                <button 
                  className="view-all-btn"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/notifications');
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
