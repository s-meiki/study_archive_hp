#!/usr/bin/env python3

import argparse
import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

DEFAULT_SHEET_NAME = "開催勉強会、レクチャー一覧"
DEFAULT_SOURCE_PATH = "content/source/lecture-archives.xlsx"
DEFAULT_OUTPUT_PATH = "data/site-content.js"

THEMES = [
    {
        "id": "cardiology",
        "name": "循環器",
        "summary": "虚血性心疾患・不整脈の薬物治療",
    },
    {
        "id": "neurology",
        "name": "脳神経",
        "summary": "脳梗塞・脳卒中の病態と治療",
    },
    {
        "id": "foundations",
        "name": "基礎レクチャー",
        "summary": "輸液・導入講義・基礎整理",
    },
    {
        "id": "research-career",
        "name": "研究・認定",
        "summary": "臨床研究・認定制度・学会報告",
    },
    {
        "id": "ai-utilization",
        "name": "AI活用",
        "summary": "業務改善・情報整理・実践例",
    },
]

THEME_COLORS = {
    "cardiology": ("#6b5548", "#c0a48f"),
    "neurology": ("#556070", "#98a4bb"),
    "foundations": ("#5d5b47", "#b4b08c"),
    "research-career": ("#5b4c4c", "#baa09b"),
    "ai-utilization": ("#365a5c", "#9dbab7"),
}

SUMMARY_OVERRIDES = {
    "accept論文 報告会": "論文の内容共有と実務への持ち帰りを目的にした報告会。",
    "臨床研究ってなに？ 臨床研究ってなんのためにするの？ 臨床研究して自分にメリットあるの？ 的な概論的内容": "臨床研究の目的や取り組む意義を導入的に整理するレクチャー。",
    "日病薬/医療薬の専門認定に関するレクチャー": "専門認定制度の概要と学習の進め方を確認するレクチャー。",
    "AIを活用する【第一回】": "AI活用シリーズ第1回。日常業務や学習への取り入れ方を扱う勉強会。",
    "AIを活用する【第二回】": "AI活用シリーズ第2回。実践例と参考リンクを交えた継続回。",
    "臨床業務と研究を両立させるヒントや実例に関して": "日常業務と研究活動を両立するためのヒントや実例を共有する回。",
    "AIを活用する【第三回】": "AI活用シリーズ第3回。継続運用を前提にした実践共有回。",
    "AIを活用する【第四回】": "AI活用シリーズ第4回。院内での活用を広げるための勉強会。",
    "基礎から固めていこう": "周辺知識を含めて基礎事項を整理し直すための入門レクチャー。",
    "脳梗塞の病態と薬物治療について": "脳梗塞の病態理解と薬物治療の要点を確認する勉強会。",
    "脳梗塞の病態と薬物治療について(同内容)": "脳梗塞の病態と薬物治療を同内容で再実施した回。",
    "帰還報告会(医療薬学会)": "医療薬学会参加後の学びと現場への示唆を共有する報告会。",
    "「今さら聞けないシリーズ」---輸液の基礎---": "今さら聞けないシリーズとして輸液の基礎を押さえ直すレクチャー。",
    "脳卒中（出血性疾患編）": "脳卒中のうち出血性疾患に焦点を当てて病態と治療を整理する回。",
    "「虚血性心疾患の薬物治療」": "虚血性心疾患に対する薬物治療の考え方を整理する勉強会。",
    "「心房細動の薬物治療」": "心房細動に対する薬物治療の基本と処方の見方を確認する勉強会。",
}


def parse_args():
    parser = argparse.ArgumentParser(
        description="Import archive rows from an Excel workbook into data/site-content.js",
    )
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE_PATH,
        help=f"source workbook path (default: {DEFAULT_SOURCE_PATH})",
    )
    parser.add_argument(
        "--sheet",
        default=DEFAULT_SHEET_NAME,
        help=f"sheet name to import (default: {DEFAULT_SHEET_NAME})",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT_PATH,
        help=f"output JavaScript path (default: {DEFAULT_OUTPUT_PATH})",
    )
    return parser.parse_args()


def load_shared_strings(archive):
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    values = []
    for item in root:
        text = "".join(
            node.text or ""
            for node in item.iter(f"{{{NS['main']}}}t")
        )
        values.append(text)
    return values


def workbook_targets(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}

    targets = {}
    for sheet in workbook.find("main:sheets", NS):
        rel_id = sheet.attrib[f"{{{NS['rel']}}}id"]
        targets[sheet.attrib["name"]] = "xl/" + rel_map[rel_id]
    return targets


def cell_value(cell, shared_strings):
    value_node = cell.find("main:v", NS)
    value = "" if value_node is None else value_node.text or ""
    cell_type = cell.attrib.get("t")

    if cell_type == "s" and value:
        return shared_strings[int(value)]

    if cell_type == "inlineStr":
        inline = cell.find("main:is", NS)
        if inline is None:
            return ""
        return "".join(
            node.text or ""
            for node in inline.iter(f"{{{NS['main']}}}t")
        )

    return value


