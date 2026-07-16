import type { Metadata } from "next";
import { loadQuizBank, loadSiteContent } from "../site-data";
import { siteLegal } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import ArchiveLibrary, { type ArchiveListItem } from "./archive-library";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = absoluteSiteUrl("/archives");
  const title = `勉強会アーカイブ | ${siteLegal.shortSiteName}`;
  const description = "勉強会アーカイブの一覧です。テーマ・年度・資料の種類で絞り込み、必要な回を探せます。";

  return {
    title,
    description,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function ArchivesPage() {
  const [siteContent, quizBank] = await Promise.all([loadSiteContent(), loadQuizBank()]);

  const quizCountByArchive = new Map(quizBank.quizzes.map((quiz) => [quiz.archiveId, quiz.questions.length]));
  const totalQuestions = quizBank.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);

  const items: ArchiveListItem[] = [...siteContent.archives]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .map((archive) => ({
      id: archive.id,
      themeId: archive.themeId,
      title: archive.title,
      summary: archive.summary,
      speaker: archive.speaker ?? "",
      date: archive.date ?? "",
      featured: archive.featured ?? false,
      assets: {
        recording: archive.assets?.recording ?? false,
        slides: archive.assets?.slides ?? false,
        notes: archive.assets?.notes ?? false,
        references: archive.assets?.references ?? false
      },
      quizQuestionCount: quizCountByArchive.get(archive.id) ?? 0,
      searchText: [
        archive.title,
        archive.summary,
        archive.detail?.overview ?? "",
        archive.speaker ?? "",
        ...(archive.detail?.keyPoints ?? [])
      ]
        .join(" ")
        .toLowerCase()
    }));

  return (
    <>
      <div className={styles.head}>
        <div>
          <h1>アーカイブライブラリ</h1>
          <p className={`${styles.totals} tabular-nums`}>
            全{items.length}回 ・ 確認クイズ{totalQuestions}問
          </p>
        </div>
      </div>
      <ArchiveLibrary items={items} themes={siteContent.themes} />
    </>
  );
}
