const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, auth, checkRole } = require('../middleware/auth');
const { getConnection, sql } = require('../config/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM Users WHERE Username = @username AND Password = @password AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.recordset[0];
    
    const token = jwt.sign(
      { userId: user.UserId, username: user.Username, role: user.Role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        userId: user.UserId,
        username: user.Username,
        fullName: user.FullName,
        role: user.Role,
        email: user.Email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', auth, checkRole('Super Admin'), async (req, res) => {
  try {
    const { username, password, fullName, role, email } = req.body;
    const pool = await getConnection();
    
    // Check if username exists
    const checkUser = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT UserId FROM Users WHERE Username = @username');
    
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Get next user ID
    const maxId = await pool.request()
      .query('SELECT MAX(CAST(SUBSTRING(UserId, 5, 4) AS INT)) as MaxId FROM Users');
    
    const nextId = (maxId.recordset[0].MaxId || 0) + 1;
    const userId = `USER${String(nextId).padStart(4, '0')}`;
    
    // Insert new user
    await pool.request()
      .input('userId', sql.VarChar, userId)
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .input('fullName', sql.VarChar, fullName)
      .input('role', sql.VarChar, role)
      .input('email', sql.VarChar, email)
      .query(`INSERT INTO Users (UserId, Username, Password, FullName, Role, Email, CreatedDate, IsActive)
              VALUES (@userId, @username, @password, @fullName, @role, @email, GETDATE(), 1)`);
    
    res.status(201).json({
      userId,
      username,
      fullName,
      role,
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', auth, checkRole('Super Admin'), async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT UserId, Username, FullName, Role, Email, CreatedDate FROM Users WHERE IsActive = 1 ORDER BY CreatedDate DESC');
    
    const users = result.recordset.map(u => ({
      userId: u.UserId,
      username: u.Username,
      fullName: u.FullName,
      role: u.Role,
      email: u.Email,
      createdDate: u.CreatedDate
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', sql.VarChar, req.user.userId)
      .query('SELECT UserId, Username, FullName, Role, Email FROM Users WHERE UserId = @userId AND IsActive = 1');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    res.json({
      userId: user.UserId,
      username: user.Username,
      fullName: user.FullName,
      role: user.Role,
      email: user.Email
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
