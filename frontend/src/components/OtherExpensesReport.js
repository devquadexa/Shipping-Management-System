import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import '../styles/PettyCashReport.css'; // Reuse the same styles

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();

// Predefined categories
const CATEGORIES = [
  'Food & Beverages',
  'Utility Bills',
  'WiFi/Internet',
  'Phone Cards',
  'Office Supplies',
  'Maintenance',
  'Transportation',
  'Other'
];

function OtherExpensesReport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);

  const hasAccess = () => user && ['Admin', 'Super Admin', 'Manager'].includes(user.role);

  const fetchReportData = async () => {
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
    try {
      setLoading(true);
      setMessage('');
      setCurrentPage(1);
      
      const categoryParam = selectedCategory || '';
      
      const res = await apiClient.get(
        `/other-expenses/report/data?fromDate=${fromDate}&toDate=${toDate}&category=${categoryParam}`
      );
      
      // Backend returns { expenses: [], summary: [], totalAmount: 0, totalCount: 0 }
      const data = res.data?.expenses || [];
      setExpenses(data);
      setHasSearched(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setMessage('Error loading report data');
      setMessageType('error');
      setExpenses([]);
      setLoading(false);
    }
  };

  // Summary by category
  const summary = useMemo(() => {
    const byCategory = {};
    let grandTotal = 0;

    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      const amt = parseFloat(exp.amount) || 0;
      if (!byCategory[cat]) {
        byCategory[cat] = 0;
      }
      byCategory[cat] += amt;
      grandTotal += amt;
    });

    return {
      byCategory,
      grandTotal,
      expenseCount: expenses.length
    };
  }, [expenses]);

  // Pagination
  const totalPages = Math.ceil(expenses.length / recordsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return expenses.slice(start, start + recordsPerPage);
  }, [expenses, currentPage, recordsPerPage]);

  const exportToPDF = async () => {
    try {
      setMessage('Generating PDF...');
      setMessageType('info');
      
      const categoryParam = selectedCategory || '';
      
      const res = await apiClient.get(
        `/other-expenses/report/export/pdf?fromDate=${fromDate}&toDate=${toDate}&category=${categoryParam}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Other_Expenses_Report_${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage('PDF downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error generating PDF');
      setMessageType('error');
    }
  };

  const exportToExcel = async () => {
    try {
      setMessage('Generating Excel...');
      setMessageType('info');
      
      const categoryParam = selectedCategory || '';
      
      const res = await apiClient.get(
        `/other-expenses/report/export/excel?fromDate=${fromDate}&toDate=${toDate}&category=${categoryParam}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Other_Expenses_Report_${label}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage('Excel downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error generating Excel');
      setMessageType('error');
    }
  };

  const formatCurrency = (v) =>
    `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)}`;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '-';

  const dateRangeLabel = fromDate === toDate
    ? formatDate(fromDate)
    : `${formatDate(fromDate)} — ${formatDate(toDate)}`;

  if (!hasAccess()) {
    return (
      <div className="pcr-access-denied">
        <div className="pcr-access-denied-content">
          <div className="pcr-access-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Access Denied</h2>
          <p>Only Super Admin, Admin, and Manager users can access this report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pcr-container">

      {/* Breadcrumb */}
      <div className="pcr-breadcrumb">
        <button className="pcr-breadcrumb-back" onClick={() => navigate('/reports')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Reports
        </button>
        <span className="pcr-breadcrumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        <span className="pcr-breadcrumb-current">Other Expenses Report</span>
      </div>

      {/* Header */}
      <div className="pcr-header">
        <div className="pcr-header-content">
          <h1 className="pcr-title">Other Expenses Report</h1>
          <p className="pcr-subtitle">Track and analyze office expenses by category for a selected date range</p>
        </div>
      </div>

      {/* ── Date Range Filter Panel ── */}
      <div className="pcr-filter-panel">
        <div className="pcr-filter-row">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flex: 1 }}>
            <div className="pcr-filter-field">
              <label htmlFor="from-date" className="pcr-filter-label">
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
                onChange={e => setFromDate(e.target.value)}
                className="pcr-date-input"
              />
            </div>

            <div className="pcr-filter-sep">—</div>

            <div className="pcr-filter-field">
              <label htmlFor="to-date" className="pcr-filter-label">
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
                onChange={e => setToDate(e.target.value)}
                className="pcr-date-input"
              />
            </div>

            <div className="pcr-filter-field">
              <label className="pcr-filter-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pcr-date-input"
                style={{ minWidth: '180px' }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              className="pcr-generate-btn"
              onClick={fetchReportData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="pcr-btn-spinner"></div>
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
              className="pcr-btn pcr-btn-pdf"
              onClick={exportToPDF}
              disabled={!hasSearched || expenses.length === 0}
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
              className="pcr-btn pcr-btn-excel"
              onClick={exportToExcel}
              disabled={!hasSearched || expenses.length === 0}
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

      {/* Alert Messages */}
      {message && (
        <div className={`pcr-alert pcr-alert-${messageType}`}>
          <span className="pcr-alert-icon">
            {messageType === 'success' && '✓'}
            {messageType === 'error' && '✕'}
            {messageType === 'info' && 'ℹ'}
          </span>
          {message}
        </div>
      )}

      {/* Only show results after user has generated */}
      {hasSearched && !loading && (
        <>
          {/* Data Table */}
          <div className="pcr-table-card">
            {expenses.length === 0 ? (
              <div className="pcr-empty">
                <div className="pcr-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                    <circle cx="12" cy="14" r="2"></circle>
                  </svg>
                </div>
                <p>No expenses found for {dateRangeLabel}</p>
              </div>
            ) : (
              <>
                <div className="pcr-table-wrap">
                  <table className="pcr-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Expense ID</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Expense Date</th>
                        <th>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((exp, index) => (
                        <tr key={exp.expenseId}>
                          <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                          <td><span className="pcr-job-id">{exp.expenseId}</span></td>
                          <td>
                            <span className={`pcr-status pcr-status-${(exp.category || 'other').toLowerCase().replace(/\s+/g, '-')}`}>
                              {exp.category}
                            </span>
                          </td>
                          <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{exp.description || '-'}</td>
                          <td className="pcr-amount">{formatCurrency(exp.amount)}</td>
                          <td>{formatDate(exp.expenseDate)}</td>
                          <td>{exp.recordedByName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="pcr-pagination">
                    <button
                      className="pcr-pagination-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >← Previous</button>
                    <span className="pcr-pagination-info">
                      Page {currentPage} of {totalPages} &nbsp;·&nbsp; {expenses.length} records
                    </span>
                    <button
                      className="pcr-pagination-btn"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Initial state — nothing generated yet */}
      {!hasSearched && !loading && (
        <div className="pcr-initial-state">
          <div className="pcr-initial-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <line x1="8" y1="14" x2="16" y2="14"></line>
              <line x1="8" y1="18" x2="13" y2="18"></line>
            </svg>
          </div>
          <p>Select a date range and click <strong>Generate Report</strong> to view other expenses.</p>
        </div>
      )}

    </div>
  );
}

export default OtherExpensesReport;
