#!/usr/bin/env python3
"""BrandMD space graphics: writes each graphic as <name>-dark.svg (for Ink/Night) and <name>-light.svg (for Paper).

  python3 brand/graphics/make_graphics.py

Rules (brand/BRAND.md §10): neutrals carry the drawing, Signal Blue #0071E3 marks the one thing that matters, no other
color, no text baked in except tier labels. Stdlib only; edit the functions and re-run.
"""
import math
from pathlib import Path

OUT = Path(__file__).resolve().parent
BLUE = "#0071E3"
THEMES = {
    "dark": {"line": "#8E8E93", "faint": "#3A3A3C", "sphere_a": "#F5F5F7", "sphere_b": "#5A5A5E", "sphere_c": "#1D1D1F", "text": "#F5F5F7", "muted": "#8E8E93"},
    "light": {"line": "#6E6E73", "faint": "#D2D2D7", "sphere_a": "#FFFFFF", "sphere_b": "#8E8E93", "sphere_c": "#3A3A3C", "text": "#0B0B0C", "muted": "#6E6E73"},
}


def svg(w, h, body, defs="", label=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" '
            f'aria-label="{label}"><defs>{defs}</defs>{body}</svg>\n')


def sphere_def(t, gid="sph"):
    return (f'<radialGradient id="{gid}" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="{t["sphere_a"]}"/>'
            f'<stop offset="60%" stop-color="{t["sphere_b"]}"/><stop offset="100%" stop-color="{t["sphere_c"]}"/></radialGradient>')


def gravity_well(t):
    """A flat grid bending down into a well, the brand at the bottom."""
    w, h, cx, cy = 1200, 675, 600, 300
    lines = []
    def depth(x, y):
        d = math.hypot((x - cx) / 1.0, (y - cy) * 2.2)
        return 170 * math.exp(-(d / 230) ** 2)
    for i in range(-14, 15):
        pts = []
        for j in range(0, 61):
            x = cx + i * 46
            y = 120 + j * 6.5
            pts.append((x, y + depth(x, y)))
        lines.append(pts)
    for j in range(0, 13):
        pts = []
        for i in range(-60, 61):
            x = cx + i * 11
            y = 120 + j * 32
            pts.append((x, y + depth(x, y)))
        lines.append(pts)
    body = "".join(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in p)}" fill="none" stroke="{t["line"]}" '
                   f'stroke-opacity=".35" stroke-width="1"/>' for p in lines)
    body += f'<circle cx="{cx}" cy="{cy + 175}" r="34" fill="url(#sph)"/>'
    body += f'<circle cx="{cx + 210}" cy="{cy + 40}" r="7" fill="{BLUE}"/>'
    return svg(w, h, body, sphere_def(t), "A grid bending into a gravity well with a brand sphere at its center")


def orbit_system(t):
    w, h, cx, cy = 1200, 675, 600, 360
    body = ""
    for rx, ry, op in [(520, 190, .25), (390, 142, .32), (260, 95, .4), (140, 52, .5)]:
        body += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="{t["line"]}" stroke-opacity="{op}"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="46" fill="url(#sph)"/>'
    for ang, rx, ry, r in [(200, 520, 190, 9), (320, 390, 142, 7), (60, 260, 95, 6)]:
        a = math.radians(ang)
        body += f'<rect x="{cx + rx * math.cos(a) - r:.1f}" y="{cy + ry * math.sin(a) - r:.1f}" width="{2 * r}" height="{2 * r}" rx="3" fill="{t["faint"]}"/>'
    a = math.radians(330)
    body += f'<circle cx="{cx + 520 * math.cos(a):.1f}" cy="{cy + 190 * math.sin(a):.1f}" r="10" fill="{BLUE}"/>'
    return svg(w, h, body, sphere_def(t), "Concentric orbits around a sphere with one blue satellite")


def escape_velocity(t):
    w, h = 1200, 675
    body = f'<circle cx="300" cy="420" r="60" fill="url(#sph)"/>'
    body += f'<ellipse cx="300" cy="420" rx="170" ry="70" fill="none" stroke="{t["line"]}" stroke-opacity=".35"/>'
    body += f'<path d="M 470 420 C 640 400, 760 300, 1080 110" fill="none" stroke="{BLUE}" stroke-width="3" stroke-linecap="round"/>'
    body += f'<path d="M 300 350 C 420 330, 470 380, 470 420" fill="none" stroke="{t["line"]}" stroke-opacity=".5" stroke-dasharray="4 8"/>'
    body += f'<circle cx="1080" cy="110" r="10" fill="{BLUE}"/>'
    for i, x in enumerate(range(560, 1060, 100)):
        body += f'<line x1="{x}" y1="560" x2="{x}" y2="572" stroke="{t["line"]}" stroke-opacity=".5"/>'
    body += f'<line x1="520" y1="566" x2="1100" y2="566" stroke="{t["line"]}" stroke-opacity=".3"/>'
    return svg(w, h, body, sphere_def(t), "A blue trajectory leaving orbit")


