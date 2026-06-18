import { useState } from 'react';

export default function EmailGate({ onSubmit, onClose, isOpen }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({ email, firstName });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

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
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #e94560, #c62a42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '20px',
        }}>B</div>

        <h2 style={{
          fontSize: '22px', fontWeight: 700, color: '#fff', margin: '0 0 8px',
          fontFamily: "'DM Sans', sans-serif",
        }}>Save Your Brand Board</h2>

        <p style={{
          fontSize: '14px', color: '#999', margin: '0 0 24px', lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Enter your email to save your brand board and get a unique URL you can
          come back to anytime. We'll also send you branding tips and resources.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: '14px', marginBottom: '12px',
              fontFamily: "'DM Sans', sans-serif", outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="email"
            placeholder="Your email address *"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '10px',
              border: `1px solid ${error ? '#e94560' : 'rgba(255,255,255,0.1)'}`,
              background: 'rgba(255,255,255,0.04)',
              color: '#fff', fontSize: '14px', marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif", outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#e94560', fontSize: '12px', margin: '0 0 12px' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: loading
                ? 'rgba(233,69,96,0.4)'
                : 'linear-gradient(135deg, #e94560, #c62a42)',
              color: '#fff', fontSize: '15px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", marginTop: '8px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Saving...' : 'Save & Get My Link'}
          </button>
        </form>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', marginTop: '12px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)', background: 'transparent',
            color: '#666', fontSize: '13px', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Continue without saving
        </button>
      </div>
    </div>
  );
}
