import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState('all'); // all, today, week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalJobs: 0,
    openJobs: 0,
    inTransitJobs: 0,
    completedJobs: 0,
    totalBills: 0,
    unpaidBills: 0,
    paidBills: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    pettyCashBalance: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    fetchStats();
  }, [timePeriod, customDateRange]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (timePeriod) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        endDate = new Date();
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        endDate = new Date();
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate);
          endDate = new Date(customDateRange.endDate);
        }
        break;
      default:
        return null;
    }

    return { startDate, endDate };
  };

  const filterByDateRange = (items, dateField) => {
    const dateRange = getDateRange();
    if (!dateRange || !items) return items;

    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  };

  const fetchStats = async () => {
    try {
      const [customers, jobs, bills, pettyCash] = await Promise.all([
        user?.role !== 'User' ? axios.get('/api/customers') : Promise.resolve({ data: [] }),
        axios.get('/api/jobs'),
        user?.role !== 'User' ? axios.get('/api/billing') : Promise.resolve({ data: [] }),
        axios.get('/api/petty-cash/balance')
      ]);

      // Apply date filtering
      const filteredCustomers = timePeriod === 'all' ? customers.data : filterByDateRange(customers.data, 'registrationDate');
      const filteredJobs = timePeriod === 'all' ? jobs.data : filterByDateRange(jobs.data, 'createdDate');
      const filteredBills = timePeriod === 'all' ? bills.data : filterByDateRange(bills.data, 'billDate');

      // Calculate revenue
      const totalRevenue = filteredBills
        .filter(b => b.paymentStatus === 'Paid')
        .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

      const pendingRevenue = filteredBills
        .filter(b => b.paymentStatus === 'Unpaid')
        .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

      // Calculate expenses (petty cash assignments)
      const totalExpenses = filteredJobs.reduce((sum, job) => {
        return sum + parseFloat(job.pettyCashAmount || 0);
      }, 0);

      setStats({
        totalCustomers: filteredCustomers.length,
        totalJobs: filteredJobs.length,
        openJobs: filteredJobs.filter(j => j.status === 'Open').length,
        inTransitJobs: filteredJobs.filter(j => j.status === 'In Transit').length,
        completedJobs: filteredJobs.filter(j => j.status === 'Completed').length,
        totalBills: filteredBills.length,
        unpaidBills: filteredBills.filter(b => b.paymentStatus === 'Unpaid').length,
        paidBills: filteredBills.filter(b => b.paymentStatus === 'Paid').length,
        totalRevenue: totalRevenue,
        pendingRevenue: pendingRevenue,
        pettyCashBalance: pettyCash.data.balance,
        totalExpenses: totalExpenses
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    if (period !== 'custom') {
      setCustomDateRange({ startDate: '', endDate: '' });
    }
  };

  const handleCustomDateChange = (e) => {
    setCustomDateRange({
      ...customDateRange,
      [e.target.name]: e.target.value
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'Last 30 Days';
      case 'year': return 'Last 12 Months';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  // Render for Super Admin and Admin
  if (user?.role === 'Super Admin' || user?.role === 'Admin') {
    return (
      <div className="container">
        <div className="page-header">
          <div>
            <h1>📊 Executive Dashboard</h1>
            <p>Super Shine Cargo Service - Real-time Business Intelligence</p>
          </div>
        </div>

        {/* Time Period Filter */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '600', color: '#1e3c72' }}>📅 Time Period:</span>
              <span style={{ 
                padding: '0.5rem 1rem', 
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                {getTimePeriodLabel()}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              <button 
                onClick={() => handleTimePeriodChange('all')}
                className={`btn ${timePeriod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                All Time
              </button>
              <button 
                onClick={() => handleTimePeriodChange('today')}
                className={`btn ${timePeriod === 'today' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Today
              </button>
              <button 
                onClick={() => handleTimePeriodChange('week')}
                className={`btn ${timePeriod === 'week' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Last 7 Days
              </button>
              <button 
                onClick={() => handleTimePeriodChange('month')}
                className={`btn ${timePeriod === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Last 30 Days
              </button>
              <button 
                onClick={() => handleTimePeriodChange('year')}
                className={`btn ${timePeriod === 'year' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Last 12 Months
              </button>
              <button 
                onClick={() => handleTimePeriodChange('custom')}
                className={`btn ${timePeriod === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {timePeriod === 'custom' && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  Start Date
                </label>
                <input 
                  type="date" 
                  name="startDate"
                  value={customDateRange.startDate}
                  onChange={handleCustomDateChange}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '2px solid #e0e6ed' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                  End Date
                </label>
                <input 
                  type="date" 
                  name="endDate"
                  value={customDateRange.endDate}
                  onChange={handleCustomDateChange}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '2px solid #e0e6ed' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Financial Overview Section */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: 'white' }}>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💰 Financial Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(stats.totalRevenue)}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>From {stats.paidBills} paid invoices</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Pending Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(stats.pendingRevenue)}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>From {stats.unpaidBills} unpaid invoices</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Expenses</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(stats.totalExpenses)}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>Petty cash assignments</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1.5rem', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '0.5rem' }}>Petty Cash Balance</div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{formatCurrency(stats.pettyCashBalance)}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>Available funds</div>
            </div>
          </div>
        </div>

        {/* Operations Overview */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚚 Operations Overview
          </h2>
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #3498db' }}>
              <h3>Total Jobs</h3>
              <div className="value" style={{ color: '#3498db' }}>{stats.totalJobs}</div>
              <div className="label">All shipments</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #f39c12' }}>
              <h3>Open Jobs</h3>
              <div className="value" style={{ color: '#f39c12' }}>{stats.openJobs}</div>
              <div className="label">Awaiting processing</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #9b59b6' }}>
              <h3>In Transit</h3>
              <div className="value" style={{ color: '#9b59b6' }}>{stats.inTransitJobs}</div>
              <div className="label">Currently shipping</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #27ae60' }}>
              <h3>Completed</h3>
              <div className="value" style={{ color: '#27ae60' }}>{stats.completedJobs}</div>
              <div className="label">Successfully delivered</div>
            </div>
          </div>
        </div>

        {/* Customer & Billing Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👥 Customer Base
            </h2>
            <div className="stat-card" style={{ borderLeft: '4px solid #1e3c72', marginBottom: 0 }}>
              <h3>Total Customers</h3>
              <div className="value" style={{ color: '#1e3c72' }}>{stats.totalCustomers}</div>
              <div className="label">Registered clients</div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📄 Billing Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '0.25rem' }}>Total Invoices</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>{stats.totalBills}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>📋</div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, padding: '1rem', background: '#d1e7dd', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
                  <div style={{ fontSize: '0.85rem', color: '#0f5132', marginBottom: '0.25rem' }}>Paid</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f5132' }}>{stats.paidBills}</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', background: '#f8d7da', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                  <div style={{ fontSize: '0.85rem', color: '#842029', marginBottom: '0.25rem' }}>Unpaid</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#842029' }}>{stats.unpaidBills}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render for Waff Clerk
  if (user?.role === 'Waff Clerk') {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Welcome, {user?.fullName}!</h1>
          <p>Waff Clerk Dashboard</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Open Jobs</h3>
            <div className="value">{stats.openJobs}</div>
            <div className="label">Pending</div>
          </div>
          <div className="stat-card">
            <h3>Completed Jobs</h3>
            <div className="value">{stats.completedJobs}</div>
            <div className="label">Finished</div>
          </div>
          <div className="stat-card">
            <h3>Paid Invoices</h3>
            <div className="value">{stats.paidBills}</div>
            <div className="label">Total Paid</div>
          </div>
        </div>
      </div>
    );
  }

  // Render for Regular User
  return (
    <div className="container">
      <div className="page-header">
        <h1>Welcome, {user?.fullName}!</h1>
        <p>Your Dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <div className="value">{stats.totalJobs}</div>
          <div className="label">Assigned to you</div>
        </div>
        <div className="stat-card">
          <h3>Open Jobs</h3>
          <div className="value">{stats.openJobs}</div>
          <div className="label">Pending</div>
        </div>
        <div className="stat-card">
          <h3>Completed Jobs</h3>
          <div className="value">{stats.completedJobs}</div>
          <div className="label">Finished</div>
        </div>
        <div className="stat-card">
          <h3>Petty Cash</h3>
          <div className="value">{formatCurrency(stats.pettyCashBalance)}</div>
          <div className="label">Current Balance</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
