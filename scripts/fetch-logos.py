#!/usr/bin/env python3
"""Fetch a logo/icon for every library brand into public/logos/<slug>.png (served by Cloudflare Pages).

  python3 scripts/fetch-logos.py [--only slug,slug] [--force]

2026-11-12: the original logo cache lived in Supabase Storage (brand-assets/logos), which went dark with the egress
restriction, and its source (Clearbit) no longer exists. This rebuilds the marks from each brand's own site: the
largest apple-touch-icon / icon declared in its HTML, then /apple-touch-icon.png, then Google's favicon service at
256px. Images are normalized to a square PNG (max 256px). A copy goes to the Mac mirror
(~/brand-board-builder/brand/library-images/_logos). scripts/snapshot-brands.py points logo_url at /logos/<slug>.png
when the file exists. Stdlib + Pillow.
"""
import io, json, re, sys, urllib.parse, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/logos"
MIRROR = Path.home() / "brand-board-builder/brand/library-images/_logos"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"


def get(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")


def candidates(domain):
    base = f"https://{domain}/"
    out = []
    try:
        html, _ = get(base)
        html = html.decode("utf-8", "ignore")[:400000]
        for m in re.finditer(r"<link[^>]+>", html, re.I):
            tag = m.group(0)
            rel = (re.search(r'rel=["\']([^"\']+)', tag, re.I) or [None, ""])[1].lower()
            href = (re.search(r'href=["\']([^"\']+)', tag, re.I) or [None, ""])[1]
            if not href or not any(k in rel for k in ("apple-touch-icon", "icon")):
                continue
            if href.lower().endswith(".svg"):
                continue
            sizes = (re.search(r'sizes=["\'](\d+)', tag, re.I) or [None, "0"])[1]
            score = int(sizes) + (500 if "apple-touch" in rel else 0)
            out.append((score, urllib.parse.urljoin(base, href)))
    except Exception:
        pass
    out.sort(reverse=True)
    urls = [u for _, u in out]
    bare = domain[4:] if domain.startswith("www.") else domain
    urls += [base + "apple-touch-icon.png", f"https://www.google.com/s2/favicons?domain={domain}&sz=256",
             f"https://www.google.com/s2/favicons?domain=www.{bare}&sz=256",
             f"https://icons.duckduckgo.com/ip3/{bare}.ico"]
    return urls


def fetch_logo(domain):
    for u in candidates(domain):
        try:
            data, ctype = get(u)
            im = Image.open(io.BytesIO(data))
            im.load()
            if min(im.size) < 48:
                continue
            im = im.convert("RGBA")
            side = max(im.size)
            sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
            sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
            sq.thumbnail((256, 256))
            return sq, u
        except Exception:
            continue
    return None, None


def main():
    only = set()
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    force = "--force" in sys.argv
    brands = json.loads((ROOT / "public/data/brands.json").read_text())["brands"]
    OUT.mkdir(parents=True, exist_ok=True)
    MIRROR.mkdir(parents=True, exist_ok=True)
    report = {}
    for b in brands:
        slug = b["slug"]
        if only and slug not in only:
            continue
        dest = OUT / f"{slug}.png"
        if dest.exists() and not force:
            continue
        domain = (b.get("website") or "").replace("https://", "").replace("http://", "").split("/")[0]
        if not domain:
            report[slug] = "no website"
            continue
        im, src = fetch_logo(domain)
        if not im:
            report[slug] = "not found"
            print("MISS", slug, domain)
            continue
        im.save(dest)
        im.save(MIRROR / f"{slug}.png")
        report[slug] = f"{im.size[0]}px from {src}"
        print("ok", slug, im.size[0], src[:90])
    (ROOT / "public/logos/_sources.json").write_text(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
