require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const http          = require('http');
const { Server }    = require('socket.io');
const authRoutes        = require('./routes/auth');
const profileRoutes     = require('./routes/profiles');
const nearbyRoutes      = require('./routes/nearby');
const meetupRoutes      = require('./routes/meetups');
const leaderboardRoutes = require('./routes/leaderboard');
const friendRoutes      = require('./routes/friends');
const chatRoutes        = require('./routes/chat');
const shopRoutes        = require('./routes/shop');
const searchRoutes      = require('./routes/search');
const notifRoutes       = require('./routes/notifications');
const safetyRoutes      = require('./routes/safety');
const { errorHandler } = require('./middleware/errorHandler');
const { verifyAccessToken } = require('./utils/jwt');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // strict limit for auth endpoints
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth',        authLimiter, authRoutes);
app.use('/api/profiles',    profileRoutes);
app.use('/api/nearby',      nearbyRoutes);
app.use('/api/meetups',     meetupRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/friends',        friendRoutes);
app.use('/api/chat',           chatRoutes);
app.use('/api/shop',           shopRoutes);
app.use('/api/search',         searchRoutes);
app.use('/api/notifications',  notifRoutes);
app.use('/api/safety',         safetyRoutes);

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true },
});

// Attach io to every request so routes can emit
app.use((req, _res, next) => { req.io = io; next(); });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    socket.user = verifyAccessToken(token);
    next();
  } catch { next(new Error('Invalid token')); }
});

io.on('connection', (socket) => {
  console.log(`🔌 ${socket.user.username} connected`);
  socket.on('join_conversation', (convId) => socket.join(convId));
  socket.on('leave_conversation', (convId) => socket.leave(convId));
  socket.on('disconnect', () => console.log(`❌ ${socket.user.username} disconnected`));
});

// ─── Start ─────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 LinkUp API running on port ${PORT}`);
});

module.exports = app;
