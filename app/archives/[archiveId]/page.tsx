import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowSquareOutIcon,
  BookOpenIcon,
  NotePencilIcon,
  PresentationChartIcon,
  StarIcon,
  VideoCameraIcon
} from "@phosphor-icons/react/dist/ssr";
import {
  findArchiveById,
  findQuizForArchive,
  loadLearningContent,
  loadSiteContent
} from "../../site-data";
import { siteLegal } from "../../site-legal";
import { absoluteSiteUrl } from "../../site-url";
import { Badge } from "../../ui/badge";
import { themeCatOf } from "../../lib/theme-category";
import ArchiveQuizSection from "./archive-quiz-section";
import { CourseContextStrip, LessonProgressPanel, type CourseView } from "./lesson-context";
import styles from "./archive-detail.module.css";

type ArchiveDetailPageProps = {
  params: Promise<{ archiveId: string }>;
};

const assetLinkDefs = [
  { key: "recording", label: "録画を見る", Icon: VideoCameraIcon },
  { key: "slides", label: "スライドを開く", Icon: PresentationChartIcon },
  { key: "notes", label: "要点メモ", Icon: NotePencilIcon },
  { key: "references", label: "参考文献", Icon: BookOpenIcon }
] as const;

export async function generateStaticParams() {
  const siteContent = await loadSiteContent();
  return siteContent.archives.map((archive) => ({ archiveId: archive.id }));
}

