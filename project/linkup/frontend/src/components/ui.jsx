import { useState } from 'react';
import { C } from '../utils/constants';

export function Spinner({ color = '#fff', size = 20 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2.5px solid ${color}44`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

export function StatusBar() {
  const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px 0', color: C.text, fontSize: 13, fontWeight: 600 }}>
      <span>{t}</span>
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={C.text}><rect x="0" y="3" width="3" height="8" rx="1"/><rect x="4.5" y="2" width="3" height="9" rx="1"/><rect x="9" y=".5" width="3" height="10.5" rx="1"/><rect x="13.5" y="0" width="2.5" height="11" rx="1"/></svg>
        <svg width="17" height="11" viewBox="0 0 24 11" fill={C.text}><rect x="0" y="1.5" width="21" height="8" rx="2" stroke={C.text} strokeWidth="1.5" fill="none"/><rect x="21.5" y="3.5" width="2" height="4" rx="1" fill={C.text}/><rect x="1.5" y="3" width="13" height="5" rx="1"/></svg>
      </div>
    </div>
  );
}

export function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: 9, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 12px ${C.accent}55` }}>
        <Icon name="map" size={14} color="#fff" />
      </div>
      <span style={{ fontSize: 20, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
        Link<span style={{ color: C.accent }}>Up</span>
      </span>
    </div>
  );
}

export function Avatar({ name, color, size = 44 }) {
  const i = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || C.raised, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      border: `2px solid ${C.border}`,
    }}>{i}</div>
  );
}

export function Btn({ children, onClick, variant = 'primary', loading, disabled, full = true, small, style: sx = {} }) {
  const [pr, setPr] = useState(false);
  const h = small ? 40 : 54;
  const vs = {
    primary: { background: C.accent, color: '#fff', boxShadow: `0 4px 18px ${C.accent}44` },
    ghost:   { background: C.surface, color: C.text, border: `1.5px solid ${C.border}` },
    subtle:  { background: C.accentG, color: C.accent, border: `1px solid ${C.accentL}` },
    success: { background: 'oklch(62% 0.18 145)', color: '#fff' },
    danger:  { background: 'oklch(62% 0.2 15/0.12)', color: C.error, border: `1px solid oklch(62% 0.2 15/0.25)` },
  };
  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      onMouseDown={() => setPr(true)}
      onMouseUp={() => setPr(false)}
      onMouseLeave={() => setPr(false)}
      style={{
        width: full ? '100%' : undefined,
        height: h, borderRadius: small ? 12 : 16,
        border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontSize: small ? 13 : 16, fontWeight: 700, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        transition: 'all 0.15s', transform: pr ? 'scale(0.97)' : 'scale(1)',
        opacity: disabled || loading ? 0.55 : 1,
        paddingLeft: small ? 14 : undefined, paddingRight: small ? 14 : undefined,
        flexShrink: 0, ...vs[variant], ...sx,
      }}
    >
      {loading ? <Spinner color={variant === 'ghost' || variant === 'danger' ? C.muted : '#fff'} /> : children}
    </button>
  );
}

