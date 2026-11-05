import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { modelBySlug, expressionHref, sectorHref, shortArchetypeName } from "../../../lib/brandTaxonomy";
import { buildModels, modelIntro, modelMeta, modelHrefOf, termsNote, inlineName, baseLine, industryParts, listJoin, plural, GRAVITY_NOTE } from "./modelData";
import { useModelIndex, usePageMeta, Crumbs, ClosingCta, LoadState, Face, BrandLinks, ARCHETYPE_COLORS } from "./parts";
import "./models.css";

function Stat({ k, children }) {
  return (
    <div className="mx-stat">
      <div className="mx-stat-k">{k}</div>
      <div className="mx-stat-v">{children}</div>
    </div>
  );
}

function ArchetypeCell({ a, exprCounts }) {
  if (!a) return <span style={{ color: "#8E8E93" }}>No archetype recorded</span>;
  const exprHref = a.expression ? expressionHref(a.family.slug, a.expression, exprCounts) : null;
  return (
    <>
      <Link to={`/archetypes/${a.family.slug}`}>{shortArchetypeName(a.family.name)}</Link>
      {a.expression && <> · {exprHref ? <Link to={exprHref}>{a.expression.name}</Link> : a.expression.name}</>}
      {a.blend.length > 0 && (
        <span className="mx-sub">with {a.blend.map((x, i) => (
          <span key={x.family.slug}><Link to={`/archetypes/${x.family.slug}`}>{shortArchetypeName(x.family.name)}</Link>{i < a.blend.length - 1 ? ", " : ""}</span>
        ))}</span>
      )}
      {a.mapped && <span className="mx-mapped">{a.mappedNote}</span>}
    </>
  );
}

