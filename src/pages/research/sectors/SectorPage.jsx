import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { sectorBySlug } from "../../../lib/brandTaxonomy";
import { useBrandIndex, usePageMeta } from "./useBrandIndex";
import { buildSectors, sectorIntro, sectorMeta, listJoin, countLine, GRAVITY_NOTE, COUNT_NOTE } from "./sectorData";
import { Crumbs, ClosingCta, LoadState, ARCHETYPE_COLORS } from "./parts";
import "./sectors.css";

function Stat({ k, children }) {
  return (
    <div className="sx-stat">
      <div className="sx-stat-k">{k}</div>
      <div className="sx-stat-v">{children}</div>
    </div>
  );
}

// A brand's sector tags, primary first, exactly as sectorsOf reads them from
// the record's industry text. The sector being viewed is marked, not linked.
function SectorTags({ tags, current }) {
  if (!tags || tags.length < 2) return null;
  return (
    <div className="sx-tags" aria-label="Sector tags">
      {tags.map((t, i) => (t.slug === current
        ? <span key={t.slug} className="sx-tag sx-tag-on" aria-current="page" title={i === 0 ? "Primary sector" : undefined}>{t.name}</span>
        : <Link key={t.slug} to={`/sectors/${t.slug}`} className="sx-tag" title={i === 0 ? "Primary sector" : undefined}>{t.name}</Link>))}
    </div>
  );
}

function BrandRow({ r, current, showIndustry }) {
  return (
    <div className="sx-row">
      <div className="sx-dot" aria-hidden="true">
        {(r.colors.length ? r.colors : [{ hex: "#1a1a1a" }]).map((c, i) => <span key={i} style={{ background: c.hex }} />)}
      </div>
      <div style={{ minWidth: 0 }}>
        <Link to={`/brands/${r.slug}`} className="sx-row-name">{r.name}</Link>
        {r.tagline && <div className="sx-row-tag">&ldquo;{r.tagline}&rdquo;</div>}
        {showIndustry && r.industry && <div className="sx-row-ind">Industry on record: {r.industry}</div>}
        <SectorTags tags={r.sectors} current={current} />
      </div>
      <div className="sx-row-arch">
        {r.archetype
          ? <><Link to={`/archetypes/${r.archetype.slug}`}>{r.archetype.name}</Link>{r.expression && <span> · {r.expression.name}</span>}</>
          : <span style={{ color: "#8E8E93" }}>No archetype recorded</span>}
        {r.secondary && <span className="sx-sub">with <Link to={`/archetypes/${r.secondary.slug}`}>{r.secondary.name}</Link></span>}
      </div>
      <div className="sx-score" aria-label={r.gravity !== null ? `Gravity Score ${r.gravity} of 100` : "No Gravity Score"}>
        <div className="sx-score-track"><div className="sx-score-fill" style={{ width: `${r.gravity ?? 0}%` }} /></div>
        <span className="sx-score-n">{r.gravity ?? "–"}</span>
      </div>
    </div>
  );
}

function BrandLinks({ brands }) {
  return brands.map((b, i) => (
    <span key={b.slug}>
      <Link to={`/brands/${b.slug}`}>{b.name}</Link>{i < brands.length - 1 ? ", " : ""}
    </span>
  ));
}

