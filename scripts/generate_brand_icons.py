#!/usr/bin/env python3
"""Generate the favicon set from the pulse-waveform brand mark.

Source of truth: public/images/logo.svg (viewBox 0 0 28 28)
  <rect x="1" y="1" width="26" height="26" rx="7" fill="#4f46e5"/>
  <path d="M7 20h4.7v-4.6h4.6v-4.6H21" fill="none" stroke="#ffffff"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="21" cy="8.2" r="1.6" fill="#ffffff"/>

Outputs (into public/):
  favicon.svg          … logo.svg と同一内容 (aria属性なしのプレーン版)
  favicon-32x32.png    … 32x32、角丸スクエア、透過背景
  favicon.ico          … 16/32/48 マルチサイズ
  icon-192.png         … 192x192、角丸スクエア、透過背景
  apple-touch-icon.png … 180x180、フルブリード地 (iOSが角丸マスクを適用)

Usage: python3 scripts/generate_brand_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

VIEWBOX = 28.0
PRIMARY = (0x4F, 0x46, 0xE5, 255)
WHITE = (255, 255, 255, 255)
# "M7 20h4.7v-4.6h4.6v-4.6H21" を展開した頂点列 (学びの階段)
STEPS = [(7, 20), (11.7, 20), (11.7, 15.4), (16.3, 15.4), (16.3, 10.8), (21, 10.8)]
DOT = (21, 8.2, 1.6)  # 到達点ドット (cx, cy, r)
STROKE = 2.0
RECT = (1.0, 1.0, 27.0, 27.0)
RECT_RADIUS = 7.0

SUPERSAMPLE = 16


def draw_mark(size: int, full_bleed: bool) -> Image.Image:
    """ロゴをスーパーサンプリングで描画して size 四方に縮小する。

    full_bleed=True は apple-touch-icon 用: 全面を primary で塗り、
    波形は viewBox の角丸スクエア領域 (26/28) を全面に引き伸ばした座標系で描く。
    """
    canvas = size * SUPERSAMPLE
    img = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if full_bleed:
        d.rectangle((0, 0, canvas, canvas), fill=PRIMARY)
        scale = canvas / (RECT[2] - RECT[0])
        offset = -RECT[0] * scale
    else:
        scale = canvas / VIEWBOX
        offset = 0.0
        d.rounded_rectangle(
            tuple(v * scale for v in RECT),
            radius=RECT_RADIUS * scale,
            fill=PRIMARY,
        )

    pts = [(x * scale + offset, y * scale + offset) for x, y in STEPS]
    w = STROKE * scale
    d.line(pts, fill=WHITE, width=round(w), joint="curve")
    for cx, cy in (pts[0], pts[-1]):  # 丸線端
        r = w / 2
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE)
    dx, dy, dr = DOT
    cx, cy, r = dx * scale + offset, dy * scale + offset, dr * scale
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


FAVICON_SVG = """<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="1" width="26" height="26" rx="7" fill="#4f46e5"/>
  <path d="M7 20h4.7v-4.6h4.6v-4.6H21" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="21" cy="8.2" r="1.6" fill="#ffffff"/>
</svg>
"""


def main() -> None:
    (PUBLIC / "favicon.svg").write_text(FAVICON_SVG, encoding="utf-8")

    draw_mark(32, full_bleed=False).save(PUBLIC / "favicon-32x32.png", optimize=True)
    draw_mark(192, full_bleed=False).save(PUBLIC / "icon-192.png", optimize=True)
    draw_mark(180, full_bleed=True).save(PUBLIC / "apple-touch-icon.png", optimize=True)

    ico_sizes = [16, 32, 48]
    frames = [draw_mark(s, full_bleed=False) for s in ico_sizes]
    frames[-1].save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(s, s) for s in ico_sizes],
        append_images=frames[:-1],
    )

    for name in (
        "favicon.svg",
        "favicon-32x32.png",
        "favicon.ico",
        "icon-192.png",
        "apple-touch-icon.png",
    ):
        p = PUBLIC / name
        print(f"{name}: {p.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
