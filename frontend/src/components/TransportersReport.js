import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { jobService } from '../api/services/jobService';
import { transporterService } from '../api/services/transporterService';
import '../styles/TransportersReport.css';

// Get today's date in local timezone (YYYY-MM-DD format)
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = getLocalDateString();

function TransportersReport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [transporterReports, setTransporterReports] = useState([]);
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

      // Fetch all jobs and transporters
      const jobsData = await jobService.getAll();
      const transportersData = await transporterService.getAll();

      const jobs = Array.isArray(jobsData) ? jobsData : [];
      const transporters = Array.isArray(transportersData) ? transportersData : [];

      // Filter jobs by payment date (when transporter cost was paid)
      // Include ALL jobs assigned to transporters, regardless of payment status
      const filteredJobs = jobs.filter(job => {
        const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
        const transporterCostItems = payItems.filter(item => {
          const label = (item?.description || item?.name || '').toLowerCase().trim();
          return label === 'transporter cost';
        });

        if (transporterCostItems.length === 0) return false;

        const item = transporterCostItems[0];
        const paidAmount = parseFloat(item.paidAmount || 0) || 0;
        const totalAmount = parseFloat(item.actualCost || item.amount || item.billingAmount || 0) || 0;
        
        // For unpaid jobs (paidAmount = 0), include them regardless of date filtering
        if (paidAmount === 0 && totalAmount > 0) {
          return true;
        }
        
        // For paid/partially paid jobs, filter by payment date
        let paymentDate = null;
        if (item.paidAt) {
          paymentDate = new Date(item.paidAt);
        } else if (job.transportDeliveryDate) {
          paymentDate = new Date(job.transportDeliveryDate);
        } else if (job.createdDate) {
          paymentDate = new Date(job.createdDate);
        }
        
        // If still no date, don't include it
        if (!paymentDate) {
          return false;
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        return paymentDate >= from && paymentDate <= to;
      });

      // Build transporter reports
      const reports = {};

      filteredJobs.forEach(job => {
        const transporterName = (job?.transporter || '').trim().toLowerCase();
        const transporterId = (job?.transporterId || '').trim().toLowerCase();

        if (!transporterName && !transporterId) return;

        const matchingTransporter = transporters.find(t => {
          const tName = (t?.name || '').trim().toLowerCase();
          const tId = (t?.transporterId || '').trim().toLowerCase();
          return (transporterId && tId === transporterId) || (transporterName && tName === transporterName);
        });

        if (!matchingTransporter) return;

        const key = matchingTransporter.transporterId;
        if (!reports[key]) {
          reports[key] = {
            transporterId: matchingTransporter.transporterId,
            transporterName: matchingTransporter.name,
            mainPhone: matchingTransporter.mainPhone || matchingTransporter.phone,
            email: matchingTransporter.email,
            jobs: [],
            totalCost: 0,
            totalPaid: 0,
            totalBalance: 0,
          };
        }

        // Get transporter cost from job
        const payItems = Array.isArray(job?.payItems) ? job.payItems : [];
        const transporterCostItems = payItems.filter(item => {
          const label = (item?.description || item?.name || '').toLowerCase().trim();
          return label === 'transporter cost';
        });

        if (transporterCostItems.length > 0) {
          const item = transporterCostItems[0];
          const cost = parseFloat(item.actualCost || item.amount || 0) || 0;
          const paid = parseFloat(item.paidAmount || 0) || 0;
          const balance = Math.max(0, cost - paid);

          reports[key].jobs.push({
            jobId: job.jobId,
            category: job.shipmentCategory,
            deliveryDate: job.transportDeliveryDate,
            cost,
            paid,
            balance,
            status: item.paymentStatus || 'Unpaid',
          });

          reports[key].totalCost += cost;
          reports[key].totalPaid += paid;
          reports[key].totalBalance += balance;
        }
      });

      const reportsArray = Object.values(reports).sort((a, b) => 
        a.transporterName.localeCompare(b.transporterName)
      );

      setTransporterReports(reportsArray);
      setHasSearched(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setMessage('Error loading report data');
      setMessageType('error');
      setTransporterReports([]);
      setLoading(false);
    }
  };

  // Summary
  const summary = useMemo(() => {
    const totalCost = transporterReports.reduce((s, r) => s + r.totalCost, 0);
    const totalPaid = transporterReports.reduce((s, r) => s + r.totalPaid, 0);
    const totalBalance = transporterReports.reduce((s, r) => s + r.totalBalance, 0);
    return {
      totalCost,
      totalPaid,
      totalBalance,
      transporterCount: transporterReports.length,
      jobCount: transporterReports.reduce((s, r) => s + r.jobs.length, 0),
    };
  }, [transporterReports]);

  // Pagination
  const totalPages = Math.ceil(transporterReports.length / recordsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * recordsPerPage;
    return transporterReports.slice(start, start + recordsPerPage);
  }, [transporterReports, currentPage, recordsPerPage]);

  const exportToPDF = async () => {
    try {
      setMessage('Generating PDF...');
      setMessageType('info');
      const res = await apiClient.get(
        `/transporters/report/export/pdf?fromDate=${fromDate}&toDate=${toDate}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Transporters_Report_${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage('PDF downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setMessage('Error generating PDF');
      setMessageType('error');
    }
  };

  const exportToExcel = async () => {
    try {
      setMessage('Generating Excel...');
      setMessageType('info');
      const res = await apiClient.get(
        `/transporters/report/export/excel?fromDate=${fromDate}&toDate=${toDate}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
      link.setAttribute('download', `Transporters_Report_${label}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMessage('Excel downloaded successfully');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error generating Excel:', err);
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
      <div className="trr-access-denied">
        <div className="trr-access-denied-content">
          <div className="trr-access-icon">
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
    <div className="trr-container">

      {/* Breadcrumb */}
      <div className="trr-breadcrumb">
        <button className="trr-breadcrumb-back" onClick={() => navigate('/reports')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Reports
        </button>
        <span className="trr-breadcrumb-sep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        <span className="trr-breadcrumb-current">Transporters Report</span>
      </div>

      {/* Header */}
      <div className="trr-header">
        <div className="trr-header-content">
          <h1 className="trr-title">Transporters Report</h1>
          <p className="trr-subtitle">Transporter-wise payment details and job assignments for a selected date range</p>
        </div>
      </div>

      {/* ── Date Range Filter Panel ── */}
      <div className="trr-filter-panel">
        <div className="trr-filter-row">
          <div className="trr-filter-field">
            <label htmlFor="from-date" className="trr-filter-label">
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
              className="trr-date-input"
            />
          </div>

          <div className="trr-filter-sep">—</div>

          <div className="trr-filter-field">
            <label htmlFor="to-date" className="trr-filter-label">
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
              className="trr-date-input"
            />
          </div>

          <button
            className="trr-generate-btn"
            onClick={fetchReportData}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="trr-btn-spinner"></div>
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
      </div>

      {/* Alert Messages */}
      {message && (
        <div className={`trr-alert trr-alert-${messageType}`}>
          <span className="trr-alert-icon">
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
          {/* Summary Cards */}
          <div className="trr-summary-grid">
            <div className="trr-card trr-card-blue">
              <div className="trr-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 18 16 18 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <div className="trr-card-content">
                <div className="trr-card-label">Total Cost</div>
                <div className="trr-card-value">{formatCurrency(summary.totalCost)}</div>
                <div className="trr-card-sub">{summary.jobCount} jobs</div>
              </div>
            </div>

            <div className="trr-card trr-card-green">
              <div className="trr-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="trr-card-content">
                <div className="trr-card-label">Total Paid</div>
                <div className="trr-card-value">{formatCurrency(summary.totalPaid)}</div>
                <div className="trr-card-sub">Completed payments</div>
              </div>
            </div>

            <div className="trr-card trr-card-teal">
              <div className="trr-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="trr-card-content">
                <div className="trr-card-label">Total Balance</div>
                <div className="trr-card-value">{formatCurrency(summary.totalBalance)}</div>
                <div className="trr-card-sub">Pending payment</div>
              </div>
            </div>

            <div className="trr-card trr-card-purple">
              <div className="trr-card-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="trr-card-content">
                <div className="trr-card-label">Transporters</div>
                <div className="trr-card-value">{summary.transporterCount}</div>
                <div className="trr-card-sub">Active transporters</div>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="trr-controls">
            <div className="trr-period-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {dateRangeLabel}
            </div>
            <div className="trr-export-buttons">
              <button
                className="trr-btn trr-btn-pdf"
                onClick={exportToPDF}
                disabled={transporterReports.length === 0}
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
                className="trr-btn trr-btn-excel"
                onClick={exportToExcel}
                disabled={transporterReports.length === 0}
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

          {/* Data Table */}
          <div className="trr-table-card">
            {transporterReports.length === 0 ? (
              <div className="trr-empty">
                <div className="trr-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 18 16 18 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                </div>
                <p>No transporter payments found for {dateRangeLabel}</p>
              </div>
            ) : (
              <>
                <div className="trr-table-wrap">
                  <table className="trr-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Transporter ID</th>
                        <th>Transporter Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Total Cost</th>
                        <th>Total Paid</th>
                        <th>Balance</th>
                        <th>Jobs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((r, index) => (
                        <tr key={r.transporterId}>
                          <td>{(currentPage - 1) * recordsPerPage + index + 1}</td>
                          <td><span className="trr-transporter-id">{r.transporterId}</span></td>
                          <td>{r.transporterName}</td>
                          <td>{r.mainPhone || '-'}</td>
                          <td>{r.email || '-'}</td>
                          <td className="trr-amount">{formatCurrency(r.totalCost)}</td>
                          <td className="trr-amount trr-paid">{formatCurrency(r.totalPaid)}</td>
                          <td className="trr-amount trr-balance">
                            {r.totalBalance > 0 ? formatCurrency(r.totalBalance) : formatCurrency(0)}
                          </td>
                          <td className="trr-jobs-count">{r.jobs.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="trr-pagination">
                    <button
                      className="trr-pagination-btn"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >← Previous</button>
                    <span className="trr-pagination-info">
                      Page {currentPage} of {totalPages} &nbsp;·&nbsp; {transporterReports.length} records
                    </span>
                    <button
                      className="trr-pagination-btn"
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
        <div className="trr-initial-state">
          <div className="trr-initial-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <line x1="8" y1="14" x2="16" y2="14"></line>
              <line x1="8" y1="18" x2="13" y2="18"></line>
            </svg>
          </div>
          <p>Select a date range and click <strong>Generate Report</strong> to view transporter payment details.</p>
        </div>
      )}

    </div>
  );
}

export default TransportersReport;