export default function ModelPage() {
  const { slug } = useParams();
  const known = modelBySlug(slug);
  const { brands, loading, error } = useModelIndex();
  const b = useMemo(() => buildModels(brands), [brands]);
  const d = b.models.find((m) => m.model.slug === slug && m.hasPage) || null;
  const meta = d ? modelMeta(d) : { title: known ? `${known.name} Brands | BrandMD` : "Business model not found | BrandMD", description: "" };
  usePageMeta(meta.title, meta.description);

  const crumbs = [{ label: "Research", to: "/research" }, { label: "Business models", to: "/models" }, { label: known?.name || "Unknown" }];

  if (!loading && !error && !d) {
    return (
      <div className="mx-page">
        <SiteNav />
        <div className="mx-wrap">
          <header className="mx-hero">
            <Crumbs items={crumbs} />
            <h1 className="mx-h1">{known ? `Not enough ${known.name} brands yet` : "Business model not found"}</h1>
            <p className="mx-intro">{known ? "A business model gets its own page once two or more brands in the BrandMD index carry its tag." : "There is no business model at this address."} <Link to="/models" style={{ color: "#0071E3" }}>See every business model</Link>.</p>
          </header>
          <ClosingCta />
        </div>
      </div>
    );
  }

  const others = b.models.filter((m) => m.model.slug !== slug && m.n > 0);

  return (
    <div className="mx-page">
      <SiteNav />
      <div className="mx-wrap">
        <header className="mx-hero">
          <Crumbs items={crumbs} />
          <h1 className="mx-h1">{known?.name || "Business model"} <em>brands</em></h1>
          {d ? <p className="mx-intro">{modelIntro(d)}</p> : <p className="mx-intro">Loading the business model from the BrandMD index.</p>}
          {d && (
            <>
              <div className="mx-source">
                <b>BrandMD's definition:</b> {d.model.definition}<br />
                <b>In these records:</b> {termsNote(d)}
              </div>
              <div className="mx-stats">
                <Stat k="Brands">{d.n}<small>of {d.total} ({d.share}%)</small></Stat>
                <Stat k="Gravity range">{d.minGravity !== null ? `${d.minGravity}–${d.maxGravity}` : "–"}<small>{d.avgGravity !== null ? `average ${d.avgGravity}` : ""}</small></Stat>
                {(() => {
                  const top = d.archetypeMix[0];
                  const tied = top ? d.archetypeMix.filter((a) => a.count === top.count) : [];
                  if (tied.length > 1) {
                    return <Stat k="Top families">{tied.length}-way tie<small>{tied.map((a) => shortArchetypeName(a.name)).join(", ")}: {top.count} each</small></Stat>;
                  }
                  return (
                    <Stat k="Top family">
                      {top ? <Link to={`/archetypes/${top.slug}`}>{shortArchetypeName(top.name)}</Link> : "–"}
                      {top && <small>{top.count} of {d.n}</small>}
                    </Stat>
                  );
                })()}
                <Stat k="Sectors spanned">{d.sectorMix.length}<small>{d.multiSector ? `${d.multiSector} multi-sector` : ""}</small></Stat>
              </div>
            </>
          )}
        </header>

        <LoadState loading={loading} error={error} />

        {d && (
          <>
            {/* The brands */}
            <section className="mx-section" aria-labelledby="mx-brands">
              <div className="mx-label">The brands</div>
              <h2 className="mx-h2" id="mx-brands">{plural(d.n, "brand")} tagged {d.model.name}, by Gravity Score</h2>
              <p className="mx-note">Each brand's industry line is shown as its record lists it; the highlighted words are the ones the tag was read from. {GRAVITY_NOTE}</p>
              <div className="mx-rows">
                {d.brands.map((r) => {
                  const ip = industryParts(r.industry, r.term);
                  return (
                    <div className="mx-row" key={r.slug}>
                      <Face row={r} />
                      <div style={{ minWidth: 0 }}>
                        <Link to={`/brands/${r.slug}`} className="mx-row-name">{r.name}</Link>
                        {r.tagline && <div className="mx-row-tag">&ldquo;{r.tagline}&rdquo;</div>}
                        <div className="mx-ind">Industry: {ip.before}{ip.term && <mark>{ip.term}</mark>}{ip.after}</div>
                      </div>
                      <div className="mx-row-arch">
                        <ArchetypeCell a={r.archetype} exprCounts={b.exprCounts} />
                        {r.sectors.length > 0 && (
                          <div className="mx-tags" aria-label="Sector tags">
                            {r.sectors.map((s) => {
                              const href = sectorHref(s.slug);
                              return href ? <Link key={s.slug} to={href} className="mx-tag">{s.name}</Link> : <span key={s.slug} className="mx-tag">{s.name}</span>;
                            })}
                          </div>
                        )}
                      </div>
                      <div className="mx-score" aria-label={r.gravity !== null ? `Gravity Score ${r.gravity} of 100` : "No Gravity Score"}>
                        <div className="mx-score-track"><div className="mx-score-fill" style={{ width: `${r.gravity ?? 0}%` }} /></div>
                        <span className="mx-score-n">{r.gravity ?? "–"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Archetype family mix */}
            <section className="mx-section" aria-labelledby="mx-mix">
              <div className="mx-label">Archetype family mix</div>
              <h2 className="mx-h2" id="mx-mix">Which archetype families {inlineName(d.model.name)} brands play</h2>
              <p className="mx-note">
                Counted {baseLine(d)}: each brand once, under the archetype family BrandMD reads from its record's archetype label. The blue bar is the share among these brands; the gray tick marks the same family's share across all {d.total} brands in the index.
                {d.mapped.length > 0 && ` ${listJoin(d.mapped.map((m) => m.name))} ${d.mapped.length === 1 ? "has a label" : "have labels"} outside the 12 archetypes, placed in a family by BrandMD (noted on each row above).`}
              </p>
              <div className="mx-bars">
                {d.archetypeMix.map((a) => (
                  <div key={a.slug}>
                    <div className="mx-bar-head">
                      <Link to={`/archetypes/${a.slug}`}><i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, marginRight: 8, background: ARCHETYPE_COLORS[a.slug] }} />{a.name}</Link>
                      <span>{a.count} of {d.n} ({a.share}%) · index {a.indexShare}%</span>
                    </div>
                    <div className="mx-bar-track">
                      <div className="mx-bar-fill" style={{ width: `${a.share}%` }} />
                      <div className="mx-bar-index" style={{ left: `calc(${a.indexShare}% - 1px)` }} title={`${a.indexCount} of ${d.total} across the index`} />
                    </div>
                    <div className="mx-bar-brands"><BrandLinks brands={a.brands} /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sector mix */}
            <section className="mx-section" aria-labelledby="mx-sectors">
              <div className="mx-label">Sector mix</div>
              <h2 className="mx-h2" id="mx-sectors">What {inlineName(d.model.name)} brands sell</h2>
              <p className="mx-note">
                Counted {baseLine(d)}, by sector tag. Sector tags also come from each record's industry line; a brand whose line names two sectors counts in both
                {d.multiSector ? ` (${plural(d.multiSector, "brand")} here ${d.multiSector === 1 ? "does" : "do"})` : ""}, so the counts can add up to more than {d.n}.
                {d.noSector ? ` ${plural(d.noSector, "brand")} here ${d.noSector === 1 ? "has" : "have"} no sector tag.` : ""}
              </p>
              <div className="mx-bars">
                {d.sectorMix.map((s) => (
                  <div key={s.slug}>
                    <div className="mx-bar-head">
                      {sectorHref(s.slug) ? <Link to={sectorHref(s.slug)}>{s.name}</Link> : <b>{s.name}</b>}
                      <span>{s.count} of {d.n} ({s.share}%)</span>
                    </div>
                    <div className="mx-bar-track"><div className="mx-bar-fill" style={{ width: `${s.share}%` }} /></div>
                    <div className="mx-bar-brands"><BrandLinks brands={s.brands} /></div>
                  </div>
                ))}
              </div>
            </section>

            {/* Color */}
            <section className="mx-section" aria-labelledby="mx-color">
              <div className="mx-label">Color patterns</div>
              <h2 className="mx-h2" id="mx-color">The palettes, side by side</h2>
              <p className="mx-note">Primary, secondary and accent colors exactly as recorded, {baseLine(d)}. Color families are computed from each hex value's hue, saturation and lightness, not from what the brand calls the color.</p>
              <div className="mx-swatches" style={{ marginBottom: 24 }}>
                {d.brands.filter((r) => r.colors.length).map((r) => (
                  <Link key={r.slug} to={`/brands/${r.slug}`} className="mx-sw">
                    <div className="mx-sw-strip" aria-hidden="true">{r.colors.map((c, i) => <span key={i} style={{ background: c.hex }} />)}</div>
                    <div className="mx-sw-name">{r.name}</div>
                    <div className="mx-sw-hex">{r.colors.map((c) => c.hex).join(" ")}</div>
                  </Link>
                ))}
              </div>
              <div className="mx-two">
                <div className="mx-panel">
                  <h3>Primary color families</h3>
                  <p>Across the {plural(d.withPrimaryCount, "brand")} tagged {d.model.name} with a recorded primary color.</p>
                  {d.primaryFamilies.map((f) => (
                    <div key={f.slug} className="mx-fam">
                      <i style={{ background: f.swatch }} />
                      <div>{f.name}</div>
                      <span>{f.count} of {d.withPrimaryCount}</span>
                      <div className="mx-fam-who">{f.brands.join(", ")}</div>
                    </div>
                  ))}
                </div>
                <div className="mx-panel">
                  <h3>Every recorded color</h3>
                  <p>All {d.colorTotal} primary, secondary and accent values {baseLine(d)}, by family.</p>
                  {d.paletteFamilies.map((f) => (
                    <div key={f.slug} className="mx-fam">
                      <i style={{ background: f.swatch }} />
                      <div>{f.name}</div>
                      <span>{f.count} of {d.colorTotal}</span>
                    </div>
                  ))}
                  <h3 style={{ marginTop: 18 }}>Exact matches</h3>
                  {d.sharedHexes.length > 0 ? (
                    <>
                      <p>The same hex value recorded by more than one of these brands (pure white and black left out).</p>
                      <div className="mx-chips">
                        {d.sharedHexes.map((h) => (
                          <span key={h.hex} className="mx-chip"><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, marginRight: 6, background: h.hex, border: "1px solid rgba(255,255,255,0.15)" }} /><b>{h.hex}</b> {listJoin(h.brands)}</span>
                        ))}
                      </div>
                    </>
                  ) : <p>No hex value (other than pure white or black) is recorded by more than one of these brands.</p>}
                </div>
              </div>
            </section>

            {/* Type and tone */}
            <section className="mx-section" aria-labelledby="mx-type">
              <div className="mx-label">Type and tone</div>
              <h2 className="mx-h2" id="mx-type">Typefaces and shared tone words</h2>
              <div className="mx-two">
                <div className="mx-panel">
                  <h3>Typefaces on record</h3>
                  {d.withFontsCount > 0 ? (
                    <>
                      <p>{d.withFontsCount} of the {d.n} brands tagged {d.model.name} have typefaces recorded.{d.sharedFonts.length ? ` Named by more than one: ${d.sharedFonts.map((f) => `${f.name} (${listJoin(f.brands)})`).join("; ")}.` : " No typeface is named by more than one of them."}</p>
                      <ul className="mx-fontlist">
                        {d.brands.filter((r) => r.fonts.length).map((r) => (
                          <li key={r.slug}>
                            <Link to={`/brands/${r.slug}`}>{r.name}</Link>
                            <span>{r.fonts.map((f) => `${f.role}: ${f.name}`).join(" · ")}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : <p>None of the {d.n} brands tagged {d.model.name} has a typeface recorded in the BrandMD index yet, so there is no type pattern to report.</p>}
                </div>
                <div className="mx-panel">
                  <h3>Tone words used by more than one brand</h3>
                  {d.sharedTone.length > 0 ? (
                    <>
                      <p>Exact tone attributes (three words or fewer) found in two or more records, {baseLine(d)} ({d.withTone} of them record tone attributes).</p>
                      <div className="mx-chips">
                        {d.sharedTone.map((t) => <span key={t.word} className="mx-chip"><b>{t.word}</b> {listJoin(t.brands)}</span>)}
                      </div>
                    </>
                  ) : <p>No tone attribute of three words or fewer appears in more than one of these records.</p>}
                </div>
              </div>
            </section>

            {d.alsoTagged.length > 0 && (
              <section className="mx-section" aria-labelledby="mx-also">
                <div className="mx-label">Also tagged</div>
                <h2 className="mx-h2" id="mx-also">Brands here with a second model tag</h2>
                <div className="mx-pairs">
                  {d.alsoTagged.map((r) => (
                    <div key={r.slug} className="mx-pair">
                      <Link to={`/brands/${r.slug}`}>{r.name}</Link>
                      <span>also</span>
                      {r.others.map((m) => {
                        const od = b.models.find((x) => x.model.slug === m.slug);
                        const href = modelHrefOf(od);
                        return href ? <Link key={m.slug} to={href}>{m.name}</Link> : <b key={m.slug}>{m.name}</b>;
                      })}
                      <span>· from &ldquo;{r.others.map((m) => m.term).join("”, “")}&rdquo; in its industry line</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Other models */}
            <section className="mx-section" aria-labelledby="mx-other">
              <div className="mx-label">Keep exploring</div>
              <h2 className="mx-h2" id="mx-other">Other business models</h2>
              <div className="mx-others" style={{ marginTop: 16 }}>
                {others.map((o) => {
                  const href = modelHrefOf(o);
                  return href ? <Link key={o.model.slug} to={href}>{o.model.name} · {o.n}</Link> : null;
                })}
                <Link to="/models">All business models</Link>
                <Link to="/sectors">Brands by sector</Link>
                <Link to="/archetypes">Brands by archetype</Link>
                <Link to="/research">All research</Link>
              </div>
            </section>
          </>
        )}

        <ClosingCta heading={d ? `Chart your brand next to ${inlineName(d.model.name)} brands` : undefined} />
      </div>
    </div>
  );
}
