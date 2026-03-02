/**
 * Main Application Entry Point
 * Clean Architecture version
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import routes (Clean Architecture)
const authRoutes = require('./presentation/routes/auth');
const customerRoutes = require('./presentation/routes/customers');
const jobRoutes = require('./presentation/routes/jobs');
const billingRoutes = require('./presentation/routes/billing');
const pettyCashRoutes = require('./presentation/routes/pettycash');

const { getConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Test database connection on startup
getConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log('🏗️  Clean Architecture initialized');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    console.log('Server will continue but database operations will fail');
  });

// Clean Architecture routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/petty-cash', pettyCashRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Super Shine Cargo Service API',
    architecture: 'Clean Architecture',
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📐 Architecture: Clean Architecture + SOLID`);
  console.log(`🔗 API: http://localhost:${PORT}`);
});
