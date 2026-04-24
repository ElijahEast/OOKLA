const pool = require('../db/pool');

// ─── XP Level thresholds ──────────────────────────────────────────────────────
// Level N requires cumulative XP: 100 * N^1.5
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function levelFromXp(totalXp) {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) level++;
  return level;
}

function xpToNextLevel(totalXp) {
  const current = levelFromXp(totalXp);
  const nextThreshold = xpForLevel(current + 1);
  const curThreshold  = xpForLevel(current);
  return {
    level: current,
    xpIntoLevel: totalXp - curThreshold,
    xpNeeded: nextThreshold - curThreshold,
    progressPct: Math.round(((totalXp - curThreshold) / (nextThreshold - curThreshold)) * 100),
  };
}

// ─── Award XP + coins ─────────────────────────────────────────────────────────
async function awardXP(userId, { eventType, xp, coins = 0, description, refId } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Log event
    await client.query(
      `INSERT INTO xp_events (user_id, event_type, xp_delta, coin_delta, description, ref_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, eventType, xp, coins, description, refId || null]
    );

    // Update profile totals
    const result = await client.query(
      `UPDATE profiles
       SET xp    = xp    + $1,
           coins = coins + $2
       WHERE user_id = $3
       RETURNING xp, coins`,
      [xp, coins, userId]
    );

    const { xp: newXp, coins: newCoins } = result.rows[0];
    const newLevel = levelFromXp(newXp);

    // Check if leveled up — update profile level
    const prev = await client.query('SELECT level FROM profiles WHERE user_id = $1', [userId]);
    const prevLevel = prev.rows[0].level;
    let leveledUp = false;

    if (newLevel > prevLevel) {
      await client.query('UPDATE profiles SET level = $1 WHERE user_id = $2', [newLevel, userId]);
      leveledUp = true;
    }

    await client.query('COMMIT');

    return {
      xpAwarded: xp,
      coinsAwarded: coins,
      newXp,
      newCoins,
      newLevel,
      leveledUp,
      levelProgress: xpToNextLevel(newXp),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─── Update streak ─────────────────────────────────────────────────────────────
async function updateStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const result = await pool.query(
    'SELECT * FROM streaks WHERE user_id = $1', [userId]
  );

  if (!result.rows.length) {
    await pool.query(
      `INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity)
       VALUES ($1, 1, 1, $2)`,
      [userId, today]
    );
    return { current_streak: 1, longest_streak: 1, isNewDay: true };
  }

  const streak = result.rows[0];
  const last = streak.last_activity?.toISOString?.()?.slice(0, 10) || null;

  if (last === today) {
    return { current_streak: streak.current_streak, longest_streak: streak.longest_streak, isNewDay: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newCurrent = last === yesterday ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(streak.longest_streak, newCurrent);

  await pool.query(
    `UPDATE streaks SET current_streak=$1, longest_streak=$2, last_activity=$3, updated_at=NOW()
     WHERE user_id=$4`,
    [newCurrent, newLongest, today, userId]
  );

  return { current_streak: newCurrent, longest_streak: newLongest, isNewDay: true };
}

// ─── Advance quest progress ───────────────────────────────────────────────────
async function advanceQuest(userId, questKey) {
  const questRes = await pool.query('SELECT * FROM quests WHERE key = $1', [questKey]);
  if (!questRes.rows.length) return null;
  const quest = questRes.rows[0];

  const today = new Date().toISOString().slice(0, 10);
  const period = quest.reset_type === 'weekly'
    ? new Date(Date.now() - new Date().getDay() * 86400000).toISOString().slice(0, 10)
    : today;

  const uqRes = await pool.query(
    `SELECT * FROM user_quests WHERE user_id=$1 AND quest_id=$2 AND period_start=$3`,
    [userId, quest.id, period]
  );

  if (uqRes.rows.length && uqRes.rows[0].completed) return { alreadyDone: true };

  let progress, completed, reward = null;

  if (!uqRes.rows.length) {
    progress = 1;
    completed = progress >= quest.target;
    await pool.query(
      `INSERT INTO user_quests (user_id, quest_id, progress, completed, completed_at, period_start)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, quest.id, progress, completed, completed ? new Date() : null, period]
    );
  } else {
    progress = uqRes.rows[0].progress + 1;
    completed = progress >= quest.target;
    await pool.query(
      `UPDATE user_quests SET progress=$1, completed=$2, completed_at=$3
       WHERE user_id=$4 AND quest_id=$5 AND period_start=$6`,
      [progress, completed, completed ? new Date() : null, userId, quest.id, period]
    );
  }

  if (completed) {
    reward = await awardXP(userId, {
      eventType: `quest_complete:${questKey}`,
      xp: quest.xp_reward,
      coins: quest.coin_reward,
      description: `Quest completed: ${quest.title}`,
      refId: quest.id,
    });
  }

  return { quest, progress, completed, reward };
}

module.exports = { awardXP, updateStreak, advanceQuest, levelFromXp, xpToNextLevel };
