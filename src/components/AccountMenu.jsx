import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut, getCredits, TIER_NAMES } from '../lib/auth';
import AuthModal from './AuthModal';
import { useAuth } from '../hooks/useAuth';

// Header account widget: Sign In button when logged out,
// credits + menu (My Boards / Sign Out) when logged in.
export default function AccountMenu() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  if (!user) {
    return (
      <>
        <button onClick={() => setShowAuth(true)}
          style={{ padding: '6px 16px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#ccc', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
          Sign In
        </button>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      </>
    );
  }

  const label = profile?.display_name || profile?.email || user.email || 'Account';
  const credits = profile?.credits ?? getCredits();

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(46,204,113,0.25)', background: 'rgba(46,204,113,0.05)', color: '#2ecc71', fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
          {label.slice(0, 1).toUpperCase()}
        </span>
        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 10, color: '#f39c12', fontWeight: 700 }}>{credits} cr</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 999, minWidth: 190, background: '#16161d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 12, color: '#ccc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || user.email}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{TIER_NAMES[profile?.tier] || 'Registered'} · {credits} credits</div>
            </div>
            <Link to="/boards" onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '10px 14px', fontSize: 13, color: '#ccc', textDecoration: 'none' }}>
              ◫ My Boards
            </Link>
            <button onClick={async () => { setOpen(false); await signOut(); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13, color: '#e94560', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
