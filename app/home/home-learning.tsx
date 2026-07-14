"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CaretDownIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockCounterClockwiseIcon,
  DeviceMobileIcon,
  PathIcon,
  PlayCircleIcon,
  QuestionIcon
} from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import type { LessonStatus } from "../learning/types";
import ArchiveExplorer from "./archive-explorer";
import type { HomeArchive, HomeCourse, HomeLearningData } from "./home-types";
import {
  archiveForCandidate,
  buildCourseProgress,
  buildReviewCandidates,
  hasAnyLearningProgress,
  type ReviewCandidate,
  type ReviewReason
} from "./review-engine";

type HomeLearningProps = {
  data: HomeLearningData;
  dateLabel: string;
};

const reasonLabel: Record<ReviewReason, string> = {
  continue: "続きから",
  review: "クイズを再確認",
  refresh: "もう一度確認",
  next: "コースの次へ",
  start: "最初の一歩"
};

function archiveHref(archiveId: string, courseId?: string, quiz = false) {
  const params = new URLSearchParams({ id: archiveId });
  if (courseId) params.set("courseId", courseId);
  return `/archive?${params.toString()}${quiz ? "#quiz" : ""}`;
}

function statusLabel(status: LessonStatus | undefined) {
  if (status === "completed") return "修了";
  if (status === "watched") return "視聴済み";
  return "未視聴";
}

function formatScore(score: number | undefined) {
  return typeof score === "number" ? `${Math.round(score * 100)}%` : "未挑戦";
}

function candidateGoesToQuiz(candidate: ReviewCandidate | undefined, archive: HomeArchive | undefined) {
  return Boolean(
    candidate &&
      archive?.quiz &&
      (candidate.reason === "review" || candidate.reason === "refresh")
  );
}

function candidateCopy(candidate: ReviewCandidate, archive: HomeArchive, hasProgress: boolean) {
  if (!hasProgress || candidate.reason === "start") {
    return "まずは1回選んで、学習記録をこの端末に残していきましょう。";
  }
  if (candidate.reason === "continue") {
    return "前回開いた回の続きです。要点を確認して、修了まで進めましょう。";
  }
  if (candidate.reason === "review") {
    return `前回のベストスコアは${formatScore(candidate.score)}。迷ったポイントを短いクイズで確かめましょう。`;
  }
  if (candidate.reason === "next") {
    return "進めているコースの次の回です。学んだ順番を保ったまま再開できます。";
  }
  return archive.quiz
    ? "一度修了した回を、確認クイズでもう一度思い出しましょう。"
    : "一度学んだ回を開き直して、要点を思い出しましょう。";
}

function courseForArchive(courses: HomeCourse[], archiveId: string) {
  return courses.find((course) => course.lessons.some((lesson) => lesson.archiveId === archiveId));
}

