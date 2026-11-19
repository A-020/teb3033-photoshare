const jwt = require('jsonwebtoken');

// Protects a route. Reads "Authorization: Bearer <token>", verifies the JWT
// and puts { id, username } on req.user. No session is stored on the server,
// so any server instance can verify any token.
module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, username }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
