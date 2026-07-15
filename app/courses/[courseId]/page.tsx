import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteLegal } from "../../site-legal";
import { absoluteSiteUrl } from "../../site-url";
import { loadLearningContent, loadSiteContent } from "../../site-data";
import { Badge } from "../../ui/badge";
import { Card, CardHeader } from "../../ui/card";
import { CourseContinueSection, CourseProgressSummary, LessonStatusBadge } from "../course-progress";
import { themeCatOf } from "../../lib/theme-category";
import styles from "./course-detail.module.css";

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

function archiveHref(archiveId: string, courseId: string) {
  return `/archives/${encodeURIComponent(archiveId)}?courseId=${encodeURIComponent(courseId)}`;
}

async function getCourse(courseId: string) {
  const learningContent = await loadLearningContent();
  return learningContent.courses.find((course) => course.id === courseId) ?? null;
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourse(courseId);

  if (!course) {
    return {
      title: `コースが見つかりません | ${siteLegal.shortSiteName}`
    };
  }

  const canonicalUrl = absoluteSiteUrl(`/courses/${encodeURIComponent(course.id)}`);

  return {
    title: `${course.title} | ${siteLegal.shortSiteName}`,
    description: course.summary,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl
        }
      : undefined
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const [course, siteContent] = await Promise.all([getCourse(courseId), loadSiteContent()]);

  if (!course) {
    notFound();
  }

  const archiveById = new Map(siteContent.archives.map((archive) => [archive.id, archive]));
  const themeName = siteContent.themes.find((theme) => theme.id === course.themeId)?.name ?? course.themeId;
  const themeCat = themeCatOf(course.themeId);

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);

  const lessonViews = sortedLessons.map((lesson) => {
    const archive = archiveById.get(lesson.archiveId);
    return {
      archiveId: lesson.archiveId,
      order: lesson.order,
      optional: lesson.optional ?? false,
      title: lesson.labelOverride ?? archive?.title ?? "この回",
      date: archive?.date,
      available: Boolean(archive)
    };
  });

  // 分母は必修レッスンのみ（optional=true は分母から除外する現行規約を踏襲）。
  const requiredArchiveIds = lessonViews
    .filter((lesson) => !lesson.optional && lesson.available)
    .map((lesson) => lesson.archiveId);

  return (
    <>
      <div className={styles.head}>
        <p className={styles.eyebrow}>{themeName}</p>
        <h1 className={styles.title}>{course.title}</h1>
        <p className={styles.summary}>{course.summary}</p>
        <div className={styles.meta}>
          <Badge variant={themeCat ? "theme" : "neutral"} cat={themeCat}>
            {themeName}
          </Badge>
          {course.level ? <Badge>{course.level}</Badge> : null}
          <span className={styles.lessonCount}>全{course.lessons.length}回</span>
        </div>
      </div>

      <div className={styles.stack}>
        <CourseContinueSection courseId={course.id} lessons={lessonViews} />

        <Card>
          <CardHeader title="コース全体の進捗" />
          <CourseProgressSummary courseArchiveIds={requiredArchiveIds} />
        </Card>

        <Card>
          <CardHeader title="レッスン一覧" />
          <ol className={styles.lessonList}>
            {lessonViews.map((lesson) => (
              <li className={styles.lessonRow} key={lesson.archiveId}>
                <span className={styles.lessonOrder}>{lesson.order}</span>
                <div className={styles.lessonBody}>
                  {lesson.available ? (
                    <Link className={styles.lessonTitle} href={archiveHref(lesson.archiveId, course.id)}>
                      {lesson.title}
                    </Link>
                  ) : (
                    <span className={`${styles.lessonTitle} ${styles.lessonTitleUnavailable}`}>{lesson.title}</span>
                  )}
                  <div className={styles.lessonMeta}>
                    {lesson.date ? <span>{lesson.date}</span> : null}
                    {/* optional は分母外であることが分かるよう「補足」と明示表記する */}
                    {lesson.optional ? <Badge>補足（進捗の対象外）</Badge> : null}
                    {!lesson.available ? <span>この回は現在利用できません</span> : null}
                  </div>
                </div>
                {lesson.available ? (
                  <span className={styles.lessonStatus}>
                    <LessonStatusBadge archiveId={lesson.archiveId} />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
