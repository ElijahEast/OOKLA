import { useState, useEffect } from 'react';
import { C, levelFromXp } from './utils/constants';
import { MOCK_EVENTS, MOCK_QUESTS, NOTIF_TEMPLATES } from './utils/data';

import { BottomNav, XPToast, LevelUpModal, NotifCenter } from './components/ui';
import { UserProfilePage, PinSheet, RequestModal } from './components/UserProfilePage';

import { ExploreScreen } from './screens/ExploreScreen';
import { PeopleScreen } from './screens/PeopleScreen';
import { EventsScreen } from './screens/EventsScreen';
import { ShopScreen } from './screens/ShopScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ChatScreen } from './screens/ChatScreen';
import { GroupChatScreen } from './screens/GroupChatScreen';
import { SafetyHubScreen, BlockReportModal, MeetupSafetyModal } from './screens/SafetyScreen';

const VERSION = '6.0';
const STORAGE_KEY = 'lu5_state';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (s._v !== VERSION) { localStorage.removeItem(STORAGE_KEY); return {}; }
    return s;
  } catch { return {}; }
}

const DEFAULT_USER = {
  displayName: 'You',
  username: 'you',
  bio: 'New to LinkUp!',
  interests: ['Coffee meetups', 'Explore the city'],
};

const DEFAULT_FRIENDS = [
  { id: 2, username: 'jordan_k', display_name: 'Jordan K.', level: 12, xp: 890, bio: 'Skater & photographer.', color: 'oklch(58% 0.16 270)', distance_m: 450, total_meetups: 18, current_streak: 6 },
];

const DEFAULT_INCOMING = [
  { id: 'req-1', sender_name: 'Alex M.', username: 'alex_m', color: 'oklch(58% 0.16 190)', distance_m: 180, message: 'Hey! Want to grab coffee? ☕' },
];

const DEFAULT_FRIEND_REQS = [
  { id: 'fr-1', display_name: 'Jordan K.', username: 'jordan_k', level: 12, color: 'oklch(58% 0.16 270)' },
];

