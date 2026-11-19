const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { isMember } = require('../middleware/membership');

// Mounted at /api, because the paths span two resources:
//   /api/photos/:id/comments  and  /api/comments/:id
// auth is added per route, so unknown /api paths still give 404, not 401.
const router = express.Router();

const MAX_LENGTH = 1000;

// ---------- Helpers ----------

// Returns a positive integer or null
function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Returns the trimmed content, or an error message
function checkContent(body) {
  const content = (body?.content || '').trim();
  if (!content) return { error: 'Comment cannot be empty' };
  if (content.length > MAX_LENGTH) {
    return { error: `Comment must be at most ${MAX_LENGTH} characters` };
  }
  return { content };
}

// Loads the photo and checks that the user is in its group.
// Sends 400, 404 or 403 itself and returns null when the request must stop.
async function photoForMember(req, res) {
  const photoId = toId(req.params.id);
  if (!photoId) {
    res.status(400).json({ error: 'Invalid photo id' });
    return null;
  }
  const [rows] = await pool.query('SELECT id, group_id FROM photos WHERE id = ?', [photoId]);
  if (!rows[0]) {
    res.status(404).json({ error: 'Photo not found' });
    return null;
  }
  if (!(await isMember(rows[0].group_id, req.user.id))) {
    res.status(403).json({ error: 'Not a member of this group' });
    return null;
  }
  return rows[0];
}

// After an UPDATE or DELETE matched no row, decide between 404 and 403.
// Ownership was already enforced inside the SQL. This only picks the status code.
async function notFoundOrForbidden(res, commentId) {
  const [rows] = await pool.query('SELECT 1 FROM comments WHERE id = ?', [commentId]);
  if (!rows[0]) return res.status(404).json({ error: 'Comment not found' });
  return res.status(403).json({ error: 'Not your comment' });
}

// Shared SELECT that joins users for the commenter's username
const COMMENT_SELECT = `
  SELECT c.id, c.photo_id, c.user_id, u.username, c.content,
         c.created_at, c.updated_at
    FROM comments c
    JOIN users u ON u.id = c.user_id`;

// ---------- Routes ----------

// GET /api/photos/:id/comments
// Members of the photo's group only. Oldest first.
router.get('/photos/:id/comments', auth, async (req, res) => {
  const photo = await photoForMember(req, res);
  if (!photo) return;

  const [rows] = await pool.query(
    `${COMMENT_SELECT} WHERE c.photo_id = ? ORDER BY c.created_at, c.id`,
    [photo.id]
  );
  res.json(rows);
});

// POST /api/photos/:id/comments  Body: { content }
// Members only.
router.post('/photos/:id/comments', auth, async (req, res) => {
  const { content, error } = checkContent(req.body);
  if (error) return res.status(400).json({ error });

  const photo = await photoForMember(req, res);
  if (!photo) return;

  const [r] = await pool.query(
    'INSERT INTO comments (photo_id, user_id, content) VALUES (?, ?, ?)',
    [photo.id, req.user.id, content]
  );
  const [rows] = await pool.query(`${COMMENT_SELECT} WHERE c.id = ?`, [r.insertId]);
  res.status(201).json(rows[0]);
});

// PUT /api/comments/:id  Body: { content }
// Comment owner only.
router.put('/comments/:id', auth, async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid comment id' });

  const { content, error } = checkContent(req.body);
  if (error) return res.status(400).json({ error });

  // Ownership is part of the WHERE clause, so the check and the change
  // happen in one atomic statement. updated_at changes automatically
  // (ON UPDATE CURRENT_TIMESTAMP) when the text is different.
  const [r] = await pool.query(
    'UPDATE comments SET content = ? WHERE id = ? AND user_id = ?',
    [content, id, req.user.id]
  );
  if (r.affectedRows === 0) return notFoundOrForbidden(res, id);

  const [rows] = await pool.query(`${COMMENT_SELECT} WHERE c.id = ?`, [id]);
  res.json(rows[0]);
});

// DELETE /api/comments/:id
// The comment owner, or the owner of the photo (to remove unwanted comments).
router.delete('/comments/:id', auth, async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid comment id' });

  const [r] = await pool.query(
    `DELETE c FROM comments c
       JOIN photos p ON p.id = c.photo_id
      WHERE c.id = ? AND (c.user_id = ? OR p.user_id = ?)`,
    [id, req.user.id, req.user.id]
  );
  if (r.affectedRows === 0) return notFoundOrForbidden(res, id);

  res.json({ message: 'Comment deleted', id });
});

module.exports = router;
