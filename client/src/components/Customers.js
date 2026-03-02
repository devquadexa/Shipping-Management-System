import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/customers', formData);
      setMessage('Customer registered successfully!');
      setFormData({ name: '', phone: '', email: '', address: '' });
      setShowModal(false);
      fetchCustomers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error registering customer');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (user?.role === 'User') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Admin or Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Customer Management</h1>
        <p>Manage customer information and registrations</p>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="card">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
          <h2 style={{margin: 0}}>All Customers</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            ➕ Register Customer
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>No customers registered yet</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.customerId}>
                  <td><strong>{customer.customerId}</strong></td>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td>{customer.address}</td>
                  <td>{new Date(customer.registrationDate).toLocaleDateString()}</td>
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
              <h2>Register New Customer</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" />
              </div>
              <div className="action-buttons">
                <button type="submit" className="btn btn-primary">Register Customer</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
