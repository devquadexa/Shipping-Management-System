import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const handleLogout = () => {
    closeMobileMenu();
    closeProfileDropdown();
    logout();
  };

  // Get user initials from full name
  const getUserInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
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
            <li><Link to="/customers" className={isActive('/customers')}>Customers</Link></li>
            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Office Executive') && (
              <li><Link to="/transporters" className={isActive('/transporters')}>Transporters</Link></li>
            )}
            <li><Link to="/jobs" className={isActive('/jobs')}>Jobs</Link></li>
            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
              <li><Link to="/billing" className={isActive('/billing')}>Invoicing</Link></li>
            )}
            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Office Executive') && (
              <li><Link to="/old-invoices" className={isActive('/old-invoices')}>Old Invoices</Link></li>
            )}
            {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Waff Clerk') && (
              <li><Link to="/petty-cash" className={isActive('/petty-cash')}>Petty Cash</Link></li>
            )}
            {user?.role === 'Super Admin' && (
              <li><Link to="/accounting" className={isActive('/accounting')}>Accounting</Link></li>
            )}
            {user?.role === 'Super Admin' && (
              <li><Link to="/users" className={isActive('/users')}>Users</Link></li>
            )}
          </ul>
        </div>
        
        <div className="navbar-right">
          <div className="profile-container">
            <button 
              className="profile-button" 
              onClick={toggleProfileDropdown}
              aria-label="User menu"
            >
              <div className="profile-avatar">
                {getUserInitials()}
              </div>
            </button>
            
            {isProfileDropdownOpen && (
              <>
                <div className="profile-dropdown-overlay" onClick={closeProfileDropdown}></div>
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {getUserInitials()}
                    </div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user?.fullName}</div>
                      <div className="profile-dropdown-role">{user?.role}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <div className="profile-dropdown-menu">
                    {(user?.role === 'Admin' || user?.role === 'Super Admin') && (
                      <Link 
                        to="/settings" 
                        className="profile-dropdown-item"
                        onClick={closeProfileDropdown}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                      </Link>
                    )}
                    <button 
                      className="profile-dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
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
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span> Dashboard
          </Link></li>
          <li><Link to="/customers" className={isActive('/customers')} onClick={closeMobileMenu}>
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </span> Customers
          </Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Office Executive') && (
            <li><Link to="/transporters" className={isActive('/transporters')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17h4"></path>
                  <path d="M7 17h.01"></path>
                  <path d="M17 17h.01"></path>
                  <path d="M3 8l2-3h14l2 3"></path>
                  <path d="M5 8h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8Z"></path>
                </svg>
              </span> Transporters
            </Link></li>
          )}
          <li><Link to="/jobs" className={isActive('/jobs')} onClick={closeMobileMenu}>
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </span> Jobs
          </Link></li>
          {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager') && (
            <li><Link to="/billing" className={isActive('/billing')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </span> Invoicing
            </Link></li>
          )}
          {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Office Executive') && (
            <li><Link to="/old-invoices" className={isActive('/old-invoices')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span> Old Invoices
            </Link></li>
          )}
          {(user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Waff Clerk') && (
            <li><Link to="/petty-cash" className={isActive('/petty-cash')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </span> Petty Cash
            </Link></li>
          )}
          {user?.role === 'Super Admin' && (
            <li><Link to="/accounting" className={isActive('/accounting')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </span> Accounting
            </Link></li>
          )}
          {user?.role === 'Super Admin' && (
            <li><Link to="/users" className={isActive('/users')} onClick={closeMobileMenu}>
              <span className="menu-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span> Users
            </Link></li>
          )}
        </ul>
        
        <div className="mobile-sidebar-footer">
          <button onClick={handleLogout} className="mobile-logout-btn">
            <span className="menu-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span> Logout
          </button>
        </div>
      </div>
    </>
  );
}

export default Navbar;
