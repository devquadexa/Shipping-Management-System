/**
 * Password Reset Routes
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const router = express.Router();
  
  try {
    const changePassword = container.get('changePassword');
    const resetPasswordWithTemp = container.get('resetPasswordWithTemp');
    const requestPasswordReset = container.get('requestPasswordReset');
    const getPasswordResetRequests = container.get('getPasswordResetRequests');
    const approvePasswordResetRequest = container.get('approvePasswordResetRequest');
    const rejectPasswordResetRequest = container.get('rejectPasswordResetRequest');

  // Change password (user knows old password)
  router.post('/change-password', auth, async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await changePassword.execute(req.user.userId, oldPassword, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reset password with temporary password
  router.post('/reset-password-temp', auth, async (req, res) => {
    try {
      const { temporaryPassword, newPassword } = req.body;
      const result = await resetPasswordWithTemp.execute(req.user.userId, temporaryPassword, newPassword);
      res.json(result);
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Request password reset (forgot password)
  router.post('/request-password-reset', async (req, res) => {
    try {
      const { username } = req.body;
      const result = await requestPasswordReset.execute(username);
      res.json(result);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get all password reset requests (Super Admin only)
  router.get('/password-reset-requests', auth, checkRole('Super Admin'), async (req, res) => {
    try {
      const { status } = req.query;
      const requests = await getPasswordResetRequests.execute(status);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Approve password reset request (Super Admin only)
  router.post('/approve-password-reset/:requestId', auth, checkRole('Super Admin'), async (req, res) => {
    try {
      const { requestId } = req.params;
      const { temporaryPassword, notes } = req.body;
      const result = await approvePasswordResetRequest.execute(
        requestId, 
        temporaryPassword, 
        req.user.userId, 
        notes
      );
      res.json(result);
    } catch (error) {
      console.error('Error approving password reset:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reject password reset request (Super Admin only)
  router.post('/reject-password-reset/:requestId', auth, checkRole('Super Admin'), async (req, res) => {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;
      const result = await rejectPasswordResetRequest.execute(requestId, req.user.userId, notes);
      res.json(result);
    } catch (error) {
      console.error('Error rejecting password reset:', error);
      res.status(400).json({ message: error.message });
    }
  });

    return router;
  } catch (error) {
    console.error('Error initializing password reset routes:', error);
    throw error;
  }
};
