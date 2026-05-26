# Target Pages Highlight & Scroll Implementation Guide

## Overview
This guide shows how to update Jobs, Petty Cash, and Billing pages to handle notification redirects with highlighting and scrolling.

## Implementation Pattern

### Step 1: Import useLocation Hook
```javascript
import { useLocation } from 'react-router-dom';
```

### Step 2: Read Location State
```javascript
function Jobs() {
  const location = useLocation();
  const { highlightJobId, scrollToJob } = location.state || {};
  
  // ... rest of component
}
```

### Step 3: Add Highlight Effect
```javascript
useEffect(() => {
  if (highlightJobId && scrollToJob) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const element = document.getElementById(`job-${highlightJobId}`);
      if (element) {
        // Scroll to element
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight class
        element.classList.add('highlight-item');
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.classList.remove('highlight-item');
        }, 3000);
      }
    }, 300);
  }
}, [highlightJobId, scrollToJob]);
```

### Step 4: Add ID to Items
```javascript
// In your map/render function
jobs.map(job => (
  <div 
    key={job.jobId} 
    id={`job-${job.jobId}`}  // Add this ID
    className="job-card"
  >
    {/* job content */}
  </div>
))
```

### Step 5: Add CSS for Highlight
```css
/* Add to your component's CSS file */
.highlight-item {
  animation: highlight-pulse 3s ease-in-out;
  position: relative;
}

@keyframes highlight-pulse {
  0% {
    background-color: #fef3c7;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
  }
  50% {
    background-color: #fde68a;
    box-shadow: 0 0 0 10px rgba(251, 191, 36, 0);
  }
  100% {
    background-color: transparent;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
  }
}

/* Alternative: Simple fade highlight */
@keyframes highlight-fade {
  0% { 
    background-color: #fef3c7; 
    border-color: #fbbf24;
  }
  100% { 
    background-color: transparent; 
    border-color: inherit;
  }
}
```

## Example Implementations

### Jobs.js Example