export async function generateMetadata({ params }: ArchiveDetailPageProps): Promise<Metadata> {
  const { archiveId } = await params;
  const archive = await findArchiveById(archiveId);

  if (!archive) {
    return {
      title: `アーカイブが見つかりません | ${siteLegal.shortSiteName}`
    };
  }

  const canonicalUrl = absoluteSiteUrl(`/archives/${encodeURIComponent(archive.id)}`);

  return {
    title: `${archive.title} | ${siteLegal.shortSiteName}`,
    description: archive.summary,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  const { archiveId } = await params;
  const [archive, quiz, learningContent, siteContent] = await Promise.all([
    findArchiveById(archiveId),
    findQuizForArchive(archiveId),
    loadLearningContent(),
    loadSiteContent()
  ]);

  if (!archive) {
    notFound();
  }

  const themeName = siteContent.themes.find((theme) => theme.id === archive.themeId)?.name ?? archive.themeId;
  const archiveById = new Map(siteContent.archives.map((entry) => [entry.id, entry]));

  // このアーカイブを含むコースだけをクライアントへ渡し、?courseId= の解決はクライアント側で行う。
  const coursesForArchive: CourseView[] = learningContent.courses
    .filter((course) => course.lessons.some((lesson) => lesson.archiveId === archive.id))
    .map((course) => ({
      id: course.id,
      title: course.title,
      lessons: [...course.lessons]
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          archiveId: lesson.archiveId,
          order: lesson.order,
          optional: lesson.optional ?? false,
          title: lesson.labelOverride ?? archiveById.get(lesson.archiveId)?.title ?? "この回",
          available: archiveById.has(lesson.archiveId)
        }))
    }));

  const assetLinks = assetLinkDefs.flatMap(({ key, label, Icon }) => {
    const url = archive.links?.[key]?.trim();
    if (!archive.assets?.[key] || !url) {
      return [];
    }
    return [{ key, label, Icon, url }];
  });

  const duration = archive.duration && archive.duration !== "未記載" ? archive.duration : "";
  const overviewParagraphs =
    archive.detail?.overview
      ?.split("\n")
      .map((paragraph) => paragraph.trim())
      .filter(Boolean) ?? [];
  const keyPoints = archive.detail?.keyPoints?.filter(Boolean) ?? [];
  const chapters = archive.detail?.chapters?.filter((chapter) => chapter.label) ?? [];
  const materials = archive.detail?.materials?.filter((material) => material.label) ?? [];

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="パンくず">
        <Link href="/archives">アーカイブ</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{archive.title}</span>
      </nav>

      <Suspense fallback={null}>
        <CourseContextStrip archiveId={archive.id} courses={coursesForArchive} />
      </Suspense>

      <header className={styles.hero}>
        <p className={styles.heroBadges}>
          <Badge variant="theme" cat={themeCatOf(archive.themeId)}>
            {themeName}
          </Badge>
          {archive.featured ? (
            <span className={styles.featured}>
              <StarIcon weight="fill" aria-hidden="true" />
              注目
            </span>
          ) : null}
        </p>
        <h1 className={styles.heroTitle}>{archive.title}</h1>
        <p className={styles.heroMeta}>
          {archive.date ? <span className="tabular-nums">{archive.date}</span> : null}
          {archive.speaker ? <span>講師: {archive.speaker}</span> : null}
          {duration ? <span>{duration}</span> : null}
        </p>
        <p className={styles.heroSummary}>{archive.summary}</p>
      </header>

      <section className={styles.section} aria-labelledby="archive-assets-heading">
        <h2 id="archive-assets-heading" className={styles.sectionTitle}>
          資料リンク
        </h2>
        {assetLinks.length > 0 ? (
          <ul className={styles.assetList}>
            {assetLinks.map(({ key, label, Icon, url }, index) => (
              <li key={key}>
                <a
                  className={index === 0 ? `${styles.assetLink} ${styles.assetLinkPrimary}` : styles.assetLink}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon aria-hidden="true" />
                  {label}
                  <ArrowSquareOutIcon className={styles.assetExternal} aria-hidden="true" />
                  <span className="visually-hidden">（外部リンク・新しいタブで開く）</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.sectionEmpty}>この回の資料リンクは準備中です。</p>
        )}
      </section>

      {overviewParagraphs.length > 0 ? (
        <section className={styles.section} aria-labelledby="archive-overview-heading">
          <h2 id="archive-overview-heading" className={styles.sectionTitle}>
            概要
          </h2>
          <div className={styles.overview}>
            {overviewParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {keyPoints.length > 0 ? (
        <section className={styles.section} aria-labelledby="archive-keypoints-heading">
          <h2 id="archive-keypoints-heading" className={styles.sectionTitle}>
            学習ポイント
          </h2>
          <ul className={styles.keyPointList}>
            {keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {chapters.length > 0 ? (
        <section className={styles.section} aria-labelledby="archive-chapters-heading">
          <h2 id="archive-chapters-heading" className={styles.sectionTitle}>
            目次
          </h2>
          <ol className={styles.chapterList}>
            {chapters.map((chapter, index) => (
              <li key={index}>
                <span className={styles.chapterLabel}>{chapter.label}</span>
                {chapter.time ? <span className={`${styles.chapterTime} tabular-nums`}>{chapter.time}</span> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {materials.length > 0 ? (
        <section className={styles.section} aria-labelledby="archive-materials-heading">
          <h2 id="archive-materials-heading" className={styles.sectionTitle}>
            関連資料
          </h2>
          <ul className={styles.materialList}>
            {materials.map((material, index) => (
              <li key={index}>
                {material.url ? (
                  <a
                    className={styles.materialLink}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {material.label}
                    <ArrowSquareOutIcon className={styles.assetExternal} aria-hidden="true" />
                    <span className="visually-hidden">（外部リンク・新しいタブで開く）</span>
                  </a>
                ) : (
                  <span>{material.label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {quiz ? <ArchiveQuizSection archiveId={archive.id} quiz={quiz} /> : null}

      <Suspense fallback={null}>
        <LessonProgressPanel archiveId={archive.id} courses={coursesForArchive} />
      </Suspense>

      <p className={styles.disclaimer} role="note">
        教育用コンテンツです。個別診療の代替ではなく、症例情報は匿名化前提で扱う方針です。
      </p>
    </div>
  );
}
