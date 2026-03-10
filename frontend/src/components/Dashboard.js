import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerService } from '../api/services/customerService';
import { jobService } from '../api/services/jobService';
import { billingService } from '../api/services/billingService';
import { pettyCashService } from '../api/services/pettyCashService';
import { accountingService } from '../api/services/accountingService';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalJobs: 0,
    openJobs: 0,
    totalBills: 0,
    unpaidBills: 0,
    pettyCashBalance: 0,
    userPettyCash: 0
  });
  const [accountingData, setAccountingData] = useState(null);

  useEffect(() => {
    fetchStats();
    if (user?.role === 'Super Admin') {
      fetchAccountingData();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      let pettyCashData = { balance: 0 };

      // Fetch petty cash based on role
      if (user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Manager') {
        // For admin/super admin/manager, get overall balance
        pettyCashData = await pettyCashService.getBalance();
      } else if (user?.role === 'User') {
        // For regular users, get their assigned petty cash
        pettyCashData = await pettyCashService.getUserAssignedBalance();
      }

      const [customers, jobs, bills] = await Promise.all([
        (user?.role !== 'User') ? customerService.getAll() : Promise.resolve([]),
        jobService.getAll(),
        (user?.role !== 'User') ? billingService.getBills() : Promise.resolve([])
      ]);

      setStats({
        totalCustomers: customers.length,
        totalJobs: jobs.length,
        openJobs: jobs.filter(j => j.status === 'Open').length,
        totalBills: bills.length,
        unpaidBills: bills.filter(b => b.paymentStatus === 'Unpaid').length,
        pettyCashBalance: pettyCashData.balance,
        userPettyCash: pettyCashData.balance
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAccountingData = async () => {
    try {
      const data = await accountingService.getDashboard();
      setAccountingData(data);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Welcome, {user?.fullName}!</h1>
        <p>Super Shine Cargo Service Dashboard</p>
      </div>

      {/* Accounting Summary Cards - Super Admin Only */}
      {user?.role === 'Super Admin' && accountingData && (
        <div className="accounting-summary-section">
          <h2 className="section-title">Financial Overview</h2>
          <div className="accounting-cards">
            <div className="accounting-card card-primary">
              <div className="card-icon">LKR</div>
              <div className="card-content">
                <h3>Total Revenue</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalBillingAmount)}</p>
                <span className="card-subtitle">{accountingData.summary.totalJobs} jobs</span>
              </div>
            </div>

            <div className="accounting-card card-success">
              <div className="card-icon">PAID</div>
              <div className="card-content">
                <h3>Paid Amount</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalPaid)}</p>
                <span className="card-subtitle">{accountingData.summary.paidJobsCount} jobs paid</span>
              </div>
            </div>

            <div className="accounting-card card-warning">
              <div className="card-icon">DUE</div>
              <div className="card-content">
                <h3>Outstanding</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalOutstanding)}</p>
                <span className="card-subtitle">{accountingData.summary.unpaidJobsCount} unpaid jobs</span>
              </div>
            </div>

            <div className="accounting-card card-danger">
              <div className="card-icon">LATE</div>
              <div className="card-content">
                <h3>Overdue</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalOverdue)}</p>
                <span className="card-subtitle">{accountingData.summary.overdueJobsCount} overdue jobs</span>
              </div>
            </div>

            <div className="accounting-card card-info">
              <div className="card-icon">CASH</div>
              <div className="card-content">
                <h3>Petty Cash Issued</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalPettyCashIssued)}</p>
                <span className="card-subtitle">Total issued</span>
              </div>
            </div>

            <div className="accounting-card card-profit">
              <div className="card-icon">NET</div>
              <div className="card-content">
                <h3>Total Profit</h3>
                <p className="card-value">LKR {formatCurrency(accountingData.summary.totalProfit)}</p>
                <span className="card-subtitle">
                  {accountingData.summary.totalBillingAmount > 0 
                    ? `${((accountingData.summary.totalProfit / accountingData.summary.totalBillingAmount) * 100).toFixed(1)}% margin`
                    : '0% margin'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Dashboard Stats */}
      <h2 className="section-title">{user?.role === 'Super Admin' ? 'Operations Overview' : 'Dashboard Overview'}</h2>
      <div className="stats-grid">
        {(user?.role !== 'User') && (
          <div className="stat-card">
            <h3>Total Customers</h3>
            <div className="value">{stats.totalCustomers}</div>
            <div className="label">Registered</div>
          </div>
        )}
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <div className="value">{stats.totalJobs}</div>
          <div className="label">{user?.role === 'User' ? 'Assigned to you' : 'All jobs'}</div>
        </div>
        <div className="stat-card">
          <h3>Open Jobs</h3>
          <div className="value">{stats.openJobs}</div>
          <div className="label">Pending</div>
        </div>
        {(user?.role !== 'User') && (
          <>
            <div className="stat-card">
              <h3>Total Invoices</h3>
              <div className="value">{stats.totalBills}</div>
              <div className="label">Generated</div>
            </div>
            <div className="stat-card">
              <h3>Unpaid Invoices</h3>
              <div className="value">{stats.unpaidBills}</div>
              <div className="label">Outstanding</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <h3>Petty Cash</h3>
          <div className="value">
            LKR {(user?.role === 'User' ? stats.userPettyCash : stats.pettyCashBalance).toFixed(2)}
          </div>
          <div className="label">
            {user?.role === 'User' ? 'Assigned to you' : 'Current Balance'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
