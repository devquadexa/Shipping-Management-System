import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdvancePayment.css';

function AdvancePayment({ job, onUpdate }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    advancePayment: '',
    notes: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Format currency for display
  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Reset form when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        advancePayment: job.advancePayment || '',
        notes: job.advancePaymentNotes || ''
      });
    }
  }, [job]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.advancePayment) || 0;
      
      if (amount < 0) {
        setMessage('Advance payment cannot be negative');
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/jobs/${job.jobId}/advance-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          advancePayment: amount,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update advance payment');
      }

      const result = await response.json();
      setMessage('✓ Advance payment updated successfully');
      setIsEditing(false);
      
      // Call parent update function to refresh job data
      if (onUpdate) {
        onUpdate();
      }

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating advance payment:', error);
      setMessage('Error updating advance payment');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      advancePayment: job.advancePayment || '',
      notes: job.advancePaymentNotes || ''
    });
    setIsEditing(false);
  };

  const canEdit = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="advance-payment-section">
      <div className="section-header">
        <h4 className="section-title">💰 Advance Payment</h4>
        {canEdit && !isEditing && (
          <button 
            className="btn btn-edit-advance"
            onClick={() => setIsEditing(true)}
            title="Edit Advance Payment"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {message && (
        <div className={`advance-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {!isEditing ? (
        <div className="advance-payment-display">
          <div className="advance-summary">
            <div className="advance-amount-display">
              <span className="advance-label">Advance Amount:</span>
              <span className={`advance-value ${job.advancePayment > 0 ? 'has-advance' : 'no-advance'}`}>
                LKR {formatCurrency(job.advancePayment)}
              </span>
            </div>
            
            {job.advancePayment > 0 && (
              <>
                <div className="advance-detail">
                  <span className="detail-label">Date Received:</span>
                  <span className="detail-value">
                    {job.advancePaymentDate ? new Date(job.advancePaymentDate).toLocaleDateString() : '-'}
                  </span>
                </div>
                
                {job.advancePaymentNotes && (
                  <div className="advance-detail">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{job.advancePaymentNotes}</span>
                  </div>
                )}
                
                <div className="advance-detail">
                  <span className="detail-label">Recorded By:</span>
                  <span className="detail-value">{job.advancePaymentRecordedBy || '-'}</span>
                </div>
              </>
            )}
            
            {job.advancePayment === 0 && (
              <div className="no-advance-message">
                <span className="no-advance-text">No advance payment received</span>
                {canEdit && (
                  <span className="no-advance-hint">Click "Edit" to record an advance payment</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="advance-payment-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="advancePayment">Advance Amount (LKR) *</label>
              <input
                type="number"
                id="advancePayment"
                step="0.01"
                min="0"
                value={formData.advancePayment}
                onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                placeholder="0.00"
                className="form-control"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any notes about this advance payment..."
                className="form-control"
                rows="3"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Advance Payment'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdvancePayment;