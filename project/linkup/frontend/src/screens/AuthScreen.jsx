import React, { useState } from 'react';
import { C } from '../utils/constants';
import { Btn, Spinner, Wordmark } from '../components/ui';
import { auth } from '../utils/api';

export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await auth.login({ identifier: form.email, password: form.password });
      } else {
        if (!form.username.trim()) { setError('Username is required.'); setLoading(false); return; }
        data = await auth.signup({ email: form.email, username: form.username, password: form.password });
      }
      localStorage.setItem('lu_access_token', data.accessToken);
      localStorage.setItem('lu_refresh_token', data.refreshToken);
      onAuth(data.user);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', background: C.bg }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Wordmark size={32} />
        <p style={{ color: C.muted, fontSize: 14, marginTop: 8 }}>Meet people near you</p>
      </div>

      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ display: 'flex', background: C.surface, borderRadius: 13, padding: 4, marginBottom: 24, border: `1px solid ${C.border}` }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: mode === m ? C.accent : 'none', color: mode === m ? '#fff' : C.muted, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            required
            style={inputStyle}
          />
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={e => set('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
              style={inputStyle}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => set('password', e.target.value)}
            required
            minLength={8}
            style={inputStyle}
          />

          {error && (
            <div style={{ background: 'oklch(55% 0.2 25/0.12)', border: '1px solid oklch(55% 0.2 25/0.3)', borderRadius: 10, padding: '9px 13px' }}>
              <p style={{ color: C.error, fontSize: 13 }}>{error}</p>
            </div>
          )}

          <Btn type="submit" disabled={loading} style={{ marginTop: 4, height: 46, fontSize: 15 }}>
            {loading ? <Spinner size={18} /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Btn>
        </form>

        {mode === 'login' && (
          <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 16 }}>
            Don't have an account?{' '}
            <span onClick={() => setMode('signup')} style={{ color: C.accent, cursor: 'pointer', fontWeight: 700 }}>Sign up</span>
          </p>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '13px 16px',
  color: C.text,
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
