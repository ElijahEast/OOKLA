const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

// ─── GET /api/nearby?radius=1000&limit=20 ────────────────────────────────────
// radius = meters (default 1000m = 1km), max 10000m
router.get('/', authenticate, [
  query('radius').optional().isInt({ min: 100, max: 10000 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid params.' });

  const radius = parseInt(req.query.radius) || 1000;
  const limit  = parseInt(req.query.limit)  || 20;

  try {
    // First get the requesting user's location
    const me = await pool.query(
      'SELECT location FROM profiles WHERE user_id = $1',
      [req.user.sub]
    );
    if (!me.rows[0]?.location) {
      return res.status(400).json({ error: 'Your location is not set.' });
    }

    const myLocation = me.rows[0].location;

    // Find nearby users within radius, excluding self
    const result = await pool.query(
      `SELECT
         u.username,
         p.display_name,
         p.avatar_url,
         p.xp,
         p.level,
         p.bio,
         ROUND(ST_Distance(p.location, $1::geography)) AS distance_m,
         ST_X(p.location::geometry) AS lng,
         ST_Y(p.location::geometry) AS lat
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       WHERE u.id != $2
         AND p.location IS NOT NULL
         AND p.location_visible = TRUE
         AND p.profile_visible  = TRUE
         AND u.is_active = TRUE
         AND ST_DWithin(p.location, $1::geography, $3)
         AND p.location_updated_at > NOW() - INTERVAL '30 minutes'
       ORDER BY distance_m ASC
       LIMIT $4`,
      [myLocation, req.user.sub, radius, limit]
    );

    res.json({
      count: result.rows.length,
      radius_m: radius,
      users: result.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
