export const C = {
  bg:      'oklch(11% 0.015 265)',
  surface: 'oklch(16% 0.018 265)',
  raised:  'oklch(20% 0.02 265)',
  border:  'oklch(25% 0.02 265)',
  accent:  'oklch(62% 0.22 28)',
  accentL: 'oklch(62% 0.22 28/0.15)',
  accentG: 'oklch(62% 0.22 28/0.08)',
  text:    'oklch(95% 0.005 265)',
  muted:   'oklch(52% 0.01 265)',
  error:   'oklch(62% 0.2 15)',
  success: 'oklch(62% 0.18 145)',
  gold:    'oklch(75% 0.18 75)',
  purple:  'oklch(62% 0.18 295)',
  blue:    'oklch(62% 0.18 240)',
};

export function xpForLevel(l) { return Math.floor(100 * Math.pow(l, 1.5)); }
export function levelFromXp(xp) { let l = 1; while (xpForLevel(l + 1) <= xp) l++; return l; }
export function levelProgress(xp) {
  const l = levelFromXp(xp);
  const cur = l === 1 ? 0 : xpForLevel(l);
  const next = xpForLevel(l + 1);
  return { level: l, pct: Math.round((xp - cur) / (next - cur) * 100), into: xp - cur, needed: next - cur };
}
export function fmtDist(m) { return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`; }
export function timeAgo(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
