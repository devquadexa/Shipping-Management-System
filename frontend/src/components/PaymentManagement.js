import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import Pagination from './Pagination';
import '../styles/PaymentManagement.css';
import apiClient from '../api/client';

function PaymentManagement() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('cheques');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedCheque, setExpandedCheque] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  const hasAccess = () =>
    user && ['Admin', 'Super Admin', 'Manager'].includes(user.role);

  useEffect(() => {
    if (hasAccess()) fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/payments/all');
      setPayments(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setMessage('Error loading payment data');
      setLoading(false);
    }
  };

  const formatCurrency = (v) =>
    `LKR ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0)}`;

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB') : '-';

  const formatCusdecNumberForDisplay = (value) => {
    const rawValue = (value || '').trim();
    if (!rawValue) return '';

    const cleaned = rawValue.replace(/^i\s*-\s*/i, '').trim();
    return cleaned ? `I-${cleaned}` : '';
  };

  // ─── Group cheque payments into cheque records ───────────────────────────
  const chequeGroups = useMemo(() => {
    const chequePayments = payments.filter(p => p.paymentMethod === 'Cheque');
    const map = {};
    chequePayments.forEach(p => {
      const key = p.chequeNumber || p.paymentId;
      if (!map[key]) {
        map[key] = {
          chequeNumber: p.chequeNumber,
          chequeDate: p.chequeDate,
          paymentDate: p.paymentDate,
          chequeAmount: parseFloat(p.chequeAmount) || 0,
          bankName: p.bankName,
          customerName: p.customerName,
          customerId: p.customerId,
          status: p.status,
          invoices: [],
        };
      }
      map[key].invoices.push(p);
      if (parseFloat(p.chequeAmount) > map[key].chequeAmount) {
        map[key].chequeAmount = parseFloat(p.chequeAmount);
      }
      if (p.paymentDate && (!map[key].paymentDate || new Date(p.paymentDate) < new Date(map[key].paymentDate))) {
        map[key].paymentDate = p.paymentDate;
      }
    });
    return Object.values(map)
      .map(g => ({
        ...g,
        totalAllocated: g.invoices.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        remainingBalance: g.chequeAmount - g.invoices.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
      }))
      .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0));
  }, [payments]);

  const bankTransfers = useMemo(
    () => payments
      .filter(p => p.paymentMethod === 'Bank Transfer')
      .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0)),
    [payments]
  );

  // ─── Cash payments ────────────────────────────────────────────────────────
  const cashPayments = useMemo(
    () => payments
      .filter(p => p.paymentMethod === 'Cash')
      .sort((a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0)),
    [payments]
  );

  // ─── Summary stats ────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalChequeAmount = chequeGroups.reduce((s, g) => s + g.chequeAmount, 0);
    const clearedCheques = chequeGroups.filter(g => g.status === 'Cleared');
    const pendingCheques = chequeGroups.filter(g => g.status === 'Pending');
    const bouncedCheques = chequeGroups.filter(g => g.status === 'Bounced');
    const bankTotal = bankTransfers.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const bankCleared = bankTransfers.filter(p => p.status === 'Cleared').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const cashTotal = cashPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    return {
      totalChequeAmount,
      chequeCount: chequeGroups.length,
      clearedCount: clearedCheques.length,
      clearedAmount: clearedCheques.reduce((s, g) => s + g.chequeAmount, 0),
      pendingCount: pendingCheques.length,
      pendingAmount: pendingCheques.reduce((s, g) => s + g.chequeAmount, 0),
      bouncedCount: bouncedCheques.length,
      bouncedAmount: bouncedCheques.reduce((s, g) => s + g.chequeAmount, 0),
      bankTotal,
      bankCleared,
      cashTotal,
      cashCount: cashPayments.length,
    };
  }, [chequeGroups, bankTransfers, cashPayments]);

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filteredCheques = useMemo(() => {
    let list = chequeGroups;
    if (filterStatus !== 'All') list = list.filter(g => g.status === filterStatus);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(g =>
        (g.chequeNumber || '').toLowerCase().includes(q) ||
        (g.customerName || '').toLowerCase().includes(q) ||
        (g.bankName || '').toLowerCase().includes(q) ||
        g.invoices.some(p => (p.jobId || '').toLowerCase().includes(q) || (p.invoiceNumber || '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [chequeGroups, filterStatus, searchTerm]);

  const filteredBankTransfers = useMemo(() => {
    let list = bankTransfers;
    if (filterStatus !== 'All') list = list.filter(p => p.status === filterStatus);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.bankName || '').toLowerCase().includes(q) ||
        (p.customerName || '').toLowerCase().includes(q) ||
        (p.jobId || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [bankTransfers, filterStatus, searchTerm]);

  const filteredCashPayments = useMemo(() => {
    let list = cashPayments;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p =>
        (p.customerName || '').toLowerCase().includes(q) ||
        (p.jobId || '').toLowerCase().includes(q) ||
        (p.invoiceNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [cashPayments, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterStatus, activeTab]);

  // ─── Update cheque status (all invoices under same cheque) ────────────────
  const updateChequeStatus = async (chequeNumber, status) => {
    try {
      await apiClient.put(`/payments/cheque/${chequeNumber}/status`, { status });
      setMessage(`Cheque ${chequeNumber} marked as ${status}`);
      fetchPayments();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating cheque status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      await apiClient.put(`/payments/${paymentId}/status`, { status });
      setMessage(`Payment status updated to ${status}`);
      fetchPayments();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error updating status');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // ─── Pagination ───────────────────────────────────────────────────────────
  const activeList = activeTab === 'cheques'
    ? filteredCheques
    : activeTab === 'bank'
      ? filteredBankTransfers
      : filteredCashPayments;
  const totalPages = Math.ceil(activeList.length / recordsPerPage);
  const paginatedList = activeList.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  if (!hasAccess()) {
    return (
      <div className="payment-management-container">
        <div className="alert alert-error">Access Denied: Admin, Super Admin, or Manager only.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-management-container">
        <div className="loading-state"><div className="spinner"></div><p>Loading payment data...</p></div>
      </div>
    );
  }

  return (
    <div className="payment-management-container">

      {/* ── Header ── */}
      <div className="pm-header">
        <div>
          <h1 className="pm-title">Payment Management</h1>
          <p className="pm-subtitle">Track cheques, bank transfers and cash payments linked to invoices</p>
        </div>
        <button onClick={fetchPayments} className="pm-refresh-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {message && (
        <div className={`pm-alert ${message.includes('Error') ? 'pm-alert-error' : 'pm-alert-success'}`}>
          {message}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="pm-controls">
        <div className="pm-tabs">
          <button className={`pm-tab ${activeTab === 'cheques' ? 'active' : ''}`} onClick={() => setActiveTab('cheques')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Cheques <span className="pm-tab-count">{chequeGroups.length}</span>
          </button>
          <button className={`pm-tab ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Bank Transfers <span className="pm-tab-count">{bankTransfers.length}</span>
          </button>
          <button className={`pm-tab ${activeTab === 'cash' ? 'active' : ''}`} onClick={() => setActiveTab('cash')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
            Cash <span className="pm-tab-count">{cashPayments.length}</span>
          </button>
        </div>

        <div className="pm-filters">
          <div className="pm-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={
                activeTab === 'cheques' ? 'Search cheque no., customer, job...' :
                activeTab === 'bank'    ? 'Search bank, customer, job...' :
                                         'Search customer, job, invoice...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab !== 'cash' && (
            <select className="pm-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Cleared">Cleared / Deposited</option>
              <option value="Bounced">Bounced</option>
            </select>
          )}
        </div>
      </div>

      {/* ── Cheques Table ── */}
      {activeTab === 'cheques' && (
        <div className="pm-table-card">
          {paginatedList.length === 0 ? (
            <div className="pm-empty">
              <div className="pm-empty-icon">📋</div>
              <p>{searchTerm ? 'No cheques match your search' : 'No cheque payments recorded yet'}</p>
            </div>
          ) : (
            <>
              <div className="pm-table-wrap">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Cheque No.</th>
                      <th>Cheque Date</th>
                      <th>Customer</th>
                      <th>Cheque Amount</th>
                      <th>Allocated</th>
                      <th>Balance</th>
                      <th>Jobs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map((group) => (
                      <React.Fragment key={group.chequeNumber}>
                        <tr className={expandedCheque === group.chequeNumber ? 'pm-row-expanded' : ''}>
                          <td data-label="Cheque No.">
                            <span className="pm-cheque-num">{group.chequeNumber || '-'}</span>
                          </td>
                          <td data-label="Cheque Date">{formatDate(group.chequeDate)}</td>
                          <td data-label="Customer">
                            <div className="pm-customer-name">{group.customerName || '-'}</div>
                            <div className="pm-customer-id">{group.customerId}</div>
                          </td>
                          <td data-label="Cheque Amount">
                            <span className="pm-amount-cheque">{formatCurrency(group.chequeAmount)}</span>
                          </td>
                          <td data-label="Allocated">
                            <span className="pm-amount-allocated">{formatCurrency(group.totalAllocated)}</span>
                          </td>
                          <td data-label="Balance">
                            <span className={`pm-amount-balance ${group.remainingBalance < 0 ? 'negative' : group.remainingBalance === 0 ? 'zero' : ''}`}>
                              {formatCurrency(group.remainingBalance)}
                            </span>
                          </td>
                          <td data-label="Jobs">
                            <span className="pm-job-count">{group.invoices.length} job{group.invoices.length !== 1 ? 's' : ''}</span>
                          </td>
                          <td data-label="Actions">
                            <div className="pm-actions">
                              <button
                                className="pm-btn pm-btn-view"
                                onClick={() => setExpandedCheque(expandedCheque === group.chequeNumber ? null : group.chequeNumber)}
                              >
                                {expandedCheque === group.chequeNumber ? 'Hide' : 'View'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ── Expanded Cheque Detail ── */}
                        {expandedCheque === group.chequeNumber && (
                          <tr className="pm-detail-row">
                            <td colSpan="8">
                              <div className="pm-detail-panel">
                                <div className="pm-invoices-section">
                                  <div className="pm-detail-section-title">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    Invoices Covered by This Cheque ({group.invoices.length})
                                  </div>

                                  {/* Header row */}
                                  <div className="pm-inv-header">
                                    <div className="pm-inv-col pm-inv-num">#</div>
                                    <div className="pm-inv-col pm-inv-job">Job ID / CUSDEC Number</div>
                                    <div className="pm-inv-col pm-inv-invoice">Invoice No.</div>
                                    <div className="pm-inv-col pm-inv-amount-col">Invoice Amount</div>
                                    <div className="pm-inv-col pm-inv-date">Payment Date</div>
                                  </div>

                                  {/* Data rows */}
                                  <div className="pm-inv-body">
                                    {group.invoices.map((inv, i) => (
                                      <div key={i} className="pm-inv-row">
                                        <div className="pm-inv-col pm-inv-num pm-inv-num-val">{i + 1}</div>
                                        <div className="pm-inv-col pm-inv-job">
                                          {inv.cusdecNumber && inv.cusdecNumber.trim() ? (
                                            <span className="pm-job-cusdec-combined">{inv.jobId || '-'} / {formatCusdecNumberForDisplay(inv.cusdecNumber)}</span>
                                          ) : (
                                            <span className="pm-job-badge">{inv.jobId}</span>
                                          )}
                                        </div>
                                        <div className="pm-inv-col pm-inv-invoice">
                                          {inv.invoiceNumber || <span style={{color:'#9ca3af'}}>—</span>}
                                        </div>
                                        <div className="pm-inv-col pm-inv-amount-col pm-inv-amount-val">
                                          LKR {new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(inv.amount||0)}
                                        </div>
                                        <div className="pm-inv-col pm-inv-date">{formatDate(inv.paymentDate)}</div>
                                      </div>
                                    ))}

                                    {/* Total row */}
                                    <div className="pm-inv-row pm-inv-total-row">
                                      <div className="pm-inv-col pm-inv-num"></div>
                                      <div className="pm-inv-col pm-inv-job pm-inv-total-label">Total Allocated</div>
                                      <div className="pm-inv-col pm-inv-invoice"></div>
                                      <div className="pm-inv-col pm-inv-amount-col pm-inv-amount-val">
                                        LKR {new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(group.totalAllocated||0)}
                                      </div>
                                      <div className="pm-inv-col pm-inv-date"></div>
                                    </div>
                                  </div>

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
              {activeList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={activeList.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={p => setCurrentPage(p)}
                  onRecordsPerPageChange={n => { setRecordsPerPage(n); setCurrentPage(1); }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── Bank Transfers Table ── */}
      {activeTab === 'bank' && (
        <div className="pm-table-card">
          {paginatedList.length === 0 ? (
            <div className="pm-empty">
              <div className="pm-empty-icon">🏦</div>
              <p>{searchTerm ? 'No transfers match your search' : 'No bank transfer payments recorded yet'}</p>
            </div>
          ) : (
            <>
              <div className="pm-table-wrap">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Bank</th>
                      <th>Job ID</th>
                      <th>Invoice No.</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map(p => (
                      <tr key={p.paymentId}>
                        <td data-label="Date">{formatDate(p.paymentDate)}</td>
                        <td data-label="Customer">
                          <div className="pm-customer-name">{p.customerName || '-'}</div>
                        </td>
                        <td data-label="Bank">{p.bankName || '-'}</td>
                        <td data-label="Job ID"><span className="pm-job-badge">{p.jobId}</span></td>
                        <td data-label="Invoice No.">{p.invoiceNumber || '-'}</td>
                        <td data-label="Amount"><span className="pm-amount-cheque">{formatCurrency(p.amount)}</span></td>
                        <td data-label="Status">
                          <span className={`pm-status pm-status-${(p.status || 'pending').toLowerCase()}`}>{p.status || 'Pending'}</span>
                        </td>
                        <td data-label="Actions">
                          <div className="pm-actions">
                            {p.status === 'Pending' && (
                              <button className="pm-btn pm-btn-clear" onClick={() => updatePaymentStatus(p.paymentId, 'Cleared')}>
                                Confirm
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activeList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={activeList.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={p => setCurrentPage(p)}
                  onRecordsPerPageChange={n => { setRecordsPerPage(n); setCurrentPage(1); }}
                />
              )}
            </>
          )}
        </div>
      )}
      {/* ── Cash Payments Table ── */}
      {activeTab === 'cash' && (
        <div className="pm-table-card">
          {paginatedList.length === 0 ? (
            <div className="pm-empty">
              <div className="pm-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p>{searchTerm ? 'No cash payments match your search' : 'No cash payments recorded yet'}</p>
            </div>
          ) : (
            <>
              <div className="pm-table-wrap">
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Job ID</th>
                      <th>Invoice No.</th>
                      <th>Amount</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedList.map(p => (
                      <tr key={p.paymentId}>
                        <td data-label="Date">{formatDate(p.paymentDate)}</td>
                        <td data-label="Customer">
                          <div className="pm-customer-name">{p.customerName || '-'}</div>
                          <div className="pm-customer-id">{p.customerId}</div>
                        </td>
                        <td data-label="Job ID">
                          {p.cusdecNumber && p.cusdecNumber.trim() ? (
                            <span className="pm-job-cusdec-combined">{p.jobId} / {formatCusdecNumberForDisplay(p.cusdecNumber)}</span>
                          ) : (
                            <span className="pm-job-badge">{p.jobId}</span>
                          )}
                        </td>
                        <td data-label="Invoice No.">{p.invoiceNumber || '-'}</td>
                        <td data-label="Amount">
                          <span className="pm-amount-cheque">{formatCurrency(p.amount)}</span>
                        </td>
                        <td data-label="Notes">
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>{p.notes || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activeList.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={activeList.length}
                  recordsPerPage={recordsPerPage}
                  onPageChange={p => setCurrentPage(p)}
                  onRecordsPerPageChange={n => { setRecordsPerPage(n); setCurrentPage(1); }}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;
