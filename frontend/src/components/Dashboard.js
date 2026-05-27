import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/services/customerService';
import { jobService } from '../api/services/jobService';
import { billingService } from '../api/services/billingService';
import { pettyCashService } from '../api/services/pettyCashService';
import { accountingService } from '../api/services/accountingService';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalJobs: 0,
    openJobs: 0,
    inTransitJobs: 0,
    closedJobs: 0,
    totalBills: 0,
    unpaidBills: 0,
    paidBills: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    pettyCashBalance: 0,
    userPettyCash: 0,
    mainAccountBalance: 0,
    pettyCashIssued: 0,
    uncollectedCash: 0,
    conversionRate: 0
  });
  const [accountingData, setAccountingData] = useState(null);

  const getDateRange = useCallback(() => {
    const now = new Date();
    // End of today (inclusive)
    const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
    switch (timePeriod) {
      case 'today': {
        const s = new Date(now); s.setHours(0, 0, 0, 0);
        return { startDate: s, endDate: dayEnd };
      }
      // Last 7 days (including today)
      case 'week': {
        const s = new Date(now); s.setDate(now.getDate() - 6); s.setHours(0, 0, 0, 0);
        return { startDate: s, endDate: dayEnd };
      }
      // Last 30 days (including today)
      case 'month': {
        const s = new Date(now); s.setDate(now.getDate() - 29); s.setHours(0, 0, 0, 0);
        return { startDate: s, endDate: dayEnd };
      }
      // Last 12 months (approx - include today)
      case 'year': {
        const s = new Date(now); s.setFullYear(now.getFullYear() - 1); s.setHours(0, 0, 0, 0);
        return { startDate: s, endDate: dayEnd };
      }
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          return {
            startDate: new Date(new Date(customDateRange.startDate).setHours(0, 0, 0, 0)),
            endDate: new Date(customDateRange.endDate + 'T23:59:59')
          };
        }
        return null;
      default:
        return null;
    }
  }, [timePeriod, customDateRange]);

  const filterByDate = useCallback((items, field) => {
    const range = getDateRange();
    if (!range || !items) return items;
    return items.filter(item => {
      if (!item) return false;
      // Try the requested field first, then common fallbacks
      const raw = item[field] || item.billDate || item.createdDate || item.createdAt || item.openDate || item.openedDate;
      if (!raw) return false;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return false;
      return d >= range.startDate && d <= range.endDate;
    });
  }, [getDateRange]);

  const fetchStats = useCallback(async () => {
    try {
      let pettyCashData = { balance: 0 };
      if (['Super Admin', 'Admin', 'Manager', 'Office Executive'].includes(user?.role)) {
        pettyCashData = await pettyCashService.getBalance();
      } else if (user?.role === 'Waff Clerk') {
        pettyCashData = await pettyCashService.getUserAssignedBalance();
      }

      const [customers, jobs, bills] = await Promise.all([
        user?.role !== 'Waff Clerk' ? customerService.getAll() : Promise.resolve([]),
        jobService.getAll(),
        user?.role !== 'Waff Clerk' ? billingService.getBills() : Promise.resolve([])
      ]);

      const fCustomers = timePeriod === 'all' ? customers : filterByDate(customers, 'registrationDate');
      const fJobs      = timePeriod === 'all' ? jobs      : filterByDate(jobs, 'createdDate');
      const fBills     = timePeriod === 'all' ? bills     : filterByDate(bills, 'billDate');

      const paidBills    = fBills.filter(b => b.paymentStatus === 'Paid' || b.paymentStatus === 'Partially Paid');
      const unpaidBills  = fBills.filter(b => b.paymentStatus === 'Unpaid' || b.paymentStatus === 'Partially Paid');

      // Use server-side Bill fields where available. Prefer paidAmount/remainingAmount, then netTotal, then total/billingAmount.
      const billValue = (b) => {
        const val = parseFloat(b.paidAmount ?? b.remainingAmount ?? b.netTotal ?? b.total ?? b.billingAmount ?? 0);
        return Number.isNaN(val) ? 0 : val;
      };

      const totalRevenue   = paidBills.reduce((s, b) => s + (parseFloat(b.paidAmount) || parseFloat(b.netTotal) || parseFloat(b.total) || parseFloat(b.billingAmount) || 0), 0);
      const pendingRevenue = unpaidBills.reduce((s, b) => s + (parseFloat(b.remainingAmount) || parseFloat(b.netTotal) || parseFloat(b.total) || parseFloat(b.billingAmount) || 0), 0);
      const conversionRate = fBills.length > 0 ? Math.round((paidBills.length / fBills.length) * 100) : 0;

      // Calculate petty cash issued from jobs in the filtered period
      const pettyCashIssuedFiltered = fJobs.reduce((s, j) => s + parseFloat(j.pettyCashAmount || 0), 0);

      setStats({
        totalCustomers:   fCustomers.length,
        totalJobs:        fJobs.length,
        openJobs:         fJobs.filter(j => j.status === 'Open').length,
        inTransitJobs:    fJobs.filter(j => j.status === 'In Transit').length,
        closedJobs:       fJobs.filter(j => j.status === 'Completed').length,
        totalBills:       fBills.length,
        unpaidBills:      unpaidBills.length,
        paidBills:        paidBills.length,
        totalRevenue,
        pendingRevenue,
        pettyCashBalance: pettyCashData.balance,
        userPettyCash:    pettyCashData.balance,
        mainAccountBalance: 0,
        pettyCashIssued:  pettyCashIssuedFiltered,
        uncollectedCash:  pendingRevenue,
        conversionRate
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [user, timePeriod, filterByDate]);

  const fetchAccountingData = useCallback(async () => {
    try {
      const data = await accountingService.getDashboard();
      setAccountingData(data);
    } catch (err) {
      console.error('Error fetching accounting data:', err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    if (user?.role === 'Super Admin' || user?.role === 'Admin') fetchAccountingData();
  }, [fetchStats, fetchAccountingData, user]);

  const fmt = (amount) =>
    'LKR ' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fmtShort = (amount) => {
    const n = parseFloat(amount || 0);
    if (n >= 1000000) return 'LKR ' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return 'LKR ' + (n / 1000).toFixed(1) + 'K';
    return 'LKR ' + n.toFixed(2);
  };

  const periods = [
    { key: 'all',    label: 'All Time' },
    { key: 'today',  label: 'Today' },
    { key: 'week',   label: 'Last 7 Days' },
    { key: 'month',  label: 'Last 30 Days' },
    { key: 'year',   label: 'Last 12 Months' },
    { key: 'custom', label: 'Custom' },
  ];

  const handlePeriodChange = (key) => {
    setTimePeriod(key);
    if (key !== 'custom') setCustomDateRange({ startDate: '', endDate: '' });
  };

  // Use accounting data ONLY when "All Time" is selected (it's always all-time data)
  // When a period filter is active, always use the date-filtered `stats`
  const useAccounting = accountingData && timePeriod === 'all';

  const totalRevenue    = useAccounting ? accountingData.summary.totalBillingAmount  : (stats.totalRevenue + stats.pendingRevenue);
  const collectedRev    = useAccounting ? accountingData.summary.totalPaid           : stats.totalRevenue;
  const outstandingRev  = useAccounting ? accountingData.summary.totalOutstanding    : stats.pendingRevenue;
  const overdueRev      = useAccounting ? accountingData.summary.totalOverdue        : 0;
  const netProfit       = useAccounting ? accountingData.summary.totalProfit         : stats.totalRevenue;
  const profitMargin    = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const totalJobsAcc    = useAccounting ? accountingData.summary.totalJobs           : stats.totalJobs;
  const paidJobsCount   = useAccounting ? accountingData.summary.paidJobsCount       : stats.paidBills;
  const unpaidJobsCount = useAccounting ? accountingData.summary.unpaidJobsCount     : stats.unpaidBills;
  const overdueCount    = useAccounting ? accountingData.summary.overdueJobsCount    : 0;
  // Petty cash issued: use filtered stats value (calculated from jobs in period)
  const pettyCashIssued = useAccounting ? accountingData.summary.totalPettyCashIssued : stats.pettyCashIssued;

  /* ── SUPER ADMIN / ADMIN ── */
  if (user?.role === 'Super Admin' || user?.role === 'Admin') {
    return (
      <div className="db-page">

        {/* ── Page Header ── */}
        <div className="db-header">
          <h1 className="db-title">Dashboard</h1>
          <span className="db-welcome">Welcome back, {user?.fullName} — Super Shine Cargo Service</span>
        </div>

        {/* ── Period Filter ── */}
        <div className="db-filter-card">
          <span className="db-filter-label">FILTER BY PERIOD</span>
          <div className="db-filter-pills">
            {periods.map(p => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={timePeriod === p.key ? 'db-pill db-pill--active' : 'db-pill'}
              >
                {p.label}
              </button>
            ))}
          </div>
          {timePeriod === 'custom' && (
            <div className="db-custom-dates">
              <div>
                <label>Start Date</label>
                <input type="date" value={customDateRange.startDate}
                  onChange={e => setCustomDateRange(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div>
                <label>End Date</label>
                <input type="date" value={customDateRange.endDate}
                  onChange={e => setCustomDateRange(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
          )}
        </div>

        {/* ── Main Two-Column Grid ── */}
        <div className="db-main-grid">

          {/* ── LEFT: Revenue Performance ── */}
          <div className="db-card">
            <h2 className="db-card-title">
              REVENUE PERFORMANCE
              {timePeriod !== 'all' && (
                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#6b7280', marginLeft: '0.75rem', textTransform: 'none', letterSpacing: 0 }}>
                  — {periods.find(p => p.key === timePeriod)?.label}
                </span>
              )}
            </h2>

            {/* Top 3 revenue tiles */}
            <div className="db-rev-top">
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--blue">LKR</span>
                  <span className="db-rev-tile-label">Total Revenue ({timePeriod === 'all' ? 'All-Time' : periods.find(p => p.key === timePeriod)?.label})</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(totalRevenue)}</div>
                <div className="db-rev-tile-sub">{totalJobsAcc} jobs</div>
              </div>
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--green">PAID</span>
                  <span className="db-rev-tile-label">Collected Revenue</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(collectedRev)}</div>
                <div className="db-rev-tile-sub">{paidJobsCount} jobs paid</div>
              </div>
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--red">LATE</span>
                  <span className="db-rev-tile-label">Pending Collected Revenue</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(outstandingRev + overdueRev)}</div>
                <div className="db-rev-tile-sub">Sum of Unpaid &amp; Overdue</div>
              </div>
            </div>

            {/* Revenue Contribution summary */}
            <div className="db-rev-contribution">
              <div className="db-rev-contrib-label">Revenue Contribution (Overall)</div>
              <div className="db-rev-contrib-value">{fmtShort(totalRevenue)} (Total)</div>
              <div className="db-rev-contrib-bars">
                <div className="db-bar-row">
                  <span className="db-bar-label">Total Jobs: {totalJobsAcc}</span>
                  <div className="db-bar-track">
                    <div className="db-bar-fill db-bar--blue" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="db-bar-row">
                  <span className="db-bar-label">Avg. Value per Job</span>
                  <div className="db-bar-track">
                    <div className="db-bar-fill db-bar--orange"
                      style={{ width: totalJobsAcc > 0 ? `${Math.min((collectedRev / totalRevenue) * 100, 100)}%` : '0%' }}>
                    </div>
                  </div>
                </div>
                <div className="db-bar-row">
                  <span className="db-bar-label">Collected</span>
                  <div className="db-bar-track">
                    <div className="db-bar-fill db-bar--green"
                      style={{ width: totalRevenue > 0 ? `${Math.min((collectedRev / totalRevenue) * 100, 100)}%` : '0%' }}>
                    </div>
                  </div>
                </div>
              </div>
              <div className="db-rev-contrib-note">
                Revenue Source: Billing Data — approx. {fmtShort(totalJobsAcc > 0 ? totalRevenue / totalJobsAcc : 0)} avg/job
              </div>
            </div>

            {/* Bottom 3 tiles */}
            <div className="db-rev-bottom">
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--yellow">DUE</span>
                  <span className="db-rev-tile-label">Total Outstanding (Unpaid)</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(outstandingRev)}</div>
                <div className="db-rev-tile-sub">{unpaidJobsCount} unpaid</div>
              </div>
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--red">LATE</span>
                  <span className="db-rev-tile-label">Total Overdue (Late)</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(overdueRev)}</div>
                <div className="db-rev-tile-sub">{overdueCount} overdue</div>
              </div>
              <div className="db-rev-tile">
                <div className="db-rev-tile-header">
                  <span className="db-badge db-badge--green">NET</span>
                  <span className="db-rev-tile-label">Total Net Profit</span>
                </div>
                <div className="db-rev-tile-value">{fmtShort(netProfit)}</div>
                <div className="db-rev-tile-sub">{profitMargin}% margin</div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Operational Overview ── */}
          <div className="db-card">
            <h2 className="db-card-title">OPERATIONAL OVERVIEW</h2>

            {/* Total workload */}
            <div className="db-ops-total">
              <div className="db-ops-total-label">Total Operational Workload</div>
              <div className="db-ops-total-value">{stats.totalJobs} jobs</div>
              <div className="db-ops-total-sub">Total under processing</div>
            </div>

            {/* Job status row */}
            <div className="db-ops-status-row">
              <div className="db-ops-status-tile">
                <div className="db-ops-status-label">Open Jobs</div>
                <div className="db-ops-status-value db-ops--orange">{stats.openJobs}</div>
              </div>
              <div className="db-ops-status-tile">
                <div className="db-ops-status-label">In Transit</div>
                <div className="db-ops-status-value db-ops--blue">{stats.inTransitJobs}</div>
              </div>
              <div className="db-ops-status-tile">
                <div className="db-ops-status-label">Completed Jobs</div>
                <div className="db-ops-status-value db-ops--green">{stats.closedJobs}</div>
              </div>
            </div>

            {/* Invoices row */}
            <div className="db-ops-invoice-row">
              <div className="db-ops-invoice-tile">
                <div className="db-ops-invoice-label">Total Invoices (Generated)</div>
                <div className="db-ops-invoice-value">{stats.totalBills}</div>
                <div className="db-ops-invoice-sub">Total invoices across all jobs</div>
              </div>
              <div className="db-ops-invoice-tile db-ops-invoice-tile--donut">
                <div className="db-ops-invoice-label">Invoice Status Breakdown</div>
                <div className="db-donut-row">
                  <div className="db-donut-wrap">
                    <svg viewBox="0 0 36 36" className="db-donut-svg">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3.5"/>
                      {stats.totalBills > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27ae60" strokeWidth="3.5"
                          strokeDasharray={`${(stats.paidBills / stats.totalBills) * 100} ${100 - (stats.paidBills / stats.totalBills) * 100}`}
                          strokeDashoffset="25" strokeLinecap="round"/>
                      )}
                      {stats.totalBills > 0 && stats.unpaidBills > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e74c3c" strokeWidth="3.5"
                          strokeDasharray={`${(stats.unpaidBills / stats.totalBills) * 100} ${100 - (stats.unpaidBills / stats.totalBills) * 100}`}
                          strokeDashoffset={`${25 - (stats.paidBills / stats.totalBills) * 100}`} strokeLinecap="round"/>
                      )}
                    </svg>
                  </div>
                  <div className="db-donut-legend">
                    <div className="db-legend-item"><span className="db-legend-dot db-legend--green"></span>Paid ({stats.paidBills})</div>
                    <div className="db-legend-item"><span className="db-legend-dot db-legend--red"></span>Unpaid ({stats.unpaidBills})</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers + Conversion */}
            <div className="db-ops-bottom-row">
              <div className="db-ops-bottom-tile">
                <div className="db-ops-invoice-label">Total Customers</div>
                <div className="db-ops-invoice-value">{stats.totalCustomers}</div>
              </div>
              <div className="db-ops-bottom-tile db-ops-bottom-tile--conversion">
                <div className="db-ops-invoice-label">Revenue Conversion Rate</div>
                <div className="db-conversion-value">{stats.conversionRate}% Paid</div>
                <div className="db-ops-invoice-sub">Paid Invoices / Total Invoices</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Cash Flow Tracking ── */}
        <div className="db-card db-cashflow-card">
          <h2 className="db-card-title">CASH FLOW TRACKING</h2>
          <div className="db-cashflow-grid">
            <div className="db-cashflow-tile db-cashflow-tile--blue">
              <div className="db-cashflow-label">Main Account Balance</div>
              <div className="db-cashflow-value">{fmt(stats.mainAccountBalance)}</div>
              <div className="db-cashflow-sub">Total funds in main account</div>
            </div>
            <div className="db-cashflow-tile db-cashflow-tile--teal">
              <div className="db-cashflow-label">Petty Cash Balance</div>
              <div className="db-cashflow-value">{fmt(stats.pettyCashBalance)}</div>
              <div className="db-cashflow-sub">Available petty cash</div>
            </div>
            <div className="db-cashflow-tile db-cashflow-tile--purple">
              <div className="db-cashflow-label">Petty Cash Issued {timePeriod !== 'all' ? '(Period)' : '(To Date)'}</div>
              <div className="db-cashflow-tile-inner">
                <span className="db-badge db-badge--purple">CASH</span>
                <div className="db-cashflow-value">{fmt(pettyCashIssued)}</div>
              </div>
              <div className="db-cashflow-sub">{timePeriod !== 'all' ? 'Issued in selected period' : 'Total issued to date'}</div>
            </div>
            <div className="db-cashflow-tile db-cashflow-tile--red">
              <div className="db-cashflow-label">Uncollected Cash Due {timePeriod !== 'all' ? '(Period)' : ''}</div>
              <div className="db-cashflow-value">{fmtShort(stats.uncollectedCash)}</div>
              <div className="db-cashflow-sub">— sum of unpaid invoices</div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  /* ── WAFF CLERK ── */
  if (user?.role === 'Waff Clerk') {
    return (
      <div className="db-page">
        <div className="db-header">
          <h1 className="db-title">Dashboard</h1>
          <span className="db-welcome">Welcome back, {user?.fullName} — Super Shine Cargo Service</span>
        </div>
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
            <h3>Open Jobs</h3>
            <div className="value" style={{ color: '#f39c12' }}>{stats.openJobs}</div>
            <div className="label">Pending</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
            <h3>Completed Jobs</h3>
            <div className="value" style={{ color: '#27ae60' }}>{stats.closedJobs}</div>
            <div className="label">Finished</div>
          </div>
          <div className="stat-card">
            <h3>Paid Invoices</h3>
            <div className="value">{stats.paidBills}</div>
            <div className="label">Total Paid</div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#16a085' }}>
            <h3>Petty Cash</h3>
            <div className="value" style={{ fontSize: '1.5rem', color: '#16a085' }}>{fmt(stats.userPettyCash)}</div>
            <div className="label">Assigned to you</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── REGULAR USER ── */
  return (
    <div className="db-page">
      <div className="db-header">
        <h1 className="db-title">Dashboard</h1>
        <span className="db-welcome">Welcome back, {user?.fullName} — Super Shine Cargo Service</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <div className="value">{stats.totalJobs}</div>
          <div className="label">Assigned to you</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#f39c12' }}>
          <h3>Open Jobs</h3>
          <div className="value" style={{ color: '#f39c12' }}>{stats.openJobs}</div>
          <div className="label">Pending</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#27ae60' }}>
          <h3>Completed Jobs</h3>
          <div className="value" style={{ color: '#27ae60' }}>{stats.closedJobs}</div>
          <div className="label">Finished</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#16a085' }}>
          <h3>Petty Cash</h3>
          <div className="value" style={{ fontSize: '1.5rem', color: '#16a085' }}>{fmt(stats.pettyCashBalance)}</div>
          <div className="label">Current Balance</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
