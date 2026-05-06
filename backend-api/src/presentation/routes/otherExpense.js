/**
 * Other Expense Routes
 */
const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../../middleware/auth');

module.exports = (container) => {
  const createOtherExpense = container.resolve('createOtherExpense');
  const getAllOtherExpenses = container.resolve('getAllOtherExpenses');
  const updateOtherExpense = container.resolve('updateOtherExpense');
  const deleteOtherExpense = container.resolve('deleteOtherExpense');
  const getOtherExpensesReport = container.resolve('getOtherExpensesReport');
  const exportOtherExpensesReportPDF = container.resolve('exportOtherExpensesReportPDF');
  const exportOtherExpensesReportExcel = container.resolve('exportOtherExpensesReportExcel');

  // Create expense
  router.post('/', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const expense = await createOtherExpense.execute(req.body, req.user.userId);
      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get all expenses
  router.get('/', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const filters = {
        category: req.query.category,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate
      };
      const expenses = await getAllOtherExpenses.execute(filters);
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update expense
  router.put('/:expenseId', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const expense = await updateOtherExpense.execute(req.params.expenseId, req.body);
      res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Delete expense
  router.delete('/:expenseId', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      await deleteOtherExpense.execute(req.params.expenseId);
      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get report
  router.get('/report/data', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const { fromDate, toDate, category } = req.query;
      const report = await getOtherExpensesReport.execute(fromDate, toDate, category);
      res.json(report);
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Export PDF
  router.get('/report/export/pdf', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const { fromDate, toDate, category } = req.query;
      const pdfBuffer = await exportOtherExpensesReportPDF.execute(fromDate, toDate, category);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Other_Expenses_Report_${fromDate}_to_${toDate}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Export Excel
  router.get('/report/export/excel', auth, checkRole('Admin', 'Super Admin', 'Manager'), async (req, res) => {
    try {
      const { fromDate, toDate, category } = req.query;
      const excelBuffer = await exportOtherExpensesReportExcel.execute(fromDate, toDate, category);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Other_Expenses_Report_${fromDate}_to_${toDate}.xlsx`);
      res.send(excelBuffer);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      res.status(400).json({ message: error.message });
    }
  });

  return router;
};
