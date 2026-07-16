"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ChartBarIcon, ListChecksIcon } from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import type { ProgressState } from "../learning/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardHeader } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { ProgressBar } from "../ui/progress-bar";
import { ProgressRing } from "../ui/progress-ring";
import { Stat } from "../ui/stat";
import type { HomeArchive, HomeLearningData } from "./home-types";
import {
  archiveForCandidate,
  buildCourseProgress,
  buildReviewCandidates,
  hasAnyLearningProgress,
  type CourseProgressView,
  type ReviewCandidate,
  type ReviewReason
} from "./review-engine";
import { themeCatOf, themeNameOf } from "../lib/theme-category";
import { toLocalDateKey } from "./activity-data";
import { WeeklyActivity } from "./weekly-activity";
import styles from "./home-dashboard.module.css";

type HomeDashboardProps = {
  data: HomeLearningData;
  /** SSR で確定する最新アーカイブカード（home-static-cards.tsx） */
  archivesCard: ReactNode;
  /** SSR で確定する学会カレンダーカード（home-static-cards.tsx） */
  conferenceCard: ReactNode;
};

const PENDING_VALUE = "–";

const resumeActionLabel: Record<ReviewReason, string> = {
  continue: "レッスンを再開",
  review: "クイズで復習する",
  refresh: "もう一度確認する",
  next: "次のレッスンへ",
  start: "最初のコースを始める"
};

function archiveHref(archiveId: string, courseId?: string, quiz = false): string {
  const query = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
  return `/archives/${encodeURIComponent(archiveId)}${query}${quiz ? "#quiz" : ""}`;
}

function candidateGoesToQuiz(
  candidate: ReviewCandidate | undefined,
  archive: HomeArchive | undefined
): boolean {
  return Boolean(
    candidate && archive?.quiz && (candidate.reason === "review" || candidate.reason === "refresh")
  );
}

function streakFoot(state: ProgressState): string {
  if (state.streak.current <= 0) {
    return "今日から学習を始めましょう";
  }
  if (state.streak.lastActiveDate === toLocalDateKey(new Date())) {
    return "今日の学習で継続中";
  }
  return `最長 ${state.streak.longest}日`;
}

function quizBestScores(data: HomeLearningData, state: ProgressState): number[] {
  return data.archives
    .map((archive) => state.lessons[archive.id]?.quizBestScore)
    .filter((score): score is number => typeof score === "number");
}

function StatsRow({
  data,
  state,
  hydrated
}: {
  data: HomeLearningData;
  state: ProgressState;
  hydrated: boolean;
}) {
  const completedCount = data.archives.filter(
    (archive) => state.lessons[archive.id]?.status === "completed"
  ).length;
  const scores = quizBestScores(data, state);
  const quizAverage =
    scores.length > 0
      ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100)
      : null;
  const badgeCount = Object.keys(state.earnedBadges).length;
  const showQuizAverage = hydrated && quizAverage !== null;

  return (
    <section className={styles.stats} aria-label="学習ステータス" aria-busy={!hydrated}>
      <Stat
        label="連続学習"
        value={hydrated ? state.streak.current : PENDING_VALUE}
        unit="日"
        foot={hydrated ? streakFoot(state) : "記録を確認中"}
      />
      <Stat
        label="完了レッスン"
        value={hydrated ? completedCount : PENDING_VALUE}
        unit="件"
        foot={`全${data.archives.length}レッスン中`}
      />
      <Stat
        label="クイズ平均正答"
        value={showQuizAverage ? quizAverage : PENDING_VALUE}
        unit={showQuizAverage ? "%" : undefined}
        foot={
          showQuizAverage
            ? `挑戦済み ${scores.length}クイズのベスト平均`
            : "クイズに挑戦すると表示されます"
        }
      >
        <ProgressBar
          mode="continuous"
          tone="accent"
          value={showQuizAverage ? quizAverage ?? 0 : 0}
          max={100}
          label={`クイズ平均正答率 ${showQuizAverage ? quizAverage : 0}%`}
        />
      </Stat>
      <Stat
        label="獲得バッジ"
        value={hydrated ? badgeCount : PENDING_VALUE}
        unit="個"
        foot="コース修了などで獲得"
      />
    </section>
  );
}

