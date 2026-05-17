import React, { useState } from 'react';

function CashWithdrawalModal({ show, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    withdrawalDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      amount: '',
      bankName: '',
      withdrawalDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal modal-medium">
        <div className="modal-header">
          <h2>Record Cash Withdrawal</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label>Amount <span className="required">*</span></label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              required
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label>Bank Name <span className="required">*</span></label>
            <select
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              required
            >
              <option value="">Select a bank</option>
              <option value="Commercial Bank">Commercial Bank</option>
              <option value="Hatton National Bank">Hatton National Bank</option>
              <option value="Sampath Bank">Sampath Bank</option>
            </select>
          </div>

          <div className="form-group">
            <label>Withdrawal Date <span className="required">*</span></label>
            <input
              type="date"
              name="withdrawalDate"
              value={formData.withdrawalDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Optional notes"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Record Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CashWithdrawalModal;
