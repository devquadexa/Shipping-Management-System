import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { passwordResetService } from '../api/services/passwordResetService';
import '../styles/PettyCashReport.css';

function PasswordResetRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const hasAccess = () => user && user.role === 'Super Admin';

  useEffect(() => {
    if (hasAccess()) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await passwordResetService.getPasswordResetRequests();
      setRequests(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage('Error loading password reset requests');
      setMessageType('error');
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setTemporaryPassword(generateRandomPassword());
    setNotes('');
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setMessage('Temporary password must be at least 6 characters');
      setMessageType('error');
      return;
    }

    try {
      setActionLoading(true);
      const result = await passwordResetService.approvePasswordResetRequest(
        selectedRequest.requestId,
        temporaryPassword,
        notes
      );
      
      setMessage(`Request approved! Temporary password: ${result.temporaryPassword}`);
      setMessageType('success');
      setShowApproveModal(false);
      fetchRequests();
      
      // Auto-hide success message after 10 seconds
      setTimeout(() => setMessage(''), 10000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error approving request');
      setMessageType('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this password reset request?')) {
      return;
    }

    try {
      await passwordResetService.rejectPasswordResetRequest(requestId, 'Request rejected by administrator');
      setMessage('Request rejected successfully');
      setMessageType('success');
      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error rejecting request');
      setMessageType('error');
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString('en-GB') : '-';

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'pcr-status-pending';
      case 'Approved': return 'pcr-status-completed';
      case 'Rejected': return 'pcr-status-rejected';
      default: return '';
    }
  };

  if (!hasAccess()) {
    return (
      <div className="pcr-access-denied">
        <div className="pcr-access-denied-content">
          <div className="pcr-access-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Access Denied</h2>
          <p>Only Super Admin users can access password reset requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pcr-container">
      <div className="pcr-header">
        <div className="pcr-header-content">
          <h1 className="pcr-title">Password Reset Requests</h1>
          <p className="pcr-subtitle">Manage user password reset requests</p>
        </div>
      </div>

      {message && (
        <div className={`pcr-alert pcr-alert-${messageType}`}>
          <span className="pcr-alert-icon">
            {messageType === 'success' && '✓'}
            {messageType === 'error' && '✕'}
            {messageType === 'info' && 'ℹ'}
          </span>
          {message}
        </div>
      )}

      <div className="pcr-table-card">
        {loading ? (
          <div className="pcr-empty">
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="pcr-empty">
            <div className="pcr-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p>No password reset requests found</p>
          </div>
        ) : (
          <div className="pcr-table-wrap">
            <table className="pcr-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Request ID</th>
                  <th>User</th>
                  <th>Username</th>
                  <th>Requested By</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Resolved By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr key={request.requestId}>
                    <td>{index + 1}</td>
                    <td><span className="pcr-job-id">{request.requestId}</span></td>
                    <td>{request.userFullName}</td>
                    <td>{request.userName}</td>
                    <td>{request.requestedByName}</td>
                    <td>{formatDate(request.requestDate)}</td>
                    <td>
                      <span className={`pcr-status ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{request.resolvedByName || '-'}</td>
                    <td>
                      {request.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleApproveClick(request)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.requestId)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {request.status !== 'Pending' && (
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          {request.status === 'Approved' ? 'Completed' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="change-password-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="change-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="change-password-modal-header">
              <h2>Approve Password Reset</h2>
              <button className="btn-close-modal" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            
            <div className="change-password-modal-body">
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
                  <strong>User:</strong> {selectedRequest?.userFullName}
                </p>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#6b7280' }}>
                  <strong>Username:</strong> {selectedRequest?.userName}
                </p>
              </div>

              <div className="form-group-pr">
                <label>
                  Temporary Password <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    placeholder="Enter temporary password"
                    required
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setTemporaryPassword(generateRandomPassword())}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Generate
                  </button>
                </div>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  This password will be shared with the user. They must change it on first login.
                </p>
              </div>

              <div className="form-group-pr">
                <label>Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setShowApproveModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  {actionLoading ? 'Approving...' : 'Approve & Set Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PasswordResetRequests;
