-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 7: Groups Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── GROUPS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  emoji        VARCHAR(10) DEFAULT '👥',
  creator_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified     BOOLEAN DEFAULT FALSE,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GROUP MEMBERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ─── GROUP MESSAGES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  kind       VARCHAR(20) DEFAULT 'text' CHECK (kind IN ('text','system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GROUP MEETUP VERIFICATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_group   ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user    ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group  ON group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_verifications   ON group_verifications(group_id, user_id);
