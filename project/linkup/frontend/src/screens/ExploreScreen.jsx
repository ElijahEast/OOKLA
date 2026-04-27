import { useState } from 'react';
import { C, levelProgress, fmtDist } from '../utils/constants';
import { Icon, Avatar, Btn, StatusBar, Wordmark, InboxNotif } from '../components/ui';
import { NetworkGraph } from './NetworkGraph';
import { ALL_USERS } from '../utils/data';

function ExploreSwitcher({ view, onChange }) {
  const tabs = [{ id: 'map', label: 'Map', icon: 'map' }, { id: 'graph', label: 'Graph', icon: 'network' }];
  const networkIcon = (on) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={on ? '#fff' : C.muted} strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" />
      <line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" />
    </svg>
  );
  return (
    <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 99, padding: 3 }}>
      {tabs.map(t => {
        const on = view === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 99, border: 'none', background: on ? C.accent : 'none', color: on ? '#fff' : C.muted, fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {t.id === 'graph' ? networkIcon(on) : <Icon name={t.icon} size={12} color={on ? '#fff' : C.muted} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function MapScreen({ user, xp, friends, blockedUsers, onPinSelect, incomingRequests, onAccept, onDecline, unreadNotifs, onOpenNotifs, headerControls }) {
  const [radius, setRadius] = useState(1000);
  const [selectedPin, setSelectedPin] = useState(null);
  const prog = levelProgress(xp);
  const visibleUsers = ALL_USERS.filter(u => !blockedUsers.some(b => b.username === u.username));
  const filtered = visibleUsers.filter(u => u.distance_m <= radius);
  const pins = [
    { ...ALL_USERS[0], x: 50, y: 51 }, { ...ALL_USERS[1], x: 68, y: 37 },
    { ...ALL_USERS[2], x: 30, y: 65 }, { ...ALL_USERS[3], x: 76, y: 62 }, { ...ALL_USERS[4], x: 44, y: 31 },
  ].filter(p => !blockedUsers.some(b => b.username === p.username));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '9px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Wordmark />
        {headerControls}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ background: C.accentL, border: `1px solid ${C.accent}44`, borderRadius: 20, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="zap" size={12} color={C.accent} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{xp}</span>
          </div>
          <button onClick={onOpenNotifs} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={19} color={C.muted} />
            {unreadNotifs > 0 && <div style={{ position: 'absolute', top: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>{unreadNotifs}</span></div>}
          </button>
        </div>
      </div>

      <div style={{ padding: '0 18px 7px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ color: C.muted, fontSize: 10, fontWeight: 600 }}>Lv {prog.level}</span>
          <span style={{ color: C.muted, fontSize: 10 }}>{prog.into}/{prog.needed} XP</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${prog.pct}%`, background: `linear-gradient(90deg,${C.accent},oklch(62% 0.22 55))`, borderRadius: 99, transition: 'width 0.6s' }} />
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '0 13px', borderRadius: 22, border: `1px solid ${C.border}` }}>
        <div style={{ position: 'absolute', inset: 0, background: C.surface }}>
          {[...Array(12)].map((_, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, height: 1, background: C.border, top: `${(i + 1) * 8.33}%` }} />)}
          {[...Array(10)].map((_, i) => <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: C.border, left: `${(i + 1) * 9.09}%` }} />)}
        </div>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 390 340" preserveAspectRatio="none">
          <path d="M0 170 Q100 162 195 170 Q290 178 390 170" stroke="oklch(22% 0.02 265)" strokeWidth="12" fill="none" />
          <path d="M195 0 Q200 82 195 170 Q190 252 195 340" stroke="oklch(22% 0.02 265)" strokeWidth="12" fill="none" />
          <path d="M0 260 Q130 254 195 250 Q270 246 390 260" stroke="oklch(20% 0.018 265)" strokeWidth="7" fill="none" />
          <path d="M0 80 Q160 75 195 80 Q240 85 390 75" stroke="oklch(20% 0.018 265)" strokeWidth="7" fill="none" />
          <path d="M80 0 Q85 108 80 170 Q75 242 80 340" stroke="oklch(20% 0.018 265)" strokeWidth="7" fill="none" />
          <path d="M310 0 Q305 108 310 170 Q315 242 310 340" stroke="oklch(20% 0.018 265)" strokeWidth="7" fill="none" />
          {[[20, 110, 40, 30], [100, 40, 55, 38], [240, 110, 45, 26], [320, 196, 40, 42], [30, 230, 50, 32], [120, 270, 35, 26], [250, 276, 55, 28], [330, 40, 45, 34]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="oklch(18% 0.015 265)" stroke={C.border} strokeWidth="0.5" />
          ))}
        </svg>

        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: `${radius / 4.2}px`, height: `${radius / 4.2}px`, borderRadius: '50%', border: `1.5px dashed ${C.accent}44`, background: `${C.accent}06`, pointerEvents: 'none', transition: 'all 0.4s' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
          <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: `${C.accent}18`, animation: 'ping 2s ease infinite' }} />
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.accent, border: `3px solid ${C.bg}`, boxShadow: `0 0 0 2px ${C.accent}55` }} />
        </div>

        {pins.filter(p => p.distance_m <= radius).map(pin => {
          const isFriend = friends.some(f => f.username === pin.username);
          return (
            <div key={pin.id} onClick={() => setSelectedPin(selectedPin?.id === pin.id ? null : pin)}
              style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-100%)', cursor: 'pointer', zIndex: 5 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: pin.color, border: `2.5px solid ${isFriend ? C.success : C.bg}`, boxShadow: '0 2px 10px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', transform: selectedPin?.id === pin.id ? 'scale(1.25)' : 'scale(1)', transition: 'transform 0.15s', outline: selectedPin?.id === pin.id ? `3px solid ${C.accent}` : 'none', outlineOffset: 2, position: 'relative' }}>
                  {pin.display_name[0]}
                  {isFriend && <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: C.success, border: `2px solid ${C.bg}` }} />}
                </div>
                <div style={{ width: 2, height: 5, background: pin.color }} />
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', top: 10, right: 10, background: `${C.bg}e0`, backdropFilter: 'blur(8px)', borderRadius: 12, padding: '7px 10px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[500, 1000, 2000].map(r => (
              <button key={r} onClick={() => setRadius(r)} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${radius === r ? C.accent : C.border}`, background: radius === r ? C.accentL : 'none', color: radius === r ? C.accent : C.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {r < 1000 ? `${r}m` : `${r / 1000}km`}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 10, left: 10, background: `${C.bg}e0`, backdropFilter: 'blur(8px)', borderRadius: 10, padding: '5px 10px', border: `1px solid ${C.border}` }}>
          <p style={{ color: C.accent, fontSize: 12, fontWeight: 700 }}>{filtered.length} nearby</p>
        </div>

        {selectedPin && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: `${C.bg}f0`, backdropFilter: 'blur(12px)', borderRadius: 16, padding: '11px', border: `1px solid ${C.border}`, animation: 'fadeUp 0.2s' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={selectedPin.display_name} color={selectedPin.color} size={38} />
                {friends.some(f => f.username === selectedPin.username) && <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: C.success, border: `2px solid ${C.bg}` }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{selectedPin.display_name}</p>
                  <span style={{ background: C.accentG, color: C.accent, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Lv {selectedPin.level}</span>
                </div>
                <p style={{ color: C.muted, fontSize: 11 }}>{selectedPin.distance_m}m away</p>
              </div>
              <Btn small full={false} onClick={() => onPinSelect(selectedPin)} style={{ paddingLeft: 11, paddingRight: 11 }}>View</Btn>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '8px 13px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {filtered.map(u => {
            const isFriend = friends.some(f => f.username === u.username);
            return (
              <div key={u.id} onClick={() => setSelectedPin(selectedPin?.id === u.id ? null : u)}
                style={{ flexShrink: 0, width: 106, background: selectedPin?.id === u.id ? C.accentL : C.surface, borderRadius: 13, padding: 9, border: `1.5px solid ${selectedPin?.id === u.id ? C.accent : isFriend ? 'oklch(62% 0.18 145/0.4)' : C.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar name={u.display_name} color={u.color} size={28} />
                  {isFriend && <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: C.success, border: `2px solid ${C.surface}` }} />}
                </div>
                <p style={{ color: C.text, fontWeight: 700, fontSize: 11, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.display_name}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{fmtDist(u.distance_m)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <InboxNotif requests={incomingRequests} onAccept={onAccept} onDecline={onDecline} />
    </div>
  );
}

function GraphView({ user, xp, friends, blockedUsers, onAddFriend, onOpenChat, onViewProfile, onCreateGroup, unreadNotifs, onOpenNotifs, headerControls }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '9px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Wordmark />
        {headerControls}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ background: C.accentL, border: `1px solid ${C.accent}44`, borderRadius: 20, padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="zap" size={12} color={C.accent} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{xp}</span>
          </div>
          <button onClick={onOpenNotifs} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={19} color={C.muted} />
            {unreadNotifs > 0 && <div style={{ position: 'absolute', top: 1, right: 1, width: 13, height: 13, borderRadius: '50%', background: C.error, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>{unreadNotifs}</span></div>}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <NetworkGraph user={user} friends={friends} blockedUsers={blockedUsers} onAddFriend={onAddFriend} onOpenChat={onOpenChat} onViewProfile={onViewProfile} onCreateGroup={onCreateGroup} embedded />
      </div>
    </div>
  );
}

export function ExploreScreen(props) {
  const [view, setView] = useState('map');
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {view === 'map'
        ? <MapScreen {...props} headerControls={<ExploreSwitcher view={view} onChange={setView} />} />
        : <GraphView {...props} headerControls={<ExploreSwitcher view={view} onChange={setView} />} />}
    </div>
  );
}
