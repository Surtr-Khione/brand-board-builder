import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import {
  expressionCounts, expressionHref, sectorHref, modelHref,
} from "../../../lib/brandTaxonomy.js";
import {
  resolvePair, buildBattle, battlePairs, suggestBattles, hasField, pairTitle, pairDescription,
  shortName, FAMILY_NAME, HUB_PATH,
} from "./battleModel";
import { useBrandIndex, useMeta, useNoindex, Swatches, ClosingCta, Spinner, BattleBuilder } from "./battleShared";

function TagChip({ href, children, title }) {
  return href
    ? <Link to={href} className="vs-chip vs-chip-link" title={title}>{children}</Link>
    : <span className="vs-chip" title={title}>{children}</span>;
}

function Family({ f }) {
  return <Link to={`/archetypes/${f.slug}`}>{shortName(f.name)}</Link>;
}

function Expr({ family, e, counts }) {
  const href = expressionHref(family, e, counts);
  return href ? <Link to={href}>{e.name}</Link> : <span>{e.name}</span>;
}

function Cell({ s, k, counts }) {
  if (!hasField(s, k)) return <span className="vs-none">Not on record</span>;
  const v = s[k];
  switch (k) {
    case "archetype":
      return (
        <span>
          <span className="vs-arch">
            <Family f={v} />
            {s.expression && <> <span className="vs-dot">·</span> <Expr family={v.slug} e={s.expression} counts={counts} /></>}
          </span>
          {s.expression && <span className="vs-raw">{s.expression.name}: {s.expression.definition}</span>}
          {s.mappedNote && <span className="vs-raw">{s.mappedNote}.</span>}
        </span>
      );
    case "blend":
      return (
        <span className="vs-arch">
          {v.map((x, i) => (
            <span key={x.family.slug}>
              {i > 0 && ", "}
              <Family f={x.family} />
              {x.expression && <> <span className="vs-dot">·</span> <Expr family={x.family.slug} e={x.expression} counts={counts} /></>}
            </span>
          ))}
        </span>
      );
    case "sectors":
      return <span className="vs-chips">{v.map((t) => <TagChip key={t.slug} href={sectorHref(t.slug)}>{t.name}</TagChip>)}</span>;
    case "models":
      return (
        <span className="vs-chips">
          {v.map((m) => <TagChip key={m.slug} href={modelHref(m.slug)} title={`From "${m.term}" in the record's industry`}>{m.name}</TagChip>)}
        </span>
      );
    case "tagline":
      return <span className="vs-tagline">&ldquo;{v}&rdquo;</span>;
    case "values": case "dos": case "donts":
      return <ul className="vs-list">{v.map((x, i) => <li key={i}>{x}</li>)}</ul>;
    case "tone":
      return <span className="vs-chips">{v.map((t, i) => <span key={i} className="vs-chip">{t}</span>)}</span>;
    case "colors":
      return (
        <ul className="vs-palette">
          {v.map((c, i) => (
            <li key={i}>
              <span className="vs-swatch vs-swatch-lg" style={{ background: c.hex }} />
              <span className="vs-role">{c.role}</span>
              <code>{c.hex}</code>
            </li>
          ))}
        </ul>
      );
    case "fonts":
      return <ul className="vs-list vs-plain">{v.map((f, i) => <li key={i}><span className="vs-role">{f.role}</span> {f.name}</li>)}</ul>;
    case "gravity":
      return <span className="vs-gravity">{v}<span> / 100</span></span>;
    default:
      return <span>{v}</span>;
  }
}

function BrandHead({ s }) {
  return (
    <div className="vs-head">
      <Link to={`/brands/${s.slug}`} className="vs-head-name">{s.name}</Link>
      <Swatches colors={s.colors} size={12} />
      {s.website && <div className="vs-head-site">{s.website}</div>}
    </div>
  );
}

function NotFound({ message }) {
  useNoindex(true);
  useMeta(`Battle not found | BrandMD`, null);
  return (
    <div className="vs-page">
      <SiteNav />
      <main className="vs-wrap" style={{ textAlign: "center", paddingTop: 100 }}>
        <h1 className="vs-h1-sm">Battle not found</h1>
        <p className="vs-muted">{message}</p>
        <p><Link to={HUB_PATH}>Pick two brands on {FAMILY_NAME}</Link> · <Link to="/research">Research</Link></p>
      </main>
    </div>
  );
}

