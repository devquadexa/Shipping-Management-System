import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountingService } from '../api/services/accountingService';
import '../styles/Accounting.css';

function Accounting() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // summary, jobs, customers

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    try {
      setLoading(true);
      const result = await accountingService.getDashboard();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      setMessage('Error loading accounting data');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  if (user?.role !== 'Super Admin') {
    return (
      <div className="accounting-page">
        <div className="alert alert-error">
          Access Denied: This section is only available to Super Admin
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="accounting-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading accounting data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="accounting-page">
        <div className="alert alert-error">No data available</div>
      </div>
    );
  }

  const { summary, jobFinancials, customerOutstanding } = data;

  return (
    <div className="accounting-page">
      <div className="page-header">
        <div>
          <h1>Accounting Dashboard</h1>
          <p>Detailed financial reports and payment tracking</p>
        </div>
        <button onClick={fetchAccountingData} className="btn btn-secondary">
          Refresh Data
        </button>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button 
            className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Job-wise Details ({jobFinancials.length})
          </button>
          <button 
            className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Customer Outstanding ({customerOutstanding.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-section">
            <div className="card">
              <div className="card-header">
                <h2>Financial Summary</h2>
              </div>
              <div className="card-body">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Jobs:</span>
                    <span className="summary-value">{summary.totalJobs}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Petty Cash Issued:</span>
                    <span className="summary-value">LKR {formatCurrency(summary.totalPettyCashIssued)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Actual Cost:</span>
                    <span className="summary-value">LKR {formatCurrency(summary.totalActualCost)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Billing Amount:</span>
                    <span className="summary-value">LKR {formatCurrency(summary.totalBillingAmount)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Profit:</span>
                    <span className="summary-value profit">LKR {formatCurrency(summary.totalProfit)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Profit Margin:</span>
                    <span className="summary-value">
                      {summary.totalBillingAmount > 0 
                        ? `${((summary.totalProfit / summary.totalBillingAmount) * 100).toFixed(2)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Paid Jobs:</span>
                    <span className="summary-value success">{summary.paidJobsCount}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Unpaid Jobs:</span>
                    <span className="summary-value warning">{summary.unpaidJobsCount}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Overdue Jobs:</span>
                    <span className="summary-value danger">{summary.overdueJobsCount}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Paid:</span>
                    <span className="summary-value success">LKR {formatCurrency(summary.totalPaid)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Outstanding:</span>
                    <span className="summary-value warning">LKR {formatCurrency(summary.totalOutstanding)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Total Overdue:</span>
                    <span className="summary-value danger">LKR {formatCurrency(summary.totalOverdue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-section">
            <div className="card">
              <div className="card-header">
                <h2>Job-wise Financial Details</h2>
              </div>
              <div className="table-container">
                <table className="accounting-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>Customer</th>
                      <th>Open Date</th>
                      <th>Status</th>
                      <th>Petty Cash</th>
                      <th>Actual Cost</th>
                      <th>Billing Amount</th>
                      <th>Profit</th>
                      <th>Payment Status</th>
                      <th>Due Date</th>
                      <th>Overdue Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobFinancials.map(job => (
                      <tr key={job.jobId} className={job.isOverdue ? 'overdue-row' : ''}>
                        <td data-label="Job ID"><strong>{job.jobId}</strong></td>
                        <td data-label="Customer">{job.customerName}</td>
                        <td data-label="Open Date">{formatDate(job.openDate)}</td>
                        <td data-label="Status">
                          <span className={`status-badge status-${job.status.toLowerCase().replace(' ', '-')}`}>
                            {job.status}
                          </span>
                        </td>
                        <td data-label="Petty Cash">LKR {formatCurrency(job.pettyCashIssued)}</td>
                        <td data-label="Actual Cost">LKR {formatCurrency(job.actualCost)}</td>
                        <td data-label="Billing Amount">LKR {formatCurrency(job.billingAmount)}</td>
                        <td data-label="Profit">
                          <span className={job.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                            LKR {formatCurrency(job.profit)}
                          </span>
                        </td>
                        <td data-label="Payment Status">
                          {job.billingAmount > 0 ? (
                            <span className={`payment-badge ${job.isPaid ? 'paid' : job.isOverdue ? 'overdue' : 'pending'}`}>
                              {job.isPaid ? 'Paid' : job.isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          ) : (
                            <span className="payment-badge not-billed">Not Billed</span>
                          )}
                        </td>
                        <td data-label="Due Date">{formatDate(job.dueDate)}</td>
                        <td data-label="Overdue Days">
                          {job.overdueDays > 0 ? (
                            <span className="overdue-days">{job.overdueDays} days</span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="customers-section">
            <div className="card">
              <div className="card-header">
                <h2>Customer-wise Outstanding</h2>
              </div>
              {customerOutstanding.length === 0 ? (
                <div className="empty-state">
                  <p>No outstanding payments. All customers are up to date.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="accounting-table">
                    <thead>
                      <tr>
                        <th>Customer ID</th>
                        <th>Customer Name</th>
                        <th>Credit Period</th>
                        <th>Total Outstanding</th>
                        <th>Overdue Amount</th>
                        <th>Unpaid Jobs</th>
                        <th>Overdue Jobs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerOutstanding
                        .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
                        .map(customer => (
                        <tr key={customer.customerId} className={customer.overdueAmount > 0 ? 'overdue-row' : ''}>
                          <td data-label="Customer ID"><strong>{customer.customerId}</strong></td>
                          <td data-label="Customer Name">{customer.customerName}</td>
                          <td data-label="Credit Period">{customer.creditPeriodDays} days</td>
                          <td data-label="Total Outstanding">
                            <strong>LKR {formatCurrency(customer.totalOutstanding)}</strong>
                          </td>
                          <td data-label="Overdue Amount">
                            {customer.overdueAmount > 0 ? (
                              <span className="overdue-amount">LKR {formatCurrency(customer.overdueAmount)}</span>
                            ) : (
                              <span className="no-overdue">-</span>
                            )}
                          </td>
                          <td data-label="Unpaid Jobs">
                            <span className="badge badge-warning">{customer.unpaidJobsCount}</span>
                          </td>
                          <td data-label="Overdue Jobs">
                            {customer.overdueJobsCount > 0 ? (
                              <span className="badge badge-danger">{customer.overdueJobsCount}</span>
                            ) : (
                              <span className="badge badge-success">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Accounting;
