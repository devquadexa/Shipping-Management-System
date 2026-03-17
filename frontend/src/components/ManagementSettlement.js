import React, { useState, useEffect } from 'react';
import '../styles/ManagementSettlement.css';

const ManagementSettlement = ({ user }) => {
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [approvedSettlements, setApprovedSettlements] = useState([]);
  const [allSettlements, setAllSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (user) {
      fetchSettlements();
    }
  }, [user]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      // Fetch pending settlements
      const pendingResponse = await fetch('http://localhost:5000/api/cash-balance-settlements/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch approved settlements
      const approvedResponse = await fetch('http://localhost:5000/api/cash-balance-settlements/approved', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch all settlements
      const allResponse = await fetch('http://localhost:5000/api/cash-balance-settlements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingSettlements(pendingData.data || []);
      }

      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        setApprovedSettlements(approvedData.data || []);
      }

      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAllSettlements(allData.data || []);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setMessage('Error fetching settlements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (settlementId, managerNotes = '') => {
    setActionLoading(prev => ({ ...prev, [settlementId]: 'approving' }));
    try {
      const response = await fetch(`http://localhost:5000/api/cash-balance-settlements/${settlementId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement approved successfully');
        fetchSettlements();
      } else {
        setMessage(data.message || 'Failed to approve settlement');
      }
    } catch (error) {
      console.error('Error approving settlement:', error);
      setMessage('Error approving settlement');
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const handleComplete = async (settlementId, managerNotes = '') => {
    setActionLoading(prev => ({ ...prev, [settlementId]: 'completing' }));
    try {
      const response = await fetch(`http://localhost:5000/api/cash-balance-settlements/${settlementId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement completed successfully');
        fetchSettlements();
      } else {
        setMessage(data.message || 'Failed to complete settlement');
      }
    } catch (error) {
      console.error('Error completing settlement:', error);
      setMessage('Error completing settlement');
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const handleReject = async (settlementId, managerNotes) => {
    if (!managerNotes.trim()) {
      setMessage('Please provide a reason for rejection');
      return;
    }

    setActionLoading(prev => ({ ...prev, [settlementId]: 'rejecting' }));
    try {
      const response = await fetch(`http://localhost:5000/api/cash-balance-settlements/${settlementId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement rejected successfully');
        fetchSettlements();
      } else {
        setMessage(data.message || 'Failed to reject settlement');
      }
    } catch (error) {
      console.error('Error rejecting settlement:', error);
      setMessage('Error rejecting settlement');
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
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
    return type === 'BALANCE_RETURN' ? 'Balance Return' : 'Overdue Collection';
  };

  const getTypeIcon = (type) => {
    return type === 'BALANCE_RETURN' ? '💰' : '📋';
  };

  const renderSettlementCard = (settlement, showActions = false) => (
    <div key={settlement.settlementId} className="management-settlement-card">
      <div className="settlement-header-info">
        <div className="settlement-id">
          {getTypeIcon(settlement.settlementType)} {settlement.settlementId}
        </div>
        <div className={`settlement-status ${getStatusBadgeClass(settlement.status)}`}>
          {settlement.statusDisplay}
        </div>
      </div>

      <div className="settlement-details">
        <div className="settlement-user">
          <span className="user-label">Waff Clerk:</span>
          <span className="user-name">{settlement.userName}</span>
        </div>

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
            <span className="notes-label">Waff Clerk Notes:</span>
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

      {showActions && (
        <SettlementActions 
          settlement={settlement}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={handleReject}
          loading={actionLoading[settlement.settlementId]}
        />
      )}
    </div>
  );

  return (
    <div className="management-settlement">
      <div className="settlement-header">
        <h2>🏢 Cash Balance Settlement Management</h2>
        <p>Approve, complete, and manage cash balance settlements from Waff Clerks</p>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="settlement-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending ({pendingSettlements.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Approved ({approvedSettlements.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 All Settlements ({allSettlements.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading && <div className="loading">Loading settlements...</div>}
        
        {!loading && activeTab === 'pending' && (
          <div className="settlements-section">
            <h3>Pending Approvals</h3>
            {pendingSettlements.length === 0 ? (
              <div className="no-settlements">
                <p>No pending settlements found.</p>
              </div>
            ) : (
              <div className="settlements-grid">
                {pendingSettlements.map(settlement => 
                  renderSettlementCard(settlement, true)
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'approved' && (
          <div className="settlements-section">
            <h3>Ready for Completion</h3>
            {approvedSettlements.length === 0 ? (
              <div className="no-settlements">
                <p>No approved settlements waiting for completion.</p>
              </div>
            ) : (
              <div className="settlements-grid">
                {approvedSettlements.map(settlement => 
                  renderSettlementCard(settlement, true)
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'all' && (
          <div className="settlements-section">
            <h3>All Settlements</h3>
            {allSettlements.length === 0 ? (
              <div className="no-settlements">
                <p>No settlements found.</p>
              </div>
            ) : (
              <div className="settlements-grid">
                {allSettlements.map(settlement => 
                  renderSettlementCard(settlement, false)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Settlement Actions Component
const SettlementActions = ({ settlement, onApprove, onComplete, onReject, loading }) => {
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [managerNotes, setManagerNotes] = useState('');
  const [actionType, setActionType] = useState('');

  const handleAction = () => {
    if (actionType === 'approve') {
      onApprove(settlement.settlementId, managerNotes);
    } else if (actionType === 'complete') {
      onComplete(settlement.settlementId, managerNotes);
    } else if (actionType === 'reject') {
      onReject(settlement.settlementId, managerNotes);
    }
    setShowNotesInput(false);
    setManagerNotes('');
    setActionType('');
  };

  const startAction = (type) => {
    setActionType(type);
    if (type === 'reject') {
      setShowNotesInput(true);
    } else {
      setShowNotesInput(true);
    }
  };

  return (
    <div className="settlement-actions">
      {!showNotesInput && (
        <div className="action-buttons">
          {settlement.status === 'PENDING' && (
            <>
              <button 
                className="btn-approve"
                onClick={() => startAction('approve')}
                disabled={loading}
              >
                {loading === 'approving' ? 'Approving...' : '✅ Approve'}
              </button>
              <button 
                className="btn-reject"
                onClick={() => startAction('reject')}
                disabled={loading}
              >
                {loading === 'rejecting' ? 'Rejecting...' : '❌ Reject'}
              </button>
            </>
          )}
          
          {settlement.status === 'APPROVED' && (
            <button 
              className="btn-complete"
              onClick={() => startAction('complete')}
              disabled={loading}
            >
              {loading === 'completing' ? 'Completing...' : '🏁 Complete'}
            </button>
          )}
        </div>
      )}

      {showNotesInput && (
        <div className="notes-input-section">
          <textarea
            value={managerNotes}
            onChange={(e) => setManagerNotes(e.target.value)}
            placeholder={actionType === 'reject' ? 'Please provide a reason for rejection (required)' : 'Add optional notes'}
            rows="3"
            className="manager-notes-input"
          />
          <div className="notes-actions">
            <button 
              className={`btn-confirm btn-${actionType}`}
              onClick={handleAction}
              disabled={loading || (actionType === 'reject' && !managerNotes.trim())}
            >
              {loading ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
            </button>
            <button 
              className="btn-cancel-notes"
              onClick={() => {
                setShowNotesInput(false);
                setManagerNotes('');
                setActionType('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementSettlement;