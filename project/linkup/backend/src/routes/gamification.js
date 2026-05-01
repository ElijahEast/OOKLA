const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { awardXP, updateStreak, xpToNextLevel } = require('../services/gamification');

// ─── POST /api/gamification/award ─────────────────────────────────────────────
// Award XP and/or coins to the authenticated user
router.post('/award', authenticate, [
  body('eventType').trim().notEmpty(),
  body('xp').isInt({ min: 0, max: 1000 }),
  body('coins').optional().isInt({ min: 0, max: 500 }),
  body('description').optional().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid parameters.' });

  const { eventType, xp, coins = 0, description = '' } = req.body;

  try {
    const result = await awardXP(req.user.sub, {
      eventType,
      xp,
      coins,
      description,
    });

    res.json({
      message: 'XP awarded.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/gamification/streak ────────────────────────────────────────────
// Update daily streak for the authenticated user
router.post('/streak', authenticate, async (req, res, next) => {
  try {
    const result = await updateStreak(req.user.sub);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/gamification/progress ───────────────────────────────────────────
// Get user's current XP progress
router.get('/progress', authenticate, async (req, res, next) => {
  const pool = require('../db/pool');
  try {
    const result = await pool.query(
      'SELECT xp, level, coins FROM profiles WHERE user_id = $1',
      [req.user.sub]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found.' });

    const { xp, level, coins } = result.rows[0];
    const progress = xpToNextLevel(xp);

    res.json({
      xp,
      level,
      coins,
      ...progress,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
