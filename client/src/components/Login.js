import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.message || 'Invalid username or password');
      } else if (err.request) {
        setError('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-icon">🚚</div>
            <h1>Super Shine Cargo Service</h1>
          </div>
          <p className="tagline">Sri Lanka's Premier Cargo Solutions</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <h2>Sign In</h2>
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block">
            Sign In
          </button>
          
          <div className="login-footer">
            <p>Default credentials: superadmin / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