export default function App() {
  const saved = load();
  const user = saved.user || DEFAULT_USER;

  const [tab, setTab] = useState(saved.tab || 'map');
  const [xp, setXp] = useState(saved.xp || 50);
  const [coins, setCoins] = useState(saved.coins || 20);
  const [quests, setQuests] = useState(saved.quests || MOCK_QUESTS);
  const [friends, setFriends] = useState(saved.friends || DEFAULT_FRIENDS);
  const [owned, setOwned] = useState(saved.owned || []);
  const [goldTheme, setGoldTheme] = useState(saved.goldTheme || false);
  const [notifs, setNotifs] = useState(NOTIF_TEMPLATES);
  const [userEvents, setUserEvents] = useState(saved.userEvents || []);
  const [rsvped, setRsvped] = useState(saved.rsvped || []);
  const [groups, setGroups] = useState(saved.groups || []);
  const [groupChat, setGroupChat] = useState(null);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [locationPrecision, setLocationPrecision] = useState('approximate');
  const [blockReportTarget, setBlockReportTarget] = useState(null);
  const [safetyHubOpen, setSafetyHubOpen] = useState(false);
  const [meetupSafetyFor, setMeetupSafetyFor] = useState(null);

  const [xpToasts, setXpToasts] = useState([]);
  const [levelUpModal, setLevelUpModal] = useState(null);
  const [requestModal, setRequestModal] = useState(null);
  const [pinSheet, setPinSheet] = useState(null);
  const [chatWith, setChatWith] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [incomingReqs, setIncomingReqs] = useState(DEFAULT_INCOMING);
  const [friendReqs, setFriendReqs] = useState(DEFAULT_FRIEND_REQS);

  const unreadNotifs = notifs.filter(n => !n.read).length;
  const inboxCount = incomingReqs.length + friendReqs.length;

  function persist(updates) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      _v: VERSION, tab, xp, coins, quests, friends, owned, goldTheme,
      user, userEvents, rsvped, groups, ...updates,
    }));
  }

  function awardXP(amount, awardCoins = 0) {
    const xpAmt = Math.max(0, amount);
    const coinAmt = Math.max(0, awardCoins);
    if (xpAmt === 0 && coinAmt === 0) return;
    const id = Date.now();
    setXpToasts(t => [...t, { id, xp: xpAmt, coins: coinAmt }]);
    setTimeout(() => setXpToasts(t => t.filter(e => e.id !== id)), 2200);
    setXp(prev => {
      const n = Math.max(0, prev + xpAmt);
      if (levelFromXp(n) > levelFromXp(prev)) setTimeout(() => setLevelUpModal(levelFromXp(n)), 400);
      persist({ xp: n });
      return n;
    });
    if (coinAmt > 0) setCoins(prev => { const n = Math.max(0, prev + coinAmt); persist({ coins: n }); return n; });
  }

  function handleSendRequest(target) { setRequestModal(target); }
  function handleRequestSent() {
    setTimeout(() => {
      setRequestModal(null);
      awardXP(5);
      setQuests(q => q.map(qst =>
        qst.key === 'first_linkup'
          ? { ...qst, progress: Math.min((qst.progress || 0) + 1, qst.target), done: (qst.progress || 0) + 1 >= qst.target, claimable: (qst.progress || 0) + 1 >= qst.target && !qst.done }
          : qst
      ));
    }, 700);
  }

  function handleAcceptMeetup(id) { setIncomingReqs(r => r.filter(x => x.id !== id)); awardXP(15, 2); }
  function handleDeclineMeetup(id) { setIncomingReqs(r => r.filter(x => x.id !== id)); }

  function handleAddFriend(target) {
    setTimeout(() => {
      setFriends(prev => {
        if (prev.some(f => f.username === target.username)) return prev;
        const u = [...prev, { ...target, distance_m: target.distance_m || 950 }];
        persist({ friends: u });
        return u;
      });
      awardXP(10);
    }, 700);
  }

  function handleAcceptFriend(id) {
    const req = friendReqs.find(r => r.id === id);
    if (req) {
      setFriends(prev => {
        if (prev.some(f => f.username === req.username)) return prev;
        const u = [...prev, { ...req, distance_m: 450 }];
        persist({ friends: u });
        return u;
      });
      awardXP(10);
    }
    setFriendReqs(r => r.filter(x => x.id !== id));
  }
  function handleDeclineFriend(id) { setFriendReqs(r => r.filter(x => x.id !== id)); }

  function handleBuy(item) {
    if (coins < item.cost) return;
    setCoins(prev => { const n = Math.max(0, prev - item.cost); persist({ coins: n }); return n; });
    setOwned(prev => { const u = [...prev, item.key]; persist({ owned: u }); return u; });
    if (item.key === 'chat_theme') { setGoldTheme(true); persist({ goldTheme: true }); }
    setNotifs(n => [{ id: `n-buy-${Date.now()}`, type: 'shop', icon: '🛍️', title: `Purchased: ${item.name}`, body: `🪙 −${item.cost} coins`, ts: Date.now(), read: false }, ...n]);
  }

  function handleClaimQuest(key) {
    const q = quests.find(x => x.key === key);
    if (q) {
      awardXP(q.xp, q.coins);
      setQuests(qs => qs.map(x => x.key === key ? { ...x, claimable: false } : x));
    }
  }

  function markAllRead() { setNotifs(n => n.map(x => ({ ...x, read: true }))); }
  function openChat(person) { setPinSheet(null); setViewingUser(null); setChatWith(person); }
  function viewProfile(u) { setPinSheet(null); setViewingUser(u); }
  function goTab(t) { setTab(t); persist({ tab: t }); setChatWith(null); setViewingUser(null); setNotifOpen(false); }

  function handleBlock(target) {
    setBlockedUsers(prev => [...prev.filter(u => u.username !== target.username), target]);
    setFriends(prev => prev.filter(f => f.username !== target.username));
    setBlockReportTarget(null);
  }
  function handleReport(target) { handleBlock(target); }
  function handleAddTrusted(contact) { setTrustedContacts(prev => [...prev.filter(c => c.username !== contact.username), contact]); }
  function handleRemoveTrusted(contact) { setTrustedContacts(prev => prev.filter(c => c.username !== contact.username)); }
  function handleUnblock(u) { setBlockedUsers(prev => prev.filter(b => b.username !== u.username)); }

  function handleCreateEvent(ev) {
    setUserEvents(prev => { const n = [ev, ...prev]; persist({ userEvents: n }); return n; });
    awardXP(25, 5);
  }
  function handleRSVP(ev) {
    setRsvped(prev => {
      const has = prev.includes(ev.id);
      const n = has ? prev.filter(x => x !== ev.id) : [...prev, ev.id];
      persist({ rsvped: n });
      return n;
    });
    if (!rsvped.includes(ev.id)) awardXP(5, 0);
  }

  function handleCreateGroup(input) {
    const me = { username: 'you', display_name: 'You', color: C.accent };
    let g;
    if (Array.isArray(input)) {
      const members = [me, ...input.map(f => ({ username: f.username, display_name: f.display_name, color: f.color, level: f.level }))];
      const firstNames = input.slice(0, 3).map(f => f.display_name.split(' ')[0]).join(', ');
      g = { id: `g-${Date.now()}`, name: firstNames + (input.length > 3 ? ` +${input.length - 3}` : ''), emoji: '👥', members, verified: false, createdAt: Date.now() };
    } else {
      const picked = friends.filter(f => input.memberUsernames.includes(f.username));
      const members = [me, ...picked.map(f => ({ username: f.username, display_name: f.display_name, color: f.color, level: f.level }))];
      g = { id: `g-${Date.now()}`, name: input.name, emoji: input.emoji || '👥', members, verified: false, createdAt: Date.now() };
    }
    setGroups(prev => { const n = [g, ...prev]; persist({ groups: n }); return n; });
    awardXP(5);
    setNotifs(n => [{ id: `n-g-${Date.now()}`, type: 'group', icon: g.emoji, title: `Group created: ${g.name}`, body: `${g.members.length} members`, ts: Date.now(), read: false }, ...n]);
    setTab('people'); persist({ tab: 'people' });
    setTimeout(() => setGroupChat(g), 250);
  }

  function handleOpenGroup(g) { setGroupChat(g); }
  function handleGroupMeetupVerified(g) {
    setGroups(prev => { const n = prev.map(x => x.id === g.id ? { ...x, verified: true } : x); persist({ groups: n }); return n; });
    awardXP(100, 15);
  }
  function handleLeaveGroup(g) {
    setGroups(prev => { const n = prev.filter(x => x.id !== g.id); persist({ groups: n }); return n; });
    setGroupChat(null);
  }

  if (groupChat) {
    return (
      <Wrap>
        <GroupChatScreen
          group={groups.find(g => g.id === groupChat.id) || groupChat}
          me={{ username: 'you', display_name: 'You' }}
          goldTheme={goldTheme}
          onBack={() => setGroupChat(null)}
          onMeetupVerified={handleGroupMeetupVerified}
          onLeave={handleLeaveGroup}
        />
        <XPToast events={xpToasts} />
        {levelUpModal && <LevelUpModal level={levelUpModal} onDismiss={() => setLevelUpModal(null)} />}
      </Wrap>
    );
  }

  if (chatWith) {
    return (
      <Wrap>
        <ChatScreen
          partner={chatWith}
          goldTheme={goldTheme}
          onBack={() => setChatWith(null)}
          onMeetupVerified={() => awardXP(50, 5)}
          onOpenSafety={() => setMeetupSafetyFor(chatWith)}
        />
        <XPToast events={xpToasts} />
        {meetupSafetyFor && (
          <MeetupSafetyModal
            partner={meetupSafetyFor}
            trustedContacts={trustedContacts}
            onStart={() => {}}
            onClose={() => setMeetupSafetyFor(null)}
          />
        )}
      </Wrap>
    );
  }

  const screens = {
    map: (
      <ExploreScreen
        user={user} xp={xp} friends={friends} blockedUsers={blockedUsers}
        onPinSelect={p => setPinSheet(p)}
        incomingRequests={incomingReqs}
        onAccept={handleAcceptMeetup}
        onDecline={handleDeclineMeetup}
        unreadNotifs={unreadNotifs}
        onOpenNotifs={() => setNotifOpen(true)}
        onAddFriend={handleAddFriend}
        onOpenChat={openChat}
        onViewProfile={viewProfile}
        onCreateGroup={handleCreateGroup}
      />
    ),
    people: (
      <PeopleScreen
        friends={friends} groups={groups}
        incomingRequests={incomingReqs} friendRequests={friendReqs}
        onRequestUser={handleSendRequest}
        onAddFriend={handleAddFriend}
        onAcceptMeetup={handleAcceptMeetup}
        onDeclineMeetup={handleDeclineMeetup}
        onAcceptFriend={handleAcceptFriend}
        onDeclineFriend={handleDeclineFriend}
        onOpenChat={openChat}
        onViewProfile={viewProfile}
        onOpenGroup={handleOpenGroup}
        onCreateGroup={handleCreateGroup}
      />
    ),
    events: (
      <EventsScreen
        events={MOCK_EVENTS} userEvents={userEvents}
        ownedBoosts={owned} rsvped={rsvped}
        onCreate={handleCreateEvent} onRSVP={handleRSVP}
      />
    ),
    shop: (
      <ShopScreen
        coins={coins} owned={owned}
        onBuy={handleBuy} quests={quests} onClaim={handleClaimQuest}
      />
    ),
    profile: (
      <ProfileScreen
        user={user} xp={xp} coins={coins}
        quests={quests} friends={friends}
        onOpenSafety={() => setSafetyHubOpen(true)}
      />
    ),
  };

  return (
    <Wrap>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {screens[tab] || screens.map}
          <XPToast events={xpToasts} />
          {levelUpModal && <LevelUpModal level={levelUpModal} onDismiss={() => setLevelUpModal(null)} />}
          {requestModal && <RequestModal target={requestModal} onSend={handleRequestSent} onClose={() => setRequestModal(null)} />}
          {pinSheet && (
            <PinSheet
              pin={pinSheet}
              isFriend={friends.some(f => f.username === pinSheet.username)}
              onClose={() => setPinSheet(null)}
              onSendRequest={t => { setPinSheet(null); setRequestModal(t); }}
              onAddFriend={t => { setPinSheet(null); handleAddFriend(t); }}
              onOpenChat={openChat}
              onViewProfile={viewProfile}
              onBlockReport={u => setBlockReportTarget(u)}
            />
          )}
          {viewingUser && (
            <UserProfilePage
              user={viewingUser}
              isFriend={friends.some(f => f.username === viewingUser.username)}
              isBlocked={blockedUsers.some(b => b.username === viewingUser.username)}
              onBack={() => setViewingUser(null)}
              onAddFriend={handleAddFriend}
              onSendRequest={t => { setViewingUser(null); setRequestModal(t); }}
              onOpenChat={openChat}
              onBlockReport={u => setBlockReportTarget(u)}
              onUnblock={u => { handleUnblock(u); setViewingUser(null); }}
            />
          )}
          {notifOpen && <NotifCenter notifs={notifs} onClose={() => setNotifOpen(false)} onMarkAll={markAllRead} />}
        </div>
        {safetyHubOpen && (
          <SafetyHubScreen
            friends={friends} blockedUsers={blockedUsers}
            trustedContacts={trustedContacts} locationPrecision={locationPrecision}
            onBack={() => setSafetyHubOpen(false)}
            onSetPrecision={setLocationPrecision}
            onAddTrusted={handleAddTrusted}
            onRemoveTrusted={handleRemoveTrusted}
            onUnblock={handleUnblock}
          />
        )}
        {blockReportTarget && (
          <BlockReportModal
            target={blockReportTarget}
            onBlock={handleBlock}
            onReport={handleReport}
            onClose={() => setBlockReportTarget(null)}
          />
        )}
        <BottomNav active={tab} onTab={goTab} inboxCount={inboxCount} />
      </div>
    </Wrap>
  );
}

function Wrap({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'oklch(14% 0.02 265)' }}>
      <div className="phone">{children}</div>
    </div>
  );
}
