import apiClient from '../client';

export const customerService = {
  getAll: async () => {
    const response = await apiClient.get('/customers');
    return response.data;
  },

  create: async (customerData) => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  update: async (customerId, customerData) => {
    const response = await apiClient.put(`/customers/${customerId}`, customerData);
    return response.data;
  },

  delete: async (customerId) => {
    const response = await apiClient.delete(`/customers/${customerId}`);
    return response.data;
  },
};
