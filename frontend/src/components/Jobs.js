import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { customerService } from '../api/services/customerService';
import { authService } from '../api/services/authService';
import apiClient from '../api/client';
import '../styles/Jobs.css';

function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    blNumber: '',
    cusdecNumber: '',
    openDate: '',
    shipmentCategory: '',
    exporter: '',
    lcNumber: '',
    containerNumber: '',
    transporter: '',
    assignedTo: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchJobs();
    fetchCustomers(); // All users need to see customer names
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.multi-select-dropdown')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      console.log('Fetched jobs data:', data);
      console.log('First job details:', JSON.stringify(data[0], null, 2));
      // Ensure all jobs have a status
      const jobsWithStatus = data.map(job => ({
        ...job,
        status: job.status || 'Open',
        // Map assignedUsers to assignments for consistency
        assignments: job.assignedUsers || []
      }));
      console.log('Jobs with status:', jobsWithStatus);
      console.log('First job after mapping:', JSON.stringify(jobsWithStatus[0], null, 2));
      setJobs(jobsWithStatus);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.name : customerId;
  };

  const getUserFullName = (userId) => {
    if (!userId) return 'Unknown';
    const user = users.find(u => u.userId === userId);
    return user ? user.fullName : userId;
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users... Current user role:', user?.role);
      const data = await authService.getUsers();
      console.log('Fetched users data:', data);
      const filteredUsers = data.filter(u => u.role === 'Waff Clerk');
      console.log('Filtered users (role=Waff Clerk):', filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessage('Error loading users list. Please refresh the page.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create the job first
      const jobResponse = await jobService.create(formData);
      const jobId = jobResponse.jobId;
      
      let assignmentMessage = '';
      
      // If users are selected, assign them to the job
      if (selectedUsers.length > 0) {
        try {
          const response = await apiClient.post(`/job-assignments/jobs/${jobId}/assign-users`, {
            userIds: selectedUsers,
            notes: 'Initial assignment from job creation'
          });
          
          if (response.data.success) {
            assignmentMessage = ` and assigned to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}`;
          } else {
            console.error('Assignment failed:', response.data);
            assignmentMessage = ' (Note: Job created but user assignment failed)';
          }
        } catch (assignmentError) {
          console.error('Failed to assign users to job:', assignmentError);
          console.error('Error response:', assignmentError.response?.data);
          assignmentMessage = ' (Note: Job created but user assignment failed)';
        }
      }
      
      setMessage(`Job created successfully${assignmentMessage}!`);
      setFormData({ 
        customerId: '', 
        blNumber: '', 
        cusdecNumber: '', 
        openDate: '', 
        shipmentCategory: '',
        exporter: '',
        lcNumber: '',
        containerNumber: '',
        transporter: '',
        assignedTo: '' 
      });
      setSelectedUsers([]);
      setShowModal(false);
      fetchJobs();
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Job creation error:', error);
      setMessage('Error creating job');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUserSelection = (userId, isChecked) => {
    if (isChecked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const getSelectedUserNames = () => {
    if (selectedUsers.length === 0) return 'Select Users';
    if (selectedUsers.length === 1) {
      const user = users.find(u => u.userId === selectedUsers[0]);
      return user ? user.fullName : 'Select Users';
    }
    return `${selectedUsers.length} users selected`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateStatus = async (jobId, status) => {
    try {
      console.log('updateStatus called - jobId:', jobId, 'status:', status);
      await jobService.updateStatus(jobId, status);
      fetchJobs();
      setMessage('Job status updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error response:', error.response?.data);
      setMessage(`Error updating status: ${error.response?.data?.message || error.message}`);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const getAvailableStatuses = (currentStatus) => {
    const statusMap = {
      'Open': ['In Progress', 'Canceled'],
      'In Progress': ['Pending Payment', 'Canceled'],
      'Pending Payment': ['Payment Collected', 'Overdue'],
      'Payment Collected': ['Completed'],
      'Overdue': ['Payment Collected'],
      'Completed': ['Completed'], // Final status
      'Canceled': ['Canceled'] // Final status
    };
    
    return statusMap[currentStatus] || ['Open'];
  };

  const assignJob = async (jobId, userId) => {
    try {
      await jobService.assignUser(jobId, userId);
      fetchJobs();
      setMessage('Job assigned successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error assigning job:', error);
    }
  };

  const openEditModal = (job) => {
    setSelectedJob(job);
    setIsEditing(true);
    setFormData({
      customerId: job.customerId,
      blNumber: job.blNumber || '',
      cusdecNumber: job.cusdecNumber || '',
      openDate: job.openDate ? job.openDate.split('T')[0] : '',
      shipmentCategory: job.shipmentCategory || '',
      exporter: job.exporter || '',
      lcNumber: job.lcNumber || '',
      containerNumber: job.containerNumber || '',
      transporter: job.transporter || '',
      assignedTo: job.assignedTo || ''
    });
    // For editing, load existing assignments
    if (job.assignments && job.assignments.length > 0) {
      setSelectedUsers(job.assignments.map(a => a.userId));
    } else if (job.assignedTo) {
      setSelectedUsers([job.assignedTo]);
    } else {
      setSelectedUsers([]);
    }
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await jobService.update(selectedJob.jobId, formData);
      
      // Update user assignments if changed
      if (selectedUsers.length > 0) {
        try {
          const response = await apiClient.post(`/job-assignments/jobs/${selectedJob.jobId}/assign-users`, {
            userIds: selectedUsers,
            notes: 'Updated assignment from job edit'
          });
          
          if (!response.data.success) {
            console.error('Failed to update user assignments');
          }
        } catch (assignmentError) {
          console.error('Failed to update user assignments:', assignmentError);
        }
      }
      
      setMessage('Job updated successfully!');
      setFormData({
        customerId: '',
        blNumber: '',
        cusdecNumber: '',
        openDate: '',
        shipmentCategory: '',
        exporter: '',
        lcNumber: '',
        containerNumber: '',
        transporter: '',
        assignedTo: ''
      });
      setSelectedUsers([]);
      setShowUserDropdown(false);
      setShowModal(false);
      setIsEditing(false);
      setSelectedJob(null);
      fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const searchLower = searchTerm.toLowerCase();
    const jobId = (job.jobId || '').toLowerCase();
    const customerName = getCustomerName(job.customerId).toLowerCase();
    const category = (job.shipmentCategory || '').toLowerCase();
    const assignedUser = job.assignedTo ? getUserFullName(job.assignedTo).toLowerCase() : 'unassigned';
    const status = (job.status || 'open').toLowerCase();
    const openDate = job.openDate ? new Date(job.openDate).toLocaleDateString().toLowerCase() : '';
    
    // Status filter
    const statusMatch = statusFilter === 'All' || job.status === statusFilter;
    
    // Search filter
    const searchMatch = jobId.includes(searchLower) ||
           customerName.includes(searchLower) ||
           category.includes(searchLower) ||
           assignedUser.includes(searchLower) ||
           status.includes(searchLower) ||
           openDate.includes(searchLower);
    
    return statusMatch && searchMatch;
  });

  return (
    <div className="jobs-page">
      <div className="page-header">
        <div>
          <h1>Job Management</h1>
          <p>{user?.role === 'Waff Clerk' ? 'Your assigned jobs' : 'Manage all cargo jobs'}</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + New Job
          </button>
        )}
      </div>

      {message && <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

      <div className="card">
        <div className="card-header">
          <h2>All Jobs ({filteredJobs.length})</h2>
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="statusFilter">Filter by Status:</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Payment Collected">Payment Collected</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
              {(statusFilter !== 'All' || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchTerm('');
                  }}
                  className="btn-clear-filters"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              )}
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by Job ID, Customer, Category, Assigned User, or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>{searchTerm ? 'No jobs found matching your search' : 'No jobs found'}</p>
          </div>
        ) : (
          <div className="jobs-table-wrapper">
            <table className="jobs-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Open Date</th>
                {user?.role !== 'Waff Clerk' && <th>Assigned To</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <React.Fragment key={job.jobId}>
                  <tr className={expandedRow === job.jobId ? 'expanded' : ''}>
                    <td data-label="Job ID"><span className="job-id">{job.jobId || '-'}</span></td>
                    <td data-label="Customer">{getCustomerName(job.customerId)}</td>
                    <td data-label="Category">
                      {job.shipmentCategory ? (
                        <span className="category-badge">{job.shipmentCategory}</span>
                      ) : '-'}
                    </td>
                    <td data-label="Open Date">{job.openDate ? new Date(job.openDate).toLocaleDateString() : '-'}</td>
                    {user?.role !== 'Waff Clerk' && (
                      <td data-label="Assigned To">
                        {(user?.role === 'Admin' || user?.role === 'Super Admin') && !job.assignedTo && (!job.assignments || job.assignments.length === 0) ? (
                          <select onChange={(e) => assignJob(job.jobId, e.target.value)} defaultValue="">
                            <option value="">Assign User</option>
                            {users.map(u => (
                              <option key={u.userId} value={u.userId}>{u.fullName}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="assigned-users">
                            {job.assignments && job.assignments.length > 0 ? (
                              <div className="multi-user-assignments">
                                {job.assignments.slice(0, 2).map((assignment, index) => (
                                  <span key={assignment.userId || index} className="assigned-user-badge">
                                    {assignment.userName || getUserFullName(assignment.userId)}
                                  </span>
                                ))}
                                {job.assignments.length > 2 && (
                                  <span className="more-users-badge">
                                    +{job.assignments.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : job.assignedTo ? (
                              <span className="assigned-user-badge">{getUserFullName(job.assignedTo)}</span>
                            ) : (
                              <span className="unassigned-text">Unassigned</span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    <td data-label="Status">
                      <div className="status-select-wrapper">
                        <select 
                          className={`status-badge status-${(job.status || 'Open').toLowerCase().replace(/\s+/g, '-')}`}
                          onChange={(e) => updateStatus(job.jobId, e.target.value)} 
                          value={job.status || 'Open'}
                          disabled={job.status === 'Completed' || job.status === 'Canceled'}
                        >
                          <option value={job.status || 'Open'}>{job.status || 'Open'}</option>
                          {getAvailableStatuses(job.status || 'Open').map(status => (
                            status !== (job.status || 'Open') && (
                              <option key={status} value={status}>{status.toUpperCase()}</option>
                            )
                          ))}
                        </select>
                        {job.status !== 'Completed' && job.status !== 'Canceled' && (
                          <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
                          <button
                            className="btn-action btn-edit"
                            onClick={() => openEditModal(job)}
                            title="Edit Job"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="btn-action btn-view"
                          onClick={() => setExpandedRow(expandedRow === job.jobId ? null : job.jobId)}
                          title="View Details"
                        >
                          {expandedRow === job.jobId ? 'Hide' : 'View'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === job.jobId && (
                    <tr className="expanded-details">
                      <td colSpan={user?.role !== 'Waff Clerk' ? 7 : 6}>
                        <div className="details-grid">
                          <div className="detail-section">
                            <h4 className="section-title">Basic Information</h4>
                            <div className="detail-item">
                              <span className="detail-label">Job ID:</span>
                              <span className="detail-value job-id">{job.jobId}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Customer:</span>
                              <span className="detail-value">{getCustomerName(job.customerId)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Customer ID:</span>
                              <span className="detail-value">{job.customerId}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Shipment Category:</span>
                              <span className="detail-value">
                                <span className="category-badge">{job.shipmentCategory || '-'}</span>
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Status:</span>
                              <span className="detail-value">
                                <span className={`status-badge status-${(job.status || 'Open').toLowerCase().replace(' ', '-')}`}>
                                  {job.status || 'Open'}
                                </span>
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Created Date:</span>
                              <span className="detail-value">{job.createdDate ? new Date(job.createdDate).toLocaleDateString() : '-'}</span>
                            </div>
                          </div>

                          <div className="detail-section">
                            <h4 className="section-title">Shipment Details</h4>
                            <div className="detail-item">
                              <span className="detail-label">BL Number:</span>
                              <span className="detail-value">{job.blNumber || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">CUSDEC Number:</span>
                              <span className="detail-value">{job.cusdecNumber || '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Open Date:</span>
                              <span className="detail-value">{job.openDate ? new Date(job.openDate).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Assigned To:</span>
                              <span className="detail-value">
                                {job.assignments && job.assignments.length > 0 ? (
                                  <div className="assigned-users-detail">
                                    {job.assignments.map((assignment, index) => (
                                      <span key={assignment.userId || index} className="assigned-user-badge">
                                        {assignment.userName || getUserFullName(assignment.userId)}
                                      </span>
                                    ))}
                                  </div>
                                ) : job.assignedTo ? (
                                  <span className="assigned-user-badge">{getUserFullName(job.assignedTo)}</span>
                                ) : (
                                  <span className="unassigned-text">Unassigned</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); setSelectedUsers([]); setShowUserDropdown(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Job' : 'Create New Job'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); setSelectedUsers([]); setShowUserDropdown(false); }}>×</button>
            </div>
            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="job-form">
              <div className="form-section">
                <h3 className="section-heading">Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer <span className="required">*</span></label>
                    <select name="customerId" value={formData.customerId} onChange={handleChange} required disabled={isEditing}>
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.customerId} value={c.customerId}>{c.customerId} - {c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Assign To Users</label>
                    <div className="multi-select-dropdown">
                      <div 
                        className="multi-select-trigger" 
                        onClick={toggleUserDropdown}
                      >
                        <span className="selected-text">{getSelectedUserNames()}</span>
                        <svg 
                          className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`} 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12" 
                          fill="none"
                        >
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {showUserDropdown && (
                        <div className="multi-select-options">
                          {users.length === 0 ? (
                            <div className="no-users-message">No users available</div>
                          ) : (
                            users.map(user => (
                              <label key={user.userId} className="multi-select-option">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.userId)}
                                  onChange={(e) => handleUserSelection(user.userId, e.target.checked)}
                                />
                                <span className="option-label">{user.fullName}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <div className="selected-users-tags">
                        {selectedUsers.map(userId => {
                          const user = users.find(u => u.userId === userId);
                          return user ? (
                            <span key={userId} className="user-tag">
                              {user.fullName}
                              <button
                                type="button"
                                className="remove-tag"
                                onClick={() => handleUserSelection(userId, false)}
                              >
                                ×
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">Shipment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Shipment Category <span className="required">*</span></label>
                    <select name="shipmentCategory" value={formData.shipmentCategory} onChange={handleChange} required>
                      <option value="">Select Category</option>
                      <option value="LCL">LCL - Loose Cargo Load</option>
                      <option value="FCL">FCL - Full Container Load</option>
                      <option value="Air Freight">Air Freight</option>
                      <option value="BOI">BOI - Board of Investment</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="TIEP">TIEP - Temporary Importation for Export Processing</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Open Date <span className="required">*</span></label>
                    <input type="date" name="openDate" value={formData.openDate} onChange={handleChange} required />
                  </div>
                  
                  <div className="form-group">
                    <label>BL Number</label>
                    <input type="text" name="blNumber" value={formData.blNumber} onChange={handleChange} placeholder="Bill of Lading Number" />
                  </div>
                  
                  <div className="form-group">
                    <label>CUSDEC Number</label>
                    <input type="text" name="cusdecNumber" value={formData.cusdecNumber} onChange={handleChange} placeholder="Customs Declaration Number" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>LC Number</label>
                    <input type="text" name="lcNumber" value={formData.lcNumber} onChange={handleChange} placeholder="Letter of Credit Number" />
                  </div>
                  
                  <div className="form-group">
                    <label>Container Number</label>
                    <input type="text" name="containerNumber" value={formData.containerNumber} onChange={handleChange} placeholder="Container Number" />
                  </div>
                  
                  <div className="form-group">
                    <label>Exporter</label>
                    <input type="text" name="exporter" value={formData.exporter} onChange={handleChange} placeholder="Exporter name" />
                  </div>
                  
                  <div className="form-group">
                    <label>Transporter</label>
                    <input type="text" name="transporter" value={formData.transporter} onChange={handleChange} placeholder="Transporter name" />
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Job' : 'Create Job'}</button>
                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); setSelectedUsers([]); setShowUserDropdown(false); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
