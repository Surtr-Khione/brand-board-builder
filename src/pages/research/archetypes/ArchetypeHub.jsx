import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import BrandCard from "../../../components/BrandCard";
import { ARCHETYPES, archetypeBySlug, archetypeOf, shortArchetypeName } from "../../../lib/brandTaxonomy";
import useIndexBrands from "./useIndexBrands";
import { archetypeStats, expressionPath, groupByArchetype, hubDesc, hubTitle, labelNote, mappedNote, plural } from "./archetypeData";
import { MappedNote, PatternSections, ResearchCta, Section, usePageMeta } from "./Shared";
import "./archetypes.css";

const SOURCE_NOTE = { record: "from the record", label: "from the label" };
const EXPR_MIN_TEXT = "two or more brands";

// One expression of this family: its definition and the brands that hold it.
function ExpressionBlock({ g }) {
  const notes = [...g.primary, ...g.secondary].map((b) => ({ b, note: mappedNote(b) })).filter((x) => x.note);
  return (
    <div className="arx-expr" id={g.slug}>
      <div className="arx-expr-head">
        <h3 className="arx-expr-name">
          {g.hasPage ? <Link to={expressionPath(g)}>{g.name}</Link> : g.name}
        </h3>
        <span className="arx-expr-n">
          {plural(g.primary.length, "brand")} as primary{g.secondary.length ? ` · ${g.secondary.length} as secondary` : ""}
        </span>
      </div>
      <p className="arx-expr-def">{g.definition}</p>
      <div className="arx-chips">
        {g.primary.map((b) => <Link key={b.slug} to={`/brands/${b.slug}`} className="arx-chip">{b.brand_name}</Link>)}
        {g.secondary.map((b) => (
          <Link key={b.slug} to={`/brands/${b.slug}`} className="arx-chip">
            {b.brand_name}<small>secondary, {shortArchetypeName(archetypeOf(b).family.name)} first</small>
          </Link>
        ))}
      </div>
      {notes.map(({ b, note }) => <MappedNote key={b.slug} note={`${b.brand_name}: ${note}`} />)}
      {g.hasPage && <Link className="arx-expr-more" to={expressionPath(g)}>The {g.name} page →</Link>}
    </div>
  );
}

