export const ALL_USERS = [
  { id: 1, username: 'alex_m',   display_name: 'Alex M.',   distance_m: 180,  level: 7,  xp: 340,  bio: 'Coffee addict. Always down for spontaneous meetups.',       color: 'oklch(58% 0.16 190)', total_meetups: 8,  current_streak: 2  },
  { id: 2, username: 'jordan_k', display_name: 'Jordan K.', distance_m: 450,  level: 12, xp: 890,  bio: 'Skater & photographer.',                                    color: 'oklch(58% 0.16 270)', total_meetups: 18, current_streak: 6  },
  { id: 3, username: 'sam_r',    display_name: 'Sam R.',    distance_m: 820,  level: 3,  xp: 120,  bio: 'New to the city, looking to explore!',                      color: 'oklch(58% 0.16 140)', total_meetups: 2,  current_streak: 1  },
  { id: 4, username: 'maya_v',   display_name: 'Maya V.',   distance_m: 1200, level: 21, xp: 2400, bio: 'Top 100 explorer. Meetup streak: 14 days 🔥',               color: 'oklch(58% 0.16 50)',  total_meetups: 47, current_streak: 14 },
  { id: 5, username: 'chris_b',  display_name: 'Chris B.',  distance_m: 950,  level: 9,  xp: 660,  bio: "Musician. Let's jam or just vibe.",                         color: 'oklch(58% 0.16 330)', total_meetups: 12, current_streak: 3  },
];

export const MOCK_SHOP = [
  { key: 'profile_boost',  name: 'Profile Boost',   desc: 'Show up first in nearby lists for 24h',           cost: 50,  dur: '24h', emoji: '🚀', category: 'boost'     },
  { key: 'stealth_mode',   name: 'Stealth Mode',    desc: 'Browse the map invisibly for 1 hour',             cost: 30,  dur: '1h',  emoji: '👻', category: 'boost'     },
  { key: 'xp_multiplier',  name: 'XP Multiplier',   desc: '2× XP on all meetups for 24h',                    cost: 100, dur: '24h', emoji: '⚡', category: 'boost'     },
  { key: 'event_radius',   name: 'Event Megaphone', desc: 'Extend your event reach from 5km → 15km for 48h', cost: 120, dur: '48h', emoji: '📣', category: 'boost'     },
  { key: 'explorer_badge', name: 'Explorer Badge',  desc: 'Exclusive gold explorer badge',                   cost: 150, dur: null,  emoji: '🏅', category: 'cosmetic'  },
  { key: 'flame_badge',    name: 'Flame Badge',     desc: 'Rare flame badge for streak masters',             cost: 200, dur: null,  emoji: '🔥', category: 'cosmetic'  },
  { key: 'chat_theme',     name: 'Gold Chat Theme', desc: 'Gold chat bubble theme',                          cost: 75,  dur: null,  emoji: '✨', category: 'cosmetic'  },
];

export const MOCK_EVENTS = [
  { id: 'e1', host: 'Blue Bottle Coffee', hostType: 'business', verified: true,  title: '☕ Free Latte Friday',       desc: 'Show this screen for a free latte 2–5pm. First 50 only.', emoji: '☕', color: 'oklch(62% 0.18 55)',  distance_m: 320,  radius_km: 5,  starts: 'Fri 2:00 PM',  attendees: 42, capacity: 50, tag: 'Promo'  },
  { id: 'e2', host: 'maya_v',              hostType: 'person',   verified: false, title: 'Sunset run @ the pier',     desc: 'Easy 5k pace, chill vibes. Meet at the fountain.',        emoji: '🏃', color: 'oklch(58% 0.16 270)', distance_m: 850,  radius_km: 5,  starts: 'Today 6:30 PM',attendees: 7,  capacity: 15, tag: 'Meetup' },
  { id: 'e3', host: 'Mission Skate Park',  hostType: 'business', verified: true,  title: '🛹 Open deck session',      desc: 'Beginners welcome. Rentals available at the shed.',       emoji: '🛹', color: 'oklch(62% 0.18 25)',  distance_m: 1800, radius_km: 5,  starts: 'Sat 11:00 AM', attendees: 28, capacity: 60, tag: 'Event'  },
  { id: 'e4', host: 'jordan_k',            hostType: 'person',   verified: false, title: '📷 Photo walk — Chinatown', desc: 'Golden hour street photography. All gear welcome.',       emoji: '📷', color: 'oklch(58% 0.16 330)', distance_m: 2400, radius_km: 15, starts: 'Sun 5:00 PM',  attendees: 4,  capacity: 10, tag: 'Meetup', boosted: true },
  { id: 'e5', host: 'Ritual Roasters',     hostType: 'business', verified: true,  title: 'Latte art throwdown',       desc: 'Compete or spectate. Winner takes home $200.',            emoji: '🏆', color: 'oklch(62% 0.18 145)', distance_m: 3100, radius_km: 5,  starts: 'Sat 7:00 PM',  attendees: 64, capacity: 80, tag: 'Event'  },
  { id: 'e6', host: 'chris_b',             hostType: 'person',   verified: false, title: 'Board game night',          desc: 'Catan, Codenames, whatever you bring. BYO snacks.',      emoji: '🎲', color: 'oklch(58% 0.16 190)', distance_m: 4600, radius_km: 5,  starts: 'Thu 8:00 PM',  attendees: 5,  capacity: 12, tag: 'Meetup' },
];

