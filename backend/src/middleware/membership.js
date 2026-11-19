const pool = require('../config/db');

// Returns true if the user belongs to the group.
// Photo and comment routes call this directly, because there the group id
// comes from the request body or from the photo row, not from the URL.
async function isMember(groupId, userId) {
  const [rows] = await pool.query(
    'SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId]
  );
  return rows.length > 0;
}

// Middleware for routes shaped like /api/groups/:id/...
// Must run after the auth middleware, because it needs req.user.
// A group that does not exist also returns 403, so outsiders cannot
// discover which group ids exist.
async function requireGroupMember(req, res, next) {
  if (!(await isMember(req.params.id, req.user.id))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }
  next();
}

module.exports = { isMember, requireGroupMember };
