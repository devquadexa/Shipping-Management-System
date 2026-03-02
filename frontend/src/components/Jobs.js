import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobService } from '../api/services/jobService';
import { customerService } from '../api/services/customerService';
import { authService } from '../api/services/authService';
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
    assignedTo: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchCustomers(); // All users need to see customer names
    if (user?.role !== 'User') {
      fetchUsers();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const data = await jobService.getAll();
      console.log('Fetched jobs data:', data);
      console.log('First job details:', JSON.stringify(data[0], null, 2));
      // Ensure all jobs have a status
      const jobsWithStatus = data.map(job => ({
        ...job,
        status: job.status || 'Open'
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
      const data = await authService.getUsers();
      setUsers(data.filter(u => u.role === 'User'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await jobService.create(formData);
      setMessage('Job created successfully!');
      setFormData({ 
        customerId: '', 
        blNumber: '', 
        cusdecNumber: '', 
        openDate: '', 
        shipmentCategory: '',
        exporter: '',
        lcNumber: '',
        containerNumber: '',
        assignedTo: '' 
      });
      setShowModal(false);
      fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating job');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateStatus = async (jobId, status) => {
    try {
      await jobService.update(jobId, { status });
      fetchJobs();
      setMessage('Job status updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
    }
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
      assignedTo: job.assignedTo || ''
    });
    setShowModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await jobService.update(selectedJob.jobId, formData);
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
        assignedTo: ''
      });
      setShowModal(false);
      setIsEditing(false);
      setSelectedJob(null);
      fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating job');
    }
  };

  return (
    <div className="jobs-page">
      <div className="page-header">
        <div>
          <h1>Job Management</h1>
          <p>{user?.role === 'User' ? 'Your assigned jobs' : 'Manage all cargo jobs'}</p>
        </div>
        {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + New Job
          </button>
        )}
      </div>

      {message && <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>{message}</div>}

      <div className="card">
        <div className="card-header">
          <h2>All Jobs ({jobs.length})</h2>
        </div>
        {jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No jobs found</p>
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
                {user?.role !== 'User' && <th>Assigned To</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
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
                    {user?.role !== 'User' && (
                      <td data-label="Assigned To">
                        {(user?.role === 'Admin' || user?.role === 'Super Admin') && !job.assignedTo ? (
                          <select onChange={(e) => assignJob(job.jobId, e.target.value)} defaultValue="">
                            <option value="">Assign User</option>
                            {users.map(u => (
                              <option key={u.userId} value={u.userId}>{u.fullName}</option>
                            ))}
                          </select>
                        ) : (
                          <span>{job.assignedTo ? getUserFullName(job.assignedTo) : 'Unassigned'}</span>
                        )}
                      </td>
                    )}
                    <td data-label="Status">
                      <select 
                        className={`status-badge status-${(job.status || 'Open').toLowerCase().replace(' ', '-')}`}
                        onChange={(e) => updateStatus(job.jobId, e.target.value)} 
                        value={job.status || 'Open'}
                      >
                        <option value="Open">Open</option>
                        <option value="Started">Started</option>
                        <option value="Completed">Completed</option>
                        <option value="Canceled">Canceled</option>
                      </select>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
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
                      <td colSpan={user?.role !== 'User' ? 7 : 6}>
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
                              <span className="detail-value">{job.assignedTo ? getUserFullName(job.assignedTo) : 'Unassigned'}</span>
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
        <div className="modal-overlay" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Job' : 'Create New Job'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); }}>×</button>
            </div>
            <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="job-form">
              <div className="form-group">
                <label>Customer *</label>
                <select name="customerId" value={formData.customerId} onChange={handleChange} required disabled={isEditing}>
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>{c.customerId} - {c.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
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
                  <label>Open Date</label>
                  <input type="date" name="openDate" value={formData.openDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Shipment Category *</label>
                  <select name="shipmentCategory" value={formData.shipmentCategory} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    <option value="SLPA">SLPA - Sri Lanka Port Authority</option>
                    <option value="CICT">CICT - Colombo International Cargo Terminal</option>
                    <option value="CWIT">CWIT - Colombo West International Terminal</option>
                    <option value="LCL">LCL - Loose Cargo Load</option>
                    <option value="FCL">FCL - Full Container Load</option>
                    <option value="Air-Freight">Air-Freight</option>
                    <option value="BOI">BOI - Board of Investment</option>
                    <option value="TIEP">TIEP - Temporary Importation for Export Processing</option>
                    <option value="ICL">ICL - Import Control License</option>
                    <option value="SLSI">SLSI - Sri Lanka Standard Institution</option>
                    <option value="CEA">CEA - Central Environmental Authority</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Exporter</label>
                  <input type="text" name="exporter" value={formData.exporter} onChange={handleChange} placeholder="Exporter name" />
                </div>
                <div className="form-group">
                  <label>LC Number</label>
                  <input type="text" name="lcNumber" value={formData.lcNumber} onChange={handleChange} placeholder="Letter of Credit Number" />
                </div>
              </div>

              <div className="form-group">
                <label>Container Number</label>
                <input type="text" name="containerNumber" value={formData.containerNumber} onChange={handleChange} placeholder="Container Number" />
              </div>

              <div className="form-group">
                <label>Assign To (Optional)</label>
                <select name="assignedTo" value={formData.assignedTo} onChange={handleChange}>
                  <option value="">Assign Later</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">{isEditing ? 'Update Job' : 'Create Job'}</button>
                <button type="button" onClick={() => { setShowModal(false); setIsEditing(false); setSelectedJob(null); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
