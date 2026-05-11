import apiClient from '../client';

export const cashWithdrawalService = {
  getAll: async () => {
    const response = await apiClient.get('/cash-withdrawals');
    return response.data;
  },

  create: async (withdrawalData) => {
    const response = await apiClient.post('/cash-withdrawals', withdrawalData);
    return response.data;
  },
};
