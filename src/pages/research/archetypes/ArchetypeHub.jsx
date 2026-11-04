import { Link, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import BrandCard from "../../../components/BrandCard";
import { ARCHETYPES, archetypeBySlug, brandArchetypes } from "../../../lib/brandTaxonomy";
import useIndexBrands from "./useIndexBrands";
import { archetypeStats, groupByArchetype, hubDesc, hubTitle, labelNote, plural } from "./archetypeData";
import { ResearchCta, usePageMeta } from "./Shared";
import "./archetypes.css";

function BrandLink({ brand }) {
  return <Link to={`/brands/${brand.slug}`}>{brand.brand_name}</Link>;
}

function Section({ label, title, sub, children }) {
  return (
    <section className="arx-section">
      {label && <div className="arx-label">{label}</div>}
      {title && <h2 className="arx-h2">{title}</h2>}
      {sub && <p className="arx-sub">{sub}</p>}
      {children}
    </section>
  );
}

function Words({ words, of }) {
  if (!words.length) return null;
  return (
    <div className="arx-words">
      {words.map((w) => (
        <span key={w.word} className="arx-word" title={w.brands.map((b) => b.name).join(", ")}>
          {w.word}<small>{w.count} of {of}</small>
        </span>
      ))}
    </div>
  );
}

export default function ArchetypeHub() {
  const { slug } = useParams();
  const arch = archetypeBySlug(slug);
  const the = arch ? arch.name.replace(/^The /, "the ") : "";
  const { brands, loading } = useIndexBrands();
  const s = arch && brands.length ? archetypeStats(brands, slug) : null;
  const n = s?.primary.length ?? 0;
  const title = arch ? hubTitle(arch.name, n) : "Archetype not found | BrandMD";
  const desc = arch && s ? hubDesc(arch.name, n) : "";
  usePageMeta(s ? title : arch ? `${arch.name} Archetype | BrandMD` : title, desc);

  if (!arch) {
    return (
      <div className="arx"><SiteNav />
        <div className="arx-loading">NO SUCH ARCHETYPE<br /><Link className="arx-back" to="/archetypes">← All 12 archetypes</Link></div>
      </div>
    );
  }

  const counts = Object.fromEntries(groupByArchetype(brands).map((g) => [g.slug, g.primary.length]));
  const P = s?.primary || [];
  const maxFam = Math.max(1, ...(s?.colorFamilies || []).map((f) => f.count));
  const sharedFonts = (s?.fonts || []).filter((f) => f.count >= 2);

  return (
    <div className="arx">
      <SiteNav />
      <header className="arx-hero">
        <div className="arx-crumbs"><Link to="/research">Research</Link> / <Link to="/archetypes">Archetypes</Link> / {arch.name.replace("The ", "")}</div>
        <h1 className="arx-h1">{arch.name} <span>archetype</span></h1>
        <p className="arx-motto">&ldquo;{arch.motto}&rdquo;</p>
        <p className="arx-lede">
          {arch.name} is one of the twelve Jungian brand archetypes, the character a brand plays in its customer's story. Its core desire is {arch.desire}.
          {s ? ` Below: the brands in the BrandMD index that hold it, and the patterns their records share.` : ""}
        </p>
        {s && (
          <div className="arx-stats">
            <div className="arx-stat"><b>{n}</b><span>{n === 1 ? "brand holds" : "brands hold"} it as primary</span></div>
            <div className="arx-stat"><b>{s.secondary.length}</b><span>hold it as secondary</span></div>
            <div className="arx-stat"><b>{s.share}%</b><span>of the {s.total} brands in the index (primary)</span></div>
            <div className="arx-stat"><b>{s.sectors.length}</b><span>{s.sectors.length === 1 ? "sector" : "sectors"} among its primary brands</span></div>
          </div>
        )}
      </header>

      <main className="arx-wrap">
        {loading || !s ? (
          <div className="arx-loading">LOADING THE INDEX</div>
        ) : (
          <>
            <Section label="What it is" title={`What ${the} archetype means`}>
              <p className="arx-p" style={{ maxWidth: 760 }}>{s.definition}</p>
            </Section>

            <Section
              label="Primary"
              title={`${plural(n, "brand")} with ${the} as primary archetype`}
              sub={`Grouped from each record's archetype label. Where the record words it differently, the stored label is shown under the card.`}
            >
              {n ? (
                <div className="arx-brands">
                  {P.map((b) => {
                    const raw = labelNote(b, arch.name);
                    return (
                      <div key={b.slug}>
                        <BrandCard brand={b} compact />
                        {raw && <div className="arx-raw">Labelled &ldquo;{raw}&rdquo; in its record</div>}
                      </div>
                    );
                  })}
                </div>
              ) : <p className="arx-empty">No brand in the index holds {arch.name} as its primary archetype.</p>}
            </Section>

            <Section
              label="Secondary"
              title={`${plural(s.secondary.length, "brand")} with ${the} as secondary`}
              sub="These brands lead with another archetype and carry this one second. Their primary archetype is shown next to each name."
            >
              {s.secondary.length ? (
                <div className="arx-chips">
                  {s.secondary.map((b) => {
                    const p = brandArchetypes(b).primary;
                    return (
                      <Link key={b.slug} to={`/brands/${b.slug}`} className="arx-chip">
                        {b.brand_name}{p && <small>{p.name.replace("The ", "")} first</small>}
                      </Link>
                    );
                  })}
                </div>
              ) : <p className="arx-empty">No brand in the index lists {arch.name} as its secondary archetype.</p>}
            </Section>

            {n > 0 && (
              <>
                {(s.pairings.length > 0 || s.sectors.length > 0) && (
                  <Section label="Company it keeps" title="Pairings and sectors" sub={`Computed across the ${plural(n, "brand")} that hold ${the} as primary.`}>
                    <div className="arx-cols">
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Secondary archetypes they pair it with</div>
                        <div className="arx-chips">
                          {s.pairings.map((p) => (
                            <Link key={p.slug} to={`/archetypes/${p.slug}`} className="arx-chip">{p.name}<small>{p.count} of {n}</small></Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Sectors they sit in</div>
                        <div className="arx-chips">
                          {s.sectors.map((x) => (
                            <Link key={x.slug} to={`/sectors/${x.slug}`} className="arx-chip">{x.name}<small>{x.count}</small></Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                <Section
                  label="Color"
                  title="Most common color families"
                  sub={`How many of the ${plural(s.withColors, "brand")} with stored colors use each family in their primary, secondary or accent color. Families are grouped from the hex codes by hue and lightness.`}
                >
                  {s.colorFamilies.length ? (
                    <div className="arx-rows">
                      {s.colorFamilies.map((f) => (
                        <div key={f.slug}>
                          <div className="arx-row">
                            <div className="arx-row-name"><span className="arx-dot" style={{ background: f.swatch }} />{f.name}</div>
                            <div className="arx-row-track"><i style={{ width: `${(f.count / maxFam) * 100}%`, background: f.swatch }} /></div>
                            <div className="arx-row-n">{f.count} of {s.withColors}</div>
                          </div>
                          <div className="arx-hexes">{f.hexes.slice(0, 18).map((h) => <span key={h} title={h} style={{ background: h }} />)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="arx-empty">No colors are stored for these brands.</p>}
                </Section>

                <Section
                  label="Type"
                  title="Fonts on record"
                  sub={s.withFonts ? `${plural(s.withFonts, "brand")} of ${n} name their typefaces in the index.` : `None of these ${plural(n, "record")} name a typeface yet.`}
                >
                  {s.withFonts > 0 && (
                    sharedFonts.length ? (
                      <div className="arx-chips">
                        {sharedFonts.map((f) => <span key={f.name} className="arx-chip" title={f.brands.join(", ")}>{f.name}<small>{f.count} brands</small></span>)}
                      </div>
                    ) : (
                      <>
                        <p className="arx-sub">No typeface is shared by two of them. Each brand's named fonts:</p>
                        <ul className="arx-list">
                          {P.filter((b) => [b.primary_font, b.body_font, b.accent_font].some(Boolean)).map((b) => (
                            <li key={b.slug}><BrandLink brand={b} />: {[b.primary_font, b.body_font, b.accent_font].filter(Boolean).join(" · ")}</li>
                          ))}
                        </ul>
                      </>
                    )
                  )}
                </Section>

                <Section
                  label="Enemy"
                  title="What they stand against"
                  sub={`Each brand's stated enemy, as recorded. Words that recur across ${plural(s.enemies.length, "enemy statement")} are counted first (once per brand).`}
                >
                  <Words words={s.enemyWords} of={s.enemies.length} />
                  <ul className="arx-list">
                    {s.enemies.map((e) => (
                      <li key={e.brand.slug}><span className="arx-who"><BrandLink brand={e.brand} /></span><q className="arx-q">{e.text}</q></li>
                    ))}
                  </ul>
                </Section>

                <Section
                  label="Values"
                  title="What they value"
                  sub={`Words that recur in the core values of ${plural(s.values.length, "brand")} (once per brand), then each brand's values as recorded.`}
                >
                  <Words words={s.valueWords} of={s.values.length} />
                  <ul className="arx-list">
                    {s.values.map((v) => (
                      <li key={v.brand.slug}><span className="arx-who"><BrandLink brand={v.brand} /></span>{v.values.join(" · ")}</li>
                    ))}
                  </ul>
                </Section>

                <Section
                  label="Voice"
                  title="How they say it"
                  sub={s.withVoice
                    ? `Sample do and don't lines quoted from the voice rules of ${plural(s.withVoice, "brand")} of ${n} that have them on record.`
                    : `None of these ${plural(n, "record")} carry written do and don't voice rules yet.`}
                >
                  {s.withVoice > 0 && (
                    <div className="arx-cols">
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Do</div>
                        <ul className="arx-list">
                          {s.doSamples.map((d) => <li key={d.brand.slug} className="arx-do"><span className="arx-who"><BrandLink brand={d.brand} /></span><q className="arx-q">{d.text}</q></li>)}
                          {!s.doSamples.length && <li>No "do" lines on record.</li>}
                        </ul>
                      </div>
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Don't</div>
                        <ul className="arx-list">
                          {s.dontSamples.map((d) => <li key={d.brand.slug} className="arx-dont"><span className="arx-who"><BrandLink brand={d.brand} /></span><q className="arx-q">{d.text}</q></li>)}
                          {!s.dontSamples.length && <li>No "don't" lines on record.</li>}
                        </ul>
                      </div>
                    </div>
                  )}
                </Section>
              </>
            )}

            <Section label="The wheel" title="All twelve archetypes">
              <nav className="arx-wheel">
                {ARCHETYPES.map((a) => (
                  <Link key={a.slug} to={`/archetypes/${a.slug}`} className={a.slug === slug ? "on" : ""}>
                    {a.name.replace("The ", "")}<small>{plural(counts[a.slug] || 0, "brand")}</small>
                  </Link>
                ))}
              </nav>
              <Link className="arx-back" to="/archetypes">← All 12 archetypes</Link>
            </Section>
          </>
        )}
        <ResearchCta />
      </main>
    </div>
  );
}
