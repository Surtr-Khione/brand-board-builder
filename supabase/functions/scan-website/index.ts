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

// ── helpers ───────────────────────────────────────────────────────────────────

function normalizeHex(hex: string): string {
  hex = hex.toLowerCase();
  if (hex.length === 4) return "#" + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
  return hex;
}

function luma(hex: string): number {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000;
}

function saturation(hex: string): number {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return Math.max(r,g,b) - Math.min(r,g,b);
}

function isNeutral(hex: string): boolean {
  const l = luma(hex);
  const s = saturation(hex);
  return s < 18 || l < 18 || l > 238;
}

// ── semantic color extraction ─────────────────────────────────────────────────

interface ColorRoles {
  cssVars: string[];
  headings: string[];
  bodyText: string[];
  backgrounds: string[];
  ctaButtons: string[];
  links: string[];
  navBg: string[];
  themeColor: string | null;
}

function extractSemanticColors(css: string, html: string): ColorRoles {
  const roles: ColorRoles = {
    cssVars: [], headings: [], bodyText: [], backgrounds: [],
    ctaButtons: [], links: [], navBg: [], themeColor: null,
  };

  // 1. theme-color meta
  const tc = /<meta[^>]*name="theme-color"[^>]*content="(#[0-9a-fA-F]{3,6})"/i.exec(html)?.[1];
  if (tc) roles.themeColor = normalizeHex(tc);

  // 2. Named CSS custom properties
  const varPattern = /--([\w-]*(?:primary|brand|main|accent|secondary|highlight|foreground|color|bg|background)[\w-]*)\s*:\s*(#[0-9a-fA-F]{3,6})/gi;
  for (const m of css.matchAll(varPattern)) {
    const v = normalizeHex(m[2]);
    if (!roles.cssVars.includes(v)) roles.cssVars.push(v);
  }

  // 3. CSS rule blocks
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const ruleRx = /([^{}]+)\{([^{}]*)\}/g;
  for (const rule of stripped.matchAll(ruleRx)) {
    const sel = rule[1].trim().toLowerCase();
    const body = rule[2];

    const bgM = /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/i.exec(body);
    const colorM = /(?:^|;)\s*color\s*:\s*(#[0-9a-fA-F]{3,6})/i.exec(body);
    const bg = bgM ? normalizeHex(bgM[1]) : null;
    const color = colorM ? normalizeHex(colorM[1]) : null;

    if (/\bh[1-3]\b|\.h[1-3]\b|heading/.test(sel)) {
      if (color) roles.headings.push(color);
    }
    if (/(?:^|\s|,)body(?:\s|,|$|\{)/.test(sel) || /\bp\b/.test(sel)) {
      if (bg) roles.backgrounds.push(bg);
      if (color) roles.bodyText.push(color);
    }
    if (/\bhtml\b/.test(sel) || /\bmain\b|\bwrapper\b|\bcontainer\b/.test(sel)) {
      if (bg) roles.backgrounds.push(bg);
    }
    if (/\bbutton\b|\.btn(?:\b|\s)|\.cta(?:\b|\s)/.test(sel)) {
      if (bg && !isNeutral(bg)) roles.ctaButtons.push(bg);
    }
    if (/(?:^|\s|,)a(?:\s|,|$|:)/.test(sel) || /\.link\b/.test(sel)) {
      if (color && !isNeutral(color)) roles.links.push(color);
    }
    if (/\bnav\b|\.nav\b|\bnavbar\b|\bheader\b/.test(sel)) {
      if (bg) roles.navBg.push(bg);
    }
  }

  // 4. Inline HTML element colors
  for (const m of html.matchAll(/<h[1-3][^>]*style="[^"]*\bcolor\s*:\s*(#[0-9a-fA-F]{3,6})/gi)) {
    roles.headings.push(normalizeHex(m[1]));
  }
  for (const m of html.matchAll(/<(?:button|a)[^>]*style="[^"]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6})/gi)) {
    const v = normalizeHex(m[1]);
    if (!isNeutral(v)) roles.ctaButtons.push(v);
  }

  // Deduplicate each role
  for (const k of Object.keys(roles) as (keyof ColorRoles)[]) {
    if (Array.isArray(roles[k])) {
      (roles as Record<string, string[]>)[k] = [...new Set((roles as Record<string, string[]>)[k])];
    }
  }

  return roles;
}

// ── raw color frequency ───────────────────────────────────────────────────────

function countAllColors(css: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const m of css.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const c = normalizeHex(m[0]);
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  for (const m of css.matchAll(/#[0-9a-fA-F]{3}\b/g)) {
    const c = normalizeHex(m[0]);
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return counts;
}

// ── font extraction ───────────────────────────────────────────────────────────

const SYSTEM_FONTS = new Set([
  "inherit","initial","unset","system-ui","sans-serif","serif","monospace",
  "-apple-system","blinkmacsystemfont","segoe ui","helvetica neue","arial",
  "helvetica","verdana","trebuchet ms","times new roman","georgia",
]);

function extractFonts(css: string): string[] {
  const fonts: string[] = [];
  for (const m of css.matchAll(/font-family\s*:\s*([^;}"']+)/gi)) {
    const first = m[1].split(",")[0].trim().replace(/['"]/g, "");
    if (first.length > 2 && !SYSTEM_FONTS.has(first.toLowerCase())) fonts.push(first);
  }
  return [...new Set(fonts)];
}

// ── icon / social extraction ──────────────────────────────────────────────────

const SOCIAL_PATTERNS: Record<string, RegExp> = {
  instagram:      /https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|stories\/)([a-zA-Z0-9_.]{1,30})\/?(?=[^a-zA-Z0-9_.]|$)/g,
  linkedin:       /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]{2,50})\/?/g,
  facebook:       /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog)([a-zA-Z0-9_.]{3,50})\/?(?=[^a-zA-Z0-9_.]|$)/g,
  twitter:        /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]{1,15})\/?(?=[^a-zA-Z0-9_]|$)/g,
  youtube:        /https?:\/\/(?:www\.)?youtube\.com\/(?:@[a-zA-Z0-9_.-]+|channel\/[a-zA-Z0-9_-]+|user\/[a-zA-Z0-9_-]+)/g,
  tiktok:         /https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]{2,30})/g,
  pinterest:      /https?:\/\/(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]{3,30})\/?(?=[^a-zA-Z0-9_]|$)/g,
  spotify:        /https?:\/\/open\.spotify\.com\/show\/[a-zA-Z0-9]{10,}/g,
  applepodcasts:  /https?:\/\/podcasts\.apple\.com\/[a-z-]+\/podcast\/[^"'\s>]+/g,
  soundcloud:     /https?:\/\/soundcloud\.com\/([a-zA-Z0-9_-]{3,50})(?:\/[a-zA-Z0-9_-]+)?/g,
  podcastrss:     /<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/gi,
};

