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

// Report routes
router.get('/report/export/pdf', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const ExportTransportersReportPDF = require('../../application/use-cases/transporter/ExportTransportersReportPDF');
    const jobRepository = container.get('jobRepository');
    const transporterRepository = container.get('transporterRepository');
    
    const exportUseCase = new ExportTransportersReportPDF(jobRepository, transporterRepository);
    const pdfBuffer = await exportUseCase.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Transporters_Report_${label}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting transporters report:', error);
    res.status(500).json({ message: error.message || 'Error generating PDF' });
  }
});

router.get('/report/export/excel', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const ExportTransportersReportExcel = require('../../application/use-cases/transporter/ExportTransportersReportExcel');
    const jobRepository = container.get('jobRepository');
    const transporterRepository = container.get('transporterRepository');
    
    const exportUseCase = new ExportTransportersReportExcel(jobRepository, transporterRepository);
    const excelBuffer = await exportUseCase.execute(fromDate, toDate);
    
    const label = fromDate === toDate ? fromDate : `${fromDate}_to_${toDate}`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Transporters_Report_${label}.xlsx"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error exporting transporters report:', error);
    res.status(500).json({ message: error.message || 'Error generating Excel' });
  }
});

module.exports = router;