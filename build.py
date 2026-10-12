#!/usr/bin/env python3
"""Build dist/sparkz-embed.html: one self-contained file for Google Sites.

Usage:  python build.py
Needs only the Python 3 standard library. If Pillow is installed, images are
converted to WebP and shrunk first (strongly recommended: pip install Pillow).

Optional flags (mostly for testing):
  --assets DIR   read images from DIR instead of ./assets
  --out FILE     write to FILE instead of ./dist/sparkz-embed.html
"""
import argparse
import base64
import html
import io
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent
SIZE_WARN_BYTES = 2 * 1024 * 1024

# Longest side in pixels per image. Anything not listed gets DEFAULT_MAX.
HERO_FILES = {"Levitation Shot.png"}
HERO_MAX = 1200
DEFAULT_MAX = 800
LOGO_MAX = 400
WEBP_QUALITY = 78

BANNED = ["locally sourced", "local farmers", "farm to cup", "eliminates", "localStorage",
          "sessionStorage", "document.cookie", "indexedDB"]
EM_DASH = "—"

try:
    from PIL import Image, features
    HAVE_PIL = True
    HAVE_WEBP = bool(features.check("webp"))
except Exception:  # Pillow missing or broken
    HAVE_PIL = False
    HAVE_WEBP = False


def attr(tag, name):
    m = re.search(r'\b' + re.escape(name) + r'\s*=\s*"([^"]*)"', tag)
    return m.group(1) if m else None


def set_attr(tag, name, value):
    if re.search(r'\b' + re.escape(name) + r'\s*=\s*"[^"]*"', tag):
        return re.sub(r'(\b' + re.escape(name) + r'\s*=\s*")[^"]*(")',
                      lambda m: m.group(1) + value + m.group(2), tag, count=1)
    return tag[:-1].rstrip("/ ") + f' {name}="{value}">'


def drop_attr(tag, name):
    return re.sub(r'\s+' + re.escape(name) + r'\s*=\s*"[^"]*"', "", tag)


def encode_image(path: Path):
    """Return (mime, base64 text, bytes_in, bytes_out)."""
    raw = path.read_bytes()
    if not HAVE_WEBP:
        mime = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
        return mime, base64.b64encode(raw).decode("ascii"), len(raw), len(raw)
    limit = HERO_MAX if path.name in HERO_FILES else (LOGO_MAX if "logo" in path.name.lower() else DEFAULT_MAX)
    im = Image.open(path)
    im.load()
    has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    im.thumbnail((limit, limit), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    out = buf.getvalue()
    return "image/webp", base64.b64encode(out).decode("ascii"), len(raw), len(out)


def placeholder(tag, filename):
    classes = (attr(tag, "class") or "").split()
    classes.append("ph")
    alt = attr(tag, "alt") or filename
    ratio = attr(tag, "data-ratio") or "4/5"
    return (f'<div class="{" ".join(classes)}" role="img" aria-label="{alt}" '
            f'style="aspect-ratio:{ratio}"><span>{html.escape(filename)}</span></div>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--assets", default=str(ROOT / "assets"))
    ap.add_argument("--out", default=str(ROOT / "dist" / "sparkz-embed.html"))
    args = ap.parse_args()
    assets = Path(args.assets)
    out_path = Path(args.out)

    src_dir = ROOT / "src"
    page = (src_dir / "index.html").read_text(encoding="utf-8")
    css = (src_dir / "styles.css").read_text(encoding="utf-8")
    js = (src_dir / "app.js").read_text(encoding="utf-8")

    if not HAVE_WEBP:
        print("WARNING: Pillow with WebP support not found. Images will be inlined at full size.")
        print("         Run:  pip install Pillow   then build again.")

    # 1. CSS and JS
    if "</style" in css.lower() or "</script" in js.lower():
        sys.exit("ERROR: styles.css or app.js contains a closing tag that would break inlining.")
    page, n_css = re.subn(r'<link\s+rel="stylesheet"\s+href="styles\.css"\s*>',
                          lambda m: "<style>\n" + css + "\n</style>", page)
    page, n_js = re.subn(r'<script\s+src="app\.js"\s*>\s*</script>',
                         lambda m: "<script>\n" + js + "\n</script>", page)
    if n_css != 1 or n_js != 1:
        sys.exit("ERROR: could not find the styles.css link or the app.js script tag in src/index.html")

    # 2. Images
    cache = {}
    report = []
    missing = []

    def swap_img(m):
        tag = m.group(0)
        src = attr(tag, "src")
        if not src or not src.startswith("assets/"):
            return tag
        filename = unquote(src[len("assets/"):])
        path = assets / filename
        if not path.is_file():
            if filename not in missing:
                missing.append(filename)
            return placeholder(tag, filename)
        if filename not in cache:
            cache[filename] = encode_image(path)
            mime, b64, n_in, n_out = cache[filename]
            report.append((filename, n_in, n_out))
        mime, b64, _, _ = cache[filename]
        tag = set_attr(tag, "src", f"data:{mime};base64,{b64}")
        return drop_attr(tag, "data-ratio")

    page = re.sub(r"<img\b[^>]*>", swap_img, page)

    # 3. Write
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(page, encoding="utf-8", newline="\n")
    size = out_path.stat().st_size

    # 4. Report
    print("Images inlined:")
    for name, n_in, n_out in report:
        print(f"  {name:28s} {n_in/1024:8.0f} KB -> {n_out/1024:6.0f} KB")
    for name in missing:
        print(f"  MISSING: {name} (placeholder box inserted)")
    print(f"\nWrote {out_path}")
    print(f"Final size: {size/1024:.0f} KB ({size/1024/1024:.2f} MB)")
    if size > SIZE_WARN_BYTES:
        print("WARNING: file is over 2 MB. This is slow on phones and may fail to paste into Google Sites.")
        print("         Reduce image count or quality and rebuild. (Google Sites' exact embed limit is not known.)")

    # 5. Lint the output
    problems = []
    if EM_DASH in page:
        problems.append("em dash character found")
    for phrase in BANNED:
        if phrase.lower() in page.lower():
            problems.append(f'banned text found: "{phrase}"')
    if re.search(r'<(?:script|link|img)\b[^>]*(?:src|href)="(?!https://fonts\.|data:|https://instagram|https://docs\.google|https://www\.youtube-nocookie)[^"]*\.(?:js|css|png|jpe?g|webp)"', page):
        problems.append("a local file reference is still in the output")
    for p in problems:
        print("LINT WARNING:", p)
    if not problems:
        print("Lint: clean")


if __name__ == "__main__":
    main()
