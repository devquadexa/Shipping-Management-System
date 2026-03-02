const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const jobRoutes = require('./routes/jobs');
const billingRoutes = require('./routes/billing');
const pettyCashRoutes = require('./routes/pettyCash');
const { getConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Test database connection on startup
getConnection()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    console.log('Server will continue but database operations will fail');
  });

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/petty-cash', pettyCashRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Super Shine Cargo Service API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
