const express = require('express');
const { auth, checkRole } = require('../middleware/auth');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

const TAX_RATE = 0.10;

router.post('/', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { jobId, customerId, amount } = req.body;
    const pool = await getConnection();
    
    // Get next bill ID
    const maxId = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(BillId, 5, 4) AS INT)) as MaxId FROM Bills');
    
    const nextId = (maxId.recordset[0].MaxId || 0) + 1;
    const billId = `BILL${String(nextId).padStart(4, '0')}`;
    
    const tax = amount * TAX_RATE;
    const total = amount + tax;
    
    // Insert bill
    await pool.request()
      .input('billId', sql.VarChar, billId)
      .input('jobId', sql.VarChar, jobId)
      .input('customerId', sql.VarChar, customerId)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('tax', sql.Decimal(10, 2), tax)
      .input('total', sql.Decimal(10, 2), total)
      .query(`INSERT INTO Bills (BillId, JobId, CustomerId, Amount, Tax, Total, PaymentStatus, CreatedDate)
              VALUES (@billId, @jobId, @customerId, @amount, @tax, @total, 'Unpaid', GETDATE())`);
    
    const result = await pool.request()
      .input('billId', sql.VarChar, billId)
      .query('SELECT * FROM Bills WHERE BillId = @billId');
    
    const bill = result.recordset[0];
    res.status(201).json({
      billId: bill.BillId,
      jobId: bill.JobId,
      customerId: bill.CustomerId,
      amount: bill.Amount,
      tax: bill.Tax,
      total: bill.Total,
      paymentStatus: bill.PaymentStatus,
      createdDate: bill.CreatedDate
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Bills ORDER BY CreatedDate DESC');
    
    const bills = result.recordset.map(b => ({
      billId: b.BillId,
      jobId: b.JobId,
      customerId: b.CustomerId,
      amount: b.Amount,
      tax: b.Tax,
      total: b.Total,
      paymentStatus: b.PaymentStatus,
      createdDate: b.CreatedDate
    }));
    
    res.json(bills);
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('billId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Bills WHERE BillId = @billId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const bill = result.recordset[0];
    res.json({
      billId: bill.BillId,
      jobId: bill.JobId,
      customerId: bill.CustomerId,
      amount: bill.Amount,
      tax: bill.Tax,
      total: bill.Total,
      paymentStatus: bill.PaymentStatus,
      createdDate: bill.CreatedDate
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/pay', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const pool = await getConnection();
    
    await pool.request()
      .input('billId', sql.VarChar, req.params.id)
      .query("UPDATE Bills SET PaymentStatus = 'Paid' WHERE BillId = @billId");
    
    const result = await pool.request()
      .input('billId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Bills WHERE BillId = @billId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const bill = result.recordset[0];
    res.json({
      billId: bill.BillId,
      jobId: bill.JobId,
      customerId: bill.CustomerId,
      amount: bill.Amount,
      tax: bill.Tax,
      total: bill.Total,
      paymentStatus: bill.PaymentStatus,
      createdDate: bill.CreatedDate
    });
  } catch (error) {
    console.error('Mark bill paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
