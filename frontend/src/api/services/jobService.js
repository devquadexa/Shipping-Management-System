import apiClient from '../client';

export const jobService = {
  getAll: async () => {
    const response = await apiClient.get('/jobs');
    return response.data;
  },

  create: async (jobData) => {
    const response = await apiClient.post('/jobs', jobData);
    return response.data;
  },

  update: async (jobId, jobData) => {
    const response = await apiClient.put(`/jobs/${jobId}`, jobData);
    return response.data;
  },

  updateStatus: async (jobId, status) => {
    const response = await apiClient.patch(`/jobs/${jobId}/status`, { status });
    return response.data;
  },

  delete: async (jobId) => {
    const response = await apiClient.delete(`/jobs/${jobId}`);
    return response.data;
  },

  assignUser: async (jobId, userId) => {
    const response = await apiClient.patch(`/jobs/${jobId}/assign`, { userId });
    return response.data;
  },

  addPayItem: async (jobId, payItemData) => {
    const response = await apiClient.post(`/jobs/${jobId}/pay-items`, payItemData);
    return response.data;
  },
};
