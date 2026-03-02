import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPayItemModal, setShowPayItemModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    description: '',
    origin: '',
    destination: '',
    weight: '',
    shippingCost: '',
    assignedTo: ''
  });
  const [payItemData, setPayItemData] = useState({
    description: '',
    amount: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchJobs();
    if (user?.role !== 'User') {
      fetchCustomers();
      fetchUsers();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      setUsers(response.data.filter(u => u.role === 'User'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/jobs', {
        ...formData,
        weight: parseFloat(formData.weight),
        shippingCost: parseFloat(formData.shippingCost)
      });
      setMessage('Job created successfully!');
      setFormData({ customerId: '', description: '', origin: '', destination: '', weight: '', shippingCost: '', assignedTo: '' });
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
      await axios.patch(`/api/jobs/${jobId}/status`, { status });
      fetchJobs();
      setMessage('Job status updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const assignJob = async (jobId, userId) => {
    try {
      await axios.patch(`/api/jobs/${jobId}/assign`, { assignedTo: userId });
      fetchJobs();
      setMessage('Job assigned successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error assigning job:', error);
    }
  };

  const addPayItem = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/jobs/${selectedJob.jobId}/pay-items`, {
        description: payItemData.description,
        amount: parseFloat(payItemData.amount)
      });
      setMessage('Pay item added successfully!');
      setPayItemData({ description: '', amount: '' });
      setShowPayItemModal(false);
      fetchJobs();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error adding pay item');
    }
  };

  const openPayItemModal = (job) => {
    setSelectedJob(job);
    setShowPayItemModal(true);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Job Management</h1>
        <p>{user?.role === 'User' ? 'Your assigned jobs' : 'Manage all cargo jobs'}</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
        <div className="card">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
            <h2 style={{margin: 0}}>Create New Job</h2>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              ➕ New Job
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>All Jobs</h2>
        {jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <p>No jobs found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Customer</th>
                <th>Route</th>
                <th>Weight (kg)</th>
                <th>Cost (LKR)</th>
                {user?.role !== 'User' && <th>Assigned To</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.jobId}>
                  <td><strong>{job.jobId}</strong></td>
                  <td>{job.customerId}</td>
                  <td>{job.origin} → {job.destination}</td>
                  <td>{job.weight}</td>
                  <td>{job.shippingCost.toFixed(2)}</td>
                  {user?.role !== 'User' && (
                    <td>
                      {(user?.role === 'Admin' || user?.role === 'Super Admin') && !job.assignedTo ? (
                        <select onChange={(e) => assignJob(job.jobId, e.target.value)} defaultValue="">
                          <option value="">Assign User</option>
                          {users.map(u => (
                            <option key={u.userId} value={u.userId}>{u.fullName}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{job.assignedTo || 'Unassigned'}</span>
                      )}
                    </td>
                  )}
                  <td>
                    <select 
                      className={`status-badge status-${job.status.toLowerCase().replace(' ', '-')}`}
                      onChange={(e) => updateStatus(job.jobId, e.target.value)} 
                      value={job.status}
                      style={{border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 600}}
                    >
                      <option value="Open">Open</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                        <button onClick={() => openPayItemModal(job)} className="btn btn-success" style={{padding: '0.5rem 1rem', fontSize: '0.85rem'}}>
                          💰 Add Pay Item
                        </button>
                      )}
                      {job.payItems && job.payItems.length > 0 && (
                        <span style={{fontSize: '0.85rem', color: '#27ae60'}}>
                          {job.payItems.length} pay item(s)
                        </span>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Job</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Customer</label>
                <select name="customerId" value={formData.customerId} onChange={handleChange} required>
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.customerId} value={c.customerId}>{c.customerId} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Origin</label>
                  <input type="text" name="origin" value={formData.origin} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input type="text" name="destination" value={formData.destination} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.01" name="weight" value={formData.weight} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Shipping Cost (LKR)</label>
                  <input type="number" step="0.01" name="shippingCost" value={formData.shippingCost} onChange={handleChange} required />
                </div>
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
                <button type="submit" className="btn btn-primary">Create Job</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayItemModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowPayItemModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Pay Item - {selectedJob.jobId}</h2>
              <button className="btn-close" onClick={() => setShowPayItemModal(false)}>×</button>
            </div>
            <form onSubmit={addPayItem}>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={payItemData.description} 
                  onChange={(e) => setPayItemData({...payItemData, description: e.target.value})} 
                  required 
                  placeholder="e.g., Fuel cost, Toll fee"
                />
              </div>
              <div className="form-group">
                <label>Amount (LKR)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={payItemData.amount} 
                  onChange={(e) => setPayItemData({...payItemData, amount: e.target.value})} 
                  required 
                />
              </div>
              {selectedJob.payItems && selectedJob.payItems.length > 0 && (
                <div style={{marginBottom: '1rem'}}>
                  <h4>Existing Pay Items:</h4>
                  <ul>
                    {selectedJob.payItems.map((item, idx) => (
                      <li key={idx}>{item.description}: LKR {item.amount.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="action-buttons">
                <button type="submit" className="btn btn-success">Add Pay Item</button>
                <button type="button" onClick={() => setShowPayItemModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;
