"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { ArrowRightIcon, PlayCircleIcon, BookOpenIcon } from "@phosphor-icons/react";
import { useProgress } from "../learning/progress-context";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ProgressBar } from "../ui/progress-bar";
import { themeCatOf, themeNameOf } from "../lib/theme-category";
import { archiveForCandidate, buildReviewCandidates, hasAnyLearningProgress } from "./review-engine";
import type { HomeLearningData } from "./home-types";
import styles from "./home-dashboard.module.css";

type HomeDashboardProps = {
  data: HomeLearningData;
  archivesCard: ReactNode;
  conferenceCard: ReactNode;
};

export default function HomeDashboard({ data, archivesCard, conferenceCard }: HomeDashboardProps) {
  const { state, hydrated } = useProgress();
  const candidates = useMemo(() => buildReviewCandidates(data, state), [data, state]);
  const hasProgress = hydrated && hasAnyLearningProgress(data, state);
  // The server and first hydration render use the same first-course recommendation.
  const initialCandidates = useMemo(() => buildReviewCandidates(data, {
    schemaVersion: 1, updatedAt: "", lessons: {},
    streak: { current: 0, longest: 0, lastActiveDate: "" }, earnedBadges: {}
  }), [data]);
  const candidate = (hydrated ? candidates : initialCandidates)[0];
  const archive = archiveForCandidate(data.archives, candidate);
  const course = data.courses.find((item) => item.id === candidate?.courseId);
  const quizReview = candidate?.reason === "review" || candidate?.reason === "refresh";
  const query = course ? `?courseId=${encodeURIComponent(course.id)}` : "";
  const href = archive ? `/archives/${encodeURIComponent(archive.id)}${query}${quizReview ? "#quiz" : ""}` : "/archives";
  const completedCount = data.archives.filter((item) => state.lessons[item.id]?.status === "completed").length;

  return (
    <div className={styles.home}>
      {archive ? (
        <section className={`${styles.feature} ${!archive.thumbnailUrl ? styles.featureTextOnly : ""}`} aria-labelledby="featured-lesson-title">
          {archive.thumbnailUrl ? (
            <Link href={href} className={styles.featureImage} aria-label={`${archive.title}の教材を開く`}>
              <img src={archive.thumbnailUrl} alt="" width={480} height={270} fetchPriority="high" />
              <span className={styles.imageTag}><PlayCircleIcon size={20} aria-hidden="true" />録画あり</span>
            </Link>
          ) : null}
          <div className={styles.featureBody}>
            <p className={styles.eyebrow}>{hasProgress ? (quizReview ? "もう一度、理解を深める" : "続きから学ぶ") : "はじめての方におすすめ"}</p>
            <Badge variant="theme" cat={themeCatOf(archive.themeId)}>{themeNameOf(data.themes, archive.themeId)}</Badge>
            <h2 id="featured-lesson-title" className={styles.featureTitle}>{archive.title}</h2>
            <p className={styles.featureOutcome}>{archive.learningOutcome}</p>
            <p className={styles.meta}>
              <span>{archive.formatLabel}</span>
              {archive.durationLabel ? <span>{archive.durationLabel}</span> : null}
              {archive.quiz ? <span>確認クイズ {archive.quiz.questionCount}問</span> : null}
            </p>
            <p className={styles.meta}>{archive.date}{archive.speaker ? `　講師: ${archive.speaker}` : ""}</p>
            <div className={styles.actions}>
              <Button href={href}>{hasProgress ? (quizReview ? "クイズで復習する" : "学習を再開する") : "この教材で学ぶ"}<ArrowRightIcon size={18} aria-hidden="true" /></Button>
              {course ? <Link className="text-link" href={`/courses/${course.id}`}>コースの内容を見る</Link> : null}
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.introEmpty}>
          <h2>これから学べる教材を準備しています</h2>
          <p>公開された教材はアーカイブに掲載します。</p>
          <Button href="/archives">アーカイブを見る</Button>
        </section>
      )}

      <nav className={styles.themes} aria-label="学ぶ分野から探す">
        <p>分野から探す</p>
        <div>{data.themes.map((theme) => (
          <Link key={theme.id} href={`/archives?theme=${encodeURIComponent(theme.id)}`}>{theme.name}<ArrowRightIcon size={14} aria-hidden="true" /></Link>
        ))}</div>
      </nav>

      {archivesCard}

      <section aria-labelledby="home-courses-title">
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}>テーマを通して理解を深める</p><h2 id="home-courses-title">順番に学べるコース</h2></div>
          <Link className="text-link" href="/courses">すべてのコース<ArrowRightIcon size={16} aria-hidden="true" /></Link>
        </div>
        <div className={styles.courseList}>
          {data.courses.map((item) => (
            <Link className={styles.courseLink} key={item.id} href={`/courses/${encodeURIComponent(item.id)}`}>
              <span className={styles.courseIcon}><BookOpenIcon size={24} aria-hidden="true" /></span>
              <div>
                <p className={styles.meta}>{themeNameOf(data.themes, item.themeId)} · {item.level} · 全{item.lessons.length}回</p>
                <h3>{item.title}</h3>
                <p className={styles.courseDescription}>{item.summary}</p>
              </div>
              <ArrowRightIcon size={18} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.supporting}>
        <section className={styles.progressSummary} aria-labelledby="home-progress-title">
          <p className={styles.eyebrow}>あなたの学習記録</p>
          <h2 id="home-progress-title">少しずつ、学びを積み重ねる</h2>
          <p className={styles.summaryCopy}>{hasProgress ? `修了した教材は ${completedCount} / ${data.archives.length} 件。学習の記録と獲得したバッジを確認できます。` : "学習を始めると、ここに進捗が記録されます。自分のペースで取り組んでください。"}</p>
          {hasProgress ? <ProgressBar value={completedCount} max={data.archives.length} label={`全${data.archives.length}教材中${completedCount}件修了`} /> : null}
          <Link className="text-link" href="/dashboard">学習記録を見る<ArrowRightIcon size={16} aria-hidden="true" /></Link>
        </section>
        {conferenceCard}
      </div>
    </div>
  );
}