export default function ArchetypeHub() {
  const { slug } = useParams();
  const arch = archetypeBySlug(slug);
  const short = arch ? shortArchetypeName(arch.name) : "";
  const the = arch ? arch.name.replace(/^The /, "the ") : "";
  const { brands, loading } = useIndexBrands();
  const s = arch && brands.length ? archetypeStats(brands, slug) : null;
  const n = s?.primary.length ?? 0;
  const title = arch ? hubTitle(arch.name, n) : "Archetype not found | BrandMD";
  const desc = arch && s ? hubDesc(arch.name, n) : "";
  usePageMeta(s ? title : arch ? `${arch.name} Archetype | BrandMD` : title, desc);

  // Expression links point at /archetypes/:slug#<expression>; the section only
  // exists once the index has loaded, so scroll to it then.
  const { hash } = useLocation();
  const ready = !!s;
  useEffect(() => {
    if (!ready || !hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView({ block: "start" });
  }, [ready, hash]);

  if (!arch) {
    return (
      <div className="arx"><SiteNav />
        <div className="arx-loading">NO SUCH ARCHETYPE<br /><Link className="arx-back" to="/archetypes">← All 12 archetypes</Link></div>
      </div>
    );
  }

  const counts = Object.fromEntries(groupByArchetype(brands).map((g) => [g.slug, g.primary.length]));
  const P = s?.primary || [];
  const blendBrands = s ? new Set(s.blend.map((x) => x.brand.slug)).size : 0;

  return (
    <div className="arx">
      <SiteNav />
      <header className="arx-hero">
        <div className="arx-crumbs"><Link to="/research">Research</Link> / <Link to="/archetypes">Archetypes</Link> / {short}</div>
        <h1 className="arx-h1">{arch.name} <span>archetype</span></h1>
        <p className="arx-motto">&ldquo;{arch.motto}&rdquo;</p>
        <p className="arx-lede">
          {arch.name} is one of the twelve Jungian brand archetypes, the character a brand plays in its customer's story. Its core desire is {arch.desire}.
          {s ? ` Below: the named ways brands in the BrandMD index play it, the brands that hold it, and the patterns their records share.` : ""}
        </p>
        {s && (
          <div className="arx-stats">
            <div className="arx-stat"><b>{n}</b><span>{n === 1 ? "brand holds" : "brands hold"} it as primary</span></div>
            <div className="arx-stat"><b>{blendBrands}</b><span>more {blendBrands === 1 ? "brand has" : "brands have"} it in their blend</span></div>
            <div className="arx-stat"><b>{s.share}%</b><span>of the {s.total} brands in the index (primary)</span></div>
            <div className="arx-stat"><b>{s.expressions.length}</b><span>named {s.expressions.length === 1 ? "expression" : "expressions"} in the records</span></div>
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

            {(s.expressions.length > 0 || s.pure.length > 0) && (
              <Section
                label="Expressions"
                title={`How brands play ${the}`}
                sub={`An expression is a named way of playing an archetype, taken from the label in each brand's own record. Definitions are BrandMD's general descriptions, not claims about any brand. An expression held as primary by ${EXPR_MIN_TEXT} gets its own page.`}
              >
                <div className="arx-exprs">
                  {s.expressions.map((g) => <ExpressionBlock key={g.id} g={g} />)}
                  {s.pure.length > 0 && (
                    <div className="arx-expr" id="pure">
                      <div className="arx-expr-head">
                        <h3 className="arx-expr-name">{short}, no expression named</h3>
                        <span className="arx-expr-n">{plural(s.pure.length, "brand")}</span>
                      </div>
                      <p className="arx-expr-def">These records label the brand with the archetype itself and name no narrower expression.</p>
                      <div className="arx-chips">
                        {s.pure.map((b) => <Link key={b.slug} to={`/brands/${b.slug}`} className="arx-chip">{b.brand_name}</Link>)}
                      </div>
                      {s.pure.filter((b) => mappedNote(b)).map((b) => <MappedNote key={b.slug} note={`${b.brand_name}: ${mappedNote(b)}`} />)}
                    </div>
                  )}
                </div>
              </Section>
            )}

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
                        {raw && <div className="arx-raw">Labeled &ldquo;{raw}&rdquo; in its record</div>}
                        <MappedNote note={mappedNote(b)} />
                      </div>
                    );
                  })}
                </div>
              ) : <p className="arx-empty">No brand in the index holds {arch.name} as its primary archetype.</p>}
            </Section>

            <Section
              label="Blends"
              title={`${plural(blendBrands, "brand")} with ${the} in the blend`}
              sub={`These brands lead with another archetype and carry ${the} too. "From the record" means the record's own secondary archetype names it; "from the label" means the brand's hybrid archetype label names it.`}
            >
              {s.blend.length ? (
                <>
                  <div className="arx-chips">
                    {s.blend.map((x) => {
                      const p = archetypeOf(x.brand).family;
                      return (
                        <Link key={`${x.brand.slug}-${x.source}`} to={`/brands/${x.brand.slug}`} className="arx-chip">
                          {x.brand.brand_name}
                          <small>{shortArchetypeName(p.name)} first{x.expression ? ` · as ${x.expression.name}` : ""} · {SOURCE_NOTE[x.source]}</small>
                        </Link>
                      );
                    })}
                  </div>
                  {s.blend.filter((x) => mappedNote(x.brand)).map((x) => <MappedNote key={x.brand.slug} note={`${x.brand.brand_name}: ${mappedNote(x.brand)}`} />)}
                </>
              ) : <p className="arx-empty">No brand in the index carries {arch.name} in its blend.</p>}
            </Section>

            {n > 0 && (
              <>
                {(s.pairings.length > 0 || s.sectors.length > 0) && (
                  <Section label="Company it keeps" title="Blends and sectors" sub={`Computed across the ${plural(n, "brand")} that hold ${the} as primary.`}>
                    <div className="arx-cols">
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Archetypes they blend it with</div>
                        <div className="arx-chips">
                          {s.pairings.map((p) => (
                            <Link key={p.slug} to={`/archetypes/${p.slug}`} className="arx-chip">{p.name}<small>{p.count} of {n}</small></Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="arx-label" style={{ letterSpacing: 2 }}>Primary sectors they sit in</div>
                        <div className="arx-chips">
                          {s.sectors.map((x) => (
                            <Link key={x.slug} to={`/sectors/${x.slug}`} className="arx-chip">{x.name}<small>{x.count}</small></Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Section>
                )}

                <PatternSections s={s} P={P} n={n} />
              </>
            )}

            <Section label="The wheel" title="All twelve archetypes">
              <nav className="arx-wheel">
                {ARCHETYPES.map((a) => (
                  <Link key={a.slug} to={`/archetypes/${a.slug}`} className={a.slug === slug ? "on" : ""}>
                    {shortArchetypeName(a.name)}<small>{plural(counts[a.slug] || 0, "brand")}</small>
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
