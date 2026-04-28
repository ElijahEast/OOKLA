import React, { useState } from 'react';
import { C, fmtDist } from '../utils/constants';
import { Icon, Btn, StatusBar } from '../components/ui';

function EventCard({ ev, rsvped, onRSVP, mine, delay = 0 }) {
  const pctFull = ev.capacity ? Math.min(100, (ev.attendees / ev.capacity) * 100) : 0;
  return (
    <div style={{ background: C.surface, borderRadius: 18, padding: '13px', marginBottom: 9, border: `1.5px solid ${ev.boosted ? 'oklch(62% 0.18 55/0.45)' : C.border}`, animation: `fadeUp 0.3s ease ${delay}s both`, position: 'relative', overflow: 'hidden' }}>
      {ev.boosted && <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg,oklch(68% 0.2 55),oklch(62% 0.18 55))', color: '#1a1008', padding: '3px 9px', fontSize: 10, fontWeight: 800, borderBottomLeftRadius: 10, letterSpacing: '0.03em' }}>📣 BOOSTED</div>}
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${ev.color}22`, border: `1.5px solid ${ev.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{ev.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ background: ev.hostType === 'business' ? 'oklch(62% 0.18 55/0.12)' : C.accentG, color: ev.hostType === 'business' ? 'oklch(68% 0.2 55)' : C.accent, fontSize: 9, fontWeight: 800, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ev.tag}</span>
            <span style={{ color: C.muted, fontSize: 11 }}>· {fmtDist(ev.distance_m)}</span>
            {ev.verified && <span title="Verified business" style={{ color: 'oklch(68% 0.15 220)', fontSize: 12 }}>✓</span>}
          </div>
          <p style={{ color: C.text, fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{ev.title}</p>
          <p style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>by <span style={{ color: C.text, fontWeight: 600 }}>{ev.host}</span> · {ev.starts}</p>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 1.45 }}>{ev.desc}</p>
          <div style={{ marginTop: 9, display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: C.muted, fontSize: 10, fontWeight: 600 }}>{ev.attendees}/{ev.capacity} going</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{ev.radius_km}km reach</span>
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${pctFull}%`, background: pctFull > 85 ? C.error : C.accent, borderRadius: 99 }} />
              </div>
            </div>
            {!mine && <Btn small full={false} variant={rsvped ? 'subtle' : 'primary'} onClick={onRSVP} style={{ paddingLeft: 12, paddingRight: 12 }}>{rsvped ? '✓ Going' : 'RSVP'}</Btn>}
            {mine && <span style={{ background: C.accentG, border: `1px solid ${C.accentL}`, color: C.accent, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '5px 10px' }}>Hosting</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventModal({ radiusKm, hasMegaphone, onCreate, onClose }) {
  const EMOJIS = ['🎉', '☕', '🏃', '🎲', '📷', '🎸', '🏀', '🍕', '🎨', '🥾', '🧘', '🎬'];
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [when, setWhen] = useState('Tonight 7:00 PM');
  const [cap, setCap] = useState(12);
  const [emoji, setEmoji] = useState('🎉');
  const [tag, setTag] = useState('Meetup');
  const canSubmit = title.trim().length > 2 && desc.trim().length > 5;

  function submit() {
    onCreate({
      id: 'user_' + Date.now(), host: 'You', hostType: 'person', verified: false,
      title: title.trim(), desc: desc.trim(), emoji, color: 'oklch(62% 0.18 200)',
      distance_m: 0, radius_km: radiusKm, starts: when, attendees: 1, capacity: cap, tag, boosted: hasMegaphone,
    });
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', animation: 'fadeIn 0.2s' }} />
      <div style={{ position: 'relative', background: C.bg, borderRadius: '26px 26px 0 0', padding: '0 22px 30px', animation: 'slideUp 0.3s ease', border: `1px solid ${C.border}`, maxHeight: '92%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}><div style={{ width: 36, height: 4, background: C.border, borderRadius: 99 }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexShrink: 0 }}>
          <h3 style={{ color: C.text, fontWeight: 800, fontSize: 18 }}>Host an event</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="x" size={18} color={C.muted} /></button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ background: hasMegaphone ? 'oklch(62% 0.18 55/0.1)' : C.surface, border: `1px solid ${hasMegaphone ? 'oklch(62% 0.18 55/0.35)' : C.border}`, borderRadius: 12, padding: '10px 13px', marginBottom: 13, display: 'flex', gap: 9, alignItems: 'center' }}>
            <span style={{ fontSize: 19 }}>{hasMegaphone ? '📣' : '📍'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: C.text, fontSize: 12.5, fontWeight: 700 }}>Reaches people within <span style={{ color: C.accent }}>{radiusKm}km</span></p>
              <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>{hasMegaphone ? 'Megaphone boost active — 3× default range' : 'Grab the 📣 Event Megaphone in the Shop to extend to 15km'}</p>
            </div>
          </div>
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Sunset run @ the pier" maxLength={60}
            style={{ width: '100%', marginTop: 5, marginBottom: 12, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '11px 13px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', fontWeight: 600 }} />
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's the vibe? Where do people meet?" maxLength={200} rows={3}
            style={{ width: '100%', marginTop: 5, marginBottom: 12, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 13px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5 }} />
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pick an emoji</label>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', margin: '6px 0 12px' }}>
            {EMOJIS.map(e => <button key={e} onClick={() => setEmoji(e)} style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${emoji === e ? C.accent : C.border}`, background: emoji === e ? C.accentL : C.surface, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' }}>{e}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>When</label>
              <input value={when} onChange={e => setWhen(e.target.value)} style={{ width: '100%', marginTop: 5, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', fontWeight: 600 }} />
            </div>
            <div style={{ width: 90 }}>
              <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cap</label>
              <input type="number" min="2" max="200" value={cap} onChange={e => setCap(+e.target.value || 12)} style={{ width: '100%', marginTop: 5, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', color: C.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', fontWeight: 700, textAlign: 'center' }} />
            </div>
          </div>
          <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Type</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 14 }}>
            {['Meetup', 'Event', 'Promo'].map(t => (
              <button key={t} onClick={() => setTag(t)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1.5px solid ${tag === t ? C.accent : C.border}`, background: tag === t ? C.accentL : C.surface, color: tag === t ? C.accent : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
            ))}
          </div>
        </div>
        <Btn disabled={!canSubmit} onClick={submit} style={{ opacity: canSubmit ? 1 : 0.4 }}>📣 Publish to {radiusKm}km radius</Btn>
      </div>
    </div>
  );
}

export function EventsScreen({ events, userEvents, ownedBoosts, onCreate, onRSVP, rsvped }) {
  const [tab, setTab] = useState('nearby');
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);

  const hasMegaphone = ownedBoosts && ownedBoosts.includes('event_radius');
  const myRadius = hasMegaphone ? 15 : 5;
  const all = [...events, ...userEvents];
  const visible = all.filter(e => e.distance_m <= (e.radius_km || 5) * 1000);
  const feed = filter === 'all' ? visible : visible.filter(e => e.hostType === filter);
  const mine = userEvents;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <StatusBar />
      <div style={{ padding: '12px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Events</h2>
          <p style={{ color: C.muted, fontSize: 11.5, marginTop: 2 }}>Within {myRadius}km of you{hasMegaphone && <span style={{ color: C.accent, fontWeight: 700 }}> · 📣 Megaphone active</span>}</p>
        </div>
        <button onClick={() => setCreating(true)} style={{ background: C.accent, border: 'none', borderRadius: 99, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>Host
        </button>
      </div>

      <div style={{ display: 'flex', gap: 0, margin: '6px 18px 8px', background: C.surface, borderRadius: 13, padding: 4, flexShrink: 0 }}>
        {[{ id: 'nearby', l: `Nearby · ${feed.length}` }, { id: 'mine', l: `Hosting · ${mine.length}` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '7px', borderRadius: 10, border: 'none', background: tab === t.id ? C.accent : 'none', color: tab === t.id ? '#fff' : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{t.l}</button>
        ))}
      </div>

      {tab === 'nearby' && (
        <div style={{ display: 'flex', gap: 6, margin: '0 18px 8px', flexShrink: 0 }}>
          {[{ id: 'all', l: 'All', emoji: '🌐' }, { id: 'business', l: 'Businesses', emoji: '🏪' }, { id: 'person', l: 'People', emoji: '👥' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ flex: 1, padding: '6px 8px', borderRadius: 10, border: `1px solid ${filter === f.id ? C.accent : C.border}`, background: filter === f.id ? C.accentL : C.surface, color: filter === f.id ? C.accent : C.muted, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              <span>{f.emoji}</span>{f.l}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '0 15px 12px' }}>
        {tab === 'nearby'
          ? feed.length === 0
            ? <div style={{ textAlign: 'center', paddingTop: 60 }}><div style={{ fontSize: 38, marginBottom: 10 }}>📅</div><p style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 5 }}>No events nearby</p><p style={{ color: C.muted, fontSize: 12 }}>Host one yourself — tap "+ Host"</p></div>
            : feed.map((ev, i) => <EventCard key={ev.id} ev={ev} rsvped={rsvped.includes(ev.id)} onRSVP={() => onRSVP(ev)} delay={i * 0.05} />)
          : mine.length === 0
            ? <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🎪</div>
              <p style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 5 }}>You haven't hosted yet</p>
              <p style={{ color: C.muted, fontSize: 12, marginBottom: 14, padding: '0 30px', lineHeight: 1.5 }}>Your events reach {myRadius}km. Grab the 📣 Megaphone in the Shop to reach 15km.</p>
              <Btn small full={false} onClick={() => setCreating(true)}><span>+ Host your first event</span></Btn>
            </div>
            : mine.map((ev, i) => <EventCard key={ev.id} ev={ev} mine rsvped={false} onRSVP={() => { }} delay={i * 0.05} />)
        }
      </div>

      {creating && <CreateEventModal radiusKm={myRadius} hasMegaphone={hasMegaphone} onCreate={e => { onCreate(e); setCreating(false); }} onClose={() => setCreating(false)} />}
    </div>
  );
}
