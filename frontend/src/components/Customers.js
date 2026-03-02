import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/services/customerService';
import '../styles/Customers.css';

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mainPhone: '',
    email: '',
    address: '',
    officeLocation: '',
    isSameLocation: false,
    website: '',
    contactPersons: [{ name: '', phone: '' }],
    categories: [],
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/customers/categories/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const validateForm = () => {
    const errors = {};
    
    // Name validation - only letters, spaces, and hyphens
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s-]+$/.test(formData.name)) {
      errors.name = 'Name can only contain letters, spaces, and hyphens (-)';
    }
    
    // Main phone validation - exactly 10 digits
    if (!formData.mainPhone.trim()) {
      errors.mainPhone = 'Main phone number is required';
    } else if (!/^\d{10}$/.test(formData.mainPhone.replace(/\s/g, ''))) {
      errors.mainPhone = 'Phone number must be exactly 10 digits';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Address validation
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    
    // Contact persons validation - at least one required
    const validContactPersons = formData.contactPersons.filter(
      cp => cp.name.trim() !== '' || cp.phone.trim() !== ''
    );
    
    if (validContactPersons.length === 0) {
      errors.contactPersons = 'At least one contact person is required';
    } else {
      // Validate each contact person
      formData.contactPersons.forEach((cp, index) => {
        if (cp.name.trim() !== '' || cp.phone.trim() !== '') {
          // If either field has data, both must be valid
          if (!cp.name.trim()) {
            errors[`contactPerson${index}Name`] = 'Contact person name is required';
          } else if (!/^[a-zA-Z\s-]+$/.test(cp.name)) {
            errors[`contactPerson${index}Name`] = 'Name can only contain letters, spaces, and hyphens (-)';
          }
          
          if (!cp.phone.trim()) {
            errors[`contactPerson${index}Phone`] = 'Contact person phone is required';
          } else if (!/^\d{10}$/.test(cp.phone.replace(/\s/g, ''))) {
            errors[`contactPerson${index}Phone`] = 'Phone number must be exactly 10 digits';
          }
        }
      });
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setMessage('Please fix the errors in the form');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    try {
      console.log('Submitting customer data:', formData);
      
      // Filter out empty contact persons
      const filteredContactPersons = formData.contactPersons.filter(
        cp => cp.name.trim() !== '' && cp.phone.trim() !== ''
      );
      
      const submitData = {
        ...formData,
        contactPersons: filteredContactPersons,
        officeLocation: formData.isSameLocation ? formData.address : formData.officeLocation
      };
      
      console.log('Submit data with isActive:', submitData.isActive);
      
      if (editingCustomer) {
        await customerService.update(editingCustomer.customerId, submitData);
        setMessage('Customer updated successfully!');
      } else {
        await customerService.create(submitData);
        setMessage('Customer registered successfully!');
      }
      
      resetForm();
      setShowModal(false);
      setEditingCustomer(null);
      fetchCustomers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving customer:', error);
      const errorMessage = error.response?.data?.message || 'Error saving customer';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      mainPhone: '', 
      email: '', 
      address: '',
      officeLocation: '',
      isSameLocation: false,
      website: '',
      contactPersons: [{ name: '', phone: '' }],
      categories: [],
      isActive: true
    });
    setFormErrors({});
    setEditingCustomer(null);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      mainPhone: customer.mainPhone || '',
      email: customer.email || '',
      address: customer.address || '',
      officeLocation: customer.officeLocation || '',
      isSameLocation: customer.isSameLocation || false,
      website: customer.website || '',
      contactPersons: customer.contactPersons && customer.contactPersons.length > 0 
        ? customer.contactPersons.map(cp => ({ name: cp.name, phone: cp.phone }))
        : [{ name: '', phone: '' }],
      categories: customer.categories ? customer.categories.map(cat => cat.categoryId) : [],
      isActive: customer.isActive !== undefined ? customer.isActive : true
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateNameInput = (e) => {
    const value = e.target.value;
    // Only allow letters, spaces, and hyphens
    if (value === '' || /^[a-zA-Z\s-]*$/.test(value)) {
      return true;
    }
    e.preventDefault();
    return false;
  };

  const validatePhoneInput = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 10
    if (value === '' || (/^\d*$/.test(value) && value.length <= 10)) {
      return true;
    }
    e.preventDefault();
    return false;
  };

  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons];
    updatedContactPersons[index][field] = value;
    setFormData({ ...formData, contactPersons: updatedContactPersons });
    
    // Clear errors for this contact person field
    const errorKey = `contactPerson${index}${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (formErrors[errorKey]) {
      setFormErrors({ ...formErrors, [errorKey]: '', contactPersons: '' });
    }
  };

  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: '', phone: '' }]
      });
    }
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length > 1) {
      const updatedContactPersons = formData.contactPersons.filter((_, i) => i !== index);
      setFormData({ ...formData, contactPersons: updatedContactPersons });
      // Clear related errors
      const newErrors = { ...formErrors };
      delete newErrors[`contactPerson${index}Name`];
      delete newErrors[`contactPerson${index}Phone`];
      setFormErrors(newErrors);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const updatedCategories = formData.categories.includes(categoryId)
      ? formData.categories.filter(id => id !== categoryId)
      : [...formData.categories, categoryId];
    setFormData({ ...formData, categories: updatedCategories });
  };

  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customerId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role === 'User') {
    return (
      <div className="container">
        <div className="alert alert-error">Access Denied: Admin or Super Admin only</div>
      </div>
    );
  }

  return (
    <div className="container customers-page">
      <div className="page-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage customer information and registrations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-large">
          + Add New Customer
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>All Customers ({filteredCustomers.length})</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <p>{searchTerm ? 'No customers found matching your search' : 'No customers registered yet'}</p>
          </div>
        ) : (
          <div className="customers-table-wrapper">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Main Phone</th>
                  <th>Email</th>
                  <th>Categories</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => (
                  <React.Fragment key={customer.customerId}>
                    <tr className={expandedRow === customer.customerId ? 'expanded' : ''}>
                      <td data-label="Customer ID"><strong className="customer-id">{customer.customerId}</strong></td>
                      <td data-label="Name"><strong>{customer.name}</strong></td>
                      <td data-label="Phone">{customer.mainPhone}</td>
                      <td data-label="Email" className="email-cell">{customer.email}</td>
                      <td data-label="Categories">
                        <div className="categories-badges">
                          {customer.categories && customer.categories.length > 0 
                            ? customer.categories.slice(0, 2).map(cat => (
                                <span key={cat.categoryId} className="category-badge">
                                  {cat.categoryName}
                                </span>
                              ))
                            : <span className="text-muted">-</span>}
                          {customer.categories && customer.categories.length > 2 && (
                            <span className="category-badge more">+{customer.categories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Registered">{new Date(customer.registrationDate).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(customer)}
                            title="Edit Customer"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-action btn-view"
                            onClick={() => setExpandedRow(expandedRow === customer.customerId ? null : customer.customerId)}
                            title="View Details"
                          >
                            {expandedRow === customer.customerId ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === customer.customerId && (
                      <tr className="expanded-details">
                        <td colSpan="7">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4 className="section-title">Address Information</h4>
                              <div className="detail-item">
                                <span className="detail-label">Address:</span>
                                <span className="detail-value">{customer.address}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Office Location:</span>
                                <span className="detail-value">{customer.officeLocation || customer.address}</span>
                              </div>
                              {customer.website && (
                                <div className="detail-item">
                                  <span className="detail-label">Website:</span>
                                  <span className="detail-value">
                                    <a href={customer.website} target="_blank" rel="noopener noreferrer">{customer.website}</a>
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {customer.contactPersons && customer.contactPersons.length > 0 && (
                              <div className="detail-section">
                                <h4 className="section-title">Contact Persons</h4>
                                {customer.contactPersons.map((cp, idx) => (
                                  <div key={idx} className="detail-item">
                                    <span className="detail-label">{cp.name}:</span>
                                    <span className="detail-value">{cp.phone}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {customer.categories && customer.categories.length > 0 && (
                              <div className="detail-section">
                                <h4 className="section-title">Business Categories</h4>
                                <div className="categories-list">
                                  {customer.categories.map(cat => (
                                    <span key={cat.categoryId} className="category-badge">
                                      {cat.categoryName}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
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
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCustomer ? 'Edit Customer' : 'Register New Customer'}</h2>
              <button className="btn-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="customer-form">
              {/* Basic Information */}
              <div className="form-section">
                <h3 className="section-heading">Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer / Company Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange}
                      onKeyPress={validateNameInput}
                      className={formErrors.name ? 'error' : ''}
                      placeholder="Enter name (letters, spaces, and hyphens only)"
                      required 
                    />
                    {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Main Phone Number * (10 digits)</label>
                    <input 
                      type="tel" 
                      name="mainPhone" 
                      value={formData.mainPhone} 
                      onChange={handleChange}
                      onKeyPress={validatePhoneInput}
                      className={formErrors.mainPhone ? 'error' : ''}
                      placeholder="0771234567"
                      maxLength="10"
                      required 
                    />
                    {formErrors.mainPhone && <span className="error-message">{formErrors.mainPhone}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className={formErrors.email ? 'error' : ''}
                      placeholder="email@example.com"
                      required 
                    />
                    {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="form-section">
                <h3 className="section-heading">Location Information</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Address *</label>
                    <textarea 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange}
                      className={formErrors.address ? 'error' : ''}
                      placeholder="Enter full address"
                      required 
                      rows="2" 
                    />
                    {formErrors.address && <span className="error-message">{formErrors.address}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="isSameLocation" 
                        checked={formData.isSameLocation} 
                        onChange={handleChange}
                      />
                      <span>Office location is same as address</span>
                    </label>
                  </div>
                </div>
                
                {!formData.isSameLocation && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label>Office Location</label>
                      <textarea name="officeLocation" value={formData.officeLocation} onChange={handleChange} rows="2" />
                    </div>
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Website</label>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="form-section">
                <h3 className="section-heading">Business Categories</h3>
                <div className="categories-grid">
                  {categories.map(category => (
                    <label key={category.categoryId} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category.categoryId)}
                        onChange={() => handleCategoryChange(category.categoryId)}
                      />
                      <span>{category.categoryName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact Persons */}
              <div className="form-section">
                <h3 className="section-heading">Contact Persons * (At least 1 required, up to 3)</h3>
                {formErrors.contactPersons && (
                  <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {formErrors.contactPersons}
                  </div>
                )}
                {formData.contactPersons.map((cp, index) => (
                  <div key={index} className="contact-person-row">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Contact Person {index + 1} - Name *</label>
                        <input
                          type="text"
                          placeholder="Full Name (letters, spaces, hyphens only)"
                          value={cp.name}
                          onChange={(e) => handleContactPersonChange(index, 'name', e.target.value)}
                          onKeyPress={validateNameInput}
                          className={formErrors[`contactPerson${index}Name`] ? 'error' : ''}
                        />
                        {formErrors[`contactPerson${index}Name`] && (
                          <span className="error-message">{formErrors[`contactPerson${index}Name`]}</span>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Contact Person {index + 1} - Phone * (10 digits)</label>
                        <input
                          type="tel"
                          placeholder="0771234567"
                          value={cp.phone}
                          onChange={(e) => handleContactPersonChange(index, 'phone', e.target.value)}
                          onKeyPress={validatePhoneInput}
                          maxLength="10"
                          className={formErrors[`contactPerson${index}Phone`] ? 'error' : ''}
                        />
                        {formErrors[`contactPerson${index}Phone`] && (
                          <span className="error-message">{formErrors[`contactPerson${index}Phone`]}</span>
                        )}
                      </div>
                      {formData.contactPersons.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContactPerson(index)}
                          className="btn-remove-contact"
                          title="Remove Contact Person"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="btn btn-secondary"
                  >
                    + Add Another Contact Person
                  </button>
                )}
              </div>

              {/* Customer Status - Only show when editing */}
              {editingCustomer && (
                <div className="form-section">
                  <h3 className="section-heading">Customer Status</h3>
                  <div className="status-control">
                    <label className="status-checkbox-label">
                      <input 
                        type="checkbox" 
                        name="isActive" 
                        checked={formData.isActive} 
                        onChange={handleChange}
                        className="status-checkbox-input"
                      />
                      <span className="status-checkbox-text">Customer is Active</span>
                    </label>
                    <p className="help-text">
                      {formData.isActive 
                        ? 'This customer can place orders and access services.' 
                        : 'Unchecking this will hide the customer from the active customer list.'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-large">
                  {editingCustomer ? 'Update Customer' : 'Register Customer'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
