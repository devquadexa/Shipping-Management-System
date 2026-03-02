import apiClient from '../client';

export const pettyCashService = {
  getAll: async () => {
    const response = await apiClient.get('/petty-cash');
    return response.data;
  },

  create: async (pettyCashData) => {
    const response = await apiClient.post('/petty-cash', pettyCashData);
    return response.data;
  },

  getBalance: async () => {
    const response = await apiClient.get('/petty-cash/balance');
    return response.data;
  },

  updateBalance: async (balanceData) => {
    const response = await apiClient.post('/petty-cash/balance', balanceData);
    return response.data;
  },
};
