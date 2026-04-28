import React, { useState, useEffect } from 'react';
import { C } from '../utils/constants';
import { Icon, Avatar, Btn, StatusBar } from '../components/ui';

export function BlockReportModal({ target, onBlock, onReport, onClose }) {
  const [mode, setMode] = useState('menu');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: 'spam', label: 'Spam or scam', emoji: '🚫' },
    { key: 'harassment', label: 'Harassment or bullying', emoji: '😠' },
    { key: 'fake_profile', label: 'Fake profile', emoji: '🎭' },
    { key: 'inappropriate_content', label: 'Inappropriate content', emoji: '⚠️' },
    { key: 'underage', label: 'Underage user', emoji: '🔞' },
    { key: 'violence', label: 'Threats or violence', emoji: '🔴' },
    { key: 'other', label: 'Other', emoji: '❓' },
  ];

  async function submitReport() {
    if (!category) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setMode('reported');
    onReport(target, category);
  }

  async function submitBlock() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setMode('blocked');
    onBlock(target);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '26px 26px 0 0', padding: '0 22px 38px', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}`, maxHeight: '88%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '12px auto 18px', flexShrink: 0 }} />

        {mode === 'menu' && <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <Avatar name={target.display_name} color={target.color} size={46} />
            <div><p style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{target.display_name}</p><p style={{ color: C.muted, fontSize: 12 }}>@{target.username}</p></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <button onClick={() => setMode('report')} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '15px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'inherit' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'oklch(62% 0.2 15/0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚨</div>
              <div><p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Report</p><p style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>Something feels wrong or unsafe</p></div>
            </button>
            <button onClick={submitBlock} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '15px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'inherit' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'oklch(62% 0.18 270/0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🚫</div>
              <div><p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>Block</p><p style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>They won't be able to see you or contact you</p></div>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 14, padding: '13px', cursor: 'pointer', color: C.muted, fontWeight: 600, fontSize: 14, fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </>}

        {mode === 'report' && <div style={{ flex: 1, overflow: 'auto' }}>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Report {target.display_name}</p>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>Select what's happening. Your report is anonymous.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {categories.map(cat => (
              <button key={cat.key} onClick={() => setCategory(cat.key)} style={{ background: category === cat.key ? C.accentL : C.surface, border: `1.5px solid ${category === cat.key ? C.accent : C.border}`, borderRadius: 13, padding: '12px 15px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                <p style={{ color: category === cat.key ? C.accent : C.text, fontWeight: category === cat.key ? 700 : 500, fontSize: 14 }}>{cat.label}</p>
                {category === cat.key && <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={11} color="#fff" /></div>}
              </button>
            ))}
          </div>
          <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: '11px 14px', marginBottom: 16 }}>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add any details (optional)..." maxLength={500}
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit', lineHeight: 1.6, height: 60 }} />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <Btn variant="ghost" full={false} style={{ flex: 1 }} onClick={() => setMode('menu')}>Back</Btn>
            <Btn full={false} style={{ flex: 2, background: C.error, boxShadow: 'none' }} disabled={!category} loading={loading} onClick={submitReport}>Submit Report</Btn>
          </div>
        </div>}

        {mode === 'blocked' && <div style={{ textAlign: 'center', padding: '8px 0 10px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'oklch(62% 0.18 270/0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28 }}>🚫</div>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{target.display_name} blocked</p>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>They won't appear on your map or be able to contact you.</p>
          <Btn onClick={onClose}>Done</Btn>
        </div>}

        {mode === 'reported' && <div style={{ textAlign: 'center', padding: '8px 0 10px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: `${C.success}18`, border: `2px solid ${C.success}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon name="check" size={28} color={C.success} /></div>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 17, marginBottom: 6 }}>Report submitted</p>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Thank you. Our team will review this. {target.display_name} has also been blocked for your safety.</p>
          <Btn onClick={onClose}>Done</Btn>
        </div>}
      </div>
    </div>
  );
}

