const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const pool = require('../config/db');
const s3 = require('../config/s3');
const auth = require('../middleware/auth');
const { isMember } = require('../middleware/membership');

const router = express.Router();
const BUCKET = process.env.S3_BUCKET;

// Every photo route needs a logged-in user
router.use(auth);

// ---------- Upload settings ----------

// Allowed types and the file extension used in the S3 key.
// The extension comes from the checked MIME type, not from the user's file name.
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// memoryStorage keeps the file in RAM (req.file.buffer) and never writes
// it to the server disk. This keeps the server stateless.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
    req.fileTypeRejected = true;
    cb(null, false);
  },
});

// Runs multer and turns its errors into 400 responses (Appendix B)
function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5 MB)' : err.message;
      return res.status(400).json({ error: msg });
    }
    next(err);
  });
}

// ---------- Helpers ----------

// Accepts "beach, Sunset" or repeated tags fields. Returns ["beach", "sunset"].
function parseTags(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  const clean = list
    .map((t) => String(t).trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 50);
  return [...new Set(clean)].slice(0, 10); // unique, at most 10
}

// Returns a positive integer or null
function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Shared SELECT for photo reads. Joins users for the uploader's username,
// collects the tag names into one comma-separated string and counts comments.
// The comments query uses the idx_photo index, so the count stays cheap.
const PHOTO_SELECT = `
  SELECT p.id, p.user_id, u.username, p.group_id, g.name AS group_name,
         p.s3_key, p.caption, p.created_at,
         (SELECT GROUP_CONCAT(t.name ORDER BY t.name)
            FROM photo_tags pt JOIN tags t ON t.id = pt.tag_id
           WHERE pt.photo_id = p.id) AS tags,
         (SELECT COUNT(*) FROM comments c WHERE c.photo_id = p.id) AS comment_count
    FROM photos p
    JOIN users u ON u.id = p.user_id
    JOIN friend_groups g ON g.id = p.group_id`;

// Adds a pre-signed URL (valid 1 hour) and hides the internal S3 key.
// The bucket stays private. Only holders of this URL can fetch the image.
async function withUrl(row) {
  const { s3_key, tags, ...photo } = row;
  photo.tags = tags ? tags.split(',') : [];
  photo.url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: s3_key }),
    { expiresIn: 3600 }
  );
  return photo;
}

// ---------- Routes ----------

