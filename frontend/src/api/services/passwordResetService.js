/**
 * Password Reset API Service
 */
import apiClient from '../client';

export const passwordResetService = {
  // Change password (user knows old password)
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/password-reset/change-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  },

  // Reset password with temporary password
  resetPasswordWithTemp: async (temporaryPassword, newPassword) => {
    const response = await apiClient.post('/password-reset/reset-password-temp', {
      temporaryPassword,
      newPassword
    });
    return response.data;
  },

  // Request password reset (forgot password)
  requestPasswordReset: async (username) => {
    const response = await apiClient.post('/password-reset/request-password-reset', {
      username
    });
    return response.data;
  },

  // Get all password reset requests (Super Admin)
  getPasswordResetRequests: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/password-reset/password-reset-requests${params}`);
    return response.data;
  },

  // Approve password reset request (Super Admin)
  approvePasswordResetRequest: async (requestId, temporaryPassword, notes = null) => {
    const response = await apiClient.post(`/password-reset/approve-password-reset/${requestId}`, {
      temporaryPassword,
      notes
    });
    return response.data;
  },

  // Reject password reset request (Super Admin)
  rejectPasswordResetRequest: async (requestId, notes = null) => {
    const response = await apiClient.post(`/password-reset/reject-password-reset/${requestId}`, {
      notes
    });
    return response.data;
  }
};
