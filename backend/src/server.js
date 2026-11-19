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

const auth = require('./middleware/auth');

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/groups', require('./routes/group.routes'));
app.use('/api/photos', require('./routes/photo.routes'));
app.use('/api', require('./routes/comment.routes'));

// Returns the logged-in user. A quick test of the auth middleware.
app.get('/api/users/me', auth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, email, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// Error handler: Express 5 sends errors from async routes here.
// Log the details on the server and return a generic message (Appendix B).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
