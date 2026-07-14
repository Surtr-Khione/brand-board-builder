// Builds a downloadable Markdown brand board from whatever data is present —
// works for thin curated-library rows (flat columns only) and rich ones
// (brand_data JSONB / a freshly scanned or built board) alike.

function get(brand, ...keys) {
  for (const k of keys) {
    const v = k.includes(".") ? k.split(".").reduce((o, p) => o?.[p], brand) : brand?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function list(brand, ...keys) {
  for (const k of keys) {
    const v = k.includes(".") ? k.split(".").reduce((o, p) => o?.[p], brand) : brand?.[k];
    if (Array.isArray(v) && v.length) return v.filter(Boolean);
  }
  return [];
}

function section(title, body) {
  if (!body) return "";
  return `## ${title}\n\n${body}\n\n`;
}

function bulletSection(title, items) {
  if (!items.length) return "";
  return `## ${title}\n\n${items.map((i) => `- ${typeof i === "string" ? i : i.name || JSON.stringify(i)}`).join("\n")}\n\n`;
}

export function brandToMarkdown(brand, canonicalUrl) {
  const name = get(brand, "brand_name", "brandName") || "Untitled Brand";
  const tagline = get(brand, "tagline");
  const archetype = get(brand, "archetype");
  const secondaryArchetype = get(brand, "secondaryArchetype", "brand_data.secondaryArchetype");
  const industry = get(brand, "industry");
  const website = get(brand, "website");
  const elevator = get(brand, "elevator", "brand_data.elevatorPitch", "elevatorPitch");
  const description = get(brand, "description", "brand_data.about");
  const mission = get(brand, "mission");
  const vision = get(brand, "vision");
  const brandPromise = get(brand, "brand_data.brandPromise", "brandPromise");
  const whyDifferent = get(brand, "brand_data.whyDifferent", "whyDifferent");
  const enemy = get(brand, "brand_data.enemy");
  const enemyDescription = get(brand, "brand_data.enemyDescription");
  const oneLiner = get(brand, "brand_data.sbOneLiner");
  const voiceExample = get(brand, "brand_data.voiceExample", "voiceExample");
  const colorRules = get(brand, "brand_data.colorUsageRules");
  const typeRules = get(brand, "brand_data.typographyRules");

  const toneAttributes = list(brand, "tone_attributes", "toneAttributes");
  const brandPersonality = list(brand, "brand_personality", "brandPersonality");
  const doSay = list(brand, "brand_data.doSay");
  const dontSay = list(brand, "brand_data.dontSay");
  const manifesto = list(brand, "brand_data.manifesto");
  const contentPillars = list(brand, "brand_data.contentPillars");

  const pc = get(brand, "primary_color", "primaryColor");
  const sc = get(brand, "secondary_color", "secondaryColor");
  const ac = get(brand, "accent_color", "accentColor");
  const pf = get(brand, "primary_font", "primaryFont");
  const bf = get(brand, "body_font", "bodyFont");

  let md = `# ${name}\n\n`;
  if (tagline) md += `> ${tagline}\n\n`;

  const metaLines = [];
  if (archetype) metaLines.push(`**Archetype:** ${archetype}${secondaryArchetype ? ` / ${secondaryArchetype}` : ""}`);
  if (industry) metaLines.push(`**Industry:** ${industry}`);
  if (website) metaLines.push(`**Website:** ${website}`);
  if (metaLines.length) md += metaLines.join("  \n") + "\n\n";

  md += section("Overview", elevator || description);
  md += section("Mission", mission);
  md += section("Vision", vision);
  md += section("Brand Promise", brandPromise);
  md += section("Why Different", whyDifferent);

  if (enemy) md += section("The Enemy", `**${enemy}** — ${enemyDescription || ""}`);
  md += section("One-Line Summary", oneLiner);

  if (toneAttributes.length || voiceExample) {
    md += `## Voice & Tone\n\n`;
    toneAttributes.forEach((t) => { md += `- ${t}\n`; });
    if (voiceExample) md += `\n**Voice example:** "${voiceExample}"\n`;
    md += "\n";
  }
  if (brandPersonality.length) md += bulletSection("Brand Personality", brandPersonality);
  if (doSay.length) md += bulletSection("Do Say", doSay);
  if (dontSay.length) md += bulletSection("Don't Say", dontSay);
  if (contentPillars.length) md += bulletSection("Content Pillars", contentPillars);
  if (manifesto.length) md += bulletSection("Manifesto", manifesto);

  const visualLines = [];
  if (pc || sc || ac) visualLines.push(`**Colors:** Primary \`${pc || "—"}\` · Secondary \`${sc || "—"}\` · Accent \`${ac || "—"}\``);
  if (pf || bf) visualLines.push(`**Typography:** ${pf || "—"}${bf && bf !== pf ? ` / ${bf}` : ""}`);
  if (colorRules) visualLines.push(colorRules);
  if (typeRules) visualLines.push(typeRules);
  if (visualLines.length) md += `## Visual System\n\n${visualLines.join("\n\n")}\n\n`;

  md += `---\n\nReference this brand: ${canonicalUrl || ""}\n\nDiagnosed by BrandMD — brandmd.space\n`;

  return md;
}

export function downloadMarkdown(brand, canonicalUrl) {
  const name = get(brand, "brand_name", "brandName") || "brand";
  const md = brandToMarkdown(brand, canonicalUrl);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-brand-board.md`;
  a.click();
  URL.revokeObjectURL(url);
}