```javascript
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Jobs() {
  const { user } = useAuth();
  const location = useLocation();
  const { highlightJobId, scrollToJob } = location.state || {};
  
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle notification redirect
  useEffect(() => {
    if (highlightJobId && scrollToJob && jobs.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`job-${highlightJobId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-item');
          setTimeout(() => element.classList.remove('highlight-item'), 3000);
        }
      }, 300);
    }
  }, [highlightJobId, scrollToJob, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  return (
    <div className="jobs-container">
      <h1>Jobs</h1>
      <div className="jobs-list">
        {jobs.map(job => (
          <div 
            key={job.jobId} 
            id={`job-${job.jobId}`}
            className="job-card"
          >
            <h3>{job.jobId}</h3>
            <p>Customer: {job.customerId}</p>
            <p>Status: {job.status}</p>
            {/* ... more job details */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Jobs;
```

### PettyCash.js Example

```javascript
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function PettyCash() {
  const { user } = useAuth();
  const location = useLocation();
  const { highlightAssignmentId, scrollToAssignment, jobId } = location.state || {};
  
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Handle notification redirect
  useEffect(() => {
    if (highlightAssignmentId && scrollToAssignment && assignments.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`assignment-${highlightAssignmentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-item');
          setTimeout(() => element.classList.remove('highlight-item'), 3000);
        }
      }, 300);
    }
  }, [highlightAssignmentId, scrollToAssignment, assignments]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/petty-cash-assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  return (
    <div className="petty-cash-container">
      <h1>Petty Cash Assignments</h1>
      <div className="assignments-list">
        {assignments.map(assignment => (
          <div 
            key={assignment.assignmentId} 
            id={`assignment-${assignment.assignmentId}`}
            className="assignment-card"
          >
            <h3>Assignment #{assignment.assignmentId}</h3>
            <p>Job: {assignment.jobId}</p>
            <p>Amount: LKR {assignment.assignedAmount}</p>
            {/* ... more assignment details */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PettyCash;
```

### Billing.js Example

```javascript
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Billing() {
  const { user } = useAuth();
  const location = useLocation();
  const { highlightBillId, scrollToBill } = location.state || {};
  
  const [bills, setBills] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  // Handle notification redirect
  useEffect(() => {
    if (highlightBillId && scrollToBill && bills.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`bill-${highlightBillId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('highlight-item');
          setTimeout(() => element.classList.remove('highlight-item'), 3000);
        }
      }, 300);
    }
  }, [highlightBillId, scrollToBill, bills]);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/api/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  return (
    <div className="billing-container">
      <h1>Billing</h1>
      <div className="bills-list">
        {bills.map(bill => (
          <div 
            key={bill.billId} 
            id={`bill-${bill.billId}`}
            className="bill-card"
          >
            <h3>{bill.billId}</h3>
            <p>Customer: {bill.customerId}</p>
            <p>Amount: LKR {bill.totalAmount}</p>
            {/* ... more bill details */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Billing;
```

## CSS Styles to Add

### Option 1: Pulse Effect (Recommended)
```css
.highlight-item {
  animation: highlight-pulse 3s ease-in-out;
  position: relative;
}

@keyframes highlight-pulse {
  0% {
    background-color: #fef3c7;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
    transform: scale(1);
  }
  25% {
    background-color: #fde68a;
    box-shadow: 0 0 0 10px rgba(251, 191, 36, 0);
    transform: scale(1.02);
  }
  50% {
    background-color: #fef3c7;
    transform: scale(1);
  }
  100% {
    background-color: transparent;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
    transform: scale(1);
  }
}
```

### Option 2: Simple Fade
```css
.highlight-item {
  animation: highlight-fade 3s ease-in-out;
}

@keyframes highlight-fade {
  0% { 
    background-color: #fef3c7; 
    border: 2px solid #fbbf24;
  }
  100% { 
    background-color: transparent; 
    border: 2px solid transparent;
  }
}
```

### Option 3: Glow Effect
```css
.highlight-item {
  animation: highlight-glow 3s ease-in-out;
}

@keyframes highlight-glow {
  0% {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
    background-color: #fef3c7;
  }
  50% {
    box-shadow: 0 0 30px rgba(251, 191, 36, 0.6);
    background-color: #fde68a;
  }
  100% {
    box-shadow: none;
    background-color: transparent;
  }
}
```

## Testing Checklist

### For Each Page (Jobs, PettyCash, Billing):

- [ ] Import `useLocation` from react-router-dom
- [ ] Extract state from location
- [ ] Add useEffect to handle highlight/scroll
- [ ] Add ID to each item in the list
- [ ] Add highlight CSS animation
- [ ] Test by clicking notification
- [ ] Verify scroll to item works
- [ ] Verify highlight animation plays
- [ ] Verify highlight removes after 3 seconds
- [ ] Test with items at top, middle, and bottom of list
- [ ] Test when item doesn't exist (should not crash)

## Common Issues & Solutions

### Issue 1: Element Not Found
**Problem**: `element` is null when trying to scroll
**Solution**: Add delay and check if data is loaded
```javascript
useEffect(() => {
  if (highlightJobId && jobs.length > 0) {
    setTimeout(() => {
      const element = document.getElementById(`job-${highlightJobId}`);
      if (element) {
        // ... scroll and highlight
      } else {
        console.warn(`Job ${highlightJobId} not found in list`);
      }
    }, 300);
  }
}, [highlightJobId, jobs]);
```

### Issue 2: Scroll Not Smooth
**Problem**: Page jumps instead of smooth scroll
**Solution**: Ensure `behavior: 'smooth'` is set
```javascript
element.scrollIntoView({ 
  behavior: 'smooth',  // Important!
  block: 'center'      // Centers the element
});
```

### Issue 3: Highlight Not Visible
**Problem**: Animation plays but not visible
**Solution**: Check CSS specificity and ensure element has position
```css
.highlight-item {
  animation: highlight-pulse 3s ease-in-out;
  position: relative;  /* Important for some animations */
  z-index: 1;          /* Ensure it's above other elements */
}
```

### Issue 4: Multiple Highlights
**Problem**: Multiple items get highlighted
**Solution**: Ensure IDs are unique
```javascript
// Use unique identifier
id={`job-${job.jobId}`}  // Good
id={`job-${index}`}      // Bad - index can change
```

## Best Practices

1. **Always check if element exists** before manipulating
2. **Add delay** to ensure DOM is ready (300ms recommended)
3. **Clean up** - remove highlight class after animation
4. **Use unique IDs** - based on database IDs, not array indices
5. **Handle edge cases** - item not found, data not loaded yet
6. **Test on different screen sizes** - ensure scroll works on mobile
7. **Provide fallback** - if item not found, show message or scroll to top

## Quick Implementation Checklist

For each target page:

1. ✅ Add `import { useLocation } from 'react-router-dom';`
2. ✅ Add `const location = useLocation();`
3. ✅ Extract state: `const { highlightJobId, scrollToJob } = location.state || {};`
4. ✅ Add useEffect for highlight/scroll logic
5. ✅ Add `id={...}` to each item in list
6. ✅ Add `.highlight-item` CSS animation
7. ✅ Test with notification click

---

**Status**: Ready for Implementation
**Estimated Time**: 15-20 minutes per page
**Difficulty**: Easy
