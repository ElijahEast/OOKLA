const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// All group routes require authentication
router.use(requireAuth);

// ── GET /api/groups — list groups the current user belongs to ─────────────────
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        g.id, g.name, g.emoji, g.creator_id, g.verified, g.verified_at, g.created_at,
        json_agg(
          json_build_object(
            'user_id', u.id,
            'username', u.username,
            'display_name', p.display_name,
            'level', COALESCE(p.level, 1)
          ) ORDER BY gm.joined_at
        ) AS members
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      JOIN group_members me ON me.group_id = g.id AND me.user_id = $1
      JOIN users u ON u.id = gm.user_id
      JOIN profiles p ON p.user_id = u.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `, [req.user.id]);

    res.json({ groups: rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/groups — create a new group ─────────────────────────────────────
router.post('/', async (req, res, next) => {
  const { name, emoji = '👥', member_ids = [] } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  if (member_ids.length < 2) {
    return res.status(400).json({ error: 'A group needs at least 2 other members' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [group] } = await client.query(
      `INSERT INTO groups (name, emoji, creator_id) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), emoji, req.user.id]
    );

    // Add creator + all members
    const allMembers = [req.user.id, ...member_ids];
    for (const uid of allMembers) {
      await client.query(
        `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [group.id, uid]
      );
    }

    // System message
    await client.query(
      `INSERT INTO group_messages (group_id, body, kind) VALUES ($1, $2, 'system')`,
      [group.id, `🎉 ${group.name} created · ${allMembers.length} members`]
    );

    await client.query('COMMIT');

    // Fetch full group with members
    const { rows: [full] } = await client.query(`
      SELECT
        g.id, g.name, g.emoji, g.creator_id, g.verified, g.created_at,
        json_agg(
          json_build_object(
            'user_id', u.id,
            'username', u.username,
            'display_name', p.display_name,
            'level', COALESCE(p.level, 1)
          ) ORDER BY gm.joined_at
        ) AS members
      FROM groups g
      JOIN group_members gm ON gm.group_id = g.id
      JOIN users u ON u.id = gm.user_id
      JOIN profiles p ON p.user_id = u.id
      WHERE g.id = $1
      GROUP BY g.id
    `, [group.id]);

    res.status(201).json({ group: full });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ── GET /api/groups/:id/messages — fetch messages ─────────────────────────────
router.get('/:id/messages', async (req, res, next) => {
  try {
    // Verify membership
    const { rows: [member] } = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // ISO timestamp for pagination

    const { rows } = await pool.query(`
      SELECT
        gm.id, gm.body, gm.kind, gm.created_at,
        u.username AS sender_username,
        p.display_name AS sender_display_name
      FROM group_messages gm
      LEFT JOIN users u ON u.id = gm.sender_id
      LEFT JOIN profiles p ON p.user_id = gm.sender_id
      WHERE gm.group_id = $1
        ${before ? `AND gm.created_at < $3` : ''}
      ORDER BY gm.created_at DESC
      LIMIT $2
    `, before ? [req.params.id, limit, before] : [req.params.id, limit]);

    res.json({ messages: rows.reverse() });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/groups/:id/messages — send a message ───────────────────────────
router.post('/:id/messages', async (req, res, next) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: 'Message body required' });

  try {
    const { rows: [member] } = await pool.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member) return res.status(403).json({ error: 'Not a member of this group' });

    const { rows: [msg] } = await pool.query(`
      INSERT INTO group_messages (group_id, sender_id, body, kind)
      VALUES ($1, $2, $3, 'text')
      RETURNING id, body, kind, created_at
    `, [req.params.id, req.user.id, body.trim()]);

    // Real-time broadcast via socket.io
    req.io?.to(`group:${req.params.id}`).emit('group_message', {
      ...msg,
      sender_username: req.user.username,
    });

    res.status(201).json({ message: msg });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/groups/:id/verify — record a member's verification ──────────────
router.post('/:id/verify', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [member] } = await client.query(
      `SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!member) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    // Upsert verification
    await client.query(`
      INSERT INTO group_verifications (group_id, user_id) VALUES ($1, $2)
      ON CONFLICT (group_id, user_id) DO NOTHING
    `, [req.params.id, req.user.id]);

    // Check if all members verified
    const { rows: [counts] } = await client.query(`
      SELECT
        COUNT(DISTINCT gm.user_id) AS total,
        COUNT(DISTINCT gv.user_id) AS verified
      FROM group_members gm
      LEFT JOIN group_verifications gv
        ON gv.group_id = gm.group_id AND gv.user_id = gm.user_id
      WHERE gm.group_id = $1
    `, [req.params.id]);

    const allVerified = parseInt(counts.total) === parseInt(counts.verified);

    if (allVerified) {
      await client.query(
        `UPDATE groups SET verified = TRUE, verified_at = NOW() WHERE id = $1`,
        [req.params.id]
      );
      // Award XP to all members
      await client.query(`
        UPDATE xp_events SET xp = xp + 75 WHERE user_id IN (
          SELECT user_id FROM group_members WHERE group_id = $1
        )
      `, [req.params.id]).catch(() => {}); // best-effort
    }

    await client.query('COMMIT');

    res.json({
      verified_count: parseInt(counts.verified),
      total_count: parseInt(counts.total),
      all_verified: allVerified,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ── DELETE /api/groups/:id — leave a group ────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    // If no members left, delete the group
    const { rows: [{ count }] } = await client.query(
      `SELECT COUNT(*) FROM group_members WHERE group_id = $1`,
      [req.params.id]
    );
    if (parseInt(count) === 0) {
      await client.query(`DELETE FROM groups WHERE id = $1`, [req.params.id]);
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
