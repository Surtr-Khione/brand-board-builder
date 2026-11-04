import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { useBrandIndex, usePageMeta } from "./useBrandIndex";
import { buildSectors, hubMeta, GRAVITY_NOTE } from "./sectorData";
import { Crumbs, MixBar, ClosingCta, LoadState } from "./parts";
import "./sectors.css";

export default function SectorsHub() {
  const { brands, loading, error } = useBrandIndex();
  const { sectors, total } = useMemo(() => buildSectors(brands), [brands]);
  const meta = hubMeta(total || 85, sectors.length || 12);
  usePageMeta(meta.title, meta.description);

  const ready = !loading && !error && sectors.length > 0;

  return (
    <div className="sx-page">
      <SiteNav />
      <div className="sx-wrap">
        <header className="sx-hero">
          <Crumbs items={[{ label: "Research", to: "/research" }, { label: "Sectors" }]} />
          <h1 className="sx-h1">Brands by <em>sector</em></h1>
          <p className="sx-intro">
            {ready
              ? `The ${total} brands in the BrandMD index, grouped into ${sectors.length} sectors by the industry each brand's record lists. Open a sector to see which archetypes its brands play, how their Gravity Scores compare, the colours and type they share, and how each one describes what sets it apart, in its own record's words.`
              : "Every brand in the BrandMD index, grouped by sector: which archetypes each sector's brands play, how their Gravity Scores compare, the colours and type they share, and how each describes what sets it apart."}
          </p>
        </header>

        <LoadState loading={loading} error={error} />

        {ready && (
          <div className="sx-grid">
            {sectors.map((d) => {
              const primaries = d.rows.map((r) => r.colours.find((c) => c.role === "Primary")?.hex).filter(Boolean);
              return (
                <Link key={d.sector.slug} to={`/sectors/${d.sector.slug}`} className="sx-card">
                  <div className="sx-card-strip" aria-hidden="true">
                    {primaries.map((h, i) => <span key={i} style={{ background: h }} />)}
                  </div>
                  <div className="sx-card-body">
                    <h2 className="sx-card-title">{d.sector.name}</h2>
                    <div className="sx-card-meta">
                      {d.n} brand{d.n === 1 ? "" : "s"}{d.avgGravity !== null ? ` · average Gravity ${d.avgGravity}` : ""}
                    </div>
                    <MixBar mix={d.archetypeMix} n={d.n} />
                    <div className="sx-card-names">{d.rows.map((r) => r.name).join(" · ")}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {ready && (
          <p className="sx-foot">
            Colour strips show each brand's recorded primary colour. Archetype bars count each brand once, under its primary archetype. {GRAVITY_NOTE}{" "}
            See also <Link to="/archetypes">brands by archetype</Link>, the full <Link to="/brands">brand index</Link>, or <Link to="/research">all research</Link>.
          </p>
        )}

        <ClosingCta />
      </div>
    </div>
  );
}
