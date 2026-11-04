import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import useIndexBrands from "./useIndexBrands";
import { groupByArchetype, INDEX_DESC, INDEX_TITLE, plural } from "./archetypeData";
import { Face, ResearchCta, usePageMeta } from "./Shared";
import "./archetypes.css";

export default function ArchetypesIndex() {
  usePageMeta(INDEX_TITLE, INDEX_DESC);
  const { brands, loading } = useIndexBrands();
  const groups = groupByArchetype(brands);
  const total = brands.length;
  const max = Math.max(1, ...groups.map((g) => g.primary.length));

  return (
    <div className="arx">
      <SiteNav />
      <header className="arx-hero">
        <div className="arx-crumbs"><Link to="/research">Research</Link> / Archetypes</div>
        <h1 className="arx-h1">The 12 brand <span>archetypes</span></h1>
        <p className="arx-lede">
          A brand archetype is the character a brand plays in its customer's story: the Hero who rises, the Sage who explains, the Outlaw who breaks the rules.
          Here are all twelve, with every brand in the BrandMD index that holds each one{total ? `, counted across the ${total} brands in the index` : ""}.
        </p>
        {total > 0 && (
          <>
            <div className="arx-dist" aria-label="Share of the index by primary archetype">
              {groups.filter((g) => g.primary.length).map((g) => (
                <Link key={g.slug} to={`/archetypes/${g.slug}`} title={`${g.name}: ${g.primary.length}`} aria-label={`${g.name}: ${g.primary.length} brands`} style={{ flex: g.primary.length }} />
              ))}
            </div>
            <ul className="arx-dist-legend">
              {[...groups].filter((g) => g.primary.length).sort((a, b) => b.primary.length - a.primary.length).map((g) => (
                <li key={g.slug}><Link to={`/archetypes/${g.slug}`}>{g.name.replace(/^The /, "")} <b>{g.primary.length}</b></Link></li>
              ))}
            </ul>
            <div className="arx-dist-note">Each segment is one archetype, sized by how many of the {total} brands hold it as their primary archetype.</div>
          </>
        )}
      </header>

      <main className="arx-wrap">
        {loading ? (
          <div className="arx-loading">LOADING THE INDEX</div>
        ) : (
          <div className="arx-grid">
            {groups.map((g) => {
              const n = g.primary.length;
              return (
                <Link key={g.slug} to={`/archetypes/${g.slug}`} className="arx-card">
                  <div className="arx-card-top">
                    <h2 className="arx-card-name" style={{ margin: 0 }}>{g.name}</h2>
                    <div className="arx-card-count">{n}<small>{n === 1 ? "brand" : "brands"}</small></div>
                  </div>
                  <div className="arx-card-motto">&ldquo;{g.motto}&rdquo;</div>
                  <p className="arx-card-desire"><b>Core desire:</b> {g.desire}</p>
                  <div className="arx-bar"><i style={{ width: `${(n / max) * 100}%` }} /></div>
                  <div className="arx-faces">
                    {g.primary.slice(0, 6).map((b) => <Face key={b.slug} brand={b} link={false} />)}
                    {n > 6 && <span className="arx-face-more">+{n - 6}</span>}
                  </div>
                  {g.secondary.length > 0 && (
                    <div className="arx-card-sec">Also the secondary archetype of {plural(g.secondary.length, "brand")}</div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
        <ResearchCta />
      </main>
    </div>
  );
}
