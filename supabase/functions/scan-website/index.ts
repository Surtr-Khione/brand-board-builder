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
  cssVars: string[];       // --primary-color etc — most reliable
  headings: string[];      // h1/h2 color
  bodyText: string[];      // body/p color
  backgrounds: string[];   // body/html/section bg
  ctaButtons: string[];    // button/.btn bg
  links: string[];         // a color
  navBg: string[];         // nav/header bg
  themeColor: string | null;  // <meta name="theme-color">
}

function extractSemanticColors(css: string, html: string): ColorRoles {
  const roles: ColorRoles = {
    cssVars: [], headings: [], bodyText: [], backgrounds: [],
    ctaButtons: [], links: [], navBg: [], themeColor: null,
  };

  // 1. theme-color meta — single most reliable brand color signal
  const tc = /<meta[^>]*name="theme-color"[^>]*content="(#[0-9a-fA-F]{3,6})"/i.exec(html)?.[1];
  if (tc) roles.themeColor = normalizeHex(tc);

  // 2. CSS custom properties — designers name these intentionally
  const varPattern = /--([\w-]*(?:primary|brand|main|accent|secondary|highlight|foreground|color|bg|background)[\w-]*)\s*:\s*(#[0-9a-fA-F]{3,6})/gi;
  for (const m of css.matchAll(varPattern)) {
    const v = normalizeHex(m[2]);
    if (!roles.cssVars.includes(v)) roles.cssVars.push(v);
  }

  // 3. CSS rule blocks: map selectors to color roles
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, ""); // remove comments
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
      if (bg && !isNeutral(bg)) roles.backgrounds.push(bg);
      else if (bg) roles.backgrounds.push(bg);
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

  // 4. Inline element colors from HTML
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

// ── raw color frequency (as a tiebreaker / fallback) ─────────────────────────

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

// ── icon / favicon extraction ─────────────────────────────────────────────────

// ── social / podcast URL auto-detection ──────────────────────────────────────

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
  amazonmusic:    /https?:\/\/music\.amazon\.com\/podcasts\/[a-zA-Z0-9_-]+/g,
  iheartradio:    /https?:\/\/(?:www\.)?iheart\.com\/podcast\/[a-zA-Z0-9_-]+/g,
  podcastrss:     /<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/gi,
};

function detectSocialUrls(html: string): Record<string, string> {
  const discovered: Record<string, string> = {};
  for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
    pattern.lastIndex = 0;
    const m = pattern.exec(html);
    if (m) {
      // For RSS, capture group 1 is the href; for others use full match
      discovered[platform] = platform === "podcastrss" ? m[1] : m[0];
    }
  }
  return discovered;
}

function extractIcons(html: string, baseUrl: string): { faviconUrl: string | null; appleIconUrl: string | null; ogImage: string | null } {
  const resolve = (u: string) => {
    try { return u.startsWith("http") ? u : new URL(u, baseUrl).href; }
    catch { return null; }
  };

  // Highest-res: apple-touch-icon (180×180 or 192×192)
  const applePats = [
    /<link[^>]*rel="apple-touch-icon(?:-precomposed)?"[^>]*href="([^"]+)"/i,
    /<link[^>]*href="([^"]+)"[^>]*rel="apple-touch-icon(?:-precomposed)?"/i,
  ];
  let appleIconUrl: string | null = null;
  for (const p of applePats) {
    const m = p.exec(html);
    if (m) { appleIconUrl = resolve(m[1]); break; }
  }

  // Standard favicon (prefer SVG → PNG → ico)
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

  // og:image as brand visual
  const ogM = /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i.exec(html)
    || /<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i.exec(html);
  const ogImage = ogM ? resolve(ogM[1]) : null;

  return { faviconUrl, appleIconUrl, ogImage };
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

// ── choose brand colors intelligently ─────────────────────────────────────────

