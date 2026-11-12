#!/usr/bin/env python3
"""Export the public brand library to a static file served by Cloudflare Pages: public/data/brands.json.

  python3 scripts/snapshot-brands.py

Why (2026-11-12): every page view used to call the search-brands edge function for 36 to 85 full records, which
blew the Supabase free egress quota and took the Library down. The library changes only when scripts add or enrich
brands, so it is now a static file built from the database; read traffic never touches Supabase.

Reads through the Supabase Management API (POST /v1/projects/{ref}/database/query) with the CLI's access token
(~/.supabase/access-token, never printed), so it works even while the project's public API is restricted.
Leaves out private columns (submitted_by, submitted_by_email) and the search index (fts). Re-run after any library
change (seed-library, enrich-library, merge-dupes, voice-rationales), then commit public/data/brands.json.
Set BMD_DB_REF to read from another project (the VPS migration replaces this with a direct Postgres read).
"""
import json, os, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

REF = os.environ.get("BMD_DB_REF", "bukgitgwwmzdjibekmzb")
OUT = Path(__file__).resolve().parents[1] / "public/data/brands.json"
DROP = ("submitted_by", "submitted_by_email", "fts")


def query(sql):
    token = (Path.home() / ".supabase/access-token").read_text().strip()
    r = subprocess.run(["curl", "-s", "-X", "POST", f"https://api.supabase.com/v1/projects/{REF}/database/query",
                        "-H", f"Authorization: Bearer {token}", "-H", "Content-Type: application/json",
                        "-d", json.dumps({"query": sql})], capture_output=True, text=True)
    data = json.loads(r.stdout)
    if isinstance(data, dict) and data.get("message"):
        sys.exit(f"query failed: {data['message'][:300]}")
    return data


def main():
    drop = ", ".join(f"'{c}'" for c in DROP)
    brands = query(f"""
      select coalesce(json_agg(b order by (b->>'is_featured')::boolean desc nulls last,
                               coalesce((b->>'view_count')::int, 0) desc, b->>'brand_name'), '[]'::json) as rows
      from (select (to_jsonb(p) - array[{drop}]) as b from public_brands p where coalesce(status, 'published') = 'published') s
    """)[0]["rows"]
    snaps = query("""
      select coalesce(json_object_agg(slug, items), '{}'::json) as rows from (
        select p.slug, json_agg(json_build_object('year', s.year, 'snapshot_data', s.snapshot_data, 'change_notes', s.change_notes)
                                order by s.year) as items
        from brand_snapshots s join public_brands p on p.id = s.brand_id group by p.slug) x
    """)[0]["rows"]
    # Logos are served from our own Pages files (public/logos, rebuilt by scripts/fetch-logos.py) since Supabase
    # Storage went dark; a brand without a file gets null, so the UI falls straight to its favicon/letter fallback.
    logos = OUT.parent.parent / "logos"
    for b in brands:
        b["logo_url"] = f"/logos/{b['slug']}.png" if (logos / f"{b['slug']}.png").exists() else None
    doc = {"exported": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "count": len(brands),
           "brands": brands, "snapshots": snaps}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print(f"wrote {OUT} ({len(brands)} brands, {len(snaps)} with snapshots, {OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
