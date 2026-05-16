import React, { useState, useEffect } from 'react';
import '../styles/RejectionReasonModal.css';

function RejectionReasonModal({ show, onClose, onSubmit, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setReason('');
      setError('');
    }
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    onSubmit(reason.trim());
  };

  if (!show) return null;

  return (
    <div className="rejection-modal-overlay">
      <div className="rejection-modal">
        <div className="rejection-modal-header">
          <h2>✗ Reject Invoice Review</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rejection-modal-body">
            <p className="rejection-intro">
              Please provide a detailed reason for rejecting this invoice review. 
              The Admin/Manager will receive your feedback.
            </p>

            <div className="form-group">
              <label htmlFor="rejection-reason">
                Rejection Reason <span className="required">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Explain why you are rejecting this invoice review..."
                rows="6"
                className={error ? 'error' : ''}
              />
              {error && (
                <span className="error-message">{error}</span>
              )}
              <span className="char-count">
                {reason.length} characters
              </span>
            </div>
          </div>

          <div className="rejection-modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={loading || !reason.trim()}
            >
              {loading ? '⏳ Submitting...' : '✗ Submit Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RejectionReasonModal;
