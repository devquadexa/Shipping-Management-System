import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cashWithdrawalService } from '../api/services/cashWithdrawalService';
import { otherExpenseService } from '../api/services/otherExpenseService';
import '../styles/CashSummaryReport.css';
import API_BASE from '../api/config';

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();

function CashSummaryReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
  // Date filters
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  
  // Data
  const [cashWithdrawals, setCashWithdrawals] = useState([]);
  const [pettyCashAssignments, setPettyCashAssignments] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const hasAccess = () => user && ['Admin', 'Super Admin'].includes(user.role);

  // Summary calculations
  const summary = useMemo(() => {
    const totalWithdrawn = cashWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);
    const totalPettyCash = pettyCashAssignments.reduce((sum, a) => sum + parseFloat(a.assignedAmount || 0), 0);
    const totalExpenses = otherExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const availableBalance = totalWithdrawn - totalPettyCash - totalExpenses;
    
    return {
      totalWithdrawn,
      totalPettyCash,
      totalExpenses,
      availableBalance,
      withdrawalCount: cashWithdrawals.length,
      assignmentCount: pettyCashAssignments.length,
      expenseCount: otherExpenses.length
    };
  }, [cashWithdrawals, pettyCashAssignments, otherExpenses]);

  const fetchData = async () => {
    if (!fromDate || !toDate) {
      setMessage('Please select both From Date and To Date');
      setMessageType('error');
      return;
    }
    
    if (fromDate > toDate) {
      setMessage('From Date must be on or before To Date');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Helper function to compare dates (ignoring time)
      const isDateInRange = (dateStr, fromDateStr, toDateStr) => {
        if (!dateStr) return false;
        
        // Extract just the date part (YYYY-MM-DD)
        const dateOnly = dateStr.split('T')[0];
        return dateOnly >= fromDateStr && dateOnly <= toDateStr;
      };

      // Fetch cash withdrawals
      const withdrawals = await cashWithdrawalService.getAll();
      console.log('All withdrawals:', withdrawals);
      const filteredWithdrawals = withdrawals.filter(w => 
        isDateInRange(w.withdrawalDate, fromDate, toDate)
      );
      console.log('Filtered withdrawals:', filteredWithdrawals);
      setCashWithdrawals(filteredWithdrawals);

      // Fetch petty cash assignments
      const response = await fetch(`${API_BASE}/api/petty-cash-assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const assignments = await response.json();
        console.log('All assignments:', assignments);
        const filteredAssignments = assignments.filter(a => 
          isDateInRange(a.assignedDate, fromDate, toDate)
        );
        console.log('Filtered assignments:', filteredAssignments);
        setPettyCashAssignments(filteredAssignments);
      }

      // Fetch other expenses
      const expenses = await otherExpenseService.getAll();
      console.log('All expenses:', expenses);
      const filteredExpenses = expenses.filter(e => 
        isDateInRange(e.expenseDate, fromDate, toDate)
      );
      console.log('Filtered expenses:', filteredExpenses);
      setOtherExpenses(filteredExpenses);

      setHasSearched(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading report data');
      setMessageType('error');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount || 0).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

  const exportToExcel = async () => {
    try {
      setMessage('Generating Excel...');
      setMessageType('info');
      
      const response = await fetch(
        `${API_BASE}/api/cash-summary/export/excel?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate Excel');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Cash_Summary_Report_${label}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setMessage('Excel downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      setMessage('Error generating Excel');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const exportToPDF = async () => {
    try {
      setMessage('Generating PDF...');
      setMessageType('info');
      
      const response = await fetch(
        `${API_BASE}/api/cash-summary/export/pdf?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Cash_Summary_Report_${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setMessage('PDF downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setMessage('Error generating PDF');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!hasAccess()) {
    return (
      <div className="csr-container">
        <div className="csr-access-denied">
          <div className="csr-access-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Access Restricted</h2>
          <p>Only Super Admin and Admin users can access this report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="csr-container">
      {/* Breadcrumb */}
      <div className="csr-breadcrumb">
        <button className="csr-breadcrumb-back" onClick={() => navigate('/reports')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Reports
        </button>
        <span className="csr-breadcrumb-sep">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        <span className="csr-breadcrumb-current">Cash Summary</span>
      </div>

      {/* Header */}
      <div className="csr-header">
        <div className="csr-header-content">
          <h1 className="csr-title">Cash Summary Report</h1>
          <p className="csr-subtitle">
            Comprehensive cash flow overview with withdrawals, petty cash and expenses
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`csr-alert csr-alert-${messageType}`}>
          {message}
        </div>
      )}

      {/* Filter Panel */}
      <div className="csr-filter-panel">
        <div className="csr-filter-row">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flex: 1 }}>
            <div className="csr-filter-field">
              <label htmlFor="from-date" className="csr-filter-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                From Date
              </label>
              <input
                id="from-date"
                type="date"
                value={fromDate}
                max={toDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="csr-date-input"
              />
            </div>

            <div className="csr-filter-sep">—</div>

            <div className="csr-filter-field">
              <label htmlFor="to-date" className="csr-filter-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                To Date
              </label>
              <input
                id="to-date"
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => setToDate(e.target.value)}
                className="csr-date-input"
              />
            </div>

            <button
              className="csr-generate-btn"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="csr-btn-spinner"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Generate Report
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              className="csr-btn csr-btn-pdf"
              onClick={exportToPDF}
              disabled={!hasSearched || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Export to PDF
            </button>

            <button
              className="csr-btn csr-btn-excel"
              onClick={exportToExcel}
              disabled={!hasSearched || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
              Export to Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {hasSearched && (
        <>
          <div className="csr-summary-grid">
            <div className="csr-summary-card csr-card-blue">
              <div className="csr-summary-icon">💰</div>
              <div className="csr-summary-content">
                <div className="csr-summary-label">Total Cash Withdrawn</div>
                <div className="csr-summary-value">{formatCurrency(summary.totalWithdrawn)}</div>
                <div className="csr-summary-meta">{summary.withdrawalCount} withdrawal{summary.withdrawalCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="csr-summary-card csr-card-purple">
              <div className="csr-summary-icon">📤</div>
              <div className="csr-summary-content">
                <div className="csr-summary-label">Petty Cash Issued</div>
                <div className="csr-summary-value">{formatCurrency(summary.totalPettyCash)}</div>
                <div className="csr-summary-meta">{summary.assignmentCount} assignment{summary.assignmentCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className="csr-summary-card csr-card-amber">
              <div className="csr-summary-icon">💳</div>
              <div className="csr-summary-content">
                <div className="csr-summary-label">Other Expenses</div>
                <div className="csr-summary-value">{formatCurrency(summary.totalExpenses)}</div>
                <div className="csr-summary-meta">{summary.expenseCount} expense{summary.expenseCount !== 1 ? 's' : ''}</div>
              </div>
            </div>

            <div className={`csr-summary-card ${summary.availableBalance >= 0 ? 'csr-card-green' : 'csr-card-red'}`}>
              <div className="csr-summary-icon">{summary.availableBalance >= 0 ? '✅' : '⚠️'}</div>
              <div className="csr-summary-content">
                <div className="csr-summary-label">Available Balance</div>
                <div className="csr-summary-value">{formatCurrency(summary.availableBalance)}</div>
                <div className="csr-summary-meta">
                  {summary.availableBalance >= 0 ? 'Positive balance' : 'Negative balance'}
                </div>
              </div>
            </div>
          </div>

          {/* Cash Withdrawals Section */}
          <div className="csr-section">
            <div className="csr-section-header">
              <h2 className="csr-section-title">Cash Withdrawals ({summary.withdrawalCount})</h2>
            </div>
            <div className="csr-table-wrapper">
              <table className="csr-table">
                <thead>
                  <tr>
                    <th>Withdrawal ID</th>
                    <th>Date</th>
                    <th>Bank Name</th>
                    <th className="csr-text-right">Amount</th>
                    <th>Recorded By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {cashWithdrawals.map(withdrawal => (
                    <tr key={withdrawal.withdrawalId}>
                      <td data-label="Withdrawal ID">
                        <span className="csr-record-id">{withdrawal.withdrawalId}</span>
                      </td>
                      <td data-label="Date">{formatDate(withdrawal.withdrawalDate)}</td>
                      <td data-label="Bank Name">{withdrawal.bankName}</td>
                      <td data-label="Amount" className="csr-amount-cell">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td data-label="Recorded By">{withdrawal.recordedByName || '-'}</td>
                      <td data-label="Notes">{withdrawal.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="csr-total-row">
                    <td colSpan="3"><strong>TOTAL</strong></td>
                    <td className="csr-amount-cell"><strong>{formatCurrency(summary.totalWithdrawn)}</strong></td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Petty Cash Assignments Section */}
          <div className="csr-section">
            <div className="csr-section-header">
              <h2 className="csr-section-title">Petty Cash Issued ({summary.assignmentCount})</h2>
            </div>
            <div className="csr-table-wrapper">
              <table className="csr-table">
                <thead>
                  <tr>
                    <th>Assignment ID</th>
                    <th>Date</th>
                    <th>Job ID</th>
                    <th>Assigned To</th>
                    <th className="csr-text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pettyCashAssignments.map(assignment => (
                    <tr key={assignment.assignmentId}>
                      <td data-label="Assignment ID">
                        <span className="csr-record-id">{assignment.assignmentId}</span>
                      </td>
                      <td data-label="Date">{formatDate(assignment.assignedDate)}</td>
                      <td data-label="Job ID">{assignment.jobId}</td>
                      <td data-label="Assigned To">{assignment.assignedToName || '-'}</td>
                      <td data-label="Amount" className="csr-amount-cell">
                        {formatCurrency(assignment.assignedAmount)}
                      </td>
                      <td data-label="Status">
                        <span className="csr-status-badge">{assignment.status}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="csr-total-row">
                    <td colSpan="4"><strong>TOTAL</strong></td>
                    <td className="csr-amount-cell"><strong>{formatCurrency(summary.totalPettyCash)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Other Expenses Section */}
          <div className="csr-section">
            <div className="csr-section-header">
              <h2 className="csr-section-title">Other Expenses ({summary.expenseCount})</h2>
            </div>
            <div className="csr-table-wrapper">
              <table className="csr-table">
                <thead>
                  <tr>
                    <th>Expense ID</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="csr-text-right">Amount</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {otherExpenses.map(expense => (
                    <tr key={expense.expenseId}>
                      <td data-label="Expense ID">
                        <span className="csr-record-id">{expense.expenseId}</span>
                      </td>
                      <td data-label="Date">{formatDate(expense.expenseDate)}</td>
                      <td data-label="Category">
                        <span className="csr-category-badge">{expense.category}</span>
                      </td>
                      <td data-label="Description">{expense.description}</td>
                      <td data-label="Amount" className="csr-amount-cell">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td data-label="Payment Method">{expense.paymentMethod || '-'}</td>
                    </tr>
                  ))}
                  <tr className="csr-total-row">
                    <td colSpan="4"><strong>TOTAL</strong></td>
                    <td className="csr-amount-cell"><strong>{formatCurrency(summary.totalExpenses)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !hasSearched && (
        <div className="csr-empty-state">
          <div className="csr-empty-icon">📊</div>
          <p className="csr-empty-text">Select date range and click "Generate Report" to view data</p>
        </div>
      )}

      {!loading && hasSearched && cashWithdrawals.length === 0 && pettyCashAssignments.length === 0 && otherExpenses.length === 0 && (
        <div className="csr-empty-state">
          <div className="csr-empty-icon">📊</div>
          <p className="csr-empty-text">No data found for the selected date range</p>
          <p className="csr-empty-hint">Try adjusting your date filters</p>
        </div>
      )}
    </div>
  );
}

export default CashSummaryReport;
