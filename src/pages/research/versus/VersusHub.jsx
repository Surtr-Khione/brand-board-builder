import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { versusPairs, side, HUB_TITLE, hubDescription } from "./versusModel";
import { useBrandIndex, useMeta, Swatches, ClosingCta, Spinner } from "./versusShared";

export default function VersusHub() {
  const { loading, brands, total } = useBrandIndex();
  const pairs = useMemo(() => {
    const bySlug = Object.fromEntries(brands.map((b) => [b.slug, b]));
    return versusPairs()
      .filter((p) => bySlug[p.a] && bySlug[p.b])
      .map((p) => ({ ...p, A: side(bySlug[p.a]), B: side(bySlug[p.b]) }));
  }, [brands]);

  useMeta(HUB_TITLE, hubDescription(pairs.length || versusPairs().length, total || 85));

  return (
    <div className="vs-page">
      <SiteNav />
      <header className="vs-hero">
        <nav className="vs-crumbs" aria-label="Breadcrumb">
          <Link to="/research">Research</Link><span>/</span><span>Versus</span>
        </nav>
        <h1>Brand <span className="vs-blue">vs</span> Brand</h1>
        <p className="vs-intro">
          {loading ? "Pairs" : `${pairs.length} pairs`} of brands in the same category, each set side by side
          from their records in the BrandMD index{total ? ` of ${total} brands` : ""}: archetype, enemy, promise,
          tagline, values, voice, colours, fonts and Gravity Score. Each pair carries one line on why it is
          paired, and nothing else is claimed about how the two compete.
        </p>
      </header>

      <main className="vs-wrap">
        {loading ? <Spinner /> : pairs.length === 0 ? (
          <p className="vs-muted" style={{ textAlign: "center", padding: "60px 0" }}>The brand index could not be loaded. <Link to="/brands">Open the library</Link>.</p>
        ) : (
          <div className="vs-grid">
            {pairs.map((p) => (
              <Link key={p.key} to={p.path} className="vs-card">
                <div className="vs-card-names">
                  <div className="vs-card-side">
                    <div className="vs-card-name">{p.A.name}</div>
                    <Swatches colours={p.A.colours} />
                    {p.A.archetype && <div className="vs-card-arch">{p.A.archetype.name}</div>}
                  </div>
                  <div className="vs-card-vs">vs</div>
                  <div className="vs-card-side vs-right">
                    <div className="vs-card-name">{p.B.name}</div>
                    <Swatches colours={p.B.colours} />
                    {p.B.archetype && <div className="vs-card-arch">{p.B.archetype.name}</div>}
                  </div>
                </div>
                <div className="vs-card-basis">Paired because {p.basis}.</div>
              </Link>
            ))}
          </div>
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
