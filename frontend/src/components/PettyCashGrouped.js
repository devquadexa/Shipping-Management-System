import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { authService } from '../api/services/authService';
import { customerService } from '../api/services/customerService';
import '../styles/PettyCashGrouped.css';
import API_BASE from '../api/config';

function PettyCashGrouped() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignFormData, setAssignFormData] = useState({
    jobId: '',
    assignedTo: '',
    assignedAmount: '',
    notes: ''
  });

  // Settlement Modal
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [settlementItems, setSettlementItems] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchJobs();
    fetchCustomers();
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
      fetchUsers();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const endpoint = user?.role === 'Waff Clerk' 
        ? `${API_BASE}/api/petty-cash-assignments/my-grouped`
        : `${API_BASE}/api/petty-cash-assignments/grouped`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch groups:', response.status);
        setGroups([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched groups:', data);
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data.filter(u => u.role === 'Waff Clerk'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.name : customerId;
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignFormData.jobId || !assignFormData.assignedTo || !assignFormData.assignedAmount) {
      setMessage('Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const assignedAmount = parseFloat(assignFormData.assignedAmount);
    if (isNaN(assignedAmount) || assignedAmount <= 0) {
      setMessage('Assigned amount must be greater than 0');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...assignFormData,
          assignedAmount
        })
      });

      if (response.ok) {
        setMessage('✅ Petty cash assigned successfully');
        setShowAssignModal(false);
        setAssignFormData({ jobId: '', assignedTo: '', assignedAmount: '', notes: '' });
        fetchGroups();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error assigning petty cash');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error assigning petty cash:', error);
      setMessage('Error assigning petty cash');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const openSettleModal = async (group) => {
    setSelectedGroup(group);
    
    // Load pay item templates for this job's category
    try {
      const job = jobs.find(j => j.jobId === group.jobId);
      if (job && job.shipmentCategory) {
        const response = await fetch(
          `${API_BASE}/api/pay-item-templates/category/${encodeURIComponent(job.shipmentCategory)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (response.ok) {
          const templates = await response.json();
          const items = templates.map(template => ({
            itemName: template.itemName,
            actualCost: '',
            isCustomItem: false,
            hasBill: false
          }));
          setSettlementItems(items);
          setShowSettleModal(true);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    
    setSettlementItems([]);
    setShowSettleModal(true);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = settlementItems.filter(item => 
      item.itemName && item.actualCost && parseFloat(item.actualCost) > 0
    );
    
    if (validItems.length === 0) {
      setMessage('Please fill in at least one item');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/group/${selectedGroup.groupId}/settle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            items: validItems.map(item => ({
              itemName: item.itemName,
              actualCost: parseFloat(item.actualCost),
              isCustomItem: item.isCustomItem,
              hasBill: item.hasBill ? true : false
            }))
          })
        }
      );

      if (response.ok) {
        setMessage('✅ Group settled successfully');
        setShowSettleModal(false);
        setSelectedGroup(null);
        setSettlementItems([]);
        fetchGroups();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error settling group');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error settling group:', error);
      setMessage('Error settling group');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleGroupExpansion = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Settled': return 'status-settled';
      case 'Settled/Approved': return 'status-approved';
      default: return 'status-assigned';
    }
  };

  const handleSettlementItemChange = (index, field, value) => {
    const newItems = settlementItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSettlementItems(newItems);
  };

  const addSettlementItem = () => {
    setSettlementItems([...settlementItems, { 
      itemName: '', 
      actualCost: '', 
      isCustomItem: true, 
      hasBill: false 
    }]);
  };

  const removeSettlementItem = (index) => {
    if (settlementItems.length > 1) {
      setSettlementItems(settlementItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="petty-cash-grouped-page">
      <div className="page-header">
        <div>
          <h1>Petty Cash Groups</h1>
          <p>Manage grouped petty cash assignments</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
          <button onClick={() => setShowAssignModal(true)} className="btn btn-primary">
            + Assign Petty Cash
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="groups-container">
        {groups.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <p>No petty cash assignments yet</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.groupId} className="group-card">
              <div className="group-header">
                <div className="group-info" style={{ flex: 1 }}>
                  <div className="group-title">
                    <span className="group-job-id">{group.jobId}</span>
                    <span className="group-separator">•</span>
                    <span className="group-clerk-name">{group.assignedToName}</span>
                    <span className={`status-badge ${getStatusBadgeClass(group.groupStatus)}`}>
                      {group.groupStatus}
                    </span>
                  </div>
                  <div className="group-subtitle">
                    {group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''} • 
                    {getCustomerName(group.customerId)}
                  </div>
                </div>
                <div className="group-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Assigned</span>
                    <span className="summary-value">LKR {formatAmount(group.totalAssigned)}</span>
                  </div>
                  {group.totalSpent > 0 && (
                    <div className="summary-item">
                      <span className="summary-label">Total Spent</span>
                      <span className="summary-value">LKR {formatAmount(group.totalSpent)}</span>
                    </div>
                  )}
                  <button 
                    className="expand-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      toggleGroupExpansion(group.groupId); 
                    }}
                    title={expandedGroups.has(group.groupId) ? "Collapse details" : "Expand details"}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ transform: expandedGroups.has(group.groupId) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedGroups.has(group.groupId) && (
                <div className="group-details">
                  <div className="assignments-list">
                    {group.assignments.map((assignment, idx) => (
                      <div key={assignment.assignmentId} className="assignment-item">
                        <div className="assignment-header">
                          <span className="assignment-number">#{idx + 1}</span>
                          <span className="assignment-id">ID: {assignment.assignmentId}</span>
                          <span className={`status-badge-small ${getStatusBadgeClass(assignment.status)}`}>
                            {assignment.status}
                          </span>
                        </div>
                        <div className="assignment-details">
                          <div className="detail-row">
                            <span className="detail-label">Assigned Amount:</span>
                            <span className="detail-value">LKR {formatAmount(assignment.assignedAmount)}</span>
                          </div>
                          {assignment.actualSpent > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Actual Spent:</span>
                              <span className="detail-value">LKR {formatAmount(assignment.actualSpent)}</span>
                            </div>
                          )}
                          {assignment.balanceAmount > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Balance:</span>
                              <span className="detail-value positive">LKR {formatAmount(assignment.balanceAmount)}</span>
                            </div>
                          )}
                          {assignment.overAmount > 0 && (
                            <div className="detail-row">
                              <span className="detail-label">Over Amount:</span>
                              <span className="detail-value negative">LKR {formatAmount(assignment.overAmount)}</span>
                            </div>
                          )}
                          {assignment.notes && (
                            <div className="detail-row">
                              <span className="detail-label">Notes:</span>
                              <span className="detail-value">{assignment.notes}</span>
                            </div>
                          )}
                        </div>
                        
                        {assignment.settlementItems && assignment.settlementItems.length > 0 && (
                          <div className="settlement-items-mini">
                            <div className="settlement-items-header-mini">Settlement Items ({assignment.settlementItems.length})</div>
                            {assignment.settlementItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="settlement-item-mini">
                                <span className="item-name">{item.itemName}</span>
                                <span className="item-cost">LKR {formatAmount(item.actualCost)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {group.hasUnsettled && user?.role === 'Waff Clerk' && (
                    <div className="group-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={() => openSettleModal(group)}
                      >
                        Settle Group
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Petty Cash</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label>Job</label>
                <select
                  value={assignFormData.jobId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, jobId: e.target.value })}
                  required
                >
                  <option value="">Select Job</option>
                  {jobs.map(job => (
                    <option key={job.jobId} value={job.jobId}>
                      {job.jobId} - {getCustomerName(job.customerId)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assign To (Waff Clerk)</label>
                <select
                  value={assignFormData.assignedTo}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedTo: e.target.value })}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} ({u.userId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={assignFormData.assignedAmount}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => setShowSettleModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Settle Group: {selectedGroup.jobId}</h2>
              <button className="close-btn" onClick={() => setShowSettleModal(false)}>×</button>
            </div>
            <div className="settlement-info">
              <div className="info-item">
                <span className="info-label">Total Assigned:</span>
                <span className="info-value">LKR {formatAmount(selectedGroup.totalAssigned)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Assignments:</span>
                <span className="info-value">{selectedGroup.assignments.length}</span>
              </div>
            </div>
            <form onSubmit={handleSettleSubmit}>
              <div className="settlement-items-container">
                <div className="settlement-items-header">
                  <h3>Settlement Items</h3>
                  <button type="button" className="btn-add-item" onClick={addSettlementItem}>
                    + Add Custom Item
                  </button>
                </div>
                <div className="settlement-items-table">
                  <div className="table-header">
                    <div className="col-name">Item Name</div>
                    <div className="col-cost">Actual Cost</div>
                    <div className="col-bill">Has Bill</div>
                    <div className="col-actions">Actions</div>
                  </div>
                  {settlementItems.map((item, index) => (
                    <div key={index} className="table-row">
                      <div className="col-name">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleSettlementItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          disabled={!item.isCustomItem}
                        />
                      </div>
                      <div className="col-cost">
                        <input
                          type="number"
                          step="0.01"
                          value={item.actualCost}
                          onChange={(e) => handleSettlementItemChange(index, 'actualCost', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-bill">
                        <input
                          type="checkbox"
                          checked={item.hasBill}
                          onChange={(e) => handleSettlementItemChange(index, 'hasBill', e.target.checked)}
                        />
                      </div>
                      <div className="col-actions">
                        {item.isCustomItem && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeSettlementItem(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Settle Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PettyCashGrouped;
