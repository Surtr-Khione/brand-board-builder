import { useState } from "react";
import { Link } from "react-router-dom";

function rgb(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? "80,80,80" : `${r},${g},${b}`;
}

function luma(hex = "") {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? 0 : (r * 299 + g * 587 + b * 114) / 1000;
}

function logoSources(website) {
  if (!website) return [];
  const domain = website.replace(/^https?:\/\//, "").split("/")[0];
  return [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
}

export default function BrandCard({ brand, compact = false }) {
  const [hov, setHov] = useState(false);
  const [srcIdx, setSrcIdx] = useState(0);

  const pc = brand.primary_color || "#333";
  const sc = brand.secondary_color || "#1a1a1a";
  const ac = brand.accent_color || "#555";
  const sources = logoSources(brand.website);
  const url = sources[srcIdx] || null;
  const isDark = luma(pc) < 160;

  const logoSize = compact ? 64 : 80;
  const iconWrap = compact ? 76 : 96;
  const headerH = compact ? 130 : 160;
  const nameSize = compact ? 18 : 21;

  return (
    <Link to={`/brands/${brand.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          borderRadius: 18,
          overflow: "hidden",
          border: `1.5px solid ${hov ? `rgba(${rgb(pc)}, 0.6)` : "rgba(255,255,255,0.04)"}`,
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          transform: hov ? "translateY(-6px) scale(1.01)" : "none",
          boxShadow: hov
            ? `0 24px 56px rgba(${rgb(pc)}, 0.32), 0 8px 20px rgba(0,0,0,0.5)`
            : "0 2px 10px rgba(0,0,0,0.35)",
          cursor: "pointer",
          background: "#0c0c0c",
        }}
      >
        {/* ── BRAND COLOR ZONE ─────────────────────────────────── */}
        <div style={{
          height: headerH,
          background: `radial-gradient(ellipse at 30% 40%, rgba(${rgb(pc)},0.35) 0%, transparent 70%), ${pc}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle texture overlay */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.06,
            backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)",
            backgroundSize: "12px 12px",
          }} />

          {/* Featured star */}
          {brand.is_featured && (
            <div style={{
              position: "absolute", top: 10, right: 12,
              fontSize: 10, fontWeight: 800,
              color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)",
              letterSpacing: 1,
            }}>★</div>
          )}

          {/* Logo container — app-icon style */}
          <div style={{
            width: iconWrap, height: iconWrap,
            background: "#fff",
            borderRadius: Math.round(iconWrap * 0.22),
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18)`,
            flexShrink: 0,
            overflow: "hidden",
            position: "relative", zIndex: 1,
          }}>
            {url ? (
              <img
                src={url}
                onError={() => setSrcIdx(i => i + 1)}
                alt={brand.brand_name}
                style={{ width: logoSize, height: logoSize, objectFit: "contain" }}
                loading="lazy"
              />
            ) : (
              <span style={{
                fontSize: Math.round(logoSize * 0.5),
                fontWeight: 900,
                color: pc,
                fontFamily: "-apple-system, sans-serif",
                lineHeight: 1,
                userSelect: "none",
              }}>
                {brand.brand_name.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* ── BRAND INFO ───────────────────────────────────────── */}
        <div style={{ padding: compact ? "14px 16px 0" : "18px 20px 0" }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
            <div style={{ fontSize: nameSize, fontWeight: 800, color: "#f0ece3", letterSpacing: "-0.4px", lineHeight: 1.15 }}>
              {brand.brand_name}
            </div>
            {brand.archetype && (
              <span style={{
                fontSize: 8, fontWeight: 700, flexShrink: 0, marginTop: 3,
                color: pc, background: `rgba(${rgb(pc)},0.12)`,
                border: `1px solid rgba(${rgb(pc)},0.28)`,
                borderRadius: 4, padding: "2px 7px", letterSpacing: 0.4,
                textTransform: "uppercase",
              }}>
                {brand.archetype.replace("The ", "")}
              </span>
            )}
          </div>

          <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, color: brand.is_verified ? "#2ecc71" : "#3a3a3a" }}>
            {brand.is_verified ? "✓ Verified" : "Community"}
          </div>

          {/* Tagline */}
          {brand.tagline && (
            <div style={{
              fontSize: compact ? 11 : 12,
              color: `rgba(${rgb(pc)}, ${isDark ? "0.85" : "0.7"})`,
              fontStyle: "italic",
              lineHeight: 1.5,
              marginBottom: 12,
              minHeight: compact ? 30 : 34,
            }}>
              "{brand.tagline}"
            </div>
          )}

          {/* Valuation */}
          {brand.brand_valuation && !compact && (
            <div style={{ fontSize: 10, color: "#555", display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
              <span style={{ color: "#c9a227", fontSize: 9 }}>◆</span>
              <span style={{ color: "#666" }}>{brand.brand_valuation.split(" · ")[0]}</span>
            </div>
          )}
        </div>

        {/* ── COLOR BAR ────────────────────────────────────────── */}
        <div style={{ display: "flex", margin: `${compact ? 10 : 12}px ${compact ? 16 : 20}px 0`, height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
          <div style={{ flex: 1, background: pc }} />
          <div style={{ flex: 1, background: sc }} />
          <div style={{ flex: 1, background: ac }} />
        </div>
        <div style={{ display: "flex", padding: `3px ${compact ? 16 : 20}px ${compact ? 12 : 14}px` }}>
          <span style={{ flex: 1, fontSize: 8, color: "#2a2a2a", fontFamily: "monospace" }}>{pc}</span>
          <span style={{ flex: 1, fontSize: 8, color: "#2a2a2a", fontFamily: "monospace", textAlign: "center" }}>{sc}</span>
          <span style={{ flex: 1, fontSize: 8, color: "#2a2a2a", fontFamily: "monospace", textAlign: "right" }}>{ac}</span>
        </div>
      </div>
    </Link>
  );
}
