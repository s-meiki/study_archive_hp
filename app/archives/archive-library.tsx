"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpenIcon,
  CalendarBlankIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  NotePencilIcon,
  PresentationChartIcon,
  QuestionIcon,
  StarIcon,
  VideoCameraIcon
} from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import type { SiteTheme } from "../site-data";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { themeCatOf } from "../lib/theme-category";
import styles from "./archive-library.module.css";

export type ArchiveListItem = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  speaker: string;
  date: string;
  featured: boolean;
  assets: {
    recording: boolean;
    slides: boolean;
    notes: boolean;
    references: boolean;
  };
  quizQuestionCount: number;
  searchText: string;
};

type ArchiveLibraryProps = {
  items: ArchiveListItem[];
  themes: SiteTheme[];
};

type AssetFilter = "all" | "recording" | "slides" | "notes" | "references";

const assetChips = [
  { key: "recording", label: "録画", Icon: VideoCameraIcon },
  { key: "slides", label: "スライド", Icon: PresentationChartIcon },
  { key: "notes", label: "要点メモ", Icon: NotePencilIcon },
  { key: "references", label: "参考文献", Icon: BookOpenIcon }
] as const;

function formatDate(value: string) {
  return value || "日付未記載";
}

export default function ArchiveLibrary({ items, themes }: ArchiveLibraryProps) {
  const { state } = useProgress();
  const [search, setSearch] = useState("");
  const [themeId, setThemeId] = useState("");
  const [asset, setAsset] = useState<AssetFilter>("all");
  const [year, setYear] = useState("all");

  const themeById = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), [themes]);
  const yearOptions = useMemo(
    () => [...new Set(items.map((item) => item.date.slice(0, 4)).filter(Boolean))].sort().reverse(),
    [items]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesTheme = !themeId || item.themeId === themeId;
      const matchesYear = year === "all" || item.date.startsWith(year);
      const matchesAsset = asset === "all" || item.assets[asset];
      const matchesSearch = !normalizedSearch || item.searchText.includes(normalizedSearch);
      return matchesTheme && matchesYear && matchesAsset && matchesSearch;
    });
  }, [items, asset, search, themeId, year]);

  function resetFilters() {
    setSearch("");
    setThemeId("");
    setAsset("all");
    setYear("all");
  }

  return (
    <section className={styles.library} aria-label="アーカイブライブラリ">
      <div className={styles.themeFilter} role="group" aria-label="テーマで絞り込む">
        <button
          type="button"
          className={!themeId ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
          aria-pressed={!themeId}
          onClick={() => setThemeId("")}
        >
          すべて
          <span className={`${styles.themeCount} tabular-nums`}>{items.length}</span>
        </button>
        {themes.map((theme) => {
          const count = items.filter((item) => item.themeId === theme.id).length;
          const active = themeId === theme.id;
          return (
            <button
              type="button"
              key={theme.id}
              className={active ? `${styles.themeChip} ${styles.themeChipActive}` : styles.themeChip}
              aria-pressed={active}
              onClick={() => setThemeId(theme.id)}
            >
              {theme.name}
              <span className={`${styles.themeCount} tabular-nums`}>{count}</span>
            </button>
          );
        })}
      </div>

      <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
        <label className={styles.searchField}>
          <MagnifyingGlassIcon aria-hidden="true" />
          <span className="visually-hidden">キーワード検索</span>
          <input
            type="search"
            value={search}
            placeholder="キーワードで検索"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className={styles.selectField}>
          <FunnelIcon aria-hidden="true" />
          <span className="visually-hidden">資料種別</span>
          <select value={asset} onChange={(event) => setAsset(event.target.value as AssetFilter)}>
            <option value="all">資料種別</option>
            <option value="recording">録画あり</option>
            <option value="slides">スライドあり</option>
            <option value="notes">要点メモあり</option>
            <option value="references">参考文献あり</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <CalendarBlankIcon aria-hidden="true" />
          <span className="visually-hidden">年度</span>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            <option value="all">年度</option>
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" onClick={resetFilters}>
          リセット
        </Button>
      </form>

      <p className={styles.summary} aria-live="polite">
        <strong className="tabular-nums">{filtered.length}件</strong>
        <span>{themeId ? themeById.get(themeId)?.name ?? themeId : "全テーマ"}</span>
      </p>

      {filtered.length === 0 ? (
        <div className={styles.emptyWrap} role="status">
          <EmptyState
            icon={<MagnifyingGlassIcon aria-hidden="true" />}
            title="該当するアーカイブがありません"
            description="条件を減らすか、別のテーマを選んでください。"
            action={
              <Button variant="secondary" onClick={resetFilters}>
                条件をリセット
              </Button>
            }
          />
        </div>
      ) : (
        <ul className={styles.grid}>
          {filtered.map((item) => {
            const lessonStatus = state.lessons[item.id]?.status;
            return (
              <li key={item.id}>
                <Card className={styles.card}>
                  <div className={styles.cardTop}>
                    <Badge variant="theme" cat={themeCatOf(item.themeId)}>
                      {themeById.get(item.themeId)?.name ?? item.themeId}
                    </Badge>
                    {item.featured ? (
                      <span className={styles.featured}>
                        <StarIcon weight="fill" aria-hidden="true" />
                        注目
                      </span>
                    ) : null}
                  </div>
                  <h2 className={styles.cardTitle}>
                    <Link className={styles.cardLink} href={`/archives/${encodeURIComponent(item.id)}`}>
                      {item.title}
                    </Link>
                  </h2>
                  <p className={styles.cardMeta}>
                    <span className="tabular-nums">{formatDate(item.date)}</span>
                    {item.speaker ? <span>講師: {item.speaker}</span> : null}
                  </p>
                  <p className={styles.cardSummary}>{item.summary}</p>
                  <div className={styles.cardFoot}>
                    <span className={styles.assetChips}>
                      {assetChips.map(({ key, label, Icon }) =>
                        item.assets[key] ? (
                          <span key={key} className={styles.assetChip}>
                            <Icon aria-hidden="true" />
                            {label}
                          </span>
                        ) : null
                      )}
                      {item.quizQuestionCount > 0 ? (
                        <span className={`${styles.assetChip} tabular-nums`}>
                          <QuestionIcon aria-hidden="true" />
                          クイズ{item.quizQuestionCount}問
                        </span>
                      ) : null}
                    </span>
                    {lessonStatus === "completed" ? (
                      <Badge variant="status" status="success">
                        修了
                      </Badge>
                    ) : lessonStatus === "watched" ? (
                      <Badge>視聴済み</Badge>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
