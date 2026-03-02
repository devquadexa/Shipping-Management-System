import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'User',
    email: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.role === 'Super Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/register', formData);
      setMessage('User created successfully!');
      setFormData({ username: '', password: '', fullName: '', role: 'User', email: '' });
      setShowModal(false);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating user');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (user?.role !== 'Super Admin') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage system users and their roles</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
          <h2 style={{margin: 0}}>All Users</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            ➕ Create New User
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.userId}>
                <td>{u.userId}</td>
                <td>{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`status-badge ${u.role === 'Super Admin' ? 'status-completed' : u.role === 'Admin' ? 'status-in-transit' : 'status-open'}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New User</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Create User</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