export const LEADERBOARD = [
  { rank: 1, username: 'maya_v',   display_name: 'Maya V.',   xp: 2400, level: 21, total_meetups: 47, current_streak: 14, color: 'oklch(58% 0.16 50)'  },
  { rank: 2, username: 'jordan_k', display_name: 'Jordan K.', xp: 890,  level: 12, total_meetups: 18, current_streak: 6,  color: 'oklch(58% 0.16 270)' },
  { rank: 3, username: 'chris_b',  display_name: 'Chris B.',  xp: 660,  level: 9,  total_meetups: 12, current_streak: 3,  color: 'oklch(58% 0.16 330)' },
  { rank: 4, username: 'alex_m',   display_name: 'Alex M.',   xp: 340,  level: 7,  total_meetups: 8,  current_streak: 2,  color: 'oklch(58% 0.16 190)' },
  { rank: 5, username: 'sam_r',    display_name: 'Sam R.',    xp: 120,  level: 3,  total_meetups: 2,  current_streak: 1,  color: 'oklch(58% 0.16 140)' },
];

export const MOCK_QUESTS = [
  { key: 'first_linkup',  title: 'First LinkUp',    desc: 'Send your first meetup request',       xp: 50,  coins: 5,  target: 1, progress: 0, done: false, emoji: '👋', reset: 'once'   },
  { key: 'daily_explore', title: 'Daily Explorer',  desc: 'Open the map today',                   xp: 10,  coins: 0,  target: 1, progress: 1, done: true,  emoji: '🗺️', reset: 'daily'  },
  { key: 'daily_request', title: 'Social Butterfly',desc: 'Send 3 meetup requests today',         xp: 30,  coins: 3,  target: 3, progress: 1, done: false, emoji: '🦋', reset: 'daily'  },
  { key: 'weekly_meetups',title: 'Connector',       desc: 'Complete 5 meetups this week',         xp: 200, coins: 20, target: 5, progress: 0, done: false, emoji: '🤝', reset: 'weekly' },
  { key: 'streak_3',      title: '3-Day Streak',    desc: 'Use LinkUp 3 days in a row',           xp: 40,  coins: 5,  target: 3, progress: 1, done: false, emoji: '🔥', reset: 'once'   },
  { key: 'first_meetup',  title: 'First Meetup',    desc: 'Complete your first real-world meetup',xp: 100, coins: 10, target: 1, progress: 0, done: false, emoji: '🎯', reset: 'once'   },
];

export const NOTIF_TEMPLATES = [
  { id: 'n1', type: 'friend_request', icon: '👋', title: 'Alex M. sent you a friend request',  body: 'Tap to view their profile',        ts: Date.now() - 120000,   read: false },
  { id: 'n2', type: 'xp_earned',      icon: '⚡', title: 'You earned 15 XP!',                  body: 'For accepting a LinkUp request',   ts: Date.now() - 3600000,  read: false },
  { id: 'n3', type: 'quest_done',     icon: '🎯', title: 'Quest complete: Daily Explorer',     body: 'Claim your 10 XP reward',          ts: Date.now() - 7200000,  read: true  },
  { id: 'n4', type: 'level_up',       icon: '🎉', title: 'You reached Level 2!',               body: 'New shop items unlocked',          ts: Date.now() - 86400000, read: true  },
  { id: 'n5', type: 'nearby',         icon: '📍', title: 'Jordan K. is 450m away',             body: 'Send a LinkUp request?',           ts: Date.now() - 172800000,read: true  },
];

