import apiClient from '../client';

export const billingService = {
  getPayItems: async () => {
    const response = await apiClient.get('/billing/pay-items');
    return response.data;
  },

  createPayItem: async (payItemData) => {
    const response = await apiClient.post('/billing/pay-items', payItemData);
    return response.data;
  },

  updatePayItem: async (payItemId, payItemData) => {
    const response = await apiClient.put(`/billing/pay-items/${payItemId}`, payItemData);
    return response.data;
  },

  deletePayItem: async (payItemId) => {
    const response = await apiClient.delete(`/billing/pay-items/${payItemId}`);
    return response.data;
  },

  getBills: async () => {
    const response = await apiClient.get('/billing');
    return response.data;
  },

  createBill: async (billData) => {
    console.log('billingService.createBill - sending to backend:', billData);
    const response = await apiClient.post('/billing', billData);
    console.log('billingService.createBill - response:', response.data);
    return response.data;
  },

  getBillDetails: async (billId) => {
    const response = await apiClient.get(`/billing/${billId}`);
    return response.data;
  },

  updateBill: async (billId, billData) => {
    const response = await apiClient.put(`/billing/${billId}`, billData);
    return response.data;
  },
};
