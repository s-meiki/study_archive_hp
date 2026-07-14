import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../site-footer";
import { siteLegal, siteNavigation } from "../../site-legal";
import { absoluteSiteUrl } from "../../site-url";
import { loadLearningContent, loadSiteContent } from "../../site-data";
import CourseAwareContinueCard from "../../archive/course-aware-continue-card";
import { CourseProgressSummary, LessonStatusBadge } from "../course-progress";

type CourseDetailPageProps = {
  params: Promise<{ courseId: string }>;
};

function archiveHref(archiveId: string, courseId: string) {
  return `/archive?id=${encodeURIComponent(archiveId)}&courseId=${encodeURIComponent(courseId)}`;
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

  const requiredArchiveIds = lessonViews.filter((lesson) => !lesson.optional && lesson.available).map((lesson) => lesson.archiveId);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <div className="brand-copy">
            <span className="brand-label">Clinical Academic Working Group</span>
            <span className="brand-name">{siteLegal.shortSiteName}</span>
          </div>
        </div>
        <div className="topbar-actions">
          <a className="topbar-link" href="/courses">
            コース一覧へ
          </a>
          <a className="topbar-link" href={siteNavigation.archiveUrl}>
            アーカイブ一覧へ
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <div className="learn-course-detail">
          <section className="panel learn-header">
            <div className="section-kicker">{themeName}</div>
            <h1>{course.title}</h1>
            <p className="learn-header-copy">{course.summary}</p>
            <div className="learn-course-detail-meta">
              {course.level ? <span className="learn-course-level">{course.level}</span> : null}
              <span className="learn-course-lesson-count">全{course.lessons.length}回</span>
            </div>
          </section>

          <CourseAwareContinueCard courseId={course.id} lessons={lessonViews} />

          <CourseProgressSummary courseArchiveIds={requiredArchiveIds} />

          <section className="panel learn-course-lesson-section" aria-labelledby="learn-course-lesson-heading">
            <div className="section-kicker">レッスン一覧</div>
            <h2 id="learn-course-lesson-heading" className="learn-visually-hidden">
              レッスン一覧
            </h2>
            <ol className="learn-course-lesson-list">
              {lessonViews.map((lesson) => (
                <li className="learn-course-lesson-row" key={lesson.archiveId}>
                  <span className="learn-course-lesson-order">{lesson.order}</span>
                  <div className="learn-course-lesson-body">
                    {lesson.available ? (
                      <a
                        className="learn-course-lesson-title"
                        href={archiveHref(lesson.archiveId, course.id)}
                      >
                        {lesson.title}
                      </a>
                    ) : (
                      <span className="learn-course-lesson-title learn-course-lesson-title--unavailable">
                        {lesson.title}
                      </span>
                    )}
                    <div className="learn-course-lesson-meta">
                      {lesson.date ? <span className="learn-course-lesson-date">{lesson.date}</span> : null}
                      {lesson.optional ? <span className="learn-course-lesson-optional">任意</span> : null}
                      {!lesson.available ? (
                        <span className="learn-course-lesson-unavailable">この回は現在利用できません</span>
                      ) : null}
                    </div>
                  </div>
                  {lesson.available ? <LessonStatusBadge archiveId={lesson.archiveId} /> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
