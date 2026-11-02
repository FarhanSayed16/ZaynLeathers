"""Build favicon / apple-touch / OG assets from the black Zayn wordmark."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "frontend" / "public" / "brand"


def recolor(src: Image.Image, rgba: tuple[int, int, int, int]) -> Image.Image:
    a = np.array(src)
    out = a.copy()
    mask = a[:, :, 3] > 40
    out[mask, 0] = rgba[0]
    out[mask, 1] = rgba[1]
    out[mask, 2] = rgba[2]
    out[mask, 3] = rgba[3]
    return Image.fromarray(out)


def main() -> None:
    im = Image.open(BRAND / "zayn-logo-black.png").convert("RGBA")
    alpha = np.array(im)[:, :, 3]
    h, w = alpha.shape

    dens = (alpha > 40).sum(axis=0)
    thresh = dens.max() * 0.05
    in_glyph = False
    spans = []
    start = None
    for x, d in enumerate(dens):
        if d > thresh:
            if not in_glyph:
                in_glyph = True
                start = x
        elif in_glyph:
            spans.append((start, x - 1))
            in_glyph = False
    if in_glyph:
        spans.append((start, w - 1))

    x0, x1 = spans[0]
    sub = alpha[:, x0 : x1 + 1]
    ys = np.where(sub.max(axis=1) > 40)[0]
    y0, y1 = int(ys.min()), int(ys.max())
    z = im.crop((x0, y0, x1 + 1, y1 + 1))

    zw, zh = z.size
    side = max(zw, zh)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(z, ((side - zw) // 2, (side - zh) // 2), z)

    bg_color = (44, 24, 16, 255)  # #2C1810
    mark_color = (247, 242, 234, 255)  # warm cream
    light_z = recolor(sq, mark_color)

    for size, name in [
        (32, "favicon-32.png"),
        (48, "favicon-48.png"),
    ]:
        out = light_z.resize((size, size), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), bg_color)
        pad = max(2, size // 8)
        mark = light_z.resize((size - 2 * pad, size - 2 * pad), Image.Resampling.LANCZOS)
        canvas.paste(mark, (pad, pad), mark)
        canvas.save(BRAND / name)

    # Main PNG favicon
    fav = Image.new("RGBA", (64, 64), bg_color)
    mark = light_z.resize((44, 44), Image.Resampling.LANCZOS)
    fav.paste(mark, (10, 10), mark)
    mask = Image.new("L", (64, 64), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 64, 64), radius=12, fill=255)
    fav.putalpha(mask)
    fav.save(BRAND / "favicon.png")

    # Apple touch + PWA-style icons
    for size, name in [(180, "apple-touch-icon.png"), (512, "icon-512.png")]:
        canvas = Image.new("RGBA", (size, size), bg_color)
        pad = int(size * 0.18)
        mark = light_z.resize((size - 2 * pad, size - 2 * pad), Image.Resampling.LANCZOS)
        canvas.paste(mark, (pad, pad), mark)
        radius = int(size * 0.18)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
        canvas.putalpha(mask)
        canvas.save(BRAND / name)

    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Zayn Leathers">
  <rect width="64" height="64" rx="12" fill="#2C1810"/>
  <path fill="#F7F2EA" d="M13 15h38v5.5L24.5 43.5H51V49H13v-5.5L39.5 20.5H13V15z"/>
</svg>
"""
    (BRAND / "favicon.svg").write_text(svg, encoding="utf-8")

    # Open Graph share image
    og = Image.new("RGB", (1200, 630), (243, 238, 230))
    logo = Image.open(BRAND / "zayn-logo-black.png").convert("RGBA")
    target_w = 840
    ratio = target_w / logo.width
    logo2 = logo.resize((target_w, int(logo.height * ratio)), Image.Resampling.LANCZOS)
    ox = (1200 - logo2.width) // 2
    oy = (630 - logo2.height) // 2
    og.paste(logo2, (ox, oy), logo2)
    og.save(BRAND / "og-image.png", optimize=True)

    debug = BRAND / "_z-debug.png"
    if debug.exists():
        debug.unlink()

    print("Z glyph box:", x0, y0, x1, y1)
    print("Wrote favicon.svg, favicon.png, apple-touch-icon.png, og-image.png")


if __name__ == "__main__":
    main()
