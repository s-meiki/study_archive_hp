import type { Metadata } from "next";
import SiteFooter from "../site-footer";
import { siteLegal, siteNavigation } from "../site-legal";
import { absoluteSiteUrl } from "../site-url";
import { loadLearningContent, loadSiteContent } from "../site-data";
import { CourseProgressBadge } from "./course-progress";

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

  const courses = [...learningContent.courses]
    .sort((a, b) => a.order - b.order)
    .map((course) => ({
      id: course.id,
      title: course.title,
      summary: course.summary,
      level: course.level,
      themeName: themeNameById.get(course.themeId) ?? course.themeId,
      lessonCount: course.lessons.length,
      archiveIds: course.lessons.filter((lesson) => !lesson.optional).map((lesson) => lesson.archiveId)
    }));

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
          <a className="topbar-link" href={siteNavigation.archiveUrl}>
            アーカイブ一覧へ
          </a>
          <a className="topbar-link" href="/learn">
            学習ダッシュボード
          </a>
          <a className="topbar-link" href={siteLegal.contactUrl}>
            問い合わせ
          </a>
        </div>
      </header>

      <main>
        <div className="learn-course-list">
          <section className="panel learn-header">
            <div className="section-kicker">Courses</div>
            <h1>コース一覧</h1>
            <p className="learn-header-copy">テーマごとに順番立てて学べるコースです。気になるコースから始めてみましょう。</p>
          </section>

          {courses.length > 0 ? (
            <ul className="learn-course-grid">
              {courses.map((course) => (
                <li className="panel learn-course-card" key={course.id}>
                  <div className="learn-course-card-head">
                    {course.level ? <span className="learn-course-level">{course.level}</span> : null}
                    <span className="learn-course-theme">{course.themeName}</span>
                  </div>
                  <h2 className="learn-course-title">
                    <a href={`/courses/${encodeURIComponent(course.id)}`}>{course.title}</a>
                  </h2>
                  <p className="learn-course-summary">{course.summary}</p>
                  <div className="learn-course-card-foot">
                    <span className="learn-course-lesson-count">全{course.lessonCount}回</span>
                    <CourseProgressBadge courseArchiveIds={course.archiveIds} />
                  </div>
                  <a className="button button-primary learn-course-card-link" href={`/courses/${encodeURIComponent(course.id)}`}>
                    コースを見る
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <section className="panel learn-empty-state" aria-labelledby="learn-courses-empty-heading">
              <h2 id="learn-courses-empty-heading">まだコースがありません</h2>
              <p className="learn-empty-copy">コースが公開されると、ここに一覧が表示されるようになります。</p>
              <a className="button button-primary learn-empty-link" href={siteNavigation.archiveUrl}>
                アーカイブ一覧を見る
              </a>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
