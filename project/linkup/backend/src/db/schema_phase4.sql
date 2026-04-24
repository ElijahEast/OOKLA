-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 4: Chat, Friends, Shop Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── FRIENDSHIPS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','blocked')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_friend CHECK (requester_id != addressee_id),
  UNIQUE(requester_id, addressee_id)
);

-- ─── CONVERSATIONS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meetup_req_id   UUID REFERENCES meetup_requests(id),
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_a, participant_b)
);

-- ─── MESSAGES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  kind            VARCHAR(20) DEFAULT 'text' CHECK (kind IN ('text','system','emoji')),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SHOP ITEMS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(50) UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  cost_coins  INTEGER NOT NULL,
  duration_h  INTEGER,              -- null = permanent
  category    VARCHAR(30) DEFAULT 'boost',
  is_active   BOOLEAN DEFAULT TRUE
);

-- ─── USER INVENTORY ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES shop_items(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT FALSE
);

-- ─── IN-APP NOTIFICATIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  ref_id      UUID,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEED SHOP ITEMS ─────────────────────────────────────────────────────────
INSERT INTO shop_items (key, name, description, cost_coins, duration_h, category) VALUES
  ('profile_boost',  'Profile Boost',   'Show up first in nearby lists for 24h',    50,  24,   'boost'),
  ('stealth_mode',   'Stealth Mode',    'Browse the map invisibly for 1 hour',       30,  1,    'boost'),
  ('xp_multiplier',  'XP Multiplier',   '2× XP on all meetups for 24h',             100, 24,   'boost'),
  ('custom_badge_1', 'Explorer Badge',  'Exclusive gold explorer badge on profile',  150, NULL, 'cosmetic'),
  ('custom_badge_2', 'Flame Badge',     'Rare flame badge for streak masters',       200, NULL, 'cosmetic'),
  ('chat_theme',     'Dark Gold Theme', 'Gold chat bubble theme',                    75,  NULL, 'cosmetic')
ON CONFLICT (key) DO NOTHING;

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_convo        ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_user        ON inventory(user_id, is_active);