export function XPToast({ events }) {
  return (
    <div style={{ position: 'absolute', top: 80, right: 14, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none' }}>
      {events.map(ev => (
        <div key={ev.id} style={{ background: C.accent, color: '#fff', fontWeight: 800, fontSize: 12, borderRadius: 20, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5, animation: 'xpFloat 2s ease forwards', boxShadow: `0 4px 14px ${C.accent}66` }}>
          <Icon name="zap" size={12} color="#fff" />+{ev.xp} XP{ev.coins ? <> · 🪙+{ev.coins}</> : null}
        </div>
      ))}
    </div>
  );
}

export function LevelUpModal({ level, onDismiss }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', animation: 'fadeIn 0.2s' }}>
      <div style={{ background: C.surface, borderRadius: 28, padding: '34px 30px', textAlign: 'center', width: 300, border: `1px solid ${C.border}`, animation: 'pop 0.4s ease' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🎉</div>
        <div style={{ background: `linear-gradient(135deg,${C.accent},${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Level {level}!</div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>You've leveled up! Keep exploring and meeting people.</p>
        <Btn onClick={onDismiss}>Awesome! 🚀</Btn>
      </div>
    </div>
  );
}

export function BottomNav({ active, onTab, inboxCount = 0 }) {
  const tabs = [
    { id: 'map',     icon: 'map',    label: 'Explore' },
    { id: 'people',  icon: 'people', label: 'People', badge: inboxCount },
    { id: 'events',  icon: 'events', label: 'Events' },
    { id: 'shop',    icon: 'shop',   label: 'Shop' },
    { id: 'profile', icon: 'user',   label: 'Profile' },
  ];
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
      {tabs.map(tab => {
        const on = active === tab.id;
        const eventsIcon = <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={on ? C.accent : C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><circle cx="12" cy="15" r="1.6" fill={on ? C.accent : C.muted}/></svg>;
        return (
          <button key={tab.id} onClick={() => onTab(tab.id)} style={{ flex: 1, padding: '10px 0 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, position: 'relative' }}>
            {tab.id === 'events' ? eventsIcon : <Icon name={tab.icon} size={21} color={on ? C.accent : C.muted} />}
            <span style={{ fontSize: 10, color: on ? C.accent : C.muted, fontWeight: on ? 700 : 500 }}>{tab.label}</span>
            {tab.badge > 0 && <div style={{ position: 'absolute', top: 7, right: '50%', transform: 'translateX(10px)', width: 16, height: 16, borderRadius: '50%', background: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>{tab.badge}</span></div>}
          </button>
        );
      })}
    </div>
  );
}

export function NotifCenter({ notifs, onClose, onMarkAll }) {
  const { timeAgo } = require('../utils/constants');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 250, display: 'flex', flexDirection: 'column' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '0 0 28px 28px', maxHeight: '80%', display: 'flex', flexDirection: 'column', animation: 'slideDown 0.3s ease', border: `1px solid ${C.border}`, borderTop: 'none' }}>
        <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>Notifications</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span onClick={onMarkAll} style={{ color: C.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Mark all read</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={20} color={C.muted} /></button>
          </div>
        </div>
        <div style={{ overflow: 'auto', padding: '0 16px 20px' }}>
          {notifs.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', gap: 12, padding: '11px 12px', background: n.read ? 'none' : C.accentG, borderRadius: 14, marginBottom: 7, border: `1px solid ${n.read ? C.border : C.accentL}`, animation: `fadeUp 0.25s ease ${i * 0.05}s both` }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.read ? C.surface : C.accentL, border: `1px solid ${n.read ? C.border : C.accentL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: n.read ? C.muted : C.text, fontWeight: n.read ? 500 : 700, fontSize: 13, lineHeight: 1.4 }}>{n.title}</p>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{n.body}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{_timeAgo(n.ts)}</p>
              </div>
              {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))}
          {notifs.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0' }}><div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div><p style={{ color: C.muted, fontSize: 13 }}>No notifications yet</p></div>}
        </div>
      </div>
    </div>
  );
}

function _timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function InboxNotif({ requests, onAccept, onDecline }) {
  const [timer, setTimer] = useState(600);
  const { useEffect } = require('react');
  useEffect(() => { const t = setInterval(() => setTimer(v => v > 0 ? v - 1 : 0), 1000); return () => clearInterval(t); }, []);
  if (!requests.length) return null;
  const req = requests[0];
  const mm = String(Math.floor(timer / 60)).padStart(2, '0');
  const ss = String(timer % 60).padStart(2, '0');
  return (
    <div style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 150, animation: 'fadeUp 0.3s ease' }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: '13px', border: `1.5px solid ${C.accent}55`, boxShadow: '0 8px 28px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar name={req.sender_name} color={req.color} size={38} />
            <div><p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{req.sender_name}</p><p style={{ color: C.muted, fontSize: 11 }}>wants to LinkUp · {req.distance_m}m</p></div>
          </div>
          <span style={{ color: timer < 60 ? C.error : C.muted, fontSize: 12, fontWeight: 700 }}>{mm}:{ss}</span>
        </div>
        <div style={{ height: 3, background: C.border, borderRadius: 99, marginBottom: 9 }}><div style={{ height: '100%', width: `${(timer / 600) * 100}%`, background: timer < 60 ? C.error : C.accent, borderRadius: 99, transition: 'width 1s linear' }} /></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="danger" full={false} style={{ flex: 1 }} small onClick={() => onDecline(req.id)}><Icon name="x" size={12} color={C.error} />Decline</Btn>
          <Btn full={false} style={{ flex: 2 }} small onClick={() => onAccept(req.id)}><Icon name="check" size={12} color="#fff" />Accept +15 XP</Btn>
        </div>
      </div>
    </div>
  );
}

export function QRCode({ code }) {
  const { useRef, useEffect } = require('react');
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 160, cell = 8, cols = size / cell;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    const seed = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (i) => ((seed * i * 2654435761) >>> 0) % 100;
    ctx.fillStyle = '#111';
    [[0, 0], [cols - 7, 0], [0, cols - 7]].forEach(([ox, oy]) => {
      ctx.fillRect(ox * cell, oy * cell, 7 * cell, 7 * cell);
      ctx.fillStyle = '#fff'; ctx.fillRect((ox + 1) * cell, (oy + 1) * cell, 5 * cell, 5 * cell);
      ctx.fillStyle = '#111'; ctx.fillRect((ox + 2) * cell, (oy + 2) * cell, 3 * cell, 3 * cell);
      ctx.fillStyle = '#111';
    });
    for (let r = 0; r < cols; r++) for (let c = 0; c < cols; c++) {
      const inMarker = (r < 8 && c < 8) || (r < 8 && c >= cols - 8) || (r >= cols - 8 && c < 8);
      if (!inMarker && rand(r * cols + c + 1) > 45) ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }, [code]);
  return <canvas ref={ref} width={160} height={160} style={{ borderRadius: 12, display: 'block' }} />;
}

// ── Icon ───────────────────────────────────────────────────────────────────────
export function Icon({ name, size = 20, color = C.muted }) {
  const p = { fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    map:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
    people:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    quest:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    shop:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    user:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>,
    bell:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
    search:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    back:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    check:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    x:        <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    send:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    zap:      <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    trophy:   <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
    star:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    edit:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    chat:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    userplus: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    location: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>,
    fire:     <svg width={size} height={size} viewBox="0 0 24 24" {...p}><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    arrow:    <svg width={size} height={size} viewBox="0 0 24 24" {...p}><polyline points="9 18 15 12 9 6"/></svg>,
  };
  return icons[name] || null;
}
