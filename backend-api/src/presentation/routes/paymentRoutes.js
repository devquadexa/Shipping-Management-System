/**
 * Payment Routes
 * Defines API endpoints for payment management
 */
const express = require('express');
const router = express.Router();

// Middleware
const { auth, checkRole } = require('../../middleware/auth');

// Dependencies
const { getConnection, sql } = require('../../config/database');
const MSSQLPaymentRepository = require('../../infrastructure/repositories/MSSQLPaymentRepository');

// Use Cases
const CreatePayment = require('../../application/use-cases/payment/CreatePayment');
const GetAllPayments = require('../../application/use-cases/payment/GetAllPayments');
const UpdatePaymentStatus = require('../../application/use-cases/payment/UpdatePaymentStatus');

// Controller
const PaymentController = require('../controllers/PaymentController');

// Initialize
const paymentRepository = new MSSQLPaymentRepository(getConnection, sql);
const createPayment = new CreatePayment(paymentRepository);
const getAllPayments = new GetAllPayments(paymentRepository);
const updatePaymentStatus = new UpdatePaymentStatus(paymentRepository);

const paymentController = new PaymentController(
  createPayment,
  getAllPayments,
  updatePaymentStatus
);

// Routes
// Only Admin, Super Admin, and Manager can access payment management

// Create payment (typically called automatically when marking invoice as paid)
router.post(
  '/',
  auth,
  checkRole('Admin', 'Super Admin', 'Manager'),
  (req, res) => paymentController.create(req, res)
);

// Get all payments with optional filters
router.get(
  '/all',
  auth,
  checkRole('Admin', 'Super Admin', 'Manager'),
  (req, res) => paymentController.getAll(req, res)
);

// Update payment status (mark as Cleared or Bounced)
router.put(
  '/:paymentId/status',
  auth,
  checkRole('Admin', 'Super Admin', 'Manager'),
  (req, res) => paymentController.updateStatus(req, res)
);

module.exports = router;
