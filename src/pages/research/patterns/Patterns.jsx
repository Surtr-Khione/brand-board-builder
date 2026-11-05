import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { searchBrands } from "../../../lib/brands";
import { computePatterns, COLOR_FAMILIES } from "./patternsData.js";
import "./patterns.css";

export const PATTERNS_TITLE = "Patterns of the Greats: Color, Type & Archetypes | BrandMD";

// The whole index fits in one page today (search-brands caps limit at 100);
// keep paging in case it grows.
async function loadAllBrands() {
  const all = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const data = await searchBrands({ limit: 100, offset });
    const rows = Array.isArray(data?.brands) ? data.brands : [];
    all.push(...rows);
    if (rows.length < 100) break;
  }
  return all;
}

const pct = (k, n) => (n ? Math.round((k / n) * 100) : 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function BrandChips({ brands, extra }) {
  return (
    <div className="pt-chips">
      {brands.map((b) => (
        <Link key={b.slug} to={`/brands/${b.slug}`} className="pt-chip">
          {b.name}{extra && extra(b) ? <small>{extra(b)}</small> : null}
        </Link>
      ))}
    </div>
  );
}

function Row({ name, sub, to, count, max, detail, alt }) {
  const w = max ? Math.max(2, (count / max) * 100) : 0;
  return (
    <div className="pt-row">
      {to ? (
        <Link to={to} className="pt-row-name">{name}{sub && <span className="pt-row-sub">{sub}</span>}</Link>
      ) : (
        <div className="pt-row-name">{name}{sub && <span className="pt-row-sub">{sub}</span>}</div>
      )}
      <div className="pt-track" aria-hidden="true"><div className={`pt-fill${alt ? " alt" : ""}`} style={{ width: `${count ? w : 0}%` }} /></div>
      <div className="pt-count">{count}</div>
      {detail && <div className="pt-row-detail">{detail}</div>}
    </div>
  );
}

function Split({ parts, label }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  return (
    <div className="pt-split" role="img" aria-label={label}>
      {parts.filter((p) => p.value).map((p) => (
        <div key={p.name} style={{ width: `${(p.value / total) * 100}%`, background: p.bg, color: p.fg }}>
          {pct(p.value, total) >= 12 ? `${p.name} ${pct(p.value, total)}%` : ""}
        </div>
      ))}
    </div>
  );
}

function Histogram({ buckets, N, mean }) {
  const W = 640, H = 250, padL = 34, padB = 34, padT = 46;
  const maxC = Math.max(1, ...buckets.map((b) => b.count));
  const bw = (W - padL - 10) / buckets.length;
  const label = `Gravity Score histogram across the ${N} brands in the BrandMD index: ${buckets.map((b) => `${b.count} scored ${b.score}`).join(", ")}.`;
  return (
    <svg className="pt-hist" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      {[0, 0.5, 1].map((f) => {
        const y = padT + (H - padT - padB) * (1 - f);
        return (
          <g key={f}>
            <line x1={padL} x2={W - 6} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={padL - 8} y={y + 4} fontSize="10" fill="#8E8E93" textAnchor="end">{Math.round(maxC * f)}</text>
          </g>
        );
      })}
      {buckets.map((b, i) => {
        const h = ((H - padT - padB) * b.count) / maxC;
        const x = padL + i * bw + bw * 0.14;
        const y = H - padB - h;
        return (
          <g key={b.score}>
            <rect x={x} y={y} width={bw * 0.72} height={Math.max(h, b.count ? 2 : 0)} rx="5" fill={b.score >= 90 ? "#0071E3" : "#3a3a3c"} />
            {b.count > 0 && <text x={x + bw * 0.36} y={y - 7} fontSize="12" fontWeight="700" fill="#F5F5F7" textAnchor="middle">{b.count}</text>}
            <text x={x + bw * 0.36} y={H - padB + 18} fontSize="11" fill="#8E8E93" textAnchor="middle">{b.score}</text>
          </g>
        );
      })}
      {Number.isFinite(mean) && buckets.length > 0 && (() => {
        // Scores are multiples of 5, so bucket i is centered on score lo + 5i.
        const lo = buckets[0].score;
        const xm = padL + ((mean - lo) / 5) * bw + bw * 0.5;
        return (
          <g>
            <line x1={xm} x2={xm} y1={20} y2={H - padB} stroke="#F5F5F7" strokeDasharray="3 4" strokeOpacity="0.5" />
            <text x={xm + 6} y={16} fontSize="10.5" fill="#C7C7CC">mean {mean}</text>
          </g>
        );
      })()}
    </svg>
  );
}

export default function Patterns() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = PATTERNS_TITLE;
    let alive = true;
    loadAllBrands()
      .then((r) => { if (alive) { setRows(r); if (!r.length) setError(true); } })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  const P = useMemo(() => (rows && rows.length ? computePatterns(rows) : null), [rows]);
  const N = P?.N;
  const across = N ? `across the ${N} brands in the BrandMD index` : "";

  return (
    <div className="pt-page">
      <SiteNav />
      <header className="pt-hero">
        <div className="pt-eyebrow"><Link to="/research">Research</Link> · Patterns</div>
        <h1 className="pt-h1">Patterns <span>of the Greats</span></h1>
        <p className="pt-intro">
          What do the brands in the BrandMD index have in common? This page counts it: the colors they
          lead with, the typefaces on record, the archetypes they play, the enemies they name, the values
          they commit to, and what the highest Gravity Scores share. Every number is computed from the
          brand records{N ? `, ${across}` : ""}, and every brand links to its full system.
        </p>
        <nav className="pt-jump" aria-label="Sections">
          <a href="#color">Color</a><a href="#type">Type</a><a href="#archetypes">Archetypes</a>
          <a href="#enemies">Enemies</a><a href="#values">Values</a><a href="#gravity">Gravity</a>
        </nav>
      </header>

      <main className="pt-wrap">
        {!P && !error && <>{[0, 1, 2].map((i) => <div key={i} className="pt-skel" />)}</>}
        {error && !P && (
          <div className="pt-error">The brand index could not be loaded right now. <Link to="/brands" style={{ color: "#0071E3" }}>Browse the library</Link> instead.</div>
        )}
        {P && <Body P={P} N={N} across={across} />}

        <aside className="pt-cta">
          <h2>Where does your brand sit?</h2>
          <p>Chart your own brand on the same lens these brands are charted on, or scan your live site to see its colors, type, voice and archetype in under a minute.</p>
          <div className="pt-btns">
            <Link to="/builder" className="pt-btn primary">Chart your brand</Link>
            <Link to="/analyzer" className="pt-btn ghost">Scan your site</Link>
          </div>
          <nav className="pt-more" aria-label="More research">
            <Link to="/research">All research</Link>
            <Link to="/archetypes">Archetypes</Link>
            <Link to="/sectors">Sectors</Link>
            <Link to="/brands">The Brand Index</Link>
          </nav>
        </aside>
      </main>
    </div>
  );
}

