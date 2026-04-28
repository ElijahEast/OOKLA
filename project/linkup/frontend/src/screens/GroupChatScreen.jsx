import React, { useState, useEffect, useRef } from 'react';
import { C } from '../utils/constants';
import { Icon, Avatar, Btn, Spinner, StatusBar, QRCode } from '../components/ui';
import * as api from '../utils/api';

// ── Group Meetup Verification Modal ───────────────────────────────────────────
export function GroupMeetupVerifyModal({ group, me, onComplete, onClose }) {
  const members = group.members;
  const [step, setStep] = useState('role');
  const [role, setRole] = useState(null);
  const [code] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [entered, setEntered] = useState('');
  const [codeError, setCodeError] = useState('');
  const [gpsProgress, setGpsProgress] = useState(0);
  const [gpsOk, setGpsOk] = useState(false);
  const [verified, setVerified] = useState(new Set());
  const myName = me.username;

  useEffect(() => {
    if (step !== 'gps') return;
    setGpsProgress(0);
    const t = setInterval(() => setGpsProgress(p => {
      const next = p + 3;
      if (next >= 100) {
        clearInterval(t);
        setTimeout(() => {
          setGpsOk(true);
          setTimeout(() => {
            setVerified(prev => { const n = new Set(prev); n.add(myName); return n; });
            setStep('roster');
          }, 600);
        }, 400);
        return 100;
      }
      return next;
    }), 35);
    return () => clearInterval(t);
  }, [step]);

  // Simulate other members verifying
  useEffect(() => {
    if (step !== 'roster') return;
    const others = members.filter(m => m.username !== myName && !verified.has(m.username));
    if (!others.length) return;
    const timers = others.map((m, i) => setTimeout(() => {
      setVerified(prev => { const n = new Set(prev); n.add(m.username); return n; });
    }, 1400 + i * 1200 + Math.random() * 600));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  useEffect(() => {
    if (step !== 'roster') return;
    if (members.every(m => verified.has(m.username))) {
      // Also tell the backend
      api.groups.verify(group.id).catch(() => {});
      const t = setTimeout(() => setStep('done'), 700);
      return () => clearTimeout(t);
    }
  }, [verified, step]);

  function handleRoleSelect(r) {
    setRole(r);
    if (r === 'host') { setVerified(prev => { const n = new Set(prev); n.add(myName); return n; }); }
    setStep(r === 'host' ? 'host-code' : 'join-enter');
  }
  function handleJoinSubmit() {
    if (entered.trim().toUpperCase() === code) { setStep('gps'); setCodeError(''); }
    else if (entered.trim().length === 6) { setCodeError("Code doesn't match. Try again."); }
    else { setCodeError('Enter the full 6-character code.'); }
  }

  const verifiedCount = verified.size;
  const total = members.length;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '28px 28px 0 0', animation: 'slideUp 0.35s ease', border: `1px solid ${C.border}`, maxHeight: '92%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '14px auto 0', flexShrink: 0 }} />

        {step !== 'done' && (
          <div style={{ padding: '14px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.accentL, border: `1px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{group.emoji || '👥'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.text, fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</p>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{total} members · all must verify</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="x" size={16} color={C.muted} /></button>
          </div>
        )}

        {step === 'role' && (
          <div style={{ padding: '16px 24px 32px' }}>
            <h3 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginTop: 12, marginBottom: 6 }}>Verify Group Meetup</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Everyone in <strong style={{ color: C.text }}>{group.name}</strong> must scan the QR or enter the code to earn rewards.
            </p>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '11px 14px', marginBottom: 18, display: 'flex', justifyContent: 'space-around' }}>
              {[{ e: '⚡', v: '+75 XP' }, { e: '🪙', v: '+8 coins' }, { e: '🤝', v: `Group of ${total}` }].map(r => (
                <div key={r.v} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 19 }}>{r.e}</div>
                  <p style={{ color: C.accent, fontWeight: 800, fontSize: 12, marginTop: 2 }}>{r.v}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ r: 'host', icon: '📲', title: "I'll generate the code", sub: 'Show QR for everyone else to scan' },
                { r: 'join', icon: '🔍', title: "I'll scan the code",     sub: 'Enter the code someone else is showing' }].map(({ r, icon, title, sub }) => (
                <button key={r} onClick={() => handleRoleSelect(r)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 13, alignItems: 'center', fontFamily: 'inherit' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: r === 'host' ? C.accentL : 'oklch(62% 0.18 240/0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
                  <div><p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{title}</p><p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{sub}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'host-code' && (
          <div style={{ padding: '10px 24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginTop: 10, marginBottom: 4 }}>Your Group Code</p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>Each of the other {total - 1} members must scan to unlock rewards</p>
            <div style={{ background: '#fff', borderRadius: 18, padding: 12, marginBottom: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
              <QRCode code={code} />
              <div style={{ position: 'absolute', left: 12, right: 12, height: 2, background: `linear-gradient(90deg,transparent,${C.accent},transparent)`, animation: 'scanline 2s ease-in-out infinite', boxShadow: `0 0 8px ${C.accent}` }} />
            </div>
            <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Or enter manually</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {code.split('').map((ch, i) => (
                <div key={i} style={{ width: 34, height: 42, borderRadius: 10, background: C.surface, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: C.accent }}>{ch}</div>
              ))}
            </div>
            <Btn onClick={() => setStep('gps')}>Everyone has it — continue →</Btn>
          </div>
        )}

        {step === 'join-enter' && (
          <div style={{ padding: '14px 24px 30px' }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginTop: 8, marginBottom: 4 }}>Enter Group Code</p>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.55, marginBottom: 16 }}>Ask whoever is hosting to show their code</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, justifyContent: 'center' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ width: 38, height: 46, borderRadius: 10, background: C.surface, border: `1.5px solid ${entered[i] ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: C.accent, transition: 'border-color 0.2s' }}>
                  {entered[i] || ''}
                </div>
              ))}
            </div>
            <input value={entered} onChange={e => setEntered(e.target.value.toUpperCase().slice(0, 6))} placeholder="Type code here" maxLength={6}
              style={{ width: '100%', background: C.surface, border: `1.5px solid ${codeError ? C.error : C.border}`, borderRadius: 13, padding: '11px 16px', color: C.text, fontSize: 16, fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.15em', textAlign: 'center', outline: 'none', marginBottom: 8 }}
              autoFocus />
            {codeError && <p style={{ color: C.error, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{codeError}</p>}
            <div style={{ marginTop: 10 }}><Btn onClick={handleJoinSubmit} disabled={entered.length !== 6}>Verify Code</Btn></div>
          </div>
        )}

        {step === 'gps' && (
          <div style={{ padding: '10px 24px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginTop: 4, marginBottom: 4 }}>Verifying Location</p>
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 20, textAlign: 'center' }}>Confirming you're all in the same place…</p>
            <div style={{ width: 110, height: 110, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ position: 'absolute', inset: i * -16, borderRadius: '50%', border: `1.5px solid ${C.accent}`, opacity: (1 - i * 0.28) * 0.6, animation: `gpsRing ${1.2 + i * 0.4}s ease-out ${i * 0.3}s infinite` }} />
              ))}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.accentL, border: `2px solid ${C.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                <Icon name="location" size={26} color={C.accent} />
              </div>
            </div>
            <div style={{ width: '100%', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>GPS lock</span>
                <span style={{ color: gpsOk ? C.success : C.accent, fontSize: 12, fontWeight: 700 }}>{gpsProgress}%</span>
              </div>
              <div style={{ height: 5, background: C.border, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${gpsProgress}%`, background: gpsOk ? C.success : `linear-gradient(90deg,${C.accent},oklch(62% 0.22 55))`, borderRadius: 99, transition: 'width 0.1s' }} />
              </div>
            </div>
          </div>
        )}

        {step === 'roster' && (
          <div style={{ padding: '6px 24px 26px' }}>
            <div style={{ textAlign: 'center', marginTop: 6, marginBottom: 14 }}>
              <p style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>Waiting for the group</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{verifiedCount} of {total} verified · everyone must scan to earn rewards</p>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(verifiedCount / total) * 100}%`, background: verifiedCount === total ? C.success : `linear-gradient(90deg,${C.accent},oklch(62% 0.22 55))`, borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: '38vh', overflow: 'auto' }}>
              {members.map((m, i) => {
                const isVer = verified.has(m.username);
                const isMe = m.username === myName;
                return (
                  <div key={m.username} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '9px 13px', background: C.surface, borderRadius: 13, border: `1px solid ${isVer ? 'oklch(62% 0.18 145/0.35)' : C.border}`, transition: 'all 0.4s', animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' }}>{m.display_name[0]}</div>
                      {isVer && <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: C.success, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M5 13l4 4 10-10" /></svg>
                      </div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name}{isMe && <span style={{ color: C.muted, fontWeight: 500 }}> · you</span>}</p>
                      <p style={{ color: isVer ? C.success : C.muted, fontSize: 11, marginTop: 1, fontWeight: isVer ? 600 : 400 }}>{isVer ? '✓ Verified' : 'Scanning code…'}</p>
                    </div>
                    {!isVer && <Spinner color={C.muted} size={14} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ padding: '26px 24px 38px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'pop 0.4s ease' }}>
            <div style={{ fontSize: 58, marginBottom: 10 }}>🎉</div>
            <h3 style={{ color: C.text, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 6 }}>Group Meetup Verified!</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, marginBottom: 18 }}>All {total} members of <strong style={{ color: C.text }}>{group.name}</strong> just made it official.</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[{ e: '⚡', v: '+75 XP' }, { e: '🪙', v: '+8 coins' }, { e: '👥', v: `Group #1` }].map(r => (
                <div key={r.v} style={{ background: C.surface, borderRadius: 14, padding: '11px 14px', border: `1px solid ${C.border}`, animation: 'countUp 0.4s ease both' }}>
                  <div style={{ fontSize: 21, marginBottom: 3 }}>{r.e}</div>
                  <p style={{ color: C.accent, fontWeight: 800, fontSize: 12 }}>{r.v}</p>
                </div>
              ))}
            </div>
            <Btn onClick={onComplete}>Done</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group Members Sheet ────────────────────────────────────────────────────────
function GroupMembersSheet({ group, onClose, onLeave }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '28px 28px 0 0', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}`, maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '14px auto 0' }} />
        <div style={{ padding: '14px 22px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: C.accentL, border: `1px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{group.emoji || '👥'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{group.name}</p>
              <p style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{group.members.length} members</p>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 18px 10px' }}>
          <p style={{ color: C.muted, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Members</p>
          {group.members.map((m, i) => (
            <div key={m.username} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', background: C.surface, borderRadius: 13, marginBottom: 6, border: `1px solid ${C.border}`, animation: `fadeUp 0.2s ease ${i * 0.04}s both` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>{m.display_name[0]}</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{m.display_name}{m.username === 'you' && <span style={{ color: C.muted, fontWeight: 500 }}> · you</span>}</p>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>@{m.username}{m.level ? ` · Lv ${m.level}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 18px 26px', borderTop: `1px solid ${C.border}` }}>
          <Btn variant="danger" onClick={onLeave}><Icon name="x" size={14} color={C.error} />Leave Group</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Group Chat Screen ─────────────────────────────────────────────────────────
export function GroupChatScreen({ group, me, goldTheme, onBack, onMeetupVerified, onLeave }) {
  const [msgs, setMsgs] = useState(() => [
    { id: 1, from: 'system', body: `🎉 ${group.name} created · ${group.members.length} members`, time: 'now' },
    group.members[0] && { id: 2, from: group.members[0].username, body: "Let's pick a spot!", time: '2:40 PM' },
    group.members[1] && { id: 3, from: group.members[1].username, body: "I'm down for coffee ☕", time: '2:41 PM' },
  ].filter(Boolean));
  const [input, setInput] = useState('');
  const [showVerify, setShowVerify] = useState(false);
  const [meetupDone, setMeetupDone] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const memberByUser = Object.fromEntries(group.members.map(m => [m.username, m]));

  function send() {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setMsgs(m => [...m, { id: Date.now(), from: 'me', body: input.trim(), time: now }]);
    setInput('');
    // Also send to backend
    api.groups.send(group.id, input.trim()).catch(() => {});
    const others = group.members.filter(m => m.username !== me.username);
    const replies = ['Sounds good!', "I'm in 🙌", 'Lmk where', 'See you soon!', 'On my way 🚶'];
    setTimeout(() => {
      const r = others[Math.floor(Math.random() * others.length)];
      const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setMsgs(m => [...m, { id: Date.now() + 1, from: r.username, body: replies[Math.floor(Math.random() * replies.length)], time: t }]);
    }, 1100 + Math.random() * 700);
  }

  function handleVerifyComplete() {
    setShowVerify(false);
    setMeetupDone(true);
    const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setMsgs(m => [...m, { id: Date.now(), from: 'system', body: `✅ Group meetup verified! +75 XP to all ${group.members.length} members.`, time: now }]);
    onMeetupVerified && onMeetupVerified(group);
  }

  const bubbleMine = goldTheme
    ? { background: `linear-gradient(135deg,${C.gold},oklch(70% 0.18 55))`, color: '#1a1008' }
    : { background: C.accent, color: '#fff' };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideRight 0.25s ease', position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '10px 16px 12px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="back" size={20} color={C.muted} /></button>
        <button onClick={() => setShowMembers(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {group.members.slice(0, 3).map((m, i) => (
            <div key={m.username} style={{ width: 30, height: 30, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', border: `2px solid ${C.bg}`, marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i }}>
              {m.display_name[0]}
            </div>
          ))}
          {group.members.length > 3 && <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.muted, border: `2px solid ${C.bg}`, marginLeft: -10 }}>+{group.members.length - 3}</div>}
        </button>
        <div style={{ flex: 1, minWidth: 0, marginLeft: 4 }}>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</p>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{group.members.length} members · tap to view</p>
        </div>
        <button onClick={() => setShowMembers(true)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '5px 9px', cursor: 'pointer', color: C.muted, fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Info</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 2 }}><span style={{ background: C.surface, borderRadius: 20, padding: '4px 12px', color: C.muted, fontSize: 11, border: `1px solid ${C.border}` }}>Today · Group chat started 🎉</span></div>
        {msgs.map(m => {
          if (m.from === 'system') return (
            <div key={m.id} style={{ textAlign: 'center' }}>
              <span style={{ background: 'oklch(62% 0.18 145/0.12)', border: '1px solid oklch(62% 0.18 145/0.3)', borderRadius: 20, padding: '6px 14px', color: C.success, fontSize: 12, fontWeight: 600 }}>{m.body}</span>
            </div>
          );
          const mine = m.from === 'me';
          const member = mine ? null : memberByUser[m.from];
          const color = member?.color || C.muted;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 7, animation: 'fadeUp 0.2s ease' }}>
              {!mine && <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0, alignSelf: 'flex-end' }}>{member?.display_name?.[0] || '?'}</div>}
              <div style={{ maxWidth: '72%' }}>
                {!mine && <p style={{ color, fontSize: 10, fontWeight: 700, marginBottom: 2, marginLeft: 4 }}>{member?.display_name || m.from}</p>}
                <div style={{ ...(mine ? bubbleMine : { background: C.surface, color: C.text }), padding: '9px 13px', borderRadius: mine ? '17px 17px 4px 17px' : '17px 17px 17px 4px', fontSize: 13.5, lineHeight: 1.5, border: !mine ? `1px solid ${C.border}` : 'none' }}>{m.body}</div>
                <p style={{ color: C.muted, fontSize: 10, marginTop: 2, textAlign: mine ? 'right' : 'left' }}>{m.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!meetupDone ? (
        <div style={{ margin: '0 13px 8px', background: 'oklch(62% 0.18 145/0.08)', border: `1px solid oklch(62% 0.18 145/0.22)`, borderRadius: 13, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 15 }}>📍</span>
          <p style={{ color: C.muted, fontSize: 12, flex: 1 }}>Met up? <span style={{ color: C.success, fontWeight: 700 }}>All {group.members.length} must verify</span> for rewards</p>
          <button onClick={() => setShowVerify(true)} style={{ background: C.success, border: 'none', borderRadius: 8, padding: '5px 11px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Verify</button>
        </div>
      ) : (
        <div style={{ margin: '0 13px 8px', background: 'oklch(62% 0.18 145/0.12)', border: `1px solid oklch(62% 0.18 145/0.3)`, borderRadius: 13, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 17 }}>✅</span>
          <p style={{ color: C.success, fontSize: 13, fontWeight: 700 }}>Group meetup verified!</p>
        </div>
      )}

      <div style={{ padding: '0 13px 26px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: '9px 15px' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} placeholder={`Message ${group.name}...`} style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 14, fontFamily: 'inherit' }} />
        </div>
        <button onClick={send} style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? C.accent : C.border, border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>

      {showVerify && <GroupMeetupVerifyModal group={group} me={me} onComplete={handleVerifyComplete} onClose={() => setShowVerify(false)} />}
      {showMembers && <GroupMembersSheet group={group} onClose={() => setShowMembers(false)} onLeave={() => { setShowMembers(false); onLeave && onLeave(group); }} />}
    </div>
  );
}
