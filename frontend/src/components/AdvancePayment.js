import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/AdvancePayment.css';
import API_BASE from '../api/config';

function AdvancePayment({ job, onUpdate }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [advancePayments, setAdvancePayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [formData, setFormData] = useState({
    advancePayment: '',
    paymentMadeDate: new Date().toISOString().split('T')[0],
    paymentType: 'cash',
    checkNo: '',
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

  const formatDateDisplay = (dateValue) => {
    if (!dateValue) return '-';
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? String(dateValue) : parsed.toLocaleDateString();
  };

  const formatDateTimeDisplay = (dateValue) => {
    if (!dateValue) return '-';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return String(dateValue);

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetAddForm = () => {
    setFormData({
      advancePayment: '',
      paymentMadeDate: new Date().toISOString().split('T')[0],
      paymentType: 'cash',
      checkNo: '',
      notes: ''
    });
    setEditingPaymentId(null);
  };

  const fetchAdvancePayments = async () => {
    if (!job?.jobId) {
      setAdvancePayments([]);
      return;
    }

    setLoadingPayments(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/${job.jobId}/advance-payments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch advance payments');
      }

      const result = await response.json();
      const payments = result.data || [];

      // Backward compatibility: if no payment history rows exist yet, show legacy aggregate record.
      if (payments.length === 0 && parseFloat(job.advancePayment || 0) > 0) {
        setAdvancePayments([
          {
            advancePaymentId: 'legacy',
            amount: parseFloat(job.advancePayment || 0),
            paymentMadeDate: job.advancePaymentDate,
            paymentType: job.advancePaymentType || '-',
            checkNo: job.advancePaymentCheckNo || null,
            notes: job.advancePaymentNotes || null,
            recordedByName: job.advancePaymentRecordedBy || 'Legacy',
            isLegacy: true,
          }
        ]);
      } else {
        setAdvancePayments(payments);
      }
    } catch (error) {
      console.error('Error fetching advance payments:', error);
      setAdvancePayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Load payment history and reset add form when job changes.
  useEffect(() => {
    if (job) {
      resetAddForm();
      fetchAdvancePayments();
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

      if (amount <= 0) {
        setMessage('Advance payment amount must be greater than 0');
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
        return;
      }

      if (amount > 0) {
        if (!formData.paymentMadeDate) {
          setMessage('Payment made date is required');
          setTimeout(() => setMessage(''), 3000);
          setLoading(false);
          return;
        }

        if (!formData.paymentType) {
          setMessage('Payment type is required');
          setTimeout(() => setMessage(''), 3000);
          setLoading(false);
          return;
        }

        if (formData.paymentType === 'check' && !formData.checkNo.trim()) {
          setMessage('Check number is required for check payments');
          setTimeout(() => setMessage(''), 3000);
          setLoading(false);
          return;
        }
      }

      const isUpdate = editingPaymentId !== null;
      const endpoint = isUpdate
        ? `${API_BASE}/api/jobs/${job.jobId}/advance-payments/${editingPaymentId}`
        : `${API_BASE}/api/jobs/${job.jobId}/advance-payments`;

      const response = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          advancePayment: amount,
          paymentMadeDate: formData.paymentMadeDate,
          paymentType: formData.paymentType,
          checkNo: formData.paymentType === 'check' ? formData.checkNo.trim() : null,
          notes: formData.notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update advance payment');
      }

      await response.json();
      setMessage(isUpdate ? '✓ Advance payment updated successfully' : '✓ Advance payment added successfully');
      await fetchAdvancePayments();
      resetAddForm();
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
    resetAddForm();
    setIsEditing(false);
  };

  const openEditPaymentForm = (payment) => {
    if (!payment || payment.isLegacy || !payment.advancePaymentId) {
      setMessage('Legacy advance payment entries cannot be edited. Add a new payment instead.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const paymentDate = payment.paymentMadeDate
      ? new Date(payment.paymentMadeDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setEditingPaymentId(payment.advancePaymentId);
    setFormData({
      advancePayment: payment.amount != null ? String(payment.amount) : '',
      paymentMadeDate: paymentDate,
      paymentType: payment.paymentType || 'cash',
      checkNo: payment.checkNo || '',
      notes: payment.notes || ''
    });
    setIsEditing(true);
  };

  const handleDeletePayment = async (payment) => {
    if (!payment || payment.isLegacy || !payment.advancePaymentId) {
      setMessage('Legacy advance payment entries cannot be deleted.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this advance payment record?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/jobs/${job.jobId}/advance-payments/${payment.advancePaymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete advance payment');
      }

      setMessage('✓ Advance payment deleted successfully');
      await fetchAdvancePayments();
      if (onUpdate) {
        onUpdate();
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting advance payment:', error);
      setMessage('Error deleting advance payment');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager';
  const totalAdvanceAmount = advancePayments.length > 0
    ? advancePayments.reduce((sum, payment) => sum + (parseFloat(payment.amount || 0)), 0)
    : parseFloat(job?.advancePayment || 0);

  return (
    <div className="advance-payment-section">
      <div className="section-header">
        <div className="header-content">
          <h3>Advance Payments</h3>
          <p className="section-description">
            Record and track advance payments received for this job
          </p>
        </div>
      </div>

      {message && (
        <div className={`advance-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {isEditing && (
        <div className="add-form-container">
          <div className="form-card">
            <div className="form-header">
              <h4>{editingPaymentId ? 'Edit Advance Payment' : 'Add New Advance Payment'}</h4>
              <button
                type="button"
                className="btn-close"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="advance-payment-form">
              <div className="form-row form-row-two">
                <div className="form-group">
                  <label htmlFor="advancePayment">Advance Amount (LKR) <span className="required">*</span></label>
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

                <div className="form-group">
                  <label htmlFor="paymentMadeDate">Payment Made Date <span className="required">*</span></label>
                  <input
                    type="date"
                    id="paymentMadeDate"
                    value={formData.paymentMadeDate}
                    onChange={(e) => setFormData({ ...formData, paymentMadeDate: e.target.value })}
                    className="form-control"
                    required={parseFloat(formData.advancePayment) > 0}
                  />
                </div>
              </div>

              <div className="form-row form-row-two">
                <div className="form-group">
                  <label htmlFor="paymentType">Payment Type <span className="required">*</span></label>
                  <select
                    id="paymentType"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="form-control"
                    required={parseFloat(formData.advancePayment) > 0}
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank transfer">Bank Transfer</option>
                  </select>
                </div>

                {formData.paymentType === 'check' ? (
                  <div className="form-group">
                    <label htmlFor="checkNo">Check No <span className="required">*</span></label>
                    <input
                      type="text"
                      id="checkNo"
                      value={formData.checkNo}
                      onChange={(e) => setFormData({ ...formData, checkNo: e.target.value })}
                      placeholder="Enter check number"
                      className="form-control"
                      required={parseFloat(formData.advancePayment) > 0}
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="notesTop">Notes (Optional)</label>
                    <input
                      type="text"
                      id="notesTop"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Short note"
                      className="form-control"
                    />
                  </div>
                )}
              </div>

              {formData.paymentType === 'check' && (
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
              )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (editingPaymentId ? 'Update Payment' : 'Add Payment')}
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
          </div>
        </div>
      )}

      <div className="advance-payment-display">
        {loadingPayments && advancePayments.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading advance payments...</p>
          </div>
        ) : advancePayments.length === 0 && totalAdvanceAmount === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <h4>No Advance Payments Yet</h4>
            <p>Add the first advance payment for this job</p>
            {canEdit && (
              <button
                className="btn btn-primary btn-empty-state"
                onClick={() => setIsEditing(true)}
                disabled={loadingPayments}
              >
                + Add Payment
              </button>
            )}
          </div>
        ) : (
          <div className="billing-table-wrapper advance-billing-wrapper">
            <div className="table-header-bar">
              <div className="table-title">Payment Records</div>
              {canEdit && (
                <button
                  className="btn btn-primary btn-add-payment"
                  onClick={() => setIsEditing(true)}
                  disabled={loadingPayments}
                  title={advancePayments.length > 0 || totalAdvanceAmount > 0 ? 'Add another advance payment' : 'Add payment'}
                >
                  <span className="btn-icon">+</span>
                  Add Payment
                </button>
              )}
            </div>

            <table className={`billing-table advance-billing-table ${canEdit ? 'has-actions' : ''}`}>
              <thead>
                <tr>
                  <th className="col-description">Description</th>
                  <th className="col-actual">Actual Cost</th>
                  <th className="col-paidby">Paid By</th>
                  <th className="col-date">Payment Date</th>
                  <th className="col-notes">Notes</th>
                  {canEdit && <th className="col-actions">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {advancePayments.map((payment, index) => {
                  const paymentType = (payment.paymentType || '').toLowerCase();
                  const description = paymentType === 'check'
                    ? `Advance Payment (Check #${payment.checkNo || '-'})`
                    : `Advance Payment (${payment.paymentType || '-'})`;

                  return (
                    <tr key={`${payment.advancePaymentId || index}-${payment.paymentMadeDate || index}`}>
                      <td className="col-description" data-label="Description">
                        <span className="cell-content">{description}</span>
                      </td>
                      <td className="col-actual" data-label="Actual Cost">
                        <span className="cell-content currency">LKR {formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="col-paidby" data-label="Paid By">
                        <span className="cell-content">{payment.recordedByName || payment.recordedBy || '-'}</span>
                      </td>
                      <td className="col-date" data-label="Payment Date">
                        <span className="cell-content">{formatDateTimeDisplay(payment.paymentMadeDate)}</span>
                      </td>
                      <td className="col-notes" data-label="Notes">
                        <span className="cell-content">{payment.notes || '-'}</span>
                      </td>
                      {canEdit && (
                        <td className="col-actions" data-label="Actions">
                          <div className="action-icons">
                            <button
                              className="icon-btn edit-btn"
                              onClick={() => openEditPaymentForm(payment)}
                              disabled={loading || payment.isLegacy}
                              title={payment.isLegacy ? 'Legacy records cannot be edited' : 'Edit payment'}
                              aria-label="Edit payment"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              className="icon-btn delete-btn"
                              onClick={() => handleDeletePayment(payment)}
                              disabled={loading || payment.isLegacy}
                              title={payment.isLegacy ? 'Legacy records cannot be deleted' : 'Delete payment'}
                              aria-label="Delete payment"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Total Advance Cost:</span>
                <span className="total-value">LKR {formatCurrency(totalAdvanceAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancePayment;

