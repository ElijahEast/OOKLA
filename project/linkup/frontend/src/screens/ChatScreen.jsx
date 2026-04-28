import React, { useState, useEffect, useRef } from 'react';
import { C } from '../utils/constants';
import { Icon, Avatar, Btn, StatusBar } from '../components/ui';
import { MeetupVerifyModal } from './MeetupVerifyModal';

export function ChatScreen({ partner, goldTheme, onBack, onMeetupVerified, onOpenSafety }) {
  const [msgs, setMsgs] = useState([
    { id: 1, from: 'them', body: 'Hey! Glad you accepted 😊', time: '2:41 PM' },
    { id: 2, from: 'me', body: 'Same! Where are you?', time: '2:42 PM' },
    { id: 3, from: 'them', body: 'Outside the coffee shop on Main St — green awning', time: '2:43 PM' },
    { id: 4, from: 'me', body: "Perfect, I'll be there in 5 min 🚶", time: '2:43 PM' },
  ]);
  const [input, setInput] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [meetupDone, setMeetupDone] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  function send() {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setMsgs(m => [...m, { id: Date.now(), from: 'me', body: input.trim(), time: now }]);
    setInput('');
    const replies = ['On my way!', 'Sounds good 👍', 'See you soon!', "Can't wait 🙌", '😄'];
    setTimeout(() => {
      const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setMsgs(m => [...m, { id: Date.now() + 1, from: 'them', body: replies[Math.floor(Math.random() * replies.length)], time: t }]);
    }, 1000 + Math.random() * 800);
  }

  function handleVerifyComplete() {
    setShowVerify(false);
    setMeetupDone(true);
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setMsgs(m => [...m, { id: Date.now(), from: 'system', body: '✅ Meetup verified! +50 XP awarded to both.', time: now }]);
    if (onMeetupVerified) onMeetupVerified();
  }

  const bubbleMine = goldTheme
    ? { background: `linear-gradient(135deg,${C.gold},oklch(70% 0.18 55))`, color: '#1a1008' }
    : { background: C.accent, color: '#fff' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideRight 0.25s ease', position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '10px 18px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="back" size={20} color={C.muted} /></button>
        <Avatar name={partner.display_name} color={partner.color} size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{partner.display_name}</p>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success }} />
            <p style={{ color: C.muted, fontSize: 11 }}>Active now · {partner.distance_m ? `${partner.distance_m}m` : '450m'}</p>
          </div>
        </div>
        <div style={{ background: C.accentG, borderRadius: 9, padding: '3px 9px' }}><span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>Lv {partner.level}</span></div>
        {onOpenSafety && (
          <button onClick={onOpenSafety} style={{ background: `${C.success}18`, border: `1px solid ${C.success}44`, borderRadius: 9, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 13 }}>🛡️</span><span style={{ color: C.success, fontSize: 11, fontWeight: 700 }}>Safety</span>
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}><span style={{ background: C.surface, borderRadius: 20, padding: '4px 12px', color: C.muted, fontSize: 11, border: `1px solid ${C.border}` }}>Today · Meetup accepted 🎉</span></div>
        {msgs.map(m => (
          m.from === 'system'
            ? <div key={m.id} style={{ textAlign: 'center' }}>
                <span style={{ background: 'oklch(62% 0.18 145/0.12)', border: '1px solid oklch(62% 0.18 145/0.3)', borderRadius: 20, padding: '6px 14px', color: C.success, fontSize: 12, fontWeight: 600 }}>{m.body}</span>
              </div>
            : <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 7, animation: 'fadeUp 0.2s ease' }}>
                {m.from === 'them' && <Avatar name={partner.display_name} color={partner.color} size={26} />}
                <div style={{ maxWidth: '73%' }}>
                  <div style={{ ...(m.from === 'me' ? bubbleMine : { background: C.surface, color: C.text }), padding: '9px 13px', borderRadius: m.from === 'me' ? '17px 17px 4px 17px' : '17px 17px 17px 4px', fontSize: 14, lineHeight: 1.5, border: m.from !== 'me' ? `1px solid ${C.border}` : 'none' }}>{m.body}</div>
                  <p style={{ color: C.muted, fontSize: 10, marginTop: 2, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</p>
                </div>
              </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!meetupDone ? (
        <div style={{ margin: '0 13px 9px', background: 'oklch(62% 0.18 145/0.08)', border: `1px solid oklch(62% 0.18 145/0.22)`, borderRadius: 13, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <p style={{ color: C.muted, fontSize: 12, flex: 1 }}>Met up? Verify with <span style={{ color: C.success, fontWeight: 700 }}>QR + GPS</span></p>
          <button onClick={() => setShowVerify(true)} style={{ background: C.success, border: 'none', borderRadius: 8, padding: '5px 11px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Verify</button>
        </div>
      ) : (
        <div style={{ margin: '0 13px 9px', background: 'oklch(62% 0.18 145/0.12)', border: `1px solid oklch(62% 0.18 145/0.3)`, borderRadius: 13, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <p style={{ color: C.success, fontSize: 13, fontWeight: 700 }}>Meetup verified! Rewards collected.</p>
        </div>
      )}

      <div style={{ padding: '0 13px 26px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: '9px 15px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder="Message..." style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 14, fontFamily: 'inherit' }} />
        </div>
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? C.accent : C.border, border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>

      {showVerify && <MeetupVerifyModal partner={partner} onComplete={handleVerifyComplete} onClose={() => setShowVerify(false)} />}
    </div>
  );
}
