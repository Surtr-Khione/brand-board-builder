import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mapGeneratedToBoard } from "../lib/synthesisMap";
import { track } from "../lib/track";

// The handoff from Founder Studio (founders.brandmd.space, founders.insiders.marketing). Two forms,
// both carried in the URL fragment so nothing reaches a server or a log:
//
//   /import#id=<boardId>&token=<editToken>
//     Founder Studio already saved the board through save-board. Store the edit token the same way
//     storage.js does (bmd_edit_token_<id>) so this browser can keep editing that board, then open it.
//
//   /import#board=<base64url JSON>
//     Fallback when saving failed: a generator-shaped board, mapped like a Brand Generator board and
//     seeded into the Builder through sessionStorage "founder-seed" (same path as /start and /generate).
const MAX_CHARS = 400_000;
const ID_RE = /^[a-z0-9]{6,32}$/;

function decodeBoard(raw) {
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
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    // drop the fragment (it may carry an edit token) from history either way
    window.history.replaceState(null, "", "/import");

    const id = params.get("id"), token = params.get("token");
    if (id && token && ID_RE.test(id) && token.length <= 200) {
      localStorage.setItem(`bmd_edit_token_${id}`, token);
      track("founder_studio_import", { mode: "saved-board" });
      navigate(`/board/${id}`, { replace: true });
      return;
    }

    let board = null;
    try { board = decodeBoard(params.get("board")); } catch { /* fall through to the error */ }
    const updates = board ? mapGeneratedToBoard(board) : {};
    if (!Object.keys(updates).length) {
      setError("This link did not carry a brand board. Open it again from Founder Studio.");
      return;
    }
    sessionStorage.setItem("founder-seed", JSON.stringify(updates));
    track("founder_studio_import", { mode: "seed", brandName: updates.brandName || "" });
    navigate("/builder", { replace: true });
  }, [navigate]);

  return (
    <div style={{ background: "#000", color: "#F5F5F7", minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <p style={{ maxWidth: 520, fontSize: 18, lineHeight: 1.5 }}>{error || "Opening your brand board…"}</p>
    </div>
  );
}