// POST /api/photos  (multipart: photo, groupId, caption, tags)
router.post('/', uploadPhoto, async (req, res) => {
  if (!req.file) {
    const msg = req.fileTypeRejected
      ? 'Only JPEG, PNG or WebP images are allowed'
      : 'Photo file is required';
    return res.status(400).json({ error: msg });
  }

  const groupId = toId(req.body.groupId);
  if (!groupId) return res.status(400).json({ error: 'Valid groupId is required' });

  const caption = (req.body.caption || '').trim() || null;
  if (caption && caption.length > 500) {
    return res.status(400).json({ error: 'Caption must be at most 500 characters' });
  }
  const tags = parseTags(req.body.tags);

  // Check membership before anything is uploaded
  if (!(await isMember(groupId, req.user.id))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }

  // UUID key: two users uploading "IMG_0001.jpg" never overwrite each other
  const key = `photos/${uuidv4()}${ALLOWED_TYPES[req.file.mimetype]}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  // One transaction: the photo row and all its tag links are saved together
  const conn = await pool.getConnection();
  let photoId;
  try {
    await conn.beginTransaction();

    const [p] = await conn.query(
      'INSERT INTO photos (user_id, group_id, s3_key, caption) VALUES (?, ?, ?, ?)',
      [req.user.id, groupId, key, caption]
    );
    photoId = p.insertId;

    for (const name of tags) {
      // INSERT IGNORE: the tag may already exist (UNIQUE on name)
      await conn.query('INSERT IGNORE INTO tags (name) VALUES (?)', [name]);
      const [[tag]] = await conn.query('SELECT id FROM tags WHERE name = ?', [name]);
      await conn.query(
        'INSERT INTO photo_tags (photo_id, tag_id) VALUES (?, ?)',
        [photoId, tag.id]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    // The database failed after the S3 upload. Remove the object so
    // storage and database stay consistent.
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (cleanupErr) {
      console.error('S3 cleanup failed for', key, cleanupErr);
    }
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await pool.query(`${PHOTO_SELECT} WHERE p.id = ?`, [photoId]);
  res.status(201).json(await withUrl(rows[0]));
});

// Reads one query parameter as a trimmed string. A repeated parameter
// (?tag=a&tag=b arrives as an array) is ignored rather than guessed at.
function queryStr(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30)
function isDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Escapes the LIKE wildcards % and _ so a search for "50%" means the text "50%"
function escapeLike(s) {
  return s.replace(/[\\%_]/g, '\\$&');
}

// GET /api/photos
// Feed, search and filter. All parameters are optional:
//   groupId, uploader, tag, from, to (YYYY-MM-DD), q, sort (newest | oldest),
//   limit (default 20, max 100), offset (default 0)
// Only photos from groups the user belongs to are ever returned.
router.get('/', async (req, res) => {
  const q = req.query;
  const limit = Math.min(toId(q.limit) || 20, 100);
  const offset = Number.isInteger(Number(q.offset)) && Number(q.offset) > 0 ? Number(q.offset) : 0;

  const groupIdRaw = queryStr(q.groupId);
  const uploader = queryStr(q.uploader);
  const tag = queryStr(q.tag).toLowerCase(); // tags are stored in lowercase
  const from = queryStr(q.from);
  const to = queryStr(q.to);
  const keyword = queryStr(q.q);
  const sort = queryStr(q.sort) || 'newest';

  // Validate input (400 per Appendix B)
  const groupId = groupIdRaw ? toId(groupIdRaw) : null;
  if (groupIdRaw && !groupId) return res.status(400).json({ error: 'groupId must be a positive integer' });
  if (from && !isDate(from)) return res.status(400).json({ error: 'from must be a date in YYYY-MM-DD format' });
  if (to && !isDate(to)) return res.status(400).json({ error: 'to must be a date in YYYY-MM-DD format' });
  if (from && to && from > to) return res.status(400).json({ error: 'from must not be after to' });
  if (keyword.length > 100) return res.status(400).json({ error: 'q must be at most 100 characters' });
  if (sort !== 'newest' && sort !== 'oldest') {
    return res.status(400).json({ error: 'sort must be newest or oldest' });
  }

  // The JOIN on group_members is always present, so every filter below
  // only narrows the user's own feed. It can never reach other groups.
  let sql = `${PHOTO_SELECT}
    JOIN group_members gm ON gm.group_id = p.group_id AND gm.user_id = ?`;
  const where = [];
  const params = [req.user.id];

  // Each filter adds a fixed SQL fragment with ? placeholders.
  // User input only ever goes into params, never into the SQL text.
  if (groupId) {
    where.push('p.group_id = ?');
    params.push(groupId);
  }
  if (uploader) {
    where.push('u.username = ?');
    params.push(uploader);
  }
  if (from) {
    where.push('p.created_at >= ?');
    params.push(from);
  }
  if (to) {
    // Whole "to" day included: before midnight of the next day
    where.push('p.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(to);
  }
  if (tag) {
    where.push(`EXISTS (SELECT 1 FROM photo_tags pt JOIN tags t ON t.id = pt.tag_id
                         WHERE pt.photo_id = p.id AND t.name = ?)`);
    params.push(tag);
  }
  if (keyword) {
    const like = `%${escapeLike(keyword)}%`;
    where.push(`(p.caption LIKE ? OR EXISTS (SELECT 1 FROM comments c
                  WHERE c.photo_id = p.id AND c.content LIKE ?))`);
    params.push(like, like);
  }

  if (where.length) sql += ' WHERE ' + where.join(' AND ');

  // The direction comes from a fixed choice, not from the raw input
  const dir = sort === 'oldest' ? 'ASC' : 'DESC';
  sql += ` ORDER BY p.created_at ${dir}, p.id ${dir} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  res.json({
    limit,
    offset,
    photos: await Promise.all(rows.map(withUrl)),
  });
});

// GET /api/photos/:id
// Members of the photo's group only.
router.get('/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid photo id' });

  const [rows] = await pool.query(`${PHOTO_SELECT} WHERE p.id = ?`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Photo not found' });

  if (!(await isMember(rows[0].group_id, req.user.id))) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }
  res.json(await withUrl(rows[0]));
});

// DELETE /api/photos/:id
// Owner only. Removes the row (comments and tag links cascade), then the S3 object.
router.delete('/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid photo id' });

  const [rows] = await pool.query('SELECT s3_key FROM photos WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Photo not found' });

  // Ownership is enforced inside the SQL. If the user is not the owner,
  // no row matches and affectedRows is 0.
  const [r] = await pool.query(
    'DELETE FROM photos WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );
  if (r.affectedRows === 0) {
    return res.status(403).json({ error: 'Only the owner can delete this photo' });
  }

  // The row is gone, so the photo is no longer visible. If this S3 call
  // fails, only an unreachable object remains. Log it instead of failing.
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: rows[0].s3_key }));
  } catch (err) {
    console.error('S3 delete failed for', rows[0].s3_key, err);
  }

  res.json({ message: 'Photo deleted', id });
});

module.exports = router;
