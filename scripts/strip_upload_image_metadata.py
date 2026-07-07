#!/usr/bin/env python3
"""Strip embedded metadata (Exif/XMP/Photoshop/comments) from JPEGs in public/uploads.

JPEG segments are dropped without re-encoding pixels, so image quality is
untouched. Files are rewritten via a temp file + os.replace, which also clears
macOS extended attributes (com.apple.quarantine, com.apple.macl, ...).

Usage:
  python3 scripts/strip_upload_image_metadata.py           # dry-run (report only)
  python3 scripts/strip_upload_image_metadata.py --apply   # rewrite files
"""

import os
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = ROOT / "public" / "uploads"
JPEG_EXTS = {".jpg", ".jpeg"}

# Dropped segment markers: APP1 (Exif/XMP), APP11 (JUMBF/C2PA content
# credentials), APP13 (Photoshop IRB), COM (comment).
# APP0 (JFIF), APP2 (ICC profile), APP14 (Adobe color transform) are kept so
# color rendering is unchanged.
DROPPED_MARKERS = {0xE1, 0xEB, 0xED, 0xFE}


def strip_jpeg_segments(data):
    """Return (stripped_bytes, dropped_segment_count). Raises ValueError on malformed JPEG."""
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG (missing SOI)")

    out = bytearray(b"\xff\xd8")
    pos = 2
    dropped = 0

    while pos < len(data):
        if data[pos] != 0xFF:
            raise ValueError(f"expected marker at offset {pos}")
        marker = data[pos + 1]

        # SOS: copy the rest verbatim (entropy-coded data until EOI).
        if marker == 0xDA:
            out.extend(data[pos:])
            break

        # Standalone markers (no length field).
        if marker in (0x01,) or 0xD0 <= marker <= 0xD9:
            out.extend(data[pos:pos + 2])
            pos += 2
            continue

        length = int.from_bytes(data[pos + 2:pos + 4], "big")
        segment = data[pos:pos + 2 + length]
        if marker in DROPPED_MARKERS:
            dropped += 1
        else:
            out.extend(segment)
        pos += 2 + length

    return bytes(out), dropped


def main():
    apply_changes = "--apply" in sys.argv[1:]
    mode = "apply" if apply_changes else "dry-run"
    print(f"strip_upload_image_metadata ({mode})")

    targets = sorted(
        p for p in UPLOADS_DIR.rglob("*")
        if p.is_file() and p.suffix.lower() in JPEG_EXTS
    )
    if not targets:
        print("no JPEG files found under public/uploads")
        return 0

    changed = 0
    for path in targets:
        data = path.read_bytes()
        try:
            stripped, dropped = strip_jpeg_segments(data)
        except ValueError as error:
            print(f"- SKIP {path.relative_to(ROOT)}: {error}")
            continue

        if dropped == 0:
            continue

        changed += 1
        saved = len(data) - len(stripped)
        print(f"- {path.relative_to(ROOT)}: {dropped} segment(s) dropped, {saved} bytes removed")

        if apply_changes:
            fd, tmp_name = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
            try:
                with os.fdopen(fd, "wb") as tmp:
                    tmp.write(stripped)
                os.replace(tmp_name, path)
            except BaseException:
                os.unlink(tmp_name)
                raise

    print(f"{changed}/{len(targets)} JPEG file(s) {'rewritten' if apply_changes else 'would be rewritten'}")
    if not apply_changes and changed:
        print("re-run with --apply to rewrite files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
