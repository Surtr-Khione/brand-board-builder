import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { battlePairs, side, HUB_TITLE, hubDescription, FAMILY_NAME } from "./battleModel";
import { useBrandIndex, useMeta, Swatches, ClosingCta, Spinner, BattleBuilder } from "./battleShared";

export default function BattlesHub() {
  const { loading, brands, total } = useBrandIndex();
  const pairs = useMemo(() => {
    const bySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
    return battlePairs()
      .filter((p) => bySlug[p.a] && bySlug[p.b])
      .map((p) => ({ ...p, A: side(bySlug[p.a]), B: side(bySlug[p.b]) }));
  }, [brands]);

  useMeta(HUB_TITLE, hubDescription(pairs.length || battlePairs().length, total || 85));

  return (
    <div className="vs-page">
      <SiteNav />
      <header className="vs-hero">
        <nav className="vs-crumbs" aria-label="Breadcrumb">
          <Link to="/research">Research</Link><span>/</span><span>{FAMILY_NAME}</span>
        </nav>
        <h1>Brand <span className="vs-blue">Battles</span></h1>
        <p className="vs-intro">
          Two brands, side by side, from their records in the BrandMD index{total ? ` of ${total} brands` : ""}:
          archetype, sector tags, enemy, promise, tagline, values, voice, colors, fonts and Gravity Score.
          Start with {loading ? "the" : pairs.length} curated battles of brands in the same category, or pick any
          two brands yourself. Nothing is scored as a win; the page shows where the two records differ and
          where they overlap.
        </p>
      </header>

      <main className="vs-wrap">
        {loading ? <Spinner /> : brands.length === 0 ? (
          <p className="vs-muted" style={{ textAlign: "center", padding: "60px 0" }}>The brand index could not be loaded. <Link to="/brands">Open the library</Link>.</p>
        ) : (
          <>
            <BattleBuilder brands={brands} id="pick" />

            <h2 className="vs-section-h">Curated battles</h2>
            <p className="vs-section-p">Each pair is in the same category, with one line on why it is paired.</p>
            <div className="vs-grid">
              {pairs.map((p) => (
                <Link key={p.key} to={p.path} className="vs-card">
                  <div className="vs-card-names">
                    <div className="vs-card-side">
                      <div className="vs-card-name">{p.A.name}</div>
                      <Swatches colors={p.A.colors} />
                      {p.A.archetypeLabel && <div className="vs-card-arch">{p.A.archetypeLabel}</div>}
                    </div>
                    <div className="vs-card-vs">vs</div>
                    <div className="vs-card-side vs-right">
                      <div className="vs-card-name">{p.B.name}</div>
                      <Swatches colors={p.B.colors} />
                      {p.B.archetypeLabel && <div className="vs-card-arch">{p.B.archetypeLabel}</div>}
                    </div>
                  </div>
                  <div className="vs-card-basis">Paired because {p.basis}.</div>
                </Link>
              ))}
            </div>
          </>
        )}

        <section className="vs-panel vs-compare-cta">
          <div>
            <h2>Your site against a competitor</h2>
            <p>Compare scans two or three live websites with the same lens and scores each one.</p>
          </div>
          <Link to="/compare" className="vs-btn">Open Compare</Link>
        </section>

        <ClosingCta />
        <p className="vs-foot-links">
          <Link to="/research">Back to Research</Link> · <Link to="/brands">All brands in the index</Link>
        </p>
      </main>
    </div>
  );
}
