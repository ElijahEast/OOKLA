const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { awardXP } = require('../services/gamification');
const { body, validationResult } = require('express-validator');

// ─── POST /api/friends/request ────────────────────────────────────────────────
router.post('/request', authenticate, [
  body('username').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Username required.' });

  const { username } = req.body;
  try {
    // Check if target user exists in database (real user)
    const targetRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    const isRealUser = targetRes.rows.length > 0;

    if (isRealUser) {
      // Real user flow: create pending friendship, XP awarded when accepted
      const addresseeId = targetRes.rows[0].id;

      if (addresseeId === req.user.sub) return res.status(400).json({ error: 'Cannot friend yourself.' });

      // Check if friendship already exists
      const existing = await pool.query(
        `SELECT id, status FROM friendships
         WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
        [req.user.sub, addresseeId]
      );
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Friendship already exists.', status: existing.rows[0].status });
      }

      // Create pending friendship - XP awarded only when they accept
      const result = await pool.query(
        `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending') RETURNING id, status, created_at`,
        [req.user.sub, addresseeId]
      );

      // Notify addressee of friend request
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, ref_id)
         VALUES ($1, 'friend_request', 'New friend request', $2, $3)`,
        [addresseeId, `@${req.user.username} wants to be friends`, result.rows[0].id]
      );

      res.status(201).json({ friendship: result.rows[0], pending: true });
    } else {
      // Mock/NPC user: create them in database and auto-accept friendship
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create mock user in database if they don't exist
        const mockEmail = `${username}@mock.linkup.local`;
        const mockPasswordHash = '$2a$12$mockpasswordhashnotusedforlogin';

        // Insert or get existing mock user
        let mockUserId;
        const existingMock = await client.query(
          'SELECT id FROM users WHERE username = $1',
          [username]
        );

        if (existingMock.rows.length > 0) {
          mockUserId = existingMock.rows[0].id;
        } else {
          // Create the mock user
          const newUser = await client.query(
            `INSERT INTO users (email, username, password_hash, is_verified)
             VALUES ($1, $2, $3, true) RETURNING id`,
            [mockEmail, username, mockPasswordHash]
          );
          mockUserId = newUser.rows[0].id;

          // Create profile for mock user (get display_name from request body if provided)
          const displayName = req.body.display_name || username.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
          const level = req.body.level || Math.floor(Math.random() * 15) + 1;
          const xp = req.body.xp || level * 100;
          await client.query(
            `INSERT INTO profiles (user_id, display_name, xp, level, bio)
             VALUES ($1, $2, $3, $4, $5)`,
            [mockUserId, displayName, xp, level, 'Mock user']
          );
        }

        // Check if friendship already exists
        const existing = await client.query(
          `SELECT id, status FROM friendships
           WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
          [req.user.sub, mockUserId]
        );

        let friendship;
        if (existing.rows.length > 0) {
          // Already friends
          friendship = existing.rows[0];
        } else {
          // Create accepted friendship immediately (mock users auto-accept)
          const result = await client.query(
            `INSERT INTO friendships (requester_id, addressee_id, status)
             VALUES ($1, $2, 'accepted') RETURNING id, status, created_at`,
            [req.user.sub, mockUserId]
          );
          friendship = result.rows[0];
        }

        await client.query('COMMIT');

        // Award XP
        try {
          await awardXP(req.user.sub, { eventType: 'friend_added', xp: 10, description: 'Added a new friend!' });
        } catch (xpErr) {
          console.log('XP award failed for mock friend:', xpErr.message);
        }

        res.status(201).json({
          friendship,
          mock: true
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } catch (err) { next(err); }
});

// ─── PATCH /api/friends/:id/respond ──────────────────────────────────────────
router.patch('/:id/respond', authenticate, [
  body('action').isIn(['accepted', 'blocked']),
], async (req, res, next) => {
  const { action } = req.body;
  try {
    const result = await pool.query(
      `UPDATE friendships SET status=$1, updated_at=NOW()
       WHERE id=$2 AND addressee_id=$3 AND status='pending'
       RETURNING *, (SELECT username FROM users WHERE id=requester_id) AS requester_username`,
      [action, req.params.id, req.user.sub]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found.' });

    if (action === 'accepted') {
      // Award both users XP
      await Promise.all([
        awardXP(req.user.sub,             { eventType:'friend_accepted', xp:10, description:'New friend!' }),
        awardXP(result.rows[0].requester_id, { eventType:'friend_accepted', xp:10, description:'Friend request accepted!' }),
      ]);
    }

    res.json({ friendship: result.rows[0] });
  } catch (err) { next(err); }
});

// ─── GET /api/friends — list accepted friends ─────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END AS friend_id,
         u.username, p.display_name, p.avatar_url, p.xp, p.level,
         f.created_at AS friends_since
       FROM friendships f
       JOIN users u   ON u.id = CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END
       JOIN profiles p ON p.user_id = u.id
       WHERE (f.requester_id=$1 OR f.addressee_id=$1) AND f.status='accepted'
       ORDER BY f.created_at DESC`,
      [req.user.sub]
    );
    res.json({ friends: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/friends/pending — incoming friend requests ─────────────────────
router.get('/pending', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.created_at, u.username, p.display_name, p.avatar_url, p.level
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       JOIN profiles p ON p.user_id = u.id
       WHERE f.addressee_id=$1 AND f.status='pending'
       ORDER BY f.created_at DESC`,
      [req.user.sub]
    );
    res.json({ requests: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
