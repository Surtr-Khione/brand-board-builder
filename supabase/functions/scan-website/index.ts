const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── color extraction ──────────────────────────────────────────────────────────

function extractColors(css: string): Record<string, number> {
  const counts: Record<string, number> = {};

  const normalize = (hex: string): string => {
    if (hex.length === 4) {
      return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.toLowerCase();
  };

  for (const m of css.matchAll(/#[0-9a-fA-F]{6}\b/g)) counts[normalize(m[0])] = (counts[normalize(m[0])] || 0) + 1;
  for (const m of css.matchAll(/#[0-9a-fA-F]{3}\b/g)) { const n = normalize(m[0]); counts[n] = (counts[n] || 0) + 1; }

  return counts;
}

function saturation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function brightness(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r + g + b) / 3;
}

function pickBrandColors(counts: Record<string, number>): {
  primary: string; secondary: string; accent: string; allVivid: string[];
} {
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);

  // Vivid = not near-white or near-black, has some saturation
  const vivid = sorted.filter(c => {
    const b = brightness(c);
    const s = saturation(c);
    return s > 25 && b > 35 && b < 225;
  });

  return {
    primary: vivid[0] || "#e94560",
    secondary: vivid[1] || "#1a1a2e",
    accent: vivid[2] || "#f39c12",
    allVivid: vivid.slice(0, 10),
  };
}

// ── font extraction ───────────────────────────────────────────────────────────

const SYSTEM_FONTS = new Set([
  "inherit", "initial", "unset", "system-ui", "sans-serif", "serif", "monospace",
  "-apple-system", "blinkmacsystemfont", "segoe ui", "helvetica neue", "arial",
  "helvetica", "verdana", "trebuchet ms", "times new roman", "georgia",
]);

function extractFonts(css: string): string[] {
  const fonts: string[] = [];
  for (const m of css.matchAll(/font-family\s*:\s*([^;}"']+)/gi)) {
    const first = m[1].split(",")[0].trim().replace(/['"]/g, "");
    if (first.length > 2 && !SYSTEM_FONTS.has(first.toLowerCase())) {
      fonts.push(first);
    }
  }
  return [...new Set(fonts)];
}

// ── meta extraction ───────────────────────────────────────────────────────────

function get(html: string, pattern: RegExp): string {
  return pattern.exec(html)?.[1]?.trim() || "";
}

function extractMeta(html: string) {
  return {
    title: get(html, /<title[^>]*>([^<]+)<\/title>/i),
    description:
      get(html, /<meta[^>]*name="description"[^>]*content="([^"]+)"/i) ||
      get(html, /<meta[^>]*content="([^"]+)"[^>]*name="description"/i),
    ogTitle: get(html, /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i),
    ogDesc: get(html, /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i),
    h1: get(html, /<h1[^>]*>([^<\n]{1,200})<\/h1>/i),
    h2: get(html, /<h2[^>]*>([^<\n]{1,200})<\/h2>/i),
    keywords: get(html, /<meta[^>]*name="keywords"[^>]*content="([^"]+)"/i),
    themeColor: get(html, /<meta[^>]*name="theme-color"[^>]*content="([^"]+)"/i),
  };
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3500);
}

function extractInlineCSS(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(m => m[1])
    .join("\n");
}

// ── main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url) return json({ error: "url required" }, 400);

    const target = /^https?:\/\//.test(url) ? url : `https://${url}`;

    // Fetch homepage
    const pageResp = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await pageResp.text();

    // Build CSS corpus: inline + up to 2 linked sheets
    let css = extractInlineCSS(html);
    const cssLinks = [...html.matchAll(/href="([^"]+\.css(?:[^"?#]*))/g)]
      .map(m => {
        try { return m[1].startsWith("http") ? m[1] : new URL(m[1], target).href; }
        catch { return null; }
      })
      .filter(Boolean) as string[];

    for (const link of cssLinks.slice(0, 2)) {
      try {
        const r = await fetch(link, { signal: AbortSignal.timeout(5_000) });
        css += "\n" + await r.text();
      } catch { /* skip failed sheets */ }
    }

    // Parse
    const colorCounts = extractColors(css);
    const { primary, secondary, accent, allVivid } = pickBrandColors(colorCounts);
    const fonts = extractFonts(css);
    const meta = extractMeta(html);
    const pageText = extractText(html);

    // Add theme-color as a high-weight hint if present
    if (meta.themeColor && /^#[0-9a-f]{3,6}$/i.test(meta.themeColor)) {
      const norm = meta.themeColor.length === 4
        ? "#" + meta.themeColor[1]+meta.themeColor[1]+meta.themeColor[2]+meta.themeColor[2]+meta.themeColor[3]+meta.themeColor[3]
        : meta.themeColor.toLowerCase();
      colorCounts[norm] = (colorCounts[norm] || 0) + 500;
    }

    // ── AI analysis: ONE Haiku call ───────────────────────────────────────────
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    let analysis: Record<string, unknown> = {};

    if (ANTHROPIC_KEY) {
      const displayName = meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim();
      const prompt = `Analyze this website and extract brand identity data. Return ONLY valid JSON — no markdown, no explanation.

URL: ${target}
Brand: ${displayName}
Description: ${meta.description || meta.ogDesc || "(none)"}
Headline: ${meta.h1 || meta.h2 || "(none)"}
Keywords: ${meta.keywords || "(none)"}
Page text: ${pageText.slice(0, 2000)}

Respond with exactly this JSON shape (keep values concise — 1–2 sentences max):
{
  "brandName": "${displayName || ""}",
  "tagline": "",
  "industry": "",
  "elevator": "",
  "mission": "",
  "archetype": "",
  "toneAttributes": ["", "", ""],
  "brandPersonality": ["", "", ""],
  "photoStyle": "",
  "photoMood": "",
  "socialPersonality": ""
}

archetype must be ONE of: The Hero, The Sage, The Explorer, The Creator, The Ruler, The Caregiver, The Magician, The Rebel, The Jester, The Lover, The Everyman, The Innocent`;

      try {
        const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 800,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const aiData = await aiResp.json();
        const raw: string = aiData.content?.[0]?.text || "{}";
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) analysis = JSON.parse(match[0]);
      } catch { /* leave analysis empty on AI failure */ }
    } else {
      // Zero-AI fallback: derive what we can from HTML metadata alone
      analysis = {
        brandName: meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim(),
        tagline: (meta.description || meta.ogDesc || "").slice(0, 120),
        industry: meta.keywords?.split(",")[0]?.trim() || "",
      };
    }

    return json({
      success: true,
      allVivid,
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      fonts,
      meta,
      analysis,
      hasAI: !!ANTHROPIC_KEY,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
