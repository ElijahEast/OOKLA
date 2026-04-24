const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

// ─── GET /api/search?q=term&type=users ────────────────────────────────────────
router.get('/', authenticate, [
  query('q').trim().isLength({ min: 1, max: 50 }),
  query('type').optional().isIn(['users']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Query required.' });

  const q = `%${req.query.q}%`;
  try {
    const users = await pool.query(
      `SELECT u.username, p.display_name, p.avatar_url, p.xp, p.level, p.bio,
              p.total_meetups,
              CASE WHEN f.status='accepted' THEN true ELSE false END AS is_friend,
              COALESCE(s.current_streak,0) AS current_streak
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       LEFT JOIN friendships f ON (f.requester_id=$1 OR f.addressee_id=$1)
         AND (f.requester_id=u.id OR f.addressee_id=u.id) AND f.status='accepted'
       LEFT JOIN streaks s ON s.user_id = u.id
       WHERE u.is_active=TRUE AND p.profile_visible=TRUE AND u.id != $1
         AND (u.username ILIKE $2 OR p.display_name ILIKE $2)
       ORDER BY p.xp DESC
       LIMIT 20`,
      [req.user.sub, q]
    );
    res.json({ results: users.rows });
  } catch (err) { next(err); }
});

module.exports = router;
