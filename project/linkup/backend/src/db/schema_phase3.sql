-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 3: Gamification Schema Addition
-- Run after schema.sql: psql -U postgres -d linkup_db -f src/db/schema_phase3.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── MEETUP REQUESTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetup_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','declined','cancelled','completed')),
  message       TEXT,
  -- Location snapshot at time of request
  sender_lat    FLOAT,
  sender_lng    FLOAT,
  distance_m    INTEGER,
  -- Lifecycle
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  responded_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT one_pending_per_pair UNIQUE (sender_id, receiver_id)
    DEFERRABLE INITIALLY DEFERRED
);

-- ─── XP / POINTS LOG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(50) NOT NULL,
  xp_delta    INTEGER NOT NULL,           -- positive = gain, negative = spend
  coin_delta  INTEGER DEFAULT 0,
  description TEXT,
  ref_id      UUID,                       -- optional FK to meetup, quest, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── STREAKS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_activity   DATE,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── QUESTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(50) UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  xp_reward   INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  target      INTEGER DEFAULT 1,           -- how many times to complete action
  reset_type  VARCHAR(10) DEFAULT 'daily'  -- daily | weekly | once
);

CREATE TABLE IF NOT EXISTS user_quests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id    UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  progress    INTEGER DEFAULT 0,
  completed   BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  period_start DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, quest_id, period_start)
);

-- ─── LEADERBOARD VIEW ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.username,
  p.display_name,
  p.avatar_url,
  p.xp,
  p.level,
  p.total_meetups,
  p.coins,
  COALESCE(s.current_streak, 0) AS current_streak,
  RANK() OVER (ORDER BY p.xp DESC) AS rank
FROM users u
JOIN profiles p ON p.user_id = u.id
LEFT JOIN streaks s ON s.user_id = u.id
WHERE u.is_active = TRUE AND p.profile_visible = TRUE
ORDER BY rank;

-- ─── SEED QUESTS ─────────────────────────────────────────────────────────────
INSERT INTO quests (key, title, description, xp_reward, coin_reward, target, reset_type) VALUES
  ('first_linkup',     'First LinkUp',        'Send your first meetup request',                  50,  5,  1, 'once'),
  ('first_meetup',     'First Meetup',        'Complete your first real-world meetup',           100, 10, 1, 'once'),
  ('daily_explore',    'Daily Explorer',      'Open the map today',                              10,  0,  1, 'daily'),
  ('daily_request',    'Social Butterfly',    'Send 3 meetup requests today',                    30,  3,  3, 'daily'),
  ('weekly_meetups',   'Connector',           'Complete 5 meetups this week',                    200, 20, 5, 'weekly'),
  ('streak_3',         '3-Day Streak',        'Use LinkUp 3 days in a row',                      40,  5,  3, 'once'),
  ('streak_7',         'Week Warrior',        'Use LinkUp 7 days in a row',                      100, 15, 7, 'once')
ON CONFLICT (key) DO NOTHING;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_meetup_requests_receiver ON meetup_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_meetup_requests_sender   ON meetup_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_xp_events_user           ON xp_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_quests_user         ON user_quests(user_id, period_start);
