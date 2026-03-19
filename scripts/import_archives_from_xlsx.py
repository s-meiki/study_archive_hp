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
DEFAULT_OUTPUT_PATH = "public/data/site-content.js"

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

THEME_DETAIL_TEMPLATES = {
    "cardiology": {
        "overview": "循環器領域の病態整理から薬剤選択の考え方までを、実際の処方判断につなげて見直しやすい内容です。",
        "key_points": [
            "病態と治療目的を結び付けて理解する",
            "薬剤選択の根拠と注意点を整理する",
            "実務で迷いやすい処方判断の視点を押さえる",
        ],
    },
    "neurology": {
        "overview": "神経領域で見落としやすい病態の違いと治療方針を、急性期から再発予防まで流れで確認しやすい内容です。",
        "key_points": [
            "病態の捉え方と初期評価のポイントを整理する",
            "治療方針の切り分けと薬物療法の役割を確認する",
            "再発予防や合併症管理につながる視点を押さえる",
        ],
    },
    "foundations": {
        "overview": "日常業務の土台になる基礎事項を、前提知識から順に積み上げて見直しやすい内容です。",
        "key_points": [
            "基礎概念を曖昧にせず言語化する",
            "日常処方や評価で外しにくい基本を整理する",
            "応用に入る前に確認すべき前提を押さえる",
        ],
    },
    "research-career": {
        "overview": "研究実践や認定取得、学会報告を自分の業務にどうつなげるかを意識して整理しやすい内容です。",
        "key_points": [
            "制度や研究活動の全体像を把握する",
            "現場に持ち帰る実践ポイントを整理する",
            "継続学習や次の行動につながる視点を持つ",
        ],
    },
    "ai-utilization": {
        "overview": "AIを日常業務や学習にどう安全に組み込むかを、具体的な使いどころと運用イメージで確認しやすい内容です。",
        "key_points": [
            "AIを使う場面と使わない場面を切り分ける",
            "情報整理や下書き作成への落とし込み方を確認する",
            "個人情報や安全性への配慮を前提に運用する",
        ],
    },
}

TOPIC_RULES = [
    {
        "keywords": ["心房細動"],
        "overview": "抗凝固療法やレート・リズムコントロールを含め、処方の意図を追いながら整理しやすい回です。",
        "key_points": [
            "心房細動の病態と治療目標を整理する",
            "抗凝固療法とレート・リズムコントロールの基本を確認する",
            "出血リスクや併存疾患を踏まえた薬剤選択の視点を押さえる",
        ],
    },
    {
        "keywords": ["虚血性心疾患", "狭心症", "冠動脈"],
        "overview": "虚血性イベントの理解から慢性期管理までをつなげて、薬物治療の組み立てを見直しやすい回です。",
        "key_points": [
            "虚血性心疾患の病態と治療目的を整理する",
            "抗血小板薬や抗狭心症薬など主要薬剤の役割を確認する",
            "再発予防と長期管理の視点を押さえる",
        ],
    },
    {
        "keywords": ["脳梗塞"],
        "overview": "脳梗塞の分類や病態差を踏まえて、急性期対応から再発予防まで学び直しやすい回です。",
        "key_points": [
            "脳梗塞の病態と分類を整理する",
            "急性期治療と再発予防で求められる薬物療法を確認する",
            "再発リスクや合併症管理の視点を押さえる",
        ],
    },
    {
        "keywords": ["出血性", "脳卒中"],
        "overview": "出血性病変の初期評価と治療方針を、虚血性疾患との違いも含めて整理しやすい回です。",
        "key_points": [
            "出血性脳卒中の病態と初期評価を整理する",
            "降圧や止血を含む治療方針の基本を確認する",
            "虚血性疾患との考え方の違いを押さえる",
        ],
    },
    {
        "keywords": ["輸液", "電解質", "脱水"],
        "overview": "輸液の基本設計を、適応や組成の違いと合わせて日常処方に結び付けて確認しやすい回です。",
        "key_points": [
            "輸液の目的と基本的な使い分けを整理する",
            "循環や電解質の見方と補正の考え方を確認する",
            "日常業務で誤りやすいポイントを押さえる",
        ],
    },
    {
        "keywords": ["臨床研究", "研究"],
        "overview": "研究に取り組む意味や進め方を、現場の課題設定と結び付けて理解しやすい回です。",
        "key_points": [
            "臨床研究の目的と位置付けを整理する",
            "研究テーマの立て方と進め方の基本を確認する",
            "現場に還元する視点を持って学ぶ",
        ],
    },
    {
        "keywords": ["認定", "専門認定"],
        "overview": "認定制度の全体像を把握し、必要な準備や学習計画へ落とし込みやすい回です。",
        "key_points": [
            "認定制度の全体像と要件を整理する",
            "学習計画や準備の進め方を確認する",
            "日常業務と認定取得を結び付けて考える",
        ],
    },
    {
        "keywords": ["報告会", "学会", "論文"],
        "overview": "外部で得た知見を院内実務へどう持ち帰るかを、要点整理と共有の観点で見直しやすい回です。",
        "key_points": [
            "共有された知見の要点を整理する",
            "現場に持ち帰るべき示唆を確認する",
            "次の学習や実践につながる論点を押さえる",
        ],
    },
    {
        "keywords": ["両立", "実例"],
        "overview": "日常業務と研究活動を両立させるための考え方を、実例ベースで整理しやすい回です。",
        "key_points": [
            "業務と研究を両立させる工夫を整理する",
            "時間配分や進め方の実例を確認する",
            "無理なく継続するための視点を押さえる",
        ],
    },
    {
        "keywords": ["AI", "生成AI", "プロンプト"],
        "overview": "AIの具体的な使いどころを、情報整理や学習補助など日常運用に引き寄せて確認しやすい回です。",
        "key_points": [
            "AIを活用する目的と適した場面を整理する",
            "業務効率化や学習補助への具体的な落とし込み方を確認する",
            "個人情報や安全性への配慮を前提に使い方を見直す",
        ],
    },
]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Import archive rows from an Excel workbook into public/data/site-content.js",
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


