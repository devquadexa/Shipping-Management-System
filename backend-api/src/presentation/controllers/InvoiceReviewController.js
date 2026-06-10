const { getConnection, sql } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const container = require('../../infrastructure/di/container');

class InvoiceReviewController {
  static async sendReview(req, res) {
    const { jobId, clerkId, reviewNotes, payItems, invoiceDetails } = req.body;
    const userId = req.user?.userId;

    try {
      // Validate required fields
      if (!jobId || !clerkId || !reviewNotes) {
        return res.status(400).json({
          message: 'Missing required fields: jobId, clerkId, reviewNotes'
        });
      }

      const reviewId = uuidv4();
      const now = new Date();

      // Get database connection
      const pool = await getConnection();

      // Insert invoice review
      await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .input('jobId', sql.VarChar(50), jobId)
        .input('clerkId', sql.VarChar(50), clerkId)
        .input('sentBy', sql.VarChar(50), userId)
        .input('reviewNotes', sql.NVarChar(sql.MAX), reviewNotes)
        .input('payItems', sql.NVarChar(sql.MAX), JSON.stringify(payItems || []))
        .input('invoiceDetails', sql.NVarChar(sql.MAX), JSON.stringify(invoiceDetails || {}))
        .input('status', sql.VarChar(20), 'Pending')
        .input('createdDate', sql.DateTime, now)
        .input('updatedDate', sql.DateTime, now)
        .query(`
          INSERT INTO invoice_reviews (
            reviewId, jobId, clerkId, sentBy, reviewNotes, payItems, 
            invoiceDetails, status, createdDate, updatedDate
          ) VALUES (
            @reviewId, @jobId, @clerkId, @sentBy, @reviewNotes, @payItems,
            @invoiceDetails, @status, @createdDate, @updatedDate
          )
        `);

      // Get clerk and sender details
      const clerkResult = await pool.request()
        .input('clerkId', sql.VarChar(50), clerkId)
        .query('SELECT UserId, FullName, Email FROM Users WHERE UserId = @clerkId');
      const clerk = clerkResult.recordset[0];

      const senderResult = await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .query('SELECT UserId, FullName FROM Users WHERE UserId = @userId');
      const sender = senderResult.recordset[0];

      // Create notification for the clerk
      try {
        const createNotification = container.get('createNotification');
        await createNotification.execute({
          userId: clerkId,
          type: 'invoice_review',
          title: 'New Invoice Review',
          message: `${sender?.FullName || 'Admin'} sent you a new invoice review for job ${jobId}`,
          relatedId: reviewId,
          relatedType: 'INVOICE_REVIEW',
          createdBy: userId
        });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the request if notification creation fails
      }

      res.status(201).json({
        message: 'Invoice review sent successfully',
        reviewId,
        clerk: clerk?.FullName
      });
    } catch (error) {
      console.error('Error sending invoice review:', error);
      res.status(500).json({
        message: 'Error sending invoice review',
        error: error.message
      });
    }
  }

  static async getAllReviews(req, res) {
    try {
      const pool = await getConnection();

      const result = await pool.request().query(`
        SELECT 
          ir.*, 
          u.FullName as sentByName,
          c.FullName as clerkName
        FROM invoice_reviews ir
        LEFT JOIN Users u ON ir.sentBy = u.UserId
        LEFT JOIN Users c ON ir.clerkId = c.UserId
        ORDER BY ir.createdDate DESC
      `);

      // Parse JSON fields
      const parsedReviews = result.recordset.map(review => ({
        ...review,
        payItems: review.payItems ? JSON.parse(review.payItems) : [],
        invoiceDetails: review.invoiceDetails ? JSON.parse(review.invoiceDetails) : {}
      }));

      res.json(parsedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({
        message: 'Error fetching reviews',
        error: error.message
      });
    }
  }

  static async getReviewsForClerk(req, res) {
    const { clerkId } = req.params;

    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('clerkId', sql.VarChar(50), clerkId)
        .query(`
          SELECT 
            ir.*, 
            u.FullName as sentByName,
            c.FullName as clerkName
          FROM invoice_reviews ir
          LEFT JOIN Users u ON ir.sentBy = u.UserId
          LEFT JOIN Users c ON ir.clerkId = c.UserId
          WHERE ir.clerkId = @clerkId
          ORDER BY ir.createdDate DESC
        `);

      // Parse JSON fields
      const parsedReviews = result.recordset.map(review => ({
        ...review,
        payItems: review.payItems ? JSON.parse(review.payItems) : [],
        invoiceDetails: review.invoiceDetails ? JSON.parse(review.invoiceDetails) : {}
      }));

      res.json(parsedReviews);
    } catch (error) {
      console.error('Error fetching clerk reviews:', error);
      res.status(500).json({
        message: 'Error fetching reviews',
        error: error.message
      });
    }
  }

