const express = require('express');
const { auth, checkRole } = require('../middleware/auth');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

router.post('/', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const pool = await getConnection();
    
    // Get next customer ID
    const maxId = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(CustomerId, 5, 4) AS INT)) as MaxId FROM Customers');
    
    const nextId = (maxId.recordset[0].MaxId || 0) + 1;
    const customerId = `CUST${String(nextId).padStart(4, '0')}`;
    
    // Insert customer
    await pool.request()
      .input('customerId', sql.VarChar, customerId)
      .input('name', sql.VarChar, name)
      .input('phone', sql.VarChar, phone)
      .input('email', sql.VarChar, email)
      .input('address', sql.VarChar, address)
      .query(`INSERT INTO Customers (CustomerId, Name, Phone, Email, Address, RegistrationDate, IsActive)
              VALUES (@customerId, @name, @phone, @email, @address, GETDATE(), 1)`);
    
    const result = await pool.request()
      .input('customerId', sql.VarChar, customerId)
      .query('SELECT * FROM Customers WHERE CustomerId = @customerId');
    
    const customer = result.recordset[0];
    res.status(201).json({
      customerId: customer.CustomerId,
      name: customer.Name,
      phone: customer.Phone,
      email: customer.Email,
      address: customer.Address,
      registrationDate: customer.RegistrationDate
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Customers WHERE IsActive = 1 ORDER BY RegistrationDate DESC');
    
    const customers = result.recordset.map(c => ({
      customerId: c.CustomerId,
      name: c.Name,
      phone: c.Phone,
      email: c.Email,
      address: c.Address,
      registrationDate: c.RegistrationDate
    }));
    
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('customerId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Customers WHERE CustomerId = @customerId AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const customer = result.recordset[0];
    res.json({
      customerId: customer.CustomerId,
      name: customer.Name,
      phone: customer.Phone,
      email: customer.Email,
      address: customer.Address,
      registrationDate: customer.RegistrationDate
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, checkRole('Admin', 'Super Admin'), async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const pool = await getConnection();
    
    await pool.request()
      .input('customerId', sql.VarChar, req.params.id)
      .input('name', sql.VarChar, name)
      .input('phone', sql.VarChar, phone)
      .input('email', sql.VarChar, email)
      .input('address', sql.VarChar, address)
      .query(`UPDATE Customers 
              SET Name = @name, Phone = @phone, Email = @email, Address = @address
              WHERE CustomerId = @customerId`);
    
    const result = await pool.request()
      .input('customerId', sql.VarChar, req.params.id)
      .query('SELECT * FROM Customers WHERE CustomerId = @customerId');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const customer = result.recordset[0];
    res.json({
      customerId: customer.CustomerId,
      name: customer.Name,
      phone: customer.Phone,
      email: customer.Email,
      address: customer.Address,
      registrationDate: customer.RegistrationDate
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
