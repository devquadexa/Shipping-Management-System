import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePassword from './ChangePassword';
import NotificationBell from './NotificationBell';

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const closeProfileDropdown  = () => setIsProfileDropdownOpen(false);

  const handleChangePasswordClick = () => {
    closeProfileDropdown();
    setShowChangePasswordModal(true);
  };

  const handleLogout = () => {
    closeProfileDropdown();
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
    // Dispatch custom event to notify App component
    window.dispatchEvent(new CustomEvent('toggleSidebarVisibility', { detail: { hidden: !isSidebarHidden } }));
  };

  const getUserInitials = () => {
    if (!user?.fullName) return 'U';
    const names = user.fullName.trim().split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const canAccessSettings = user?.role === 'Admin' || user?.role === 'Super Admin';

  return (
    <>
      <nav className="navbar">
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <span className="hamburger-icon">
            <span></span><span></span><span></span>
          </span>
        </button>

        {/* Desktop Sidebar Toggle Button */}
        {user && (
          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }}></div>

        {/* Notification Bell */}
        {user && <NotificationBell />}

        {/* Profile Section */}
        <div className="navbar-right">
          {/* Refresh Button */}
          <button 
            className="navbar-icon-btn" 
            onClick={() => window.location.reload()}
            title="Refresh page"
            aria-label="Refresh page"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
            </svg>
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          <div className="profile-container">
            <button className="profile-button" onClick={toggleProfileDropdown} aria-label="User menu">
              <div className="profile-avatar">{getUserInitials()}</div>
            </button>

            {isProfileDropdownOpen && (
              <>
                <div className="profile-dropdown-overlay" onClick={closeProfileDropdown}></div>
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">{getUserInitials()}</div>
                    <div className="profile-dropdown-info">
                      <div className="profile-dropdown-name">{user?.fullName}</div>
                      <div className="profile-dropdown-role">{user?.role}</div>
                    </div>
                  </div>
                  <div className="profile-dropdown-divider"></div>
                  <div className="profile-dropdown-menu">
                    {canAccessSettings && (
                      <Link to="/settings" className="profile-dropdown-item" onClick={closeProfileDropdown}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"></circle>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Settings
                      </Link>
                    )}
                    <button className="profile-dropdown-item" onClick={handleChangePasswordClick}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Change Password
                    </button>
                    <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
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

      {/* Change Password Modal */}
      <ChangePassword 
        isOpen={showChangePasswordModal} 
        onClose={() => setShowChangePasswordModal(false)} 
      />
    </>
  );
}

export default Navbar;
