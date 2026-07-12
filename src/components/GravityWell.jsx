import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { LogoTile, MARQUE_BRANDS } from "./TrustMarks";

// The homepage signature: a 3D gravity well. Concentric orbital rings in
// perspective, the marque brands riding the middle orbit, brand fragments
// hanging at real depths — and the scroll wheel is the camera: descending
// the runway tilts the system, advances the orbit, and pulls you into the
// well. Pure CSS 3D scrubbed by one rAF scroll listener; no WebGL, no deps.
// prefers-reduced-motion freezes the choreography at its composed state.

const ACCENT_BLUE = "#0071E3";
const STARLIGHT = "#F5F5F7";
const TITANIUM = "#8E8E93";

// Rings: radius factor (of --wellR), z offset, tick marks for visible rotation
const RINGS = [
  { r: 0.34, z: 40, ticks: 2, spin: 46 },
  { r: 0.58, z: 0, ticks: 3, spin: -34 },
  { r: 0.84, z: -50, ticks: 2, spin: 24 },
  { r: 1.14, z: -110, ticks: 3, spin: -18 },
];

// Fragments floating at real depths inside the well
const DEPTH_FRAGMENTS = Array.from({ length: 14 }).map((_, i) => ({
  id: i,
  a: (i / 14) * 360 + (i % 3) * 9,
  rf: 0.42 + ((i * 37) % 60) / 78,
  z: -210 + ((i * 83) % 380),
  dot: i % 3 === 0,
}));

export default function GravityWell({ children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "0.3");
      return;
    }
    // Lerped camera: scroll sets the target, a persistent rAF eases the
    // rendered value toward it — the descent feels liquid instead of
    // stepping with each wheel notch.
    let raf = 0;
    let current = -1;
    const orbiters = el.querySelectorAll("[data-angle]");
    const apply = (p) => {
      el.style.setProperty("--p", p.toFixed(4));
      // Depth cue + headline protection: marks dim as they swing to the back
      // of the orbit (visually the top), brighten at the front.
      for (const o of orbiters) {
        const a = ((parseFloat(o.dataset.angle) + p * 120) * Math.PI) / 180;
        o.style.opacity = (0.18 + 0.82 * Math.max(0, Math.sin(a)) * (0.55 + p * 0.6)).toFixed(3);
      }
    };
    const target = () => {
      const rect = el.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      return Math.min(1, Math.max(0, -rect.top / Math.max(runway, 1)));
    };
    const tick = () => {
      const t = target();
      if (current < 0) current = t;
      current += (t - current) * 0.1;
      if (Math.abs(t - current) < 0.0006) { current = t; apply(current); raf = 0; return; }
      apply(current);
      raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick); };
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake, { passive: true });
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className="bmd3d-runway">
      <div className="bmd3d-sticky">
        {/* THE WELL — everything in here lives in 3D space */}
        <div className="bmd3d-well" aria-hidden="true">
          {RINGS.map((ring, i) => (
            <div
              key={i}
              className="bmd3d-ring"
              style={{
                width: `calc(var(--wellR) * 2 * ${ring.r})`,
                height: `calc(var(--wellR) * 2 * ${ring.r})`,
                transform: `translate(-50%, -50%) translateZ(${ring.z}px) rotateZ(calc(var(--p) * ${ring.spin}deg))`,
              }}
            >
              {Array.from({ length: ring.ticks }).map((_, t) => (
                <span
                  key={t}
                  className="bmd3d-tick"
                  style={{ transform: `rotateZ(${(360 / ring.ticks) * t + i * 30}deg) translateX(calc(var(--wellR) * ${ring.r}))` }}
                />
              ))}
            </div>
          ))}

          {/* Marque brands riding the middle orbit, billboarded to camera */}
          {MARQUE_BRANDS.map((b, i) => (
            <Link
              key={b.slug}
              to={`/brands/${b.slug}`}
              className="bmd3d-orbiter"
              title={`${b.name} — brand profile`}
              data-angle={(360 / MARQUE_BRANDS.length) * i}
              style={{
                "--a": `${(360 / MARQUE_BRANDS.length) * i}deg`,
                transform: `translate(-50%, -50%)
                  rotateZ(calc(var(--a) + var(--p) * 120deg))
                  translateX(calc(var(--wellR) * 0.92))
                  rotateZ(calc(-1 * (var(--a) + var(--p) * 120deg)))
                  rotateX(calc(-1 * var(--tilt)))
                  translateZ(24px)`,
              }}
            >
              <LogoTile domain={b.domain} name={b.name} size={34} radius={10} src={b.src} />
            </Link>
          ))}

          {/* Depth fragments — undocumented brand matter, hanging in the well */}
          {DEPTH_FRAGMENTS.map((f) => (
            <span
              key={f.id}
              className={f.dot ? "bmd3d-frag bmd3d-frag-dot" : "bmd3d-frag"}
              style={{
                transform: `translate(-50%, -50%)
                  rotateZ(calc(${f.a}deg + var(--p) * ${f.dot ? 60 : 34}deg))
                  translateX(calc(var(--wellR) * ${f.rf}))
                  translateZ(${f.z}px)
                  rotateX(calc(-1 * var(--tilt)))`,
              }}
            />
          ))}

          {/* The core — mass at the center of the well */}
          <div className="bmd3d-core" />
          <div className="bmd3d-glow" />
        </div>

        {/* FOREGROUND — the pitch, riding gently above the machinery */}
        <div className="bmd3d-fore">
          {children}
        </div>

        <div className="bmd3d-cue">
          <span>Scroll</span>
          <span style={{ display: "block", marginTop: 2 }}>↓</span>
        </div>

        {/* Blend into the page below */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: 140, zIndex: 3, pointerEvents: "none",
          background: "linear-gradient(180deg, transparent, #000000)",
        }} />
      </div>
    </div>
  );
}

export const GRAVITY_WELL_COLORS = { ACCENT_BLUE, STARLIGHT, TITANIUM };
