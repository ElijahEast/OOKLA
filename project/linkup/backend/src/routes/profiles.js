const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── GET /api/profiles/:username ──────────────────────────────────────────────
router.get('/:username', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.username, u.created_at,
              p.display_name, p.bio, p.avatar_url,
              p.xp, p.level, p.coins, p.total_meetups,
              p.profile_visible,
              CASE WHEN p.location_visible THEN
                ST_X(p.location::geometry) END AS lng,
              CASE WHEN p.location_visible THEN
                ST_Y(p.location::geometry) END AS lat
       FROM users u
       JOIN profiles p ON p.user_id = u.id
       WHERE u.username = $1`,
      [req.params.username]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    const profile = result.rows[0];
    if (!profile.profile_visible && req.user.username !== req.params.username) {
      return res.status(403).json({ error: 'Profile is private.' });
    }
    res.json({ profile });
  } catch (err) { next(err); }
});

// ─── PATCH /api/profiles/me ───────────────────────────────────────────────────
const updateRules = [
  body('display_name').optional().trim().isLength({ max: 100 }),
  body('bio').optional().trim().isLength({ max: 300 }),
  body('avatar_url').optional().isURL(),
  body('date_of_birth').optional().isISO8601(),
  body('gender').optional().trim().isLength({ max: 30 }),
  body('location_visible').optional().isBoolean(),
  body('profile_visible').optional().isBoolean(),
];

router.patch('/me', authenticate, updateRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed.', fields: errors.array() });

  const { display_name, bio, avatar_url, date_of_birth, gender, location_visible, profile_visible } = req.body;
  try {
    const result = await pool.query(
      `UPDATE profiles SET
         display_name     = COALESCE($1, display_name),
         bio              = COALESCE($2, bio),
         avatar_url       = COALESCE($3, avatar_url),
         date_of_birth    = COALESCE($4, date_of_birth),
         gender           = COALESCE($5, gender),
         location_visible = COALESCE($6, location_visible),
         profile_visible  = COALESCE($7, profile_visible)
       WHERE user_id = $8
       RETURNING *`,
      [display_name, bio, avatar_url, date_of_birth, gender, location_visible, profile_visible, req.user.sub]
    );
    res.json({ profile: result.rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /api/profiles/me/location ──────────────────────────────────────────
router.post('/me/location', authenticate, [
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid coordinates.' });

  const { lat, lng } = req.body;
  try {
    await pool.query(
      `UPDATE profiles SET
         location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
         location_updated_at = NOW()
       WHERE user_id = $3`,
      [lng, lat, req.user.sub]
    );
    res.json({ message: 'Location updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
