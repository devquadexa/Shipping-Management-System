import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Test Navigation Component
 * Simple component to test if React Router navigation works
 * Add this temporarily to Dashboard to test
 */
function TestNavigation() {
  const navigate = useNavigate();

  const testNavigations = [
    { label: 'Test Jobs', path: '/jobs' },
    { label: 'Test Petty Cash', path: '/petty-cash' },
    { label: 'Test Billing', path: '/billing' },
  ];

  const handleTestClick = (path) => {
    console.log('Test navigation to:', path);
    navigate(path);
  };

  return (
    <div style={{
      padding: '20px',
      background: '#f0f0f0',
      border: '2px solid #ff0000',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h3>🔧 Navigation Test (Remove this after testing)</h3>
      <p>Click buttons to test if navigation works:</p>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {testNavigations.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => handleTestClick(path)}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Check browser console (F12) for messages
      </p>
    </div>
  );
}

export default TestNavigation;
