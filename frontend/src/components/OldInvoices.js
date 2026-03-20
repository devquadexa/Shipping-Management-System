import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/OldInvoices.css';
import API_BASE from '../api/config';

function OldInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    cusdecNumber: '',
    cusdecDate: '',
    invoiceDate: '',
    invoiceNumberSuffix: '',
    totalAmount: '',
    settleDate: ''
  });
  const [paymentData, setPaymentData] = useState({
    paymentAmount: '',
    paymentMethod: 'Cash',
    receivedDate: new Date().toISOString().split('T')[0],
    notes: '',
    chequeNumber: '',
    chequeDate: '',
    chequeAmount: '',
    bankName: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const isAdminOrManager = () => {
    return user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager' || user.role === 'Office Executive');
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (showModal || showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal, showPaymentModal]);

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/old-invoices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching old invoices:', error);
      setMessage('Failed to fetch invoices');
      setInvoices([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(Array.isArray(data) ? data.filter(c => c.isActive) : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const generateInvoiceNumber = (invoiceDate, suffix) => {
    if (!invoiceDate || !suffix) return '';
    const date = new Date(invoiceDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}/${month} - INV${suffix}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount fields with comma formatting
    if (name === 'totalAmount') {
      const numericValue = parseFormattedNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount fields with comma formatting
    if (name === 'paymentAmount' || name === 'chequeAmount') {
      const numericValue = parseFormattedNumber(value);
      setPaymentData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setPaymentData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerId) errors.customerId = 'Customer is required';
    if (!formData.invoiceDate) errors.invoiceDate = 'Invoice date is required';
    if (!formData.invoiceNumberSuffix) errors.invoiceNumberSuffix = 'Invoice number suffix is required';
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      errors.totalAmount = 'Total amount must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Please fix the errors in the form');
      return;
    }

    try {
      const invoiceNumber = generateInvoiceNumber(formData.invoiceDate, formData.invoiceNumberSuffix);
      const totalAmount = parseFloat(formData.totalAmount);
      const balance = totalAmount;
      
      const payload = {
        customerId: formData.customerId,
        cusdecNumber: formData.cusdecNumber || null,
        cusdecDate: formData.cusdecDate || null,
        invoiceDate: formData.invoiceDate,
        invoiceNumber: invoiceNumber,
        totalAmount: totalAmount,
        amountReceived: 0,
        balance: balance,
        status: 'Pending',
        settleDate: formData.settleDate || null,
        daysAfterInvoice: null
      };

      const url = editingInvoice
        ? `${API_BASE}/api/old-invoices/${editingInvoice.oldInvoiceId}`
        : `${API_BASE}/api/old-invoices`;
      
      const method = editingInvoice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage(editingInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
        fetchInvoices();
        handleCloseModal();
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      setMessage('Failed to save invoice');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentData.paymentAmount || parseFloat(paymentData.paymentAmount) <= 0) {
      setMessage('Payment amount must be greater than 0');
      return;
    }

    // Validate cheque fields if payment method is Cheque
    if (paymentData.paymentMethod === 'Cheque') {
      if (!paymentData.chequeNumber) {
        setMessage('Cheque number is required for cheque payments');
        return;
      }
      if (!paymentData.chequeDate) {
        setMessage('Cheque date is required for cheque payments');
        return;
      }
      if (!paymentData.chequeAmount || parseFloat(paymentData.chequeAmount) <= 0) {
        setMessage('Cheque amount must be greater than 0');
        return;
      }
    }

    // Validate bank name if payment method is Bank Transfer
    if (paymentData.paymentMethod === 'Bank Transfer') {
      if (!paymentData.bankName) {
        setMessage('Bank name is required for bank transfer payments');
        return;
      }
    }

    try {
      const payload = {
        paymentAmount: parseFloat(paymentData.paymentAmount),
        paymentMethod: paymentData.paymentMethod,
        receivedDate: paymentData.receivedDate,
        notes: paymentData.notes
      };

      // Add cheque fields if payment method is Cheque
      if (paymentData.paymentMethod === 'Cheque') {
        payload.chequeNumber = paymentData.chequeNumber;
        payload.chequeDate = paymentData.chequeDate;
        payload.chequeAmount = parseFloat(paymentData.chequeAmount);
      }

      // Add bank name if payment method is Bank Transfer
      if (paymentData.paymentMethod === 'Bank Transfer') {
        payload.bankName = paymentData.bankName;
      }

      const response = await fetch(`${API_BASE}/api/old-invoices/${selectedInvoice.oldInvoiceId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage('Payment added successfully');
        fetchInvoices();
        handleClosePaymentModal();
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setMessage('Failed to add payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/old-invoices/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessage('Payment deleted successfully');
        fetchInvoices();
      } else {
        setMessage('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      setMessage('Failed to delete payment');
    }
  };

  const handleDelete = async (oldInvoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/old-invoices/${oldInvoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessage('Invoice deleted successfully');
        fetchInvoices();
      } else {
        setMessage('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setMessage('Failed to delete invoice');
    }
  };

  const handleEdit = (invoice) => {
    const invoiceParts = invoice.invoiceNumber.split(' - INV');
    const suffix = invoiceParts[1] || '';
    
    setEditingInvoice(invoice);
    setFormData({
      customerId: invoice.customerId,
      cusdecNumber: invoice.cusdecNumber || '',
      cusdecDate: invoice.cusdecDate ? invoice.cusdecDate.split('T')[0] : '',
      invoiceDate: invoice.invoiceDate.split('T')[0],
      invoiceNumberSuffix: suffix,
      totalAmount: invoice.totalAmount,
      settleDate: invoice.settleDate ? invoice.settleDate.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingInvoice(null);
    setFormData({
      customerId: '',
      cusdecNumber: '',
      cusdecDate: '',
      invoiceDate: '',
      invoiceNumberSuffix: '',
      totalAmount: '',
      settleDate: ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      paymentAmount: '',
      paymentMethod: 'Cash',
      receivedDate: new Date().toISOString().split('T')[0],
      notes: '',
      chequeNumber: '',
      chequeDate: '',
      chequeAmount: '',
      bankName: ''
    });
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setFormData({
      customerId: '',
      cusdecNumber: '',
      cusdecDate: '',
      invoiceDate: '',
      invoiceNumberSuffix: '',
      totalAmount: '',
      settleDate: ''
    });
    setFormErrors({});
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentData({
      paymentAmount: '',
      paymentMethod: 'Cash',
      receivedDate: new Date().toISOString().split('T')[0],
      notes: '',
      chequeNumber: '',
      chequeDate: '',
      chequeAmount: '',
      bankName: ''
    });
  };

  const toggleRow = (invoiceId) => {
    setExpandedRow(expandedRow === invoiceId ? null : invoiceId);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'LKR 0.00';
    return 'LKR ' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    // Remove any existing commas
    const number = value.toString().replace(/,/g, '');
    // Add commas as thousand separators
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const parseFormattedNumber = (value) => {
    if (!value) return '';
    // Remove commas and return the number
    return value.toString().replace(/,/g, '');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Pending': 'status-badge status-pending',
      'Partially Paid': 'status-badge status-partial',
      'Fully Settled': 'status-badge status-settled'
    };
    return <span className={statusClasses[status] || 'status-badge'}>{status}</span>;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.cusdecNumber && invoice.cusdecNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'All' || invoice.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const selectedCustomer = customers.find(c => c.customerId === formData.customerId);

  return (
    <div className="old-invoices-container">
      <div className="page-header">
        <div className="header-left">
          <h1>Old Invoice Management</h1>
          <p className="subtitle">Historical invoice data entry (Since 2026/1/1)</p>
        </div>
        {isAdminOrManager() && (
          <button className="btn btn-primary" onClick={handleAddNew}>
            <span className="icon">+</span> Add Old Invoice
          </button>
        )}
      </div>

      {message && (
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {message}
          <button className="alert-close" onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by invoice number, customer, or cusdec..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Fully Settled">Fully Settled</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice Number</th>
              <th>Customer</th>
              <th>Cusdec Number</th>
              <th>Invoice Date</th>
              <th>Total Amount</th>
              <th>Amount Received</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Days After Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">No invoices found</td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => (
                <React.Fragment key={invoice.oldInvoiceId}>
                  <tr className={expandedRow === invoice.oldInvoiceId ? 'expanded' : ''}>
                    <td>
                      <button 
                        className="expand-btn" 
                        onClick={() => toggleRow(invoice.oldInvoiceId)}
                        title="View details"
                      >
                        {expandedRow === invoice.oldInvoiceId ? '▼' : '▶'}
                      </button>
                      {invoice.invoiceNumber}
                    </td>
                    <td>{invoice.customerName}</td>
                    <td>{invoice.cusdecNumber || '-'}</td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="amount">{formatCurrency(invoice.amountReceived)}</td>
                    <td className="amount">{formatCurrency(invoice.balance)}</td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>{invoice.daysAfterInvoice || '-'}</td>
                    <td>
                      <div className="action-buttons">
                        {invoice.balance > 0 && isAdminOrManager() && (
                          <button 
                            className="btn btn-sm btn-success" 
                            onClick={() => handleOpenPaymentModal(invoice)}
                            title="Add Payment"
                          >
                            Add Payment
                          </button>
                        )}
                        {isAdminOrManager() && (
                          <>
                            <button 
                              className="btn btn-sm btn-secondary" 
                              onClick={() => handleEdit(invoice)}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleDelete(invoice.oldInvoiceId)}
                              title="Delete"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRow === invoice.oldInvoiceId && (
                    <tr className="expanded-row">
                      <td colSpan="10">
                        <div className="expanded-content">
                          <div className="details-grid">
                            <div className="detail-item">
                              <strong>Customer ID:</strong> {invoice.customerId}
                            </div>
                            <div className="detail-item">
                              <strong>Cusdec Date:</strong> {formatDate(invoice.cusdecDate)}
                            </div>
                            <div className="detail-item">
                              <strong>Settle Date:</strong> {formatDate(invoice.settleDate)}
                            </div>
                            <div className="detail-item">
                              <strong>Created:</strong> {formatDate(invoice.createdAt)}
                            </div>
                          </div>
                          
                          {invoice.payments && invoice.payments.length > 0 && (
                            <div className="payments-section">
                              <h4>Payment History</h4>
                              <table className="payments-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Details</th>
                                    <th>Notes</th>
                                    {isAdminOrManager() && <th>Actions</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {invoice.payments.map(payment => (
                                    <tr key={payment.paymentId}>
                                      <td>{formatDate(payment.receivedDate)}</td>
                                      <td className="amount">{formatCurrency(payment.paymentAmount)}</td>
                                      <td>{payment.paymentMethod}</td>
                                      <td>
                                        {payment.paymentMethod === 'Cheque' && payment.chequeNumber ? (
                                          <div className="cheque-details">
                                            <div><strong>No:</strong> {payment.chequeNumber}</div>
                                            <div><strong>Date:</strong> {formatDate(payment.chequeDate)}</div>
                                            <div><strong>Amount:</strong> {formatCurrency(payment.chequeAmount)}</div>
                                          </div>
                                        ) : payment.paymentMethod === 'Bank Transfer' && payment.bankName ? (
                                          <div className="bank-details">
                                            <strong>Bank:</strong> {payment.bankName}
                                          </div>
                                        ) : '-'}
                                      </td>
                                      <td>{payment.notes || '-'}</td>
                                      {isAdminOrManager() && (
                                        <td>
                                          <button 
                                            className="btn btn-sm btn-danger" 
                                            onClick={() => handleDeletePayment(payment.paymentId)}
                                          >
                                            Delete
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
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

      {/* Add/Edit Invoice Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingInvoice ? 'Edit Old Invoice' : 'Add Old Invoice'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Customer *</label>
                  <select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleInputChange}
                    className={formErrors.customerId ? 'error' : ''}
                    style={{ color: '#333', backgroundColor: '#fff' }}
                    required
                  >
                    <option value="" style={{ color: '#333', backgroundColor: '#fff' }}>Select Customer</option>
                    {customers.map(customer => (
                      <option 
                        key={customer.customerId} 
                        value={customer.customerId}
                        style={{ color: '#333', backgroundColor: '#fff' }}
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.customerId && <span className="error-text">{formErrors.customerId}</span>}
                  {selectedCustomer && (
                    <div className="customer-info">
                      <small>Customer ID: {selectedCustomer.customerId}</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cusdec Number</label>
                  <input
                    type="text"
                    name="cusdecNumber"
                    value={formData.cusdecNumber}
                    onChange={handleInputChange}
                    placeholder="Enter cusdec number"
                  />
                </div>
                <div className="form-group">
                  <label>Cusdec Date</label>
                  <input
                    type="date"
                    name="cusdecDate"
                    value={formData.cusdecDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Invoice Date *</label>
                  <input
                    type="date"
                    name="invoiceDate"
                    value={formData.invoiceDate}
                    onChange={handleInputChange}
                    className={formErrors.invoiceDate ? 'error' : ''}
                    required
                  />
                  {formErrors.invoiceDate && <span className="error-text">{formErrors.invoiceDate}</span>}
                </div>
                <div className="form-group">
                  <label>Invoice Number Suffix *</label>
                  <input
                    type="text"
                    name="invoiceNumberSuffix"
                    value={formData.invoiceNumberSuffix}
                    onChange={handleInputChange}
                    placeholder="e.g., 11959"
                    className={formErrors.invoiceNumberSuffix ? 'error' : ''}
                    required
                  />
                  {formErrors.invoiceNumberSuffix && <span className="error-text">{formErrors.invoiceNumberSuffix}</span>}
                  {formData.invoiceDate && formData.invoiceNumberSuffix && (
                    <div className="invoice-preview">
                      <small>Preview: {generateInvoiceNumber(formData.invoiceDate, formData.invoiceNumberSuffix)}</small>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Amount (LKR) *</label>
                  <input
                    type="text"
                    name="totalAmount"
                    value={formatNumberWithCommas(formData.totalAmount)}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={formErrors.totalAmount ? 'error' : ''}
                    required
                  />
                  {formErrors.totalAmount && <span className="error-text">{formErrors.totalAmount}</span>}
                </div>
                <div className="form-group">
                  <label>Settle Date (if fully settled)</label>
                  <input
                    type="date"
                    name="settleDate"
                    value={formData.settleDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal-overlay" onClick={handleClosePaymentModal}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Payment</h2>
              <button className="modal-close" onClick={handleClosePaymentModal}>×</button>
            </div>
            
            <div className="payment-info">
              <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
              <p><strong>Customer:</strong> {selectedInvoice.customerName}</p>
              <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
            </div>

            <form onSubmit={handleAddPayment} className="modal-form">
              <div className="form-group">
                <label>Payment Amount (LKR) *</label>
                <input
                  type="text"
                  name="paymentAmount"
                  value={formatNumberWithCommas(paymentData.paymentAmount)}
                  onChange={handlePaymentInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={paymentData.paymentMethod}
                  onChange={handlePaymentInputChange}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Conditional Cheque Fields */}
              {paymentData.paymentMethod === 'Cheque' && (
                <>
                  <div className="form-group">
                    <label>Cheque Number *</label>
                    <input
                      type="text"
                      name="chequeNumber"
                      value={paymentData.chequeNumber}
                      onChange={handlePaymentInputChange}
                      placeholder="Enter cheque number"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cheque Date *</label>
                    <input
                      type="date"
                      name="chequeDate"
                      value={paymentData.chequeDate}
                      onChange={handlePaymentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cheque Amount (LKR) *</label>
                    <input
                      type="text"
                      name="chequeAmount"
                      value={formatNumberWithCommas(paymentData.chequeAmount)}
                      onChange={handlePaymentInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </>
              )}

              {/* Conditional Bank Transfer Fields */}
              {paymentData.paymentMethod === 'Bank Transfer' && (
                <div className="form-group">
                  <label>Bank Name *</label>
                  <select
                    name="bankName"
                    value={paymentData.bankName}
                    onChange={handlePaymentInputChange}
                    required
                  >
                    <option value="">Select Bank</option>
                    <option value="Commercial Bank">Commercial Bank</option>
                    <option value="Peoples Bank">Peoples Bank</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Received Date *</label>
                <input
                  type="date"
                  name="receivedDate"
                  value={paymentData.receivedDate}
                  onChange={handlePaymentInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={paymentData.notes}
                  onChange={handlePaymentInputChange}
                  placeholder="Optional notes"
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClosePaymentModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OldInvoices;
