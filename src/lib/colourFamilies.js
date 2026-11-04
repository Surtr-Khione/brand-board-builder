// One colour-family rule for every research page (/patterns, /sectors/*,
// /archetypes/*), so the same stored hex always lands in the same family.
//
// Plain ESM (no JSX, no import.meta.env): the SPA pages and the prerender
// scripts import it directly. A family is computed from the hex alone
// (lightness, saturation, hue angle): it groups stored hex codes and makes no
// claim about what the brand calls the colour. The `rule` text is what the
// pages print, and it is written from the same thresholds as familyOf().

export const COLOUR_FAMILIES = [
  { slug: "black", name: "Black & near-black", rule: "lightness 12% or less", swatch: "#111111" },
  { slug: "white", name: "White & off-white", rule: "lightness 93% or more", swatch: "#F5F5F7" },
  { slug: "grey", name: "Grey", rule: "saturation under 15%", swatch: "#8E8E93" },
  { slug: "red", name: "Red", rule: "hue 345° to 15°", swatch: "#D32F2F" },
  { slug: "orange", name: "Orange", rule: "hue 15° to 40°, lightness over 35%", swatch: "#F57C00" },
  { slug: "brown", name: "Brown", rule: "hue 15° to 40°, lightness 35% or less", swatch: "#795548" },
  { slug: "yellow", name: "Yellow", rule: "hue 40° to 65°", swatch: "#FBC02D" },
  { slug: "green", name: "Green", rule: "hue 65° to 165°", swatch: "#388E3C" },
  { slug: "teal", name: "Teal & cyan", rule: "hue 165° to 195°", swatch: "#00897B" },
  { slug: "blue", name: "Blue", rule: "hue 195° to 255°", swatch: "#1E6FD9" },
  { slug: "purple", name: "Purple", rule: "hue 255° to 290°", swatch: "#7B1FA2" },
  { slug: "pink", name: "Pink & magenta", rule: "hue 290° to 345°", swatch: "#D81B60" },
].map((f) => ({ ...f, key: f.slug }));

export const FAMILY_BY_SLUG = Object.fromEntries(COLOUR_FAMILIES.map((f) => [f.slug, f]));

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function rgbOf(hex) {
  const m = String(hex || "").trim().match(HEX);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function hsl({ r, g, b }) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
  else if (max === G) h = ((B - R) / d + 2) * 60;
  else h = ((R - G) / d + 4) * 60;
  return { h, s, l };
}

function slugOf(rgb) {
  const { h, s, l } = hsl(rgb);
  if (l <= 0.12) return "black";
  if (l >= 0.93) return "white";
  if (s < 0.15) return "grey";
  if (h >= 345 || h < 15) return "red";
  if (h < 40) return l <= 0.35 ? "brown" : "orange";
  if (h < 65) return "yellow";
  if (h < 165) return "green";
  if (h < 195) return "teal";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

// The family object for a hex string (or an {r,g,b} object), or null when
// the value is not a valid hex.
export function familyOf(hexOrRgb) {
  const rgb = hexOrRgb && typeof hexOrRgb === "object" ? hexOrRgb : rgbOf(hexOrRgb);
  return rgb ? FAMILY_BY_SLUG[slugOf(rgb)] : null;
}