export default function SectorPage() {
  const { slug } = useParams();
  const known = sectorBySlug(slug);
  const { brands, loading, error } = useBrandIndex();
  const { sectors } = useMemo(() => buildSectors(brands), [brands]);
  const d = sectors.find((s) => s.sector.slug === slug) || null;
  const meta = d ? sectorMeta(d) : { title: known ? `${known.name} Brands | BrandMD` : "Sector not found | BrandMD", description: "" };
  usePageMeta(meta.title, meta.description);

  const crumbs = [{ label: "Research", to: "/research" }, { label: "Sectors", to: "/sectors" }, { label: known?.name || "Unknown" }];

  if (!loading && !error && !d) {
    return (
      <div className="sx-page">
        <SiteNav />
        <div className="sx-wrap">
          <header className="sx-hero">
            <Crumbs items={crumbs} />
            <h1 className="sx-h1">{known ? `No ${known.name} brands yet` : "Sector not found"}</h1>
            <p className="sx-intro">{known ? "No brand in the BrandMD index falls in this sector yet." : "There is no sector at this address."} <Link to="/sectors" style={{ color: "#0071E3" }}>See every sector</Link>.</p>
          </header>
          <ClosingCta />
        </div>
      </div>
    );
  }

  const others = sectors.filter((s) => s.sector.slug !== slug);
  const quoted = d ? d.rows.filter((r) => r.positioning) : [];

  return (
    <div className="sx-page">
      <SiteNav />
      <div className="sx-wrap">
        <header className="sx-hero">
          <Crumbs items={crumbs} />
          <h1 className="sx-h1">{known?.name || "Sector"} <em>brands</em></h1>
          {d ? <p className="sx-intro">{sectorIntro(d)}</p> : <p className="sx-intro">Loading the sector from the BrandMD index.</p>}
          {d && (
            <div className="sx-stats">
              <Stat k="Primary brands">{d.n}<small>of {d.total} ({d.share}%)</small></Stat>
              <Stat k="Tagged brands">{d.tagged}<small>{d.also.length ? `${d.also.length} more by tag` : "no others by tag"}</small></Stat>
              <Stat k="Average Gravity">{d.avgGravity ?? "–"}<small>{d.minGravity !== null ? `range ${d.minGravity}–${d.maxGravity}` : ""}</small></Stat>
              <Stat k="Top archetype">
                {d.archetypeMix[0] ? <Link to={`/archetypes/${d.archetypeMix[0].slug}`}>{d.archetypeMix[0].name.replace("The ", "")}</Link> : "–"}
                {d.archetypeMix[0] && <small>{d.archetypeMix[0].count} of {d.n}</small>}
              </Stat>
            </div>
          )}
        </header>

        <LoadState loading={loading} error={error} />

        {d && (
          <>
            {/* The brands */}
            <section className="sx-section" aria-labelledby="sx-brands">
              <div className="sx-label">The brands</div>
              <h2 className="sx-h2" id="sx-brands">{d.n} primary brand{d.n === 1 ? "" : "s"}, by Gravity Score</h2>
              <p className="sx-note">Brands filed under {d.sector.name} as their primary sector. {GRAVITY_NOTE} Industries here, as recorded: {d.industries.join("; ")}.</p>
              <div className="sx-rows">
                {d.rows.map((r) => <BrandRow key={r.slug} r={r} current={d.sector.slug} />)}
              </div>
            </section>

            {/* Also in this sector (tagged, not primary) */}
            {d.also.length > 0 && (
              <section className="sx-section" aria-labelledby="sx-also">
                <div className="sx-label">Also in this sector</div>
                <h2 className="sx-h2" id="sx-also">{d.also.length} more brand{d.also.length === 1 ? "" : "s"} tagged {d.sector.name}</h2>
                <p className="sx-note">Their primary sector is elsewhere, but the industry text on their record also names {d.sector.name}. They are not counted in the archetype mix, Gravity, color or type figures on this page. {COUNT_NOTE}</p>
                <div className="sx-rows">
                  {d.also.map((r) => <BrandRow key={r.slug} r={r} current={d.sector.slug} showIndustry />)}
                </div>
              </section>
            )}

            {/* Archetype mix */}
            <section className="sx-section" aria-labelledby="sx-mix">
              <div className="sx-label">Archetype mix</div>
              <h2 className="sx-h2" id="sx-mix">Which archetypes {d.sector.name} brands play</h2>
              <p className="sx-note">The {d.n} primary brands, each counted once under its primary archetype. The blue bar is the share within this sector; the gray tick marks the same archetype's share across all {d.total} brands in the index.</p>
              <div className="sx-bars">
                {d.archetypeMix.map((a) => (
                  <div key={a.slug}>
                    <div className="sx-bar-head">
                      <Link to={`/archetypes/${a.slug}`}><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 8, background: ARCHETYPE_COLORS[a.slug] }} />{a.name}</Link>
                      <span>{a.count} of {d.n} ({a.share}%) · index {a.indexShare}%</span>
                    </div>
                    <div className="sx-bar-track">
                      <div className="sx-bar-fill" style={{ width: `${a.share}%` }} />
                      <div className="sx-bar-index" style={{ left: `calc(${a.indexShare}% - 1px)` }} title={`${a.indexCount} of ${d.total} across the index`} />
                    </div>
                    <div className="sx-bar-brands"><BrandLinks brands={a.brands} /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Color */}
            <section className="sx-section" aria-labelledby="sx-color">
              <div className="sx-label">Color patterns</div>
              <h2 className="sx-h2" id="sx-color">The palettes, side by side</h2>
              <p className="sx-note">Primary, secondary and accent colors exactly as recorded. Color families are computed from each hex value's hue and lightness, not from what the brand calls the color.</p>
              <div className="sx-swatches" style={{ marginBottom: 24 }}>
                {d.rows.filter((r) => r.colors.length).map((r) => (
                  <Link key={r.slug} to={`/brands/${r.slug}`} className="sx-sw">
                    <div className="sx-sw-strip" aria-hidden="true">{r.colors.map((c, i) => <span key={i} style={{ background: c.hex }} />)}</div>
                    <div className="sx-sw-name">{r.name}</div>
                    <div className="sx-sw-hex">{r.colors.map((c) => c.hex).join(" ")}</div>
                  </Link>
                ))}
              </div>
              <div className="sx-two">
                <div className="sx-panel">
                  <h3>Primary color families</h3>
                  <p>Across the {d.withPrimaryCount} brands in this sector with a recorded primary color.</p>
                  {d.primaryFamilies.map((f) => (
                    <div key={f.key} className="sx-fam">
                      <i style={{ background: f.swatch }} />
                      <div>{f.name}</div>
                      <span>{f.count} of {d.withPrimaryCount}</span>
                      <div className="sx-fam-who">{f.brands.join(", ")}</div>
                    </div>
                  ))}
                </div>
                <div className="sx-panel">
                  <h3>Every recorded color</h3>
                  <p>All {d.colorTotal} primary, secondary and accent values in the sector, by family.</p>
                  {d.paletteFamilies.map((f) => (
                    <div key={f.key} className="sx-fam">
                      <i style={{ background: f.swatch }} />
                      <div>{f.name}</div>
                      <span>{f.count} of {d.colorTotal}</span>
                    </div>
                  ))}
                  {d.sharedHexes.length > 0 && (
                    <>
                      <h3 style={{ marginTop: 18 }}>Exact matches</h3>
                      <p>The same hex value recorded by more than one brand here (pure white and black left out).</p>
                      <div className="sx-chips">
                        {d.sharedHexes.map((h) => (
                          <span key={h.hex} className="sx-chip"><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 6, background: h.hex, border: "1px solid rgba(255,255,255,0.15)" }} /><b>{h.hex}</b> {listJoin(h.brands)}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Type and tone */}
            {(d.withFontsCount > 0 || d.sharedTone.length > 0) && (
              <section className="sx-section" aria-labelledby="sx-type">
                <div className="sx-label">Type and tone</div>
                <h2 className="sx-h2" id="sx-type">Typefaces and shared tone words</h2>
                <div className="sx-two">
                  {d.withFontsCount > 0 && (
                    <div className="sx-panel">
                      <h3>Typefaces on record</h3>
                      <p>{d.withFontsCount} of the {d.n} brands here have typefaces recorded.{d.sharedFonts.length ? ` Shared by more than one: ${d.sharedFonts.map((f) => `${f.name} (${listJoin(f.brands)})`).join("; ")}.` : " No typeface is recorded by more than one of them."}</p>
                      <ul className="sx-fontlist">
                        {d.rows.filter((r) => r.fonts.length).map((r) => (
                          <li key={r.slug}>
                            <Link to={`/brands/${r.slug}`}>{r.name}</Link>
                            <span>{r.fonts.map((f) => `${f.role}: ${f.name}`).join(" · ")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {d.sharedTone.length > 0 && (
                    <div className="sx-panel">
                      <h3>Tone words used by more than one brand</h3>
                      <p>Exact tone attributes (three words or fewer) that appear in two or more of these brands' records.</p>
                      <div className="sx-chips">
                        {d.sharedTone.map((t) => <span key={t.word} className="sx-chip"><b>{t.word}</b> {listJoin(t.brands)}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* How they differ */}
            {quoted.length > 0 && (
              <section className="sx-section" aria-labelledby="sx-differ">
                <div className="sx-label">How they differ</div>
                <h2 className="sx-h2" id="sx-differ">From their BrandMD records</h2>
                <p className="sx-note">One positioning line per brand from its BrandMD record. These lines are BrandMD's own research summaries, not statements by the brands, and sentences carrying figures or naming other brands are left out.</p>
                <div className="sx-quotes">
                  {quoted.map((r) => (
                    <figure key={r.slug} className="sx-quote">
                      <div className="sx-quote-who">
                        <i style={{ background: r.colors[0]?.hex || "#8E8E93" }} />
                        <Link to={`/brands/${r.slug}`}>{r.name}</Link>
                      </div>
                      <p>{r.positioning}</p>
                      <figcaption>From {r.name}'s BrandMD record (competitive positioning)</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {/* Same-category pairs */}
            {d.rivals.length > 0 && (
              <section className="sx-section" aria-labelledby="sx-pairs">
                <div className="sx-label">Same category</div>
                <h2 className="sx-h2" id="sx-pairs">Brands here that sell the same thing</h2>
                <p className="sx-note">Curated pairs in this sector whose recorded industries put them in the same category.</p>
                <div className="sx-pairs">
                  {d.rivals.map((p) => (
                    <div key={`${p.a.slug}-${p.b.slug}`} className="sx-pair">
                      <Link to={`/brands/${p.a.slug}`}>{p.a.name}</Link>
                      <span>and</span>
                      <Link to={`/brands/${p.b.slug}`}>{p.b.name}</Link>
                      <span>· {p.basis}</span>
                      <Link to={p.battle} style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: "#F5F5F7", textDecoration: "underline", textDecorationColor: "#0071E3", textUnderlineOffset: 3 }}>Side by side →</Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other sectors */}
            <section className="sx-section" aria-labelledby="sx-other">
              <div className="sx-label">Keep exploring</div>
              <h2 className="sx-h2" id="sx-other">Other sectors</h2>
              <div className="sx-others" style={{ marginTop: 16 }}>
                {others.map((o) => <Link key={o.sector.slug} to={`/sectors/${o.sector.slug}`} title={countLine(o)}>{o.sector.name} · {o.n} primary</Link>)}
                <Link to="/sectors">All sectors</Link>
                <Link to={`/brands?sector=${d.sector.slug}`}>{d.sector.name} in the Library</Link>
                <Link to="/archetypes">Brands by archetype</Link>
                <Link to="/research">All research</Link>
              </div>
            </section>
          </>
        )}

        <ClosingCta heading={d ? `Chart your brand next to ${d.sector.name}` : undefined} />
      </div>
    </div>
  );
}
