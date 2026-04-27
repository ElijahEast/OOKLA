import { useState, useEffect } from 'react';
import { C } from '../utils/constants';
import { Icon, Btn, Spinner, QRCode } from '../components/ui';

export function MeetupVerifyModal({ partner, onComplete, onClose }) {
  const [step, setStep] = useState('role');
  const [role, setRole] = useState(null);
  const [code] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [entered, setEntered] = useState('');
  const [gpsProgress, setGpsProgress] = useState(0);
  const [gpsOk, setGpsOk] = useState(false);
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (step !== 'gps') return;
    setGpsProgress(0);
    const t = setInterval(() => setGpsProgress(p => {
      const next = p + 2;
      if (next >= 100) {
        clearInterval(t);
        setTimeout(() => { setGpsOk(true); setTimeout(() => setStep('confirm'), 700); }, 400);
        return 100;
      }
      return next;
    }), 40);
    return () => clearInterval(t);
  }, [step]);

  function handleRoleSelect(r) { setRole(r); setStep(r === 'host' ? 'host-code' : 'join-enter'); }
  function handleJoinSubmit() {
    if (entered.trim().toUpperCase() === code) { setStep('gps'); setCodeError(''); }
    else if (entered.trim().length === 6) { setCodeError("Code doesn't match. Try again."); }
    else { setCodeError('Enter the full 6-character code.'); }
  }

  const distM = partner.distance_m || 450;
  const gpsColor = distM < 500 ? C.success : distM < 1000 ? C.accent : C.error;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '28px 28px 0 0', animation: 'slideUp 0.35s ease', border: `1px solid ${C.border}`, maxHeight: '90%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: C.border, margin: '14px auto 0', flexShrink: 0 }} />

        {step === 'role' && (
          <div style={{ padding: '20px 24px 36px' }}>
            <h3 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 6 }}>Verify Meetup</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>Confirm you've met <strong style={{ color: C.text }}>{partner.display_name}</strong> in person. Both earn <span style={{ color: C.accent, fontWeight: 700 }}>+50 XP</span> and <span style={{ color: C.gold, fontWeight: 700 }}>+5 🪙</span>.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ r: 'host', icon: '📲', title: "I'll generate the code", sub: 'Show your QR code for the other person to scan' },
                { r: 'join', icon: '🔍', title: "I'll enter the code",    sub: "Type in the code shown on their screen" }].map(({ r, icon, title, sub }) => (
                <button key={r} onClick={() => handleRoleSelect(r)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center', fontFamily: 'inherit' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: r === 'host' ? C.accentL : 'oklch(62% 0.18 240/0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{icon}</div>
                  <div><p style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{title}</p><p style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{sub}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'host-code' && (
          <div style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Your Meetup Code</p>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>Show this to <strong style={{ color: C.text }}>{partner.display_name}</strong> to verify</p>
            <div style={{ background: '#fff', borderRadius: 20, padding: 14, marginBottom: 18, boxShadow: '0 8px 28px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
              <QRCode code={code} />
              <div style={{ position: 'absolute', left: 14, right: 14, height: 2, background: `linear-gradient(90deg,transparent,${C.accent},transparent)`, animation: 'scanline 2s ease-in-out infinite', boxShadow: `0 0 8px ${C.accent}` }} />
            </div>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Or enter manually</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {code.split('').map((ch, i) => (
                <div key={i} style={{ width: 40, height: 48, borderRadius: 12, background: C.surface, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: C.accent }}>{ch}</div>
              ))}
            </div>
            <div style={{ background: C.surface, borderRadius: 14, padding: '10px 16px', width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `${gpsColor}22`, border: `2px solid ${gpsColor}44`, animation: 'gpsRing 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: gpsColor, opacity: 0.9 }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>GPS proximity</p>
                <p style={{ color: gpsColor, fontSize: 11, marginTop: 1, fontWeight: 700 }}>{distM}m away {distM < 500 ? '✓ Close enough' : '⚠ Move closer'}</p>
              </div>
            </div>
            <Btn onClick={() => setStep('gps')}>Partner scanned — continue →</Btn>
          </div>
        )}

        {step === 'join-enter' && (
          <div style={{ padding: '20px 24px 36px' }}>
            <p style={{ color: C.text, fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Enter Code</p>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 18 }}>Ask <strong style={{ color: C.text }}>{partner.display_name}</strong> to show their QR or code</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ width: 42, height: 50, borderRadius: 12, background: C.surface, border: `1.5px solid ${entered[i] ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: C.accent, transition: 'border-color 0.2s' }}>
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
            <p style={{ color: C.muted, fontSize: 12, marginBottom: 20, textAlign: 'center' }}>Confirming you're in the same place…</p>
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

        {step === 'confirm' && (
          <div style={{ padding: '24px 24px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🤝</div>
            <h3 style={{ color: C.text, fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Almost there!</h3>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Confirm your meetup with <strong style={{ color: C.text }}>{partner.display_name}</strong> to earn rewards.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 22 }}>
              {[{ e: '⚡', v: '+50 XP' }, { e: '🪙', v: '+5 coins' }].map(r => (
                <div key={r.v} style={{ background: C.surface, borderRadius: 14, padding: '11px 18px', border: `1px solid ${C.border}`, animation: 'countUp 0.4s ease both' }}>
                  <div style={{ fontSize: 21, marginBottom: 3 }}>{r.e}</div>
                  <p style={{ color: C.accent, fontWeight: 800, fontSize: 12 }}>{r.v}</p>
                </div>
              ))}
            </div>
            <Btn onClick={onComplete}>Confirm Meetup ✓</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
