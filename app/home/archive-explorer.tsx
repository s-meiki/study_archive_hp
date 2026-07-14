"use client";

import { useMemo, useState } from "react";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  FunnelIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon
} from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import type { HomeArchive, HomeTheme } from "./home-types";

type ArchiveExplorerProps = {
  archives: HomeArchive[];
  themes: HomeTheme[];
};

type ExplorerView = "list" | "calendar";
type AssetFilter = "all" | "recording" | "slides" | "notes" | "references";

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function archiveHref(archiveId: string) {
  return `/archive?id=${encodeURIComponent(archiveId)}`;
}
function formatDate(value: string) {
  if (!value) return "日付未記載";
  return value.replaceAll("-", ".");
}

function monthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

function calendarCells(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const cursor = new Date(year, month - 1, 1 - first.getDay());

  return Array.from({ length: 42 }, () => {
    const date = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
    return { date, key, outside: date.getMonth() !== month - 1 };
  });
}

function statusLabel(status: string | undefined) {
  if (status === "completed") return "修了";
  if (status === "watched") return "視聴済み";
  return "未視聴";
}

export default function ArchiveExplorer({ archives, themes }: ArchiveExplorerProps) {
  const { state } = useProgress();
  const [view, setView] = useState<ExplorerView>("list");
  const [search, setSearch] = useState("");
  const [themeId, setThemeId] = useState("");
  const [asset, setAsset] = useState<AssetFilter>("all");
  const [year, setYear] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const themeById = useMemo(() => new Map(themes.map((theme) => [theme.id, theme])), [themes]);
  const yearOptions = useMemo(
    () => [...new Set(archives.map((archive) => archive.date.slice(0, 4)).filter(Boolean))].sort().reverse(),
    [archives]
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...archives]
      .filter((archive) => {
        const matchesTheme = !themeId || archive.themeId === themeId;
        const matchesYear = year === "all" || archive.date.startsWith(year);
        const matchesAsset = asset === "all" || archive.assets[asset];
        const haystack = [
          archive.title,
          archive.summary,
          archive.overview,
          archive.speaker,
          ...archive.keyPoints
        ]
          .join(" ")
          .toLowerCase();
        const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);
        return matchesTheme && matchesYear && matchesAsset && matchesSearch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [archives, asset, search, themeId, year]);

  const monthKeys = useMemo(
    () => [...new Set(filtered.map((archive) => archive.date.slice(0, 7)).filter(Boolean))].sort(),
    [filtered]
  );
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeys.at(-1) ?? "");
  const activeMonth = monthKeys.includes(calendarMonth) ? calendarMonth : monthKeys.at(-1) ?? "";
  const activeMonthIndex = monthKeys.indexOf(activeMonth);
  const monthArchiveMap = useMemo(() => {
    const map = new Map<string, HomeArchive[]>();
    for (const archive of filtered) {
      const list = map.get(archive.date) ?? [];
      list.push(archive);
      map.set(archive.date, list);
    }
    return map;
  }, [filtered]);

  function resetFilters() {
    setSearch("");
    setThemeId("");
    setAsset("all");
    setYear("all");
    setShowAll(false);
  }

  const visibleArchives = showAll ? filtered : filtered.slice(0, 8);

  return (
    <section className="home-explorer" id="archive-explorer" aria-labelledby="home-explorer-heading">
      <div className="home-section-heading home-explorer-heading">
        <div>
          <p className="home-section-label">Archive Library</p>
          <h2 id="home-explorer-heading">必要な回を探す</h2>
          <p>復習したいテーマや資料の種類から、全アーカイブを絞り込めます。</p>
        </div>
        <div className="home-view-tabs" role="tablist" aria-label="アーカイブ表示切り替え">
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            className={view === "list" ? "is-active" : ""}
            onClick={() => setView("list")}
          >
            <ListBulletsIcon aria-hidden="true" />
            一覧
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "calendar"}
            className={view === "calendar" ? "is-active" : ""}
            onClick={() => setView("calendar")}
          >
            <CalendarBlankIcon aria-hidden="true" />
            カレンダー
          </button>
        </div>
      </div>

      <div className="home-theme-filter" aria-label="テーマで絞り込む">
        <button type="button" className={!themeId ? "is-active" : ""} onClick={() => setThemeId("")}>
          すべて
          <span>{archives.length}</span>
        </button>
        {themes.map((theme) => {
          const count = archives.filter((archive) => archive.themeId === theme.id).length;
          return (
            <button
              type="button"
              key={theme.id}
              className={themeId === theme.id ? "is-active" : ""}
              onClick={() => setThemeId(theme.id)}
            >
              {theme.name}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <form className="home-explorer-controls" onSubmit={(event) => event.preventDefault()}>
        <label className="home-search-field">
          <MagnifyingGlassIcon aria-hidden="true" />
          <span className="visually-hidden">キーワード検索</span>
          <input
            type="search"
            value={search}
            placeholder="キーワードで検索"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="home-select-field">
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
        <label className="home-select-field">
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
        <button type="button" className="home-reset-button" onClick={resetFilters}>
          リセット
        </button>
      </form>

      <div className="home-explorer-summary" aria-live="polite">
        <strong>{filtered.length}件</strong>
        <span>{themeId ? themeById.get(themeId)?.name : "全テーマ"}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="home-explorer-empty" role="status">
          <h3>該当するアーカイブがありません</h3>
          <p>条件を減らすか、別のテーマを選んでください。</p>
          <button type="button" onClick={resetFilters}>
            条件をリセット
          </button>
        </div>
      ) : view === "list" ? (
        <>
          <div className="home-archive-list">
            {visibleArchives.map((archive) => {
              const lessonStatus = state.lessons[archive.id]?.status;
              return (
                <article className="home-archive-row" key={archive.id}>
                  <div className="home-archive-date">
                    <span>{formatDate(archive.date)}</span>
                    <span>{themeById.get(archive.themeId)?.name ?? archive.themeId}</span>
                  </div>
                  <div className="home-archive-copy">
                    <h3>
                      <a href={archiveHref(archive.id)}>{archive.title}</a>
                    </h3>
                    <p>{archive.summary}</p>
                    <div className="home-archive-assets">
                      {archive.assets.recording ? <span>録画</span> : null}
                      {archive.assets.slides ? <span>スライド</span> : null}
                      {archive.assets.notes ? <span>要点メモ</span> : null}
                      {archive.assets.references ? <span>参考文献</span> : null}
                      {archive.quiz ? <span>クイズ {archive.quiz.questionCount}問</span> : null}
                    </div>
                  </div>
                  <div className="home-archive-action">
                    <span className={`home-status-text is-${lessonStatus ?? "unwatched"}`}>
                      {statusLabel(lessonStatus)}
                    </span>
                    <a href={archiveHref(archive.id)} aria-label={`${archive.title}を見る`}>
                      <CaretRightIcon aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          {filtered.length > 8 ? (
            <button type="button" className="home-show-all" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "表示を戻す" : `残り${filtered.length - 8}件を表示`}
            </button>
          ) : null}
        </>
      ) : activeMonth ? (
        <div className="home-calendar">
          <div className="home-calendar-nav">
            <button
              type="button"
              disabled={activeMonthIndex <= 0}
              onClick={() => setCalendarMonth(monthKeys[activeMonthIndex - 1] ?? activeMonth)}
              aria-label="前の月"
            >
              <CaretLeftIcon aria-hidden="true" />
            </button>
            <strong>{monthLabel(activeMonth)}</strong>
            <button
              type="button"
              disabled={activeMonthIndex >= monthKeys.length - 1}
              onClick={() => setCalendarMonth(monthKeys[activeMonthIndex + 1] ?? activeMonth)}
              aria-label="次の月"
            >
              <CaretRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="home-calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="home-calendar-grid">
            {calendarCells(activeMonth).map((cell) => {
              const dayArchives = monthArchiveMap.get(cell.key) ?? [];
              return (
                <div className={`home-calendar-day${cell.outside ? " is-outside" : ""}`} key={cell.key}>
                  <span className="home-calendar-day-number">{cell.date.getDate()}</span>
                  {dayArchives.slice(0, 2).map((archive) => (
                    <a key={archive.id} href={archiveHref(archive.id)} title={archive.title}>
                      {archive.title}
                    </a>
                  ))}
                  {dayArchives.length > 2 ? <span className="home-calendar-more">+{dayArchives.length - 2}</span> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
