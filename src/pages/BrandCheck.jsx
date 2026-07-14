import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SiteNav from "../components/SiteNav";
import EmailGate from "../components/EmailGate";
import { brandCheck, isAIAvailable } from "../lib/ai";
import { loadBoard } from "../lib/storage";
import { getTier, register, getCredits, setCredits, syncCredits } from "../lib/auth";
import { track } from "../lib/track";
import { sendLeadToGHL } from "../lib/ghl";

const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const ACCENT_ICE = "#64D2FF";
const SANS = "'Inter', -apple-system, sans-serif";
const PANEL_BG = `linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0) 45%), ${CHARCOAL}`;
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

const CHANNELS = ["Email", "LinkedIn", "Instagram", "X / Twitter", "Blog post", "Website copy", "Ad"];

const SEVERITY = {
  high: { color: "#FF453A", label: "High" },
  medium: { color: "#FF9F0A", label: "Medium" },
  low: { color: "#64D2FF", label: "Low" },
};

const scoreColor = (s) => (s >= 90 ? "#32D74B" : s >= 70 ? "#FF9F0A" : "#FF453A");

export default function BrandCheck() {
  const { boardId } = useParams();
  const [brand, setBrand] = useState(null);
  const [brandState, setBrandState] = useState(boardId ? "loading" : "none");
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showGate, setShowGate] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "Brand Check — Grade Any Draft Against Your Brand | BrandMD";
    syncCredits();
  }, []);

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId)
        .then((d) => { if (d?.brand_data) { setBrand(d.brand_data); setBrandState("ready"); } else setBrandState("none"); })
        .catch(() => setBrandState("none"));
    } else {
      try {
        const s = sessionStorage.getItem("studio_brand");
        if (s) { setBrand(JSON.parse(s)); setBrandState("ready"); }
      } catch { /* fall through to none */ }
    }
  }, [boardId]);

  const runCheck = async () => {
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      const res = await brandCheck(brand, draft.trim(), channel || undefined);
      if (!res?.check) throw new Error("The check returned nothing — try again.");
      if (typeof res.creditsRemaining === "number") setCredits(res.creditsRemaining);
      setResult(res.check);
      track("check_run", { boardId, score: res.check.score, channel: channel || null });
    } catch (e) {
      setError(e.message || "Check failed — try again.");
    }
    setChecking(false);
  };

  const startCheck = () => {
    setError(null);
    if (!draft.trim()) { setError("Paste the draft you want checked."); return; }
    if (getTier() === "free") { setShowGate(true); return; }
    if (getCredits() <= 0) {
      setError("You're out of credits. Earn or buy more from any locked section in the Builder.");
      return;
    }
    runCheck();
  };

  const handleGate = async ({ email, firstName }) => {
    await register(email);
    setShowGate(false);
    sendLeadToGHL({ email, firstName, boardId: boardId || "", boardUrl: `${window.location.origin}/check` });
    await runCheck();
  };

  const copyRewrite = () => {
    navigator.clipboard?.writeText(result.rewrite).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  if (brandState === "loading") {
    return <div style={{ minHeight: "100vh", background: "#000", color: TITANIUM, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS }}>Loading board…</div>;
  }

  return (
    <div style={{ background: "#000", color: STARLIGHT, minHeight: "100vh", fontFamily: SANS }}>
      <SiteNav />

      <div style={{ padding: "64px 40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 18 }}>
          Brand Check
        </div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(30px, 5vw, 48px)", lineHeight: 1.08, letterSpacing: "-1.6px", maxWidth: 760, margin: "0 auto 18px" }}>
          Would your brand sign off on this?
        </h1>
        <p style={{ fontSize: 15.5, color: TITANIUM, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          Paste any draft — an email, a post, homepage copy — and it gets graded against
          your board's voice, rules, and banned words, then rewritten to pass.
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 60px" }}>
        {brandState !== "ready" ? (
          <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "44px 34px", textAlign: "center" }}>
            <div style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 10 }}>Brand Check needs your board first</div>
            <div style={{ fontSize: 13.5, color: TITANIUM, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Every check runs against your board's voice system — tone, do/don't rules,
              banned words. Open your board and come back through its Brand Check link,
              or build one now.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/builder" style={{ padding: "11px 24px", borderRadius: 100, background: ACCENT_BLUE, color: "#fff", textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>Open the Builder</Link>
              <Link to="/start" style={{ padding: "11px 24px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", color: STARLIGHT, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>Start from an idea</Link>
            </div>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "30px 30px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                <div style={{ fontSize: 13, color: TITANIUM }}>
                  Checking against <span style={{ color: STARLIGHT, fontWeight: 700 }}>{brand.brandName || "your board"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#6E6E73" }}>{getTier() !== "free" ? `${getCredits()} credits` : "Free with email"}</div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {CHANNELS.map((c) => (
                  <button key={c} onClick={() => setChannel(channel === c ? "" : c)} style={{
                    padding: "7px 14px", borderRadius: 100, cursor: "pointer", fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
                    border: channel === c ? `1px solid ${ACCENT_BLUE}` : "1px solid rgba(255,255,255,0.14)",
                    background: channel === c ? "rgba(0,113,227,0.16)" : "rgba(255,255,255,0.03)",
                    color: channel === c ? "#7DBEFF" : TITANIUM,
                  }}>{c}</button>
                ))}
              </div>

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste your draft here — an email, a post, a page, an ad…"
                rows={9}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 12, resize: "vertical",
                  border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.35)",
                  color: STARLIGHT, fontSize: 14.5, fontFamily: SANS, lineHeight: 1.6, outline: "none",
                }}
              />

              {error && <div style={{ fontSize: 13, color: "#FF453A", marginTop: 12 }}>{error}</div>}

              <button
                onClick={startCheck}
                disabled={checking || !isAIAvailable()}
                className="bmd-cta"
                style={{
                  width: "100%", marginTop: 16, padding: "15px 0", borderRadius: 100, border: "none",
                  cursor: checking ? "wait" : "pointer",
                  background: checking ? "rgba(0,113,227,0.35)" : ACCENT_BLUE,
                  color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: SANS,
                }}
              >
                {checking ? "Reading it the way your brand would…" : "Run Brand Check"}
              </button>
            </div>

            {result && (
              <div style={{ marginTop: 24 }}>
                {/* SCORE */}
                <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "36px 32px 30px", textAlign: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>On-brand score</div>
                  <div style={{ fontSize: "clamp(52px, 9vw, 76px)", fontWeight: 800, lineHeight: 1, color: scoreColor(result.score) }}>{result.score}</div>
                  <div style={{ fontSize: 14.5, color: STARLIGHT, maxWidth: 520, margin: "16px auto 0", lineHeight: 1.6 }}>{result.verdict}</div>
                </div>

                {/* VIOLATIONS */}
                {result.violations?.length > 0 && (
                  <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "26px 28px", marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16 }}>
                      {result.violations.length} rule violation{result.violations.length > 1 ? "s" : ""}
                    </div>
                    {result.violations.map((v, i) => {
                      const sev = SEVERITY[v.severity] || SEVERITY.low;
                      return (
                        <div key={i} style={{ padding: "14px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: sev.color, letterSpacing: 0.8, textTransform: "uppercase", flexShrink: 0 }}>{sev.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{v.rule}</span>
                          </div>
                          <div style={{ fontSize: 13.5, color: TITANIUM, fontStyle: "italic", marginBottom: 6 }}>&ldquo;{v.evidence}&rdquo;</div>
                          <div style={{ fontSize: 13.5, color: "#32D74B" }}>→ {v.fix}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STRENGTHS */}
                {result.strengths?.length > 0 && (
                  <div style={{ borderRadius: 20, background: PANEL_BG, border: PANEL_BORDER, padding: "26px 28px", marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TITANIUM, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Already on-brand</div>
                    {result.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 13.5, color: STARLIGHT, lineHeight: 1.6, padding: "5px 0" }}>✓ {s}</div>
                    ))}
                  </div>
                )}

                {/* REWRITE */}
                <div style={{ borderRadius: 20, background: PANEL_BG, border: `1px solid rgba(0,113,227,0.35)`, padding: "26px 28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT_ICE, letterSpacing: 1.5, textTransform: "uppercase" }}>The on-brand rewrite</div>
                    <button onClick={copyRewrite} style={{ padding: "7px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.18)", background: "transparent", color: STARLIGHT, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.75, whiteSpace: "pre-wrap", color: STARLIGHT }}>{result.rewrite}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EmailGate
        isOpen={showGate}
        onClose={() => setShowGate(false)}
        onSubmit={handleGate}
        title="Run Your First Brand Check"
        subtitle="Enter your email and we'll grade this draft against your brand system and rewrite it on-brand. Free, and it unlocks 3 checks."
        submitLabel="Check My Draft"
      />
    </div>
  );
}
