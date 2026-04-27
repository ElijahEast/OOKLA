const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('lu_access_token');
}

async function req(method, path, body) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  signup: (d) => req('POST', '/api/auth/signup', d),
  login: (d) => req('POST', '/api/auth/login', d),
  me: () => req('GET', '/api/auth/me'),
  refresh: (token) => req('POST', '/api/auth/refresh', { refreshToken: token }),
  logout: (token) => req('POST', '/api/auth/logout', { refreshToken: token }),
};

// ── Groups ────────────────────────────────────────────────────────────────────
export const groups = {
  list: () => req('GET', '/api/groups'),
  create: (d) => req('POST', '/api/groups', d),
  messages: (id, opts = {}) => req('GET', `/api/groups/${id}/messages?limit=${opts.limit || 50}${opts.before ? `&before=${opts.before}` : ''}`),
  send: (id, body) => req('POST', `/api/groups/${id}/messages`, { body }),
  verify: (id) => req('POST', `/api/groups/${id}/verify`),
  leave: (id) => req('DELETE', `/api/groups/${id}`),
};

// ── Friends ───────────────────────────────────────────────────────────────────
export const friends = {
  list: () => req('GET', '/api/friends'),
  pending: () => req('GET', '/api/friends/pending'),
  request: (userId) => req('POST', '/api/friends/request', { addressee_id: userId }),
  respond: (id, status) => req('PATCH', `/api/friends/${id}/respond`, { status }),
};

// ── Nearby ────────────────────────────────────────────────────────────────────
export const nearby = {
  fetch: (radius = 1000) => req('GET', `/api/nearby?radius=${radius}`),
};

// ── Profiles ──────────────────────────────────────────────────────────────────
export const profiles = {
  me: () => req('GET', '/api/profiles/me'),
  update: (d) => req('PATCH', '/api/profiles/me', d),
  get: (username) => req('GET', `/api/profiles/${username}`),
  updateLocation: (lat, lng) => req('POST', '/api/profiles/me/location', { lat, lng }),
};

// ── Meetups ───────────────────────────────────────────────────────────────────
export const meetups = {
  request: (d) => req('POST', '/api/meetups/request', d),
  respond: (id, status) => req('PATCH', `/api/meetups/${id}/respond`, { status }),
  complete: (id) => req('POST', `/api/meetups/${id}/complete`),
  inbox: () => req('GET', '/api/meetups/inbox'),
};

// ── Shop ──────────────────────────────────────────────────────────────────────
export const shop = {
  items: () => req('GET', '/api/shop'),
  buy: (itemId) => req('POST', '/api/shop/buy', { item_id: itemId }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifications = {
  list: () => req('GET', '/api/notifications'),
  markAllRead: () => req('PATCH', '/api/notifications/read-all'),
};

// ── Safety ────────────────────────────────────────────────────────────────────
export const safety = {
  block: (userId) => req('POST', '/api/safety/block', { blocked_user_id: userId }),
  unblock: (userId) => req('DELETE', `/api/safety/block/${userId}`),
  report: (d) => req('POST', '/api/safety/report', d),
  trustedContacts: () => req('GET', '/api/safety/trusted'),
  addTrusted: (userId) => req('POST', '/api/safety/trusted', { contact_id: userId }),
  removeTrusted: (userId) => req('DELETE', `/api/safety/trusted/${userId}`),
};
