import type { Metadata } from "next";
import { siteLegal } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { loadLearningContent, loadSiteContent } from "../site-data";
import { SectionHeader } from "../ui/section-header";
import { themeCatOf } from "../lib/theme-category";
import type { CourseBadgeSource } from "../learning/badge-engine";
import DashboardBody from "./dashboard-body";
import styles from "./dashboard.module.css";

const pageTitle = `学習ダッシュボード | ${siteLegal.shortSiteName}`;
const pageDescription = "連続学習日数やレッスン完了状況、獲得バッジなど、これまでの学習をまとめて確認できるダッシュボードです。";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = absoluteSiteUrl("/dashboard");

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function DashboardPage() {
  const [siteContent, learningContent] = await Promise.all([loadSiteContent(), loadLearningContent()]);
  const archiveById = new Map(siteContent.archives.map((archive) => [archive.id, archive]));

  const themes = siteContent.themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    cat: themeCatOf(theme.id)
  }));

  const archives = siteContent.archives.map((archive) => ({
    id: archive.id,
    themeId: archive.themeId,
    title: archive.title,
    date: archive.date
  }));

  const courses = [...learningContent.courses]
    .sort((a, b) => a.order - b.order)
    .map((course) => {
      return {
        id: course.id,
        title: course.title,
        level: course.level,
        themeName: siteContent.themes.find((theme) => theme.id === course.themeId)?.name ?? course.themeId,
        themeCat: themeCatOf(course.themeId),
        // 分母は必修レッスンのみ（optional=true を除外）。現行の import/build ロジックと同じ定義を踏襲。
        requiredArchiveIds: course.lessons
          .filter((lesson) => !lesson.optional && archiveById.has(lesson.archiveId))
          .map((lesson) => lesson.archiveId)
      };
    });

  const badgeSources: CourseBadgeSource[] = courses.map((course) => ({
    courseId: course.id,
    title: course.title,
    requiredArchiveIds: course.requiredArchiveIds
  }));

  return (
    <>
      <div className={styles.head}>
        <SectionHeader
          title="学習ダッシュボード"
          description="連続学習日数やレッスン完了状況、獲得バッジなど、これまでの学習をまとめて確認できます。"
        />
      </div>

      <div className={styles.body}>
        <DashboardBody themes={themes} archives={archives} courses={courses} badgeSources={badgeSources} />
      </div>
    </>
  );
}
