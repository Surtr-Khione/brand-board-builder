import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function submitFeedback({ page, section, message, email }) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Not configured");
  const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ page, section, message, email: email || null, url: window.location.href }),
  });
  if (!res.ok) throw new Error("Submit failed");
}

export default function FeedbackButton({ section }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Reset when closed
  useEffect(() => {
    if (!open) { setTimeout(() => { setMessage(""); setEmail(""); setStatus("idle"); }, 300); }
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      await submitFeedback({
        page: window.location.pathname,
        section: section || null,
        message: message.trim(),
        email: email.trim() || null,
      });
      setStatus("done");
      setTimeout(() => setOpen(false), 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Flag an issue or suggestion"
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 10px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          background: open ? "rgba(0,113,227,0.12)" : "rgba(255,255,255,0.03)",
          color: open ? "#0071E3" : "#444",
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", transition: "all 0.18s",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.color = "#0071E3"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.color = "#444"; }}
      >
        ⚑ Feedback
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", right: 0,
          width: 300, background: "#111", border: "1px solid #222",
          borderRadius: 12, padding: 16, zIndex: 9999,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F5F5F7", marginBottom: 4 }}>
            Flag an issue
          </div>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>
            {section ? `Section: ${section}` : "What needs improvement?"}
          </div>

          {status === "done" ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#32D74B", fontSize: 13, fontWeight: 600 }}>
              ✓ Thanks — we'll review it
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe what's wrong or could be better..."
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid #222", background: "#0a0a0a",
                  color: "#e0e0e0", fontSize: 12, fontFamily: "inherit",
                  resize: "vertical", outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#333"}
                onBlur={e => e.target.style.borderColor = "#222"}
              />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional — for follow-up)"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8, marginTop: 8,
                  border: "1px solid #1e1e1e", background: "#0a0a0a",
                  color: "#e0e0e0", fontSize: 12, fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {status === "error" && (
                <div style={{ fontSize: 11, color: "#0071E3", marginTop: 6 }}>Couldn't submit — try again</div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || status === "sending"}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                    background: !message.trim() ? "rgba(0,113,227,0.25)" : "linear-gradient(135deg,#0071E3,#005BB8)",
                    color: "#fff", fontSize: 12, fontWeight: 700, cursor: !message.trim() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {status === "sending" ? "Sending..." : "Submit"}
                </button>
                <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #222", background: "transparent", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Floating variant — fixed to bottom-right of the screen
export function FloatingFeedback() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) setTimeout(() => { setMessage(""); setEmail(""); setStatus("idle"); }, 300);
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus("sending");
    try {
      await submitFeedback({ page: window.location.pathname, message: message.trim(), email: email.trim() || null });
      setStatus("done");
      setTimeout(() => setOpen(false), 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div ref={ref} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 10000 }}>
      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 10px)", right: 0,
          width: 310, background: "#111", border: "1px solid #222",
          borderRadius: 14, padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F5F5F7", marginBottom: 3 }}>Share feedback</div>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 14 }}>What's working? What needs improvement?</div>

          {status === "done" ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#32D74B", fontSize: 13, fontWeight: 600 }}>
              ✓ Feedback received — thank you!
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe the issue or suggestion..."
                autoFocus
                rows={4}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #222", background: "#0a0a0a", color: "#e0e0e0", fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }}
              />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, marginTop: 8, border: "1px solid #1e1e1e", background: "#0a0a0a", color: "#e0e0e0", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
              {status === "error" && <div style={{ fontSize: 11, color: "#FF453A", marginTop: 6 }}>Submit failed — please try again</div>}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || status === "sending"}
                style={{ marginTop: 12, width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: !message.trim() ? "rgba(0,113,227,0.25)" : "linear-gradient(135deg,#0071E3,#005BB8)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: !message.trim() ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {status === "sending" ? "Sending..." : "Send Feedback"}
              </button>
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 46, height: 46, borderRadius: "50%",
          background: open ? "#005BB8" : "linear-gradient(135deg,#0071E3,#005BB8)",
          border: "none", color: "#fff", fontSize: 18, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,113,227,0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="Share feedback"
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {open ? "×" : "⚑"}
      </button>
    </div>
  );
}
