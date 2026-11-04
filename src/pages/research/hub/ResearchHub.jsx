import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteNav from "../../../components/SiteNav";
import { researchHubs } from "../../../research/registry";
import { searchBrands } from "../../../lib/brands";
import { RESEARCH_TITLE, researchDescription, researchIntro, orderHubs, LIBRARY_CARD } from "./researchHubData";
import "./research.css";

// One light call for the live brand count (the same totalBrands the Library shows).
let countPromise = null;
function loadCount() {
  if (!countPromise) {
    countPromise = searchBrands({ limit: 1 })
      .then((d) => d?.totalBrands || 0)
      .catch(() => { countPromise = null; return 0; });
  }
  return countPromise;
}

export default function ResearchHub() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    loadCount().then((c) => { if (live) setN(c); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    document.title = RESEARCH_TITLE;
    const m = document.querySelector('meta[name="description"]');
    if (m) m.setAttribute("content", researchDescription(n));
  }, [n]);

  const cards = [...orderHubs(researchHubs), LIBRARY_CARD];

  return (
    <div className="rs-page">
      <SiteNav />
      <header className="rs-hero">
        <h1>Brand <span>research</span></h1>
        <p>{researchIntro(n)}</p>
      </header>
      <main className="rs-wrap">
        <div className="rs-grid">
          {cards.map((h, i) => (
            <Link key={h.href} to={h.href} className="rs-card">
              <div className="rs-card-num">{String(i + 1).padStart(2, "0")}</div>
              <h2>{h.title}</h2>
              <p>{h.blurb}</p>
              <span className="rs-card-go">Open &rarr;</span>
            </Link>
          ))}
        </div>

        <section className="rs-cta">
          <h2>Chart your own brand</h2>
          <p>Every brand in this research was decoded on the same lens. Put your own brand on record, or scan your site and see what it already says.</p>
          <div className="rs-cta-row">
            <Link to="/builder" className="rs-btn rs-btn-primary">Chart your brand</Link>
            <Link to="/analyzer" className="rs-btn">Scan your site</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
