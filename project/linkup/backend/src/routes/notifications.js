const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.sub]
    );
    const unread = result.rows.filter(n => !n.read_at).length;
    res.json({ notifications: result.rows, unread });
  } catch (err) { next(err); }
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL',
      [req.user.sub]
    );
    res.json({ message: 'All notifications marked read.' });
  } catch (err) { next(err); }
});

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.sub]
    );
    res.json({ message: 'Notification marked read.' });
  } catch (err) { next(err); }
});

// ─── POST /api/notifications (internal helper, admin only) ───────────────────
router.post('/', authenticate, async (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { user_id, type, title, body, ref_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, ref_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, type, title, body, ref_id || null]
    );
    res.status(201).json({ notification: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