function Body({ P, N, across }) {
  const { color, type, archetype, enemy, values, gravity } = P;
  const famMax = Math.max(1, ...color.families.map((f) => f.count));
  const archMax = Math.max(1, ...archetype.list.map((a) => Math.max(a.count, a.secondaryCount)));
  const enemyMax = Math.max(1, ...enemy.themes.map((t) => t.count));
  const valueMax = Math.max(1, ...values.themes.map((t) => t.count));
  const famName = Object.fromEntries(COLOR_FAMILIES.map((f) => [f.slug, f.name]));
  const topArch = archetype.list[0];
  const differs = gravity.signalGap.filter((s) => s.topPct !== s.restPct);
  const universal = gravity.signalGap.filter((s) => s.topPct === 100 && s.restPct === 100);
  const none = gravity.signalGap.filter((s) => s.top === 0 && s.rest === 0);
  const ds = type.displayStyle;

  return (
    <>
      {/* ── COLOR ── */}
      <section id="color" className="pt-section" aria-labelledby="h-color">
        <div className="pt-label">01 · Color</div>
        <h2 id="h-color" className="pt-h2">{color.families[1] ? `${famName[color.families[0].slug].split(" ")[0]} and ${color.families[1].slug} lead` : "Primary colors"}</h2>
        <p className="pt-lede">
          Each brand's primary color, sorted into color families by hue and lightness, {across}.
          {color.families[0] && <> {famName[color.families[0].slug]} is the most common family ({color.families[0].count} of {color.withPrimary} primaries), then {famName[color.families[1]?.slug]} ({color.families[1]?.count}).</>}
        </p>

        <div className="pt-stats">
          <div className="pt-stat"><b>{color.darkPct}%</b><span>of primary colors are dark ({color.darkCount} of {color.withPrimary})</span></div>
          <div className="pt-stat"><b>{color.lightCount}</b><span>brands lead with a light primary color</span></div>
          <div className="pt-stat"><b>{color.families.filter((f) => f.count).length}</b><span>of {COLOR_FAMILIES.length} color families used as a primary</span></div>
          <div className="pt-stat"><b>{color.repeatedHexes.length}</b><span>exact hex values shared by two or more brands</span></div>
        </div>

        <h3 className="pt-h3">Dark vs light primary colors</h3>
        <Split
          label={`${color.darkCount} dark and ${color.lightCount} light primary colors ${across}`}
          parts={[
            { name: "Dark", value: color.darkCount, bg: "#1c1c1e", fg: "#F5F5F7" },
            { name: "Light", value: color.lightCount, bg: "#E5E5EA", fg: "#1c1c1e" },
          ]}
        />
        <p className="pt-note">"Dark" means a WCAG relative luminance under 0.179, the point where white text reads better on the color than black text does. Saturated reds and blues often count as dark by this measure.</p>

        <h3 className="pt-h3">Primary color families</h3>
        <div className="pt-card">
          <div className="pt-rows">
            {color.families.filter((f) => f.count).map((f) => (
              <Row
                key={f.slug}
                name={f.name}
                sub={`${f.allRoles} of ${color.allColorCount} colors in any role`}
                count={f.count}
                max={famMax}
                detail={
                  <div className="pt-swatches">
                    {f.brands.map((b) => (
                      <Link key={b.slug} to={`/brands/${b.slug}`} className="pt-sw" style={{ background: b.hex }} title={`${b.name} ${b.hex}`} aria-label={`${b.name}, primary color ${b.hex}`} />
                    ))}
                  </div>
                }
              />
            ))}
          </div>
        </div>
        <p className="pt-note">
          Families: {COLOR_FAMILIES.map((f) => `${f.name} (${f.rule})`).join("; ")}. "Any role" counts the primary, secondary and accent colors on record ({color.allColorCount} in all){color.families.find((f) => f.slug === "white" && f.allRoles) ? `; white and off-white appears ${color.families.find((f) => f.slug === "white").allRoles} times, never as a primary` : ""}. Hover or focus a swatch for the brand and hex.
        </p>

        {color.repeatedHexes.length > 0 && (
          <>
            <h3 className="pt-h3">The same hex, different brands</h3>
            <div className="pt-card">
              {color.repeatedHexes.map((h) => (
                <div key={h.hex} className="pt-hexrow">
                  <span className="pt-sw" style={{ background: h.hex }} aria-hidden="true" />
                  <span className="pt-hex">{h.hex}</span>
                  <BrandChips brands={h.brands} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── TYPE ── */}
      <section id="type" className="pt-section" aria-labelledby="h-type">
        <div className="pt-label">02 · Type</div>
        <h2 id="h-type" className="pt-h2">{ds.sans.length > ds.serif.length ? "Mostly sans-serif display type" : "Display type on record"}</h2>
        <p className="pt-lede">
          {type.withFont} of the {N} brands in the BrandMD index have at least one typeface on record
          ({pct(type.withFont, N)}%), naming {type.faceCount} distinct faces between them. The figures below
          count those {type.withFont} brands only; the rest are left out rather than guessed.
        </p>

        <div className="pt-grid2" style={{ marginTop: 22 }}>
          <div className="pt-card">
            <div className="pt-label" style={{ marginBottom: 6 }}>Display typeface style</div>
            <Split
              label={`Display typefaces: ${ds.sans.length} sans-serif, ${ds.serif.length} serif, ${ds.unclassified.length} unclassified`}
              parts={[
                { name: "Sans", value: ds.sans.length, bg: "#0071E3", fg: "#fff" },
                { name: "Serif", value: ds.serif.length, bg: "#8E8E93", fg: "#000" },
                { name: "Other", value: ds.unclassified.length, bg: "#2c2c2e", fg: "#C7C7CC" },
              ]}
            />
            <div className="pt-legend">
              <span><i style={{ background: "#0071E3" }} />Sans-serif {ds.sans.length}</span>
              <span><i style={{ background: "#8E8E93" }} />Serif {ds.serif.length}</span>
              <span><i style={{ background: "#2c2c2e" }} />Unclassified {ds.unclassified.length}</span>
            </div>
            {ds.serif.length > 0 && (
              <p className="pt-note">Serif display faces: {ds.serif.map((b, i) => <span key={b.slug}>{i ? ", " : ""}<Link to={`/brands/${b.slug}`} style={{ color: "#C7C7CC" }}>{b.name}</Link> ({b.face})</span>)}.</p>
            )}
          </div>
          <div className="pt-card">
            <div className="pt-label" style={{ marginBottom: 6 }}>A typeface of their own</div>
            <p className="pt-lede" style={{ fontSize: 14 }}>
              <b style={{ color: "#F5F5F7" }}>{type.own.length} of {type.withFont}</b> brands with type on record use a face that carries the brand's own name or that the record calls proprietary or custom.
            </p>
            <BrandChips brands={type.own} extra={(b) => b.face} />
          </div>
        </div>

        {type.shared.length > 0 && (
          <>
            <h3 className="pt-h3">Typefaces named by more than one brand</h3>
            <div className="pt-card">
              <div className="pt-rows">
                {type.shared.map((f) => (
                  <Row key={f.name} name={f.name} sub={f.style ? (f.style === "sans" ? "Sans-serif" : "Serif") : "Unclassified"} count={f.brands.length} max={type.shared[0].brands.length} alt
                    detail={<BrandChips brands={f.brands} extra={(b) => b.role} />} />
                ))}
              </div>
            </div>
          </>
        )}
        <p className="pt-note">Display = the primary font field; body and accent fonts count toward "named by more than one brand". Style is the classification of the typeface family itself (for example Georgia is a serif); faces not in our classification table stay unclassified.</p>
      </section>

      {/* ── ARCHETYPES ── */}
      <section id="archetypes" className="pt-section" aria-labelledby="h-arch">
        <div className="pt-label">03 · Archetypes</div>
        <h2 id="h-arch" className="pt-h2">{topArch ? `${topArch.name} leads the index` : "Archetype distribution"}</h2>
        <p className="pt-lede">
          Primary archetype of each brand, mapped onto the 12 Jungian archetypes, {across}.
          {topArch && <> {topArch.name} is the most common primary ({topArch.count} brands); {archetype.list.filter((a) => a.count <= 2).map((a) => a.name).join(", ")} each have two or fewer.</>}
        </p>
        <div className="pt-card" style={{ marginTop: 20 }}>
          <div className="pt-legend" style={{ marginBottom: 10 }}>
            <span><i style={{ background: "#0071E3" }} />Primary archetype</span>
            <span><i style={{ background: "#8E8E93" }} />Secondary archetype</span>
          </div>
          <div className="pt-rows">
            {archetype.list.map((a) => (
              <div key={a.slug} className="pt-row">
                <Link to={`/archetypes/${a.slug}`} className="pt-row-name">{a.name}<span className="pt-row-sub">{a.secondaryCount} as secondary</span></Link>
                <div style={{ display: "grid", gap: 4 }} aria-hidden="true">
                  <div className="pt-track"><div className="pt-fill" style={{ width: `${a.count ? Math.max(2, (a.count / archMax) * 100) : 0}%` }} /></div>
                  <div className="pt-track" style={{ height: 5 }}><div className="pt-fill alt" style={{ width: `${a.secondaryCount ? Math.max(2, (a.secondaryCount / archMax) * 100) : 0}%` }} /></div>
                </div>
                <div className="pt-count">{a.count}</div>
                {a.brands.length > 0 && (
                  <details className="pt-details pt-row-detail">
                    <summary>{plural(a.count, "brand", "brands")}</summary>
                    <BrandChips brands={a.brands} />
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {archetype.topPairs.length > 0 && (
          <>
            <h3 className="pt-h3">The most common primary + secondary pairs</h3>
            <div className="pt-grid2">
              {archetype.topPairs.slice(0, 6).map((p) => (
                <div key={`${p.primary}-${p.secondary}`} className="pt-card">
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    <Link to={`/archetypes/${p.primary}`} style={{ textDecoration: "none" }}>{p.primaryName}</Link>
                    <span style={{ color: "#8E8E93", fontWeight: 500 }}> + </span>
                    <Link to={`/archetypes/${p.secondary}`} style={{ textDecoration: "none", color: "#8E8E93" }}>{p.secondaryName}</Link>
                  </div>
                  <div style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>{plural(p.brands.length, "brand", "brands")}</div>
                  <BrandChips brands={p.brands} />
                </div>
              ))}
            </div>
          </>
        )}
        <p className="pt-note">{archetype.withSecondary} of {N} records name a secondary archetype distinct from the primary. Free-text labels ("The Caretaker", hybrids) are mapped onto the 12 by the same taxonomy used across BrandMD.</p>
      </section>

      {/* ── ENEMIES ── */}
      <section id="enemies" className="pt-section" aria-labelledby="h-enemy">
        <div className="pt-label">04 · Enemies</div>
        <h2 id="h-enemy" className="pt-h2">What the greats fight</h2>
        <p className="pt-lede">
          {enemy.withEnemy} of the {N} brands in the BrandMD index name an enemy: the status quo, belief or
          force the brand positions itself against. These themes count the enemy statements that use the
          listed words. A statement can land in more than one theme.
        </p>
        <div className="pt-card" style={{ marginTop: 20 }}>
          <div className="pt-rows">
            {enemy.themes.map((t) => (
              <Row key={t.slug} name={t.name} sub={`words: ${t.words.join(", ")}`} count={t.count} max={enemyMax}
                detail={t.brands.length > 0 && (
                  <details className="pt-details">
                    <summary>Show the {plural(t.count, "enemy", "enemies")}</summary>
                    <ul className="pt-quotes">
                      {t.brands.map((b) => <li key={b.slug}><Link to={`/brands/${b.slug}`}>{b.name}</Link>: {b.enemy}</li>)}
                    </ul>
                  </details>
                )} />
            ))}
          </div>
        </div>

        {enemy.named.length > 0 && (
          <>
            <h3 className="pt-h3">Enemies with a name of their own</h3>
            <p className="pt-note" style={{ marginTop: 0 }}>Short names from the start of each enemy statement, as recorded.</p>
            <div className="pt-enemy-cloud">
              {enemy.named.map((e) => (
                <Link key={e.slug} to={`/brands/${e.slug}`}>{e.enemy}<small>{e.name}</small></Link>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── VALUES ── */}
      <section id="values" className="pt-section" aria-labelledby="h-values">
        <div className="pt-label">05 · Values</div>
        <h2 id="h-values" className="pt-h2">What the greats commit to</h2>
        <p className="pt-lede">
          {values.withValues} of the {N} brands in the BrandMD index list core values, {values.valueCount} values in all.
          Each theme counts the brands with at least one value whose name uses the listed words.
          {values.themes[0] && <> The most common: {values.themes[0].name.toLowerCase()}, named by {values.themes[0].count} brands.</>}
        </p>
        <div className="pt-card" style={{ marginTop: 20 }}>
          <div className="pt-rows">
            {values.themes.map((t) => (
              <Row key={t.slug} name={t.name} sub={`words: ${t.words.join(", ")}`} count={t.count} max={valueMax} alt
                detail={t.brands.length > 0 && (
                  <details className="pt-details">
                    <summary>Show the values</summary>
                    <ul className="pt-quotes">
                      {t.brands.map((b) => <li key={b.slug}><Link to={`/brands/${b.slug}`}>{b.name}</Link>: {b.value}</li>)}
                    </ul>
                  </details>
                )} />
            ))}
          </div>
        </div>
      </section>

      {/* ── GRAVITY ── */}
      <section id="gravity" className="pt-section" aria-labelledby="h-gravity">
        <div className="pt-label">06 · Gravity</div>
        <h2 id="h-gravity" className="pt-h2">What the highest scores share</h2>
        <p className="pt-lede">
          The Gravity Score measures how much of a coherent, documented identity is on record for a brand,
          from 0 to 100 across 19 weighted signals. It describes the profile, not how successful the
          business is. Distribution {across}:
        </p>
        <div className="pt-stats">
          <div className="pt-stat"><b>{gravity.mean}</b><span>mean score</span></div>
          <div className="pt-stat"><b>{gravity.median}</b><span>median score</span></div>
          <div className="pt-stat"><b>{gravity.min}–{gravity.max}</b><span>lowest to highest</span></div>
          <div className="pt-stat"><b>{gravity.top.length}</b><span>brands score {gravity.topThreshold} or more</span></div>
        </div>
        <div className="pt-card" style={{ marginTop: 14 }}>
          <Histogram buckets={gravity.buckets} N={N} mean={gravity.mean} />
        </div>

        <h3 className="pt-h3">The {gravity.top.length} brands at {gravity.topThreshold}+</h3>
        <BrandChips brands={gravity.top} extra={(b) => b.score} />
        {(gravity.topArchetypes.length > 0 || gravity.topSectors.length > 0) && (
          <p className="pt-note">
            Their primary archetypes: {gravity.topArchetypes.map((a, i) => <span key={a.slug}>{i ? ", " : ""}<Link to={`/archetypes/${a.slug}`} style={{ color: "#C7C7CC" }}>{a.name}</Link> {a.count}</span>)}.
            {" "}Their sectors: {gravity.topSectors.map((s, i) => <span key={s.slug}>{i ? ", " : ""}<Link to={`/sectors/${s.slug}`} style={{ color: "#C7C7CC" }}>{s.name}</Link> {s.count}</span>)}.
          </p>
        )}

        <h3 className="pt-h3">Where the top {gravity.top.length} differ from the other {gravity.restCount}</h3>
        <p className="pt-lede" style={{ fontSize: 14 }}>
          Share of each group whose record meets the signal, largest gap first.{differs[0] && <> The widest: {differs.slice(0, 3).map((x) => `${x.label.toLowerCase()} (${x.topPct}% vs ${x.restPct}%)`).join(", ")}.</>}
        </p>
        <div className="pt-card" style={{ marginTop: 12 }}>
          <div className="pt-legend" style={{ marginBottom: 8 }}>
            <span><i style={{ background: "#0071E3" }} />Top {gravity.top.length} (score {gravity.topThreshold}+)</span>
            <span><i style={{ background: "#8E8E93" }} />Other {gravity.restCount}</span>
          </div>
          {differs.map((s) => (
            <div key={s.label} className="pt-sig">
              <div className="pt-sig-name">{s.label}</div>
              <div className="pt-sig-bars" role="img" aria-label={`${s.label}: ${s.topPct}% of the top group, ${s.restPct}% of the rest`}>
                <div className="pt-sig-bar"><div className="pt-track"><div className="pt-fill" style={{ width: `${s.topPct}%` }} /></div><span>{s.topPct}%</span></div>
                <div className="pt-sig-bar"><div className="pt-track"><div className="pt-fill alt" style={{ width: `${s.restPct}%` }} /></div><span>{s.restPct}%</span></div>
              </div>
            </div>
          ))}
        </div>
        <p className="pt-note">
          {universal.length > 0 && <>Met by every brand in the index, so no difference: {universal.map((s) => s.label).join(", ")}. </>}
          {none.length > 0 && <>Met by none: {none.map((s) => s.label).join(", ")}. </>}
          See any brand's own breakdown on its page, or <Link to="/analyzer" style={{ color: "#0071E3" }}>score your own site</Link>.
        </p>
      </section>
    </>
  );
}
