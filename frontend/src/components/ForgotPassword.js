import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetService } from '../api/services/passwordResetService';
import '../styles/PasswordReset.css';

function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setMessage('Please enter your username');
      setMessageType('error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await passwordResetService.requestPasswordReset(username);
      
      setMessage(result.message);
      setMessageType('success');
      setSubmitted(true);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error requesting password reset');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="password-reset-header">
          <div className="password-reset-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1>Forgot Password?</h1>
          <p>
            {submitted 
              ? "Your request has been sent to the administrator. You will receive a temporary password shortly."
              : "Enter your username and we'll send a password reset request to the administrator."
            }
          </p>
        </div>

        {message && (
          <div className={`alert-pr ${messageType}`}>
            {messageType === 'success' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            )}
            {messageType === 'error' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
            {messageType === 'info' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            )}
            {message}
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="password-reset-form">
            <div className="form-group-pr">
              <label>
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className="alert-pr info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <div>
                <strong>Note:</strong> Your password reset request will be sent to the Super Administrator. 
                Once approved, you will receive a temporary password to log in.
              </div>
            </div>

            <button type="submit" className="btn-submit-pr" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-pr"></div>
                  Sending Request...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  Send Reset Request
                </>
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: '#d1fae5', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#101036', fontSize: '1.25rem' }}>
              Request Sent Successfully!
            </h3>
            <p style={{ margin: '0 0 2rem 0', color: '#6b7280' }}>
              Please wait for the administrator to process your request. You will be contacted with a temporary password.
            </p>
          </div>
        )}

        <div className="back-to-login">
          <Link to="/login">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
