import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { searchBrands } from "../../../lib/brands";
import { archetypeOf, archetypeLabel, sectorsOf } from "../../../lib/brandTaxonomy.js";
import { battlePath, curatedPair } from "./battleModel";
import "./battles.css";

// The whole index, read in pages of 100 (search-brands caps limit at 100).
// List mode is read-only (slug mode bumps a view counter), and one cached
// promise serves the hub and every battle page in a session.
let indexPromise = null;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = (async () => {
      const all = [];
      let total = 0;
      for (let offset = 0; offset < 2000; offset += 100) {
        const d = await searchBrands({ limit: 100, offset });
        const page = Array.isArray(d?.brands) ? d.brands : [];
        total = d?.totalBrands || total;
        all.push(...page);
        if (page.length < 100) break;
      }
      return { brands: all, total: total || all.length };
    })().catch(() => { indexPromise = null; return { brands: [], total: 0 }; });
  }
  return indexPromise;
}

export function useBrandIndex() {
  const [state, setState] = useState({ loading: true, brands: [], total: 0 });
  useEffect(() => {
    let live = true;
    loadIndex().then((r) => { if (live) setState({ loading: false, ...r }); });
    return () => { live = false; };
  }, []);
  return state;
}

// Title + meta description for client-side navigation (the prerendered HTML
// carries the same values for crawlers).
export function useMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
      m.setAttribute("content", description);
    }
  }, [title, description]);
}

// <meta name="robots" content="noindex"> while `on`; restored on leave, so a
// picked battle is never indexed and a curated one navigated to next is.
export function useNoindex(on) {
  useEffect(() => {
    if (!on) return undefined;
    let m = document.querySelector('meta[name="robots"]');
    const created = !m;
    const prev = m ? m.getAttribute("content") : null;
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "robots"); document.head.appendChild(m); }
    m.setAttribute("content", "noindex");
    return () => {
      if (created) m.remove();
      else if (prev !== null) m.setAttribute("content", prev);
    };
  }, [on]);
}

export function Swatches({ colors, size = 14 }) {
  if (!colors?.length) return null;
  return (
    <span className="vs-swatches">
      {colors.map((c, i) => (
        <span key={i} className="vs-swatch" title={`${c.role} ${c.hex}`} style={{ background: c.hex, width: size, height: size }} />
      ))}
    </span>
  );
}

// ── Battle builder: two searchable brand pickers ─────────────────────────
// Options are the index's brands, searchable by name, archetype or sector tag.
function useOptions(brands) {
  return useMemo(() => brands
    .map((b) => {
      const name = String(b.brand_name || b.slug);
      const a = archetypeOf(b);
      const { all } = sectorsOf(b);
      const arch = a ? archetypeLabel(a) : "";
      const sectors = all.map((s) => s.name);
      return {
        slug: b.slug,
        name,
        meta: [arch, sectors.join(", ")].filter(Boolean).join(" · "),
        search: [name, arch, ...sectors].join(" ").toLowerCase(),
      };
    })
    .sort((x, y) => x.name.localeCompare(y.name)), [brands]);
}

function BrandPicker({ label, options, value, onChange, otherValue }) {
  const uid = useId().replace(/:/g, "");
  const listId = `bp-list-${uid}`;
  const inputId = `bp-input-${uid}`;
  const selected = options.find((o) => o.slug === value) || null;
  const [q, setQ] = useState(selected ? selected.name : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  useEffect(() => { setQ(selected ? selected.name : ""); }, [selected]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t || (selected && q === selected.name)) return options;
    const words = t.split(/\s+/);
    return options.filter((o) => words.every((w) => o.search.includes(w)));
  }, [q, options, selected]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-i="${active}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (o) => {
    if (!o || o.slug === otherValue) return;
    onChange(o.slug);
    setQ(o.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); else setActive((i) => Math.min(i + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { if (open && shown[active]) { e.preventDefault(); choose(shown[active]); } }
    else if (e.key === "Escape") { setOpen(false); setQ(selected ? selected.name : ""); }
  };

  return (
    <div className="bp">
      <label htmlFor={inputId} className="bp-label">{label}</label>
      <div className="bp-field">
        <input
          id={inputId}
          className="bp-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search by name, archetype or sector"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
          onFocus={(e) => { setOpen(true); e.target.select(); }}
          onBlur={() => { setOpen(false); setQ(selected ? selected.name : ""); }}
          onKeyDown={onKeyDown}
        />
        {open && (
          <ul id={listId} role="listbox" className="bp-list" ref={listRef} aria-label={label}>
            {shown.length === 0 && <li className="bp-empty" role="presentation">No brand in the index matches.</li>}
            {shown.map((o, i) => {
              const taken = o.slug === otherValue;
              return (
                <li
                  key={o.slug}
                  id={`${listId}-${i}`}
                  data-i={i}
                  role="option"
                  aria-selected={i === active}
                  aria-disabled={taken || undefined}
                  className={`bp-opt${i === active ? " bp-active" : ""}${taken ? " bp-taken" : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                >
                  <span className="bp-name">{o.name}{taken && <span className="bp-tag"> already picked</span>}</span>
                  {o.meta && <span className="bp-meta">{o.meta}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// `initialA`/`initialB` prefill the pickers; `currentKey` (on a battle page)
// keeps the button from "starting" the battle already on screen.
export function BattleBuilder({ brands, initialA = "", initialB = "", heading = "Pick any two", currentKey = null, id }) {
  const options = useOptions(brands);
  const navigate = useNavigate();
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  useEffect(() => { setA(initialA); setB(initialB); }, [initialA, initialB]);

  const ready = a && b && a !== b;
  const path = ready ? battlePath(a, b) : null;
  const key = path ? path.split("/").pop() : null;
  const same = ready && key === currentKey;
  const cur = ready ? curatedPair(a, b) : null;

  const start = (e) => {
    e.preventDefault();
    if (ready && !same) navigate(path);
  };

  return (
    <section className="vs-panel bb" id={id} aria-labelledby={`${id || "bb"}-h`}>
      <h2 id={`${id || "bb"}-h`}>{heading}</h2>
      <p className="bb-intro">
        Choose any two of the {brands.length} brands in the index and see their records side by side.
      </p>
      <form className="bb-form" onSubmit={start}>
        <BrandPicker label="First brand" options={options} value={a} onChange={setA} otherValue={b} />
        <div className="bb-vs" aria-hidden="true">vs</div>
        <BrandPicker label="Second brand" options={options} value={b} onChange={setB} otherValue={a} />
        <button type="submit" className="vs-btn vs-btn-primary bb-go" disabled={!ready || same}>
          Start the battle
        </button>
      </form>
      <p className="bb-status" aria-live="polite">
        {!ready ? "Pick two different brands to start." : same ? "That battle is on this page. Change a brand to start another." : cur ? `One of the curated battles: ${cur.basis}.` : "A battle you picked: the side-by-side is built from the two records."}
      </p>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="vs-cta">
      <h2>Chart your own brand</h2>
      <p>
        Every battle here is built from a documented brand system: archetype, enemy, promise,
        values, voice, colors and type. Put yours on record and see where it lands.
      </p>
      <div className="vs-cta-row">
        <Link to="/builder" className="vs-btn vs-btn-primary">Build your brand</Link>
        <Link to="/analyzer" className="vs-btn">Scan your site</Link>
      </div>
    </section>
  );
}

export function Spinner() {
  return (
    <div className="vs-loading" aria-label="Loading">
      <div className="vs-spin" />
    </div>
  );
}
