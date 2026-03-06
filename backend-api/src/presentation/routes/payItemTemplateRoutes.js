const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const PayItemTemplateController = require('../controllers/PayItemTemplateController');
  const controller = new PayItemTemplateController(container);

  // Get all templates (grouped by category)
  router.get('/all', 
    auth, 
    checkRole('Admin', 'Super Admin'), 
    (req, res) => controller.getAll(req, res)
  );

  // Get templates by category (All authenticated users can view)
  router.get('/category/:category', 
    auth, 
    (req, res) => controller.getByCategory(req, res)
  );

  // Create new template
  router.post('/', 
    auth, 
    checkRole('Admin', 'Super Admin'), 
    (req, res) => controller.create(req, res)
  );

  // Update template
  router.put('/:id', 
    auth, 
    checkRole('Admin', 'Super Admin'), 
    (req, res) => controller.update(req, res)
  );

  // Delete template
  router.delete('/:id', 
    auth, 
    checkRole('Admin', 'Super Admin'), 
    (req, res) => controller.delete(req, res)
  );

  return router;
};
