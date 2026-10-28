#!/usr/bin/env python3
"""台本mdからナレーションを抽出し、読み替え辞書を適用してTTS入力テキストを作る。

使い方:
  python3 tools/apply_tts_dict.py scripts/01-orientation.md            # audio/tts-input/01-orientation/segNN.txt に出力
  python3 tools/apply_tts_dict.py scripts/01-orientation.md --stdout   # 出力せず標準出力で確認

表示用の台本（scripts/*.md）は変更しない。辞書は tools/tts_dict.json。
"""
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DICT_PATH = Path(__file__).resolve().parent / "tts_dict.json"


def load_dict():
  data = json.loads(DICT_PATH.read_text(encoding="utf-8"))
  literal = sorted(data["literal"].items(), key=lambda kv: len(kv[0]), reverse=True)
  regex = [(re.compile(r["pattern"]), r["replace"]) for r in data["regex"]]
  return literal, regex


def extract_narrations(md_text):
  """セグメントごとのナレーション本文を [(セグメント見出し, 本文)] で返す。"""
  segments = []
  parts = re.split(r"^## +(.+)$", md_text, flags=re.M)
  for heading, body in zip(parts[1::2], parts[2::2]):
    m = re.search(r"\*\*ナレーション\*\*\n(.*)", body, re.S)
    if not m:
      continue
    lines = []
    for line in m.group(1).splitlines():
      line = line.strip()
      if not line or line.startswith(("※", "**", "-", "#", "|")):
        continue
      lines.append(line)
    if lines:
      segments.append((heading.strip(), "\n".join(lines)))
  return segments


def apply_rules(text, literal, regex):
  for src, dst in literal:
    text = text.replace(src, dst)
  for pat, dst in regex:
    text = pat.sub(dst, text)
  return text.strip() + "\n"


def main():
  args = [a for a in sys.argv[1:] if not a.startswith("--")]
  to_stdout = "--stdout" in sys.argv
  if len(args) != 1:
    sys.exit(__doc__)
  md_path = Path(args[0])
  if not md_path.is_absolute():
    md_path = BASE / md_path
  literal, regex = load_dict()
  segments = extract_narrations(md_path.read_text(encoding="utf-8"))
  if not segments:
    sys.exit(f"ナレーションが見つかりません: {md_path}")

  out_dir = BASE / "audio" / "tts-input" / md_path.stem
  for i, (heading, body) in enumerate(segments, 1):
    tts_text = apply_rules(body, literal, regex)
    if to_stdout:
      print(f"=== seg{i:02d} {heading}")
      print(tts_text)
    else:
      out_dir.mkdir(parents=True, exist_ok=True)
      (out_dir / f"seg{i:02d}.txt").write_text(tts_text, encoding="utf-8")
  if not to_stdout:
    print(f"完了: {out_dir} に {len(segments)} セグメントを出力")


if __name__ == "__main__":
  main()
