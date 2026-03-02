import apiClient from '../client';

export const authService = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/auth/users');
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await apiClient.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/auth/users/${userId}`);
    return response.data;
  },
};
