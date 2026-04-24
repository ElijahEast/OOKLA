const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── POST /api/safety/block ───────────────────────────────────────────────────
router.post('/block', authenticate, [
  body('username').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Username required.' });

  try {
    const target = await pool.query('SELECT id FROM users WHERE username=$1', [req.body.username]);
    if (!target.rows.length) return res.status(404).json({ error: 'User not found.' });
    const blockedId = target.rows[0].id;
    if (blockedId === req.user.sub) return res.status(400).json({ error: 'Cannot block yourself.' });

    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.sub, blockedId]
    );

    // Also remove any friendship
    await pool.query(
      `DELETE FROM friendships WHERE
        (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`,
      [req.user.sub, blockedId]
    );

    res.json({ message: `@${req.body.username} has been blocked.` });
  } catch (err) { next(err); }
});

// ─── DELETE /api/safety/block/:username ──────────────────────────────────────
router.delete('/block/:username', authenticate, async (req, res, next) => {
  try {
    const target = await pool.query('SELECT id FROM users WHERE username=$1', [req.params.username]);
    if (!target.rows.length) return res.status(404).json({ error: 'User not found.' });
    await pool.query(
      'DELETE FROM blocks WHERE blocker_id=$1 AND blocked_id=$2',
      [req.user.sub, target.rows[0].id]
    );
    res.json({ message: 'Unblocked.' });
  } catch (err) { next(err); }
});

// ─── GET /api/safety/blocks ───────────────────────────────────────────────────
router.get('/blocks', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.username, p.display_name, p.avatar_url, b.created_at
       FROM blocks b JOIN users u ON u.id=b.blocked_id JOIN profiles p ON p.user_id=u.id
       WHERE b.blocker_id=$1 ORDER BY b.created_at DESC`,
      [req.user.sub]
    );
    res.json({ blocks: result.rows });
  } catch (err) { next(err); }
});

// ─── POST /api/safety/report ──────────────────────────────────────────────────
router.post('/report', authenticate, [
  body('username').trim().notEmpty(),
  body('category').isIn(['spam','harassment','fake_profile','inappropriate_content','underage','scam','violence','other']),
  body('description').optional().trim().isLength({ max: 500 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid report data.', fields: errors.array() });

  try {
    const target = await pool.query('SELECT id FROM users WHERE username=$1', [req.body.username]);
    if (!target.rows.length) return res.status(404).json({ error: 'User not found.' });
    const reportedId = target.rows[0].id;
    if (reportedId === req.user.sub) return res.status(400).json({ error: 'Cannot report yourself.' });

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_id, category, description)
       VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
      [req.user.sub, reportedId, req.body.category, req.body.description || null]
    );

    // Auto-block after report
    await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.sub, reportedId]
    );

    res.status(201).json({ report: result.rows[0], message: 'Report submitted. The user has been blocked.' });
  } catch (err) { next(err); }
});

// ─── GET/POST /api/safety/trusted-contacts ────────────────────────────────────
router.get('/trusted-contacts', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT tc.id, tc.external_name, tc.external_phone, tc.created_at,
              u.username, p.display_name, p.avatar_url
       FROM trusted_contacts tc
       LEFT JOIN users u ON u.id=tc.contact_id
       LEFT JOIN profiles p ON p.user_id=u.id
       WHERE tc.user_id=$1 ORDER BY tc.created_at`,
      [req.user.sub]
    );
    res.json({ contacts: result.rows });
  } catch (err) { next(err); }
});

router.post('/trusted-contacts', authenticate, [
  body('username').optional().trim(),
  body('external_name').optional().trim().isLength({ max: 100 }),
  body('external_phone').optional().trim().isLength({ max: 30 }),
], async (req, res, next) => {
  const { username, external_name, external_phone } = req.body;
  try {
    let contactId = null;
    if (username) {
      const u = await pool.query('SELECT id FROM users WHERE username=$1', [username]);
      if (!u.rows.length) return res.status(404).json({ error: 'User not found.' });
      contactId = u.rows[0].id;
      if (contactId === req.user.sub) return res.status(400).json({ error: 'Cannot add yourself.' });
    }
    const result = await pool.query(
      `INSERT INTO trusted_contacts (user_id, contact_id, external_name, external_phone)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *`,
      [req.user.sub, contactId, external_name || null, external_phone || null]
    );
    res.status(201).json({ contact: result.rows[0] });
  } catch (err) { next(err); }
});

router.delete('/trusted-contacts/:id', authenticate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM trusted_contacts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.sub]);
    res.json({ message: 'Removed.' });
  } catch (err) { next(err); }
});

// ─── POST /api/safety/checkin/start ──────────────────────────────────────────
router.post('/checkin/start', authenticate, [
  body('minutes').isInt({ min: 15, max: 240 }),
  body('meetup_req_id').optional().isUUID(),
  body('alert_contact_id').optional().isUUID(),
  body('alert_phone').optional().trim(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid check-in data.' });

  const { minutes, meetup_req_id, alert_contact_id, alert_phone } = req.body;
  const dueAt = new Date(Date.now() + minutes * 60 * 1000);
  try {
    // Cancel any active check-in
    await pool.query(
      `UPDATE safety_checkins SET status='cancelled' WHERE user_id=$1 AND status='active'`,
      [req.user.sub]
    );
    const result = await pool.query(
      `INSERT INTO safety_checkins (user_id, meetup_req_id, alert_contact_id, alert_phone, due_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.sub, meetup_req_id || null, alert_contact_id || null, alert_phone || null, dueAt]
    );
    res.status(201).json({ checkin: result.rows[0] });
  } catch (err) { next(err); }
});

// ─── POST /api/safety/checkin/confirm ────────────────────────────────────────
router.post('/checkin/confirm', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE safety_checkins SET status='checked_in', checked_in_at=NOW()
       WHERE user_id=$1 AND status='active' RETURNING *`,
      [req.user.sub]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No active check-in.' });
    res.json({ checkin: result.rows[0], message: 'Check-in confirmed. Stay safe!' });
  } catch (err) { next(err); }
});

// ─── PATCH /api/safety/location-privacy ──────────────────────────────────────
router.patch('/location-privacy', authenticate, [
  body('precision').isIn(['exact','approximate','hidden']),
  body('blur_m').optional().isInt({ min: 100, max: 5000 }),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid precision value.' });

  try {
    await pool.query(
      `UPDATE profiles SET location_precision=$1, location_blur_m=$2 WHERE user_id=$3`,
      [req.body.precision, req.body.blur_m || 500, req.user.sub]
    );
    res.json({ message: 'Location privacy updated.' });
  } catch (err) { next(err); }
});

module.exports = router;
