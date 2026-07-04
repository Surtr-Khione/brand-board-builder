import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyBoards, listSharedWithMe, deleteBoard } from '../lib/storage';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../hooks/useAuth';
import AccountMenu from '../components/AccountMenu';

export default function MyBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState(null);
  const [shared, setShared] = useState([]);
  const [showAuth, setShowAuth] = useState(false);

  const load = () => {
    listMyBoards().then(setBoards);
    listSharedWithMe().then(setShared);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const remove = async (boardId) => {
    if (!window.confirm('Delete this board permanently?')) return;
    await deleteBoard(boardId);
    load();
  };

  const card = (b, extra) => (
    <div key={b.board_id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {['primaryColor', 'secondaryColor', 'accentColor'].map((k) => (
          <span key={k} style={{ width: 18, height: 18, borderRadius: 5, background: b.brand_data?.[k] || '#222', border: '1px solid rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
        {b.title || b.brand_data?.brandName || 'Untitled brand'}
      </div>
      <div style={{ fontSize: 11, color: '#555' }}>
        Updated {new Date(b.updated_at).toLocaleDateString()} {extra}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Link to={`/board/${b.board_id}`} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 8, background: 'linear-gradient(135deg, #e94560, #c62a42)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
          Open
        </Link>
        {!b.share_role && (
          <button onClick={() => remove(b.board_id)} title="Delete board"
            style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(233,69,96,0.25)', background: 'transparent', color: '#e94560', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✕
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e0e0e0', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <header style={{ padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, #e94560, #c62a42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>B</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>BrandMD</span>
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/builder" style={{ fontSize: 12, color: '#9b59b6', textDecoration: 'none', fontWeight: 600 }}>+ New Board</Link>
          <AccountMenu />
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>My Boards</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 28px' }}>Every brand board saved to your account.</p>

        {!user ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Sign in to see your saved boards.</p>
            <button onClick={() => setShowAuth(true)}
              style={{ padding: '12px 32px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #e94560, #c62a42)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign In / Create Account
            </button>
          </div>
        ) : boards === null ? (
          <p style={{ color: '#555' }}>Loading…</p>
        ) : (
          <>
            {boards.length === 0 && (
              <div style={{ padding: '40px 0', color: '#555', fontSize: 14 }}>
                No boards yet. <Link to="/builder" style={{ color: '#e94560' }}>Create your first brand board →</Link>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {boards.map((b) => card(b))}
            </div>

            {shared.length > 0 && (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '40px 0 16px' }}>Shared with me</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {shared.map((b) => card(b, `· ${b.share_role}`))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
    </div>
  );
}
