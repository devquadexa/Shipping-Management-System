/**
 * Petty Cash Report Routes
 * Endpoints for generating and exporting petty cash reports
 */
const express = require('express');
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const PettyCashReportController = require('../controllers/PettyCashReportController');
  const controller = new PettyCashReportController(
    container.get('getPettyCashReportByDate'),
    container.get('exportPettyCashReportPDF'),
    container.get('exportPettyCashReportExcel')
  );

  const router = express.Router();

  // Get report data for a specific date range (Admin/Super Admin only)
  router.get(
    '/report',
    auth,
    (req, res) => controller.getReport(req, res)
  );

  // Export report to PDF (Admin/Super Admin only)
  router.get(
    '/report/export/pdf',
    auth,
    (req, res) => controller.exportPDF(req, res)
  );

  // Export report to Excel (Admin/Super Admin only)
  router.get(
    '/report/export/excel',
    auth,
    (req, res) => controller.exportExcel(req, res)
  );

  return router;
};
