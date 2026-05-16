import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    orderManagement: true,
    inventoryControl: false,
    fieldOperations: false,
    customerManagement: false,
    reportingInsights: false,
    administration: false
  });

  const isActive = (path) => location.pathname === path;
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const canAccessReports = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager';
  const canAccessTransporters = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Office Executive';
  const canAccessPettyCash = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Waff Clerk';
  const isWaffClerk = user?.role === 'Waff Clerk';

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-header">
        <img src={`${process.env.PUBLIC_URL}/logo.png?v=${Date.now()}`} alt="Super Shine Cargo" className="sidebar-logo" />
        <h2 className="sidebar-title">Super Shine Cargo</h2>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        {/* Order Management Section */}
        <div className="nav-section">
          <button 
            className={`nav-section-header ${expandedSections.orderManagement ? 'expanded' : ''}`}
            onClick={() => toggleSection('orderManagement')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </span>
            <span>Order Management</span>
            <span className={`nav-chevron ${expandedSections.orderManagement ? 'rotated' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          {expandedSections.orderManagement && (
            <div className="nav-section-content">
              <Link to="/jobs" className={isActive('/jobs') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                <span className="nav-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </span>
                Jobs
              </Link>
              {isAdminOrManager && (
                <Link to="/billing" className={isActive('/billing') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Invoicing
                </Link>
              )}
              {canAccessTransporters && (
                <Link to="/old-invoices" className={isActive('/old-invoices') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Old Invoices
                </Link>
              )}
              {isWaffClerk && (
                <Link to="/invoice-reviews" className={isActive('/invoice-reviews') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Invoice Reviews
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Field Operations Section */}
        <div className="nav-section">
          <button 
            className={`nav-section-header ${expandedSections.fieldOperations ? 'expanded' : ''}`}
            onClick={() => toggleSection('fieldOperations')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                <path d="M16 8h4l3 3v5h-7V8z"></path>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </span>
            <span>Field Operations</span>
            <span className={`nav-chevron ${expandedSections.fieldOperations ? 'rotated' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          {expandedSections.fieldOperations && (
            <div className="nav-section-content">
              {canAccessTransporters && (
                <Link to="/transporters" className={isActive('/transporters') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Transporters
                </Link>
              )}
              {canAccessPettyCash && (
                <Link to="/petty-cash" className={isActive('/petty-cash') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Petty Cash
                </Link>
              )}
              {isAdminOrManager && (
                <Link to="/other-expenses" className={isActive('/other-expenses') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Other Expenses
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Customer Management Section */}
        <div className="nav-section">
          <button 
            className={`nav-section-header ${expandedSections.customerManagement ? 'expanded' : ''}`}
            onClick={() => toggleSection('customerManagement')}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span>
            <span>Customer Management</span>
            <span className={`nav-chevron ${expandedSections.customerManagement ? 'rotated' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </button>
          {expandedSections.customerManagement && (
            <div className="nav-section-content">
              <Link to="/customers" className={isActive('/customers') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                <span className="nav-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                  </svg>
                </span>
                Customers
              </Link>
            </div>
          )}
        </div>

        {/* Reporting & Insights Section */}
        {canAccessReports && (
          <div className="nav-section">
            <button 
              className={`nav-section-header ${expandedSections.reportingInsights ? 'expanded' : ''} ${isActivePrefix('/reports') ? 'active-section' : ''}`}
              onClick={() => toggleSection('reportingInsights')}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </span>
              <span>Reporting & Insights</span>
              <span className={`nav-chevron ${expandedSections.reportingInsights ? 'rotated' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            {expandedSections.reportingInsights && (
              <div className="nav-section-content">
                <Link to="/reports" className={isActive('/reports') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  All Reports
                </Link>
                <Link to="/reports/petty-cash" className={isActive('/reports/petty-cash') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Petty Cash Report
                </Link>
                <Link to="/reports/pending-payments" className={isActive('/reports/pending-payments') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Pending Payments
                </Link>
                <Link to="/reports/other-expenses" className={isActive('/reports/other-expenses') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Other Expenses
                </Link>
                <Link to="/reports/cash-summary" className={isActive('/reports/cash-summary') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Cash Summary
                </Link>
                <Link to="/reports/transporters" className={isActive('/reports/transporters') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Transporters Report
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Administration Section */}
        {isSuperAdmin && (
          <div className="nav-section">
            <button 
              className={`nav-section-header ${expandedSections.administration ? 'expanded' : ''}`}
              onClick={() => toggleSection('administration')}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              <span>Administration</span>
              <span className={`nav-chevron ${expandedSections.administration ? 'rotated' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </button>
            {expandedSections.administration && (
              <div className="nav-section-content">
                <Link to="/accounting" className={isActive('/accounting') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Accounting
                </Link>
                <Link to="/users" className={isActive('/users') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Users
                </Link>
                <Link to="/password-reset-requests" className={isActive('/password-reset-requests') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                  <span className="nav-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </span>
                  Password Resets
                </Link>
                {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                  <Link to="/settings" className={isActive('/settings') ? 'nav-item active' : 'nav-item'} onClick={handleLinkClick}>
                    <span className="nav-item-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    </span>
                    Settings
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
    </>
  );
}

export default Sidebar;
