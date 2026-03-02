/**
 * Auth Routes
 * Clean Architecture version
 */
const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const AuthController = require('../controllers/AuthController');
const { auth, checkRole } = require('../../middleware/auth');

// Initialize controller
const authController = new AuthController(container);

// Routes
router.post('/login', (req, res) => authController.login(req, res));

router.post('/register', 
  auth, 
  checkRole('Super Admin'), 
  (req, res) => authController.register(req, res)
);

router.get('/me', auth, (req, res) => authController.getMe(req, res));

router.get('/users', 
  auth, 
  checkRole('Super Admin'), 
  (req, res) => authController.getUsers(req, res)
);

module.exports = router;
