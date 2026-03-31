import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/PettyCashAggregated.css';
import API_BASE from '../api/config';

function PettyCashAggregated() {
  const { user } = useAuth();
  const [aggregatedAssignments, setAggregatedAssignments] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMainAssignment, setSelectedMainAssignment] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    assignedAmount: '',
    notes: ''
  });

  useEffect(() => {
    fetchAggregatedAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAggregatedAssignments = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'Waff Clerk' 
        ? `${API_BASE}/api/petty-cash-assignments/my-aggregated`
        : `${API_BASE}/api/petty-cash-assignments/aggregated`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch aggregated assignments');
      }
      
      const data = await response.json();
      console.log('Fetched aggregated assignments:', data);
      setAggregatedAssignments(data);
    } catch (error) {
      console.error('Error fetching aggregated assignments:', error);
      setMessage('Error loading assignments');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (groupKey) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedRows(newExpanded);
  };

  const handleAddSubAssignment = (group) => {
    setSelectedMainAssignment(group);
    setAssignFormData({
      assignedAmount: '',
      notes: ''
    });
    setShowAssignModal(true);
  };

  const handleCreateSubAssignment = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        `${API_BASE}/api/petty-cash-assignments/${selectedMainAssignment.mainAssignmentId}/sub-assignment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(assignFormData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create sub-assignment');
      }

      setMessage('Sub-assignment created successfully');
      setShowAssignModal(false);
      fetchAggregatedAssignments();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error creating sub-assignment:', error);
      setMessage('Error creating sub-assignment');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Assigned': return 'status-assigned';
      case 'Settled': return 'status-settled';
      case 'Settled/Approved': return 'status-approved';
      case 'Settled/Rejected': return 'status-rejected';
      case 'Closed': return 'status-closed';
      default: return '';
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="petty-cash-aggregated-container">
      <div className="page-header">
        <h2>Petty Cash Assignments - Grouped View</h2>
        <p className="page-subtitle">View assignments grouped by job and user</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="aggregated-table-container">
          <table className="aggregated-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Job ID</th>
                <th>Category</th>
                <th>Assigned To</th>
                <th>Total Amount</th>
                <th>Assignments</th>
                <th>Status</th>
                <th>Latest Date</th>
                {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
                  <th style={{ width: '100px' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {aggregatedAssignments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">No assignments found</td>
                </tr>
              ) : (
                aggregatedAssignments.map((group) => (
                  <React.Fragment key={group.groupKey}>
                    {/* Main Row */}
                    <tr className="main-row">
                      <td>
                        <button
                          className="expand-btn"
                          onClick={() => toggleRow(group.groupKey)}
                          title={expandedRows.has(group.groupKey) ? 'Collapse' : 'Expand'}
                        >
                          {expandedRows.has(group.groupKey) ? '▼' : '▶'}
                        </button>
                      </td>
                      <td className="job-id">{group.jobId}</td>
                      <td>{group.shipmentCategory || '-'}</td>
                      <td>{group.assignedToName}</td>
                      <td className="amount-cell">{formatCurrency(group.totalAssignedAmount)}</td>
                      <td>
                        <span className="assignment-count">
                          {group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(group.groupStatus)}`}>
                          {group.allSettled ? 'All Settled' : 'Pending'}
                        </span>
                      </td>
                      <td>{formatDate(group.latestAssignedDate)}</td>
                      {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
                        <td>
                          <button
                            className="btn-add-sub"
                            onClick={() => handleAddSubAssignment(group)}
                            title="Add sub-assignment"
                          >
                            + Add
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Sub-Assignments */}
                    {expandedRows.has(group.groupKey) && (
                      <tr className="expanded-row">
                        <td colSpan="9">
                          <div className="sub-assignments-container">
                            <h4>Individual Assignments</h4>
                            <table className="sub-assignments-table">
                              <thead>
                                <tr>
                                  <th>Assignment ID</th>
                                  <th>Amount</th>
                                  <th>Actual Spent</th>
                                  <th>Balance</th>
                                  <th>Over</th>
                                  <th>Status</th>
                                  <th>Assigned Date</th>
                                  <th>Settlement Date</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.assignments.map((assignment) => (
                                  <tr key={assignment.assignmentId}>
                                    <td>#{assignment.assignmentId}</td>
                                    <td className="amount-cell">{formatCurrency(assignment.assignedAmount)}</td>
                                    <td className="amount-cell">{formatCurrency(assignment.actualSpent)}</td>
                                    <td className="amount-cell balance">{formatCurrency(assignment.balanceAmount)}</td>
                                    <td className="amount-cell over">{formatCurrency(assignment.overAmount)}</td>
                                    <td>
                                      <span className={`status-badge ${getStatusBadgeClass(assignment.status)}`}>
                                        {assignment.status}
                                      </span>
                                    </td>
                                    <td>{formatDate(assignment.assignedDate)}</td>
                                    <td>{formatDate(assignment.settlementDate)}</td>
                                    <td className="notes-cell">{assignment.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="totals-row">
                                  <td><strong>Totals:</strong></td>
                                  <td className="amount-cell"><strong>{formatCurrency(group.totalAssignedAmount)}</strong></td>
                                  <td className="amount-cell"><strong>{formatCurrency(group.totalActualSpent)}</strong></td>
                                  <td className="amount-cell balance"><strong>{formatCurrency(group.totalBalance)}</strong></td>
                                  <td className="amount-cell over"><strong>{formatCurrency(group.totalOver)}</strong></td>
                                  <td colSpan="4"></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Sub-Assignment Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Sub-Assignment</h3>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSubAssignment}>
              <div className="form-group">
                <label>Job ID</label>
                <input type="text" value={selectedMainAssignment?.jobId || ''} disabled />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input type="text" value={selectedMainAssignment?.assignedToName || ''} disabled />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={assignFormData.assignedAmount}
                  onChange={(e) => setAssignFormData({ ...assignFormData, assignedAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Sub-Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PettyCashAggregated;
