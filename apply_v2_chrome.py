#!/usr/bin/env python3
"""Re-skin every Superbasket page (except the homepage) with the v2 chrome.

- Swaps the old <nav> and <footer> for the v2 pill nav and ink footer.
- Wraps the existing page content in a cream "sheet" on the red canvas.
- Adds a download band, and links /assets/v2/site.css after the page's own CSS.

Idempotent: pages that already have the v2 nav are skipped. Re-run it after
regenerating the price pages with generate-prices.js.

Usage:  python3 apply_v2_chrome.py /path/to/site-root
"""
import os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
APP = "https://apps.apple.com/gb/app/supermonster-grocery-tracker/id6763580977"
SKIP = {"index.html", "index-v2.html", "index-old.html"}
APPLE = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="sb-apple" viewBox="0 0 24 24">'
         '<path d="M16.37 1.43c0 1.14-.5 2.27-1.18 3.08-.74.9-1.99 1.57-2.99 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 '
         '0-1.15.57-2.27 1.2-2.98.81-.94 2.15-1.64 3.25-1.68.03.13.06.28.06.43zm4.56 15.71c-.03.07-.46 1.58-1.52 3.12-.94 '
         '1.34-1.93 2.71-3.43 2.71-1.51 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C4 18.38 2.95 15.57 '
         '2.95 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.87 0 2.22-1.01 3.9-1.01.62 0 2.89.06 4.38 2.19-.13.09-2.38 '
         '1.37-2.38 4.19 0 3.26 2.85 4.42 2.95 4.45z"/></symbol></svg>')
HEAD_ADD = ('<meta name="theme-color" content="#C8102E">\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,100,400;0,100,500;0,100,600;0,100,700;0,100,800;1,112,800;1,112,900&display=swap" rel="stylesheet">\n'
            '<link rel="stylesheet" href="/assets/v2/site.css">\n')

def nav(section):
    def link(href, label, key):
        cur = ' aria-current="page"' if key == section else ''
        return f'<li><a href="{href}"{cur}>{label}</a></li>'
    return (f'{APPLE}\n<header class="sb-nav"><nav class="sb-nav-inner" aria-label="Main">'
            f'<a class="sb-brand" href="/"><img src="/assets/v2/icon.png" alt="" width="40" height="40">Superbasket</a>'
            f'<ul class="sb-links">{link("/#features","Features","features")}{link("/prices/","UK prices","prices")}'
            f'{link("/blog/","Blog","blog")}{link("/support.html","Support","support")}</ul>'
            f'<a class="sb-dl" href="{APP}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#sb-apple"/></svg>Download</a>'
            f'</nav></header>')

BAND = (f'<section class="sb-band"><img src="/assets/v2/icon.png" alt="" width="96" height="96" loading="lazy">'
        f'<h2>Snap. Track. Save.</h2><p>Free on the App Store. Your first receipt takes about ten seconds.</p>'
        f'<a class="sb-dl" href="{APP}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#sb-apple"/></svg>Download</a></section>')

FOOTER = ('<footer class="sb-footer"><div class="sb-foot"><span>© 2026 Superbasket</span><ul>'
          '<li><a href="/prices/">UK prices</a></li><li><a href="/blog/">Blog</a></li><li><a href="/grader.html">Budget grader</a></li>'
          '<li><a href="/support.html">Support</a></li><li><a href="/privacy.html">Privacy</a></li><li><a href="/terms.html">Terms</a></li>'
          '</ul></div></footer>')

def section_for(rel):
    if rel.startswith("prices/"): return "prices"
    if rel.startswith("blog/"): return "blog"
    if rel.startswith("support"): return "support"
    return ""

def crumb_for(rel):
    if rel.startswith("prices/") and rel != "prices/index.html":
        return '<p class="sb-crumb"><a href="/prices/">All UK prices</a></p>'
    if rel.startswith("blog/") and rel != "blog/index.html":
        return '<p class="sb-crumb"><a href="/blog/">All articles</a></p>'
    return ""

def band_for(rel):
    return "" if rel in ("privacy.html", "terms.html") else BAND

def transform(path, rel):
    s = open(path, encoding="utf-8").read()
    if 'class="sb-nav"' in s:
        return "skip"
    # head
    s = re.sub(r'<meta name="theme-color"[^>]*>\s*', '', s)
    s = s.replace("</head>", HEAD_ADD + "</head>", 1)
    # body split
    bi = s.find("<body"); be = s.find(">", bi) + 1
    body_open, rest = s[:be], s[be:]
    end = rest.rfind("</body>")
    body, tail = rest[:end], rest[end:]
    body = re.sub(r'<nav\b[^>]*>.*?</nav>', '', body, count=1, flags=re.S)
    fm = list(re.finditer(r'<footer\b[^>]*>.*?</footer>', body, flags=re.S))
    if fm:
        body = body[:fm[-1].start()] + body[fm[-1].end():]
    # keep trailing scripts (outside the sheet is fine, but inside keeps order) — leave in place
    new_body = (f'\n{nav(section_for(rel))}\n<main class="sb-main">{crumb_for(rel)}<div class="sb-sheet">\n'
                f'{body.strip()}\n</div>{band_for(rel)}</main>\n{FOOTER}\n')
    open(path, "w", encoding="utf-8").write(body_open + new_body + tail)
    return "ok"

if __name__ == "__main__":
    done = skipped = 0
    for dp, dn, fn in os.walk(ROOT):
        dn[:] = [d for d in dn if not d.startswith(".") and d not in ("assets", "supermarket-logos")]
        for f in fn:
            if not f.endswith(".html"): continue
            rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, "/")
            if rel in SKIP: continue
            r = transform(os.path.join(dp, f), rel)
            done += r == "ok"; skipped += r == "skip"
    print(f"re-skinned {done}, already done {skipped}")