def parse_sheet_rows(workbook_path, sheet_name):
    with ZipFile(workbook_path) as archive:
        shared_strings = load_shared_strings(archive)
        targets = workbook_targets(archive)
        if sheet_name not in targets:
            raise ValueError(f"Sheet not found: {sheet_name}")

        sheet = ET.fromstring(archive.read(targets[sheet_name]))
        sheet_data = sheet.find("main:sheetData", NS)
        rows = []

        for row in sheet_data:
            row_values = {}
            for cell in row:
                ref = cell.attrib.get("r", "")
                column = "".join(char for char in ref if char.isalpha())
                row_values[column] = cell_value(cell, shared_strings)
            rows.append(row_values)

        return rows


def excel_date_to_iso(raw_value):
    if not raw_value:
        return ""

    try:
        base = datetime(1899, 12, 30)
        date = base + timedelta(days=float(raw_value))
        return date.strftime("%Y-%m-%d")
    except ValueError:
        return raw_value


def normalize_text(value):
    return " ".join((value or "").split())


def normalize_link(value):
    value = normalize_text(value)
    return "" if value in {"", "-"} else value


def read_archive_entries(workbook_path, sheet_name):
    rows = parse_sheet_rows(workbook_path, sheet_name)
    header_index = None

    for index, row in enumerate(rows):
        if row.get("A") == "開催日" and row.get("B") == "内容":
            header_index = index
            break

    if header_index is None:
        raise ValueError("Header row not found in workbook")

    entries = []
    for row in rows[header_index + 1:]:
        date = excel_date_to_iso(row.get("A", ""))
        title = normalize_text(row.get("B", ""))
        speaker = normalize_text(row.get("C", ""))
        recording = normalize_link(row.get("D", ""))
        references = normalize_link(row.get("E", ""))

        if not any([date, title, speaker, recording, references]):
            continue

        entries.append(
            {
                "date": date,
                "title": title,
                "speaker": speaker,
                "recording": recording,
                "references": references,
            }
        )

    return entries


def classify_theme(title):
    if any(keyword in title for keyword in ["心房細動", "虚血性心疾患"]):
        return "cardiology"
    if any(keyword in title for keyword in ["脳梗塞", "脳卒中", "出血性"]):
        return "neurology"
    if any(keyword in title for keyword in ["輸液", "基礎"]):
        return "foundations"
    if "AI" in title:
        return "ai-utilization"
    return "research-career"


def build_summary(title, theme_id):
    if title in SUMMARY_OVERRIDES:
        return SUMMARY_OVERRIDES[title]

    if theme_id == "ai-utilization":
        return "AI活用に関する勉強会アーカイブ。実務や学習への応用を扱う回。"
    if theme_id == "cardiology":
        return "循環器領域の病態理解と薬物治療の要点を整理する勉強会。"
    if theme_id == "neurology":
        return "脳神経領域の病態と薬物治療を確認する勉強会。"
    if theme_id == "foundations":
        return "日常業務の土台になる基礎事項を整理するレクチャー。"
    return "研究・認定・報告会に関する勉強会アーカイブ。"


def archive_id(date, title):
    seed = f"{date}|{title}".encode("utf-8")
    digest = hashlib.sha1(seed).hexdigest()[:10]
    return f"archive-{date.replace('-', '')}-{digest}"


def build_archives(entries):
    archives = []

    for entry in entries:
        theme_id = classify_theme(entry["title"])
        start, end = THEME_COLORS[theme_id]
        archives.append(
            {
                "id": archive_id(entry["date"], entry["title"]),
                "themeId": theme_id,
                "title": entry["title"],
                "summary": build_summary(entry["title"], theme_id),
                "speaker": entry["speaker"],
                "date": entry["date"],
                "updatedAt": entry["date"],
                "duration": "未記載",
                "featured": False,
                "assets": {
                    "recording": bool(entry["recording"]),
                    "slides": False,
                    "notes": False,
                    "references": bool(entry["references"]),
                },
                "links": {
                    "recording": entry["recording"],
                    "slides": "",
                    "notes": "",
                    "references": entry["references"],
                },
                "thumbnail": {
                    "start": start,
                    "end": end,
                },
            }
        )

    latest_per_theme = {}
    for archive in archives:
        current = latest_per_theme.get(archive["themeId"])
        if current is None or archive["date"] > current["date"]:
            latest_per_theme[archive["themeId"]] = archive

    for archive in latest_per_theme.values():
        archive["featured"] = True

    return archives


def write_site_data(output_path, themes, archives):
    payload = {
        "themes": themes,
        "archives": archives,
    }
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    output = f"window.STUDY_ARCHIVE_DATA = {body};\n"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(output, encoding="utf-8")


def main():
    args = parse_args()
    source_path = Path(args.source)
    output_path = Path(args.output)

    if not source_path.exists():
        raise SystemExit(f"Source workbook not found: {source_path}")

    entries = read_archive_entries(source_path, args.sheet)
    archives = build_archives(entries)
    write_site_data(output_path, THEMES, archives)

    print(f"Imported {len(archives)} archives from {source_path} -> {output_path}")


if __name__ == "__main__":
    main()
