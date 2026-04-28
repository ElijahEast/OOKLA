import React, { useState } from 'react';
import { C, fmtDist } from '../utils/constants';
import { Icon, Avatar, Btn, StatusBar } from '../components/ui';
import { ALL_USERS, GROUP_EMOJIS } from '../utils/data';

function CreateGroupModal({ friends, preselected = [], onCreate, onClose }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [sel, setSel] = useState(() => new Set(preselected.map(f => f.username)));

  const toggle = u => { const n = new Set(sel); n.has(u) ? n.delete(u) : n.add(u); setSel(n); };
  const canCreate = sel.size >= 2 && name.trim().length > 0;
  const selectedFriends = friends.filter(f => sel.has(f.username));
  const autoName = selectedFriends.slice(0, 3).map(f => f.display_name.split(' ')[0]).join(', ') + (selectedFriends.length > 3 ? ` +${selectedFriends.length - 3}` : '');

  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 280, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: C.bg, borderRadius: '22px 22px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s cubic-bezier(.2,.8,.2,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <p style={{ color: C.text, fontWeight: 800, fontSize: 15 }}>New Group</p>
          <button onClick={() => canCreate && onCreate({ name: name.trim(), emoji, memberUsernames: [...sel] })} disabled={!canCreate}
            style={{ background: 'none', border: 'none', color: canCreate ? C.accent : C.muted, fontSize: 14, fontWeight: 800, cursor: canCreate ? 'pointer' : 'default', fontFamily: 'inherit', opacity: canCreate ? 1 : 0.5 }}>
            Create
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 18px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentL, border: `1.5px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{emoji}</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={sel.size >= 2 ? autoName : 'Group name'} maxLength={30}
              style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 13, padding: '14px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {GROUP_EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)} style={{ width: 36, height: 36, borderRadius: 10, background: emoji === e ? C.accentL : C.surface, border: `1.5px solid ${emoji === e ? C.accent : C.border}`, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Add Members</p>
            <p style={{ color: sel.size >= 2 ? C.accent : C.muted, fontSize: 11, fontWeight: 700 }}>{sel.size} selected {sel.size < 2 ? `· need ${2 - sel.size} more` : ''}</p>
          </div>
          {friends.length === 0
            ? <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No friends to add yet</p>
            : friends.map(f => {
              const on = sel.has(f.username);
              return (
                <div key={f.username} onClick={() => toggle(f.username)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', background: on ? C.accentL : C.surface, borderRadius: 13, marginBottom: 6, border: `1.5px solid ${on ? C.accent : C.border}`, cursor: 'pointer' }}>
                  <Avatar name={f.display_name} color={f.color} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{f.display_name}</p>
                    <p style={{ color: C.muted, fontSize: 11 }}>Lv {f.level} · {fmtDist(f.distance_m || 950)}</p>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: on ? C.accent : 'transparent', border: `1.5px solid ${on ? C.accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {on && <Icon name="check" size={12} color="#fff" />}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export function PeopleScreen({ friends, groups, incomingRequests, friendRequests, blockedUsers = [], onRequestUser, onAddFriend, onAcceptMeetup, onDeclineMeetup, onAcceptFriend, onDeclineFriend, onOpenChat, onOpenGroup, onCreateGroup, onViewProfile, onUnblock }) {
  const [tab, setTab] = useState('friends');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const results = query.trim().length > 0
    ? ALL_USERS.filter(u => u.display_name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase()))
    : [];
  const tabs = [
    { id: 'friends', label: 'Friends' },
    { id: 'groups', label: 'Groups', badge: groups.length },
    { id: 'nearby', label: 'Nearby' },
    { id: 'inbox', label: 'Inbox', badge: incomingRequests.length + friendRequests.length },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '12px 20px 0' }}><h2 style={{ color: C.text, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>People</h2></div>

      <div style={{ margin: '10px 18px 0', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '0 14px', height: 44, display: 'flex', alignItems: 'center', gap: 9 }}>
        <Icon name="search" size={16} color={C.muted} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }} />
        {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="x" size={15} color={C.muted} /></button>}
      </div>

      {query.trim().length > 0
        ? <div style={{ flex: 1, overflow: 'auto', padding: '10px 15px' }}>
          {results.length === 0
            ? <div style={{ textAlign: 'center', paddingTop: 40 }}><p style={{ color: C.muted }}>No results for "{query}"</p></div>
            : results.map((u, i) => {
              const isFriend = friends.some(f => f.username === u.username);
              return (
                <div key={u.id} onClick={() => onViewProfile(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: C.surface, borderRadius: 15, marginBottom: 8, border: `1px solid ${C.border}`, cursor: 'pointer', animation: `fadeUp 0.2s ease ${i * 0.05}s both` }}>
                  <Avatar name={u.display_name} color={u.color} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{u.display_name}</p>
                      <span style={{ background: C.accentG, color: C.accent, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px', flexShrink: 0 }}>Lv {u.level}</span>
                      {isFriend && <span style={{ background: 'oklch(62% 0.18 145/0.15)', color: C.success, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Friend</span>}
                    </div>
                    <p style={{ color: C.muted, fontSize: 12, marginTop: 1 }}>@{u.username} · {fmtDist(u.distance_m)}</p>
                  </div>
                  <Icon name="arrow" size={15} color={C.muted} />
                </div>
              );
            })
          }
        </div>
        : <>
          <div style={{ display: 'flex', gap: 0, margin: '8px 18px', background: C.surface, borderRadius: 13, padding: 4, flexShrink: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 10, border: 'none', background: tab === t.id ? C.accent : 'none', color: tab === t.id ? '#fff' : C.muted, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', position: 'relative' }}>
                {t.label}
                {t.badge > 0 && <span style={{ marginLeft: 4, background: tab === t.id ? 'rgba(255,255,255,0.3)' : C.error, borderRadius: 99, padding: '1px 5px', fontSize: 10, color: '#fff' }}>{t.badge}</span>}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 15px' }}>

            {tab === 'friends' && (friends.length === 0
              ? <div style={{ textAlign: 'center', paddingTop: 50 }}><div style={{ fontSize: 38, marginBottom: 10 }}>🤝</div><p style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 5 }}>No friends yet</p><p style={{ color: C.muted, fontSize: 13 }}>Tap a pin on the map or use search to add friends</p></div>
              : friends.map((f, i) => (
                <div key={f.username} onClick={() => onViewProfile(f)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: C.surface, borderRadius: 15, marginBottom: 8, border: `1px solid ${C.border}`, cursor: 'pointer', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={f.display_name} color={f.color} size={44} />
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: C.success, border: `2px solid ${C.surface}` }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{f.display_name}</p>
                      <span style={{ background: C.accentG, color: C.accent, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Lv {f.level}</span>
                    </div>
                    <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>@{f.username} · {fmtDist(f.distance_m || 950)}</p>
                  </div>
                  <Btn small full={false} variant="subtle" onClick={e => { e.stopPropagation(); onOpenChat(f); }} style={{ paddingLeft: 9, paddingRight: 9 }}><Icon name="chat" size={14} color={C.accent} /></Btn>
                </div>
              ))
            )}

            {tab === 'groups' && <>
              <button onClick={() => setShowCreate(true)} disabled={friends.length < 2}
                style={{ width: '100%', background: friends.length < 2 ? C.surface : `linear-gradient(135deg,${C.accent},oklch(62% 0.22 55))`, border: friends.length < 2 ? `1.5px dashed ${C.border}` : 'none', borderRadius: 15, padding: '13px 14px', cursor: friends.length < 2 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10, fontFamily: 'inherit', opacity: friends.length < 2 ? 0.55 : 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: friends.length < 2 ? C.border : 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{friends.length < 2 ? '👥' : '+'}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ color: friends.length < 2 ? C.muted : '#fff', fontWeight: 800, fontSize: 14 }}>New Group Chat</p>
                  <p style={{ color: friends.length < 2 ? C.muted : 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 }}>{friends.length < 2 ? 'Add at least 2 friends to start a group' : 'Meet up with multiple friends at once'}</p>
                </div>
              </button>

              {groups.length === 0
                ? <div style={{ textAlign: 'center', paddingTop: 28 }}>
                  <div style={{ fontSize: 38, marginBottom: 10 }}>👥</div>
                  <p style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 5 }}>No group chats yet</p>
                  <p style={{ color: C.muted, fontSize: 12, padding: '0 30px', lineHeight: 1.5 }}>Create one above, or multi-select friends in the Graph view</p>
                </div>
                : groups.map((g, i) => (
                  <div key={g.id} onClick={() => onOpenGroup(g)}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: C.surface, borderRadius: 15, marginBottom: 8, border: `1px solid ${C.border}`, cursor: 'pointer', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: C.accentL, border: `1px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{g.emoji || '👥'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ color: C.text, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</p>
                        {g.verified && <span style={{ background: 'oklch(62% 0.18 145/0.15)', color: C.success, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px', flexShrink: 0 }}>✓ Met</span>}
                      </div>
                      <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{g.members.length} members · {g.members.filter(m => m.username !== 'you').slice(0, 3).map(m => m.display_name.split(' ')[0]).join(', ')}{g.members.length > 4 ? '…' : ''}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginRight: -4 }}>
                      {g.members.slice(0, 3).map((m, j) => (
                        <div key={m.username} style={{ width: 22, height: 22, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', border: `2px solid ${C.surface}`, marginLeft: j === 0 ? 0 : -8 }}>{m.display_name[0]}</div>
                      ))}
                    </div>
                    <Icon name="arrow" size={15} color={C.muted} />
                  </div>
                ))
              }
            </>}

            {tab === 'nearby' && ALL_USERS.filter(u => !blockedUsers.some(b => b.username === u.username)).map((u, i) => {
              const isFriend = friends.some(f => f.username === u.username);
              return (
                <div key={u.id} onClick={() => onViewProfile(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', background: C.surface, borderRadius: 15, marginBottom: 8, border: `1px solid ${isFriend ? 'oklch(62% 0.18 145/0.3)' : C.border}`, cursor: 'pointer', animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={u.display_name} color={u.color} size={44} />
                    {isFriend && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: C.success, border: `2px solid ${C.surface}` }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{u.display_name}</p>
                      <span style={{ background: C.accentG, color: C.accent, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Lv {u.level}</span>
                      {isFriend && <span style={{ background: 'oklch(62% 0.18 145/0.12)', color: C.success, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Friend</span>}
                    </div>
                    <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{fmtDist(u.distance_m)} · {u.xp} XP</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {!isFriend && <Btn small full={false} variant="ghost" onClick={() => onAddFriend(u)} style={{ paddingLeft: 8, paddingRight: 8 }}><Icon name="userplus" size={13} color={C.muted} /></Btn>}
                    <Btn small full={false} variant={isFriend ? 'subtle' : 'primary'} onClick={() => isFriend ? onOpenChat(u) : onRequestUser(u)} style={{ paddingLeft: 9, paddingRight: 9 }}>
                      {isFriend ? <Icon name="chat" size={13} color={C.accent} /> : <span>👋</span>}
                    </Btn>
                  </div>
                </div>
              );
            })}

            {tab === 'inbox' && (incomingRequests.length === 0 && friendRequests.length === 0
              ? <div style={{ textAlign: 'center', paddingTop: 50 }}><div style={{ fontSize: 34, marginBottom: 8 }}>📭</div><p style={{ color: C.muted, fontSize: 13 }}>No pending requests</p></div>
              : <>
                {friendRequests.length > 0 && <>
                  <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 9, marginTop: 4 }}>Friend Requests</p>
                  {friendRequests.map((req, i) => (
                    <div key={req.id} style={{ background: C.surface, borderRadius: 15, padding: '13px', marginBottom: 8, border: `1.5px solid oklch(62% 0.18 145/0.28)`, animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                      <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 10 }}>
                        <Avatar name={req.display_name} color={req.color} size={42} />
                        <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{req.display_name}</p><p style={{ color: C.muted, fontSize: 12 }}>@{req.username} · Lv {req.level}</p></div>
                        <Icon name="userplus" size={17} color={C.success} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="danger" full={false} style={{ flex: 1 }} small onClick={() => onDeclineFriend(req.id)}><Icon name="x" size={12} color={C.error} />Decline</Btn>
                        <Btn full={false} style={{ flex: 2 }} small onClick={() => onAcceptFriend(req.id)}><Icon name="check" size={12} color="#fff" />Accept +10 XP</Btn>
                      </div>
                    </div>
                  ))}
                </>}
                {incomingRequests.length > 0 && <>
                  <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 9, marginTop: friendRequests.length > 0 ? 12 : 4 }}>LinkUp Requests</p>
                  {incomingRequests.map((req, i) => (
                    <div key={req.id} style={{ background: C.surface, borderRadius: 15, padding: '13px', marginBottom: 8, border: `1.5px solid ${C.accent}44`, animation: `fadeUp 0.3s ease ${i * 0.06}s both` }}>
                      <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: req.message ? 9 : 10 }}>
                        <Avatar name={req.sender_name} color={req.color} size={42} />
                        <div style={{ flex: 1 }}><p style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{req.sender_name}</p><p style={{ color: C.muted, fontSize: 12 }}>{req.distance_m}m away</p></div>
                      </div>
                      {req.message && <p style={{ color: C.muted, fontSize: 12, fontStyle: 'italic', marginBottom: 10 }}>"{req.message}"</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant="danger" full={false} style={{ flex: 1 }} small onClick={() => onDeclineMeetup(req.id)}><Icon name="x" size={12} color={C.error} />Decline</Btn>
                        <Btn full={false} style={{ flex: 2 }} small onClick={() => onAcceptMeetup(req.id)}><Icon name="check" size={12} color="#fff" />Accept +15 XP</Btn>
                      </div>
                    </div>
                  ))}
                </>}
              </>
            )}
          </div>
        </>
      }
      {showCreate && <CreateGroupModal friends={friends} onCreate={g => { onCreateGroup(g); setShowCreate(false); }} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
