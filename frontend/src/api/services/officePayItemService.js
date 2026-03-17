import apiClient from '../client';

export const officePayItemService = {
  // Create a new office pay item
  create: async (payItemData) => {
    const response = await apiClient.post('/office-pay-items', payItemData);
    return response.data;
  },

  // Get office pay items for a specific job
  getByJobId: async (jobId) => {
    const response = await apiClient.get(`/office-pay-items/job/${jobId}`);
    return response.data;
  },

  // Update an office pay item (mainly for billing amounts)
  update: async (officePayItemId, updateData) => {
    const response = await apiClient.put(`/office-pay-items/${officePayItemId}`, updateData);
    return response.data;
  },

  // Delete an office pay item
  delete: async (officePayItemId) => {
    const response = await apiClient.delete(`/office-pay-items/${officePayItemId}`);
    return response.data;
  }
};