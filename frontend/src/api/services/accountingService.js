import apiClient from '../client';

export const accountingService = {
  getDashboard: async () => {
    const response = await apiClient.get('/accounting/dashboard');
    return response.data;
  },
};
