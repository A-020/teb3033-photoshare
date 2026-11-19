const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();

// POST /api/auth/register
// Creates a new user with a bcrypt-hashed password.
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Cost factor 10: about 100 ms per hash. Plain text is never stored.
  const hash = await bcrypt.hash(password, 10);

  try {
    // Parameterised query: user input never becomes part of the SQL text
    const [r] = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hash]
    );
    res.status(201).json({ id: r.insertId, username, email });
  } catch (err) {
    // The UNIQUE keys reject duplicates, even for two requests at the same moment
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or email already taken' });
    }
    throw err; // Passed to the error handler in server.js
  }
});

// POST /api/auth/login
// Checks the credentials and returns a signed JWT.
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [rows] = await pool.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  // Same message for an unknown email and a wrong password,
  // so an attacker cannot learn which emails are registered.
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Stateless auth: the token itself carries the user identity
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  // password_hash is never sent to the client
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

module.exports = router;
