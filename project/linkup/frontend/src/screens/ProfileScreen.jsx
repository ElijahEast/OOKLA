import React, { useState } from 'react';
import { C, levelProgress } from '../utils/constants';
import { Avatar, StatusBar } from '../components/ui';
import { LEADERBOARD } from '../utils/data';

export function ProfileScreen({ user, xp, coins, quests, friends, onOpenSafety }) {
  const [tab, setTab] = useState('overview');
  const prog = levelProgress(xp);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Profile</h2>
        <button onClick={onOpenSafety} style={{ background: `${C.success}18`, border: `1px solid ${C.success}44`, borderRadius: 10, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14 }}>🛡️</span><span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>Safety</span>
        </button>
      </div>
      <div style={{ display: 'flex', gap: 0, margin: '10px 18px', background: C.surface, borderRadius: 13, padding: 4, flexShrink: 0 }}>
        {[{ id: 'overview', l: 'Overview' }, { id: 'leaderboard', l: 'Leaderboard' }, { id: 'badges', l: 'Badges' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '7px', borderRadius: 10, border: 'none', background: tab === t.id ? C.accent : 'none', color: tab === t.id ? '#fff' : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{t.l}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>

        {tab === 'overview' && <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: `linear-gradient(135deg,${C.accent},oklch(62% 0.22 55))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', border: `3px solid ${C.bg}`, boxShadow: '0 4px 14px rgba(0,0,0,0.4)', flexShrink: 0 }}>
              {(user?.display_name || user?.displayName)?.[0]?.toUpperCase() || 'Y'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>{user?.display_name || user?.displayName || 'You'}</h3>
              <p style={{ color: C.muted, fontSize: 12 }}>@{user?.username || 'you'}</p>
              {user?.bio && <p style={{ color: C.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{user.bio}</p>}
            </div>
          </div>
          <div style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: C.accent, fontWeight: 800, fontSize: 12 }}>Level {prog.level}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>{prog.pct}% · {prog.into}/{prog.needed} XP</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${prog.pct}%`, background: `linear-gradient(90deg,${C.accent},oklch(62% 0.22 55))`, borderRadius: 99, transition: 'width 0.6s' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 12 }}>
            {[{ v: xp, l: 'XP' }, { v: prog.level, l: 'Level' }, { v: friends.length, l: 'Friends' }, { v: coins, l: '🪙 Coins' }].map(s => (
              <div key={s.l} style={{ background: C.surface, borderRadius: 12, padding: '9px 5px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.text, fontWeight: 800, fontSize: 15 }}>{s.v}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{s.l}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'oklch(62% 0.2 30/0.09)', border: '1px solid oklch(62% 0.2 30/0.22)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 26 }}>🔥</span>
            <div><p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>1-day streak</p><p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>Come back tomorrow to keep it going!</p></div>
          </div>
          {user?.interests?.length > 0 && <div>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Interests</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {user.interests.map(tag => <span key={tag} style={{ padding: '4px 11px', borderRadius: 20, background: C.accentL, color: C.accent, fontSize: 12, fontWeight: 600, border: `1px solid ${C.accent}33` }}>{tag}</span>)}
            </div>
          </div>}
        </div>}

        {tab === 'leaderboard' && <div style={{ padding: '0 15px 15px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 10, padding: '4px 0 14px' }}>
            {[1, 0, 2].map(idx => {
              const u = LEADERBOARD[idx]; if (!u) return <div key={idx} style={{ width: 86 }} />;
              const heights = [76, 96, 68]; const hi = [1, 0, 2].indexOf(idx);
              return (
                <div key={u.username} style={{ width: 86, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <Avatar name={u.display_name} color={u.color} size={idx === 0 ? 44 : 34} />
                  <p style={{ color: C.text, fontWeight: 700, fontSize: 10, textAlign: 'center' }}>{u.display_name.split(' ')[0]}</p>
                  <div style={{ width: '100%', height: heights[hi], background: idx === 0 ? C.accent : C.surface, border: `1px solid ${idx === 0 ? 'transparent' : C.border}`, borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 7 }}>
                    <span style={{ fontSize: 16 }}>{medals[idx]}</span>
                    <p style={{ color: idx === 0 ? '#fff' : C.muted, fontSize: 10, fontWeight: 700, marginTop: 3 }}>{u.xp}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {LEADERBOARD.map((u, i) => (
            <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.surface, borderRadius: 13, marginBottom: 7, border: `1.5px solid ${C.border}` }}>
              <span style={{ color: i < 3 ? [C.gold, 'oklch(70% 0.01 265)', 'oklch(65% 0.12 35)'][i] : C.muted, fontWeight: 800, fontSize: 13, width: 24, textAlign: 'center', flexShrink: 0 }}>{i < 3 ? medals[i] : `#${u.rank}`}</span>
              <Avatar name={u.display_name} color={u.color} size={34} />
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{u.display_name}</p><p style={{ color: C.muted, fontSize: 11 }}>Lv {u.level} · 🤝{u.total_meetups} · 🔥{u.current_streak}d</p></div>
              <span style={{ color: C.muted, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{u.xp}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.accentL, borderRadius: 13, marginBottom: 7, border: `1.5px solid ${C.accent}` }}>
            <span style={{ color: C.muted, fontWeight: 800, fontSize: 13, width: 24, textAlign: 'center', flexShrink: 0 }}>#6</span>
            <Avatar name="You" color={C.accent} size={34} />
            <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>You</p><p style={{ color: C.muted, fontSize: 11 }}>Lv {prog.level} · 🤝0 · 🔥1d</p></div>
            <span style={{ color: C.accent, fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{xp}</span>
          </div>
        </div>}

        {tab === 'badges' && <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
            {[
              { e: '🌟', l: 'New Arrival', desc: 'Joined LinkUp', earned: true },
              { e: '📍', l: 'First Pin', desc: 'Set location', earned: true },
              { e: '🗺️', l: 'Explorer', desc: 'Opened map', earned: true },
              { e: '👋', l: 'First Link', desc: 'Send a request', earned: false },
              { e: '🤝', l: 'Connector', desc: '5 meetups', earned: false },
              { e: '🔥', l: 'On Fire', desc: '7-day streak', earned: false },
              { e: '🏅', l: 'Elite', desc: 'Level 20', earned: false },
              { e: '💬', l: 'Chatterbox', desc: '50 messages', earned: false },
              { e: '🏆', l: 'Top 10', desc: 'Leaderboard', earned: false },
            ].map(b => (
              <div key={b.l} style={{ background: b.earned ? C.surface : 'oklch(14% 0.01 265)', border: `1px solid ${b.earned ? C.border : 'oklch(20% 0.01 265)'}`, borderRadius: 16, padding: '14px 10px', textAlign: 'center', opacity: b.earned ? 1 : 0.45 }}>
                <div style={{ fontSize: 28, marginBottom: 5, filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.e}</div>
                <p style={{ color: b.earned ? C.text : C.muted, fontWeight: 700, fontSize: 12 }}>{b.l}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
