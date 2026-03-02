const express = require('express');
const { auth } = require('../middleware/auth');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { description, amount, entryType, jobId } = req.body;
    const pool = await getConnection();
    
    // Get current balance
    const balanceResult = await pool.request()
      .query('SELECT Balance FROM PettyCashBalance WHERE Id = 1');
    
    let balance = balanceResult.recordset[0].Balance;
    
    // Update balance
    if (entryType === 'Income') {
      balance += amount;
    } else if (entryType === 'Expense') {
      balance -= amount;
    }
    
    // Get next entry ID
    const maxId = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(EntryId, 3, 4) AS INT)) as MaxId FROM PettyCash');
    
    const nextId = (maxId.recordset[0].MaxId || 0) + 1;
    const entryId = `PC${String(nextId).padStart(4, '0')}`;
    
    // Insert entry
    await pool.request()
      .input('entryId', sql.VarChar, entryId)
      .input('description', sql.VarChar, description)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('entryType', sql.VarChar, entryType)
      .input('jobId', sql.VarChar, jobId || null)
      .input('createdBy', sql.VarChar, req.user.userId)
      .input('balanceAfter', sql.Decimal(10, 2), balance)
      .query(`INSERT INTO PettyCash (EntryId, Description, Amount, EntryType, JobId, CreatedBy, BalanceAfter, Date)
              VALUES (@entryId, @description, @amount, @entryType, @jobId, @createdBy, @balanceAfter, GETDATE())`);
    
    // Update balance table
    await pool.request()
      .input('balance', sql.Decimal(10, 2), balance)
      .query('UPDATE PettyCashBalance SET Balance = @balance, LastUpdated = GETDATE() WHERE Id = 1');
    
    const result = await pool.request()
      .input('entryId', sql.VarChar, entryId)
      .query('SELECT * FROM PettyCash WHERE EntryId = @entryId');
    
    const entry = result.recordset[0];
    res.status(201).json({
      entryId: entry.EntryId,
      description: entry.Description,
      amount: entry.Amount,
      entryType: entry.EntryType,
      jobId: entry.JobId,
      createdBy: entry.CreatedBy,
      balanceAfter: entry.BalanceAfter,
      date: entry.Date
    });
  } catch (error) {
    console.error('Create petty cash entry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    let query = 'SELECT * FROM PettyCash';
    
    // Filter by user role
    if (req.user.role === 'User') {
      query += ' WHERE CreatedBy = @userId';
    }
    
    query += ' ORDER BY Date DESC';
    
    const request = pool.request();
    if (req.user.role === 'User') {
      request.input('userId', sql.VarChar, req.user.userId);
    }
    
    const result = await request.query(query);
    
    const entries = result.recordset.map(e => ({
      entryId: e.EntryId,
      description: e.Description,
      amount: e.Amount,
      entryType: e.EntryType,
      jobId: e.JobId,
      createdBy: e.CreatedBy,
      balanceAfter: e.BalanceAfter,
      date: e.Date
    }));
    
    // Get current balance
    const balanceResult = await pool.request()
      .query('SELECT Balance FROM PettyCashBalance WHERE Id = 1');
    
    const balance = balanceResult.recordset[0].Balance;
    
    res.json({ entries, balance });
  } catch (error) {
    console.error('Get petty cash entries error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/balance', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT Balance FROM PettyCashBalance WHERE Id = 1');
    
    const balance = result.recordset[0].Balance;
    res.json({ balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
