const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const InvoiceReviewController = require('../controllers/InvoiceReviewController');

// Send invoice review to clerk
router.post('/', auth, InvoiceReviewController.sendReview);

// Get all reviews (for admin/manager)
router.get('/', auth, InvoiceReviewController.getAllReviews);

// Get reviews for a specific clerk
router.get('/clerk/:clerkId', auth, InvoiceReviewController.getReviewsForClerk);

// Get reviews for a specific job
router.get('/job/:jobId', auth, InvoiceReviewController.getReviewsByJob);

// Approve a review
router.patch('/:reviewId/approve', auth, InvoiceReviewController.approveReview);

// Reject a review
router.patch('/:reviewId/reject', auth, InvoiceReviewController.rejectReview);

// Get a specific review
router.get('/:reviewId', auth, InvoiceReviewController.getReviewById);

module.exports = router;
