/**
 * Petty Cash Routes (Clean Architecture)
 */
const express = require('express');
const { auth } = require('../../middleware/auth');
const container = require('../../infrastructure/di/container');
const PettyCashController = require('../controllers/PettyCashController');

const router = express.Router();

// Initialize controller with use cases from DI container
const pettyCashController = new PettyCashController(
  container.get('createPettyCashEntry'),
  container.get('getAllPettyCashEntries'),
  container.get('getPettyCashBalance')
);

// Routes
router.post('/', auth, (req, res) => 
  pettyCashController.create(req, res)
);

router.get('/', auth, (req, res) => 
  pettyCashController.getAll(req, res)
);

router.get('/balance', auth, (req, res) => 
  pettyCashController.getBalance(req, res)
);

module.exports = router;