function detectSocialUrls(html: string): Record<string, string> {
  const discovered: Record<string, string> = {};
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    pattern.lastIndex = 0;
    const m = pattern.exec(html);
    if (m) discovered[platform] = platform === "podcastrss" ? m[1] : m[0];
  }
  return discovered;
}

function extractIcons(html: string, baseUrl: string): { faviconUrl: string | null; appleIconUrl: string | null; ogImage: string | null } {
  const resolve = (u: string) => {
    try { return u.startsWith("http") ? u : new URL(u, baseUrl).href; }
    catch { return null; }
  };

  const applePats = [
    /<link[^>]*rel="apple-touch-icon(?:-precomposed)?"[^>]*href="([^"]+)"/i,
    /<link[^>]*href="([^"]+)"[^>]*rel="apple-touch-icon(?:-precomposed)?"/i,
  ];
  let appleIconUrl: string | null = null;
  for (const p of applePats) {
    const m = p.exec(html);
    if (m) { appleIconUrl = resolve(m[1]); break; }
  }

  const iconPats = [
    /<link[^>]*rel="icon"[^>]*href="([^"]+\.svg[^"]*)"/i,
    /<link[^>]*href="([^"]+\.svg[^"]*)"[^>]*rel="icon"/i,
    /<link[^>]*rel="icon"[^>]*href="([^"]+\.png[^"]*)"/i,
    /<link[^>]*href="([^"]+\.png[^"]*)"[^>]*rel="icon"/i,
    /<link[^>]*rel="(?:shortcut )?icon"[^>]*href="([^"]+)"/i,
    /<link[^>]*href="([^"]+)"[^>]*rel="(?:shortcut )?icon"/i,
  ];
  let faviconUrl: string | null = null;
  for (const p of iconPats) {
    const m = p.exec(html);
    if (m) { faviconUrl = resolve(m[1]); break; }
  }

  const ogM = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i.exec(html)
    || /<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i.exec(html);
  const ogImage = ogM ? resolve(ogM[1]) : null;

  return { faviconUrl, appleIconUrl, ogImage };
}

// ── CSS color picking (non-page-builder sites) ────────────────────────────────

