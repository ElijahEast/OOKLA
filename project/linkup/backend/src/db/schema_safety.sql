-- ─────────────────────────────────────────────────────────────────────────────
-- Safety Schema: blocks, reports, trusted contacts, safety check-ins
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── BLOCKS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

-- ─── REPORTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     VARCHAR(50) NOT NULL
                 CHECK (category IN (
                   'spam','harassment','fake_profile','inappropriate_content',
                   'underage','scam','violence','other'
                 )),
  description  TEXT,
  status       VARCHAR(20) DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  reviewed_by  UUID REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

-- ─── TRUSTED CONTACTS ─────────────────────────────────────────────────────────
-- Trusted contacts can see your exact location during a meetup
CREATE TABLE IF NOT EXISTS trusted_contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Can also be an external contact (name + phone, no account needed)
  external_name   VARCHAR(100),
  external_phone  VARCHAR(30),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_trust CHECK (user_id != contact_id),
  UNIQUE(user_id, contact_id)
);

-- ─── SAFETY CHECK-INS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_checkins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meetup_req_id   UUID REFERENCES meetup_requests(id),
  -- Who to alert if check-in is missed
  alert_contact_id UUID REFERENCES users(id),
  alert_phone      VARCHAR(30),
  -- Timing
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  due_at          TIMESTAMPTZ NOT NULL,    -- when user must check in by
  checked_in_at   TIMESTAMPTZ,
  -- Status
  status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active','checked_in','missed','cancelled')),
  -- Location snapshot at start
  lat             FLOAT,
  lng             FLOAT
);

-- ─── LOCATION PRIVACY SETTINGS ───────────────────────────────────────────────
-- Extends profiles — add columns if not present
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_precision VARCHAR(20)
    DEFAULT 'approximate'
    CHECK (location_precision IN ('exact','approximate','hidden')),
  ADD COLUMN IF NOT EXISTS location_blur_m INTEGER DEFAULT 500;

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blocks_blocker    ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked    ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported  ON reports(reported_id, status);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts  ON trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins   ON safety_checkins(user_id, status);
