const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// ─── GET /api/shop — list all items ──────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const items = await pool.query(
      'SELECT * FROM shop_items WHERE is_active=TRUE ORDER BY cost_coins ASC'
    );
    // Fetch user's owned items
    const owned = await pool.query(
      `SELECT item_id, is_active, expires_at FROM inventory WHERE user_id=$1`,
      [req.user.sub]
    );
    const ownedMap = {};
    owned.rows.forEach(o => { ownedMap[o.item_id] = o; });

    const coins = await pool.query('SELECT coins FROM profiles WHERE user_id=$1', [req.user.sub]);

    res.json({
      items: items.rows.map(i => ({ ...i, owned: !!ownedMap[i.id], active: ownedMap[i.id]?.is_active })),
      coins: coins.rows[0]?.coins || 0,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/shop/buy ───────────────────────────────────────────────────────
router.post('/buy', authenticate, [
  body('item_key').trim().notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'item_key required.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemRes = await client.query('SELECT * FROM shop_items WHERE key=$1 AND is_active=TRUE', [req.body.item_key]);
    if (!itemRes.rows.length) return res.status(404).json({ error: 'Item not found.' });
    const item = itemRes.rows[0];

    const profileRes = await client.query('SELECT coins FROM profiles WHERE user_id=$1 FOR UPDATE', [req.user.sub]);
    const coins = profileRes.rows[0].coins;

    if (coins < item.cost_coins) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'Insufficient coins.', have: coins, need: item.cost_coins });
    }

    // Deduct coins — never below 0
    await client.query(
      'UPDATE profiles SET coins = GREATEST(0, coins - $1) WHERE user_id=$2',
      [item.cost_coins, req.user.sub]
    );

    const expiresAt = item.duration_h
      ? new Date(Date.now() + item.duration_h * 3600 * 1000)
      : null;

    const inv = await client.query(
      `INSERT INTO inventory (user_id, item_id, expires_at)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.user.sub, item.id, expiresAt]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Purchase successful.',
      item,
      inventory: inv.rows[0],
      coins_remaining: Math.max(0, coins - item.cost_coins),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── POST /api/shop/activate/:invId ──────────────────────────────────────────
router.post('/activate/:invId', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE inventory SET is_active=TRUE, activated_at=NOW()
       WHERE id=$1 AND user_id=$2 AND is_active=FALSE
       RETURNING *`,
      [req.params.invId, req.user.sub]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found or already active.' });
    res.json({ inventory: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