// Social graph data — friend-of-friend connections
export const SOCIAL_GRAPH = {
  jordan_k: [
    { username: 'maya_v',   display_name: 'Maya V.',   color: 'oklch(58% 0.16 50)',  level: 21 },
    { username: 'chris_b',  display_name: 'Chris B.',  color: 'oklch(58% 0.16 330)', level: 9  },
    { username: 'priya_s',  display_name: 'Priya S.',  color: 'oklch(58% 0.16 140)', level: 6  },
    { username: 'kai_t',    display_name: 'Kai T.',    color: 'oklch(58% 0.16 200)', level: 4  },
  ],
  maya_v: [
    { username: 'sam_r',    display_name: 'Sam R.',    color: 'oklch(58% 0.16 140)', level: 3  },
    { username: 'devon_c',  display_name: 'Devon C.',  color: 'oklch(58% 0.16 290)', level: 8  },
    { username: 'taylor_b', display_name: 'Taylor B.', color: 'oklch(58% 0.16 20)',  level: 5  },
  ],
  chris_b: [
    { username: 'alex_m',   display_name: 'Alex M.',   color: 'oklch(58% 0.16 190)', level: 7  },
    { username: 'omar_d',   display_name: 'Omar D.',   color: 'oklch(58% 0.16 70)',  level: 11 },
    { username: 'sasha_m',  display_name: 'Sasha M.',  color: 'oklch(58% 0.16 250)', level: 3  },
  ],
  priya_s: [
    { username: 'kai_t',    display_name: 'Kai T.',    color: 'oklch(58% 0.16 200)', level: 4  },
    { username: 'nina_p',   display_name: 'Nina P.',   color: 'oklch(58% 0.16 160)', level: 7  },
  ],
};

// Fallback pool for procedural FOF generation
export const FALLBACK_POOL = [
  { username: 'riley_a',  display_name: 'Riley A.',  color: 'oklch(58% 0.16 100)', level: 5  },
  { username: 'finn_w',   display_name: 'Finn W.',   color: 'oklch(58% 0.16 210)', level: 8  },
  { username: 'jade_l',   display_name: 'Jade L.',   color: 'oklch(58% 0.16 310)', level: 3  },
  { username: 'noah_c',   display_name: 'Noah C.',   color: 'oklch(58% 0.16 40)',  level: 6  },
  { username: 'zoe_m',    display_name: 'Zoe M.',    color: 'oklch(58% 0.16 170)', level: 9  },
  { username: 'leo_b',    display_name: 'Leo B.',    color: 'oklch(58% 0.16 260)', level: 4  },
  { username: 'aria_p',   display_name: 'Aria P.',   color: 'oklch(58% 0.16 340)', level: 7  },
  { username: 'cole_s',   display_name: 'Cole S.',   color: 'oklch(58% 0.16 80)',  level: 2  },
  { username: 'mia_r',    display_name: 'Mia R.',    color: 'oklch(58% 0.16 230)', level: 11 },
  { username: 'evan_t',   display_name: 'Evan T.',   color: 'oklch(58% 0.16 130)', level: 5  },
  { username: 'ivy_k',    display_name: 'Ivy K.',    color: 'oklch(58% 0.16 190)', level: 8  },
  { username: 'max_j',    display_name: 'Max J.',    color: 'oklch(58% 0.16 290)', level: 3  },
];

export function getSocial(username) {
  if (SOCIAL_GRAPH[username]) return SOCIAL_GRAPH[username];
  // Deterministic fallback
  const hash = username.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const count = 2 + (hash % 2);
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(FALLBACK_POOL[(hash + i * 7) % FALLBACK_POOL.length]);
  }
  return result;
}

export const GROUP_EMOJIS = ['👥', '🎉', '🍕', '☕', '🎮', '🏃', '🎨', '📚', '🍻', '🏀', '🎵', '🌮'];
