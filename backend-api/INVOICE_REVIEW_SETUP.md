# Invoice Review System - Setup Guide

## Overview
This document provides instructions for setting up the Invoice Review System that allows Admin/Manager to send invoice reviews to Waff Clerks for approval or rejection.

## Frontend Implementation (Already Complete)

### Components Created:
1. **InvoiceReviewPage.js** - Main page for clerks to view and manage reviews
2. **RejectionReasonModal.js** - Modal for providing rejection reasons
3. **ReviewInvoiceModal.js** - Modal for sending reviews (in Billing component)

### Features:
- Clerks can view all reviews sent to them
- See complete pay items with amounts
- Approve reviews with one click
- Reject with detailed reason
- Filter by status (Pending/Approved/Rejected)
- Pagination support
- Real-time notifications

### Routes:
- `/invoice-reviews` - Invoice review page (Waff Clerk only)

## Backend Implementation

### Step 1: Create Database Table

Run the SQL migration to create the `invoice_reviews` table:

```bash
sqlcmd -S your_server -d your_database -i backend-api/create-invoice-reviews-table.sql
```

Or manually execute in SQL Server Management Studio:

```sql
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'invoice_reviews')
BEGIN
  CREATE TABLE invoice_reviews (
    reviewId VARCHAR(50) PRIMARY KEY,
    jobId VARCHAR(50) NOT NULL,
    clerkId VARCHAR(50) NOT NULL,
    sentBy VARCHAR(50) NOT NULL,
    reviewNotes NVARCHAR(MAX) NOT NULL,
    payItems NVARCHAR(MAX),
    invoiceDetails NVARCHAR(MAX),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    rejectionReason NVARCHAR(MAX),
    createdDate DATETIME DEFAULT GETDATE(),
    updatedDate DATETIME DEFAULT GETDATE(),
    
    FOREIGN KEY (jobId) REFERENCES Jobs(JobId) ON DELETE NO ACTION,
    FOREIGN KEY (clerkId) REFERENCES Users(UserId) ON DELETE NO ACTION,
    FOREIGN KEY (sentBy) REFERENCES Users(UserId) ON DELETE NO ACTION
  );
  
  -- Create indexes
  CREATE INDEX idx_clerkId ON invoice_reviews(clerkId);
  CREATE INDEX idx_jobId ON invoice_reviews(jobId);
  CREATE INDEX idx_sentBy ON invoice_reviews(sentBy);
  CREATE INDEX idx_status ON invoice_reviews(status);
  CREATE INDEX idx_createdDate ON invoice_reviews(createdDate);
  CREATE INDEX idx_clerk_status ON invoice_reviews(clerkId, status);
  CREATE INDEX idx_job_status ON invoice_reviews(jobId, status);
END
```

### Step 2: Backend Files Created

The following files have been created and are ready to use:

1. **backend-api/src/presentation/routes/invoiceReviewRoutes.js**
   - Defines all API endpoints for invoice reviews
   - Handles routing to the controller

2. **backend-api/src/presentation/controllers/InvoiceReviewController.js**
   - Implements all business logic for invoice reviews
   - Handles database operations
   - Creates notifications for users

3. **backend-api/src/index.js** (Updated)
   - Added import for invoiceReviewRoutes
   - Registered the route at `/api/invoice-reviews`

### Step 3: API Endpoints

The following endpoints are now available:

#### Send Invoice Review (Admin/Manager)
```
POST /api/invoice-reviews
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "jobId": "job-123",
  "clerkId": "clerk-456",
  "reviewNotes": "Please review the pay items and amounts",
  "payItems": [
    {
      "description": "Service Fee",
      "actualCost": 1000,
      "billingAmount": 1200,
      "paidBy": "John Doe"
    }
  ],
  "invoiceDetails": {
    "jobReference": "job-123",
    "customer": "customer-789",
    "shipmentCategory": "FCL",
    "totalAmount": 1200
  }
}

Response:
{
  "message": "Invoice review sent successfully",
  "reviewId": "review-uuid",
  "clerk": "Clerk Name"
}
```

#### Get All Reviews (Admin/Manager)
```
GET /api/invoice-reviews
Authorization: Bearer {token}

Response: Array of all invoice reviews
```

#### Get Reviews for Clerk
```
GET /api/invoice-reviews/clerk/{clerkId}
Authorization: Bearer {token}

Response: Array of reviews for the specific clerk
```

#### Get Reviews for Job
```
GET /api/invoice-reviews/job/{jobId}
Authorization: Bearer {token}

Response: Array of reviews for the specific job
```