  static async getReviewsByJob(req, res) {
    const { jobId } = req.params;

    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('jobId', sql.VarChar(50), jobId)
        .query(`
          SELECT 
            ir.*, 
            u.FullName as sentByName,
            c.FullName as clerkName
          FROM invoice_reviews ir
          LEFT JOIN Users u ON ir.sentBy = u.UserId
          LEFT JOIN Users c ON ir.clerkId = c.UserId
          WHERE ir.jobId = @jobId
          ORDER BY ir.createdDate DESC
        `);

      // Parse JSON fields
      const parsedReviews = result.recordset.map(review => ({
        ...review,
        payItems: review.payItems ? JSON.parse(review.payItems) : [],
        invoiceDetails: review.invoiceDetails ? JSON.parse(review.invoiceDetails) : {}
      }));

      res.json(parsedReviews);
    } catch (error) {
      console.error('Error fetching job reviews:', error);
      res.status(500).json({
        message: 'Error fetching reviews',
        error: error.message
      });
    }
  }

  static async getReviewById(req, res) {
    const { reviewId } = req.params;

    try {
      const pool = await getConnection();

      const result = await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .query(`
          SELECT 
            ir.*, 
            u.FullName as sentByName,
            c.FullName as clerkName
          FROM invoice_reviews ir
          LEFT JOIN Users u ON ir.sentBy = u.UserId
          LEFT JOIN Users c ON ir.clerkId = c.UserId
          WHERE ir.reviewId = @reviewId
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ message: 'Review not found' });
      }

      const review = result.recordset[0];
      review.payItems = review.payItems ? JSON.parse(review.payItems) : [];
      review.invoiceDetails = review.invoiceDetails ? JSON.parse(review.invoiceDetails) : {};

      res.json(review);
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({
        message: 'Error fetching review',
        error: error.message
      });
    }
  }

  static async approveReview(req, res) {
    const { reviewId } = req.params;
    const userId = req.user?.userId;

    try {
      const now = new Date();
      const pool = await getConnection();

      // Update review status to Approved
      await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .input('updatedDate', sql.DateTime, now)
        .query(`
          UPDATE invoice_reviews 
          SET status = 'Approved', updatedDate = @updatedDate
          WHERE reviewId = @reviewId
        `);

      // Get review details
      const selectResult = await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .query(`
          SELECT ir.*, u.FullName as sentByName, c.FullName as clerkName
          FROM invoice_reviews ir
          LEFT JOIN Users u ON ir.sentBy = u.UserId
          LEFT JOIN Users c ON ir.clerkId = c.UserId
          WHERE ir.reviewId = @reviewId
        `);
      const review = selectResult.recordset[0];

      // Get approver details
      const approverResult = await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .query('SELECT FullName FROM Users WHERE UserId = @userId');
      const approver = approverResult.recordset[0];

      // Create notification for the person who sent the review
      try {
        const createNotification = container.get('createNotification');
        await createNotification.execute({
          userId: review.sentBy,
          type: 'invoice_review_approved',
          title: 'Invoice Review Approved',
          message: `${review.clerkName || 'Clerk'} approved the invoice review for job ${review.jobId}`,
          relatedId: reviewId,
          relatedType: 'INVOICE_REVIEW',
          createdBy: userId
        });
      } catch (notificationError) {
        console.error('Error creating approval notification:', notificationError);
      }

      res.json({
        message: 'Review approved successfully',
        reviewId
      });
    } catch (error) {
      console.error('Error approving review:', error);
      res.status(500).json({
        message: 'Error approving review',
        error: error.message
      });
    }
  }

  static async rejectReview(req, res) {
    const { reviewId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.userId;

    try {
      if (!rejectionReason) {
        return res.status(400).json({
          message: 'Rejection reason is required'
        });
      }

      const now = new Date();
      const pool = await getConnection();

      // Update review status to Rejected with reason
      await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .input('rejectionReason', sql.NVarChar(sql.MAX), rejectionReason)
        .input('updatedDate', sql.DateTime, now)
        .query(`
          UPDATE invoice_reviews 
          SET status = 'Rejected', rejectionReason = @rejectionReason, updatedDate = @updatedDate
          WHERE reviewId = @reviewId
        `);

      // Get review details
      const selectResult = await pool.request()
        .input('reviewId', sql.VarChar(50), reviewId)
        .query(`
          SELECT ir.*, u.FullName as sentByName, c.FullName as clerkName
          FROM invoice_reviews ir
          LEFT JOIN Users u ON ir.sentBy = u.UserId
          LEFT JOIN Users c ON ir.clerkId = c.UserId
          WHERE ir.reviewId = @reviewId
        `);
      const review = selectResult.recordset[0];

      // Get rejector details
      const rejectorResult = await pool.request()
        .input('userId', sql.VarChar(50), userId)
        .query('SELECT FullName FROM Users WHERE UserId = @userId');
      const rejector = rejectorResult.recordset[0];

      // Create notification for the person who sent the review
      try {
        const createNotification = container.get('createNotification');
        await createNotification.execute({
          userId: review.sentBy,
          type: 'invoice_review_rejected',
          title: 'Invoice Review Rejected',
          message: `${review.clerkName || 'Clerk'} rejected the invoice review for job ${review.jobId}. Reason: ${rejectionReason}`,
          relatedId: reviewId,
          relatedType: 'INVOICE_REVIEW',
          createdBy: userId
        });
      } catch (notificationError) {
        console.error('Error creating rejection notification:', notificationError);
      }

      res.json({
        message: 'Review rejected successfully',
        reviewId
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      res.status(500).json({
        message: 'Error rejecting review',
        error: error.message
      });
    }
  }
}

module.exports = InvoiceReviewController;
