const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── GET /api/chat — list conversations ───────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.last_message_at,
         CASE WHEN c.participant_a=$1 THEN c.participant_b ELSE c.participant_a END AS other_id,
         u.username AS other_username, p.display_name AS other_name, p.avatar_url AS other_avatar,
         (SELECT body FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_msg,
         (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND sender_id!=$ 1 AND read_at IS NULL) AS unread
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.participant_a=$1 THEN c.participant_b ELSE c.participant_a END
       JOIN profiles p ON p.user_id = u.id
       WHERE c.participant_a=$1 OR c.participant_b=$1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [req.user.sub]
    );
    res.json({ conversations: result.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/chat/:convId/messages ───────────────────────────────────────────
router.get('/:convId/messages', authenticate, async (req, res, next) => {
  try {
    // Verify user is participant
    const convRes = await pool.query(
      'SELECT * FROM conversations WHERE id=$1 AND (participant_a=$2 OR participant_b=$2)',
      [req.params.convId, req.user.sub]
    );
    if (!convRes.rows.length) return res.status(403).json({ error: 'Not a participant.' });

    const msgs = await pool.query(
      `SELECT m.id, m.body, m.kind, m.created_at, m.read_at,
              m.sender_id, u.username AS sender_username, p.display_name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       JOIN profiles p ON p.user_id = u.id
       WHERE m.conversation_id=$1
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [req.params.convId]
    );

    // Mark as read
    await pool.query(
      `UPDATE messages SET read_at=NOW() WHERE conversation_id=$1 AND sender_id!=$2 AND read_at IS NULL`,
      [req.params.convId, req.user.sub]
    );

    res.json({ messages: msgs.rows });
  } catch (err) { next(err); }
});

// ─── POST /api/chat/:convId/messages ─────────────────────────────────────────
router.post('/:convId/messages', authenticate, [
  body('body').trim().isLength({ min:1, max:1000 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Message body required.' });

  try {
    const convRes = await pool.query(
      'SELECT * FROM conversations WHERE id=$1 AND (participant_a=$2 OR participant_b=$2)',
      [req.params.convId, req.user.sub]
    );
    if (!convRes.rows.length) return res.status(403).json({ error: 'Not a participant.' });

    const msg = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)
       RETURNING id, body, kind, created_at, sender_id`,
      [req.params.convId, req.user.sub, req.body.body]
    );

    await pool.query(
      'UPDATE conversations SET last_message_at=NOW() WHERE id=$1',
      [req.params.convId]
    );

    // Emit via Socket.io (attached to req.io in server.js)
    if (req.io) {
      req.io.to(req.params.convId).emit('new_message', {
        ...msg.rows[0],
        sender_username: req.user.username,
      });
    }

    res.status(201).json({ message: msg.rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /api/chat/open — open or get conversation with a user ───────────────
router.post('/open', authenticate, [
  body('username').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Username required.' });

  try {
    const targetRes = await pool.query('SELECT id FROM users WHERE username=$1', [req.body.username]);
    if (!targetRes.rows.length) return res.status(404).json({ error: 'User not found.' });
    const otherId = targetRes.rows[0].id;

    const [a, b] = [req.user.sub, otherId].sort();
    const existing = await pool.query(
      'SELECT * FROM conversations WHERE participant_a=$1 AND participant_b=$2', [a, b]
    );
    if (existing.rows.length) return res.json({ conversation: existing.rows[0] });

    const created = await pool.query(
      `INSERT INTO conversations (participant_a, participant_b) VALUES ($1,$2) RETURNING *`, [a, b]
    );
    res.status(201).json({ conversation: created.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
