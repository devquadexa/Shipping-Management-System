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
};