def constellation(t):
    """Brand signals as stars; one is the signal."""
    w, h = 1200, 675
    pts = {"Voice": (230, 220), "Color": (420, 140), "Name": (610, 260), "Story": (820, 170), "Proof": (980, 330),
           "Audience": (760, 470), "Mission": (470, 450), "Type": (300, 500)}
    edges = [("Voice", "Color"), ("Color", "Name"), ("Name", "Story"), ("Story", "Proof"), ("Proof", "Audience"),
             ("Audience", "Mission"), ("Mission", "Type"), ("Type", "Voice"), ("Name", "Mission"), ("Name", "Audience")]
    body = "".join(f'<line x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[b][0]}" y2="{pts[b][1]}" stroke="{t["line"]}" stroke-opacity=".35"/>' for a, b in edges)
    for k, (x, y) in pts.items():
        hot = k == "Name"
        body += f'<circle cx="{x}" cy="{y}" r="{12 if hot else 6}" fill="{BLUE if hot else t["line"]}"/>'
        if hot:
            body += f'<circle cx="{x}" cy="{y}" r="26" fill="none" stroke="{BLUE}" stroke-opacity=".45"/>'
        body += (f'<text x="{x}" y="{y + 30 + (10 if hot else 0)}" text-anchor="middle" font-family="Inter, Arial, sans-serif" '
                 f'font-size="15" font-weight="{700 if hot else 500}" fill="{t["text"] if hot else t["muted"]}">{k}</text>')
    return svg(w, h, body, "", "Brand signals drawn as a constellation with one highlighted")


def telemetry(t, score=72):
    w, h = 1200, 675
    cx, cy, r = 360, 360, 190
    start, end = math.radians(135), math.radians(135 + 270)
    def arc(a0, a1):
        x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
        x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
        large = 1 if (a1 - a0) > math.pi else 0
        return f"M {x0:.1f} {y0:.1f} A {r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}"
    body = f'<path d="{arc(start, end)}" fill="none" stroke="{t["faint"]}" stroke-width="22" stroke-linecap="round"/>'
    body += f'<path d="{arc(start, start + math.radians(270 * score / 100))}" fill="none" stroke="{BLUE}" stroke-width="22" stroke-linecap="round"/>'
    body += (f'<text x="{cx}" y="{cy + 22}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="110" '
             f'font-weight="800" fill="{t["text"]}" letter-spacing="-4">{score}</text>')
    body += (f'<text x="{cx}" y="{cy + 70}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" '
             f'font-weight="600" letter-spacing="3" fill="{t["muted"]}">GRAVITY WELL</text>')
    rows = [("Identity", .9), ("Positioning", .6), ("Voice", .75), ("Visual", .4), ("Audience", .85)]
    for i, (k, v) in enumerate(rows):
        y = 210 + i * 62
        body += f'<text x="660" y="{y}" font-family="Inter, Arial, sans-serif" font-size="16" fill="{t["muted"]}">{k}</text>'
        body += f'<rect x="660" y="{y + 12}" width="420" height="8" rx="4" fill="{t["faint"]}"/>'
        low = v == min(x for _, x in rows)
        body += f'<rect x="660" y="{y + 12}" width="{420 * v:.0f}" height="8" rx="4" fill="{BLUE if low else t["line"]}"/>'
    return svg(w, h, body, "", "Mission-control readout: a Gravity dial at 72 and five signal bars")


