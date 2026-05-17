import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState({
    dashboard: true,
    operations: true,
    financial: true,
    reports: true,
    admin: true
  });

  const isActive = (path) => location.pathname === path;
  const isActivePrefix = (prefix) => location.pathname.startsWith(prefix);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const canAccessReports = user?.role === 'Admin' || user?.role === 'Super Admin';
  const isSuperAdmin = user?.role === 'Super Admin';
  const canAccessTransporters = ['Admin', 'Super Admin', 'Manager', 'Office Executive'].includes(user?.role);
  const canAccessBilling = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
  const canAccessOldInvoices = ['Admin', 'Super Admin', 'Manager', 'Office Executive'].includes(user?.role);
  const canAccessPettyCash = ['Admin', 'Super Admin', 'Manager', 'Waff Clerk'].includes(user?.role);
  const canAccessOtherExpenses = ['Admin', 'Super Admin', 'Manager'].includes(user?.role);
  const canAccessAccounting = isSuperAdmin;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-header">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="sidebar-logo" />
          <div className="sidebar-brand">
            <h2>Super Shine Cargo</h2>
            <p>Sri Lanka's Premier Cargo</p>
          </div>
          <button 
            className="sidebar-hide-btn" 
            onClick={onClose}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          
          {/* DASHBOARD & OVERVIEW */}
          <div className="nav-group">
            <button 
              className="nav-group-header" 
              onClick={() => toggleGroup('dashboard')}
            >
              <span className="nav-group-title">
                <svg className="nav-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                DASHBOARD & OVERVIEW
              </span>
              <svg className={`nav-group-chevron ${expandedGroups.dashboard ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {expandedGroups.dashboard && (
              <div className="nav-group-items">
                <Link 
                  to="/" 
                  className={`nav-item ${isActive('/') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Dashboard</span>
                </Link>
              </div>
            )}
          </div>

          {/* CORE OPERATIONS */}
          <div className="nav-group">
            <button 
              className="nav-group-header" 
              onClick={() => toggleGroup('operations')}
            >
              <span className="nav-group-title">
                <svg className="nav-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
                </svg>
                CORE OPERATIONS
              </span>
              <svg className={`nav-group-chevron ${expandedGroups.operations ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {expandedGroups.operations && (
              <div className="nav-group-items">
                <Link 
                  to="/customers" 
                  className={`nav-item ${isActive('/customers') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>Customers</span>
                </Link>

                {canAccessTransporters && (
                  <Link 
                    to="/transporters" 
                    className={`nav-item ${isActive('/transporters') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                      <path d="M16 8h4l3 3v5h-7V8z"></path>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span>Transporters</span>
                  </Link>
                )}

                <Link 
                  to="/jobs" 
                  className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  <span>Jobs</span>
                </Link>

                {canAccessPettyCash && (
                  <Link 
                    to="/petty-cash" 
                    className={`nav-item ${isActive('/petty-cash') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span>Petty Cash</span>
                  </Link>
                )}

                {canAccessBilling && (
                  <Link 
                    to="/billing" 
                    className={`nav-item ${isActive('/billing') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span>Invoicing</span>
                  </Link>
                )}

                {canAccessOldInvoices && (
                  <Link 
                    to="/old-invoices" 
                    className={`nav-item ${isActive('/old-invoices') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <span>Old Invoices</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* FINANCIAL MANAGEMENT */}
          {(canAccessOtherExpenses || canAccessAccounting) && (
            <div className="nav-group">
              <button 
                className="nav-group-header" 
                onClick={() => toggleGroup('financial')}
              >
                <span className="nav-group-title">
                  <svg className="nav-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  FINANCIAL MANAGEMENT
                </span>
                <svg className={`nav-group-chevron ${expandedGroups.financial ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {expandedGroups.financial && (
                <div className="nav-group-items">
                  {canAccessOtherExpenses && (
                    <Link 
                      to="/other-expenses" 
                      className={`nav-item ${isActive('/other-expenses') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                        <circle cx="12" cy="14" r="2"></circle>
                      </svg>
                      <span>Other Expenses</span>
                    </Link>
                  )}

                  {canAccessAccounting && (
                    <Link 
                      to="/accounting" 
                      className={`nav-item ${isActive('/accounting') ? 'active' : ''}`}
                      onClick={handleLinkClick}
                    >
                      <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                        <polyline points="3 20 21 20"></polyline>
                      </svg>
                      <span>Accounting</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* REPORTS & ANALYTICS */}
          {canAccessReports && (
            <div className="nav-group">
              <button 
                className="nav-group-header" 
                onClick={() => toggleGroup('reports')}
              >
                <span className="nav-group-title">
                  <svg className="nav-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                    <polyline points="3 20 21 20"></polyline>
                  </svg>
                  REPORTS & ANALYTICS
                </span>
                <svg className={`nav-group-chevron ${expandedGroups.reports ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {expandedGroups.reports && (
                <div className="nav-group-items">
                  <Link 
                    to="/reports" 
                    className={`nav-item ${isActive('/reports') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                      <polyline points="3 20 21 20"></polyline>
                    </svg>
                    <span>All Reports</span>
                  </Link>

                  <Link 
                    to="/reports/petty-cash" 
                    className={`nav-item ${isActive('/reports/petty-cash') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"></line>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    <span>Petty Cash Report</span>
                  </Link>

                  <Link 
                    to="/reports/pending-payments" 
                    className={`nav-item ${isActive('/reports/pending-payments') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span>Pending Payments</span>
                  </Link>

                  <Link 
                    to="/reports/other-expenses" 
                    className={`nav-item ${isActive('/reports/other-expenses') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10"></line>
                      <circle cx="12" cy="14" r="2"></circle>
                    </svg>
                    <span>Other Expenses Report</span>
                  </Link>

                  <Link 
                    to="/reports/transporters" 
                    className={`nav-item ${isActive('/reports/transporters') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="3" width="15" height="13" rx="1"></rect>
                      <path d="M16 8h4l3 3v5h-7V8z"></path>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                    </svg>
                    <span>Transporters Report</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* SYSTEM ADMINISTRATION */}
          {isSuperAdmin && (
            <div className="nav-group">
              <button 
                className="nav-group-header" 
                onClick={() => toggleGroup('admin')}
              >
                <span className="nav-group-title">
                  <svg className="nav-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  SYSTEM ADMINISTRATION
                </span>
                <svg className={`nav-group-chevron ${expandedGroups.admin ? 'expanded' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              {expandedGroups.admin && (
                <div className="nav-group-items">
                  <Link 
                    to="/users" 
                    className={`nav-item ${isActive('/users') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>Users</span>
                  </Link>

                  <Link 
                    to="/password-reset-requests" 
                    className={`nav-item ${isActive('/password-reset-requests') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>Password Resets</span>
                  </Link>

                  <Link 
                    to="/settings" 
                    className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
                    onClick={handleLinkClick}
                  >
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Settings</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
