import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";
import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimited, RATE_LIMIT_MSG } from "../_shared/gate.ts";

// Drift Watch: rescan the board's live website and diff what the world sees
// against what the board says the brand is. Deterministic checks (colors,
// fonts, tagline) in code; one Haiku pass for the qualitative voice read.
// POST { boardId } or { brand } → { drift: {...} }
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

// Perceptual-ish hex distance: 0 = identical, ~440 = black↔white
function hexDist(a?: string, b?: string): number | null {
  const p = (h?: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec((h || "").trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const ca = p(a), cb = p(b);
  if (!ca || !cb) return null;
  return Math.sqrt(ca.reduce((s, v, i) => s + (v - cb[i]) ** 2, 0));
}

const norm = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { boardId, brand: passedBrand } = await req.json();
    if (await rateLimited(db, req, "drift-check", 6)) return json({ error: RATE_LIMIT_MSG }, 429);

    let brand: Record<string, unknown> | null = passedBrand || null;
    if (!brand && boardId) {
      const { data } = await db.from("brand_boards").select("brand_data").eq("board_id", boardId).maybeSingle();
      brand = data?.brand_data || null;
    }
    if (!brand) return json({ error: "Board not found." }, 404);

    const website = String(brand.website || "").trim();
    if (!website) return json({ error: "This board has no website — add one in Overview, then run the drift check." }, 400);

    // Rescan the live site through the existing scanner
    const scanRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/scan-website`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ url: website }),
    });
    const scan = await scanRes.json();
    if (!scanRes.ok || scan.error) return json({ error: `Couldn't scan ${website}: ${scan.error || scanRes.status}` }, 502);
    // scan-website nests the AI read under `analysis`; colors/fonts are top-level
    const live = scan.analysis || {};

    const items: Array<{ area: string; board: string; live: string; severity: "high" | "medium" | "low"; note: string }> = [];

    // ── Deterministic checks ──
    const scannedColors: string[] = [scan.primaryColor, scan.secondaryColor, scan.accentColor]
      .concat(Object.values(scan.colorMap || {}))
      .filter((c): c is string => typeof c === "string" && /^#/.test(c));

    for (const [label, key] of [["Primary color", "primaryColor"], ["Accent color", "accentColor"]] as const) {
      const boardColor = String(brand[key] || "");
      if (!boardColor) continue;
      const best = scannedColors.length
        ? Math.min(...scannedColors.map((c) => hexDist(boardColor, c) ?? 999))
        : null;
      if (best !== null && best > 120) {
        items.push({
          area: label, board: boardColor, live: scannedColors.slice(0, 3).join(", ") || "not detected",
          severity: "medium",
          note: `Nothing close to ${boardColor} was found on the live page.`,
        });
      }
    }

    const boardTagline = norm(String(brand.tagline || ""));
    const liveTagline = norm(String(live.tagline || ""));
    if (boardTagline && liveTagline && boardTagline !== liveTagline) {
      items.push({
        area: "Tagline", board: String(brand.tagline), live: String(live.tagline),
        severity: "high", note: "The site is leading with a different line than the board's tagline.",
      });
    }

    const boardFont = norm(String(brand.primaryFont || ""));
    const liveFonts: string[] = Array.isArray(scan.fonts) ? scan.fonts : [];
    if (boardFont && liveFonts.length && !liveFonts.some((f) => norm(String(f)).includes(boardFont) || boardFont.includes(norm(String(f))))) {
      items.push({
        area: "Typography", board: String(brand.primaryFont), live: liveFonts.slice(0, 3).join(", "),
        severity: "low", note: "The board's display face wasn't detected on the live page.",
      });
    }

    if (brand.archetype && live.archetype && String(brand.archetype) !== String(live.archetype)) {
      items.push({
        area: "Archetype read", board: String(brand.archetype), live: String(live.archetype),
        severity: "medium", note: "A stranger scanning the site today would read a different archetype than the one you chose.",
      });
    }

    // ── Qualitative voice read (one cheap Haiku pass) ──
    let voiceRead = "";
    try {
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: "You are a brand auditor. Compare how a brand DEFINES its voice against how its live site actually READS. Two or three sentences, specific, no hedging. If they align, say so plainly.",
        messages: [{
          role: "user",
          content: `BOARD (how the brand defines itself):
Tone: ${(brand.toneAttributes as string[] || []).filter(Boolean).join(", ") || "unspecified"}
Personality: ${(brand.brandPersonality as string[] || []).filter(Boolean).join(", ") || "unspecified"}
Mission: ${brand.mission || ""}
Enemy: ${brand.enemy || ""}

LIVE SITE SCAN of ${website}:
Tagline: ${live.tagline || ""}
Tone read: ${(live.toneAttributes || []).join(", ")}
Personality read: ${(live.brandPersonality || []).join?.(", ") || live.socialPersonality || ""}
Elevator read: ${live.elevator || ""}

How far has the live site drifted from the defined voice?`,
        }],
      });
      const t = resp.content.find((b: { type: string }) => b.type === "text");
      if (t && t.type === "text") voiceRead = t.text.trim();
    } catch { /* voice read is best-effort */ }

    const severityScore = items.reduce((s, i) => s + (i.severity === "high" ? 25 : i.severity === "medium" ? 12 : 5), 0);
    const alignment = Math.max(0, 100 - severityScore);

    return json({
      drift: {
        checkedAt: new Date().toISOString(),
        url: website,
        alignment,
        items,
        voiceRead,
        scannedTagline: live.tagline || null,
        scannedColors: scannedColors.slice(0, 5),
      },
    });
  } catch (err) {
    return json({ error: String(err?.message || err) }, 500);
  }
});
