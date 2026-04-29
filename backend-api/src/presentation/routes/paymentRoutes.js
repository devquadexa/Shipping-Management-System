/**
 * Payment Routes
 */
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');
const { getConnection, sql } = require('../../config/database');
const MSSQLPaymentRepository = require('../../infrastructure/repositories/MSSQLPaymentRepository');
const MSSQLCustomerRepository = require('../../infrastructure/repositories/MSSQLCustomerRepository');
const MSSQLContactPersonRepository = require('../../infrastructure/repositories/MSSQLContactPersonRepository');
const MSSQLCategoryRepository = require('../../infrastructure/repositories/MSSQLCategoryRepository');
const MSSQLBillRepository = require('../../infrastructure/repositories/MSSQLBillRepository');
const CreatePayment = require('../../application/use-cases/payment/CreatePayment');
const GetAllPayments = require('../../application/use-cases/payment/GetAllPayments');
const UpdatePaymentStatus = require('../../application/use-cases/payment/UpdatePaymentStatus');
const PaymentController = require('../controllers/PaymentController');

const contactPersonRepository = new MSSQLContactPersonRepository(getConnection, sql);
const categoryRepository = new MSSQLCategoryRepository(getConnection, sql);
const customerRepository = new MSSQLCustomerRepository(getConnection, sql, contactPersonRepository, categoryRepository);
const paymentRepository = new MSSQLPaymentRepository(getConnection, sql);
const billRepository = new MSSQLBillRepository(getConnection, sql);

const createPayment = new CreatePayment(paymentRepository);
const getAllPayments = new GetAllPayments(paymentRepository, customerRepository, billRepository);
const updatePaymentStatus = new UpdatePaymentStatus(paymentRepository);

const paymentController = new PaymentController(
  createPayment,
  getAllPayments,
  updatePaymentStatus,
  paymentRepository
);

const roles = ['Admin', 'Super Admin', 'Manager'];

// Get all payments
router.get('/all', auth, checkRole(...roles), (req, res) => paymentController.getAll(req, res));

// Get payments by bill ID
router.get('/bill/:billId', auth, checkRole(...roles), (req, res) => paymentController.getPaymentsByBill(req, res));

// Get cheques with remaining balance for a specific customer (for Existing cheque dropdown)
router.get('/customer/:customerId/cheques', auth, checkRole(...roles), (req, res) => paymentController.getChequesByCustomer(req, res));

// Look up cheque by number (for auto-fill in billing modal)
router.get('/cheque/:chequeNumber', auth, checkRole(...roles), (req, res) => paymentController.getChequeByNumber(req, res));

// Create payment
router.post('/', auth, checkRole(...roles), (req, res) => paymentController.create(req, res));

// Update single payment status
router.put('/:paymentId/status', auth, checkRole(...roles), (req, res) => paymentController.updateStatus(req, res));

// Update ALL payments for a cheque (Cleared / Bounced applies to whole cheque)
router.put('/cheque/:chequeNumber/status', auth, checkRole(...roles), (req, res) => paymentController.updateChequeStatus(req, res));

module.exports = router;
