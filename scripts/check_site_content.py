#!/usr/bin/env python3
"""Validate the generated site data contract in public/data/site-content.js.

Checks the invariants that admin/index.html and
scripts/import_archives_from_xlsx.py are both expected to maintain
(see AGENTS.md, Testing Guidelines):

- the payload parses as `window.STUDY_ARCHIVE_DATA = {...};`
- theme ids are unique and non-empty
- every archive themeId matches an entry in themes
- archive ids are unique and non-empty
- archive dates use YYYY-MM-DD
- archives are stored in descending date order
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_CONTENT_PATH = ROOT / "public" / "data" / "site-content.js"
PREFIX = "window.STUDY_ARCHIVE_DATA = "
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def load_site_data():
    source = SITE_CONTENT_PATH.read_text(encoding="utf-8")
    if not source.startswith(PREFIX):
        raise ValueError(f"expected file to start with `{PREFIX}`")
    return json.loads(source[len(PREFIX):].strip().rstrip(";"))


def check_themes(data, issues):
    seen = set()
    for index, theme in enumerate(data.get("themes", [])):
        theme_id = theme.get("id")
        if not theme_id:
            issues.append(f"themes[{index}]: missing id")
        elif theme_id in seen:
            issues.append(f"themes[{index}]: duplicate id `{theme_id}`")
        seen.add(theme_id)
    return seen


def check_archives(data, theme_ids, issues):
    seen_ids = set()
    previous_date = None

    for index, archive in enumerate(data.get("archives", [])):
        archive_id = archive.get("id")
        label = f"archives[{index}] ({archive_id or 'no id'})"

        if not archive_id:
            issues.append(f"{label}: missing id")
        elif archive_id in seen_ids:
            issues.append(f"{label}: duplicate id")
        seen_ids.add(archive_id)

        theme_id = archive.get("themeId")
        if theme_id not in theme_ids:
            issues.append(f"{label}: themeId `{theme_id}` has no matching theme")

        date = archive.get("date", "")
        if not DATE_PATTERN.match(date):
            issues.append(f"{label}: date `{date}` is not YYYY-MM-DD")
        elif previous_date is not None and date > previous_date:
            issues.append(
                f"{label}: date {date} breaks descending order (previous was {previous_date})"
            )
        if DATE_PATTERN.match(date):
            previous_date = date


def main():
    issues = []
    try:
        data = load_site_data()
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"Site content check failed: cannot load {SITE_CONTENT_PATH.relative_to(ROOT)} ({error})")
        return 1

    theme_ids = check_themes(data, issues)
    check_archives(data, theme_ids, issues)

    if issues:
        print("Site content check failed:")
        for issue in issues:
            print(f"- {issue}")
        return 1

    archives = data.get("archives", [])
    print(f"Site content check passed: {len(archives)} archives, themeIds valid, descending date order.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
