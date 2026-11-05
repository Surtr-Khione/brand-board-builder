import { Link, Navigate, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import BrandCard from "../../../components/BrandCard";
import { archetypeBySlug, archetypeOf, expressionBySlug, shortArchetypeName } from "../../../lib/brandTaxonomy";
import useIndexBrands from "./useIndexBrands";
import { expressionPath, expressionStats, exprDesc, exprTitle, mappedNote, plural } from "./archetypeData";
import { MappedNote, PatternSections, ResearchCta, Section, usePageMeta } from "./Shared";
import "./archetypes.css";

// /archetypes/:family/:expression — only for an expression that 2+ brands
// hold as their primary expression (archetypeData.EXPRESSION_PAGE_MIN). Any
// other expression lives as a section on its family hub, so this page sends
// the reader there instead.
export default function ExpressionPage() {
  const { family, expression } = useParams();
  const fam = archetypeBySlug(family);
  const def = fam ? expressionBySlug(family, expression) : null;
  const { brands, loading } = useIndexBrands();
  const s = def && brands.length ? expressionStats(brands, family, expression) : null;
  const n = s?.primary.length ?? 0;
  const famShort = fam ? shortArchetypeName(fam.name) : "";
  const live = !!s?.hasPage;
  usePageMeta(
    live ? exprTitle(def.name, fam.name, n) : def ? `${def.name} (${famShort}) | BrandMD` : "Archetype not found | BrandMD",
    live ? exprDesc(def.name, fam.name, n) : "",
  );

  // A known expression without its own page: go to its section on the hub.
  if (def && !loading && brands.length && !live) {
    return <Navigate replace to={`/archetypes/${family}#${def.slug}`} />;
  }
  if (!def) {
    return (
      <div className="arx"><SiteNav />
        <div className="arx-loading">
          NO SUCH ARCHETYPE EXPRESSION<br />
          <Link className="arx-back" to={fam ? `/archetypes/${family}` : "/archetypes"}>
            ← {fam ? `${fam.name} archetype` : "All 12 archetypes"}
          </Link>
        </div>
      </div>
    );
  }

  const P = s?.primary || [];
  const famThe = fam.name.replace(/^The /, "the ");

  return (
    <div className="arx">
      <SiteNav />
      <header className="arx-hero">
        <div className="arx-crumbs">
          <Link to="/research">Research</Link> / <Link to="/archetypes">Archetypes</Link> / <Link to={`/archetypes/${family}`}>{famShort}</Link> / {def.name}
        </div>
        <h1 className="arx-h1">The {def.name} <span>archetype</span></h1>
        <p className="arx-motto">An expression of {fam.name}</p>
        <p className="arx-lede">
          The {def.name} is one named way of playing {famThe}, whose core desire is {fam.desire}.
          {s ? ` Below: the ${plural(n, "brand")} in the BrandMD index whose own archetype label names the ${def.name}, and the patterns their records share.` : ""}
        </p>
        {s && (
          <div className="arx-stats">
            <div className="arx-stat"><b>{n}</b><span>brands label it as their primary archetype</span></div>
            <div className="arx-stat"><b>{s.secondary.length}</b><span>more name it as their secondary</span></div>
            <div className="arx-stat"><b>{s.total ? Math.round((n / s.total) * 100) : 0}%</b><span>of the {s.total} brands in the index (primary)</span></div>
            <div className="arx-stat"><b>{s.sectors.length}</b><span>primary {s.sectors.length === 1 ? "sector" : "sectors"} among them</span></div>
          </div>
        )}
      </header>

      <main className="arx-wrap">
        {loading || !s ? (
          <div className="arx-loading">LOADING THE INDEX</div>
        ) : (
          <>
            <Section label="What it is" title={`What the ${def.name} means`}>
              <p className="arx-p" style={{ maxWidth: 760 }}>{def.definition}</p>
              <p className="arx-sub" style={{ maxWidth: 760 }}>
                This definition is BrandMD's general description of the expression, not a claim about any brand.
                {def.aliases.length ? ` Records that say ${def.aliases.map((a) => `"${a}"`).join(" or ")} are read as the ${def.name} too.` : ""}
                {def.mapped ? ` Placing "${def.name}" under ${famThe} is BrandMD's reading, so every brand here is marked "Mapped by BrandMD".` : ` "${def.name}" is a standard name for ${famThe} in archetype literature.`}
              </p>
            </Section>

            <Section
              label="Primary"
              title={`${plural(n, "brand")} that label themselves the ${def.name}`}
              sub="The archetype label stored in each record is shown under the card."
            >
              <div className="arx-brands">
                {P.map((b) => (
                  <div key={b.slug}>
                    <BrandCard brand={b} compact />
                    <div className="arx-raw">Labeled &ldquo;{archetypeOf(b).raw}&rdquo; in its record</div>
                    <MappedNote note={mappedNote(b)} />
                  </div>
                ))}
              </div>
            </Section>

            {s.secondary.length > 0 && (
              <Section
                label="Secondary"
                title={`${plural(s.secondary.length, "brand")} with the ${def.name} as secondary`}
                sub="These records name the expression as their secondary archetype and lead with another. They are listed here but not counted in the patterns below."
              >
                <div className="arx-chips">
                  {s.secondary.map((b) => (
                    <Link key={b.slug} to={`/brands/${b.slug}`} className="arx-chip">
                      {b.brand_name}<small>{shortArchetypeName(archetypeOf(b).family.name)} first</small>
                    </Link>
                  ))}
                </div>
                {s.secondary.filter((b) => mappedNote(b)).map((b) => <MappedNote key={b.slug} note={`${b.brand_name}: ${mappedNote(b)}`} />)}
              </Section>
            )}

            <Section label="Company it keeps" title="Blends and sectors" sub={`Computed across the ${plural(n, "brand")} that label themselves the ${def.name}.`}>
              <div className="arx-cols">
                <div>
                  <div className="arx-label" style={{ letterSpacing: 2 }}>Archetypes they blend it with</div>
                  <div className="arx-chips">
                    {s.pairings.map((p) => (
                      <Link key={p.slug} to={`/archetypes/${p.slug}`} className="arx-chip">{p.name}<small>{p.count} of {n}</small></Link>
                    ))}
                    {!s.pairings.length && <span className="arx-empty">None on record.</span>}
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

            <PatternSections s={s} P={P} n={n} />

            <Section label={`More ${famShort}`} title={`Other ways to play ${famThe}`}>
              <div className="arx-chips">
                {s.siblings.map((g) => (
                  <Link key={g.id} to={expressionPath(g)} className="arx-chip">{g.name}<small>{plural(g.primary.length, "brand")}</small></Link>
                ))}
                <Link to={`/archetypes/${family}`} className="arx-chip">{fam.name}<small>the whole family</small></Link>
              </div>
              <Link className="arx-back" to="/archetypes">← All 12 archetypes</Link>
            </Section>
          </>
        )}
        <ResearchCta />
      </main>
    </div>
  );
}