def normalize_multiline_text(value):
    return "\n".join(
        normalize_text(line)
        for line in str(value or "").splitlines()
        if normalize_text(line)
    )


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


def ensure_sentence(text):
    text = normalize_text(text)
    if not text:
        return ""
    if text[-1] in "。.!！?？":
        return text
    return f"{text}。"


def topic_rule_for_title(title):
    best_rule = None
    best_length = -1

    for rule in TOPIC_RULES:
        matched_lengths = [
            len(keyword)
            for keyword in rule["keywords"]
            if keyword in title
        ]
        if matched_lengths and max(matched_lengths) > best_length:
            best_rule = rule
            best_length = max(matched_lengths)

    return best_rule


def build_support_sentence(entry):
    if entry["recording"] and entry["references"]:
        return "録画と参考資料を行き来しながら、理解を深めやすい構成です。"
    if entry["recording"]:
        return "録画を見返しながら、説明の流れごと復習しやすい構成です。"
    if entry["references"]:
        return "参考資料とあわせて、要点や根拠を追い直しやすい構成です。"
    return "学習の軸になるポイントを短時間で見直しやすい内容です。"


def build_detail_overview(entry, theme_id, summary):
    topic_rule = topic_rule_for_title(entry["title"])
    focus = topic_rule["overview"] if topic_rule else THEME_DETAIL_TEMPLATES[theme_id]["overview"]
    paragraphs = [
        ensure_sentence(summary),
        ensure_sentence(focus) + ensure_sentence(build_support_sentence(entry)),
    ]
    return "\n".join(dict.fromkeys(filter(None, paragraphs)))


def build_detail_key_points(entry, theme_id):
    topic_rule = topic_rule_for_title(entry["title"])
    key_points = list(topic_rule["key_points"] if topic_rule else THEME_DETAIL_TEMPLATES[theme_id]["key_points"])

    if entry["recording"] and entry["references"]:
        key_points.append("録画と参考資料を行き来しながら、判断の根拠になった説明箇所を押さえる")
    elif entry["recording"]:
        key_points.append("録画を見返しながら、説明の流れと実務上の判断点を確認する")
    elif entry["references"]:
        key_points.append("参考資料と照らし合わせて、関連知識や根拠を確認する")

    deduped = []
    seen = set()
    for item in key_points:
        normalized = normalize_text(item)
        if normalized and normalized not in seen:
            deduped.append(normalized)
            seen.add(normalized)
    return deduped[:3]


def build_detail(entry, theme_id, summary):
    return {
        "overview": build_detail_overview(entry, theme_id, summary),
        "keyPoints": build_detail_key_points(entry, theme_id),
        "chapters": [],
        "materials": [],
    }


def load_existing_site_data(output_path):
    if not output_path.exists():
        return {"themes": [], "archives": []}

    prefix = "window.STUDY_ARCHIVE_DATA = "

    try:
        text = output_path.read_text(encoding="utf-8").strip()
        if not text.startswith(prefix):
            return {"themes": [], "archives": []}
        return json.loads(text[len(prefix):].rstrip(";\n"))
    except (OSError, json.JSONDecodeError):
        return {"themes": [], "archives": []}


