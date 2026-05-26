import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Notification Test Component
 * Add this to your Dashboard temporarily to test if navigation works
 */
function NotificationTest() {
  const navigate = useNavigate();

  const testNotification = {
    notificationId: "TEST001",
    type: "PETTY_CASH_ASSIGNED",
    title: "Test Notification",
    message: "This is a test",
    metadata: JSON.stringify({
      assignmentId: 180,
      jobId: "JOB0043",
      assignedAmount: 10000
    })
  };

  const handleTestClick = () => {
    console.log('=== TEST NOTIFICATION CLICK ===');
    console.log('Test notification:', testNotification);
    
    // Parse metadata
    let parsedMetadata = testNotification.metadata;
    if (typeof parsedMetadata === 'string') {
      try {
        parsedMetadata = JSON.parse(parsedMetadata);
        console.log('Parsed metadata:', parsedMetadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
        parsedMetadata = {};
      }
    }
    
    console.log('Attempting to navigate to /petty-cash');
    
    try {
      navigate('/petty-cash', { 
        state: { 
          highlightAssignmentId: parsedMetadata?.assignmentId,
          scrollToAssignment: true,
          jobId: parsedMetadata?.jobId
        } 
      });
      console.log('✅ Navigation called successfully');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: '#fff3cd',
      border: '2px solid #ffc107',
      margin: '20px',
      borderRadius: '8px'
    }}>
      <h3>🧪 Notification Test Component</h3>
      <p>This tests if notification navigation works. Remove after testing.</p>
      
      <button
        onClick={handleTestClick}
        style={{
          padding: '12px 24px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        🧪 Test Navigate to Petty Cash
      </button>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Open browser console (Press F12)</li>
          <li>Click the button above</li>
          <li>Check console for messages</li>
          <li>Page should redirect to /petty-cash</li>
        </ol>
        
        <p><strong>Expected console output:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
=== TEST NOTIFICATION CLICK ===
Test notification: ...
Parsed metadata: ...
Attempting to navigate to /petty-cash
✅ Navigation called successfully
        </pre>
      </div>
    </div>
  );
}

export default NotificationTest;
