#!/usr/bin/env python3
"""Upload the curated library brand photos to the GHL media library and write src/lib/brandImages.json.

  python3 scripts/brand-images-to-ghl.py [--dry-run]

Storage decision (Ryan, 2026-11-06): BrandMD images live in GoHighLevel's media library (sub-account
Insiders.Marketing lxG2xl9eg8Y5jZMCJtEa, folder "BrandMD - Brand Library"), with the originals mirrored on the Mac at
~/brand-board-builder/brand/library-images/<slug>/. The slug -> URL map is versioned in the repo, so no database
write (and no Supabase service key) is needed. Token: ~/.config/inflammation-news/ghl-insiders.env (never printed).

KEEP is the curated list ("use the better pictures"): real brand photography only. Logo-only images, thumbnails under
~500px, interface screenshots, abstract gradients, other companies' IP and near-duplicates were dropped. Order
matters: the first photo is the brand page's cover.
"""
import json, subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

LOC = "lxG2xl9eg8Y5jZMCJtEa"
API = "https://services.leadconnectorhq.com"
FOLDER = "BrandMD - Brand Library"
MIRROR = Path.home() / "brand-board-builder/brand/library-images"
OUT = Path(__file__).resolve().parents[1] / "src/lib/brandImages.json"

KEEP = {
    "airbnb": ["3.webp", "1.avif", "5.webp", "4.webp"],
    "apple": ["8.jpg", "4.jpg", "6.jpg", "7.jpg"],
    "canva": ["2.jpg", "1.webp", "3.png", "5.webp", "4.png", "6.png"],
    "chevron": ["2.jpg", "3.jpg", "4.jpg", "5.jpg", "1.jpg"],
    "coca-cola": ["3.webp", "2.webp", "5.webp", "4.webp", "1.webp"],
    "mckesson": ["7.webp", "3.png", "5.jpg", "2.webp", "4.webp", "8.webp"],
    "netflix": ["1.jpg"],
    "notion": ["1.jpg"],
    "openai": ["1.webp", "2.webp"],
    "red-bull": ["1.avif", "3.avif", "2.avif", "5.avif", "6.avif"],
    "spotify": ["5.jpg"],
    "unitedhealth-group": ["2.jpg", "3.png"],
}


def token():
    for line in (Path.home() / ".config/inflammation-news/ghl-insiders.env").read_text().splitlines():
        if line.startswith("GHL_INSIDERS_PIT="):
            return line.split("=", 1)[1].strip().strip('"')
    sys.exit("GHL_INSIDERS_PIT missing")


def curl(*args):
    r = subprocess.run(["curl", "-s", "-H", f"Authorization: Bearer {token()}", "-H", "Version: 2021-07-28", *args],
                       capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"raw": r.stdout[:300]}


def folder_id():
    m = curl(f"{API}/medias/files?altId={LOC}&altType=location&type=folder&limit=100&sortBy=createdAt&sortOrder=desc")
    for f in m.get("files", []):
        if f.get("name") == FOLDER:
            return f.get("_id") or f.get("id")
    r = curl("-X", "POST", f"{API}/medias/folder", "-H", "Content-Type: application/json",
             "-d", json.dumps({"altId": LOC, "altType": "location", "name": FOLDER}))
    fid = r.get("_id") or r.get("id")
    if not fid:
        sys.exit(f"could not create folder: {json.dumps(r)[:300]}")
    return fid


def main():
    dry = "--dry-run" in sys.argv
    existing = json.loads(OUT.read_text()) if OUT.exists() else {}
    fid = None if dry else folder_id()
    result = {}
    with tempfile.TemporaryDirectory() as td:
        for slug, files in KEEP.items():
            if existing.get(slug) and len(existing[slug]) == len(files) and not dry:
                result[slug] = existing[slug]  # already uploaded; idempotent re-runs
                continue
            urls = []
            for i, f in enumerate(files, 1):
                src = MIRROR / slug / f
                im = Image.open(src).convert("RGB")
                im.thumbnail((2000, 2000))
                tmp = Path(td) / f"{slug}-{i}.webp"
                im.save(tmp, quality=84)
                if dry:
                    print("would upload", tmp.name, im.size)
                    continue
                r = curl("-X", "POST", f"{API}/medias/upload-file", "-F", f"file=@{tmp}", "-F", "hosted=false",
                         "-F", f"name=brandmd-{slug}-{i}.webp", "-F", f"parentId={fid}")
                url = r.get("url")
                if not url:
                    sys.exit(f"upload failed for {slug}/{f}: {json.dumps(r)[:300]}")
                ok = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", url], capture_output=True, text=True).stdout
                if ok != "200":
                    sys.exit(f"{url} answered {ok}")
                urls.append(url)
                print(slug, i, url)
            if not dry:
                result[slug] = urls
    if not dry:
        OUT.write_text(json.dumps({"_note": "Brand photos in the GHL media library (Insiders.Marketing, folder 'BrandMD - Brand Library'). Originals: ~/brand-board-builder/brand/library-images. Written by scripts/brand-images-to-ghl.py.", **result}, indent=2) + "\n")
        print(f"wrote {OUT} ({sum(len(v) for v in result.values())} images, {len(result)} brands)")


if __name__ == "__main__":
    main()