export function MeetupSafetyModal({ partner, trustedContacts, onStart, onClose }) {
  const [step, setStep] = useState('setup');
  const [timer, setTimer] = useState(30);
  const [selectedContact, setSelectedContact] = useState(trustedContacts[0] || null);
  const [shareLocation, setShareLocation] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [sosTriggered, setSosTriggered] = useState(false);

  useEffect(() => {
    if (step !== 'active') return;
    setCountdown(timer * 60);
    const t = setInterval(() => setCountdown(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [step]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');
  const pct = timer > 0 ? (countdown / (timer * 60)) * 100 : 0;
  const urgency = countdown < 120 ? C.error : countdown < 300 ? 'oklch(70% 0.2 55)' : C.success;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={step === 'setup' ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '26px 26px 0 0', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}`, maxHeight: '90%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '12px auto 0', flexShrink: 0 }} />

        {step === 'setup' && <div style={{ padding: '16px 22px 36px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.success}18`, border: `1px solid ${C.success}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🛡️</div>
            <div><p style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>Meetup Safety</p><p style={{ color: C.muted, fontSize: 12 }}>Set up safety checks before meeting {partner.display_name}</p></div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Check-in Timer</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[15, 30, 60, 120].map(m => (
                <button key={m} onClick={() => setTimer(m)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, border: `1.5px solid ${timer === m ? C.accent : C.border}`, background: timer === m ? C.accentL : 'none', color: timer === m ? C.accent : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 7 }}>If you don't check in within {timer < 60 ? `${timer} minutes` : `${timer / 60} hour${timer > 60 ? 's' : ''}`}, your trusted contact will be notified.</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Alert Contact</p>
            {trustedContacts.length > 0
              ? trustedContacts.map(tc => (
                <button key={tc.username || tc.name} onClick={() => setSelectedContact(tc)} style={{ width: '100%', background: selectedContact?.username === tc.username ? C.accentL : C.surface, border: `1.5px solid ${selectedContact?.username === tc.username ? C.accent : C.border}`, borderRadius: 13, padding: '11px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit', marginBottom: 7, transition: 'all 0.15s' }}>
                  <Avatar name={tc.display_name || tc.name} color={tc.color || C.muted} size={36} />
                  <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{tc.display_name || tc.name}</p><p style={{ color: C.muted, fontSize: 11 }}>{tc.username ? `@${tc.username}` : tc.phone}</p></div>
                  {selectedContact?.username === tc.username && <Icon name="check" size={16} color={C.accent} />}
                </button>
              ))
              : <div style={{ background: C.surface, borderRadius: 13, padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <p style={{ color: C.muted, fontSize: 13 }}>No trusted contacts yet</p>
                <p style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Add them in Profile → Safety</p>
              </div>
            }
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
            <div><p style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>Share live location</p><p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>With your trusted contact during the meetup</p></div>
            <div onClick={() => setShareLocation(v => !v)} style={{ width: 46, height: 26, borderRadius: 13, background: shareLocation ? C.success : C.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: shareLocation ? 22 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <Btn onClick={() => { setStep('active'); onStart && onStart({ timer, contact: selectedContact, shareLocation }); }}>🛡️ Start Safety Check-in</Btn>
          <button onClick={onClose} style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', padding: '8px' }}>Skip for now</button>
        </div>}

        {step === 'active' && <div style={{ padding: '20px 22px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>🛡️ Safety Active</p>
            <div style={{ background: `${C.success}18`, border: `1px solid ${C.success}44`, borderRadius: 20, padding: '4px 10px' }}><span style={{ color: C.success, fontSize: 11, fontWeight: 700 }}>LIVE</span></div>
          </div>
          <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 18 }}>
            <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke={C.border} strokeWidth="8" />
              <circle cx="70" cy="70" r="60" fill="none" stroke={urgency} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 60}`} strokeDashoffset={`${2 * Math.PI * 60 * (1 - pct / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s linear,stroke 0.5s' }} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: urgency, fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums', transition: 'color 0.5s' }}>{mm}:{ss}</p>
              <p style={{ color: C.muted, fontSize: 11 }}>remaining</p>
            </div>
          </div>
          {selectedContact && <div style={{ background: C.surface, borderRadius: 14, padding: '11px 14px', width: '100%', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, border: `1px solid ${C.border}` }}>
            <Avatar name={selectedContact.display_name || selectedContact.name} color={selectedContact.color || C.muted} size={36} />
            <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>Alerting {selectedContact.display_name || selectedContact.name}</p><p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{shareLocation ? 'Sharing your live location' : 'Location sharing off'}</p></div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.success, flexShrink: 0, boxShadow: `0 0 0 3px ${C.success}33` }} />
          </div>}
          <div style={{ display: 'flex', gap: 9, width: '100%', marginBottom: 10 }}>
            <Btn variant="success" full={false} style={{ flex: 2 }} onClick={() => setStep('setup')}><Icon name="check" size={15} color="#fff" /> I'm Safe</Btn>
            <Btn variant="danger" full={false} style={{ flex: 1 }} onClick={() => setSosTriggered(true)}>🆘 SOS</Btn>
          </div>
          <p style={{ color: C.muted, fontSize: 11, textAlign: 'center' }}>Tap "I'm Safe" to confirm check-in and stop the timer</p>
          {sosTriggered && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', borderRadius: '26px 26px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, animation: 'fadeIn 0.2s' }}>
            <div style={{ fontSize: 52 }}>🆘</div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, textAlign: 'center' }}>SOS Activated</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>{selectedContact ? `${selectedContact.display_name || selectedContact.name} has been notified with your location.` : 'Emergency services alerted.'} Your location is being shared every 30 seconds.</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 18px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>Emergency number</p>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 24 }}>911</p>
            </div>
            <Btn style={{ background: '#fff', color: '#000' }} onClick={() => { setSosTriggered(false); setStep('setup'); onClose(); }}>Cancel SOS</Btn>
          </div>}
        </div>}
      </div>
    </div>
  );
}

export function SafetyHubScreen({ friends, blockedUsers, trustedContacts, locationPrecision, onBack, onSetPrecision, onAddTrusted, onRemoveTrusted, onUnblock }) {
  const [section, setSection] = useState('overview');

  function Toggle({ label, sub, val, onToggle }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: `1px solid ${C.border}` }}>
        <div><p style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{label}</p>{sub && <p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{sub}</p>}</div>
        <div onClick={onToggle} style={{ width: 46, height: 26, borderRadius: 13, background: val ? C.success : C.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: val ? 22 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, height: '100%', display: 'flex', flexDirection: 'column', animation: 'slideRight 0.25s ease', background: C.bg }}>
      <StatusBar />
      <div style={{ padding: '10px 18px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}><Icon name="back" size={20} color={C.muted} /></button>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 17 }}>Safety & Privacy</p>
          <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>You're in control</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${C.success}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛡️</div>
      </div>

      <div style={{ display: 'flex', gap: 0, margin: '10px 16px', background: C.surface, borderRadius: 13, padding: 4, flexShrink: 0 }}>
        {[{ id: 'overview', l: 'Overview' }, { id: 'location', l: 'Location' }, { id: 'contacts', l: 'Trusted' }, { id: 'blocked', l: 'Blocked' }].map(t => (
          <button key={t.id} onClick={() => setSection(t.id)} style={{ flex: 1, padding: '6px', borderRadius: 10, border: 'none', background: section === t.id ? C.accent : 'none', color: section === t.id ? '#fff' : C.muted, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 20px' }}>
        {section === 'overview' && <>
          <div style={{ background: `linear-gradient(135deg,${C.success}22,${C.success}08)`, border: `1px solid ${C.success}44`, borderRadius: 18, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Safety Score</p>
              <span style={{ color: C.success, fontWeight: 800, fontSize: 20 }}>72<span style={{ fontSize: 13 }}>/100</span></span>
            </div>
            <div style={{ height: 6, background: `${C.success}22`, borderRadius: 99 }}><div style={{ height: '100%', width: '72%', background: C.success, borderRadius: 99 }} /></div>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Add a trusted contact to improve your score.</p>
          </div>
          {[
            { icon: '🎯', label: 'Location Precision', sub: locationPrecision === 'exact' ? 'Exact (precise)' : locationPrecision === 'approximate' ? 'Approximate (~500m)' : 'Hidden', action: () => setSection('location') },
            { icon: '🤝', label: 'Trusted Contacts', sub: `${trustedContacts.length} contact${trustedContacts.length !== 1 ? 's' : ''} added`, action: () => setSection('contacts') },
            { icon: '🚫', label: 'Blocked Users', sub: `${blockedUsers.length} blocked`, action: () => setSection('blocked') },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '13px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', fontFamily: 'inherit', marginBottom: 9, transition: 'all 0.15s' }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{item.label}</p><p style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>{item.sub}</p></div>
              <Icon name="arrow" size={16} color={C.muted} />
            </button>
          ))}
          <div style={{ background: C.surface, borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Safety tips</p>
            {["Always meet in public places first", "Tell a friend where you're going", "Trust your instincts — leave if uncomfortable", "Use the in-app Verify feature to confirm meetups"].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <span style={{ color: C.success, fontSize: 13, flexShrink: 0 }}>✓</span>
                <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{tip}</p>
              </div>
            ))}
          </div>
        </>}

        {section === 'location' && <>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>Control how precisely your location is shown to other users on the map.</p>
          {[
            { key: 'exact', emoji: '📍', label: 'Exact', sub: 'Your precise GPS location (~10m accuracy)' },
            { key: 'approximate', emoji: '📌', label: 'Approximate', sub: 'Blurred to ~500m — neighbourhood level' },
            { key: 'hidden', emoji: '👻', label: 'Hidden', sub: 'Not visible on map (you can still browse)' },
          ].map(opt => (
            <button key={opt.key} onClick={() => onSetPrecision(opt.key)} style={{ width: '100%', background: locationPrecision === opt.key ? C.accentL : C.surface, border: `1.5px solid ${locationPrecision === opt.key ? C.accent : C.border}`, borderRadius: 16, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 12, alignItems: 'center', fontFamily: 'inherit', marginBottom: 9, transition: 'all 0.15s' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{opt.emoji}</div>
              <div style={{ flex: 1 }}><p style={{ color: locationPrecision === opt.key ? C.accent : C.text, fontWeight: 700, fontSize: 14 }}>{opt.label}</p><p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{opt.sub}</p></div>
              {locationPrecision === opt.key && <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={11} color="#fff" /></div>}
            </button>
          ))}
          <div style={{ background: 'oklch(62% 0.18 240/0.1)', border: '1px solid oklch(62% 0.18 240/0.25)', borderRadius: 14, padding: '11px 14px', marginTop: 6 }}>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}><span style={{ color: C.blue, fontWeight: 700 }}>Trusted contacts</span> always see your exact location during a safety check-in, regardless of this setting.</p>
          </div>
        </>}

        {section === 'contacts' && <>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>Trusted contacts are notified if you miss a safety check-in. They can also see your live location during meetups.</p>
          {trustedContacts.map((tc, i) => (
            <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '11px 13px', background: C.surface, borderRadius: 14, marginBottom: 8, border: `1px solid ${C.success}44` }}>
              <Avatar name={tc.display_name || tc.name} color={tc.color || C.muted} size={40} />
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{tc.display_name || tc.name}</p><p style={{ color: C.muted, fontSize: 11 }}>{tc.username ? `@${tc.username}` : tc.phone || 'App user'}</p></div>
              <button onClick={() => onRemoveTrusted(tc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}><Icon name="x" size={16} color={C.muted} /></button>
            </div>
          ))}
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, marginTop: trustedContacts.length ? 14 : 0 }}>Add from friends</p>
          {friends.filter(f => !trustedContacts.find(tc => tc.username === f.username)).map((f, i) => (
            <button key={f.username} onClick={() => onAddTrusted(f)} style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: '11px 13px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', fontFamily: 'inherit', marginBottom: 7, transition: 'all 0.15s' }}>
              <Avatar name={f.display_name} color={f.color} size={36} />
              <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{f.display_name}</p><p style={{ color: C.muted, fontSize: 11 }}>@{f.username}</p></div>
              <div style={{ background: C.accentL, borderRadius: 8, padding: '4px 9px' }}><span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>+ Add</span></div>
            </button>
          ))}
          {friends.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0' }}><p style={{ color: C.muted, fontSize: 13 }}>Add friends first to set them as trusted contacts</p></div>}
        </>}

        {section === 'blocked' && (
          blockedUsers.length === 0
            ? <div style={{ textAlign: 'center', paddingTop: 40 }}><div style={{ fontSize: 36, marginBottom: 10 }}>🚫</div><p style={{ color: C.muted, fontSize: 13 }}>No blocked users</p></div>
            : blockedUsers.map((u, i) => (
              <div key={u.username} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '11px 13px', background: C.surface, borderRadius: 14, marginBottom: 8, border: `1px solid ${C.border}` }}>
                <Avatar name={u.display_name} color={u.color || C.muted} size={40} />
                <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{u.display_name}</p><p style={{ color: C.muted, fontSize: 11 }}>@{u.username}</p></div>
                <button onClick={() => onUnblock(u)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: C.muted, fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}>Unblock</button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
