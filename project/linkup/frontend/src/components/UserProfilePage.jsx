import { useState } from 'react';
import { C, levelProgress, fmtDist } from '../utils/constants';
import { Icon, Avatar, Btn, StatusBar } from './ui';

export function UserProfilePage({ user: u, isFriend, onBack, onAddFriend, onSendRequest, onOpenChat, onBlockReport, onUnblock, isBlocked }) {
  const prog = levelProgress(u.xp || 0);
  const [friendSent, setFriendSent] = useState(false);
  const [reqSent, setReqSent] = useState(false);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: C.bg, animation: 'slideRight 0.25s ease', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 0' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="back" size={20} color={C.muted} /></button>
        <p style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>Profile</p>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ height: 100, background: `linear-gradient(135deg,${u.color}99,${u.color}55 60%,${C.surface})`, position: 'relative', margin: '12px 0 0' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(255,255,255,0.03) 18px,rgba(255,255,255,0.03) 36px)' }} />
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ marginTop: -28, marginBottom: 14 }}>
            <Avatar name={u.display_name} color={u.color} size={58} />
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>{u.display_name}</h2>
                <p style={{ color: C.muted, fontSize: 12 }}>@{u.username}</p>
                {isFriend && <span style={{ background: 'oklch(62% 0.18 145/0.15)', color: C.success, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginTop: 5 }}>✓ Friends</span>}
              </div>
              <div style={{ display: 'flex', gap: 3, background: C.accentL, borderRadius: 10, padding: '4px 10px' }}>
                <span style={{ color: C.accent, fontWeight: 800, fontSize: 12 }}>Lv {u.level}</span>
              </div>
            </div>
            {u.bio && <p style={{ color: C.muted, fontSize: 13, marginTop: 10, lineHeight: 1.7 }}>{u.bio}</p>}
          </div>

          <div style={{ background: C.surface, borderRadius: 14, padding: '12px 14px', marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: C.muted, fontSize: 11, fontWeight: 600 }}>Level {prog.level}</span>
              <span style={{ color: C.muted, fontSize: 11 }}>{prog.pct}%</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 99 }}><div style={{ height: '100%', width: `${prog.pct}%`, background: u.color, borderRadius: 99 }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            {[{ v: u.xp, l: 'Total XP' }, { v: u.total_meetups, l: 'Meetups' }, { v: `${u.current_streak}d`, l: 'Streak' }].map(s => (
              <div key={s.l} style={{ background: C.surface, borderRadius: 12, padding: '10px 6px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{s.v}</p>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{s.l}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
            {isBlocked ? (
              <>
                <div style={{ background: 'oklch(62% 0.2 15/0.1)', border: '1px solid oklch(62% 0.2 15/0.3)', borderRadius: 14, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🚫</span>
                  <div style={{ flex: 1 }}><p style={{ color: C.error, fontWeight: 700, fontSize: 13 }}>You've blocked @{u.username}</p><p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>They can't see you or contact you</p></div>
                </div>
                <button onClick={() => onUnblock && onUnblock(u)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '13px', cursor: 'pointer', color: C.muted, fontWeight: 700, fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                  <span style={{ fontSize: 16 }}>↩️</span> Unblock @{u.username}
                </button>
              </>
            ) : (
              <>
                <Btn onClick={() => { setReqSent(true); onSendRequest(u); }} disabled={reqSent}>
                  {reqSent ? <><Icon name="check" size={15} color="#fff" />Request Sent</> : <>👋 Send LinkUp Request</>}
                </Btn>
                {isFriend
                  ? <Btn variant="subtle" onClick={() => onOpenChat(u)}><Icon name="chat" size={15} color={C.accent} />Open Chat</Btn>
                  : <Btn variant="ghost" onClick={() => { setFriendSent(true); onAddFriend(u); }} disabled={friendSent}>
                      {friendSent ? <><Icon name="check" size={15} color={C.muted} />Friend Request Sent</> : <><Icon name="userplus" size={15} color={C.muted} />Add Friend</>}
                    </Btn>
                }
                <Btn variant="danger" onClick={() => onBlockReport && onBlockReport(u)}>
                  <span style={{ fontSize: 14 }}>🚨</span> Report or Block
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PinSheet({ pin, isFriend, onClose, onSendRequest, onAddFriend, onOpenChat, onViewProfile, onBlockReport }) {
  if (!pin) return null;
  const [rs, setRs] = useState(false);
  const [fs, setFs] = useState(false);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.surface, borderRadius: '24px 24px 0 0', padding: '0 22px 36px', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '12px auto 16px' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <Avatar name={pin.display_name} color={pin.color} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <h3 style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>{pin.display_name}</h3>
              <span style={{ background: C.accentG, color: C.accent, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>Lv {pin.level}</span>
              {isFriend && <span style={{ background: 'oklch(62% 0.18 145/0.15)', color: C.success, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 6px' }}>Friend</span>}
            </div>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>@{pin.username} · {fmtDist(pin.distance_m)}</p>
          </div>
        </div>
        {pin.bio && <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, background: C.raised, borderRadius: 11, padding: '10px 13px', marginBottom: 14 }}>{pin.bio}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn onClick={() => { setRs(true); onSendRequest(pin); }} disabled={rs}>{rs ? <><Icon name="check" size={14} color="#fff" />Request Sent</> : <>👋 Send LinkUp Request</>}</Btn>
          {!isFriend && <Btn variant="ghost" onClick={() => { setFs(true); onAddFriend(pin); }} disabled={fs}>{fs ? <><Icon name="check" size={14} color={C.muted} />Request Sent</> : <><Icon name="userplus" size={14} color={C.muted} />Add Friend</>}</Btn>}
          {isFriend && <Btn variant="subtle" onClick={() => onOpenChat(pin)}><Icon name="chat" size={14} color={C.accent} />Open Chat</Btn>}
          <Btn variant="ghost" onClick={() => onViewProfile(pin)}><Icon name="user" size={14} color={C.muted} />View Full Profile</Btn>
          <Btn variant="danger" onClick={() => { onClose(); onBlockReport && onBlockReport(pin); }}><span style={{ fontSize: 14 }}>🚨</span> Report or Block</Btn>
        </div>
      </div>
    </div>
  );
}

export function RequestModal({ target, onSend, onClose }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  async function go() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
    setTimeout(() => onSend({ xp: 5 }), 600);
  }
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.surface, borderRadius: '24px 24px 0 0', padding: '0 22px 38px', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}` }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '12px auto 16px' }} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <Avatar name={target.display_name} color={target.color} size={46} />
          <div><h3 style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{target.display_name}</h3><p style={{ color: C.muted, fontSize: 12 }}>@{target.username}</p></div>
        </div>
        {!sent ? (
          <>
            <div style={{ background: C.raised, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '11px 13px', marginBottom: 12 }}>
              <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Optional note..." maxLength={200} style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6, height: 64 }} />
              <p style={{ color: C.muted, fontSize: 10, textAlign: 'right' }}>{msg.length}/200</p>
            </div>
            <div style={{ background: C.accentG, borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', gap: 7, alignItems: 'center' }}>
              <Icon name="zap" size={13} color={C.accent} />
              <p style={{ color: C.muted, fontSize: 12 }}>Earn <span style={{ color: C.accent, fontWeight: 700 }}>+5 XP</span> for sending</p>
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <Btn variant="ghost" full={false} style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
              <Btn full={false} style={{ flex: 2 }} onClick={go} loading={loading}><Icon name="send" size={14} color="#fff" />Send</Btn>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${C.success}20`, border: `2px solid ${C.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}><Icon name="check" size={24} color={C.success} /></div>
            <p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Request sent!</p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Expires in 10 minutes</p>
          </div>
        )}
      </div>
    </div>
  );
}