#### Get Specific Review
```
GET /api/invoice-reviews/{reviewId}
Authorization: Bearer {token}

Response: Single review object with all details
```

#### Approve Review (Clerk)
```
PATCH /api/invoice-reviews/{reviewId}/approve
Authorization: Bearer {token}

Response:
{
  "message": "Review approved successfully",
  "reviewId": "review-uuid"
}
```

#### Reject Review (Clerk)
```
PATCH /api/invoice-reviews/{reviewId}/reject
Content-Type: application/json
Authorization: Bearer {token}

Body:
{
  "rejectionReason": "The billing amounts don't match the actual costs"
}

Response:
{
  "message": "Review rejected successfully",
  "reviewId": "review-uuid"
}
```

### Step 4: Notifications

When reviews are sent, approved, or rejected, notifications are automatically created:

- **Review Sent**: Clerk receives notification about new review
- **Review Approved**: Admin/Manager receives notification that clerk approved
- **Review Rejected**: Admin/Manager receives notification with rejection reason

Notifications are stored in the `notifications` table and can be retrieved via the notifications API.

### Step 5: Testing

#### Test Sending a Review:
1. Login as Admin/Manager
2. Go to Billing page
3. Select a job with pay items
4. Click "📋 Review Invoice" button
5. Select a clerk and add review notes
6. Click "✓ Send Review to Clerk"

#### Test Approving/Rejecting:
1. Login as Waff Clerk
2. Go to "Invoice Reviews" page
3. Click on a pending review to expand
4. Review the pay items and notes
5. Click "✓ Approve" or "✗ Reject"
6. If rejecting, provide a reason

### Step 6: Error Handling

The system includes comprehensive error handling:

- **Missing Fields**: Returns 400 with message about required fields
- **Invalid Clerk**: Returns 404 if clerk not found
- **Database Errors**: Returns 500 with error details
- **Validation Errors**: Returns 400 with specific validation message

### Step 7: Logging

All operations are logged to the console for debugging:

```javascript
console.log('Sending review data:', reviewData);
console.log('Review sent successfully:', response);
console.log('Error details:', error.response?.data || error.message);
```

## Database Schema

### invoice_reviews Table (SQL Server)

| Column | Type | Description |
|--------|------|-------------|
| reviewId | VARCHAR(36) | Primary key, UUID |
| jobId | VARCHAR(36) | Foreign key to jobs table |
| clerkId | VARCHAR(36) | Foreign key to users table (clerk) |
| sentBy | VARCHAR(36) | Foreign key to users table (admin/manager) |
| reviewNotes | NVARCHAR(MAX) | Notes from admin/manager |
| payItems | NVARCHAR(MAX) | JSON array of pay items with amounts |
| invoiceDetails | NVARCHAR(MAX) | JSON invoice details (category, total, etc.) |
| status | VARCHAR(20) | Pending, Approved, or Rejected |
| rejectionReason | NVARCHAR(MAX) | Reason for rejection (if rejected) |
| createdDate | DATETIME | When review was created |
| updatedDate | DATETIME | When review was last updated |

## Frontend API Service

The `invoiceReviewService` in `frontend/src/api/services/invoiceReviewService.js` provides:

```javascript
// Send review
invoiceReviewService.sendReview(reviewData)

// Get reviews for clerk
invoiceReviewService.getReviewsForClerk(clerkId)

// Get reviews for job
invoiceReviewService.getReviewsByJob(jobId)

// Approve review
invoiceReviewService.approveReview(reviewId)

// Reject review
invoiceReviewService.rejectReview(reviewId, reason)
```

## Troubleshooting

### Error: "Error sending invoice review"
- Check that the backend route is registered in `index.js`
- Verify the database table exists
- Check browser console for detailed error message
- Ensure clerk is assigned to the job

### Error: "reviews.filter is not a function"
- This is fixed in the latest version
- Ensure you're using the updated InvoiceReviewPage.js
- Check that the API returns an array

### Notifications Not Appearing
- Verify the notifications table exists
- Check that the notification routes are registered
- Ensure the user is logged in to receive notifications

## Next Steps

1. Run the SQL migration to create the table
2. Restart the backend server
3. Test the feature end-to-end
4. Monitor logs for any errors
5. Adjust notification preferences as needed

## Support

For issues or questions, check:
- Browser console for frontend errors
- Backend logs for server errors
- Database for data integrity
- Network tab for API response details
