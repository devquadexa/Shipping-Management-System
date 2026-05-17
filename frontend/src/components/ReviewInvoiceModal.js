import React, { useState, useEffect } from 'react';
import '../styles/ReviewInvoiceModal.css';

function ReviewInvoiceModal({ show, onClose, job, assignedClerks, onSubmit, loading }) {
  const [selectedClerk, setSelectedClerk] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      setSelectedClerk('');
      setReviewNotes('');
      setErrors({});
    }
  }, [show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedClerk) {
      newErrors.selectedClerk = 'Please select a clerk to review the invoice';
    }
    
    if (!reviewNotes.trim()) {
      newErrors.reviewNotes = 'Please add review details or notes';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const reviewData = {
      jobId: job.jobId,
      clerkId: selectedClerk,
      reviewNotes: reviewNotes.trim(),
      payItems: job.payItems || [],
      invoiceDetails: {
        jobReference: job.jobId,
        customer: job.customerId,
        shipmentCategory: job.shipmentCategory,
        totalAmount: job.payItems?.reduce((sum, item) => sum + (parseFloat(item.billingAmount) || 0), 0) || 0
      }
    };

    await onSubmit(reviewData);
    
    // Reset form
    setSelectedClerk('');
    setReviewNotes('');
    setErrors({});
  };

  if (!show) return null;

  return (
    <div className="review-invoice-modal-overlay">
      <div className="review-invoice-modal">
        <div className="review-invoice-modal-header">
          <h2>📋 Review Invoice Before Generation</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="review-invoice-modal-body">
            <div className="job-info-section">
              <h3>Job Details</h3>
              <div className="job-info-grid">
                <div className="info-item">
                  <label>Job ID:</label>
                  <span>{job.jobId}</span>
                </div>
                <div className="info-item">
                  <label>Shipment Category:</label>
                  <span>{job.shipmentCategory}</span>
                </div>
                <div className="info-item total-amount">
                  <label>Total Amount:</label>
                  <span className="amount">
                    LKR {(job.payItems?.reduce((sum, item) => sum + (parseFloat(item.billingAmount) || 0), 0) || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label htmlFor="clerk-select">
                  Select Clerk for Review <span className="required">*</span>
                </label>
                <select
                  id="clerk-select"
                  value={selectedClerk}
                  onChange={(e) => {
                    setSelectedClerk(e.target.value);
                    if (errors.selectedClerk) {
                      setErrors({ ...errors, selectedClerk: '' });
                    }
                  }}
                  className={errors.selectedClerk ? 'error' : ''}
                >
                  <option value="">-- Select a clerk --</option>
                  {assignedClerks && assignedClerks.length > 0 ? (
                    assignedClerks.map(clerk => (
                      <option key={clerk.userId} value={clerk.userId}>
                        {clerk.userName || clerk.fullName}
                      </option>
                    ))
                  ) : (
                    <option disabled>No clerks assigned to this job</option>
                  )}
                </select>
                {errors.selectedClerk && (
                  <span className="error-message">{errors.selectedClerk}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="review-notes">
                  Review Details / Notes <span className="required">*</span>
                </label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => {
                    setReviewNotes(e.target.value);
                    if (errors.reviewNotes) {
                      setErrors({ ...errors, reviewNotes: '' });
                    }
                  }}
                  placeholder="Enter review details, concerns, or notes about the invoice..."
                  rows="6"
                  className={errors.reviewNotes ? 'error' : ''}
                />
                {errors.reviewNotes && (
                  <span className="error-message">{errors.reviewNotes}</span>
                )}
              </div>
            </div>
          </div>

          <div className="review-invoice-modal-footer">
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
              className="btn btn-primary"
              disabled={loading || !assignedClerks || assignedClerks.length === 0}
            >
              {loading ? 'Sending Review...' : '✓ Send Review to Clerk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewInvoiceModal;
