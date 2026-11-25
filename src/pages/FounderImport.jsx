import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mapGeneratedToBoard } from "../lib/synthesisMap";
import { track } from "../lib/track";

// /import#board=<base64url JSON> — the handoff from Founder Studio (founders.brandmd.space and
// founders.insiders.marketing). The board travels in the URL fragment, so it never reaches a server
// or a log. It is generator-shaped JSON, mapped exactly like a Brand Generator board, then seeded
// into the Builder through the same sessionStorage key /start and /generate use.
const MAX_CHARS = 400_000;

function decode(hash) {
  const raw = new URLSearchParams(hash.replace(/^#/, "")).get("board");
  if (!raw || raw.length > MAX_CHARS) return null;
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64 + "===".slice((b64.length + 3) % 4)), (c) => c.charCodeAt(0));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  return data && typeof data === "object" && !Array.isArray(data) ? data : null;
}

export default function FounderImport() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let board = null;
    try { board = decode(window.location.hash); } catch { /* fall through to the error */ }
    // drop the fragment from history either way
    window.history.replaceState(null, "", "/import");
    const updates = board ? mapGeneratedToBoard(board) : {};
    if (!Object.keys(updates).length) {
      setError("This link did not carry a brand board. Open it again from Founder Studio.");
      return;
    }
    sessionStorage.setItem("founder-seed", JSON.stringify(updates));
    track("founder_studio_import", { brandName: updates.brandName || "" });
    navigate("/builder", { replace: true });
  }, [navigate]);

  return (
    <div style={{ background: "#000", color: "#F5F5F7", minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <p style={{ maxWidth: 520, fontSize: 18, lineHeight: 1.5 }}>{error || "Opening your brand board in the Builder…"}</p>
    </div>
  );
}