function TodayReview({
  archive,
  candidate,
  followUps,
  data,
  dateLabel,
  hasProgress,
  hydrated
}: {
  archive: HomeArchive | undefined;
  candidate: ReviewCandidate | undefined;
  followUps: ReviewCandidate[];
  data: HomeLearningData;
  dateLabel: string;
  hasProgress: boolean;
  hydrated: boolean;
}) {
  if (!hydrated) {
    return (
      <section className="home-today is-loading" aria-busy="true" aria-live="polite">
        <p className="home-date">{dateLabel}</p>
        <div className="home-today-card">
          <span className="home-today-label">
            <ClockCounterClockwiseIcon aria-hidden="true" />
            学習記録を確認中
          </span>
          <div className="home-loading-line is-title" />
          <div className="home-loading-line" />
          <div className="home-loading-line is-short" />
        </div>
      </section>
    );
  }

  if (!archive || !candidate) {
    return (
      <section className="home-today">
        <p className="home-date">{dateLabel}</p>
        <div className="home-today-card home-today-empty">
          <h1>公開中の学習コンテンツを確認できませんでした</h1>
          <p>時間をおいて、もう一度開いてください。</p>
        </div>
      </section>
    );
  }

  const themeName = data.themes.find((theme) => theme.id === archive.themeId)?.name ?? archive.themeId;
  const primaryGoesToQuiz = candidateGoesToQuiz(candidate, archive);
  const primaryLabel = !hasProgress
    ? "最初の回を見る"
    : candidate.reason === "next"
      ? "次の回を見る"
      : primaryGoesToQuiz
        ? "復習を始める"
        : "続きから見る";

  return (
    <section className="home-today" aria-labelledby="home-today-heading">
      <p className="home-date">{dateLabel}</p>
      <div className="home-today-card">
        <div className="home-today-copy">
          <span className="home-today-label">
            <ClockCounterClockwiseIcon aria-hidden="true" />
            {hasProgress ? "今日の復習" : "ここから始める"}
          </span>
          <h1 id="home-today-heading">{archive.title}</h1>
          <p>{candidateCopy(candidate, archive, hasProgress)}</p>
          <div className="home-today-meta" aria-label="今回の学習情報">
            <span>
              <BookOpenTextIcon aria-hidden="true" />
              {themeName}
            </span>
            {archive.quiz ? (
              <span>
                <QuestionIcon aria-hidden="true" />
                確認クイズ {archive.quiz.questionCount}問
              </span>
            ) : null}
            {hasProgress ? (
              <span>
                <ClockCounterClockwiseIcon aria-hidden="true" />
                {reasonLabel[candidate.reason]}
              </span>
            ) : null}
          </div>
        </div>
        <a
          className="home-primary-action"
          href={archiveHref(archive.id, candidate.courseId, primaryGoesToQuiz)}
        >
          {primaryLabel}
          <ArrowRightIcon aria-hidden="true" />
        </a>
      </div>

      {followUps.length > 0 ? (
        <div className="home-follow-ups" aria-labelledby="home-follow-ups-heading">
          <h2 id="home-follow-ups-heading">次の候補</h2>
          <div className="home-follow-up-list">
            {followUps.map((item) => {
              const itemArchive = archiveForCandidate(data.archives, item);
              if (!itemArchive) return null;
              const itemTheme = data.themes.find((theme) => theme.id === itemArchive.themeId)?.name;
              return (
                <a
                  key={item.archiveId}
                  href={archiveHref(
                    item.archiveId,
                    item.courseId,
                    candidateGoesToQuiz(item, itemArchive)
                  )}
                >
                  <PlayCircleIcon aria-hidden="true" weight="fill" />
                  <strong>{itemArchive.title}</strong>
                  <span>{itemTheme}</span>
                  <span>{reasonLabel[item.reason]}</span>
                  <CaretRightIcon aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="home-local-note">
        <DeviceMobileIcon aria-hidden="true" />
        <span>進捗はこの端末のブラウザに保存されます。</span>
      </div>
    </section>
  );
}

function InboxRow({
  archive,
  candidate,
  selected,
  status,
  onSelect
}: {
  archive: HomeArchive;
  candidate: ReviewCandidate;
  selected: boolean;
  status: LessonStatus | undefined;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`home-inbox-row${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className={`home-inbox-status is-${status ?? "unwatched"}`} aria-hidden="true">
        {status === "completed" ? <CheckCircleIcon weight="fill" /> : <CircleIcon />}
      </span>
      <span className="home-inbox-row-copy">
        <strong>{archive.title}</strong>
        <small>
          {reasonLabel[candidate.reason]}
          {typeof candidate.score === "number" ? ` ／ ベスト ${formatScore(candidate.score)}` : ""}
        </small>
      </span>
      <CaretRightIcon aria-hidden="true" />
    </button>
  );
}

function ReviewInbox({
  data,
  candidates,
  hasProgress
}: {
  data: HomeLearningData;
  candidates: ReviewCandidate[];
  hasProgress: boolean;
}) {
  const { state } = useProgress();
  const [selectedId, setSelectedId] = useState(candidates[0]?.archiveId ?? "");
  const selectedCandidate = candidates.find((candidate) => candidate.archiveId === selectedId) ?? candidates[0];
  const selectedArchive = archiveForCandidate(data.archives, selectedCandidate);
  const completed = data.archives
    .filter((archive) => state.lessons[archive.id]?.status === "completed")
    .sort((a, b) =>
      (state.lessons[b.id]?.completedAt ?? "").localeCompare(state.lessons[a.id]?.completedAt ?? "")
    )
    .slice(0, 2);

  return (
    <section className="home-inbox" id="review-inbox" aria-labelledby="home-inbox-heading">
      <div className="home-section-heading">
        <div>
          <p className="home-section-label">Review Inbox</p>
          <h2 id="home-inbox-heading">復習インボックス</h2>
          <p>{hasProgress ? "迷いやすい回と未修了の回を、次に取り組みやすい順で整理しています。" : "学習を始めると、未修了やクイズ再確認の回がここに並びます。"}</p>
        </div>
        <span className="home-inbox-count">{candidates.length}件</span>
      </div>

      <div className="home-inbox-layout">
        <div className="home-inbox-rail">
          <div className="home-inbox-group">
            <h3>{hasProgress ? "復習候補" : "最初の候補"}</h3>
            {candidates.slice(0, 5).map((candidate) => {
              const archive = archiveForCandidate(data.archives, candidate);
              return archive ? (
                <InboxRow
                  key={candidate.archiveId}
                  archive={archive}
                  candidate={candidate}
                  status={state.lessons[archive.id]?.status}
                  selected={selectedCandidate?.archiveId === candidate.archiveId}
                  onSelect={() => setSelectedId(candidate.archiveId)}
                />
              ) : null;
            })}
          </div>

          {completed.length > 0 ? (
            <div className="home-inbox-group home-inbox-completed">
              <h3>最近の修了</h3>
              {completed.map((archive) => (
                <a key={archive.id} href={archiveHref(archive.id)}>
                  <CheckCircleIcon aria-hidden="true" />
                  <span>
                    <strong>{archive.title}</strong>
                    <small>ベスト {formatScore(state.lessons[archive.id]?.quizBestScore)}</small>
                  </span>
                  <CaretRightIcon aria-hidden="true" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {selectedArchive && selectedCandidate ? (
          <article className="home-inbox-detail">
            <div className="home-inbox-detail-head">
              <span className="home-inbox-detail-icon" aria-hidden="true">
                <BookOpenTextIcon />
              </span>
              <div>
                <p>{data.themes.find((theme) => theme.id === selectedArchive.themeId)?.name}</p>
                <h3>{selectedArchive.title}</h3>
              </div>
            </div>
            <div className="home-inbox-detail-meta">
              <span>{statusLabel(state.lessons[selectedArchive.id]?.status)}</span>
              {selectedArchive.quiz ? <span>クイズ {selectedArchive.quiz.questionCount}問</span> : null}
              <span>ベスト {formatScore(state.lessons[selectedArchive.id]?.quizBestScore)}</span>
            </div>
            <p className="home-inbox-summary">{selectedArchive.overview || selectedArchive.summary}</p>
            {selectedArchive.keyPoints.length > 0 ? (
              <div className="home-inbox-keypoints">
                <h4>この回の要点</h4>
                <ol>
                  {selectedArchive.keyPoints.slice(0, 3).map((point, index) => (
                    <li key={point}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{point}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            <div className="home-inbox-actions">
              <a
                className="home-primary-action"
                href={archiveHref(
                  selectedArchive.id,
                  selectedCandidate.courseId,
                  candidateGoesToQuiz(selectedCandidate, selectedArchive)
                )}
              >
                {candidateGoesToQuiz(selectedCandidate, selectedArchive) && selectedArchive.quiz
                  ? `${selectedArchive.quiz.questionCount}問で復習する`
                  : selectedCandidate.reason === "next"
                    ? "次の回を見る"
                    : selectedCandidate.reason === "start"
                      ? "最初の回を見る"
                      : "この回を見直す"}
                <ArrowRightIcon aria-hidden="true" />
              </a>
              <a className="home-text-action" href={archiveHref(selectedArchive.id, selectedCandidate.courseId)}>
                要点を見直す
                <CaretRightIcon aria-hidden="true" />
              </a>
            </div>
          </article>
        ) : null}
      </div>

      <div className="home-inbox-foot">
        <a href="/about#openchat">
          <ChatCircleTextIcon aria-hidden="true" />
          質問はオープンチャットへ
        </a>
        <span>
          <DeviceMobileIcon aria-hidden="true" />
          進捗はこの端末に保存
        </span>
      </div>
    </section>
  );
}

function KnowledgeMap({ data }: { data: HomeLearningData }) {
  const { state } = useProgress();
  const courseViews = buildCourseProgress(data, state);
  const archiveById = new Map(data.archives.map((archive) => [archive.id, archive]));
  const initialArchiveId =
    state.lastVisited?.archiveId && archiveById.has(state.lastVisited.archiveId)
      ? state.lastVisited.archiveId
      : courseViews[0]?.lessons[0]?.archiveId ?? "";
  const [selectedId, setSelectedId] = useState(initialArchiveId);
  const [expandedIds, setExpandedIds] = useState(() => new Set(courseViews.slice(0, 3).map((course) => course.id)));
  const selectedArchive = archiveById.get(selectedId) ?? archiveById.get(initialArchiveId);
  const selectedCourse = selectedArchive ? courseForArchive(data.courses, selectedArchive.id) : undefined;
  const selectedLesson = selectedCourse?.lessons.find((lesson) => lesson.archiveId === selectedArchive?.id);
  const selectedProgress = selectedArchive ? state.lessons[selectedArchive.id] : undefined;
  const selectedCanOpenQuiz = Boolean(
    selectedArchive?.quiz &&
      selectedProgress &&
      (selectedProgress.status === "watched" ||
        selectedProgress.status === "completed" ||
        typeof selectedProgress.quizBestScore === "number")
  );

  function toggleCourse(courseId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  return (
    <section className="home-map" id="knowledge-map" aria-labelledby="home-map-heading">
      <div className="home-section-heading home-map-heading">
        <div>
          <p className="home-section-label">Learning Map</p>
          <h2 id="home-map-heading">分野から、記憶をつなぎ直す。</h2>
          <p>コース内の現在地を確認して、必要な回だけ復習できます。</p>
        </div>
        <div className="home-map-legend" aria-label="進捗凡例">
          <span className="is-completed"><CheckCircleIcon weight="fill" aria-hidden="true" />修了</span>
          <span className="is-watched"><CircleIcon weight="fill" aria-hidden="true" />視聴済み</span>
          <span><CircleIcon aria-hidden="true" />未視聴</span>
        </div>
      </div>

      <div className="home-map-layout">
        <div className="home-map-courses">
          {courseViews.map((course) => {
            const expanded = expandedIds.has(course.id);
            return (
              <article className="home-map-course" key={course.id}>
                <button
                  type="button"
                  className="home-map-course-toggle"
                  aria-expanded={expanded}
                  aria-controls={`home-map-course-${course.id}`}
                  onClick={() => toggleCourse(course.id)}
                >
                  <span>
                    <strong>{course.title}</strong>
                    <small>
                      {course.completedCount}/{course.requiredCount} 修了
                    </small>
                  </span>
                  <CaretDownIcon aria-hidden="true" />
                </button>
                {expanded ? (
                  <div className="home-map-lessons" id={`home-map-course-${course.id}`}>
                    {course.lessons.map((lesson) => {
                      const archive = archiveById.get(lesson.archiveId);
                      if (!archive) return null;
                      const status = state.lessons[lesson.archiveId]?.status ?? "unwatched";
                      return (
                        <button
                          type="button"
                          key={lesson.archiveId}
                          className={`home-map-lesson is-${status}${selectedArchive?.id === lesson.archiveId ? " is-selected" : ""}`}
                          onClick={() => setSelectedId(lesson.archiveId)}
                        >
                          {status === "completed" ? <CheckCircleIcon weight="fill" aria-hidden="true" /> : <CircleIcon aria-hidden="true" />}
                          <span>{lesson.label}</span>
                          {lesson.optional ? <small>任意</small> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {selectedArchive ? (
          <aside className="home-map-inspector" aria-live="polite">
            <PathIcon aria-hidden="true" />
            <p>{data.themes.find((theme) => theme.id === selectedArchive.themeId)?.name}</p>
            <h3>{selectedArchive.title}</h3>
            <div className="home-map-inspector-meta">
              <span>{statusLabel(state.lessons[selectedArchive.id]?.status)}</span>
              {selectedArchive.assets.slides ? <span>参考資料あり</span> : null}
              {selectedArchive.quiz ? <span>クイズ {selectedArchive.quiz.questionCount}問</span> : null}
            </div>
            <p>{selectedArchive.summary}</p>
            {typeof state.lessons[selectedArchive.id]?.quizBestScore === "number" ? (
              <div className="home-map-score">
                <span>前回の結果</span>
                <strong>{formatScore(state.lessons[selectedArchive.id]?.quizBestScore)}</strong>
              </div>
            ) : null}
            <a
              className="home-primary-action"
              href={archiveHref(selectedArchive.id, selectedCourse?.id, selectedCanOpenQuiz)}
            >
              {selectedCanOpenQuiz ? "この回を復習する" : "この回を見る"}
              <ArrowRightIcon aria-hidden="true" />
            </a>
            {selectedCourse ? (
              <a className="home-text-action" href={`/courses/${encodeURIComponent(selectedCourse.id)}`}>
                {selectedCourse.title}を見る
                <CaretRightIcon aria-hidden="true" />
              </a>
            ) : null}
            {selectedLesson ? <small className="home-map-position">第{selectedLesson.order}回</small> : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}

export default function HomeLearning({ data, dateLabel }: HomeLearningProps) {
  const { state, hydrated } = useProgress();
  const candidates = useMemo(() => buildReviewCandidates(data, state), [data, state]);
  const hasProgress = hydrated && hasAnyLearningProgress(data, state);
  const todayCandidate = candidates[0];
  const todayArchive = archiveForCandidate(data.archives, todayCandidate);

  return (
    <main className="home-main">
      <TodayReview
        archive={todayArchive}
        candidate={todayCandidate}
        followUps={hasProgress ? candidates.slice(1, 3) : []}
        data={data}
        dateLabel={dateLabel}
        hasProgress={hasProgress}
        hydrated={hydrated}
      />
      {hydrated ? <ReviewInbox data={data} candidates={candidates} hasProgress={hasProgress} /> : null}
      {hydrated ? <KnowledgeMap data={data} /> : null}
      <ArchiveExplorer archives={data.archives} themes={data.themes} />
      <section className="notice home-disclaimer" aria-labelledby="home-disclaimer-heading">
        <strong id="home-disclaimer-heading">教育用コンテンツ</strong>
        <span>本アーカイブは個別診療の判断を代替するものではありません。</span>
      </section>
    </main>
  );
}
