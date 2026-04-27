import { useState } from 'react';
import { C } from '../utils/constants';
import { Icon, Btn, StatusBar } from '../components/ui';
import { MOCK_SHOP } from '../utils/data';

export function ShopScreen({ coins, owned, onBuy, quests, onClaim }) {
  const [tab, setTab] = useState('items');
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? MOCK_SHOP : MOCK_SHOP.filter(i => i.category === filter);
  const questsDone = quests ? quests.filter(q => q.done).length : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '12px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>Shop</h2>
        <div style={{ background: C.surface, borderRadius: 20, padding: '5px 13px', border: `1px solid ${C.border}`, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 15 }}>🪙</span>
          <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{coins}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, margin: '0 18px 10px', background: C.surface, borderRadius: 13, padding: 4, flexShrink: 0 }}>
        {[{ id: 'items', l: 'Items' }, { id: 'quests', l: `Quests · ${questsDone}/${quests?.length || 0}` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '7px', borderRadius: 10, border: 'none', background: tab === t.id ? C.accent : 'none', color: tab === t.id ? '#fff' : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{t.l}</button>
        ))}
      </div>

      {tab === 'items' ? <>
        <div style={{ display: 'flex', gap: 0, margin: '0 18px 10px', background: C.surface, borderRadius: 11, padding: 3, flexShrink: 0 }}>
          {[{ id: 'all', l: 'All' }, { id: 'boost', l: 'Boosts' }, { id: 'cosmetic', l: 'Cosmetics' }].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{ flex: 1, padding: '6px', borderRadius: 9, border: 'none', background: filter === t.id ? C.raised : 'none', color: filter === t.id ? C.text : C.muted, fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>{t.l}</button>
          ))}
        </div>
        {coins < 50 && (
          <div style={{ margin: '0 15px 10px', background: 'oklch(62% 0.18 55/0.09)', border: '1px solid oklch(62% 0.18 55/0.22)', borderRadius: 12, padding: '9px 13px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 15 }}>💡</span>
            <p style={{ color: C.muted, fontSize: 12 }}>Complete quests & meetups to earn more 🪙 coins</p>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 15px' }}>
          {list.map((item, i) => {
            const isOwned = owned.includes(item.key);
            const canAfford = coins >= item.cost;
            return (
              <div key={item.key} style={{ background: isOwned ? 'oklch(62% 0.18 145/0.07)' : C.surface, borderRadius: 18, padding: '14px', marginBottom: 9, border: `1.5px solid ${isOwned ? 'oklch(62% 0.18 145/0.28)' : C.border}`, display: 'flex', gap: 12, alignItems: 'center', animation: `fadeUp 0.3s ease ${i * 0.07}s both` }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: isOwned ? 'oklch(62% 0.18 145/0.12)' : item.category === 'boost' ? C.accentL : 'oklch(62% 0.18 295/0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{item.name}</p>
                    <span style={{ background: item.category === 'boost' ? C.accentG : 'oklch(62% 0.18 295/0.12)', color: item.category === 'boost' ? C.accent : C.purple, fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase' }}>{item.category}</span>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</p>
                  {item.dur && <p style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>⏱ Duration: {item.dur}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isOwned
                    ? <div style={{ background: 'oklch(62% 0.18 145/0.15)', borderRadius: 10, padding: '5px 10px', textAlign: 'center' }}><span style={{ color: C.success, fontSize: 11, fontWeight: 700 }}>✓ Owned</span></div>
                    : <Btn small full={false} disabled={!canAfford} onClick={() => onBuy(item)} style={{ opacity: canAfford ? 1 : 0.4 }}>🪙 {item.cost}</Btn>
                  }
                </div>
              </div>
            );
          })}
        </div>
      </> : <>
        <div style={{ padding: '0 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ color: C.muted, fontSize: 11 }}>Resets in 14h 32m</p>
          <div style={{ background: C.accentG, border: `1px solid ${C.accentL}`, borderRadius: 9, padding: '3px 9px' }}><span style={{ color: C.accent, fontSize: 11, fontWeight: 700 }}>{questsDone}/{quests?.length || 0}</span></div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 15px' }}>
          {(quests || []).map((q, i) => (
            <div key={q.key} style={{ background: q.done ? 'oklch(62% 0.18 145/0.07)' : C.surface, borderRadius: 18, padding: '13px', marginBottom: 8, border: `1.5px solid ${q.done ? 'oklch(62% 0.18 145/0.22)' : C.border}`, animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, flexShrink: 0, paddingTop: 1 }}>{q.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <p style={{ color: q.done ? C.success : C.text, fontWeight: 700, fontSize: 14 }}>{q.title}</p>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {q.xp > 0 && <span style={{ background: q.done ? 'oklch(62% 0.18 145/0.15)' : C.accentG, color: q.done ? C.success : C.accent, fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>+{q.xp} XP</span>}
                      {q.coins > 0 && <span style={{ background: C.raised, color: C.muted, fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px' }}>🪙{q.coins}</span>}
                    </div>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>{q.desc}</p>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: C.muted, fontSize: 11 }}>{Math.min(q.progress, q.target)}/{q.target}</span>
                      {q.done && <span style={{ color: C.success, fontSize: 10, fontWeight: 700 }}>✓ Done</span>}
                    </div>
                    <div style={{ height: 4, background: C.border, borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${Math.min((q.progress / q.target) * 100, 100)}%`, background: q.done ? C.success : C.accent, borderRadius: 99, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  {q.done && q.claimable && (
                    <div style={{ marginTop: 8 }}>
                      <Btn small onClick={() => onClaim(q.key)} style={{ background: C.success }}>
                        <Icon name="zap" size={12} color="#fff" />Claim Reward
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