function ResumeSkeleton() {
  return (
    <Card className={styles.areaResume}>
      <div className={`${styles.skeletonStack} ${styles.resumeSkeleton}`} aria-hidden="true">
        <span className={`${styles.skeletonLine} ${styles.skeletonLineSm}`} />
        <span className={`${styles.skeletonLine} ${styles.skeletonLineMd}`} />
        <span className={`${styles.skeletonLine} ${styles.skeletonLineLg}`} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonAction} />
      </div>
      <p className="visually-hidden">学習記録を確認しています</p>
    </Card>
  );
}

function ResumeCard({
  data,
  candidates,
  courseViews,
  hasProgress,
  hydrated
}: {
  data: HomeLearningData;
  candidates: ReviewCandidate[];
  courseViews: CourseProgressView[];
  hasProgress: boolean;
  hydrated: boolean;
}) {
  if (!hydrated) {
    return <ResumeSkeleton />;
  }

  const candidate = candidates[0];
  const archive = archiveForCandidate(data.archives, candidate);
  if (!candidate || !archive) {
    return (
      <Card className={styles.areaResume}>
        <EmptyState
          title="公開中の学習コンテンツを確認できませんでした"
          description="時間をおいて、もう一度開いてください。"
        />
      </Card>
    );
  }

  const course =
    data.courses.find((item) => item.id === candidate.courseId) ??
    data.courses.find((item) => item.lessons.some((lesson) => lesson.archiveId === archive.id));
  const lessonOrder = course?.lessons.find((lesson) => lesson.archiveId === archive.id)?.order;
  const progressView = course ? courseViews.find((view) => view.id === course.id) : undefined;
  const goesToQuiz = candidateGoesToQuiz(candidate, archive);

  return (
    <Card className={styles.areaResume}>
      <p className={styles.eyebrow}>{hasProgress ? "続きから" : "ここから始める"}</p>
      <p className={styles.resumeCourse}>
        {course ? `コース: ${course.title}` : themeNameOf(data.themes, archive.themeId)}
      </p>
      <h2 className={styles.resumeTitle}>
        {lessonOrder ? `レッスン${lessonOrder}「${archive.title}」` : archive.title}
      </h2>
      <p className={styles.resumeMeta}>
        <Badge variant="theme" cat={themeCatOf(archive.themeId)}>
          {themeNameOf(data.themes, archive.themeId)}
        </Badge>
        {archive.date ? <span>{archive.date}</span> : null}
        {archive.speaker ? <span>講師: {archive.speaker}</span> : null}
      </p>
      {progressView && progressView.requiredCount > 0 ? (
        <>
          <ProgressBar
            value={progressView.completedCount}
            max={progressView.requiredCount}
            label={`コース進捗: ${progressView.requiredCount}レッスン中${progressView.completedCount}件完了`}
          />
          <p className={styles.segCaption}>
            進捗 {progressView.completedCount}/{progressView.requiredCount} レッスン
          </p>
        </>
      ) : null}
      <div className={styles.resumeActions}>
        <Button href={archiveHref(archive.id, course?.id, goesToQuiz)}>
          {resumeActionLabel[candidate.reason]}
        </Button>
        {course ? (
          <Button variant="secondary" href={`/courses/${encodeURIComponent(course.id)}`}>
            コース概要を見る
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function QueueSkeleton() {
  return (
    <div className={`${styles.skeletonStack} ${styles.queueSkeleton}`} aria-hidden="true">
      <span className={styles.skeletonLine} />
      <span className={`${styles.skeletonLine} ${styles.skeletonLineMd}`} />
      <span className={styles.skeletonLine} />
      <span className={`${styles.skeletonLine} ${styles.skeletonLineMd}`} />
    </div>
  );
}

function QueueCard({
  data,
  queue,
  hasProgress,
  hydrated
}: {
  data: HomeLearningData;
  queue: ReviewCandidate[];
  hasProgress: boolean;
  hydrated: boolean;
}) {
  const quizCandidate = queue.find((candidate) =>
    candidateGoesToQuiz(candidate, archiveForCandidate(data.archives, candidate))
  );

  return (
    <Card className={styles.areaQueue}>
      <CardHeader
        title="今日の復習キュー"
        action={hydrated ? <span className={styles.countBadge}>{queue.length}件</span> : undefined}
        sub="復習エンジンが選んだ、今日おさらいすべき回"
      />
      {!hydrated ? (
        <QueueSkeleton />
      ) : queue.length === 0 ? (
        <EmptyState
          icon={<ListChecksIcon />}
          title={hasProgress ? "今日の復習はここまで" : "まだ復習する回がありません"}
          description={
            hasProgress
              ? "新しいレッスンを進めると、復習候補がここに追加されます。"
              : "レッスンを1本見ると、ここに今日の復習候補が並びます。"
          }
          action={
            hasProgress ? undefined : (
              <Button variant="secondary" size="sm" href="/courses">
                コースから始める
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className={styles.itemList}>
            {queue.map((candidate) => {
              const archive = archiveForCandidate(data.archives, candidate);
              if (!archive) {
                return null;
              }
              return (
                <li key={candidate.archiveId}>
                  <div className={styles.itemBody}>
                    <p className={styles.itemTitle}>{archive.title}</p>
                    <p className={styles.itemMeta}>
                      <Badge variant="theme" cat={themeCatOf(archive.themeId)}>
                        {themeNameOf(data.themes, archive.themeId)}
                      </Badge>
                      {archive.date ? <span>{archive.date}</span> : null}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className={styles.itemAction}
                    href={archiveHref(
                      archive.id,
                      candidate.courseId,
                      candidateGoesToQuiz(candidate, archive)
                    )}
                  >
                    復習
                  </Button>
                </li>
              );
            })}
          </ul>
          {quizCandidate ? (
            <div className={styles.cardFoot}>
              <Link
                className="text-link"
                href={archiveHref(quizCandidate.archiveId, quizCandidate.courseId, true)}
              >
                復習してから確認クイズを解く →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

function ActivityCard({
  state,
  hasProgress,
  hydrated
}: {
  state: ProgressState;
  hasProgress: boolean;
  hydrated: boolean;
}) {
  return (
    <Card className={styles.areaActivity}>
      <CardHeader title="週間学習アクティビティ" sub="直近7日間に学習したレッスン数（視聴・完了）" />
      {!hydrated ? (
        <div className={styles.chartSkeleton} aria-hidden="true" />
      ) : hasProgress ? (
        <WeeklyActivity lessons={state.lessons} />
      ) : (
        <EmptyState
          icon={<ChartBarIcon />}
          title="まだ記録がありません"
          description="レッスンを見たり修了すると、日々の学習量がここに積み上がります。"
        />
      )}
    </Card>
  );
}

function CoursesCard({
  data,
  courseViews
}: {
  data: HomeLearningData;
  courseViews: CourseProgressView[];
}) {
  return (
    <Card className={styles.areaCourses}>
      <CardHeader
        title="コース進捗"
        action={
          <Link className="text-link" href="/courses">
            コース一覧
          </Link>
        }
      />
      <ul className={styles.courseList}>
        {courseViews.map((course) => (
          <li key={course.id}>
            <ProgressRing
              value={course.completedCount}
              max={course.requiredCount}
              label={`進捗 ${course.requiredCount}レッスン中${course.completedCount}件完了`}
            />
            <div className={styles.courseBody}>
              <p className={styles.courseName}>
                <Link href={`/courses/${encodeURIComponent(course.id)}`}>{course.title}</Link>
              </p>
              <p className={styles.courseMeta}>
                <Badge variant="theme" cat={themeCatOf(course.themeId)}>
                  {themeNameOf(data.themes, course.themeId)}
                </Badge>
                {course.level ? <span className={styles.levelChip}>{course.level}</span> : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function HomeDashboard({ data, archivesCard, conferenceCard }: HomeDashboardProps) {
  const { state, hydrated } = useProgress();
  const candidates = useMemo(() => buildReviewCandidates(data, state), [data, state]);
  const courseViews = useMemo(() => buildCourseProgress(data, state), [data, state]);
  const hasProgress = hydrated && hasAnyLearningProgress(data, state);
  // 先頭候補は「続きから」カードが受け持つので、キューには2件目以降を出す。
  const queue = hasProgress ? candidates.slice(1, 4) : [];

  return (
    <>
      <StatsRow data={data} state={state} hydrated={hydrated} />
      <div className={styles.grid}>
        <ResumeCard
          data={data}
          candidates={candidates}
          courseViews={courseViews}
          hasProgress={hasProgress}
          hydrated={hydrated}
        />
        <QueueCard data={data} queue={queue} hasProgress={hasProgress} hydrated={hydrated} />
        <ActivityCard state={state} hasProgress={hasProgress} hydrated={hydrated} />
        <CoursesCard data={data} courseViews={courseViews} />
        {archivesCard}
        {conferenceCard}
      </div>
    </>
  );
}
