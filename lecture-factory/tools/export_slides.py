#!/usr/bin/env python3
"""スライドHTML（.slide セクションの集合）を1枚ずつのHTMLに分割し、
Chromeヘッドレスで 1920x1080 のPNGに書き出す。

使い方:
  python3 tools/export_slides.py slides/01-orientation.html slides/lesson01

出力: <outdir>/segNN.html と <outdir>/segNN.png
"""
import re
import subprocess
import sys
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE = Path(__file__).resolve().parent.parent


def main():
  if len(sys.argv) != 3:
    sys.exit(__doc__)
  src = Path(sys.argv[1])
  outdir = Path(sys.argv[2])
  if not src.is_absolute():
    src = BASE / src
  if not outdir.is_absolute():
    outdir = BASE / outdir
  outdir.mkdir(parents=True, exist_ok=True)

  html = src.read_text(encoding="utf-8")
  head = re.search(r"(<head>.*?</head>)", html, re.S).group(1)
  # 1枚撮影用にスライドの外余白を消す
  head = head.replace("margin: 0 auto 4px;", "margin: 0;")
  sections = re.findall(r"(<section class=\"slide.*?</section>)", html, re.S)
  if not sections:
    sys.exit(f"スライドが見つかりません: {src}")

  pngs = []
  for i, sec in enumerate(sections, 1):
    page = f'<!DOCTYPE html>\n<html lang="ja">\n{head}\n<body>\n{sec}\n</body>\n</html>\n'
    html_path = outdir / f"seg{i:02d}.html"
    html_path.write_text(page, encoding="utf-8")
    png_path = outdir / f"seg{i:02d}.png"
    cmd = [
      CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--window-size=1920,1080",
      "--virtual-time-budget=10000",
      f"--screenshot={png_path}", html_path.as_uri(),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if not png_path.exists():
      sys.exit(f"撮影失敗: {png_path}\n{res.stderr}")
    pngs.append(png_path)
    print(f"書き出し: {png_path.name}")

  print(f"完了: {len(pngs)} 枚を {outdir} に出力")


if __name__ == "__main__":
  main()