def archive_id(date, title):
    seed = f"{date}|{title}".encode("utf-8")
    digest = hashlib.sha1(seed).hexdigest()[:10]
    return f"archive-{date.replace('-', '')}-{digest}"


def build_archives(entries, existing_archives=None):
    existing_archives = existing_archives or []
    existing_by_id = {
        archive.get("id"): archive
        for archive in existing_archives
        if archive.get("id")
    }
    archives = []
    imported_ids = set()

    for entry in entries:
        theme_id = classify_theme(entry["title"])
        archive_key = archive_id(entry["date"], entry["title"])
        existing = existing_by_id.get(archive_key, {})
        start, end = THEME_COLORS[theme_id]
        summary = normalize_text(existing.get("summary")) or build_summary(entry["title"], theme_id)
        existing_links = existing.get("links", {})
        existing_assets = existing.get("assets", {})
        existing_detail = existing.get("detail", {})
        existing_thumbnail = existing.get("thumbnail", {})
        overview = normalize_multiline_text(existing_detail.get("overview")) or build_detail_overview(entry, theme_id, summary)
        key_points = [
            normalize_text(item)
            for item in existing_detail.get("keyPoints", [])
            if normalize_text(item)
        ] or build_detail_key_points(entry, theme_id)
        thumbnail = {
            "start": start,
            "end": end,
        }
        thumbnail_image = normalize_link(existing_thumbnail.get("image")) or normalize_link(existing_thumbnail.get("imageUrl"))
        if thumbnail_image:
            thumbnail["image"] = thumbnail_image

        archives.append(
            {
                "id": archive_key,
                "themeId": theme_id,
                "title": entry["title"],
                "summary": summary,
                "speaker": entry["speaker"],
                "date": entry["date"],
                "updatedAt": normalize_text(existing.get("updatedAt")) or entry["date"],
                "duration": normalize_text(existing.get("duration")) or "未記載",
                "featured": bool(existing.get("featured")),
                "assets": {
                    "recording": bool(entry["recording"] or existing_links.get("recording")),
                    "slides": bool(existing_assets.get("slides")),
                    "notes": bool(existing_assets.get("notes")),
                    "references": bool(entry["references"] or existing_links.get("references")),
                },
                "links": {
                    "recording": entry["recording"] or normalize_link(existing_links.get("recording")),
                    "slides": normalize_link(existing_links.get("slides")),
                    "notes": normalize_link(existing_links.get("notes")),
                    "references": entry["references"] or normalize_link(existing_links.get("references")),
                },
                "thumbnail": thumbnail,
                "detail": {
                    **existing_detail,
                    "overview": overview,
                    "keyPoints": key_points,
                    "chapters": [
                        {
                            "time": normalize_text(item.get("time")),
                            "label": normalize_text(item.get("label")),
                        }
                        for item in existing_detail.get("chapters", [])
                        if normalize_text(item.get("label"))
                    ],
                    "materials": [
                        {
                            "label": normalize_text(item.get("label")),
                            "url": normalize_text(item.get("url")),
                        }
                        for item in existing_detail.get("materials", [])
                        if normalize_text(item.get("label")) and normalize_text(item.get("url"))
                    ],
                },
            }
        )
        imported_ids.add(archive_key)

    for archive in existing_archives:
        if archive.get("id") not in imported_ids:
            archives.append(archive)

    archives.sort(key=lambda archive: archive.get("date", ""), reverse=True)

    featured_per_theme = {}
    for archive in archives:
        if archive.get("featured") and archive.get("themeId") not in featured_per_theme:
            featured_per_theme[archive["themeId"]] = archive["id"]

    latest_per_theme = {}
    for archive in archives:
        current = latest_per_theme.get(archive["themeId"])
        if current is None or archive["date"] > current["date"]:
            latest_per_theme[archive["themeId"]] = archive

    for archive in archives:
        chosen_id = featured_per_theme.get(archive["themeId"]) or latest_per_theme[archive["themeId"]]["id"]
        archive["featured"] = archive["id"] == chosen_id

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

    existing_data = load_existing_site_data(output_path)
    entries = read_archive_entries(source_path, args.sheet)
    archives = build_archives(entries, existing_data.get("archives", []))
    write_site_data(output_path, THEMES, archives)

    print(f"Imported {len(archives)} archives from {source_path} -> {output_path}")


if __name__ == "__main__":
    main()
