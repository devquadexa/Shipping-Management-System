import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-brand">
          <div className="logo">🚚</div>
          <div className="navbar-brand-text">
            <h1>Super Shine Cargo Service</h1>
            <p>Sri Lanka's Premier Cargo Solutions</p>
          </div>
        </div>
        <ul>
          <li><Link to="/" className={isActive('/')}>Dashboard</Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <li><Link to="/customers" className={isActive('/customers')}>Customers</Link></li>
          )}
          <li><Link to="/jobs" className={isActive('/jobs')}>Jobs</Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <li><Link to="/billing" className={isActive('/billing')}>Billing</Link></li>
          )}
          <li><Link to="/petty-cash" className={isActive('/petty-cash')}>Petty Cash</Link></li>
          {user?.role === 'Super Admin' && (
            <li><Link to="/users" className={isActive('/users')}>Users</Link></li>
          )}
        </ul>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <div className="user-name">{user?.fullName}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button onClick={logout} className="btn-logout">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