def tier_ladder(t, score=72):
    """Altitude scale of the six tiers, with the brand's position marked."""
    w, h = 1200, 675
    tiers = [(0, "Grounded"), (20, "Lift-off"), (40, "In orbit"), (60, "Gravity well"), (75, "Escape velocity"), (90, "Out of this world")]
    x0, y_top, y_bot = 380, 90, 600
    y_of = lambda s: y_bot - (y_bot - y_top) * s / 100
    body = f'<line x1="{x0}" y1="{y_top}" x2="{x0}" y2="{y_bot}" stroke="{t["line"]}" stroke-opacity=".5"/>'
    body += f'<line x1="{x0 - 220}" y1="{y_bot}" x2="{x0 + 520}" y2="{y_bot}" stroke="{t["line"]}" stroke-opacity=".6"/>'
    bounds = [s for s, _ in tiers] + [100]
    for i, (s, name) in enumerate(tiers):
        y = y_of(s)
        body += f'<line x1="{x0 - 8}" y1="{y:.0f}" x2="{x0 + 8}" y2="{y:.0f}" stroke="{t["line"]}"/>'
        body += f'<text x="{x0 - 24}" y="{y + 5:.0f}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" fill="{t["muted"]}">{s}</text>'
        mid = y_of((s + bounds[i + 1]) / 2)  # the tier name sits inside its band, between its two boundaries
        hot = s <= score < bounds[i + 1] or (score == 100 and s == 90)
        body += (f'<text x="{x0 + 28}" y="{mid + 6:.0f}" font-family="Inter, Arial, sans-serif" font-size="17" '
                 f'font-weight="{800 if hot else 500}" fill="{t["text"] if hot else t["muted"]}">{name}</text>')
    body += f'<line x1="{x0 - 8}" y1="{y_top}" x2="{x0 + 8}" y2="{y_top}" stroke="{t["line"]}"/>'
    body += f'<text x="{x0 - 24}" y="{y_top + 5}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="15" fill="{t["muted"]}">100</text>'
    y = y_of(score)
    body += f'<circle cx="{x0}" cy="{y:.0f}" r="11" fill="{BLUE}"/>'
    body += f'<line x1="{x0 + 14}" y1="{y:.0f}" x2="{x0 + 470}" y2="{y:.0f}" stroke="{BLUE}" stroke-dasharray="3 6"/>'
    body += f'<text x="{x0 + 480}" y="{y + 6:.0f}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="{BLUE}">You: {score}</text>'
    return svg(w, h, body, "", "The six Gravity tiers as an altitude scale with your score marked")


def launchpad(t):
    w, h = 1200, 675
    body = f'<line x1="80" y1="560" x2="1120" y2="560" stroke="{t["line"]}" stroke-opacity=".6"/>'
    for x in range(120, 1100, 40):
        body += f'<line x1="{x}" y1="560" x2="{x - 14}" y2="574" stroke="{t["line"]}" stroke-opacity=".25"/>'
    body += f'<circle cx="600" cy="300" r="70" fill="url(#sph)"/>'
    for i, op in enumerate([.5, .35, .2, .1]):
        body += f'<ellipse cx="600" cy="{420 + i * 30}" rx="{60 - i * 10}" ry="6" fill="{t["line"]}" fill-opacity="{op}"/>'
    body += f'<line x1="600" y1="380" x2="600" y2="545" stroke="{BLUE}" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>'
    return svg(w, h, body, sphere_def(t), "A sphere lifting off a launchpad")


def signal_noise(t):
    """A field of grey marks with one blue signal ringed."""
    w, h = 1200, 675
    import random
    rnd = random.Random(11)
    body = ""
    for _ in range(260):
        x, y = rnd.uniform(40, 1160), rnd.uniform(40, 635)
        if math.hypot(x - 790, y - 260) < 70:
            continue
        s = rnd.choice([4, 5, 6, 8])
        shape = rnd.random()
        if shape < .5:
            body += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{s / 2}" fill="{t["line"]}" fill-opacity="{rnd.uniform(.2, .55):.2f}"/>'
        else:
            body += f'<rect x="{x:.0f}" y="{y:.0f}" width="{s}" height="{s}" rx="1.5" fill="{t["line"]}" fill-opacity="{rnd.uniform(.15, .45):.2f}"/>'
    body += f'<circle cx="790" cy="260" r="12" fill="{BLUE}"/>'
    for r, op in [(30, .5), (52, .3), (78, .15)]:
        body += f'<circle cx="790" cy="260" r="{r}" fill="none" stroke="{BLUE}" stroke-opacity="{op}"/>'
    return svg(w, h, body, "", "Many grey marks and one blue signal")


GRAPHICS = {"gravity-well": gravity_well, "orbit-system": orbit_system, "escape-velocity": escape_velocity,
            "constellation": constellation, "telemetry": telemetry, "tier-ladder": tier_ladder,
            "launchpad": launchpad, "signal-through-noise": signal_noise}

if __name__ == "__main__":
    for name, fn in GRAPHICS.items():
        for theme, t in THEMES.items():
            (OUT / f"{name}-{theme}.svg").write_text(fn(t))
    print(f"wrote {len(GRAPHICS) * 2} SVGs to {OUT}")
