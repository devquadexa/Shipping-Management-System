const express = require('express');
const router = express.Router();
const container = require('../../infrastructure/di/container');
const TransporterController = require('../controllers/TransporterController');
const { auth, checkRole } = require('../../middleware/auth');

const transporterController = new TransporterController(container);

router.get('/', auth, checkRole('Admin', 'Super Admin', 'Manager', 'Office Executive'), (req, res) => transporterController.getAll(req, res));
router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.create(req, res));
router.get('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.getById(req, res));
router.put('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.update(req, res));
router.delete('/:id', auth, checkRole('Admin', 'Super Admin', 'Manager'), (req, res) => transporterController.delete(req, res));

module.exports = router;