function pickColors(roles: ColorRoles, counts: Map<string, number>): {
  primary: string; secondary: string; accent: string;
  colorMap: { role: string; color: string }[];
} {
  const colorMap: { role: string; color: string }[] = [];

  // Build priority-ordered candidate list
  const candidates: string[] = [];

  if (roles.themeColor && !isNeutral(roles.themeColor)) {
    candidates.push(roles.themeColor);
    colorMap.push({ role: "Theme Color", color: roles.themeColor });
  }
  for (const c of roles.cssVars.filter(v => !isNeutral(v))) {
    candidates.push(c);
    colorMap.push({ role: "Brand Variable", color: c });
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

  // Backgrounds — add to map but low priority for brand color picks
  const bgColors = [...new Set(roles.backgrounds)];
  for (const c of bgColors) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Background", color: c });
  }
  for (const c of roles.bodyText) {
    if (!colorMap.find(x => x.color === c)) colorMap.push({ role: "Body Text", color: c });
  }

  // Fallback: most frequent vivid colors from raw CSS count
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

// ── platform detection ────────────────────────────────────────────────────────

const FRAMEWORK_SIGNALS: Record<string, string> = {
  "leadconnectorhq.com": "GoHighLevel",
  "highlevel.com": "GoHighLevel",
  "cdn.shopify.com": "Shopify",
  "assets.squarespace.com": "Squarespace",
  "static.wixstatic.com": "Wix",
};

function detectPlatform(html: string): { platform: string | null; isPageBuilder: boolean } {
  for (const [signal, platform] of Object.entries(FRAMEWORK_SIGNALS)) {
    if (html.includes(signal)) return { platform, isPageBuilder: true };
  }
  return { platform: null, isPageBuilder: false };
}

// ── vision color extraction ───────────────────────────────────────────────────

async function analyzeImageColors(
  imageUrl: string,
  apiKey: string,
): Promise<{ primary: string; secondary: string; accent: string } | null> {
  try {
    const imgResp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!imgResp.ok) return null;
    const buf = await imgResp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    const ct = imgResp.headers.get("content-type") || "image/jpeg";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: ct, data: b64 } },
            {
              type: "text",
              text: "Extract 3 brand colors from this image. Include intentional neutrals (blacks, silvers, whites, grays) if they dominate — those ARE the brand. Respond ONLY with: {\"primary\":\"#RRGGBB\",\"secondary\":\"#RRGGBB\",\"accent\":\"#RRGGBB\"}",
            },
          ],
        }],
      }),
    });
    const d = await r.json();
    const raw = d.content?.[0]?.text || "";
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    if (parsed.primary && parsed.secondary && parsed.accent) return parsed;
    return null;
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

    // Detect page builder platforms that inject their own CSS vars (not brand colors)
    const { platform, isPageBuilder } = detectPlatform(html);

    // Build CSS corpus: inline + up to 3 linked sheets
    let css = extractInlineCSS(html);

    // For page builders: strip :root blocks containing framework color vars
    // (GHL injects --primary, --secondary etc. that are theme defaults, not brand colors)
    if (isPageBuilder) {
      css = css.replace(
        /:root\s*\{[^}]*(--primary|--secondary|--white|--black|--gray|--red|--orange|--yellow|--green|--teal|--indigo|--purple|--pink)[^}]*\}/gi,
        "",
      );
    }

    const cssLinks = [...html.matchAll(/href="([^"]+\.css(?:[^"?#]*))/g)]
      .map(m => {
        try { return m[1].startsWith("http") ? m[1] : new URL(m[1], target).href; }
        catch { return null; }
      })
      .filter(Boolean) as string[];

    for (const link of cssLinks.slice(0, 3)) {
      // Skip known framework CDN sheets — they contain framework colors, not brand colors
      if (link.includes("leadconnectorhq.com") || link.includes("cdn.shopify.com")) continue;
      try {
        const r = await fetch(link, { signal: AbortSignal.timeout(6_000) });
        css += "\n" + await r.text();
      } catch { /* skip */ }
    }

    const meta = extractMeta(html);
    const pageText = extractText(html);
    const fonts = extractFonts(css);
    const roles = extractSemanticColors(css, html);
    const counts = countAllColors(css);
    let { primary, secondary, accent, colorMap } = pickColors(roles, counts);
    const icons = extractIcons(html, target);
    const discoveredUrls = detectSocialUrls(html);

    // Derive domain for Clearbit + Google Favicon fallbacks
    let domain = "";
    try { domain = new URL(target).hostname; } catch {}
    const clearbitUrl = domain ? `https://logo.clearbit.com/${domain}?size=600` : null;
    const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=256` : null;

    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    // ── Vision fallback: analyze og:image when CSS gives unreliable colors ────
    // Page builders have framework CSS vars; CSS extraction is unreliable for them.
    // Also use vision when we got very few non-neutral colors (possible neutral brand like luxury/minimal).
    const cssUnreliable = isPageBuilder || colorMap.filter(c => !isNeutral(c.color)).length < 2;
    let visionColors: { primary: string; secondary: string; accent: string } | null = null;
    let colorSource = "css";

    if (cssUnreliable && ANTHROPIC_KEY && icons.ogImage) {
      visionColors = await analyzeImageColors(icons.ogImage, ANTHROPIC_KEY);
      if (visionColors) {
        primary = visionColors.primary;
        secondary = visionColors.secondary;
        accent = visionColors.accent;
        colorMap = [
          { role: "Primary (visual)", color: visionColors.primary },
          { role: "Secondary (visual)", color: visionColors.secondary },
          { role: "Accent (visual)", color: visionColors.accent },
        ];
        colorSource = "vision";
      }
    }

    if (cssUnreliable && !visionColors) colorSource = "unknown";

    // ── AI: one Haiku call with enriched color context ────────────────────────
    let analysis: Record<string, unknown> = {};

    if (ANTHROPIC_KEY) {
      const displayName = meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim();

      const colorSummary = colorMap.map(x => `  ${x.role}: ${x.color}`).join("\n") ||
        `  Primary pick: ${primary}`;

      const platformNote = platform
        ? `\nNOTE: Built on ${platform} — CSS variables above are framework defaults, not brand colors. Infer brand identity from page content and description only.`
        : "";

      const prompt = `Analyze this website and extract brand identity data. Return ONLY valid JSON.

URL: ${target}
Brand: ${displayName}
Description: ${meta.description || meta.ogDesc || "(none)"}
H1: ${meta.h1 || "(none)"}
H2: ${meta.h2 || "(none)"}
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
      } catch { /* leave empty on AI failure */ }
    } else {
      analysis = {
        brandName: meta.ogTitle || meta.title.split(/[|\-–]/)[0].trim(),
        tagline: (meta.description || meta.ogDesc || "").slice(0, 120),
        industry: meta.keywords?.split(",")[0]?.trim() || "",
      };
    }

    const platformWarning = platform
      ? `${platform} site detected — website CSS is framework-generated, not brand-specific. Colors shown are from ${colorSource === "vision" ? "visual analysis of the og:image" : "limited page content"}. For best results, enter your brand colors manually.`
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
      roles,
      fonts,
      meta,
      analysis,
      hasAI: !!ANTHROPIC_KEY,
      // Brand icon sources — priority order
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
