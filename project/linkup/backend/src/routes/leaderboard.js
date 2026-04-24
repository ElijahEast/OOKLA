const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { xpToNextLevel } = require('../services/gamification');

// ─── GET /api/leaderboard?scope=global&limit=50 ───────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  try {
    const result = await pool.query(
      `SELECT username, display_name, avatar_url, xp, level, total_meetups, current_streak, rank
       FROM leaderboard LIMIT $1`,
      [limit]
    );

    // Find requesting user's rank
    const myRank = await pool.query(
      `SELECT rank FROM leaderboard WHERE username = $1`,
      [req.user.username]
    );

    res.json({
      leaders: result.rows,
      my_rank: myRank.rows[0]?.rank || null,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/leaderboard/nearby ──────────────────────────────────────────────
// Leaderboard limited to users within 5km
router.get('/nearby', authenticate, async (req, res, next) => {
  try {
    const me = await pool.query('SELECT location FROM profiles WHERE user_id=$1', [req.user.sub]);
    if (!me.rows[0]?.location) return res.status(400).json({ error: 'Location not set.' });

    const result = await pool.query(
      `SELECT u.username, p.display_name, p.avatar_url, p.xp, p.level, p.total_meetups,
              COALESCE(s.current_streak,0) AS current_streak,
              ROUND(ST_Distance(p.location, $1::geography)) AS distance_m,
              RANK() OVER (ORDER BY p.xp DESC) AS rank
       FROM profiles p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN streaks s ON s.user_id = u.id
       WHERE u.is_active=TRUE AND p.profile_visible=TRUE
         AND ST_DWithin(p.location, $1::geography, 5000)
       ORDER BY p.xp DESC
       LIMIT 20`,
      [me.rows[0].location]
    );
    res.json({ leaders: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/leaderboard/me/stats ───────────────────────────────────────────
router.get('/me/stats', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.xp, p.level, p.coins, p.total_meetups,
              COALESCE(s.current_streak,0) AS current_streak,
              COALESCE(s.longest_streak,0) AS longest_streak,
              (SELECT COUNT(*) FROM xp_events WHERE user_id=$1) AS total_events,
              (SELECT COALESCE(SUM(xp_delta),0) FROM xp_events WHERE user_id=$1 AND created_at > NOW()-INTERVAL '7 days') AS xp_this_week
       FROM profiles p
       LEFT JOIN streaks s ON s.user_id=p.user_id
       WHERE p.user_id=$1`,
      [req.user.sub]
    );
    const stats = result.rows[0];
    res.json({ stats: { ...stats, levelProgress: xpToNextLevel(stats.xp) } });
  } catch (err) { next(err); }
});

module.exports = router;
