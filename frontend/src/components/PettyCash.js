import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { authService } from '../api/services/authService';
import { customerService } from '../api/services/customerService';
import '../styles/PettyCash.css';

function PettyCash() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [overallBalance, setOverallBalance] = useState(0);
  const [userBalances, setUserBalances] = useState({});
  
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
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [settlementItems, setSettlementItems] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchJobs();
    fetchCustomers();
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
      fetchUsers();
      fetchOverallBalance();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const endpoint = user?.role === 'User' 
        ? 'http://localhost:5000/api/petty-cash-assignments/my'
        : 'http://localhost:5000/api/petty-cash-assignments';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch assignments:', response.status);
        setAssignments([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched assignments:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAssignments(data);
        
        // For admin/super admin, fetch user balances from dedicated endpoint
        if (user?.role === 'Admin' || user?.role === 'Super Admin') {
          fetchUserBalances();
        }
      } else {
        console.error('Assignments data is not an array:', data);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const fetchUserBalances = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/petty-cash-assignments/user-balances', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user balances:', data);
        
        // Convert array to object keyed by userId
        const balancesMap = {};
        data.forEach(balance => {
          balancesMap[balance.userId] = balance;
        });
        setUserBalances(balancesMap);
      }
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  };

  const fetchOverallBalance = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/petty-cash/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverallBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching overall balance:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      console.log('Fetched jobs:', data);
      console.log('Jobs with pettyCashStatus:', data.map(j => ({ 
        jobId: j.jobId, 
        pettyCashStatus: j.pettyCashStatus 
      })));
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data.filter(u => u.role === 'User'));
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

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.userId === userId);
    return foundUser ? foundUser.fullName : userId;
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignFormData.jobId || !assignFormData.assignedTo || !assignFormData.assignedAmount) {
      setMessage('Please fill all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/petty-cash-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...assignFormData,
          assignedAmount: parseFloat(assignFormData.assignedAmount)
        })
      });

      if (response.ok) {
        setMessage('Petty cash assigned successfully!');
        setShowAssignModal(false);
        setAssignFormData({ jobId: '', assignedTo: '', assignedAmount: '', notes: '' });
        fetchAssignments();
        fetchJobs();
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

  const openSettleModal = async (assignment) => {
    console.log('Opening settle modal for assignment:', assignment);
    setSelectedAssignment(assignment);
    
    // Load pay item templates for this job's category
    try {
      const job = jobs.find(j => j.jobId === assignment.jobId);
      console.log('Found job:', job);
      console.log('Job shipment category:', job?.shipmentCategory);
      
      if (job && job.shipmentCategory) {
        console.log('Fetching templates for category:', job.shipmentCategory);
        const response = await fetch(
          `http://localhost:5000/api/pay-item-templates/category/${encodeURIComponent(job.shipmentCategory)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        console.log('Template response status:', response.status);
        
        if (response.ok) {
          const templates = await response.json();
          console.log('Loaded templates:', templates);
          
          if (templates && templates.length > 0) {
            // Convert templates to pay items format
            const loadedPayItems = templates.map(template => ({
              itemName: template.itemName,
              actualCost: '',
              isCustomItem: false
            }));
            console.log('Setting settlement items:', loadedPayItems);
            setSettlementItems(loadedPayItems);
          } else {
            console.log('No templates found, using default empty item');
            setSettlementItems([{ itemName: '', actualCost: '', isCustomItem: true }]);
          }
        } else {
          console.error('Failed to fetch templates:', response.status);
          setSettlementItems([{ itemName: '', actualCost: '', isCustomItem: true }]);
        }
      } else {
        console.log('No job or shipment category found, using default empty item');
        setSettlementItems([{ itemName: '', actualCost: '', isCustomItem: true }]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setSettlementItems([{ itemName: '', actualCost: '', isCustomItem: true }]);
    }
    
    setShowSettleModal(true);
  };

  const handleSettlementItemChange = (index, field, value) => {
    const newItems = [...settlementItems];
    newItems[index][field] = value;
    setSettlementItems(newItems);
  };

  const addSettlementItem = () => {
    setSettlementItems([...settlementItems, { itemName: '', actualCost: '', isCustomItem: true }]);
  };

  const removeSettlementItem = (index) => {
    if (settlementItems.length > 1) {
      setSettlementItems(settlementItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotalSpent = () => {
    return settlementItems.reduce((sum, item) => {
      return sum + (parseFloat(item.actualCost) || 0);
    }, 0);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    
    const validItems = settlementItems.filter(item => item.itemName && item.actualCost);
    
    if (validItems.length === 0) {
      setMessage('Please add at least one item with name and cost');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settle`,
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
              isCustomItem: item.isCustomItem
            }))
          })
        }
      );

      if (response.ok) {
        setMessage('Petty cash settled successfully!');
        setShowSettleModal(false);
        setSelectedAssignment(null);
        setSettlementItems([]);
        fetchAssignments();
        fetchJobs();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.message || 'Error settling petty cash');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error settling petty cash:', error);
      setMessage('Error settling petty cash');
      setTimeout(() => setMessage(''), 3000);
    }
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
      case 'Returned': return 'status-returned';
      case 'Paid': return 'status-paid';
      default: return 'status-assigned';
    }
  };

  return (
    <div className="petty-cash-page">
      <div className="page-header">
        <div>
          <h1>Petty Cash Management</h1>
          <p>{user?.role === 'User' ? 'Your assigned petty cash' : 'Manage petty cash assignments'}</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
          <button onClick={() => setShowAssignModal(true)} className="btn btn-primary">
            + Assign Petty Cash
          </button>
        )}
      </div>

      {/* Overall Balance Card for Admin/Super Admin */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
        <div className="balance-cards">
          <div className="balance-card overall-balance">
            <div className="balance-card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <div className="balance-card-content">
              <h3>Overall Petty Cash Balance</h3>
              <p className="balance-amount">LKR {formatAmount(overallBalance)}</p>
              <p className="balance-description">Total available petty cash in system</p>
            </div>
          </div>
        </div>
      )}

      {/* User Balances Summary for Admin/Super Admin */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin') && Object.keys(userBalances).length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>User Petty Cash Summary</h2>
          </div>
          <div className="user-balances-grid">
            {Object.entries(userBalances).map(([userId, balance]) => {
              return (
                <div key={userId} className="user-balance-card">
                  <div className="user-balance-header">
                    <div className="user-avatar">
                      {balance.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4>{balance.userName}</h4>
                      <p className="user-id">{userId}</p>
                    </div>
                  </div>
                  <div className="user-balance-stats">
                    <div className="stat-row">
                      <span className="stat-label">Total Assigned:</span>
                      <span className="stat-value">LKR {formatAmount(balance.totalAssigned)}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Total Spent:</span>
                      <span className="stat-value">LKR {formatAmount(balance.totalSpent)}</span>
                    </div>
                    {balance.totalBalance > 0 && (
                      <div className="stat-row">
                        <span className="stat-label">Balance to Return:</span>
                        <span className="stat-value balance-positive">LKR {formatAmount(balance.totalBalance)}</span>
                      </div>
                    )}
                    {balance.totalOver > 0 && (
                      <div className="stat-row">
                        <span className="stat-label">Over Amount:</span>
                        <span className="stat-value balance-negative">LKR {formatAmount(balance.totalOver)}</span>
                      </div>
                    )}
                    <div className="stat-row stat-row-divider">
                      <span className="stat-label">Active Assignments:</span>
                      <span className="stat-value stat-badge">{balance.activeAssignments}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Settled Assignments:</span>
                      <span className="stat-value stat-badge">{balance.settledAssignments}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User's Own Balance Summary */}
      {user?.role === 'User' && assignments.length > 0 && (
        <div className="balance-cards">
          <div className="balance-card user-balance">
            <div className="balance-card-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="balance-card-content">
              <h3>Your Petty Cash Summary</h3>
              <div className="user-balance-details">
                <div className="balance-detail-row">
                  <span>Total Assigned:</span>
                  <span className="balance-value">
                    LKR {formatAmount(assignments.reduce((sum, a) => sum + parseFloat(a.assignedAmount || 0), 0))}
                  </span>
                </div>
                <div className="balance-detail-row">
                  <span>Active Assignments:</span>
                  <span className="balance-value">
                    {assignments.filter(a => a.status === 'Assigned').length}
                  </span>
                </div>
                <div className="balance-detail-row">
                  <span>Settled Assignments:</span>
                  <span className="balance-value">
                    {assignments.filter(a => a.status === 'Settled').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Petty Cash Assignments ({assignments.length})</h2>
        </div>
        
        {assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <p>{user?.role === 'User' ? 'No petty cash assigned to you yet' : 'No petty cash assignments yet'}</p>
          </div>
        ) : (
          <div className="assignments-table-wrapper">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Job ID</th>
                  <th>Customer</th>
                  {user?.role !== 'User' && <th>Assigned To</th>}
                  <th>Assigned Amount</th>
                  <th>Actual Spent</th>
                  <th>Balance/Over</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => {
                  const job = jobs.find(j => j.jobId === assignment.jobId);
                  return (
                    <tr key={assignment.assignmentId}>
                      <td data-label="Assignment ID">
                        <strong className="assignment-id">#{assignment.assignmentId}</strong>
                      </td>
                      <td data-label="Job ID">{assignment.jobId}</td>
                      <td data-label="Customer">{job ? getCustomerName(job.customerId) : '-'}</td>
                      {user?.role !== 'User' && (
                        <td data-label="Assigned To">{assignment.assignedToName || assignment.assignedTo}</td>
                      )}
                      <td data-label="Assigned Amount">
                        <strong>LKR {formatAmount(assignment.assignedAmount)}</strong>
                      </td>
                      <td data-label="Actual Spent">
                        {assignment.actualSpent ? `LKR ${formatAmount(assignment.actualSpent)}` : '-'}
                      </td>
                      <td data-label="Balance/Over">
                        {assignment.balanceAmount > 0 && (
                          <span className="balance-positive">
                            Balance: LKR {formatAmount(assignment.balanceAmount)}
                          </span>
                        )}
                        {assignment.overAmount > 0 && (
                          <span className="balance-negative">
                            Over: LKR {formatAmount(assignment.overAmount)}
                          </span>
                        )}
                        {!assignment.balanceAmount && !assignment.overAmount && '-'}
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${getStatusBadgeClass(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </td>
                      <td data-label="Assigned Date">
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </td>
                      <td data-label="Actions">
                        {assignment.status === 'Assigned' && user?.role === 'User' && (
                          <button
                            className="btn-action btn-settle"
                            onClick={() => openSettleModal(assignment)}
                          >
                            Settle
                          </button>
                        )}
                        {assignment.status === 'Settled' && (
                          <button
                            className="btn-action btn-view"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setSettlementItems(assignment.settlementItems || []);
                              setShowSettleModal(true);
                            }}
                          >
                            View Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Petty Cash Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Petty Cash</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="petty-cash-form">
              <div className="form-group">
                <label>Select Job <span className="required">*</span></label>
                <select
                  value={assignFormData.jobId}
                  onChange={(e) => setAssignFormData({ ...assignFormData, jobId: e.target.value })}
                  required
                >
                  <option value="">-- Select Job --</option>
                  {jobs.filter(j => !j.pettyCashStatus || j.pettyCashStatus === 'Not Assigned').map(job => (
                    <option key={job.jobId} value={job.jobId}>
                      {job.jobId} - {getCustomerName(job.customerId)} - {job.shipmentCategory}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assign To <span className="required">*</span></label>
                <select
                  value={assignFormData.assignedTo}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedTo: e.target.value })}
                  required
                >
                  <option value="">-- Select User --</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Amount (LKR) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={assignFormData.assignedAmount}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedAmount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Assign Petty Cash</button>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settlement Modal */}
      {showSettleModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => {
          if (selectedAssignment.status !== 'Settled') {
            setShowSettleModal(false);
            setSelectedAssignment(null);
            setSettlementItems([]);
          }
        }}>
          <div className="modal modal-large modal-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAssignment.status === 'Settled' ? 'Settlement Details' : 'Settle Petty Cash'}</h2>
              <button className="btn-close" onClick={() => {
                setShowSettleModal(false);
                setSelectedAssignment(null);
                setSettlementItems([]);
              }}>×</button>
            </div>

            <div className="modal-body-scrollable">

            <div className="settlement-info">
              <div className="info-row">
                <span className="info-label">Job ID:</span>
                <span className="info-value">{selectedAssignment.jobId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Assigned Amount:</span>
                <span className="info-value">LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
              </div>
              {selectedAssignment.status === 'Settled' && (
                <>
                  <div className="info-row">
                    <span className="info-label">Actual Spent:</span>
                    <span className="info-value">LKR {formatAmount(selectedAssignment.actualSpent)}</span>
                  </div>
                  {selectedAssignment.balanceAmount > 0 && (
                    <div className="info-row">
                      <span className="info-label">Balance to Return:</span>
                      <span className="info-value balance-positive">
                        LKR {formatAmount(selectedAssignment.balanceAmount)}
                      </span>
                    </div>
                  )}
                  {selectedAssignment.overAmount > 0 && (
                    <div className="info-row">
                      <span className="info-label">Over Amount:</span>
                      <span className="info-value balance-negative">
                        LKR {formatAmount(selectedAssignment.overAmount)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedAssignment.status === 'Settled' ? (
              <div className="settlement-items-view">
                <h3>Settlement Items</h3>
                <table className="settlement-items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Actual Cost (LKR)</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementItems.map((item, index) => (
                      <tr key={index}>
                        <td>{item.itemName}</td>
                        <td className="amount">LKR {formatAmount(item.actualCost)}</td>
                        <td>
                          <span className={`item-type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>
                            {item.isCustomItem ? 'Custom' : 'Template'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td className="amount"><strong>LKR {formatAmount(selectedAssignment.actualSpent)}</strong></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <form onSubmit={handleSettleSubmit} className="settlement-form">
                <h3>Settlement Items</h3>
                <div className="settlement-items-list">
                  {settlementItems.map((item, index) => (
                    <div key={index} className="settlement-item-row">
                      <div className="item-number">{index + 1}</div>
                      <div className="form-group">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleSettlementItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          step="0.01"
                          value={item.actualCost}
                          onChange={(e) => handleSettlementItemChange(index, 'actualCost', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      {settlementItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSettlementItem(index)}
                          className="btn-remove-item"
                          title="Remove item"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" onClick={addSettlementItem} className="btn btn-secondary btn-add-item">
                  + Add Custom Item
                </button>

                <div className="settlement-summary">
                  <div className="summary-row">
                    <span>Assigned Amount:</span>
                    <span>LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Total Spent:</span>
                    <span>LKR {formatAmount(calculateTotalSpent())}</span>
                  </div>
                  <div className="summary-row total">
                    {calculateTotalSpent() < selectedAssignment.assignedAmount ? (
                      <>
                        <span>Balance to Return:</span>
                        <span className="balance-positive">
                          LKR {formatAmount(selectedAssignment.assignedAmount - calculateTotalSpent())}
                        </span>
                      </>
                    ) : calculateTotalSpent() > selectedAssignment.assignedAmount ? (
                      <>
                        <span>Over Amount:</span>
                        <span className="balance-negative">
                          LKR {formatAmount(calculateTotalSpent() - selectedAssignment.assignedAmount)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Exact Match:</span>
                        <span>LKR 0.00</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn btn-success">Settle Petty Cash</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettleModal(false);
                      setSelectedAssignment(null);
                      setSettlementItems([]);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PettyCash;
