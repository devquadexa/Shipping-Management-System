const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import Clean Architecture routes
const authRoutes = require('./presentation/routes/auth');
const customerRoutes = require('./presentation/routes/customers');
const jobRoutes = require('./presentation/routes/jobs');
const jobAssignmentRoutes = require('./presentation/routes/jobAssignments');
const billingRoutes = require('./presentation/routes/billing');
const pettyCashRoutes = require('./presentation/routes/pettycash');
const payItemTemplateRoutes = require('./presentation/routes/payItemTemplateRoutes');
const pettyCashAssignmentRoutes = require('./presentation/routes/pettyCashAssignmentRoutes');
const officePayItemRoutes = require('./presentation/routes/officePayItems');
const accountingRoutes = require('./presentation/routes/accounting');
const locationRoutes = require('./presentation/routes/locations');
const transporterRoutes = require('./presentation/routes/transporters');
const cashBalanceSettlementRoutes = require('./presentation/routes/cashBalanceSettlements');
const { getConnection } = require('./config/database');
const container = require('./infrastructure/di/container');
const { startOverdueChecker } = require('./infrastructure/scheduler/overdueChecker');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Test database connection on startup
getConnection()
  .then(() => {
    console.log('✅ Database connected successfully');
    console.log('🏗️  Clean Architecture initialized');
    
    // Start the overdue invoice checker
    startOverdueChecker(container);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err);
    console.log('Server will continue but database operations will fail');
  });

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/job-assignments', jobAssignmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/petty-cash', pettyCashRoutes);
app.use('/api/pay-item-templates', payItemTemplateRoutes(container));
app.use('/api/petty-cash-assignments', pettyCashAssignmentRoutes(container));
app.use('/api/office-pay-items', officePayItemRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/cash-balance-settlements', cashBalanceSettlementRoutes(container));

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
