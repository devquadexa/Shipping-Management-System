import React, { useState, useEffect } from 'react';
import '../styles/CashBalanceSettlement.css';
import API_BASE from '../api/config';

const CashBalanceSettlement = ({ user }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    settlementType: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettlements();
    }
  }, [user]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data.data || []);
      } else {
        setMessage('Failed to fetch settlements');
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setMessage('Error fetching settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.settlementType || !formData.amount) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          settlementType: formData.settlementType,
          amount: parseFloat(formData.amount),
          notes: formData.notes
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement request created successfully');
        setFormData({ settlementType: '', amount: '', notes: '' });
        setShowCreateForm(false);
        fetchSettlements();
      } else {
        setMessage(data.message || 'Failed to create settlement request');
      }
    } catch (error) {
      console.error('Error creating settlement:', error);
      setMessage('Error creating settlement request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'COMPLETED': return 'status-completed';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-default';
    }
  };

  const getTypeDisplay = (type) => {
    return type === 'BALANCE_RETURN' ? 'Return Balance Cash' : 'Collect Overdue Cash';
  };

  const getTypeIcon = (type) => {
    return type === 'BALANCE_RETURN' ? '💰' : '📋';
  };

  return (
    <div className="cash-balance-settlement">
      <div className="settlement-header">
        <h2>💰 Cash Balance Settlement</h2>
        <p>Manage your cash balance returns and overdue collections with management</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Create Settlement Button */}
      <div className="settlement-actions">
        <button 
          className="btn-create-settlement"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={loading}
        >
          {showCreateForm ? '❌ Cancel' : '➕ New Settlement Request'}
        </button>
      </div>

      {/* Create Settlement Form */}
      {showCreateForm && (
        <div className="settlement-form-card">
          <h3>Create Settlement Request</h3>
          <form onSubmit={handleSubmit} className="settlement-form">
            <div className="form-group">
              <label>Settlement Type *</label>
              <select
                value={formData.settlementType}
                onChange={(e) => setFormData({...formData, settlementType: e.target.value})}
                required
              >
                <option value="">Select settlement type</option>
                <option value="BALANCE_RETURN">Return Balance Cash to Management</option>
                <option value="OVERDUE_COLLECTION">Collect Overdue Cash from Management</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (LKR) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add any additional notes or details"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Settlement Request'}
              </button>
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settlements List */}
      <div className="settlements-list">
        <h3>My Settlement Requests</h3>
        
        {loading && <div className="loading">Loading settlements...</div>}
        
        {!loading && settlements.length === 0 && (
          <div className="no-settlements">
            <p>No settlement requests found.</p>
            <p>Create a new settlement request to return balance cash or collect overdue amounts.</p>
          </div>
        )}

        {!loading && settlements.length > 0 && (
          <div className="settlements-grid">
            {settlements.map((settlement) => (
              <div key={settlement.settlementId} className="settlement-card">
                <div className="settlement-header-info">
                  <div className="settlement-id">
                    {getTypeIcon(settlement.settlementType)} {settlement.settlementId}
                  </div>
                  <div className={`settlement-status ${getStatusBadgeClass(settlement.status)}`}>
                    {settlement.statusDisplay}
                  </div>
                </div>

                <div className="settlement-details">
                  <div className="settlement-type">
                    <strong>{getTypeDisplay(settlement.settlementType)}</strong>
                  </div>
                  
                  <div className="settlement-amount">
                    <span className="amount-label">Amount:</span>
                    <span className="amount-value">LKR {settlement.amount.toLocaleString()}</span>
                  </div>

                  <div className="settlement-dates">
                    <div className="date-item">
                      <span className="date-label">Requested:</span>
                      <span className="date-value">
                        {new Date(settlement.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {settlement.approvedDate && (
                      <div className="date-item">
                        <span className="date-label">Approved:</span>
                        <span className="date-value">
                          {new Date(settlement.approvedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {settlement.completedDate && (
                      <div className="date-item">
                        <span className="date-label">Completed:</span>
                        <span className="date-value">
                          {new Date(settlement.completedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {settlement.notes && (
                    <div className="settlement-notes">
                      <span className="notes-label">Notes:</span>
                      <p className="notes-text">{settlement.notes}</p>
                    </div>
                  )}

                  {settlement.managerName && (
                    <div className="settlement-manager">
                      <span className="manager-label">Handled by:</span>
                      <span className="manager-name">{settlement.managerName}</span>
                    </div>
                  )}

                  {settlement.managerNotes && (
                    <div className="settlement-manager-notes">
                      <span className="notes-label">Manager Notes:</span>
                      <p className="notes-text">{settlement.managerNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashBalanceSettlement;


