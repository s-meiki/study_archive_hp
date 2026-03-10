#!/usr/bin/env python3

import re
import subprocess
import sys
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
