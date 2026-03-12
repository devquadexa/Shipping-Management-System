import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/services/customerService';
import '../styles/Customers.css';

function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredOfficeCities, setFilteredOfficeCities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mainPhone: '',
    email: '',
    // Residential Address
    addressNumber: '',
    addressStreet1: '',
    addressStreet2: '',
    addressDistrict: '',
    addressCity: '',
    addressCountry: 'Sri Lanka',
    // Office Address
    officeAddressNumber: '',
    officeAddressStreet1: '',
    officeAddressStreet2: '',
    officeAddressDistrict: '',
    officeAddressCity: '',
    officeAddressCountry: 'Sri Lanka',
    isOfficeAddressSame: false,
    website: '',
    registrationDate: new Date().toISOString().split('T')[0],
    creditPeriodDays: 30,
    contactPersons: [{ name: '', phone: '', email: '', designation: '' }],
    categories: [],
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is Admin, Super Admin, or Manager
  const isAdminOrSuperAdmin = () => {
    return user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager');
  };

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
    fetchDistricts();
    fetchAllCities();
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

  const fetchDistricts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/locations/districts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCities = async (districtId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/locations/cities/${districtId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  const fetchAllCities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/locations/cities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching all cities:', error);
      setCities([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers... User role:', user?.role);
      const data = await customerService.getAll();
      console.log('Customers fetched successfully:', data.length, 'customers');
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.status === 403) {
        setMessage('Access denied. Please contact administrator.');
      } else {
        setMessage('Error loading customers. Please refresh the page.');
      }
      setTimeout(() => setMessage(''), 5000);
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
    if (!formData.addressNumber.trim()) {
      errors.addressNumber = 'Address number is required';
    }
    
    if (!formData.addressStreet1.trim()) {
      errors.addressStreet1 = 'Street name is required';
    }
    
    if (!formData.addressDistrict.trim()) {
      errors.addressDistrict = 'District is required';
    }
    
    if (!formData.addressCity.trim()) {
      errors.addressCity = 'City is required';
    }

    if (!formData.addressCountry.trim()) {
      errors.addressCountry = 'Country is required';
    }

    // Office address validation (if not same as residential)
    if (!formData.isOfficeAddressSame) {
      if (!formData.officeAddressNumber.trim()) {
        errors.officeAddressNumber = 'Office address number is required';
      }
      
      if (!formData.officeAddressStreet1.trim()) {
        errors.officeAddressStreet1 = 'Office street name is required';
      }
      
      if (!formData.officeAddressDistrict.trim()) {
        errors.officeAddressDistrict = 'Office district is required';
      }
      
      if (!formData.officeAddressCity.trim()) {
        errors.officeAddressCity = 'Office city is required';
      }

      if (!formData.officeAddressCountry.trim()) {
        errors.officeAddressCountry = 'Office country is required';
      }
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
        if (cp.name.trim() !== '' || cp.phone.trim() !== '' || cp.email.trim() !== '' || cp.designation.trim() !== '') {
          // If any field has data, name and phone must be valid
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
          
          // Email validation (optional but must be valid if provided)
          if (cp.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp.email)) {
            errors[`contactPerson${index}Email`] = 'Please enter a valid email address';
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
      addressNumber: '',
      addressStreet1: '',
      addressStreet2: '',
      addressDistrict: '',
      addressCity: '',
      addressCountry: 'Sri Lanka',
      officeAddressNumber: '',
      officeAddressStreet1: '',
      officeAddressStreet2: '',
      officeAddressDistrict: '',
      officeAddressCity: '',
      officeAddressCountry: 'Sri Lanka',
      isOfficeAddressSame: false,
      website: '',
      contactPersons: [{ name: '', phone: '' }],
      categories: [],
      isActive: true
    });
    setFormErrors({});
    setEditingCustomer(null);
    setFilteredCities([]);
    setFilteredOfficeCities([]);
  };

  const handleEdit = (customer) => {
    if (!isAdminOrSuperAdmin()) {
      setMessage('Only Admin, Super Admin, or Manager can edit customers');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      mainPhone: customer.mainPhone || '',
      email: customer.email || '',
      addressNumber: customer.addressNumber || '',
      addressStreet1: customer.addressStreet1 || '',
      addressStreet2: customer.addressStreet2 || '',
      addressDistrict: customer.addressDistrict || '',
      addressCity: customer.addressCity || '',
      addressCountry: customer.addressCountry || 'Sri Lanka',
      officeAddressNumber: customer.officeAddressNumber || '',
      officeAddressStreet1: customer.officeAddressStreet1 || '',
      officeAddressStreet2: customer.officeAddressStreet2 || '',
      officeAddressDistrict: customer.officeAddressDistrict || '',
      officeAddressCity: customer.officeAddressCity || '',
      officeAddressCountry: customer.officeAddressCountry || 'Sri Lanka',
      isOfficeAddressSame: customer.isOfficeAddressSame || false,
      website: customer.website || '',
      registrationDate: customer.registrationDate ? new Date(customer.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      creditPeriodDays: customer.creditPeriodDays || 30,
      contactPersons: customer.contactPersons && customer.contactPersons.length > 0 
        ? customer.contactPersons.map(cp => ({ 
            name: cp.name, 
            phone: cp.phone,
            email: cp.email || '',
            designation: cp.designation || ''
          }))
        : [{ name: '', phone: '', email: '', designation: '' }],
      categories: customer.categories ? customer.categories.map(cat => cat.categoryId) : [],
      isActive: customer.isActive !== undefined ? customer.isActive : true
    });
    
    // Set up filtered cities for editing
    if (customer.addressDistrict) {
      handleDistrictChange(customer.addressDistrict, false);
    }
    if (customer.officeAddressDistrict) {
      handleDistrictChange(customer.officeAddressDistrict, true);
    }
    
    setShowModal(true);
  };

  const handleDeactivate = async (customerId) => {
    if (!isAdminOrSuperAdmin()) {
      setMessage('Only Admin, Super Admin, or Manager can deactivate customers');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!window.confirm('Are you sure you want to deactivate this customer?')) {
      return;
    }

    try {
      await customerService.delete(customerId);
      setMessage('Customer deactivated successfully');
      fetchCustomers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deactivating customer:', error);
      setMessage('Failed to deactivate customer');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDistrictChange = (districtName, isOffice = false) => {
    // Find the district to get its ID
    const selectedDistrict = districts.find(d => d.districtName === districtName);
    
    if (selectedDistrict) {
      // Filter cities for this district
      const districtCities = cities.filter(c => c.districtId === selectedDistrict.districtId);
      
      if (isOffice) {
        setFilteredOfficeCities(districtCities);
        setFormData(prev => ({ 
          ...prev, 
          officeAddressDistrict: districtName,
          officeAddressCity: '' // Reset city when district changes
        }));
      } else {
        setFilteredCities(districtCities);
        setFormData(prev => ({ 
          ...prev, 
          addressDistrict: districtName,
          addressCity: '' // Reset city when district changes
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
      
      // Handle district changes
      if (name === 'addressDistrict') {
        handleDistrictChange(value, false);
      } else if (name === 'officeAddressDistrict') {
        handleDistrictChange(value, true);
      }
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
        contactPersons: [...formData.contactPersons, { name: '', phone: '', email: '', designation: '' }]
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

  return (
    <div className="container customers-page">
      <div className="page-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage customer information and registrations</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + New Customer
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
                      <td data-label="Registered">{new Date(customer.registrationDate).toLocaleDateString()}</td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {isAdminOrSuperAdmin() && (
                            <button
                              className="btn-action btn-edit"
                              onClick={() => handleEdit(customer)}
                              title="Edit Customer"
                            >
                              Edit
                            </button>
                          )}
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
                        <td colSpan="6">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4 className="section-title">Address Information</h4>
                              <div className="detail-item-block">
                                <span className="detail-label">Residential Address:</span>
                                <span className="detail-value-block">
                                  {customer.getFormattedResidentialAddress ? customer.getFormattedResidentialAddress() : 
                                   `${customer.addressNumber || ''}, ${customer.addressStreet1 || ''}, ${customer.addressStreet2 ? customer.addressStreet2 + ', ' : ''}${customer.addressDistrict || ''}, ${customer.addressCity || ''}, ${customer.addressCountry || 'Sri Lanka'}`}
                                </span>
                              </div>
                              <div className="detail-item-block">
                                <span className="detail-label">Office Address:</span>
                                <span className="detail-value-block">
                                  {customer.isOfficeAddressSame ? 'Same as residential address' : 
                                   (customer.getFormattedOfficeAddress ? customer.getFormattedOfficeAddress() : 
                                    `${customer.officeAddressNumber || ''}, ${customer.officeAddressStreet1 || ''}, ${customer.officeAddressStreet2 ? customer.officeAddressStreet2 + ', ' : ''}${customer.officeAddressDistrict || ''}, ${customer.officeAddressCity || ''}, ${customer.officeAddressCountry || 'Sri Lanka'}`)}
                                </span>
                              </div>
                              {customer.website && (
                                <div className="detail-item">
                                  <span className="detail-label">Website:</span>
                                  <span className="detail-value">
                                    <a href={customer.website} target="_blank" rel="noopener noreferrer">{customer.website}</a>
                                  </span>
                                </div>
                              )}
                              <div className="detail-item">
                                <span className="detail-label">Credit Period:</span>
                                <span className="detail-value">{customer.creditPeriodDays || 30} days</span>
                              </div>
                            </div>
                            
                            {customer.contactPersons && customer.contactPersons.length > 0 && (
                              <div className="detail-section">
                                <h4 className="section-title">Contact Persons</h4>
                                <div className="contact-persons-list">
                                  {customer.contactPersons.map((cp, idx) => (
                                    <div key={idx} className="contact-person-card">
                                      <div className="contact-person-summary">
                                        <div className="contact-name">{cp.name}</div>
                                        {cp.designation && (
                                          <div className="contact-designation">{cp.designation}</div>
                                        )}
                                      </div>
                                      <div className="contact-person-hover-details">
                                        <div className="contact-detail-row">
                                          <span className="detail-label-small">Phone:</span>
                                          <span className="detail-value-small">{cp.phone}</span>
                                          <button 
                                            className="btn-copy-small" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(cp.phone);
                                              setMessage('Phone number copied!');
                                              setTimeout(() => setMessage(''), 2000);
                                            }}
                                            title="Copy phone number"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                        {cp.email && (
                                          <div className="contact-detail-row">
                                            <span className="detail-label-small">Email:</span>
                                            <span className="detail-value-small">{cp.email}</span>
                                            <button 
                                              className="btn-copy-small" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(cp.email);
                                                setMessage('Email copied!');
                                                setTimeout(() => setMessage(''), 2000);
                                              }}
                                              title="Copy email"
                                            >
                                              Copy
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                            
                            {isAdminOrSuperAdmin() && (
                              <div className="detail-section">
                                <div className="detail-actions">
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => handleDeactivate(customer.customerId)}
                                    title="Deactivate Customer"
                                  >
                                    Deactivate Customer
                                  </button>
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
                    <label>Customer / Company Name <span className="required">*</span></label>
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
                    <label>Main Phone Number <span className="required">*</span> (10 digits)</label>
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
                    <label>Email Address <span className="required">*</span></label>
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

                <div className="form-row">
                  <div className="form-group">
                    <label>Registration Date <span className="required">*</span></label>
                    <input 
                      type="date" 
                      name="registrationDate" 
                      value={formData.registrationDate} 
                      onChange={handleChange}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Credit Period (Days) <span className="required">*</span></label>
                    <input 
                      type="number" 
                      name="creditPeriodDays" 
                      value={formData.creditPeriodDays} 
                      onChange={handleChange}
                      min="1"
                      max="365"
                      placeholder="30"
                      required 
                    />
                    <small className="help-text">Number of days before invoice becomes overdue</small>
                  </div>

                  <div className="form-group">
                    <label>Website</label>
                    <input 
                      type="url" 
                      name="website" 
                      value={formData.website} 
                      onChange={handleChange} 
                      placeholder="https://example.com" 
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="form-section">
                <h3 className="section-heading">Residential Address (Standard Sri Lankan Format)</h3>
                
                {/* Three column row: Address Number, Street Name 1, Street Name 2 */}
                <div className="form-row form-row-three">
                  <div className="form-group">
                    <label>Address Number <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="addressNumber" 
                      value={formData.addressNumber} 
                      onChange={handleChange}
                      className={formErrors.addressNumber ? 'error' : ''}
                      placeholder="e.g., 45, 123/2A"
                      required 
                    />
                    {formErrors.addressNumber && <span className="error-message">{formErrors.addressNumber}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>Street Name 1 <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="addressStreet1" 
                      value={formData.addressStreet1} 
                      onChange={handleChange}
                      className={formErrors.addressStreet1 ? 'error' : ''}
                      placeholder="e.g., Galle Road, Temple Road"
                      required 
                    />
                    {formErrors.addressStreet1 && <span className="error-message">{formErrors.addressStreet1}</span>}
                  </div>

                  <div className="form-group">
                    <label>Street Name 2 (Optional)</label>
                    <input 
                      type="text" 
                      name="addressStreet2" 
                      value={formData.addressStreet2} 
                      onChange={handleChange}
                      placeholder="e.g., Lane 3, Near School"
                    />
                    <small className="help-text">Additional street info</small>
                  </div>
                </div>

                {/* Three column row: District (left), City (right), Country */}
                <div className="form-row form-row-three-address">
                  <div className="form-group">
                    <label>District <span className="required">*</span></label>
                    <select 
                      name="addressDistrict" 
                      value={formData.addressDistrict} 
                      onChange={handleChange}
                      className={formErrors.addressDistrict ? 'error' : ''}
                      required 
                    >
                      <option value="">Select District</option>
                      {districts.map(district => (
                        <option key={district.districtId} value={district.districtName}>
                          {district.districtName}
                        </option>
                      ))}
                    </select>
                    {formErrors.addressDistrict && <span className="error-message">{formErrors.addressDistrict}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label>City/Town <span className="required">*</span></label>
                    <select 
                      name="addressCity" 
                      value={formData.addressCity} 
                      onChange={handleChange}
                      className={formErrors.addressCity ? 'error' : ''}
                      disabled={!formData.addressDistrict}
                      required 
                    >
                      <option value="">Select City</option>
                      {filteredCities.map(city => (
                        <option key={city.cityId} value={city.cityName}>
                          {city.cityName}
                        </option>
                      ))}
                    </select>
                    {formErrors.addressCity && <span className="error-message">{formErrors.addressCity}</span>}
                    {!formData.addressDistrict && <small className="help-text">Select district first</small>}
                  </div>

                  <div className="form-group">
                    <label>Country <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="addressCountry" 
                      value={formData.addressCountry} 
                      onChange={handleChange}
                      className={formErrors.addressCountry ? 'error' : ''}
                      placeholder="Sri Lanka"
                      required 
                    />
                    {formErrors.addressCountry && <span className="error-message">{formErrors.addressCountry}</span>}
                  </div>
                </div>
              </div>

              {/* Office Address Information */}
              <div className="form-section">
                <h3 className="section-heading">Office Address</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="isOfficeAddressSame" 
                        checked={formData.isOfficeAddressSame} 
                        onChange={handleChange}
                      />
                      <span>Office address is same as residential address</span>
                    </label>
                  </div>
                </div>

                {!formData.isOfficeAddressSame && (
                  <>
                    {/* Three column row: Office Address Number, Street Name 1, Street Name 2 */}
                    <div className="form-row form-row-three">
                      <div className="form-group">
                        <label>Office Address Number <span className="required">*</span></label>
                        <input 
                          type="text" 
                          name="officeAddressNumber" 
                          value={formData.officeAddressNumber} 
                          onChange={handleChange}
                          className={formErrors.officeAddressNumber ? 'error' : ''}
                          placeholder="e.g., 45, 123/2A"
                          required={!formData.isOfficeAddressSame}
                        />
                        {formErrors.officeAddressNumber && <span className="error-message">{formErrors.officeAddressNumber}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label>Office Street Name 1 <span className="required">*</span></label>
                        <input 
                          type="text" 
                          name="officeAddressStreet1" 
                          value={formData.officeAddressStreet1} 
                          onChange={handleChange}
                          className={formErrors.officeAddressStreet1 ? 'error' : ''}
                          placeholder="e.g., Galle Road, Temple Road"
                          required={!formData.isOfficeAddressSame}
                        />
                        {formErrors.officeAddressStreet1 && <span className="error-message">{formErrors.officeAddressStreet1}</span>}
                      </div>

                      <div className="form-group">
                        <label>Office Street Name 2 (Optional)</label>
                        <input 
                          type="text" 
                          name="officeAddressStreet2" 
                          value={formData.officeAddressStreet2} 
                          onChange={handleChange}
                          placeholder="e.g., Lane 3, Near School"
                        />
                        <small className="help-text">Additional street info</small>
                      </div>
                    </div>

                    {/* Three column row: Office District (left), City (right), Country */}
                    <div className="form-row form-row-three-address">
                      <div className="form-group">
                        <label>Office District <span className="required">*</span></label>
                        <select 
                          name="officeAddressDistrict" 
                          value={formData.officeAddressDistrict} 
                          onChange={handleChange}
                          className={formErrors.officeAddressDistrict ? 'error' : ''}
                          required={!formData.isOfficeAddressSame}
                        >
                          <option value="">Select District</option>
                          {districts.map(district => (
                            <option key={district.districtId} value={district.districtName}>
                              {district.districtName}
                            </option>
                          ))}
                        </select>
                        {formErrors.officeAddressDistrict && <span className="error-message">{formErrors.officeAddressDistrict}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label>Office City/Town <span className="required">*</span></label>
                        <select 
                          name="officeAddressCity" 
                          value={formData.officeAddressCity} 
                          onChange={handleChange}
                          className={formErrors.officeAddressCity ? 'error' : ''}
                          disabled={!formData.officeAddressDistrict}
                          required={!formData.isOfficeAddressSame}
                        >
                          <option value="">Select City</option>
                          {filteredOfficeCities.map(city => (
                            <option key={city.cityId} value={city.cityName}>
                              {city.cityName}
                            </option>
                          ))}
                        </select>
                        {formErrors.officeAddressCity && <span className="error-message">{formErrors.officeAddressCity}</span>}
                        {!formData.officeAddressDistrict && <small className="help-text">Select district first</small>}
                      </div>

                      <div className="form-group">
                        <label>Office Country <span className="required">*</span></label>
                        <input 
                          type="text" 
                          name="officeAddressCountry" 
                          value={formData.officeAddressCountry} 
                          onChange={handleChange}
                          className={formErrors.officeAddressCountry ? 'error' : ''}
                          placeholder="Sri Lanka"
                          required={!formData.isOfficeAddressSame}
                        />
                        {formErrors.officeAddressCountry && <span className="error-message">{formErrors.officeAddressCountry}</span>}
                      </div>
                    </div>
                  </>
                )}
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
                <h3 className="section-heading">Contact Persons <span className="required">*</span> (At least 1 required, up to 3)</h3>
                {formErrors.contactPersons && (
                  <div className="error-message" style={{ marginBottom: '1rem' }}>
                    {formErrors.contactPersons}
                  </div>
                )}
                {formData.contactPersons.map((cp, index) => (
                  <div key={index} className="contact-person-row">
                    <div className="contact-person-header">
                      <h4>Contact Person {index + 1}</h4>
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
                    <div className="form-row">
                      <div className="form-group">
                        <label>Name <span className="required">*</span></label>
                        <input
                          type="text"
                          placeholder="Full Name"
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
                        <label>Designation</label>
                        <input
                          type="text"
                          placeholder="e.g., Manager, Director"
                          value={cp.designation}
                          onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone <span className="required">*</span> (10 digits)</label>
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
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={cp.email}
                          onChange={(e) => handleContactPersonChange(index, 'email', e.target.value)}
                          className={formErrors[`contactPerson${index}Email`] ? 'error' : ''}
                        />
                        {formErrors[`contactPerson${index}Email`] && (
                          <span className="error-message">{formErrors[`contactPerson${index}Email`]}</span>
                        )}
                      </div>
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
                <button type="submit" className="btn btn-primary">
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
