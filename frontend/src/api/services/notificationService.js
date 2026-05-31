import apiClient from '../client';

export const notificationService = {
  getNotifications: async (limit = 50, offset = 0) => {
    const response = await apiClient.get('/notifications', {
      params: { limit, offset }
    });
    return response.data;
  },

  getUnreadNotifications: async (limit = 50, offset = 0) => {
    const response = await apiClient.get('/notifications/unread', {
      params: { limit, offset }
    });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  }
};
