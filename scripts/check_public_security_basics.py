#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "public" / "data" / "site-content.js"

EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
SUSPICIOUS_KEY_PATTERN = re.compile(r"(password|passwd|secret|token|api[_-]?key|authorization|cookie)", re.IGNORECASE)
SUSPICIOUS_VALUE_PATTERNS = [
    re.compile(r"\bBearer\s+[A-Za-z0-9._\-]+=*", re.IGNORECASE),
    re.compile(r"\bAIza[0-9A-Za-z\-_]{20,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9]{16,}\b"),
]


def load_site_data(path: Path) -> dict:
    text = path.read_text(encoding="utf-8").strip()
    prefix = "window.STUDY_ARCHIVE_DATA = "

    if not text.startswith(prefix) or not text.endswith(";"):
        raise ValueError(f"Unexpected file format: {path}")

    payload = text[len(prefix):-1].strip()
    return json.loads(payload)


def is_safe_url(value: str, allow_relative: bool = True) -> bool:
    if not value or re.search(r"[\x00-\x1F\x7F]", value):
        return False

    if value.startswith("//") or value.startswith("#"):
        return False

    if re.match(r"^[a-z][a-z0-9+.-]*:", value, re.IGNORECASE):
        return value.lower().startswith(("http://", "https://"))

    return allow_relative


def scan_node(node, path="root", issues=None):
    if issues is None:
        issues = []

    if isinstance(node, dict):
        for key, value in node.items():
            child_path = f"{path}.{key}"
            if SUSPICIOUS_KEY_PATTERN.search(str(key)):
                issues.append(f"{child_path}: suspicious key name")
            scan_node(value, child_path, issues)
        return issues

    if isinstance(node, list):
        for index, value in enumerate(node):
            scan_node(value, f"{path}[{index}]", issues)
        return issues

    if isinstance(node, str):
        if EMAIL_PATTERN.search(node):
            issues.append(f"{path}: email address detected")

        for pattern in SUSPICIOUS_VALUE_PATTERNS:
            if pattern.search(node):
                issues.append(f"{path}: suspicious secret-like value detected")
                break

    return issues


def scan_archive_links(data: dict) -> list[str]:
    issues = []

    for index, archive in enumerate(data.get("archives", [])):
        link_prefix = f"archives[{index}].links"
        for kind, value in archive.get("links", {}).items():
            if value and not is_safe_url(str(value), allow_relative=(kind != "recording")):
                issues.append(f"{link_prefix}.{kind}: unsafe URL scheme")

        for material_index, item in enumerate(archive.get("detail", {}).get("materials", [])):
            url = str(item.get("url", ""))
            if url and not is_safe_url(url):
                issues.append(f"archives[{index}].detail.materials[{material_index}].url: unsafe URL scheme")

        recording_url = str(archive.get("detail", {}).get("video", {}).get("url", ""))
        if recording_url and not is_safe_url(recording_url):
            issues.append(f"archives[{index}].detail.video.url: unsafe URL scheme")

    return issues


def main() -> int:
    try:
        data = load_site_data(DATA_FILE)
    except Exception as error:  # noqa: BLE001
        print(f"[error] {error}", file=sys.stderr)
        return 2

    issues = []
    issues.extend(scan_node(data))
    issues.extend(scan_archive_links(data))

    if issues:
        print("Security check failed:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("Security check passed: no obvious public-data secrets, emails, or unsafe URLs were found.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
