import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { findPair, buildVersus, versusPairs, hasField, pairTitle, pairDescription } from "./versusModel";
import { useBrandIndex, useMeta, Swatches, ClosingCta, Spinner } from "./versusShared";

function Cell({ s, k }) {
  if (!hasField(s, k)) return <span className="vs-none">Not on record</span>;
  const v = s[k];
  switch (k) {
    case "archetype":
      return (
        <span>
          <Link to={`/archetypes/${v.slug}`}>{v.name}</Link>
          {s.secondary && <> with <Link to={`/archetypes/${s.secondary.slug}`}>{s.secondary.name}</Link> as secondary</>}
          {s.rawArchetype && s.rawArchetype !== v.name && <span className="vs-raw">Recorded as &ldquo;{s.rawArchetype}&rdquo;</span>}
        </span>
      );
    case "sector":
      return (
        <span>
          <Link to={`/sectors/${v.slug}`}>{v.name}</Link>
          {s.industry && <span className="vs-raw">{s.industry}</span>}
        </span>
      );
    case "tagline":
      return <span className="vs-tagline">&ldquo;{v}&rdquo;</span>;
    case "values": case "dos": case "donts":
      return <ul className="vs-list">{v.map((x, i) => <li key={i}>{x}</li>)}</ul>;
    case "tone":
      return <span className="vs-chips">{v.map((t, i) => <span key={i} className="vs-chip">{t}</span>)}</span>;
    case "colours":
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
      <Swatches colours={s.colours} size={12} />
      {s.website && <div className="vs-head-site">{s.website}</div>}
    </div>
  );
}

export default function VersusPair() {
  const { pair: param } = useParams();
  const found = useMemo(() => findPair(param), [param]);
  const { loading, brands } = useBrandIndex();

  const v = useMemo(() => {
    if (!found) return null;
    const a = brands.find((b) => b.slug === found.pair.a);
    const b = brands.find((b) => b.slug === found.pair.b);
    return a && b ? buildVersus(a, b, found.pair.basis) : null;
  }, [brands, found]);

  useMeta(v ? pairTitle(v.A, v.B) : "Brand vs Brand | BrandMD", v ? pairDescription(v.A, v.B) : null);

  if (found && !found.canonical) return <Navigate to={found.pair.path} replace />;

  if (!found || (!loading && !v)) {
    return (
      <div className="vs-page">
        <SiteNav />
        <main className="vs-wrap" style={{ textAlign: "center", paddingTop: 100 }}>
          <h1 className="vs-h1-sm">Matchup not found</h1>
          <p className="vs-muted">There is no curated pair at this address.</p>
          <p><Link to="/versus">See all matchups</Link> · <Link to="/research">Research</Link></p>
        </main>
      </div>
    );
  }

  if (loading || !v) {
    return <div className="vs-page"><SiteNav /><Spinner /></div>;
  }

  const { A, B } = v;
  const others = versusPairs().filter((p) => p.key !== found.pair.key);
  const nameOf = Object.fromEntries(brands.map((b) => [b.slug, b.brand_name]));
  const hubLinks = [];
  if (A.archetype) hubLinks.push({ to: `/archetypes/${A.archetype.slug}`, label: A.archetype.name });
  if (B.archetype && B.archetype.slug !== A.archetype?.slug) hubLinks.push({ to: `/archetypes/${B.archetype.slug}`, label: B.archetype.name });
  if (A.sector) hubLinks.push({ to: `/sectors/${A.sector.slug}`, label: A.sector.name });
  if (B.sector && B.sector.slug !== A.sector?.slug) hubLinks.push({ to: `/sectors/${B.sector.slug}`, label: B.sector.name });

  return (
    <div className="vs-page">
      <SiteNav />
      <header className="vs-hero">
        <nav className="vs-crumbs" aria-label="Breadcrumb">
          <Link to="/research">Research</Link><span>/</span><Link to="/versus">Versus</Link><span>/</span><span>{A.name} vs {B.name}</span>
        </nav>
        <h1>{A.name} <span className="vs-blue">vs</span> {B.name}</h1>
        <p className="vs-basis"><span>Why they are paired</span>{v.basis.charAt(0).toUpperCase() + v.basis.slice(1)}.</p>
        <p className="vs-intro">
          The two brand systems side by side, each value taken from the brand's own record in the BrandMD
          index. Where a record has no entry for a field, it says so instead of filling one in. Below the
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
              <div className="vs-cell" role="cell"><span className="vs-who">{A.name}</span><Cell s={A} k={r.key} /></div>
              <div className="vs-cell" role="cell"><span className="vs-who">{B.name}</span><Cell s={B} k={r.key} /></div>
            </div>
          ))}
        </div>
        <p className="vs-note">
          Gravity Score measures how much of a coherent, documented identity is on record for a brand in the
          BrandMD index, not how successful the business is.
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

        <section className="vs-deeper">
          <h2>Go deeper</h2>
          <div className="vs-pills">
            <Link to={`/brands/${A.slug}`} className="vs-pill">{A.name} brand system</Link>
            <Link to={`/brands/${B.slug}`} className="vs-pill">{B.name} brand system</Link>
            {hubLinks.map((l) => <Link key={l.to} to={l.to} className="vs-pill">{l.label}</Link>)}
          </div>
        </section>

        <section className="vs-panel vs-compare-cta">
          <div>
            <h2>Your site against a competitor</h2>
            <p>Compare scans two or three live websites with the same lens and scores each one.</p>
          </div>
          <Link to="/compare" className="vs-btn">Open Compare</Link>
        </section>

        <ClosingCta />

        <section className="vs-deeper">
          <h2>More matchups</h2>
          <div className="vs-pills">
            {others.map((p) => (
              <Link key={p.key} to={p.path} className="vs-pill">{nameOf[p.a] || p.a} vs {nameOf[p.b] || p.b}</Link>
            ))}
          </div>
          <p className="vs-foot-links"><Link to="/versus">All matchups</Link> · <Link to="/research">Back to Research</Link></p>
        </section>
      </main>
    </div>
  );
}
