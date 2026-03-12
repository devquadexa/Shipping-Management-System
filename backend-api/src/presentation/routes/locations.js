/**
 * Location Routes
 * Handles Sri Lankan districts and cities
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const sql = require('mssql');
const dbConfig = require('../../config/database');

// Get all districts
router.get('/districts', auth, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .query(`
        SELECT districtId, districtName, province 
        FROM Districts 
        WHERE isActive = 1 
        ORDER BY districtName
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ message: 'Error fetching districts' });
  }
});

// Get cities by district
router.get('/cities/:districtId', auth, async (req, res) => {
  try {
    const { districtId } = req.params;
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .input('districtId', sql.Int, districtId)
      .query(`
        SELECT cityId, cityName 
        FROM Cities 
        WHERE districtId = @districtId AND isActive = 1 
        ORDER BY cityName
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Error fetching cities' });
  }
});

// Get all cities (for search/autocomplete)
router.get('/cities', auth, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const result = await pool.request()
      .query(`
        SELECT c.cityId, c.cityName, c.districtId, d.districtName, d.province
        FROM Cities c
        JOIN Districts d ON c.districtId = d.districtId
        WHERE c.isActive = 1 AND d.isActive = 1
        ORDER BY c.cityName
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error fetching all cities:', error);
    res.status(500).json({ message: 'Error fetching cities' });
  }
});

// Get district and city info by IDs
router.get('/address-info', auth, async (req, res) => {
  try {
    const { cityId, districtId } = req.query;
    const pool = await sql.connect(dbConfig);
    
    let query = `
      SELECT 
        d.districtId, d.districtName, d.province,
        c.cityId, c.cityName
      FROM Districts d
      LEFT JOIN Cities c ON d.districtId = c.districtId
      WHERE d.isActive = 1
    `;
    
    const request = pool.request();
    
    if (cityId) {
      query += ` AND c.cityId = @cityId`;
      request.input('cityId', sql.Int, cityId);
    }
    
    if (districtId) {
      query += ` AND d.districtId = @districtId`;
      request.input('districtId', sql.Int, districtId);
    }
    
    const result = await request.query(query);
    
    res.json(result.recordset[0] || null);
  } catch (error) {
    console.error('Error fetching address info:', error);
    res.status(500).json({ message: 'Error fetching address info' });
  }
});

module.exports = router;