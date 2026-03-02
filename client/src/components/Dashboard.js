import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalJobs: 0,
    openJobs: 0,
    totalBills: 0,
    unpaidBills: 0,
    pettyCashBalance: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customers, jobs, bills, pettyCash] = await Promise.all([
        user?.role !== 'User' ? axios.get('/api/customers') : Promise.resolve({ data: [] }),
        axios.get('/api/jobs'),
        user?.role !== 'User' ? axios.get('/api/billing') : Promise.resolve({ data: [] }),
        axios.get('/api/petty-cash/balance')
      ]);

      setStats({
        totalCustomers: customers.data.length,
        totalJobs: jobs.data.length,
        openJobs: jobs.data.filter(j => j.status === 'Open').length,
        totalBills: bills.data.length,
        unpaidBills: bills.data.filter(b => b.paymentStatus === 'Unpaid').length,
        pettyCashBalance: pettyCash.data.balance
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Welcome, {user?.fullName}!</h1>
        <p>Super Shine Cargo Service Dashboard</p>
      </div>

      <div className="stats-grid">
        {user?.role !== 'User' && (
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
        {user?.role !== 'User' && (
          <>
            <div className="stat-card">
              <h3>Total Bills</h3>
              <div className="value">{stats.totalBills}</div>
              <div className="label">Generated</div>
            </div>
            <div className="stat-card">
              <h3>Unpaid Bills</h3>
              <div className="value">{stats.unpaidBills}</div>
              <div className="label">Outstanding</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <h3>Petty Cash</h3>
          <div className="value">LKR {stats.pettyCashBalance.toFixed(2)}</div>
          <div className="label">Current Balance</div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
