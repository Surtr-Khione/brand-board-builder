import { useState } from "react";

const CHARCOAL = "#1D1D1F";
const TITANIUM = "#8E8E93";
const STARLIGHT = "#F5F5F7";
const ACCENT_BLUE = "#0071E3";
const SANS = "'Inter', -apple-system, sans-serif";

function embedSnippet({ url, name, archetype, color }) {
  const dot = color || "#0071E3";
  return `<a href="${url}" target="_blank" rel="noopener" title="${name} — diagnosed by BrandMD" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:#0B0B0F;border:1px solid rgba(255,255,255,0.14);text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <span style="width:9px;height:9px;border-radius:50%;background:${dot};"></span>
  <span style="color:#F5F5F7;font-size:13px;font-weight:600;">Diagnosed by BrandMD</span>
  ${archetype ? `<span style="color:#8E8E93;font-size:12px;">&mdash; ${archetype}</span>` : ""}
</a>`;
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="bmd-cta"
      style={{
        padding: "8px 16px", borderRadius: 100, border: "1px solid rgba(255,255,255,0.16)",
        background: copied ? ACCENT_BLUE : "transparent", color: STARLIGHT,
        fontSize: 12.5, fontWeight: 600, fontFamily: SANS, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

// Renders the share + embed surface for a published Brand Certificate.
// Used right after publishing, and persistently on every certificate page.
export default function CertificateShare({ brand, url }) {
  if (!url) return null;
  const fullUrl = url.startsWith("http") ? url : `https://brandmd.space${url}`;
  const name = brand?.brand_name || brand?.brandName || "This brand";
  const archetype = brand?.archetype || "";
  const color = brand?.primary_color || brand?.primaryColor || ACCENT_BLUE;
  const shareText = `${name}'s brand, diagnosed by BrandMD${archetype ? ` — ${archetype}` : ""}.`;
  const snippet = embedSnippet({ url: fullUrl, name, archetype, color });

  return (
    <div style={{
      borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
      background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%), ${CHARCOAL}`,
      padding: "24px 26px", fontFamily: SANS,
    }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
        Your Brand Certificate
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{
          flex: "1 1 240px", minWidth: 0, padding: "10px 14px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)",
          fontSize: 13, color: STARLIGHT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {fullUrl.replace(/^https?:\/\//, "")}
        </div>
        <CopyButton text={fullUrl} label="Copy link" />
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`}
          target="_blank" rel="noopener noreferrer" className="bmd-link"
          style={{ fontSize: 13, color: ACCENT_BLUE, textDecoration: "none", fontWeight: 500 }}
        >
          Share on X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`}
          target="_blank" rel="noopener noreferrer" className="bmd-link"
          style={{ fontSize: 13, color: ACCENT_BLUE, textDecoration: "none", fontWeight: 500 }}
        >
          Share on LinkedIn
        </a>
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 600, color: TITANIUM, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        Embed on your site
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <pre style={{
          flex: "1 1 260px", minWidth: 0, margin: 0, padding: "12px 14px", borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.35)",
          color: "#B8B8BD", fontSize: 11, lineHeight: 1.5, fontFamily: "monospace",
          overflowX: "auto", whiteSpace: "pre",
        }}>
          {snippet}
        </pre>
        <CopyButton text={snippet} label="Copy embed code" />
      </div>
    </div>
  );
}
