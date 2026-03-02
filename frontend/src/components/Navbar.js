import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
            <span className="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          <div className="navbar-brand">
            <img src={`${process.env.PUBLIC_URL}/logo.png?v=${Date.now()}`} alt="Super Shine Cargo" className="logo" />
            <div className="navbar-brand-text">
              <h1>Super Shine Cargo Service</h1>
              <p>Sri Lanka's Premier Cargo Solutions</p>
            </div>
          </div>
          
          <ul className="desktop-menu">
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

      {/* Mobile Sidebar */}
      <div className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu}></div>
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-sidebar-header">
          <div className="mobile-user-info">
            <img src={`${process.env.PUBLIC_URL}/logo.png?v=${Date.now()}`} alt="Super Shine Cargo" className="mobile-logo" />
            <div>
              <div className="mobile-user-name">{user?.fullName}</div>
              <div className="mobile-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="close-btn" onClick={closeMobileMenu} aria-label="Close menu">×</button>
        </div>
        
        <ul className="mobile-menu">
          <li><Link to="/" className={isActive('/')} onClick={closeMobileMenu}>
            <span className="menu-icon">📊</span> Dashboard
          </Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <li><Link to="/customers" className={isActive('/customers')} onClick={closeMobileMenu}>
              <span className="menu-icon">👥</span> Customers
            </Link></li>
          )}
          <li><Link to="/jobs" className={isActive('/jobs')} onClick={closeMobileMenu}>
            <span className="menu-icon">📦</span> Jobs
          </Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
            <li><Link to="/billing" className={isActive('/billing')} onClick={closeMobileMenu}>
              <span className="menu-icon">💰</span> Billing
            </Link></li>
          )}
          <li><Link to="/petty-cash" className={isActive('/petty-cash')} onClick={closeMobileMenu}>
            <span className="menu-icon">💵</span> Petty Cash
          </Link></li>
          {user?.role === 'Super Admin' && (
            <li><Link to="/users" className={isActive('/users')} onClick={closeMobileMenu}>
              <span className="menu-icon">👤</span> Users
            </Link></li>
          )}
        </ul>
        
        <div className="mobile-sidebar-footer">
          <button onClick={handleLogout} className="mobile-logout-btn">
            <span className="menu-icon">🚪</span> Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
