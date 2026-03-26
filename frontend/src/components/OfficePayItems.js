import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { officePayItemService } from '../api/services/officePayItemService';
import '../styles/OfficePayItems.css';

// Inline styles to ensure column padding is applied
const columnStyles = `
  .billing-table th.col-description,
  .billing-table td.col-description {
    padding-left: 1.5rem !important;
  }
  .billing-table th.col-actual,
  .billing-table td.col-actual {
    padding-left: 1rem !important;
  }
  .billing-table th.col-paidby,
  .billing-table td.col-paidby {
    padding-left: 1rem !important;
  }
  .billing-table th.col-date,
  .billing-table td.col-date {
    padding-left: 1rem !important;
  }
`;

function OfficePayItems({ jobId, onUpdate }) {
  const { user } = useAuth();
  const [officePayItems, setOfficePayItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    actualCost: ''
  });

  useEffect(() => {
    if (jobId) {
      fetchOfficePayItems();
    }
  }, [jobId]);

  const fetchOfficePayItems = async () => {
    try {
      setLoading(true);
      const items = await officePayItemService.getByJobId(jobId);
      setOfficePayItems(items);
    } catch (error) {
      console.error('Error fetching office pay items:', error);
      setMessage('Error loading office pay items');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const actualCost = parseFloat(formData.actualCost);
      if (!formData.actualCost || Number.isNaN(actualCost) || actualCost < 0) {
        setMessage('Please enter a valid Amount Paid');
        setTimeout(() => setMessage(''), 3000);
        return;
      }
      
      const payItemData = {
        jobId,
        description: formData.description,
        actualCost
      };

      if (editingId) {
        // Update logic would go here if backend supports it
        setMessage('Edit functionality coming soon');
      } else {
        await officePayItemService.create(payItemData);
        setMessage('Office pay item added successfully!');
      }
      
      handleCloseForm();
      await fetchOfficePayItems();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating office pay item:', error);
      setMessage('Error adding office pay item');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.officePayItemId);
    setFormData({
      description: item.description,
      actualCost: item.actualCost
    });
    setShowAddForm(true);
  };

  const handleDelete = async (officePayItemId) => {
    if (!window.confirm('Are you sure you want to delete this office pay item?')) {
      return;
    }

    try {
      setLoading(true);
      await officePayItemService.delete(officePayItemId);
      
      setMessage('Office pay item deleted successfully!');
      await fetchOfficePayItems();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting office pay item:', error);
      setMessage('Error deleting office pay item');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      description: '',
      actualCost: ''
    });
  };

  const sanitizeCurrencyInput = (value) => {
    if (!value) return '';

    // Remove everything except digits and decimal point
    let sanitized = value.replace(/[^\d.]/g, '');

    // Keep only one decimal point
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    // Limit to 2 decimal places
    if (sanitized.includes('.')) {
      const [wholePart, decimalPart] = sanitized.split('.');
      sanitized = `${wholePart}.${decimalPart.slice(0, 2)}`;
    }

    return sanitized;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'actualCost') {
      setFormData({
        ...formData,
        actualCost: sanitizeCurrencyInput(value)
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAmountKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '.'];

    if (allowedKeys.includes(e.key)) {
      if (e.key === '.' && e.target.value.includes('.')) {
        e.preventDefault();
      }
      return;
    }

    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleAmountPaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (!/^\d+(\.\d{1,2})?$/.test(pastedText)) {
      e.preventDefault();
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'LKR 0.00';
    return `LKR ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Only show for Admin, Super Admin, Manager, and Office Executive
  if (!user || !['Admin', 'Super Admin', 'Manager', 'Office Executive'].includes(user.role)) {
    return null;
  }

  return (
    <div className="office-pay-items-section">
      <style>{columnStyles}</style>
      <div className="section-header">
        <div className="header-content">
          <h3>Office Pay Items</h3>
          <p className="section-description">
            Record upfront payments made by office staff (e.g., DO charges, port fees)
          </p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="add-form-container">
          <div className="form-card">
            <div className="form-header">
              <h4>{editingId ? 'Edit Office Payment' : 'Add New Office Payment'}</h4>
              <button 
                className="btn-close"
                onClick={handleCloseForm}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="office-pay-item-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="description">Description <span className="required">*</span></label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., DO Charges, Port Fees, Documentation"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="actualCost">Amount Paid (LKR) <span className="required">*</span></label>
                  <input
                    type="text"
                    id="actualCost"
                    name="actualCost"
                    value={formData.actualCost}
                    onChange={handleChange}
                    onKeyDown={handleAmountKeyDown}
                    onPaste={handleAmountPaste}
                    placeholder="0.00"
                    inputMode="decimal"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : (editingId ? 'Update Payment' : 'Add Payment')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCloseForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="office-pay-items-list">
        {loading && officePayItems.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading office pay items...</p>
          </div>
        ) : officePayItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h4>No Office Payments Yet</h4>
            <p>Add upfront payments made by office staff for this job</p>
            <button 
              className="btn btn-primary btn-empty-state"
              onClick={() => setShowAddForm(true)}
              disabled={loading}
            >
              + Add Payment
            </button>
          </div>
        ) : (
          <div className="billing-table-wrapper">
            <div className="table-header-bar">
              <div className="table-title">Payment Records</div>
              <button 
                className="btn btn-primary btn-add-payment"
                onClick={() => setShowAddForm(true)}
                disabled={loading}
                title="Add new payment"
              >
                <span className="btn-icon">+</span>
                Add Payment
              </button>
            </div>
            
            <table className="billing-table">
              <thead>
                <tr>
                  <th className="col-description">Description</th>
                  <th className="col-actual">Actual Cost</th>
                  <th className="col-paidby">Paid By</th>
                  <th className="col-date">Payment Date</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {officePayItems.map((item) => (
                  <tr key={item.officePayItemId}>
                    <td className="col-description" data-label="Description">
                      <span className="cell-content">{item.description}</span>
                    </td>
                    <td className="col-actual" data-label="Actual Cost">
                      <span className="cell-content currency">{formatCurrency(item.actualCost)}</span>
                    </td>
                    <td className="col-paidby" data-label="Paid By">
                      <span className="cell-content">{item.paidByName || '-'}</span>
                    </td>
                    <td className="col-date" data-label="Payment Date">
                      <span className="cell-content">{formatDate(item.paymentDate)}</span>
                    </td>
                    <td className="col-actions" data-label="Actions">
                      <div className="action-icons">
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleEdit(item)}
                          disabled={loading}
                          title="Edit payment"
                          aria-label="Edit payment"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => handleDelete(item.officePayItemId)}
                          disabled={loading}
                          title="Delete payment"
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
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="totals-section">
              <div className="total-row">
                <span className="total-label">Total Actual Cost:</span>
                <span className="total-value">
                  {formatCurrency(officePayItems.reduce((sum, item) => sum + (item.actualCost || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OfficePayItems;