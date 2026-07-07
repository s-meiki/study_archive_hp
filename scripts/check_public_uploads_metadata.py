#!/usr/bin/env python3

import io
import re
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UPLOADS_DIR = ROOT / "public" / "uploads"
DISALLOWED_FILES = {".DS_Store"}
DISALLOWED_PREFIXES = {"._"}
PDF_METADATA_MARKERS = [
    b"/Author",
    b"/Creator",
    b"/Producer",
    b"/Title",
    b"/Subject",
    b"/Keywords",
]
EMAIL_PATTERN = re.compile(
    rb"\b[A-Za-z0-9][A-Za-z0-9._%+-]{0,62}[A-Za-z0-9]@"
    rb"(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+"
    rb"[A-Za-z]{2,24}\b"
)
PRINTABLE_STRING_PATTERN = re.compile(rb"[\x20-\x7E]{6,}")
SUSPICIOUS_TEXT_PATTERNS = [
    re.compile(rb"/Users/[^\s<>]+"),
    re.compile(rb"file:///Users/[^\s<>]+"),
    re.compile(rb"token", re.IGNORECASE),
    re.compile(rb"secret", re.IGNORECASE),
    re.compile(rb"password", re.IGNORECASE),
]
SUSPICIOUS_XATTRS = {
    "com.apple.metadata:kMDItemWhereFroms",
    "com.apple.quarantine",
    "com.apple.FinderInfo",
    "com.apple.macl",
}
JPEG_EXTENSIONS = {".jpg", ".jpeg"}
# Metadata-bearing JPEG segments that can leak author names, tool/account IDs
# (Canva, Adobe), or C2PA provenance manifests. Publishable images should not
# contain any of these; scripts/strip_upload_image_metadata.py removes them.
JPEG_METADATA_MARKERS = {
    0xE1: "APP1 (Exif/XMP)",
    0xEB: "APP11 (JUMBF/C2PA)",
    0xED: "APP13 (Photoshop IRB)",
    0xFE: "COM comment",
}
PNG_METADATA_CHUNKS = {b"tEXt", b"zTXt", b"iTXt", b"eXIf"}


def find_jpeg_metadata_segments(data):
    """Walk JPEG segments up to SOS and return labels of metadata segments."""
    if data[:2] != b"\xff\xd8":
        return []

    found = []
    pos = 2
    while pos + 4 <= len(data):
        if data[pos] != 0xFF:
            break
        marker = data[pos + 1]
        if marker == 0xDA:  # start of scan: entropy data follows
            break
        if marker == 0x01 or 0xD0 <= marker <= 0xD9:
            pos += 2
            continue
        if marker in JPEG_METADATA_MARKERS:
            found.append(JPEG_METADATA_MARKERS[marker])
        pos += 2 + int.from_bytes(data[pos + 2:pos + 4], "big")
    return found


def check_image_bytes(data, label, issues):
    for segment in find_jpeg_metadata_segments(data):
        issues.append(f"{label}: JPEG metadata segment detected ({segment})")
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        for chunk in PNG_METADATA_CHUNKS:
            if chunk in data:
                issues.append(f"{label}: PNG metadata chunk detected ({chunk.decode('ascii')})")


def check_image_contents(paths):
    issues = []
    for path in paths:
        if path.suffix.lower() not in JPEG_EXTENSIONS | {".png"}:
            continue
        try:
            data = path.read_bytes()
        except OSError as error:
            issues.append(f"{path.relative_to(ROOT)}: failed to read ({error})")
            continue
        check_image_bytes(data, str(path.relative_to(ROOT)), issues)
    return issues


def check_zip_contents(paths):
    issues = []
    for path in paths:
        if path.suffix.lower() != ".zip":
            continue
        try:
            archive = zipfile.ZipFile(io.BytesIO(path.read_bytes()))
        except (OSError, zipfile.BadZipFile) as error:
            issues.append(f"{path.relative_to(ROOT)}: failed to open zip ({error})")
            continue
        for member in archive.namelist():
            name = Path(member).name
            label = f"{path.relative_to(ROOT)}!{member}"
            if name in DISALLOWED_FILES:
                issues.append(f"{label}: disallowed file inside zip")
            if any(name.startswith(prefix) for prefix in DISALLOWED_PREFIXES):
                issues.append(f"{label}: AppleDouble metadata file inside zip")
            if Path(member).suffix.lower() in JPEG_EXTENSIONS | {".png"}:
                check_image_bytes(archive.read(member), label, issues)
    return issues


def list_upload_files():
    if not UPLOADS_DIR.exists():
        return []
    return sorted(path for path in UPLOADS_DIR.rglob("*") if path.is_file())


def check_file_names(paths):
    issues = []

    for path in paths:
        if path.name in DISALLOWED_FILES:
            issues.append(f"{path.relative_to(ROOT)}: disallowed file")
        if any(path.name.startswith(prefix) for prefix in DISALLOWED_PREFIXES):
            issues.append(f"{path.relative_to(ROOT)}: AppleDouble metadata file")

    return issues


def check_pdf_contents(paths):
    issues = []

    for path in paths:
        if path.suffix.lower() != ".pdf":
            continue

        try:
            data = path.read_bytes()
        except OSError as error:
            issues.append(f"{path.relative_to(ROOT)}: failed to read ({error})")
            continue

        printable_data = b"\n".join(PRINTABLE_STRING_PATTERN.findall(data))

        for marker in PDF_METADATA_MARKERS:
            if marker in data:
                issues.append(f"{path.relative_to(ROOT)}: PDF metadata marker detected ({marker.decode('ascii')})")
                break

        if EMAIL_PATTERN.search(printable_data):
            issues.append(f"{path.relative_to(ROOT)}: email address detected in file content")

        for pattern in SUSPICIOUS_TEXT_PATTERNS:
            if pattern.search(printable_data):
                issues.append(f"{path.relative_to(ROOT)}: suspicious text fragment detected")
                break

    return issues


def check_xattrs(paths):
    issues = []

    for path in paths:
        try:
            result = subprocess.run(
                ["xattr", "-l", str(path)],
                check=False,
                capture_output=True,
            )
        except FileNotFoundError:
            return issues

        if result.returncode not in (0, 1):
            issues.append(f"{path.relative_to(ROOT)}: failed to inspect xattrs")
            continue

        output = result.stdout.decode("utf-8", errors="replace").strip()
        if not output:
            continue

        for line in output.splitlines():
            attribute = line.split(":", 1)[0].strip()
            if attribute in SUSPICIOUS_XATTRS:
                issues.append(f"{path.relative_to(ROOT)}: macOS metadata attribute detected ({attribute})")

    return issues


def main():
    upload_files = list_upload_files()
    issues = []
    issues.extend(check_file_names(upload_files))
    issues.extend(check_pdf_contents(upload_files))
    issues.extend(check_image_contents(upload_files))
    issues.extend(check_zip_contents(upload_files))
    issues.extend(check_xattrs(upload_files))

    if issues:
        print("Upload metadata check failed:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("Upload metadata check passed: no obvious Finder metadata or suspicious PDF markers were found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
