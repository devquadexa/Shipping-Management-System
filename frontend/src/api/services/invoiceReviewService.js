import apiClient from '../client';

export const invoiceReviewService = {
  sendReview: async (reviewData) => {
    const response = await apiClient.post('/invoice-reviews', reviewData);
    return response.data;
  },

  getReviews: async () => {
    const response = await apiClient.get('/invoice-reviews');
    return response.data;
  },

  getReviewsByJob: async (jobId) => {
    const response = await apiClient.get(`/invoice-reviews/job/${jobId}`);
    return response.data;
  },

  getReviewsForClerk: async (clerkId) => {
    const response = await apiClient.get(`/invoice-reviews/clerk/${clerkId}`);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await apiClient.put(`/invoice-reviews/${reviewId}`, reviewData);
    return response.data;
  },

  approveReview: async (reviewId) => {
    const response = await apiClient.patch(`/invoice-reviews/${reviewId}/approve`);
    return response.data;
  },

  rejectReview: async (reviewId, reason) => {
    const response = await apiClient.patch(`/invoice-reviews/${reviewId}/reject`, {
      rejectionReason: reason
    });
    return response.data;
  },
};
