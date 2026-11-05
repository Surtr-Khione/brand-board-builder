import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Sets the document title and meta description for a research page (the
// prerendered HTML carries the same values for crawlers).
export function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", description);
    }
  }, [title, description]);
}

function luma(hex = "") {
  const h = String(hex).replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return isNaN(r + g + b) ? 0 : (r * 299 + g * 587 + b * 114) / 1000;
}

// Small app-icon face for a brand: its stored logo, else its initial on the
// brand's first light-safe color.
export function Face({ brand, link = true }) {
  const [broken, setBroken] = useState(false);
  const ink = [brand.primary_color, brand.accent_color, brand.secondary_color].find((c) => c && luma(c) < 200) || "#1D1D1F";
  const inner = brand.logo_url && !broken
    ? <img src={brand.logo_url} alt="" loading="lazy" onError={() => setBroken(true)} />
    : <span style={{ color: ink }}>{String(brand.brand_name || "?").charAt(0)}</span>;
  if (!link) return <span className="arx-face" title={brand.brand_name}>{inner}</span>;
  return <Link to={`/brands/${brand.slug}`} className="arx-face" title={brand.brand_name} aria-label={brand.brand_name}>{inner}</Link>;
}

export function ResearchCta() {
  return (
    <div className="arx-cta">
      <h2>Chart your own brand</h2>
      <p>Every brand above was decoded on the same lens. Build your own board with an archetype, enemy, values and voice, or scan your site and see what it already says.</p>
      <div className="arx-btns">
        <Link className="arx-btn primary" to="/builder">Chart your brand</Link>
        <Link className="arx-btn ghost" to="/analyzer">Scan your site</Link>
      </div>
      <Link className="arx-back" to="/research">← All brand research</Link>
    </div>
  );
}

const plural = (k, one, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

export function BrandLink({ brand }) {
  return <Link to={`/brands/${brand.slug}`}>{brand.brand_name}</Link>;
}

export function Section({ label, title, sub, id, children }) {
  return (
    <section className="arx-section" id={id}>
      {label && <div className="arx-label">{label}</div>}
      {title && <h2 className="arx-h2">{title}</h2>}
      {sub && <p className="arx-sub">{sub}</p>}
      {children}
    </section>
  );
}

export function Words({ words, of }) {
  if (!words.length) return null;
  return (
    <div className="arx-words">
      {words.map((w) => (
        <span key={w.word} className="arx-word" title={w.brands.map((b) => b.name).join(", ")}>
          {w.word}<small>{w.count} of {of}</small>
        </span>
      ))}
    </div>
  );
}

// "Mapped by BrandMD …" line under a brand whose archetype reading rests on
// a BrandMD judgment call (archetypeOf(brand).mappedNote).
export function MappedNote({ note }) {
  if (!note) return null;
  return <div className="arx-mapped">{note}</div>;
}

// Color, type, enemy, values and voice sections for one set of brands: `s`
// comes from patternsOf (archetypeData.js) and `P` is that set. `n` = how
// many brands it covers.
export function PatternSections({ s, P, n }) {
  const maxFam = Math.max(1, ...(s.colorFamilies || []).map((f) => f.count));
  const sharedFonts = (s.fonts || []).filter((f) => f.count >= 2);
  return (
    <>
      <Section
        label="Color"
        title="Most common color families"
        sub={`How many of the ${plural(s.withColors, "brand")} with stored colors use each family in their primary, secondary or accent color. Families are grouped from the hex codes by hue and lightness.`}
      >
        {s.colorFamilies.length ? (
          <div className="arx-rows">
            {s.colorFamilies.map((f) => (
              <div key={f.slug}>
                <div className="arx-row">
                  <div className="arx-row-name"><span className="arx-dot" style={{ background: f.swatch }} />{f.name}</div>
                  <div className="arx-row-track"><i style={{ width: `${(f.count / maxFam) * 100}%`, background: f.swatch }} /></div>
                  <div className="arx-row-n">{f.count} of {s.withColors}</div>
                </div>
                <div className="arx-hexes">{f.hexes.slice(0, 18).map((h) => <span key={h} title={h} style={{ background: h }} />)}</div>
              </div>
            ))}
          </div>
        ) : <p className="arx-empty">No colors are stored for these brands.</p>}
      </Section>

      <Section
        label="Type"
        title="Fonts on record"
        sub={s.withFonts ? `${plural(s.withFonts, "brand")} of ${n} ${s.withFonts === 1 ? "names its typefaces" : "name their typefaces"} in the index.` : `None of these ${plural(n, "record")} name a typeface yet.`}
      >
        {s.withFonts > 0 && (
          sharedFonts.length ? (
            <div className="arx-chips">
              {sharedFonts.map((f) => <span key={f.name} className="arx-chip" title={f.brands.join(", ")}>{f.name}<small>{f.count} brands</small></span>)}
            </div>
          ) : (
            <>
              <p className="arx-sub">No typeface is shared by two of them. Each brand's named fonts:</p>
              <ul className="arx-list">
                {P.filter((b) => [b.primary_font, b.body_font, b.accent_font].some(Boolean)).map((b) => (
                  <li key={b.slug}><BrandLink brand={b} />: {[b.primary_font, b.body_font, b.accent_font].filter(Boolean).join(" · ")}</li>
                ))}
              </ul>
            </>
          )
        )}
      </Section>

      <Section
        label="Enemy"
        title="What they stand against"
        sub={`Each brand's stated enemy, as recorded. Words that recur across ${plural(s.enemies.length, "enemy statement")} are counted first (once per brand).`}
      >
        <Words words={s.enemyWords} of={s.enemies.length} />
        <ul className="arx-list">
          {s.enemies.map((e) => (
            <li key={e.brand.slug}><span className="arx-who"><BrandLink brand={e.brand} /></span><q className="arx-q">{e.text}</q></li>
          ))}
        </ul>
      </Section>

      <Section
        label="Values"
        title="What they value"
        sub={`Words that recur in the core values of ${plural(s.values.length, "brand")} (once per brand), then each brand's values as recorded.`}
      >
        <Words words={s.valueWords} of={s.values.length} />
        <ul className="arx-list">
          {s.values.map((v) => (
            <li key={v.brand.slug}><span className="arx-who"><BrandLink brand={v.brand} /></span>{v.values.join(" · ")}</li>
          ))}
        </ul>
      </Section>

      <Section
        label="Voice"
        title="How they say it"
        sub={s.withVoice
          ? `Sample do and don't lines quoted from the voice rules of ${plural(s.withVoice, "brand")} of ${n} that have them on record.`
          : `None of these ${plural(n, "record")} carry written do and don't voice rules yet.`}
      >
        {s.withVoice > 0 && (
          <div className="arx-cols">
            <div>
              <div className="arx-label" style={{ letterSpacing: 2 }}>Do</div>
              <ul className="arx-list">
                {s.doSamples.map((d) => <li key={d.brand.slug} className="arx-do"><span className="arx-who"><BrandLink brand={d.brand} /></span><q className="arx-q">{d.text}</q></li>)}
                {!s.doSamples.length && <li>No "do" lines on record.</li>}
              </ul>
            </div>
            <div>
              <div className="arx-label" style={{ letterSpacing: 2 }}>Don't</div>
              <ul className="arx-list">
                {s.dontSamples.map((d) => <li key={d.brand.slug} className="arx-dont"><span className="arx-who"><BrandLink brand={d.brand} /></span><q className="arx-q">{d.text}</q></li>)}
                {!s.dontSamples.length && <li>No "don't" lines on record.</li>}
              </ul>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
