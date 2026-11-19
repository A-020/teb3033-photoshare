// Load .env before any module reads process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Health check: confirms the API is running and the database answers
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// Routes are mounted here in later steps
// app.use('/api/auth', require('./routes/auth.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
