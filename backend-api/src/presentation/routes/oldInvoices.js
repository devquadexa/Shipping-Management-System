const express = require('express');
const { auth } = require('../../middleware/auth');

module.exports = (container) => {
  const router = express.Router();

  // Get all old invoices
  router.get('/', auth, async (req, res) => {
    try {
      const getAllOldInvoices = container.resolve('getAllOldInvoices');
      const invoices = await getAllOldInvoices.execute();
      res.json(invoices);
    } catch (error) {
      console.error('Error fetching old invoices:', error);
      res.status(500).json({ message: 'Failed to fetch old invoices', error: error.message });
    }
  });

  // Get old invoice by ID
  router.get('/:id', auth, async (req, res) => {
    try {
      const oldInvoiceRepository = container.resolve('oldInvoiceRepository');
      const invoice = await oldInvoiceRepository.findById(parseInt(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: 'Old invoice not found' });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Error fetching old invoice:', error);
      res.status(500).json({ message: 'Failed to fetch old invoice', error: error.message });
    }
  });

  // Create new old invoice
  router.post('/', auth, async (req, res) => {
    try {
      const createOldInvoice = container.resolve('createOldInvoice');
      const invoice = await createOldInvoice.execute({
        ...req.body,
        createdBy: req.user.userId
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating old invoice:', error);
      res.status(500).json({ message: 'Failed to create old invoice', error: error.message });
    }
  });

  // Update old invoice
  router.put('/:id', auth, async (req, res) => {
    try {
      const updateOldInvoice = container.resolve('updateOldInvoice');
      const invoice = await updateOldInvoice.execute(parseInt(req.params.id), req.body);
      res.json(invoice);
    } catch (error) {
      console.error('Error updating old invoice:', error);
      res.status(500).json({ message: 'Failed to update old invoice', error: error.message });
    }
  });

  // Delete old invoice
  router.delete('/:id', auth, async (req, res) => {
    try {
      const deleteOldInvoice = container.resolve('deleteOldInvoice');
      await deleteOldInvoice.execute(parseInt(req.params.id));
      res.json({ message: 'Old invoice deleted successfully' });
    } catch (error) {
      console.error('Error deleting old invoice:', error);
      res.status(500).json({ message: 'Failed to delete old invoice', error: error.message });
    }
  });

  // Add payment to old invoice
  router.post('/:id/payments', auth, async (req, res) => {
    try {
      const addPaymentToOldInvoice = container.resolve('addPaymentToOldInvoice');
      const invoice = await addPaymentToOldInvoice.execute(parseInt(req.params.id), {
        ...req.body,
        createdBy: req.user.userId
      });
      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error adding payment:', error);
      res.status(500).json({ message: 'Failed to add payment', error: error.message });
    }
  });

  // Delete payment from old invoice
  router.delete('/payments/:paymentId', auth, async (req, res) => {
    try {
      const deletePaymentFromOldInvoice = container.resolve('deletePaymentFromOldInvoice');
      const invoice = await deletePaymentFromOldInvoice.execute(parseInt(req.params.paymentId));
      res.json(invoice);
    } catch (error) {
      console.error('Error deleting payment:', error);
      res.status(500).json({ message: 'Failed to delete payment', error: error.message });
    }
  });

  return router;
};

module.exports = module.exports;
