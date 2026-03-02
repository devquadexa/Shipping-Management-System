import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function PettyCash() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [balance, setBalance] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    entryType: 'Expense',
    jobId: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEntries();
    fetchJobs();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/petty-cash');
      setEntries(response.data.entries);
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching petty cash:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/petty-cash', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setMessage('Entry added successfully!');
      setFormData({ description: '', amount: '', entryType: 'Expense', jobId: '' });
      fetchEntries();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error adding entry');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Petty Cash Management</h1>
        <p>Track income and expenses</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem'}}>
          <h3 style={{margin: 0, fontSize: '1rem', opacity: 0.9}}>Current Balance</h3>
          <div style={{fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem'}}>
            LKR {balance.toFixed(2)}
          </div>
        </div>

        <h2>Add Petty Cash Entry</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="entryType" value={formData.entryType} onChange={handleChange}>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount (LKR)</label>
              <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="e.g., Fuel, Office supplies" />
          </div>
          <div className="form-group">
            <label>Related Job (Optional)</label>
            <select name="jobId" value={formData.jobId} onChange={handleChange}>
              <option value="">No specific job</option>
              {jobs.map(job => (
                <option key={job.jobId} value={job.jobId}>
                  {job.jobId} - {job.description} ({job.origin} → {job.destination})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Add Entry</button>
        </form>
      </div>

      <div className="card">
        <h2>Petty Cash Statement</h2>
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <p>No entries found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Description</th>
                <th>Job ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance After</th>
                <th>Date</th>
                {user?.role !== 'User' && <th>Created By</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.entryId}>
                  <td><strong>{entry.entryId}</strong></td>
                  <td>{entry.description}</td>
                  <td>{entry.jobId || '-'}</td>
                  <td>
                    <span className={`status-badge ${entry.entryType === 'Income' ? 'status-completed' : 'status-unpaid'}`}>
                      {entry.entryType}
                    </span>
                  </td>
                  <td style={{color: entry.entryType === 'Income' ? '#27ae60' : '#e74c3c', fontWeight: 'bold'}}>
                    {entry.entryType === 'Income' ? '+' : '-'}LKR {entry.amount.toFixed(2)}
                  </td>
                  <td>LKR {entry.balanceAfter.toFixed(2)}</td>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  {user?.role !== 'User' && <td>{entry.createdBy}</td>}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PettyCash;
