import type { Metadata } from "next";
import Link from "next/link";
import { absoluteSiteUrl } from "../site-url";
import { siteLegal } from "../site-legal";
import { loadLearningContent, loadSiteContent } from "../site-data";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { SectionHeader } from "../ui/section-header";
import { CourseProgressRing } from "./course-progress";
import { themeCatOf } from "../lib/theme-category";
import styles from "./courses.module.css";

const pageTitle = `コース一覧 | ${siteLegal.shortSiteName}`;
const pageDescription = "テーマに沿って順番に学べるコース一覧です。";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = absoluteSiteUrl("/courses");

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

export default async function CoursesPage() {
  const [learningContent, siteContent] = await Promise.all([loadLearningContent(), loadSiteContent()]);

  const themeNameById = new Map(siteContent.themes.map((theme) => [theme.id, theme.name]));
  const themeCatById = new Map(siteContent.themes.map((theme) => [theme.id, themeCatOf(theme.id)]));

  const courses = [...learningContent.courses]
    .sort((a, b) => a.order - b.order)
    .map((course) => ({
      id: course.id,
      title: course.title,
      summary: course.summary,
      level: course.level,
      themeName: themeNameById.get(course.themeId) ?? course.themeId,
      themeCat: themeCatById.get(course.themeId),
      lessonCount: course.lessons.length,
      // 分母は必修レッスンのみ（optional=true を除外）。現行の import/build ロジックと同じ定義を踏襲。
      archiveIds: course.lessons.filter((lesson) => !lesson.optional).map((lesson) => lesson.archiveId)
    }));

  return (
    <>
      <div className={styles.head}>
        <SectionHeader
          title="コース一覧"
          description="テーマごとに順番立てて学べるコースです。気になるコースから始めてみましょう。"
        />
      </div>

      {courses.length > 0 ? (
        <ul className={styles.grid}>
          {courses.map((course) => (
            <li key={course.id}>
              <Card className={styles.card}>
                <div className={styles.cardHead}>
                  <Badge variant={course.themeCat ? "theme" : "neutral"} cat={course.themeCat}>
                    {course.themeName}
                  </Badge>
                  {course.level ? <Badge>{course.level}</Badge> : null}
                </div>
                <h2 className={styles.title}>
                  <Link href={`/courses/${encodeURIComponent(course.id)}`}>{course.title}</Link>
                </h2>
                <p className={styles.summary}>{course.summary}</p>
                <div className={styles.foot}>
                  <CourseProgressRing courseArchiveIds={course.archiveIds} />
                  <span className={styles.lessonCount}>全{course.lessonCount}回</span>
                </div>
                <Button href={`/courses/${encodeURIComponent(course.id)}`} variant="secondary" size="sm" className={styles.link}>
                  コースを見る
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyWrap}>
          <EmptyState
            title="まだコースがありません"
            description="コースが公開されると、ここに一覧が表示されるようになります。"
            action={
              <Button href="/archives" variant="primary">
                アーカイブ一覧を見る
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}
