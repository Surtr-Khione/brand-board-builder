import { useMemo } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { buildModels, hubIntro, hubMeta, modelHrefOf, plural, GRAVITY_NOTE } from "./modelData";
import { useModelIndex, usePageMeta, Crumbs, MixBar, ClosingCta, LoadState, Face } from "./parts";
import "./models.css";

function CardInner({ d }) {
  return (
    <>
      <div className="mx-card-strip" aria-hidden="true">
        {d.brands.map((r) => <span key={r.slug} style={{ background: r.colors.find((c) => c.role === "Primary")?.hex || "#1a1a1a" }} />)}
      </div>
      <div className="mx-card-body">
        <div className="mx-count">{d.n}<small>{d.n === 1 ? "brand" : "brands"} of {d.total}</small></div>
        <h2 className="mx-card-title">{d.model.name}</h2>
        <p className="mx-def">{d.model.definition}</p>
        <div className="mx-def-src">BrandMD's definition</div>
        <div className="mx-faces">
          {d.brands.slice(0, 8).map((r) => <Face key={r.slug} row={r} link={false} />)}
          {d.n > 8 && <span className="mx-face-more">+{d.n - 8}</span>}
        </div>
        <div style={{ marginTop: 14 }}><MixBar mix={d.archetypeMix} n={d.n} /></div>
        <div className="mx-card-names">{d.brands.map((r) => r.name).join(" · ")}</div>
        <div className="mx-terms">Tagged when the industry line says: {d.model.terms.map((t, i) => <span key={t}><code>{t}</code>{i < d.model.terms.length - 1 ? ", " : ""}</span>)}</div>
        {!d.hasPage && <div className="mx-card-nopage">One brand so far, so no page of its own yet.</div>}
      </div>
    </>
  );
}

export default function ModelsHub() {
  const { brands, loading, error } = useModelIndex();
  const b = useMemo(() => buildModels(brands), [brands]);
  const shown = b.models.filter((d) => d.n > 0);
  const ready = !loading && !error && b.total > 0;
  const meta = ready ? hubMeta(b) : { title: hubMeta(b).title, description: "" };
  usePageMeta(meta.title, meta.description);

  return (
    <div className="mx-page">
      <SiteNav />
      <div className="mx-wrap">
        <header className="mx-hero">
          <Crumbs items={[{ label: "Research", to: "/research" }, { label: "Business models" }]} />
          <h1 className="mx-h1">Brands by <em>business model</em></h1>
          <p className="mx-intro">
            {ready
              ? hubIntro(b)
              : "How a brand sells is a second axis next to what it sells. Brands in the BrandMD index carry a business-model tag only when the industry line in their record names the model in so many words; none is guessed."}
          </p>
        </header>

        <LoadState loading={loading} error={error} />

        {ready && (
          <div className="mx-grid">
            {shown.map((d) => {
              const href = modelHrefOf(d);
              return href
                ? <Link key={d.model.slug} to={href} className="mx-card"><CardInner d={d} /></Link>
                : <div key={d.model.slug} className="mx-card mx-card-static"><CardInner d={d} /></div>;
            })}
          </div>
        )}

        {ready && b.multiModel.length > 0 && (
          <section className="mx-section" aria-labelledby="mx-multi">
            <div className="mx-label">More than one tag</div>
            <h2 className="mx-h2" id="mx-multi">{plural(b.multiModel.length, "brand")} carry two model tags</h2>
            <p className="mx-note">Their industry lines name more than one model, so each tag is counted on its own page.</p>
            <div className="mx-pairs">
              {b.multiModel.map((r) => (
                <div key={r.slug} className="mx-pair">
                  <Link to={`/brands/${r.slug}`}>{r.name}</Link>
                  <span>{r.models.map((m) => `${m.name} (from "${m.term}")`).join(" + ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {ready && (
          <p className="mx-foot">
            Color strips show each tagged brand's recorded primary color. Archetype bars count each brand once, under its archetype family. Model definitions are BrandMD's own wording, not the brands'. {GRAVITY_NOTE}{" "}
            See also <Link to="/sectors">brands by sector</Link>, <Link to="/archetypes">brands by archetype</Link>, the full <Link to="/brands">brand index</Link>, or <Link to="/research">all research</Link>.
          </p>
        )}

        <ClosingCta />
      </div>
    </div>
  );
}
