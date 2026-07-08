#!/usr/bin/env python3
"""Generate quiz-writing source material for archives that have no quiz yet.

Reads public/data/site-content.js (the same window-assigned JS format used by
scripts/import_archives_from_xlsx.py) and, for every archive that does not yet
have a content/quizzes/<archiveId>.json file, writes the material needed to
write quiz questions into content/quizzes/_sources.json.

Existing quiz files (any reviewStatus) are never overwritten.

Usage:
    python3 scripts/generate_quiz_drafts.py
    python3 scripts/generate_quiz_drafts.py --scaffold   # also create empty
                                                          # draft quiz files
"""

import argparse
import json
from datetime import date
from pathlib import Path

DEFAULT_SITE_CONTENT_PATH = "public/data/site-content.js"
DEFAULT_QUIZZES_DIR = "content/quizzes"
SOURCES_FILENAME = "_sources.json"


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Extract quiz-writing source material for archives that do not "
            "yet have a content/quizzes/<archiveId>.json file."
        ),
    )
    parser.add_argument(
        "--site-content",
        default=DEFAULT_SITE_CONTENT_PATH,
        help=f"path to site-content.js (default: {DEFAULT_SITE_CONTENT_PATH})",
    )
    parser.add_argument(
        "--quizzes-dir",
        default=DEFAULT_QUIZZES_DIR,
        help=f"quizzes directory (default: {DEFAULT_QUIZZES_DIR})",
    )
    parser.add_argument(
        "--scaffold",
        action="store_true",
        help=(
            "also create an empty ArchiveQuiz scaffold file for each archive "
            "missing a quiz (reviewStatus: draft, questions: [])"
        ),
    )
    parser.add_argument(
        "--multiple",
        action="store_true",
        help=(
            "with --scaffold, also seed a type:multiple draft question built "
            "from keyPoints (>=3 items). Distractors are placeholders to be "
            "replaced during review; the question stays reviewStatus:draft."
        ),
    )
    return parser.parse_args()


def load_site_content(site_content_path: Path):
    prefix = "window.STUDY_ARCHIVE_DATA = "
    text = site_content_path.read_text(encoding="utf-8").strip()

    if not text.startswith(prefix):
        raise SystemExit(
            f"Unexpected format in {site_content_path}: missing '{prefix}' prefix"
        )

    body = text[len(prefix):].rstrip(";\n")
    try:
        return json.loads(body)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Failed to parse {site_content_path} as JSON: {error}")


def existing_quiz_archive_ids(quizzes_dir: Path):
    if not quizzes_dir.exists():
        return set()

    ids = set()
    for path in quizzes_dir.glob("*.json"):
        if path.name.startswith("_"):
            continue
        ids.add(path.stem)
    return ids


def build_source_entry(archive: dict):
    detail = archive.get("detail") or {}
    return {
        "title": archive.get("title", ""),
        "summary": archive.get("summary", ""),
        "overview": detail.get("overview", ""),
        "keyPoints": detail.get("keyPoints", []),
        "themeId": archive.get("themeId", ""),
        "date": archive.get("date", ""),
    }


def build_multiple_draft_question(entry: dict):
    """Seed a type:multiple draft question from keyPoints, or None if too weak.

    Correct answers are the archive's keyPoints (kept verbatim, faithful to the
    source). Distractors are explicit placeholders so a human must replace them
    during review. The question stays reviewStatus:draft and is therefore
    excluded from the built quiz-bank until reviewed.
    """
    key_points = [kp for kp in entry.get("keyPoints", []) if isinstance(kp, str) and kp.strip()]
    if len(key_points) < 3:
        return None

    # answerIds must be 2..(choices-1). With N keyPoints as correct answers we
    # add >=1 placeholder distractor so the count stays valid.
    letters = ["a", "b", "c", "d", "e", "f", "g", "h"]
    correct = key_points[: min(len(key_points), len(letters) - 1)]
    choices = []
    answer_ids = []
    for idx, text in enumerate(correct):
        choices.append({"id": letters[idx], "text": text})
        answer_ids.append(letters[idx])
    # placeholder distractors (must be reviewed/replaced before publishing)
    for offset in range(2):
        idx = len(choices)
        if idx >= len(letters):
            break
        choices.append(
            {"id": letters[idx], "text": "（出典外のダミー選択肢。レビューで差し替える）"}
        )

    return {
        "id": "m1",
        "type": "multiple",
        "prompt": "この回のキーポイントとして資料に挙げられているものを、すべて選んでください。",
        "choices": choices,
        "answerIds": answer_ids,
        "explanation": "keyPoints に挙げられている項目が正答です（レビューで文面を調整すること）。",
        "reviewStatus": "draft",
    }


def build_scaffold(archive_id: str, today: str, entry: dict = None, with_multiple: bool = False):
    questions = []
    if with_multiple and entry is not None:
        question = build_multiple_draft_question(entry)
        if question is not None:
            questions.append(question)
    return {
        "archiveId": archive_id,
        "passThreshold": 0.7,
        "questions": questions,
        "reviewStatus": "draft",
        "generatedBy": "ai",
        "updatedAt": today,
    }


def main():
    args = parse_args()
    site_content_path = Path(args.site_content)
    quizzes_dir = Path(args.quizzes_dir)

    if not site_content_path.exists():
        raise SystemExit(f"site-content.js not found: {site_content_path}")

    site_data = load_site_content(site_content_path)
    archives = site_data.get("archives", [])
    if not isinstance(archives, list):
        raise SystemExit(f"Unexpected 'archives' field in {site_content_path}")

    quizzes_dir.mkdir(parents=True, exist_ok=True)
    existing_ids = existing_quiz_archive_ids(quizzes_dir)

    missing_archives = [
        archive for archive in archives
        if archive.get("id") and archive["id"] not in existing_ids
    ]

    sources = {
        archive["id"]: build_source_entry(archive)
        for archive in missing_archives
    }

    sources_path = quizzes_dir / SOURCES_FILENAME
    sources_path.write_text(
        json.dumps(sources, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote source material for {len(sources)} archives -> {sources_path}")

    if args.scaffold:
        today = date.today().isoformat()
        created = 0
        seeded_multiple = 0
        for archive_id, entry in sources.items():
            scaffold_path = quizzes_dir / f"{archive_id}.json"
            if scaffold_path.exists():
                continue
            scaffold = build_scaffold(
                archive_id, today, entry=entry, with_multiple=args.multiple
            )
            if scaffold["questions"]:
                seeded_multiple += 1
            scaffold_path.write_text(
                json.dumps(scaffold, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            created += 1
        print(f"Created {created} scaffold quiz files in {quizzes_dir}")
        if args.multiple:
            print(f"  Seeded a type:multiple draft question in {seeded_multiple} of them.")

    skipped = len(archives) - len(missing_archives)
    print(f"Skipped {skipped} archives that already have a quiz file.")


if __name__ == "__main__":
    main()
