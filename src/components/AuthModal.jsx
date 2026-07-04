import { useState } from 'react';
import { signUp, signIn, resetPassword } from '../lib/auth';

const S = {
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
    color: '#fff', fontSize: '14px', marginBottom: '12px',
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  },
  primaryBtn: {
    width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
    background: 'linear-gradient(135deg, #e94560, #c62a42)',
    color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
};

// Email + password form used by the modal and the section gate.
// mode: 'signup' | 'signin'
export function AuthForm({ defaultMode = 'signup', onSuccess, accent = '#e94560' }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e?.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(''); setNotice('');
    try {
      const user = mode === 'signup'
        ? await signUp({ email, password, displayName: name })
        : await signIn({ email, password });
      onSuccess?.(user);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const forgot = async () => {
    if (!email.includes('@')) { setError('Enter your email above first.'); return; }
    setError('');
    try {
      await resetPassword(email);
      setNotice('Password reset link sent — check your email.');
    } catch (err) { setError(err.message); }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['signup', 'Create Account'], ['signin', 'Sign In']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setMode(id); setError(''); }}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: mode === id ? 700 : 400,
              border: `1px solid ${mode === id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
              background: mode === id ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: mode === id ? '#fff' : '#555',
            }}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
        <input type="text" placeholder="First name (optional)" value={name}
          onChange={(e) => setName(e.target.value)} style={S.input} />
      )}
      <input type="email" required placeholder="Your email address" value={email} autoComplete="email"
        onChange={(e) => { setEmail(e.target.value); setError(''); }}
        style={{ ...S.input, borderColor: error ? '#e94560' : 'rgba(255,255,255,0.1)' }} />
      <input type="password" required placeholder={mode === 'signup' ? 'Choose a password (6+ characters)' : 'Password'}
        value={password} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        onChange={(e) => { setPassword(e.target.value); setError(''); }}
        style={{ ...S.input, marginBottom: 8 }} />

      {error && <p style={{ color: '#e94560', fontSize: 12, margin: '0 0 10px' }}>{error}</p>}
      {notice && <p style={{ color: '#2ecc71', fontSize: 12, margin: '0 0 10px' }}>{notice}</p>}

      <button type="submit" disabled={loading}
        style={{ ...S.primaryBtn, background: loading ? 'rgba(233,69,96,0.4)' : `linear-gradient(135deg, ${accent}, #c62a42)`, cursor: loading ? 'wait' : 'pointer', marginTop: 4 }}>
        {loading ? 'One moment…' : mode === 'signup' ? 'Create Free Account — Get 3 Credits →' : 'Sign In →'}
      </button>

      {mode === 'signin' && (
        <button type="button" onClick={forgot}
          style={{ width: '100%', padding: '8px', marginTop: 8, border: 'none', background: 'transparent', color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Forgot password?
        </button>
      )}
    </form>
  );
}

export default function AuthModal({ isOpen, onClose, onSuccess, title, subtitle, defaultMode = 'signup', secondaryAction }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: '#13131a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px', padding: '40px', maxWidth: '420px', width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #e94560, #c62a42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20,
        }}>B</div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: "'DM Sans', sans-serif" }}>
          {title || 'Your BrandMD Account'}
        </h2>
        <p style={{ fontSize: 14, color: '#999', margin: '0 0 24px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
          {subtitle || 'Save boards to your account, access them anywhere, share with your team, and publish to the Brand Library.'}
        </p>

        <AuthForm defaultMode={defaultMode} onSuccess={(u) => { onSuccess?.(u); }} />

        {secondaryAction && (
          <button onClick={secondaryAction.onClick}
            style={{
              width: '100%', padding: '10px', marginTop: 12, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
              color: '#999', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
            {secondaryAction.label}
          </button>
        )}

        <button onClick={onClose}
          style={{
            width: '100%', padding: '10px', marginTop: 12, borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
            color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
          Not now
        </button>
      </div>
    </div>
  );
}
