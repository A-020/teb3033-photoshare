const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireGroupMember } = require('../middleware/membership');

const router = express.Router();

// Every group route needs a logged-in user
router.use(auth);

// POST /api/groups
// Creates a group and adds the creator as its first member.
router.post('/', async (req, res) => {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Group name is required' });
  if (name.length > 100) {
    return res.status(400).json({ error: 'Group name must be at most 100 characters' });
  }

  // Transaction: both rows are saved, or neither is.
  // Without it, a crash between the two INSERTs leaves a group with no members.
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [g] = await conn.query(
      'INSERT INTO friend_groups (name, created_by) VALUES (?, ?)',
      [name, req.user.id]
    );
    await conn.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [g.insertId, req.user.id]
    );
    await conn.commit();
    res.status(201).json({ id: g.insertId, name });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release(); // Always return the connection to the pool
  }
});

// GET /api/groups
// Lists the groups the user belongs to, with the member count of each.
router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT g.id, g.name, g.created_by, g.created_at,
            COUNT(m.user_id) AS member_count
       FROM friend_groups g
       JOIN group_members me ON me.group_id = g.id AND me.user_id = ?
       JOIN group_members m  ON m.group_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// GET /api/groups/:id/members
// Members only.
router.get('/:id/members', requireGroupMember, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.username, gm.joined_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at`,
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/groups/:id/members  Body: { username }
// Members only. Adds another user to the group.
router.post('/:id/members', requireGroupMember, async (req, res) => {
  const username = (req.body?.username || '').trim();
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const [users] = await pool.query(
    'SELECT id, username FROM users WHERE username = ?',
    [username]
  );
  if (!users[0]) return res.status(404).json({ error: 'User not found' });

  // INSERT IGNORE: if the user is already a member (even from two requests
  // at the same moment), the primary key blocks the duplicate without an error.
  const [r] = await pool.query(
    'INSERT IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)',
    [req.params.id, users[0].id]
  );

  const member = { group_id: Number(req.params.id), user_id: users[0].id, username: users[0].username };
  if (r.affectedRows === 0) {
    return res.status(200).json({ ...member, message: 'Already a member' });
  }
  res.status(201).json(member);
});

module.exports = router;