function pickColors(roles: ColorRoles, counts: Map<string, number>): {
  primary: string; secondary: string; accent: string;
  colorMap: { role: string; color: string }[];
} {
  const colorMap: { role: string; color: string }[] = [];
  const candidates: string[] = [];

  if (roles.themeColor && !isNeutral(roles.themeColor)) {
    candidates.push(roles.themeColor);
    colorMap.push({ role: "Theme Color", color: roles.themeColor });
  }
  for (const c of roles.cssVars.filter(v => !isNeutral(v))) {
    candidates.push(c);
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Brand Variable", color: c });
  }
  for (const c of roles.ctaButtons.filter(v => !isNeutral(v))) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "CTA / Button", color: c });
    candidates.push(c);
  }
  for (const c of roles.links.filter(v => !isNeutral(v))) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Link / Accent", color: c });
    candidates.push(c);
  }
  for (const c of roles.headings) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Heading", color: c });
    if (!isNeutral(c)) candidates.push(c);
  }
  for (const c of roles.navBg.filter(v => !isNeutral(v))) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Navigation", color: c });
    candidates.push(c);
  }
  for (const c of [...new Set(roles.backgrounds)]) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Background", color: c });
  }
  for (const c of roles.bodyText) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Body Text", color: c });
  }

  if (candidates.length < 3) {
    const vivid = [...counts.entries()]
      .sort((a,b) => b[1]-a[1])
      .map(([c]) => c)
      .filter(c => !isNeutral(c) && saturation(c) > 25);
    for (const c of vivid) {
      if (candidates.length >= 5) break;
      if (!candidates.includes(c)) candidates.push(c);
    }
  }

  const deduped = [...new Set(candidates)];
  return {
    primary: deduped[0] || "#e94560",
    secondary: deduped[1] || "#1a1a2e",
    accent: deduped[2] || "#f39c12",
    colorMap: colorMap.slice(0, 10),
  };
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

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
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n");
}

// ── platform detection ────────────────────────────────────────────────────────

const FRAMEWORK_SIGNALS: Record<string, string> = {
  "leadconnectorhq.com": "GoHighLevel",
  "highlevel.com": "GoHighLevel",
  "cdn.shopify.com": "Shopify",
  "assets.squarespace.com": "Squarespace",
  "static.wixstatic.com": "Wix",
  "webflow.com/css": "Webflow",
  "elementor": "WordPress/Elementor",
};

function detectPlatform(html: string): { platform: string | null; isPageBuilder: boolean } {
  for (const [signal, platform] of Object.entries(FRAMEWORK_SIGNALS)) {
    if (html.includes(signal)) return { platform, isPageBuilder: true };
  }
  return { platform: null, isPageBuilder: false };
}

// ── vision color extraction ───────────────────────────────────────────────────
// Fetches up to 3 images in parallel and sends them all to Claude Vision.
// Returns an ordered palette of {hex, role} with 2–6 entries.

async function analyzeImageColors(
  imageUrls: string[],
  apiKey: string,
): Promise<Array<{hex: string; role: string}> | null> {
  // Fetch all images in parallel
  const imageBlocks = (await Promise.all(
    imageUrls.slice(0, 3).map(async url => {
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!resp.ok) return null;
        const ct = resp.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) return null;
        const buf = await resp.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const b64 = btoa(bin);
        return { type: "image", source: { type: "base64", media_type: ct, data: b64 } };
      } catch {
        return null;
      }
    })
  )).filter(Boolean) as object[];

  if (imageBlocks.length === 0) return null;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Extract the complete brand color palette from these brand assets (logo, social card, or icon).

CRITICAL RULES:
- Luxury and minimal brands often use black, white, silver, gray, cream as their PRIMARY brand colors — include these, do NOT skip them
- List 2 to 6 colors, ordered from most dominant/prominent to least
- Assign a clear semantic role to each: Background, Text, Logo, Heading, Button, Accent, Border, or a descriptive word
- Exclude: stock photo skin tones, nature scenery colors, random image noise
- Focus on colors that define the brand identity and would appear across marketing materials

