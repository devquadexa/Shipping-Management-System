import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from './Pagination';
import '../styles/PaymentManagement.css';
import apiClient from '../api/client';

function PaymentManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [bankTransfers, setBankTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('cheques'); // 'cheques', 'bank', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'Cleared', 'Bounced'
  const [expandedPayment, setExpandedPayment] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  // Check if user has access
  const hasAccess = () => {
    return user && (user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Manager');
  };

  useEffect(() => {
    if (hasAccess()) {
      fetchPayments();
    }
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/payments/all');
      const data = response.data;
      
      setPayments(data);
      
      // Separate cheques and bank transfers
      const chequePayments = data.filter(p => p.paymentMethod === 'Cheque');
      const bankPayments = data.filter(p => p.paymentMethod === 'Bank Transfer');
      
      setCheques(chequePayments);
      setBankTransfers(bankPayments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setMessage('Error loading payment data');
      setLoading(false);
    }
  };

  const updateChequeStatus = async (paymentId, status) => {
    try {
      await apiClient.put(`/payments/${paymentId}/status`, { status });

      setMessage(`Payment status updated to ${status}`);
      fetchPayments();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Error updating payment status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0)}`;
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-GB') : '-';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Cleared': return 'status-cleared';
      case 'Pending': return 'status-pending';
      case 'Bounced': return 'status-bounced';
      default: return 'status-pending';
    }
  };

  // Filter payments based on active tab and filters
  const getFilteredPayments = () => {
    let filtered = [];
    
    if (activeTab === 'cheques') {
      filtered = cheques;
    } else if (activeTab === 'bank') {
      filtered = bankTransfers;
    } else {
      filtered = payments;
    }

    // Apply status filter
    if (filterStatus !== 'All') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(p =>
        (p.chequeNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.jobId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  // Pagination logic
  const totalPages = Math.ceil(filteredPayments.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, activeTab]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordsPerPageChange = (newRecordsPerPage) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const chequesTotal = cheques.reduce((sum, p) => sum + (p.amount || 0), 0);
    const chequesCleared = cheques.filter(p => p.status === 'Cleared').reduce((sum, p) => sum + (p.amount || 0), 0);
    const chequesPending = cheques.filter(p => p.status === 'Pending').reduce((sum, p) => sum + (p.amount || 0), 0);
    const chequesBounced = cheques.filter(p => p.status === 'Bounced').reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const bankTotal = bankTransfers.reduce((sum, p) => sum + (p.amount || 0), 0);
    const bankCleared = bankTransfers.filter(p => p.status === 'Cleared').reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      chequesTotal,
      chequesCleared,
      chequesPending,
      chequesBounced,
      bankTotal,
      bankCleared,
      totalReceived: chequesCleared + bankCleared
    };
  };

  const summary = calculateSummary();

  if (!hasAccess()) {
    return (
      <div className="payment-management-container">
        <div className="alert alert-error">
          Access Denied: This section is only available to Admin, Super Admin, and Manager roles.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-management-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-management-container">
      <div className="page-header">
        <div>
          <h1>Payment Management</h1>
          <p>Track cheque and bank transfer payments</p>
        </div>
        <button onClick={fetchPayments} className="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh
        </button>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card summary-card-primary">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Total Cheques</div>
            <div className="summary-value">{formatCurrency(summary.chequesTotal)}</div>
            <div className="summary-detail">
              <span className="detail-cleared">Cleared: {formatCurrency(summary.chequesCleared)}</span>
              <span className="detail-pending">Pending: {formatCurrency(summary.chequesPending)}</span>
            </div>
          </div>
        </div>

        <div className="summary-card summary-card-success">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Bank Transfers</div>
            <div className="summary-value">{formatCurrency(summary.bankTotal)}</div>
            <div className="summary-detail">
              <span className="detail-cleared">Cleared: {formatCurrency(summary.bankCleared)}</span>
            </div>
          </div>
        </div>

        <div className="summary-card summary-card-info">
          <div className="summary-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Total Cleared</div>
            <div className="summary-value">{formatCurrency(summary.totalReceived)}</div>
            <div className="summary-detail">
              <span>Available funds</span>
            </div>
          </div>
        </div>

        {summary.chequesBounced > 0 && (
          <div className="summary-card summary-card-danger">
            <div className="summary-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="summary-content">
              <div className="summary-label">Bounced Cheques</div>
              <div className="summary-value">{formatCurrency(summary.chequesBounced)}</div>
              <div className="summary-detail">
                <span>Requires attention</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs and Filters */}
      <div className="payment-controls">
        <div className="payment-tabs">
          <button
            className={`payment-tab ${activeTab === 'cheques' ? 'active' : ''}`}
            onClick={() => setActiveTab('cheques')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            Cheques ({cheques.length})
          </button>
          <button
            className={`payment-tab ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            Bank Transfers ({bankTransfers.length})
          </button>
          <button
            className={`payment-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Payments ({payments.length})
          </button>
        </div>

        <div className="payment-filters">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search by cheque number, bank, job, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Cleared">Cleared</option>
            <option value="Bounced">Bounced</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card">
        {paginatedPayments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
            </div>
            <p>{searchTerm ? 'No payments found matching your search' : 'No payments recorded yet'}</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment Method</th>
                    <th>{activeTab === 'cheques' ? 'Cheque Number' : 'Bank Name'}</th>
                    <th>Customer</th>
                    <th>Job ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map(payment => (
                    <React.Fragment key={payment.paymentId}>
                      <tr className={expandedPayment === payment.paymentId ? 'expanded' : ''}>
                        <td data-label="Date">{formatDate(payment.paymentDate)}</td>
                        <td data-label="Payment Method">
                          <span className="payment-method-badge">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td data-label={activeTab === 'cheques' ? 'Cheque Number' : 'Bank Name'}>
                          <strong>{payment.chequeNumber || payment.bankName || '-'}</strong>
                        </td>
                        <td data-label="Customer">{payment.customerName}</td>
                        <td data-label="Job ID">
                          <span className="job-id-badge">{payment.jobId}</span>
                        </td>
                        <td data-label="Amount" className="amount-cell">
                          <strong>{formatCurrency(payment.amount)}</strong>
                        </td>
                        <td data-label="Status">
                          <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                            {payment.status || 'Pending'}
                          </span>
                        </td>
                        <td data-label="Actions">
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-view"
                              onClick={() => setExpandedPayment(
                                expandedPayment === payment.paymentId ? null : payment.paymentId
                              )}
                              title="View Details"
                            >
                              {expandedPayment === payment.paymentId ? 'Hide' : 'View'}
                            </button>
                            {payment.status === 'Pending' && (
                              <>
                                <button
                                  className="btn-action btn-success"
                                  onClick={() => updateChequeStatus(payment.paymentId, 'Cleared')}
                                  title="Mark as Cleared"
                                >
                                  Clear
                                </button>
                                {payment.paymentMethod === 'Cheque' && (
                                  <button
                                    className="btn-action btn-danger"
                                    onClick={() => updateChequeStatus(payment.paymentId, 'Bounced')}
                                    title="Mark as Bounced"
                                  >
                                    Bounce
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedPayment === payment.paymentId && (
                        <tr className="expanded-details">
                          <td colSpan="8">
                            <div className="payment-details">
                              <div className="details-grid">
                                <div className="detail-section">
                                  <h4>Payment Information</h4>
                                  <div className="detail-item">
                                    <span className="detail-label">Payment ID:</span>
                                    <span className="detail-value">{payment.paymentId}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Invoice Number:</span>
                                    <span className="detail-value">{payment.invoiceNumber || '-'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Payment Date:</span>
                                    <span className="detail-value">{formatDate(payment.paymentDate)}</span>
                                  </div>
                                  {payment.clearedDate && (
                                    <div className="detail-item">
                                      <span className="detail-label">Cleared Date:</span>
                                      <span className="detail-value">{formatDate(payment.clearedDate)}</span>
                                    </div>
                                  )}
                                </div>

                                {payment.paymentMethod === 'Cheque' && (
                                  <div className="detail-section">
                                    <h4>Cheque Details</h4>
                                    <div className="detail-item">
                                      <span className="detail-label">Cheque Number:</span>
                                      <span className="detail-value"><strong>{payment.chequeNumber}</strong></span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Cheque Date:</span>
                                      <span className="detail-value">{formatDate(payment.chequeDate)}</span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Bank:</span>
                                      <span className="detail-value">{payment.bankName || '-'}</span>
                                    </div>
                                  </div>
                                )}

                                {payment.paymentMethod === 'Bank Transfer' && (
                                  <div className="detail-section">
                                    <h4>Bank Transfer Details</h4>
                                    <div className="detail-item">
                                      <span className="detail-label">Bank Name:</span>
                                      <span className="detail-value"><strong>{payment.bankName}</strong></span>
                                    </div>
                                    <div className="detail-item">
                                      <span className="detail-label">Reference Number:</span>
                                      <span className="detail-value">{payment.referenceNumber || '-'}</span>
                                    </div>
                                  </div>
                                )}

                                <div className="detail-section">
                                  <h4>Job & Customer</h4>
                                  <div className="detail-item">
                                    <span className="detail-label">Job ID:</span>
                                    <span className="detail-value"><strong>{payment.jobId}</strong></span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Customer:</span>
                                    <span className="detail-value">{payment.customerName}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Customer ID:</span>
                                    <span className="detail-value">{payment.customerId}</span>
                                  </div>
                                </div>

                                {payment.notes && (
                                  <div className="detail-section detail-section-full">
                                    <h4>Notes</h4>
                                    <p className="payment-notes">{payment.notes}</p>
                                  </div>
                                )}
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

            {filteredPayments.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={filteredPayments.length}
                recordsPerPage={recordsPerPage}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentManagement;
