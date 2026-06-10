import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import '../styles/PettyCashReport.css';

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();

function PettyCashReport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(today);
  const [toDate,   setToDate]   = useState(today);
  const [assignments, setAssignments] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);

  const hasAccess = () => user && ['Admin', 'Super Admin'].includes(user.role);

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
      const res = await apiClient.get(
        `/pettycash-assignment/report?fromDate=${fromDate}&toDate=${toDate}`
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setAssignments(data);
      setHasSearched(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setMessage('Error loading report data');
      setMessageType('error');
      setAssignments([]);
      setLoading(false);
    }
  };

  // Summary
  const summary = useMemo(() => {
    const totalAssigned = assignments.reduce((s, a) => s + (parseFloat(a.assignedAmount) || 0), 0);
    const totalSettled  = assignments.reduce((s, a) => s + (parseFloat(a.settledAmount)  || 0), 0);
    // Calculate net balance: positive = money to return, negative = overdue
    const netBalance = assignments.reduce((s, a) => {
      const balance = parseFloat(a.balanceAmount) || 0;
      const overDue = parseFloat(a.overAmount) || 0;
      return s + balance - overDue;
    }, 0);
    return {
      totalAssigned,
      totalSettled,
      totalBalance: totalAssigned - totalSettled,
      netBalance,
      jobCount: new Set(assignments.map(a => a.jobId)).size,
      assignmentCount: assignments.length
    };
  }, [assignments]);

  // Pagination
  const totalPages   = Math.ceil(assignments.length / recordsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return assignments.slice(start, start + recordsPerPage);
  }, [assignments, currentPage, recordsPerPage]);

  const exportToPDF = async () => {
    try {
      setMessage('Generating PDF...');
      setMessageType('info');
      const res = await apiClient.get(
        `/pettycash-assignment/report/export/pdf?fromDate=${fromDate}&toDate=${toDate}`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Petty_Cash_Report_${label}.pdf`);
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
      const res = await apiClient.get(
        `/pettycash-assignment/report/export/excel?fromDate=${fromDate}&toDate=${toDate}`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Petty_Cash_Report_${label}.xlsx`);
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

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    const s = status.trim();
    if (s === 'Settled / Balance Returned' || s === 'Balance Returned') return 'Settled / BR';
    if (s === 'Settled / Over Due Collected' || s === 'Over Due Collected') return 'Settled / OC';
    return s;
  };

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
          <p>Only Super Admin and Admin users can access this report.</p>
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
        <span className="pcr-breadcrumb-current">Petty Cash Report</span>
      </div>

      {/* Header */}
      <div className="pcr-header">
        <div className="pcr-header-content">
          <h1 className="pcr-title">Petty Cash Report</h1>
          <p className="pcr-subtitle">Job-wise petty cash assignment breakdown for a selected date range</p>
        </div>
      </div>

      {/* ── Date Range Filter Panel ── */}
      <div className="pcr-filter-panel">
        <div className="pcr-filter-row">
          <div className="pcr-filter-main">
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

          <div className="pcr-export-buttons">
            <button
              className="pcr-btn pcr-btn-pdf"
              onClick={exportToPDF}
              disabled={!hasSearched || assignments.length === 0}
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
              disabled={!hasSearched || assignments.length === 0}
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
            {messageType === 'error'   && '✕'}
            {messageType === 'info'    && 'ℹ'}
          </span>
          {message}
        </div>
      )}

      {/* Only show results after user has generated */}
      {hasSearched && !loading && (
        <>
          {/* Data Table */}
          <div className="pcr-table-card">
            {assignments.length === 0 ? (
              <div className="pcr-empty">
                <div className="pcr-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                </div>
                <p>No petty cash assignments found for {dateRangeLabel}</p>
              </div>
            ) : (
              <>
                <div className="pcr-table-wrap">
                  <table className="pcr-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Job ID</th>
                        <th>Customer</th>
                        <th>Assigned To</th>
                        <th>Assigned Amount</th>
                        <th>Settled Amount</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Assignment Date</th>
                        <th>Settle Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((a, index) => {
                        const balance  = parseFloat(a.balanceAmount) || 0;
                        const overDue  = parseFloat(a.overAmount)    || 0;
                        const netBalance = balance - overDue; // Positive = to return, Negative = overdue
                        const assignmentCount = parseInt(a.assignmentCount) || 1;
                        const isGrouped = assignmentCount > 1;
                        return (
                          <tr key={a.assignmentId}>
                            <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                            <td><span className="pcr-job-id">{a.jobId}</span></td>
                            <td>{a.customerName || '-'}</td>
                            <td>{a.assignedToName || '-'}</td>
                            <td className="pcr-amount">
                              {formatCurrency(a.assignedAmount)}
                              {isGrouped && <span className="pcr-assignment-count">({assignmentCount})</span>}
                            </td>
                            <td className="pcr-amount pcr-settled">{formatCurrency(a.settledAmount)}</td>
                            <td className={`pcr-amount ${netBalance < 0 ? 'pcr-overdue' : 'pcr-balance'}`}>
                              {netBalance !== 0 ? (
                                netBalance < 0 ? `-${formatCurrency(Math.abs(netBalance))}` : formatCurrency(netBalance)
                              ) : (
                                <span className="pcr-nil">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`pcr-status pcr-status-${(a.status || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                                {formatStatus(a.status)}
                              </span>
                            </td>
                            <td>{formatDate(a.assignmentDate)}</td>
                            <td>{formatDate(a.settlementDate)}</td>
                          </tr>
                        );
                      })}
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
                      Page {currentPage} of {totalPages} &nbsp;·&nbsp; {assignments.length} records
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
          <p>Select a date range and click <strong>Generate Report</strong> to view petty cash assignments.</p>
        </div>
      )}

    </div>
  );
}

export default PettyCashReport;
