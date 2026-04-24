const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { awardXP, advanceQuest } = require('../services/gamification');
const { body, validationResult } = require('express-validator');

// ─── POST /api/meetups/request ────────────────────────────────────────────────
router.post('/request', authenticate, [
  body('receiver_username').trim().notEmpty(),
  body('message').optional().trim().isLength({ max: 200 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed.', fields: errors.array() });

  const { receiver_username, message } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Resolve receiver
    const recvRes = await client.query(
      'SELECT id FROM users WHERE username = $1', [receiver_username]
    );
    if (!recvRes.rows.length) return res.status(404).json({ error: 'User not found.' });
    const receiverId = recvRes.rows[0].id;

    if (receiverId === req.user.sub) {
      return res.status(400).json({ error: 'Cannot request yourself.' });
    }

    // Check no pending request already exists
    const existing = await client.query(
      `SELECT id FROM meetup_requests
       WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [req.user.sub, receiverId]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Request already pending.' });
    }

    // Get distance between users
    const distRes = await client.query(
      `SELECT ROUND(ST_Distance(a.location, b.location)) AS dist_m
       FROM profiles a, profiles b
       WHERE a.user_id = $1 AND b.user_id = $2`,
      [req.user.sub, receiverId]
    );
    const distanceM = distRes.rows[0]?.dist_m || null;

    const result = await client.query(
      `INSERT INTO meetup_requests (sender_id, receiver_id, message, distance_m)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status, sent_at, expires_at`,
      [req.user.sub, receiverId, message || null, distanceM]
    );

    await client.query('COMMIT');

    // Award XP for sending + advance quest
    const xpResult = await awardXP(req.user.sub, {
      eventType: 'meetup_request_sent',
      xp: 5,
      description: `LinkUp request sent to @${receiver_username}`,
      refId: result.rows[0].id,
    });
    await advanceQuest(req.user.sub, 'first_linkup');
    await advanceQuest(req.user.sub, 'daily_request');

    res.status(201).json({
      request: result.rows[0],
      xp: xpResult,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── PATCH /api/meetups/:id/respond ──────────────────────────────────────────
router.patch('/:id/respond', authenticate, [
  body('action').isIn(['accepted', 'declined']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid action.' });

  const { action } = req.body;
  try {
    // Ensure this user is the receiver
    const reqRes = await pool.query(
      `SELECT * FROM meetup_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [req.params.id, req.user.sub]
    );
    if (!reqRes.rows.length) return res.status(404).json({ error: 'Request not found or already responded.' });
    const meetupReq = reqRes.rows[0];

    // Check not expired
    if (new Date(meetupReq.expires_at) < new Date()) {
      await pool.query(`UPDATE meetup_requests SET status='cancelled' WHERE id=$1`, [req.params.id]);
      return res.status(410).json({ error: 'Request expired.' });
    }

    await pool.query(
      `UPDATE meetup_requests SET status=$1, responded_at=NOW() WHERE id=$2`,
      [action, req.params.id]
    );

    let xpResult = null;
    if (action === 'accepted') {
      // Award both users XP
      xpResult = await awardXP(req.user.sub, {
        eventType: 'meetup_request_accepted',
        xp: 15,
        coins: 2,
        description: 'Accepted a LinkUp request',
        refId: req.params.id,
      });
      await awardXP(meetupReq.sender_id, {
        eventType: 'meetup_request_accepted_by_other',
        xp: 15,
        coins: 2,
        description: 'Your LinkUp request was accepted!',
        refId: req.params.id,
      });
    }

    res.json({ status: action, xp: xpResult });
  } catch (err) { next(err); }
});

// ─── POST /api/meetups/:id/complete ──────────────────────────────────────────
router.post('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const reqRes = await pool.query(
      `SELECT * FROM meetup_requests
       WHERE id = $1 AND status = 'accepted'
         AND (sender_id = $2 OR receiver_id = $2)`,
      [req.params.id, req.user.sub]
    );
    if (!reqRes.rows.length) return res.status(404).json({ error: 'Meetup not found.' });
    const meetup = reqRes.rows[0];

    await pool.query(
      `UPDATE meetup_requests SET status='completed', completed_at=NOW() WHERE id=$1`,
      [req.params.id]
    );

    // Award both users
    const otherId = meetup.sender_id === req.user.sub ? meetup.receiver_id : meetup.sender_id;

    const [myXp] = await Promise.all([
      awardXP(req.user.sub, { eventType:'meetup_completed', xp:50, coins:5, description:'Meetup completed!', refId:req.params.id }),
      awardXP(otherId,       { eventType:'meetup_completed', xp:50, coins:5, description:'Meetup completed!', refId:req.params.id }),
    ]);

    // Update meetup count
    await pool.query(
      `UPDATE profiles SET total_meetups = total_meetups + 1 WHERE user_id IN ($1, $2)`,
      [req.user.sub, otherId]
    );

    // Advance quests
    await advanceQuest(req.user.sub, 'first_meetup');
    await advanceQuest(req.user.sub, 'weekly_meetups');

    res.json({ status: 'completed', xp: myXp });
  } catch (err) { next(err); }
});

// ─── GET /api/meetups/inbox ───────────────────────────────────────────────────
router.get('/inbox', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT mr.*, u.username AS sender_username, p.display_name AS sender_name, p.avatar_url AS sender_avatar
       FROM meetup_requests mr
       JOIN users u ON u.id = mr.sender_id
       JOIN profiles p ON p.user_id = mr.sender_id
       WHERE mr.receiver_id = $1 AND mr.status = 'pending' AND mr.expires_at > NOW()
       ORDER BY mr.sent_at DESC`,
      [req.user.sub]
    );
    res.json({ requests: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
