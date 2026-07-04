import { useEffect, useState } from 'react';
import { shareBoard, listShares, removeShare } from '../lib/storage';

// Share a saved board with teammates as viewer or editor.
export default function ShareModal({ isOpen, onClose, boardId, shareUrl }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [shares, setShares] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  useEffect(() => {
    if (isOpen && boardId) listShares(boardId).then(setShares);
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  const doShare = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setMsg({ ok: false, text: 'Enter a valid email.' }); return; }
    setBusy(true); setMsg(null);
    try {
      await shareBoard(boardId, email, role);
      setShares(await listShares(boardId));
      setMsg({ ok: true, text: `Shared with ${email} as ${role}.` });
      setEmail('');
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    }
    setBusy(false);
  };

  const doRemove = async (id) => {
    await removeShare(id);
    setShares(await listShares(boardId));
  };

  const inputStyle = {
    padding: '11px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 32, maxWidth: 460, width: '90%', fontFamily: "'DM Sans', sans-serif" }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Share this board</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px', lineHeight: 1.6 }}>
          Viewers can open the board. Editors can also make changes.
        </p>

        {shareUrl && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input readOnly value={shareUrl} style={{ ...inputStyle, flex: 1, color: '#999' }} onFocus={(e) => e.target.select()} />
            <button onClick={() => { navigator.clipboard.writeText(shareUrl); setMsg({ ok: true, text: 'Link copied.' }); }}
              style={{ padding: '0 16px', borderRadius: 8, border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.06)', color: '#2ecc71', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Copy
            </button>
          </div>
        )}

        <form onSubmit={doShare} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input type="email" placeholder="teammate@company.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setMsg(null); }} style={{ ...inputStyle, flex: 1 }} />
          <select value={role} onChange={(e) => setRole(e.target.value)}
            style={{ ...inputStyle, width: 90, cursor: 'pointer' }}>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button type="submit" disabled={busy}
            style={{ padding: '0 18px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #e94560, #c62a42)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            Share
          </button>
        </form>

        {msg && <p style={{ fontSize: 12, color: msg.ok ? '#2ecc71' : '#e94560', margin: '0 0 12px' }}>{msg.text}</p>}

        {shares.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            {shares.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
                <span style={{ fontSize: 13, color: '#ccc' }}>{s.shared_with_email}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: s.role === 'editor' ? '#f39c12' : '#666', fontWeight: 600, textTransform: 'uppercase' }}>{s.role}</span>
                  <button onClick={() => doRemove(s.id)} title="Remove access"
                    style={{ border: 'none', background: 'transparent', color: '#555', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onClose}
          style={{ width: '100%', padding: 10, marginTop: 16, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Done
        </button>
      </div>
    </div>
  );
}
