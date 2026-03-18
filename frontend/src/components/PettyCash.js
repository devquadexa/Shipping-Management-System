import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { authService } from '../api/services/authService';
import { customerService } from '../api/services/customerService';
import '../styles/PettyCash.css';
import API_BASE from '../api/config';

function PettyCash() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [overallBalance, setOverallBalance] = useState(0);
  const [userBalances, setUserBalances] = useState({});
  const [jobAssignments, setJobAssignments] = useState({}); // Store job assignments
  
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

  // Cash Balance Settlement Modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementFormData, setSettlementFormData] = useState({
    settlementType: '',
    amount: '',
    notes: ''
  });

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
      const endpoint = user?.role === 'Waff Clerk' 
        ? `${API_BASE}/api/petty-cash-assignments/my`
        : `${API_BASE}/api/petty-cash-assignments`;
      
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
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments/user-balances`, {
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
      const response = await fetch(`${API_BASE}/api/petty-cash/balance`, {
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
        pettyCashStatus: j.pettyCashStatus,
        assignedUsers: j.assignedUsers
      })));
      setJobs(data);
      
      // Build job assignments map from the assignedUsers in each job
      if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
        const assignmentsMap = {};
        data.forEach(job => {
          if (job.assignedUsers && job.assignedUsers.length > 0) {
            assignmentsMap[job.jobId] = job.assignedUsers;
          } else {
            assignmentsMap[job.jobId] = [];
          }
        });
        console.log('Job assignments map:', assignmentsMap);
        setJobAssignments(assignmentsMap);
      }
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

  const getUserName = (userId) => {
    const foundUser = users.find(u => u.userId === userId);
    return foundUser ? foundUser.fullName : userId;
  };

  // Get jobs that have users who haven't received petty cash yet
  const getAvailableJobs = () => {
    return jobs.filter(job => {
      // If job has no assignments, skip it
      if (!jobAssignments[job.jobId] || jobAssignments[job.jobId].length === 0) {
        return false;
      }
      
      // Get all users assigned to this job
      const assignedUserIds = jobAssignments[job.jobId].map(a => a.userId);
      
      // Get users who already have petty cash for this job
      const usersWithPettyCash = assignments
        .filter(a => a.jobId === job.jobId && a.status !== 'Returned')
        .map(a => a.assignedTo);
      
      // Check if there are any assigned users without petty cash
      const hasUsersWithoutPettyCash = assignedUserIds.some(
        userId => !usersWithPettyCash.includes(userId)
      );
      
      return hasUsersWithoutPettyCash;
    });
  };

  const getAvailableUsersForJob = (jobId) => {
    console.log('getAvailableUsersForJob called with jobId:', jobId);
    console.log('jobAssignments:', jobAssignments);
    console.log('users:', users);
    console.log('assignments:', assignments);
    
    if (!jobId || !jobAssignments[jobId]) {
      console.log('No job selected or no assignments found');
      return [];
    }
    
    // Get all users assigned to this job
    const assignedUserIds = jobAssignments[jobId].map(assignment => assignment.userId);
    console.log('Assigned user IDs for job:', assignedUserIds);
    
    // Get users who already have petty cash for this job (excluding Returned status)
    const usersWithPettyCash = assignments
      .filter(a => a.jobId === jobId && a.status !== 'Returned')
      .map(a => a.assignedTo);
    console.log('Users with petty cash for this job:', usersWithPettyCash);
    
    // Filter to show only assigned users who don't have petty cash yet
    const availableUsers = users.filter(user => 
      assignedUserIds.includes(user.userId) && 
      !usersWithPettyCash.includes(user.userId)
    );
    console.log('Available users (assigned but no petty cash):', availableUsers);
    
    return availableUsers;
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    if (!assignFormData.jobId || !assignFormData.assignedTo || !assignFormData.assignedAmount) {
      setMessage('Please fill all required fields');
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
    
    // Load existing settlement items for THIS assignment
    let existingItems = [];
    try {
      const existingResponse = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${assignment.assignmentId}/settlement-items`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (existingResponse.ok) {
        existingItems = await existingResponse.json();
        console.log('Existing settlement items for this assignment:', existingItems);
      }
    } catch (error) {
      console.error('Error loading existing settlement items:', error);
    }
    
    // Get read-only predefined items from the backend response
    let readOnlyPredefinedItems = [];
    try {
      const job = jobs.find(j => j.jobId === assignment.jobId);
      if (job) {
        const assignmentResponse = await fetch(
          `${API_BASE}/api/petty-cash-assignments/job/${assignment.jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        if (assignmentResponse.ok) {
          const jobAssignment = await assignmentResponse.json();
          console.log('Job assignment:', jobAssignment);
          console.log('Read-only predefined items:', jobAssignment.readOnlyPredefinedItems);
          
          // Get read-only items from backend
          if (jobAssignment && jobAssignment.readOnlyPredefinedItems) {
            readOnlyPredefinedItems = jobAssignment.readOnlyPredefinedItems;
          }
        }
      }
    } catch (error) {
      console.error('Error loading job assignment:', error);
    }
    
    // Load pay item templates for this job's category
    try {
      const job = jobs.find(j => j.jobId === assignment.jobId);
      console.log('Found job:', job);
      console.log('Job shipment category:', job?.shipmentCategory);
      
      if (job && job.shipmentCategory) {
        console.log('Fetching templates for category:', job.shipmentCategory);
        const response = await fetch(
          `${API_BASE}/api/pay-item-templates/category/${encodeURIComponent(job.shipmentCategory)}`,
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
            // Mark items as paid if they exist in readOnlyPredefinedItems
            const loadedPayItems = templates.map(template => {
              const existingItem = existingItems.find(ei => ei.itemName === template.itemName);
              const paidByOther = readOnlyPredefinedItems.find(si => si.itemName === template.itemName);
              
              if (existingItem) {
                // This Waff Clerk already paid for this item
                return {
                  itemName: template.itemName,
                  actualCost: existingItem.actualCost,
                  isCustomItem: false,
                  paidBy: existingItem.paidBy,
                  paidByName: existingItem.paidByName,
                  hasBill: existingItem.hasBill ? true : false,
                  alreadyPaid: true
                };
              } else if (paidByOther) {
                // Another Waff Clerk already paid for this item (read-only)
                return {
                  itemName: template.itemName,
                  actualCost: paidByOther.actualCost,
                  isCustomItem: false,
                  paidBy: paidByOther.paidBy,
                  paidByName: paidByOther.paidByName,
                  hasBill: paidByOther.hasBill ? true : false,
                  alreadyPaid: true,
                  paidByOther: true
                };
              }
              return {
                itemName: template.itemName,
                actualCost: '',
                isCustomItem: false,
                hasBill: false,
                alreadyPaid: false
              };
            });
            
            // Add custom items from existing settlement
            const customItems = existingItems
              .filter(ei => ei.isCustomItem)
              .map(ei => ({
                itemName: ei.itemName,
                actualCost: ei.actualCost,
                isCustomItem: true,
                paidBy: ei.paidBy,
                paidByName: ei.paidByName,
                hasBill: ei.hasBill ? true : false,
                alreadyPaid: true
              }));
            
            const finalPayItems = [...loadedPayItems, ...customItems];
            console.log('Final pay items:', finalPayItems);
            setSettlementItems(finalPayItems);
            setShowSettleModal(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    
    // Fallback: just show existing items
    setSettlementItems(existingItems);
    setShowSettleModal(true);
  };

  const handleSettlementItemChange = (index, field, value) => {
    const newItems = settlementItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSettlementItems(newItems);
  };

  const addSettlementItem = () => {
    setSettlementItems([...settlementItems, { itemName: '', actualCost: '', isCustomItem: true, hasBill: false }]);
  };

  const removeSettlementItem = (index) => {
    if (settlementItems.length > 1) {
      setSettlementItems(settlementItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotalSpent = () => {
    // Only count items that are NOT already paid (exclude read-only items from other clerks)
    return settlementItems.reduce((sum, item) => {
      if (item.alreadyPaid) {
        return sum; // Skip items already paid by this or other clerks
      }
      return sum + (parseFloat(item.actualCost) || 0);
    }, 0);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    
    // Only submit items that have both name and cost filled in
    const validItems = settlementItems.filter(item => 
      item.itemName && item.actualCost && parseFloat(item.actualCost) > 0 && !item.alreadyPaid
    );
    
    if (validItems.length === 0) {
      setMessage('Please fill in at least one item with name and cost');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      console.log('Submitting settlement items with hasBill:', validItems.map(i => ({ name: i.itemName, hasBill: i.hasBill })));
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${selectedAssignment.assignmentId}/settle`,
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
            // Removed partialSettlement flag - each assignment should be fully settled
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

  // Open settlement modal for balance return or overdue collection
  const openSettlementModal = (assignment, settlementType) => {
    setSelectedAssignment(assignment);
    const amount = settlementType === 'BALANCE_RETURN' ? assignment.balanceAmount : assignment.overAmount;
    setSettlementFormData({
      settlementType,
      amount: amount.toString(),
      notes: `${settlementType === 'BALANCE_RETURN' ? 'Balance return' : 'Overdue collection'} for Assignment #${assignment.assignmentId} (${assignment.jobId})`
    });
    setShowSettlementModal(true);
  };

  // Handle settlement form submission
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    
    if (!settlementFormData.settlementType || !settlementFormData.amount) {
      setMessage('Please fill in all required fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          settlementType: settlementFormData.settlementType,
          amount: parseFloat(settlementFormData.amount),
          notes: settlementFormData.notes,
          relatedAssignments: [selectedAssignment.assignmentId]
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Settlement request created successfully');
        setShowSettlementModal(false);
        setSettlementFormData({ settlementType: '', amount: '', notes: '' });
        setSelectedAssignment(null);
        // Refresh assignments to update UI
        fetchAssignments();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to create settlement request');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating settlement request:', error);
      setMessage('Error creating settlement request');
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
      case 'Pending Approval': return 'status-pending-approval';
      case 'Balance Returned': return 'status-balance-returned';
      case 'Overdue Collected': return 'status-overdue-collected';
      default: return 'status-assigned';
    }
  };

  return (
    <div className="petty-cash-page">
      <div className="page-header">
        <div>
          <h1>Petty Cash Management</h1>
          <p>{user?.role === 'Waff Clerk' ? 'Your assigned petty cash' : 'Manage petty cash assignments'}</p>
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
      {user?.role === 'Waff Clerk' && assignments.length > 0 && (
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

      {/* Management Settlement Section */}
      {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
        <ManagementSettlementSection user={user} />
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
            <p>{user?.role === 'Waff Clerk' ? 'No petty cash assigned to you yet' : 'No petty cash assignments yet'}</p>
          </div>
        ) : (
          <div className="assignments-table-wrapper">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Job ID</th>
                  <th>Customer</th>
                  {user?.role !== 'Waff Clerk' && <th>Assigned To</th>}
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
                      {user?.role !== 'Waff Clerk' && (
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
                        <div className="action-buttons">
                          {assignment.status === 'Assigned' && user?.role === 'Waff Clerk' && (
                            <button
                              className="btn-action btn-settle"
                              onClick={() => openSettleModal(assignment)}
                            >
                              Settle
                            </button>
                          )}
                          
                          {/* Settlement buttons for Waff Clerks with balance/over amounts */}
                          {assignment.status === 'Settled' && user?.role === 'Waff Clerk' && (
                            <>
                              {assignment.balanceAmount > 0 && (
                                <button
                                  className="btn-action btn-return-balance"
                                  onClick={() => openSettlementModal(assignment, 'BALANCE_RETURN')}
                                  title="Return balance cash to management"
                                >
                                  Return Balance
                                </button>
                              )}
                              {assignment.overAmount > 0 && (
                                <button
                                  className="btn-action btn-collect-overdue"
                                  onClick={() => openSettlementModal(assignment, 'OVERDUE_COLLECTION')}
                                  title="Collect overdue cash from management"
                                >
                                  Collect Overdue
                                </button>
                              )}
                            </>
                          )}
                          
                          {(assignment.status === 'Settled' || assignment.status === 'Pending Approval' || assignment.status === 'Balance Returned' || assignment.status === 'Overdue Collected') && (
                            <button
                              className="btn-action btn-view"
                              onClick={async () => {
                                console.log('Loading settlement details for assignment:', assignment.assignmentId);
                                setSelectedAssignment(assignment);
                                
                                // Load settlement items from API
                                try {
                                  const response = await fetch(
                                    `${API_BASE}/api/petty-cash-assignments/${assignment.assignmentId}/settlement-items`,
                                    {
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      }
                                    }
                                  );
                                  
                                  if (response.ok) {
                                    const items = await response.json();
                                    console.log('Loaded settlement items:', items);
                                    setSettlementItems(items);
                                  } else {
                                    console.error('Failed to load settlement items:', response.status);
                                    setSettlementItems(assignment.settlementItems || []);
                                  }
                                } catch (error) {
                                  console.error('Error loading settlement items:', error);
                                  setSettlementItems(assignment.settlementItems || []);
                                }
                                
                                setShowSettleModal(true);
                              }}
                            >
                              View Details
                            </button>
                          )}
                        </div>
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
                  onChange={(e) => setAssignFormData({ 
                    ...assignFormData, 
                    jobId: e.target.value,
                    assignedTo: '' // Reset user selection when job changes
                  })}
                  required
                >
                  <option value="">-- Select Job --</option>
                  {getAvailableJobs().map(job => (
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
                  {getAvailableUsersForJob(assignFormData.jobId).map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
                {assignFormData.jobId && getAvailableUsersForJob(assignFormData.jobId).length === 0 && (
                  <p className="helper-text warning">All assigned users for this job have already received petty cash.</p>
                )}
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
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Assign Petty Cash</button>
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
              <h2>{(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') ? 'Settlement Details' : 'Settle Petty Cash'}</h2>
              <button className="btn-close" onClick={() => {
                setShowSettleModal(false);
                setSelectedAssignment(null);
                setSettlementItems([]);
              }}>×</button>
            </div>

            <div className="modal-body-scrollable">

            <div className="settlement-info">
              <div className="settlement-info-grid">
                <div className="settlement-info-item">
                  <span className="info-label">Job ID:</span>
                  <span className="info-value">{selectedAssignment.jobId}</span>
                </div>
                <div className="settlement-info-item">
                  <span className="info-label">Assigned Amount:</span>
                  <span className="info-value">LKR {formatAmount(selectedAssignment.assignedAmount)}</span>
                </div>
                {(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') && (
                  <div className="settlement-info-item">
                    <span className="info-label">Actual Spent:</span>
                    <span className="info-value">LKR {formatAmount(selectedAssignment.actualSpent)}</span>
                  </div>
                )}
                {selectedAssignment.balanceAmount > 0 && (
                  <div className="settlement-info-item">
                    <span className="info-label">Balance to Return:</span>
                    <span className="info-value balance-positive">LKR {formatAmount(selectedAssignment.balanceAmount)}</span>
                  </div>
                )}
                {selectedAssignment.overAmount > 0 && (
                  <div className="settlement-info-item">
                    <span className="info-label">Over Amount:</span>
                    <span className="info-value balance-negative">LKR {formatAmount(selectedAssignment.overAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {(selectedAssignment.status === 'Settled' || selectedAssignment.status === 'Pending Approval' || selectedAssignment.status === 'Balance Returned' || selectedAssignment.status === 'Overdue Collected') ? (
              <div className="settlement-items-view">
                <h3>Settlement Items</h3>
                <table className="settlement-items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Actual Cost (LKR)</th>
                      <th>Type</th>
                      <th>Bill</th>
                      <th>Paid By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlementItems.map((item, index) => (
                      <tr key={index} className={item.hasBill ? 'has-bill-row-view' : ''}>
                        <td>{item.itemName}</td>
                        <td className="amount">LKR {formatAmount(item.actualCost)}</td>
                        <td>
                          <span className={`item-type-badge ${item.isCustomItem ? 'custom' : 'template'}`}>
                            {item.isCustomItem ? 'Custom' : 'Template'}
                          </span>
                        </td>
                        <td className="bill-cell">
                          {item.hasBill ? (
                            <span className="bill-badge">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                              Bill
                            </span>
                          ) : (
                            <span className="no-bill-badge">No Bill</span>
                          )}
                        </td>
                        <td>
                          <span className="paid-by-badge">
                            {item.paidByName || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td><strong>Total</strong></td>
                      <td className="amount"><strong>LKR {formatAmount(selectedAssignment.actualSpent)}</strong></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <form onSubmit={handleSettleSubmit} className="settlement-form">
                <h3>Settlement Items</h3>
                <p className="helper-text info">Fill in only the items you paid for. Tick the "Bill" checkbox if you have a proof receipt for that item. Items already paid by others are shown as read-only.</p>
                <div className="settlement-items-list">
                  {settlementItems.map((item, index) => (
                    <div key={index} className={`settlement-item-row ${item.alreadyPaid ? 'paid-item-row' : ''} ${item.hasBill ? 'has-bill-row' : ''}`}>
                      <div className="item-number">{index + 1}</div>
                      <div className="form-group">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleSettlementItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          disabled={item.alreadyPaid}
                          className={item.alreadyPaid ? 'paid-input' : ''}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="number"
                          step="0.01"
                          value={item.actualCost}
                          onChange={(e) => handleSettlementItemChange(index, 'actualCost', e.target.value)}
                          placeholder={item.alreadyPaid ? `Paid: ${item.actualCost}` : '0.00'}
                          disabled={item.alreadyPaid}
                          className={item.alreadyPaid ? 'paid-input' : ''}
                        />
                      </div>
                      {/* Has Bill Checkbox */}
                      {!item.alreadyPaid && (
                        <div className="has-bill-check">
                          <input
                            type="checkbox"
                            id={`hasBill-${index}`}
                            checked={!!item.hasBill}
                            onChange={(e) => handleSettlementItemChange(index, 'hasBill', e.target.checked)}
                            title="Check if you have a proof bill/receipt for this item"
                          />
                          <label htmlFor={`hasBill-${index}`} title="Has proof bill/receipt">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                            Bill
                          </label>
                        </div>
                      )}
                      {item.alreadyPaid && item.hasBill && (
                        <div className="bill-indicator" title="This item has a proof bill">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          Bill
                        </div>
                      )}
                      {item.alreadyPaid && (
                        <div className="paid-by-indicator">
                          <span className="paid-by-badge">
                            Paid by {item.paidByName}
                          </span>
                        </div>
                      )}
                      {!item.alreadyPaid && settlementItems.filter(i => !i.alreadyPaid).length > 1 && (
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
                  <button type="submit" className="btn btn-success">Settle Petty Cash</button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Cash Balance Settlement Modal */}
      {showSettlementModal && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-content settlement-modal">
            <div className="modal-header">
              <h3>
                {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Return Balance Cash' : 'Collect Overdue Cash'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowSettlementModal(false);
                  setSelectedAssignment(null);
                  setSettlementFormData({ settlementType: '', amount: '', notes: '' });
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assignment-info">
                <div className="info-row">
                  <span className="info-label">Assignment:</span>
                  <span className="info-value">#{selectedAssignment.assignmentId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Job ID:</span>
                  <span className="info-value">{selectedAssignment.jobId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">
                    {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Balance Amount:' : 'Overdue Amount:'}
                  </span>
                  <span className={`info-value ${settlementFormData.settlementType === 'BALANCE_RETURN' ? 'balance-positive' : 'balance-negative'}`}>
                    LKR {formatAmount(settlementFormData.amount)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSettlementSubmit} className="settlement-form">
                <div className="form-group">
                  <label>Settlement Type</label>
                  <input
                    type="text"
                    value={settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Return Balance to Management' : 'Collect Overdue from Management'}
                    disabled
                    className="form-control disabled"
                  />
                </div>

                <div className="form-group">
                  <label>Amount (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={settlementFormData.amount}
                    onChange={(e) => setSettlementFormData({...settlementFormData, amount: e.target.value})}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={settlementFormData.notes}
                    onChange={(e) => setSettlementFormData({...settlementFormData, notes: e.target.value})}
                    className="form-control"
                    rows="3"
                    placeholder="Add any additional notes or details"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettlementModal(false);
                      setSelectedAssignment(null);
                      setSettlementFormData({ settlementType: '', amount: '', notes: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {settlementFormData.settlementType === 'BALANCE_RETURN' ? 'Request Balance Return' : 'Request Overdue Collection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Management Settlement Section Component
const ManagementSettlementSection = ({ user }) => {
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchSettlements();
  }, [activeTab]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      let endpoint = `${API_BASE}/api/cash-balance-settlements`;
      if (activeTab === 'pending') {
        endpoint += '?status=PENDING';
      } else if (activeTab === 'approved') {
        endpoint += '?status=APPROVED';
      } else if (activeTab === 'rejected') {
        endpoint += '?status=REJECTED';
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettlements(data.data || []);
      } else {
        setMessage('Failed to fetch settlements');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error fetching settlements:', error);
      setMessage('Error fetching settlements');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (settlementId, managerNotes = '') => {
    setActionLoading(prev => ({ ...prev, [settlementId]: 'approving' }));
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements/${settlementId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      if (response.ok) {
        setMessage('Settlement approved successfully');
        fetchSettlements();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to approve settlement');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error approving settlement:', error);
      setMessage('Error approving settlement');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const handleReject = async (settlementId, managerNotes) => {
    if (!managerNotes.trim()) {
      setMessage('Please provide a reason for rejection');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setActionLoading(prev => ({ ...prev, [settlementId]: 'rejecting' }));
    try {
      const response = await fetch(`${API_BASE}/api/cash-balance-settlements/${settlementId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ managerNotes })
      });

      if (response.ok) {
        setMessage('Settlement rejected successfully');
        fetchSettlements();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.message || 'Failed to reject settlement');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error rejecting settlement:', error);
      setMessage('Error rejecting settlement');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setActionLoading(prev => ({ ...prev, [settlementId]: null }));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-assigned';
    }
  };

  return (
    <div className="card management-settlements">
      <div className="card-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="header-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"></path>
          </svg>
          Cash Balance Settlement Management
        </h2>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('Failed') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="settlement-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
          title="View pending settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Pending ({settlements.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
          title="View approved settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Approved ({settlements.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
          title="View rejected settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          Rejected ({settlements.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
          title="View all settlements"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          All Settlements
        </button>
      </div>

      <div className="settlements-content">
        {loading && <div className="loading">Loading settlements...</div>}
        
        {!loading && settlements.length === 0 && (
          <div className="empty-state">
            <p>No {activeTab} settlements found.</p>
          </div>
        )}

        {!loading && settlements.length > 0 && (
          <div className="settlements-table-wrapper">
            <table className="settlements-table">
              <thead>
                <tr>
                  <th>Settlement ID</th>
                  <th>Waff Clerk</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Request Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(settlement => (
                  <tr key={settlement.settlementId}>
                    <td data-label="Settlement ID">
                      <strong>{settlement.settlementId}</strong>
                    </td>
                    <td data-label="Waff Clerk">{settlement.userName}</td>
                    <td data-label="Type">
                      <span className={`type-badge ${settlement.settlementType === 'BALANCE_RETURN' ? 'type-return' : 'type-collect'}`}>
                        {settlement.settlementType === 'BALANCE_RETURN' ? 'Balance Return' : 'Overdue Collection'}
                      </span>
                    </td>
                    <td data-label="Amount">
                      <strong>LKR {settlement.amount.toLocaleString()}</strong>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${getStatusBadgeClass(settlement.status)}`}>
                        {settlement.statusDisplay}
                      </span>
                    </td>
                    <td data-label="Request Date">
                      {new Date(settlement.requestDate).toLocaleDateString()}
                    </td>
                    <td data-label="Actions">
                      <div className="settlement-actions">
                        {settlement.status === 'PENDING' && (
                          <>
                            <button
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(settlement.settlementId)}
                              disabled={actionLoading[settlement.settlementId]}
                            >
                              {actionLoading[settlement.settlementId] === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => {
                                const notes = prompt('Please provide a reason for rejection:');
                                if (notes) handleReject(settlement.settlementId, notes);
                              }}
                              disabled={actionLoading[settlement.settlementId]}
                            >
                              {actionLoading[settlement.settlementId] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PettyCash;