Respond ONLY with valid JSON, no explanation:
{"palette":[{"hex":"#RRGGBB","role":"Background"},{"hex":"#RRGGBB","role":"Text"}]}`,
            },
          ],
        }],
      }),
    });

    const d = await r.json();
    const raw: string = d.content?.[0]?.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    if (!Array.isArray(parsed.palette) || parsed.palette.length === 0) return null;
    return parsed.palette
      .filter((c: {hex?: string; role?: string}) =>
        typeof c.hex === "string" && /^#[0-9a-fA-F]{6}$/i.test(c.hex) && typeof c.role === "string"
      )
      .slice(0, 6) as Array<{hex: string; role: string}>;
  } catch {
    return null;
  }
}

// ── main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { url } = await req.json();
    if (!url) return json({ error: "url required" }, 400);

    const target = /^https?:\/\//.test(url) ? url : `https://${url}`;

    const pageResp = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandBot/1.0)" },
      signal: AbortSignal.timeout(12_000),
    });
    const html = await pageResp.text();

    const { platform, isPageBuilder } = detectPlatform(html);

    const meta = extractMeta(html);
    const pageText = extractText(html);
    const icons = extractIcons(html, target);

    let domain = "";
    try { domain = new URL(target).hostname; } catch {}
    const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}?size=600` : null;
    const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256` : null;

    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    // ── Color resolution ──────────────────────────────────────────────────────
    // Page builders (GHL, Shopify, Squarespace, Wix): CSS is 100% framework noise.
    // Skip CSS entirely and go straight to vision on brand images.
    // For regular sites: extract from CSS, fall back to vision if < 2 vivid colors.

    let primary = "#e94560";
    let secondary = "#1a1a2e";
    let accent = "#f39c12";
    let colorMap: {role: string; color: string}[] = [];
    let colorSource = "css";
    let fonts: string[] = [];

    if (!isPageBuilder) {
      // CSS path for sites with real CSS
      let css = extractInlineCSS(html);

      const cssLinks = [...html.matchAll(/href="([^"]+\.css(?:[^"?#]*))/g)]
        .map(m => {
          try { return m[1].startsWith("http") ? m[1] : new URL(m[1], target).href; }
          catch { return null; }
        })
        .filter(Boolean) as string[];

      for (const link of cssLinks.slice(0, 3)) {
        try {
          const r = await fetch(link, { signal: AbortSignal.timeout(6_000) });
          css += "\n" + await r.text();
        } catch { /* skip */ }
      }

      fonts = extractFonts(css);
      const roles = extractSemanticColors(css, html);
      const counts = countAllColors(css);
      const picked = pickColors(roles, counts);
      primary = picked.primary;
      secondary = picked.secondary;
      accent = picked.accent;
      colorMap = picked.colorMap;
    }

    // Vision: always for page builders; fallback for CSS sites with < 2 vivid colors
    const needsVision = isPageBuilder || colorMap.filter(c => !isNeutral(c.color)).length < 2;

    if (needsVision && ANTHROPIC_KEY) {
      // Gather best brand images: og:image (social card), apple icon (logo), clearbit logo
      const visionUrls = [icons.ogImage, icons.appleIconUrl, clearbitUrl]
        .filter(Boolean) as string[];

      if (visionUrls.length > 0) {
        const palette = await analyzeImageColors(visionUrls, ANTHROPIC_KEY);
        if (palette && palette.length > 0) {
          colorMap = palette.map(c => ({ role: c.role, color: c.hex }));
          primary   = palette[0].hex;
          secondary = palette[1]?.hex ?? palette[0].hex;
          accent    = palette[2]?.hex ?? palette[1]?.hex ?? palette[0].hex;
          colorSource = "vision";
        } else if (isPageBuilder) {
          colorSource = "unknown";
        }
      } else if (isPageBuilder) {
        colorSource = "unknown";
      }
    }

    // ── AI brand analysis ─────────────────────────────────────────────────────

    const discoveredUrls = detectSocialUrls(html);
    let analysis: Record<string, unknown> = {};

    if (ANTHROPIC_KEY) {
      const displayName = meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim();
      const colorSummary = colorMap.map(x => `  ${x.role}: ${x.color}`).join("\n") ||
        `  Primary: ${primary}`;
      const platformNote = platform
        ? `\nNOTE: Built on ${platform} — CSS vars are framework defaults, not brand colors. Infer brand identity from content only.`
        : "";

      const prompt = `Analyze this website and extract brand identity. Return ONLY valid JSON.

URL: ${target}
Brand: ${displayName}
Description: ${meta.description || meta.ogDesc || "(none)"}
H1: ${meta.h1 || "(none)"}
Page text: ${pageText.slice(0, 2000)}

Colors (source: ${colorSource}):
${colorSummary}
Fonts: ${fonts.slice(0,4).join(", ") || "none detected"}${platformNote}

Respond with exactly this JSON (1–2 sentences max per field):
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
      } catch { /* leave empty */ }
    } else {
      analysis = {
        brandName: meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim(),
        tagline: (meta.description || meta.ogDesc || "").slice(0, 120),
        industry: meta.keywords?.split(",")[0]?.trim() || "",
      };
    }

    const platformWarning = platform
      ? `${platform} site — page CSS is framework-generated, not brand-specific. Colors above are extracted visually from your brand images (og:image, logo). For exact hex values, enter them manually.`
      : null;

    return json({
      success: true,
      primaryColor: primary,
      secondaryColor: secondary,
      accentColor: accent,
      colorMap,
      colorSource,
      platformDetected: platform,
      platformWarning,
      fonts,
      meta,
      analysis,
      hasAI: !!ANTHROPIC_KEY,
      faviconUrl: icons.appleIconUrl || icons.faviconUrl,
      logoUrl: clearbitUrl,
      googleFaviconUrl,
      ogImage: icons.ogImage,
      discoveredUrls,
      iconSources: {
        appleIcon: icons.appleIconUrl,
        favicon: icons.faviconUrl,
        clearbit: clearbitUrl,
        googleFavicon: googleFaviconUrl,
        ogImage: icons.ogImage,
      },
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
