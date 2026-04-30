import React, { useState, useEffect, useRef, Component } from 'react';
import { C, levelFromXp } from '../utils/constants';
import { Icon, Btn, StatusBar } from '../components/ui';
import { getSocial } from '../utils/data';

class GraphErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 44, opacity: 0.25 }}>🕸️</div>
          <p style={{ color: C.muted, fontSize: 14, fontWeight: 700 }}>Graph unavailable</p>
          <button onClick={() => { this.setState({ error: false }); }} style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function NetworkGraph(props) {
  return <GraphErrorBoundary><NetworkGraphInner {...props} /></GraphErrorBoundary>;
}

function NetworkGraphInner({ user, friends, blockedUsers, onAddFriend, onOpenChat, onViewProfile, onCreateGroup, embedded }) {
  const containerRef = useRef(null);
  const [tf, setTf] = useState({ x: 195, y: 310, scale: 1 });
  const [selected, setSelected] = useState(null);
  const [graphFriends, setGraphFriends] = useState(friends);
  const [pending, setPending] = useState({});
  const [multiMode, setMultiMode] = useState(false);
  const [multiSel, setMultiSel] = useState(new Set());

  // Persist positions and parent links in localStorage so they survive tab switches
  const posRef = useRef(null);
  if (!posRef.current) {
    try { posRef.current = JSON.parse(localStorage.getItem('lu_graph_pos') || '{"__me":{"x":0,"y":0}}'); }
    catch { posRef.current = { '__me': { x: 0, y: 0 } }; }
  }
  const friendParentRef = useRef(null);
  if (!friendParentRef.current) {
    try { friendParentRef.current = JSON.parse(localStorage.getItem('lu_graph_parents') || '{}'); }
    catch { friendParentRef.current = {}; }
  }

  useEffect(() => {
    setGraphFriends(prev => {
      const merged = [...friends];
      prev.forEach(p => { if (!merged.find(m => m.username === p.username)) merged.push(p); });
      return merged;
    });
  }, [friends]);

  function assignPos(username, x, y) {
    if (!posRef.current[username]) {
      posRef.current[username] = { x, y };
      try { localStorage.setItem('lu_graph_pos', JSON.stringify(posRef.current)); } catch {}
    }
    return posRef.current[username];
  }

  function setParent(username, parent) {
    friendParentRef.current[username] = parent;
    try { localStorage.setItem('lu_graph_parents', JSON.stringify(friendParentRef.current)); } catch {}
  }

  function buildGraph() {
    try {
    const ns = [], es = [];
    ns.push({ id: '__me', label: user.display_name || user.displayName || 'You', color: C.accent, level: levelFromXp(0), r: 30, x: 0, y: 0, kind: 'me' });

    const allFriends = graphFriends.filter(f => !blockedUsers.some(b => b.username === f.username));
    const rootFriends = allFriends.filter(f => !friendParentRef.current[f.username]);
    const derivedFriends = allFriends.filter(f => friendParentRef.current[f.username]);
    const count = rootFriends.length || 1;
    const R1 = Math.max(110, count * 28);

    rootFriends.forEach((f, i) => {
      const angle = (2 * Math.PI * i / count) - (Math.PI / 2);
      const pos = assignPos(f.username, R1 * Math.cos(angle), R1 * Math.sin(angle));
      ns.push({ id: f.username, label: f.display_name || f.username || '?', color: f.color, level: f.level, r: 22, x: pos.x, y: pos.y, kind: 'friend', data: f, angle });
      es.push({ from: '__me', to: f.username, strength: 'strong' });
    });

    derivedFriends.forEach(f => {
      const pos = posRef.current[f.username];
      if (!pos) return;
      ns.push({ id: f.username, label: f.display_name || f.username || '?', color: f.color, level: f.level, r: 20, x: pos.x, y: pos.y, kind: 'friend', data: f });
      const parent = friendParentRef.current[f.username];
      es.push({ from: parent, to: f.username, strength: 'strong' });
    });

    ns.filter(n => n.kind === 'friend').forEach(fn => {
      const f = fn.data;
      const baseAngle = Math.atan2(fn.y, fn.x);
      const fofs = (getSocial(f.username) || []).filter(ff =>
        !allFriends.some(m => m.username === ff.username) &&
        !blockedUsers.some(b => b.username === ff.username)
      ).slice(0, 3);

      fofs.forEach((ff, j) => {
        if (ns.find(n => n.id === ff.username)) return;
        const spread = fofs.length === 1 ? 0 : 0.55;
        const fofAngle = baseAngle + (j - (fofs.length - 1) / 2) * spread;
        const R2 = Math.hypot(fn.x, fn.y) + 110;
        const pos = assignPos(ff.username, R2 * Math.cos(fofAngle), R2 * Math.sin(fofAngle));
        ns.push({ id: ff.username, label: ff.display_name || ff.username || '?', color: ff.color, level: ff.level, r: 18, x: pos.x, y: pos.y, kind: 'fof', data: ff, parent: f.username, angle: fofAngle });
        es.push({ from: f.username, to: ff.username, strength: 'weak' });

        if (pending[ff.username]) {
          const fofFofs = (getSocial(ff.username) || []).filter(fff =>
            !allFriends.some(m => m.username === fff.username) &&
            !ns.find(n => n.id === fff.username)
          ).slice(0, 2);
          fofFofs.forEach((fff, k) => {
            const a3 = fofAngle + (k === 0 ? -0.4 : 0.4);
            const R3 = R2 + 90;
            if (!ns.find(n => n.id === fff.username)) {
              const p3 = assignPos(fff.username, R3 * Math.cos(a3), R3 * Math.sin(a3));
              ns.push({ id: fff.username, label: fff.display_name || fff.username || '?', color: fff.color, level: fff.level, r: 14, x: p3.x, y: p3.y, kind: 'fof2', data: fff, parent: ff.username });
              es.push({ from: ff.username, to: fff.username, strength: 'vweak' });
            }
          });
        }
      });
    });
    return { nodes: ns, edges: es };
    } catch (e) {
      console.error('buildGraph error:', e);
      return { nodes: [{ id: '__me', label: 'You', color: C.accent, level: 1, r: 30, x: 0, y: 0, kind: 'me' }], edges: [] };
    }
  }

  const { nodes, edges } = buildGraph();

  const pointerRef = useRef(null);
  const pinchRef = useRef(null);
  const touchesRef = useRef({});

  function onPointerDown(e) {
    let el = e.target;
    while (el && el !== e.currentTarget) {
      if (el.getAttribute && el.getAttribute('data-node')) return;
      el = el.parentNode;
    }
    pointerRef.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, tfX: tf.x, tfY: tf.y, moved: false };
  }

  function onPointerMove(e) {
    if (!pointerRef.current || pointerRef.current.id !== e.pointerId) return;
    const dx = e.clientX - pointerRef.current.startX;
    const dy = e.clientY - pointerRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pointerRef.current.moved = true;
    setTf(t => ({ ...t, x: pointerRef.current.tfX + dx, y: pointerRef.current.tfY + dy }));
  }

  function onPointerUp(e) {
    if (pointerRef.current?.id === e.pointerId) pointerRef.current = null;
  }

  function onTouchStart(e) {
    [...e.changedTouches].forEach(t => { touchesRef.current[t.identifier] = { x: t.clientX, y: t.clientY }; });
    if (Object.keys(touchesRef.current).length === 2) {
      const pts = Object.values(touchesRef.current);
      pinchRef.current = {
        dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
        scale: tf.scale, tfX: tf.x, tfY: tf.y,
        mx: (pts[0].x + pts[1].x) / 2 - (containerRef.current?.getBoundingClientRect().left || 0),
        my: (pts[0].y + pts[1].y) / 2 - (containerRef.current?.getBoundingClientRect().top || 0),
      };
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    [...e.changedTouches].forEach(t => { touchesRef.current[t.identifier] = { x: t.clientX, y: t.clientY }; });
    const pts = Object.values(touchesRef.current);
    if (pts.length === 2 && pinchRef.current) {
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const ratio = newDist / pinchRef.current.dist;
      const ns = Math.min(3, Math.max(0.3, pinchRef.current.scale * ratio));
      const { mx, my } = pinchRef.current;
      setTf({
        scale: ns,
        x: mx - (mx - pinchRef.current.tfX) * (ns / pinchRef.current.scale),
        y: my - (my - pinchRef.current.tfY) * (ns / pinchRef.current.scale),
      });
    }
  }

  function onTouchEnd(e) {
    [...e.changedTouches].forEach(t => { delete touchesRef.current[t.identifier]; });
    if (Object.keys(touchesRef.current).length < 2) pinchRef.current = null;
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    setTf(t => {
      const ns = Math.min(3, Math.max(0.3, t.scale + delta));
      const ratio = ns / t.scale;
      return { scale: ns, x: mx - (mx - t.x) * ratio, y: my - (my - t.y) * ratio };
    });
  }

  function zoomBtn(dir) {
    const W = containerRef.current?.clientWidth || 390;
    const H = containerRef.current?.clientHeight || 500;
    const mx = W / 2, my = H / 2;
    setTf(t => {
      const ns = Math.min(3, Math.max(0.3, t.scale + dir * 0.25));
      const ratio = ns / t.scale;
      return { scale: ns, x: mx - (mx - t.x) * ratio, y: my - (my - t.y) * ratio };
    });
  }

  function handleAdd(nodeData) {
    setPending(p => ({ ...p, [nodeData.username]: true }));
    setSelected(null);
    const fofNode = nodes.find(n => n.id === nodeData.username);
    if (fofNode && fofNode.parent) {
      setParent(nodeData.username, fofNode.parent);
    }
    setTimeout(() => {
      setGraphFriends(prev => [...prev, { ...nodeData, distance_m: 600 }]);
      onAddFriend && onAddFriend(nodeData);
    }, 800);
  }

  function toggleMulti() {
    setMultiMode(m => { if (m) { setMultiSel(new Set()); } return !m; });
    setSelected(null);
  }

  function toggleNodeSel(username) {
    setMultiSel(prev => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username); else next.add(username);
      return next;
    });
  }

  function createGroupFromSelection() {
    const picked = [...multiSel].map(u => graphFriends.find(f => f.username === u)).filter(Boolean);
    if (picked.length < 2) return;
    onCreateGroup && onCreateGroup(picked);
    setMultiMode(false);
    setMultiSel(new Set());
  }

  const selNode = selected ? nodes.find(n => n.id === selected) : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!embedded && <StatusBar />}
      {!embedded && (
        <div style={{ padding: '10px 18px 5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ color: C.text, fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>Social Graph</h2>
            <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>Tap nodes · Pinch/scroll to zoom · Drag to pan</p>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => zoomBtn(1)} style={{ width: 32, height: 32, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text, fontSize: 19, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <button onClick={() => zoomBtn(-1)} style={{ width: 32, height: 32, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text, fontSize: 19, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <button onClick={() => setTf({ x: 195, y: 310, scale: 1 })} style={{ width: 32, height: 32, borderRadius: 9, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.muted, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌂</button>
          </div>
        </div>
      )}
      {embedded && (
        <div style={{ padding: '6px 18px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 8 }}>
          <p style={{ color: multiMode ? C.accent : C.muted, fontSize: 11, fontWeight: multiMode ? 700 : 400, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {multiMode ? `Select friends · ${multiSel.size} picked` : 'Tap nodes · Drag to pan · Scroll to zoom'}
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={toggleMulti} style={{ height: 28, padding: '0 9px', borderRadius: 8, background: multiMode ? C.accent : C.surface, border: `1px solid ${multiMode ? C.accent : C.border}`, cursor: 'pointer', color: multiMode ? '#fff' : C.muted, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              {multiMode ? '✓ Done' : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="9" cy="8" r="3.3" /><circle cx="17" cy="9" r="2.6" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M14 18c0-2 2-3.5 4.2-3.5s3.8 1.5 3.8 3.5" /></svg>
                  Group
                </>
              )}
            </button>
            <button onClick={() => zoomBtn(1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <button onClick={() => zoomBtn(-1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.text, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <button onClick={() => setTf({ x: 195, y: 310, scale: 1 })} style={{ width: 28, height: 28, borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⌂</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, padding: '0 18px 6px', flexShrink: 0 }}>
        {[{ c: C.accent, l: 'You' }, { c: 'oklch(58% 0.16 270)', l: 'Friends' }, { c: `${C.muted}88`, l: 'Connect' }, { c: `${C.muted}44`, l: 'Explore' }].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.c }} />
            <span style={{ color: C.muted, fontSize: 10, fontWeight: 600 }}>{item.l}</span>
          </div>
        ))}
      </div>

      <div ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: pointerRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onWheel={onWheel}>

        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g transform={`translate(${tf.x},${tf.y}) scale(${tf.scale})`}>
            {edges.map((e, i) => {
              const f = nodes.find(n => n.id === e.from), t = nodes.find(n => n.id === e.to);
              if (!f || !t) return null;
              const sw = e.strength === 'strong' ? 2 : 1;
              const op = e.strength === 'strong' ? 0.5 : e.strength === 'weak' ? 0.25 : 0.12;
              const sc = e.strength === 'strong' ? C.accent : C.muted;
              const sd = e.strength === 'weak' ? '6 4' : e.strength === 'vweak' ? '3 5' : undefined;
              return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={sc} strokeWidth={sw} strokeDasharray={sd} opacity={op} />;
            })}
            {nodes.map(n => {
              const isSel = selected === n.id;
              const isFriendNode = n.kind === 'friend';
              const isPend = pending[n.id];
              const isMultiSel = multiSel.has(n.id);
              const multiEligible = isFriendNode;
              const dim = multiMode && !multiEligible && n.kind !== 'me';
              return (
                <g key={n.id} data-node="1" opacity={dim ? 0.35 : 1}
                  onClick={e => {
                    e.stopPropagation();
                    if (pointerRef.current?.moved) return;
                    if (multiMode) {
                      if (multiEligible) toggleNodeSel(n.id);
                      return;
                    }
                    setSelected(isSel ? null : n.id);
                  }}
                  style={{ cursor: multiMode && !multiEligible && n.kind !== 'me' ? 'not-allowed' : 'pointer', pointerEvents: 'auto', transition: 'opacity 0.2s' }}>
                  {(n.kind === 'fof' || n.kind === 'fof2') && !isPend && !multiMode &&
                    <circle cx={n.x} cy={n.y} r={n.r + 8} fill="none" stroke={C.accent} strokeWidth="1" opacity="0.15"
                      style={{ animation: 'ping 2s ease-in-out infinite' }} />}
                  {isSel && !multiMode && <circle cx={n.x} cy={n.y} r={n.r + 6} fill="none" stroke={C.accent} strokeWidth="1.5" opacity="0.7" />}
                  {isMultiSel && <>
                    <circle cx={n.x} cy={n.y} r={n.r + 7} fill="none" stroke={C.accent} strokeWidth="2.5" />
                    <circle cx={n.x} cy={n.y} r={n.r + 11} fill="none" stroke={C.accent} strokeWidth="1" opacity="0.35" />
                  </>}
                  <circle cx={n.x} cy={n.y} r={n.r}
                    fill={n.kind === 'me' ? C.accent : isFriendNode ? n.color : isPend ? `${n.color}cc` : `${n.color}66`}
                    stroke={isSel ? C.accent : n.kind === 'me' ? 'rgba(255,255,255,0.25)' : isFriendNode ? n.color : isPend ? n.color : C.border}
                    strokeWidth={n.kind === 'me' ? 2.5 : isFriendNode || isPend ? 2 : 1}
                    filter={n.kind === 'me' ? 'url(#glow)' : undefined} />
                  {isMultiSel && <>
                    <circle cx={n.x - n.r * 0.68} cy={n.y - n.r * 0.68} r={9} fill={C.accent} stroke={C.bg} strokeWidth="1.5" />
                    <text x={n.x - n.r * 0.68} y={n.y - n.r * 0.68 + 4.5} textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" style={{ pointerEvents: 'none' }}>✓</text>
                  </>}
                  {(isFriendNode || isPend) && <>
                    <circle cx={n.x + n.r * 0.68} cy={n.y - n.r * 0.68} r={7} fill={C.success} stroke={C.bg} strokeWidth="1.5" />
                    <text x={n.x + n.r * 0.68} y={n.y - n.r * 0.68 + 4.5} textAnchor="middle" fontSize="9" fill="#fff" style={{ pointerEvents: 'none' }}>✓</text>
                  </>}
                  {isPend && !isFriendNode && <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke={C.accent} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />}
                  <text x={n.x} y={n.y + n.r * 0.35} textAnchor="middle"
                    fontSize={n.kind === 'me' ? 15 : n.r > 20 ? 12 : n.r > 16 ? 10 : 9}
                    fontWeight="800" fill="#fff" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {n.kind === 'me' ? ((user.display_name || user.displayName)?.[0]?.toUpperCase() || 'Y') : (n.label || '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </text>
                  <text x={n.x} y={n.y + n.r + 14} textAnchor="middle"
                    fontSize={n.kind === 'me' ? 12 : n.kind === 'friend' ? 11 : 10}
                    fontWeight={n.kind === 'me' ? '800' : '600'}
                    fill={n.kind === 'me' ? C.accent : isFriendNode ? C.text : `${C.muted}`}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {n.kind === 'me' ? 'You' : (n.label || '?').split(' ')[0]}
                  </text>
                  {(n.kind === 'friend' || isPend) && <>
                    <rect x={n.x - 15} y={n.y + n.r + 17} width={30} height={14} rx={7} fill={C.accentL} />
                    <text x={n.x} y={n.y + n.r + 27} textAnchor="middle" fontSize="8" fontWeight="700" fill={C.accent} style={{ pointerEvents: 'none', userSelect: 'none' }}>Lv {n.level}</text>
                  </>}
                </g>
              );
            })}
          </g>
        </svg>

        {selNode && selNode.kind !== 'me' && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'oklch(16% 0.018 265 / 0.96)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: '13px 15px', border: `1px solid ${C.border}`, animation: 'fadeUp 0.2s ease', zIndex: 10 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: selNode.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(selNode.label || '?').split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <p style={{ color: C.text, fontWeight: 800, fontSize: 14 }}>{selNode.label}</p>
                  <span style={{ background: C.accentG, color: C.accent, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 6px' }}>Lv {selNode.level}</span>
                  {(selNode.kind === 'friend' || pending[selNode.id]) && <span style={{ background: 'oklch(62% 0.18 145/0.15)', color: C.success, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '1px 5px' }}>Friend</span>}
                </div>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>@{selNode.id}</p>
                {selNode.data?.bio && <p style={{ color: C.muted, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selNode.data.bio}</p>}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}><Icon name="x" size={15} color={C.muted} /></button>
            </div>
            {(selNode.kind === 'fof' || selNode.kind === 'fof2') && !pending[selNode.id]
              ? <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn small full={false} style={{ flex: 2 }} onClick={() => handleAdd(selNode.data)}>
                    <Icon name="userplus" size={13} color="#fff" /> Add Friend
                  </Btn>
                  <Btn small full={false} variant="ghost" style={{ flex: 1 }} onClick={() => { setSelected(null); onViewProfile && onViewProfile(selNode.data); }}>View</Btn>
                </div>
                <p style={{ color: C.muted, fontSize: 10, textAlign: 'center', marginTop: 7 }}>
                  Friend of <strong style={{ color: C.text }}>{nodes.find(n => n.id === selNode.parent)?.label || 'a friend'}</strong> · Adding expands their network
                </p>
              </>
              : <div style={{ display: 'flex', gap: 8 }}>
                {selNode.kind === 'friend' && <>
                  <Btn small full={false} style={{ flex: 2 }} variant="subtle" onClick={() => { setSelected(null); onOpenChat && onOpenChat(selNode.data); }}>
                    <Icon name="chat" size={13} color={C.accent} /> Chat
                  </Btn>
                  <Btn small full={false} variant="ghost" style={{ flex: 1 }} onClick={() => { setSelected(null); onViewProfile && onViewProfile(selNode.data); }}>Profile</Btn>
                </>}
              </div>
            }
          </div>
        )}

        {multiMode && (
          <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'oklch(16% 0.018 265 / 0.97)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: '11px 13px', border: `1px solid ${C.accent}66`, zIndex: 15, animation: 'fadeUp 0.22s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: multiSel.size > 0 ? 9 : 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.accentL, border: `1px solid ${C.accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.4" strokeLinecap="round"><circle cx="9" cy="8" r="3.3" /><circle cx="17" cy="9" r="2.6" /><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M14 18c0-2 2-3.5 4.2-3.5s3.8 1.5 3.8 3.5" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: C.text, fontWeight: 800, fontSize: 13 }}>New Group Chat</p>
                <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
                  {multiSel.size === 0 ? 'Tap friend nodes to add them' : multiSel.size === 1 ? '1 friend selected · pick at least 2' : `${multiSel.size} friends selected`}
                </p>
              </div>
              <button onClick={toggleMulti} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}><Icon name="x" size={16} color={C.muted} /></button>
            </div>
            {multiSel.size > 0 && <>
              <div style={{ display: 'flex', gap: -8, marginBottom: 9, flexWrap: 'wrap' }}>
                {[...multiSel].slice(0, 6).map(u => {
                  const f = graphFriends.find(x => x.username === u);
                  if (!f) return null;
                  return <div key={u} style={{ width: 26, height: 26, borderRadius: '50%', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', border: `2px solid ${C.bg}`, marginRight: -6 }}>{(f.display_name || f.username || '?')[0]}</div>;
                })}
                {multiSel.size > 6 && <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.surface, border: `2px solid ${C.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.muted, marginRight: -6 }}>+{multiSel.size - 6}</div>}
              </div>
              <Btn small disabled={multiSel.size < 2} onClick={createGroupFromSelection}>
                <Icon name="chat" size={13} color="#fff" /> Create Group Chat{multiSel.size >= 2 ? ` (${multiSel.size})` : ''}
              </Btn>
            </>}
          </div>
        )}

        {nodes.length <= 1 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 44, opacity: 0.25 }}>🕸️</div>
            <p style={{ color: C.muted, fontSize: 14, fontWeight: 700 }}>Your network is empty</p>
            <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>Add friends from the map or People tab to see your social graph here</p>
          </div>
        )}
      </div>
    </div>
  );
}
