const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const pool = require('../db/pool');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } = require('../utils/jwt');
const { signupRules, loginRules, validate } = require('../middleware/validators');
const { authenticate } = require('../middleware/auth');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ─── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', signupRules, validate, async (req, res, next) => {
  const { email, username, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check uniqueness
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email or username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user
    const userResult = await client.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3) RETURNING id, email, username, role, created_at`,
      [email, username, password_hash]
    );
    const user = userResult.rows[0];

    // Create empty profile
    await client.query(
      `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
      [user.id, username]
    );

    await client.query('COMMIT');

    // Issue tokens
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store hashed refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, hashToken(refreshToken), expiresAt,
       req.headers['user-agent'], req.ip]
    );

    res.status(201).json({
      message: 'Account created.',
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', loginRules, validate, async (req, res, next) => {
  const { identifier, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, email, username, password_hash, role, is_active
       FROM users WHERE email = $1 OR username = $1`,
      [identifier]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account suspended.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last_login
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken  = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, hashToken(refreshToken), expiresAt,
       req.headers['user-agent'], req.ip]
    );

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (!stored.rows.length) {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Rotate: revoke old, issue new
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );

    const user = await pool.query(
      'SELECT id, username, role FROM users WHERE id = $1',
      [decoded.sub]
    );
    const u = user.rows[0];
    const payload = { sub: u.id, username: u.username, role: u.role };
    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [u.id, hashToken(newRefreshToken), expiresAt,
       req.headers['user-agent'], req.ip]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [hashToken(refreshToken)]
    ).catch(() => {});
  }
  res.json({ message: 'Logged out.' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.role, u.created_at,
              p.display_name, p.bio, p.avatar_url, p.xp, p.level, p.coins, p.total_meetups
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.sub]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