export default function BattlePair() {
  const { pair: param } = useParams();
  const { loading, brands } = useBrandIndex();
  const slugSet = useMemo(() => new Set(brands.map((b) => b.slug)), [brands]);
  // Curated pairs resolve before the index loads; picked pairs need its slugs.
  const found = useMemo(() => resolvePair(param, loading ? null : slugSet), [param, loading, slugSet]);
  const counts = useMemo(() => (brands.length ? expressionCounts(brands) : null), [brands]);

  const v = useMemo(() => {
    if (!found) return null;
    const a = brands.find((b) => b.slug === found.a);
    const b = brands.find((b) => b.slug === found.b);
    return a && b ? buildBattle(a, b, found.curated ? found.curated.basis : null) : null;
  }, [brands, found]);

  const suggestions = useMemo(() => (v ? suggestBattles(v.A.slug, v.B.slug, brands, 3) : []), [v, brands]);

  // Only curated battles are prerendered and indexed; a picked pair is not.
  useNoindex(Boolean(v && !v.curated));
  useMeta(v ? pairTitle(v.A, v.B) : `${FAMILY_NAME} | BrandMD`, v ? pairDescription(v.A, v.B) : null);

  if (found && !found.canonical) return <Navigate to={found.path} replace />;

  if (loading && !found) return <div className="vs-page"><SiteNav /><Spinner /></div>;

  if (!found || (!loading && !v)) {
    return <NotFound message={brands.length || loading ? "This address does not name two different brands in the BrandMD index." : "The brand index could not be loaded."} />;
  }

  if (loading || !v) return <div className="vs-page"><SiteNav /><Spinner /></div>;

  const { A, B } = v;
  const curated = battlePairs().filter((p) => p.key !== found.key);
  const nameOf = Object.fromEntries(brands.map((b) => [b.slug, b.brand_name]));
  const hubLinks = [];
  const pushLink = (to, label) => { if (to && !hubLinks.some((l) => l.to === to)) hubLinks.push({ to, label }); };
  for (const s of [A, B]) if (s.archetype) pushLink(`/archetypes/${s.archetype.slug}`, shortName(s.archetype.name));
  for (const s of [A, B]) for (const t of s.sectors) pushLink(sectorHref(t.slug), t.name);

  return (
    <div className="vs-page">
      <SiteNav />
      <header className="vs-hero">
        <nav className="vs-crumbs" aria-label="Breadcrumb">
          <Link to="/research">Research</Link><span>/</span><Link to={HUB_PATH}>{FAMILY_NAME}</Link><span>/</span><span>{A.name} vs {B.name}</span>
        </nav>
        <div className="vs-eyebrow">{v.curated ? "Curated brand battle" : "Brand battle you picked"}</div>
        <h1>{A.name} <span className="vs-blue">vs</span> {B.name}</h1>
        {v.curated && (
          <p className="vs-basis"><span>Why they are paired</span>{v.basis.charAt(0).toUpperCase() + v.basis.slice(1)}.</p>
        )}
        <p className="vs-intro">
          The two brand systems side by side, each value taken from the brand's own record in the BrandMD
          index. Where a record has no entry for a field, it says so instead of filling one in. Archetype
          family, expression and sector tags are BrandMD's readings of each record's own labels. Below the
          table, a computed list of where the two records differ and where they overlap.
        </p>
      </header>

      <main className="vs-wrap">
        <div className="vs-table" role="table" aria-label={`${A.name} and ${B.name} compared`}>
          <div className="vs-row vs-row-head" role="row">
            <div className="vs-label" role="columnheader">Field</div>
            <div className="vs-cell" role="columnheader"><BrandHead s={A} /></div>
            <div className="vs-cell" role="columnheader"><BrandHead s={B} /></div>
          </div>
          {v.rows.map((r) => (
            <div key={r.key} className="vs-row" role="row">
              <div className="vs-label" role="rowheader">{r.label}</div>
              <div className="vs-cell" role="cell"><span className="vs-who">{A.name}</span><Cell s={A} k={r.key} counts={counts} /></div>
              <div className="vs-cell" role="cell"><span className="vs-who">{B.name}</span><Cell s={B} k={r.key} counts={counts} /></div>
            </div>
          ))}
        </div>
        <p className="vs-note">
          Gravity Score measures how much of a coherent, documented identity is on record for a brand in the
          BrandMD index, not how successful the business is. Business-model tags appear only when the record's
          industry names the model.
        </p>

        <div className="vs-split">
          <section className="vs-panel">
            <h2>Where they differ</h2>
            {v.differ.length ? <ul className="vs-list">{v.differ.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="vs-muted">No compared field differs.</p>}
          </section>
          <section className="vs-panel">
            <h2>Where they overlap</h2>
            {v.overlap.length ? <ul className="vs-list">{v.overlap.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="vs-muted">No compared field matches.</p>}
          </section>
        </div>

        {suggestions.length > 0 && (
          <section className="vs-deeper">
            <h2>More battles in the same sector</h2>
            <div className="vs-next">
              {suggestions.map((s) => (
                <Link key={s.key} to={s.path} className="vs-next-card">
                  <span className="vs-next-names">{s.aName} <span className="vs-blue">vs</span> {s.bName}</span>
                  <span className="vs-next-why">{s.curated ? "Curated: " : ""}{s.reason.charAt(0).toUpperCase() + s.reason.slice(1)}.</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="vs-deeper">
          <h2>Go deeper</h2>
          <div className="vs-pills">
            <Link to={`/brands/${A.slug}`} className="vs-pill">{A.name} brand system</Link>
            <Link to={`/brands/${B.slug}`} className="vs-pill">{B.name} brand system</Link>
            {hubLinks.map((l) => <Link key={l.to} to={l.to} className="vs-pill">{l.label}</Link>)}
          </div>
        </section>

        <div style={{ marginTop: 40 }}>
          <BattleBuilder brands={brands} initialA={A.slug} heading="Start another battle" currentKey={found.key} id="another" />
        </div>

        <section className="vs-panel vs-compare-cta">
          <div>
            <h2>Your site against a competitor</h2>
            <p>Compare scans two or three live websites with the same lens and scores each one.</p>
          </div>
          <Link to="/compare" className="vs-btn">Open Compare</Link>
        </section>

        <ClosingCta />

        <section className="vs-deeper">
          <h2>Curated battles</h2>
          <div className="vs-pills">
            {curated.map((p) => (
              <Link key={p.key} to={p.path} className="vs-pill">{nameOf[p.a] || p.a} vs {nameOf[p.b] || p.b}</Link>
            ))}
          </div>
          <p className="vs-foot-links"><Link to={HUB_PATH}>All of {FAMILY_NAME}</Link> · <Link to="/research">Back to Research</Link></p>
        </section>
      </main>
    </div>
  );
}
