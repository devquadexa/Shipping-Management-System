import apiClient from '../client';

export const transporterService = {
  getAll: async () => {
    const response = await apiClient.get('/transporters');
    return response.data;
  },

  create: async (transporterData) => {
    const response = await apiClient.post('/transporters', transporterData);
    return response.data;
  },

  update: async (transporterId, transporterData) => {
    const response = await apiClient.put(`/transporters/${transporterId}`, transporterData);
    return response.data;
  },

  delete: async (transporterId) => {
    const response = await apiClient.delete(`/transporters/${transporterId}`);
    return response.data;
  },

  // Payment methods
  recordPayment: async (jobId, paymentData) => {
    const response = await apiClient.post('/transporters/payments/record', {
      jobId,
      ...paymentData,
    });
    return response.data;
  },

  getPaymentHistory: async (transporterId, filters = {}) => {
    const response = await apiClient.get(`/transporters/${transporterId}/payments`, {
      params: filters,
    });
    return response.data;
  },

  updatePaymentStatus: async (paymentId, status) => {
    const response = await apiClient.put(`/transporters/payments/${paymentId}/status`, {
      status,
    });
    return response.data;
  },
};