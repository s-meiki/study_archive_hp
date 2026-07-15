"use client";

// 旧 app/archive/archive-quiz.tsx からロジックを移植した新デザイン版。
// 採点・シャッフル・ベストスコア保存・修了判定の挙動は旧版と同一に保つこと。

import { useMemo, useState } from "react";
import { useProgress } from "../../learning/progress-context";
import { useLessonProgress } from "../../learning/use-lesson-progress";
import { bumpStreak } from "../../learning/streak";
import type { ArchiveQuiz as ArchiveQuizType, LessonProgress } from "../../learning/types";
import { Button } from "../../ui/button";
import styles from "./archive-quiz-section.module.css";

// ローカルタイムの YYYY-MM-DD を返す（ストリーク判定の基準日）。
function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ArchiveQuizSectionProps = {
  archiveId: string;
  quiz: ArchiveQuizType;
};

// 単一・複数どちらの設問も選択集合（choice id の配列）で保持する。
// single は 0〜1 件、multiple は 0〜複数件。
type AnswerMap = Record<string, string[]>;

type GradableQuestion = ArchiveQuizType["questions"][number];

// 設問の正答 id 集合を返す（single は answerId を 1 件、multiple は answerIds）。
function correctIdsFor(question: GradableQuestion): string[] {
  if (question.type === "multiple") {
    return question.answerIds ?? [];
  }
  return question.answerId ? [question.answerId] : [];
}

// 選択集合が正答集合と完全一致するかを判定する（multiple は部分点なし）。
function isQuestionCorrect(question: GradableQuestion, selected: string[]): boolean {
  const correct = correctIdsFor(question);
  if (correct.length === 0 || correct.length !== selected.length) {
    return false;
  }
  const selectedSet = new Set(selected);
  return correct.every((id) => selectedSet.has(id));
}

// 作問データは正答が先頭選択肢に偏っているため、表示時に選択肢を並べ替えて
// 位置から答えを推測できないようにする。SSR と hydration で同一順序になるよう
// 乱数ではなく質問IDから決定論的に並べる（再挑戦時は round を混ぜて並べ直す）。
function stableSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffledBySeed<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    const rand = ((state ^ (state >>> 14)) >>> 0) / 4294967296;
    const j = Math.floor(rand * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function ArchiveQuizSection({ archiveId, quiz }: ArchiveQuizSectionProps) {
  const { update } = useProgress();
  const { status, markCompleted } = useLessonProgress(archiveId);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [graded, setGraded] = useState(false);
  const [shuffleRound, setShuffleRound] = useState(0);

  const displayQuestions = useMemo(
    () =>
      quiz.questions.map((question) => ({
        ...question,
        choices: shuffledBySeed(
          question.choices,
          stableSeed(`${archiveId}|${question.id}|${shuffleRound}`)
        )
      })),
    [quiz, archiveId, shuffleRound]
  );

  const questions = quiz.questions;
  const totalCount = questions.length;
  const answeredCount = questions.filter(
    (question) => (answers[question.id]?.length ?? 0) > 0
  ).length;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const correctCount = questions.filter((question) =>
    isQuestionCorrect(question, answers[question.id] ?? [])
  ).length;
  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const scorePercent = Math.round(score * 100);
  const passed = graded && score >= quiz.passThreshold;

  // single: 選択を 1 件に置き換える（ラジオ相当）。
  function handleSelectSingle(questionId: string, choiceId: string) {
    if (graded) {
      return;
    }
    setAnswers((current) => ({ ...current, [questionId]: [choiceId] }));
  }

  // multiple: 選択肢の on/off をトグルする（チェックボックス相当）。
  function handleToggleMultiple(questionId: string, choiceId: string) {
    if (graded) {
      return;
    }
    setAnswers((current) => {
      const previous = current[questionId] ?? [];
      const next = previous.includes(choiceId)
        ? previous.filter((id) => id !== choiceId)
        : [...previous, choiceId];
      return { ...current, [questionId]: next };
    });
  }

  function handleGrade() {
    if (!allAnswered) {
      return;
    }

    const nextCorrect = questions.filter((question) =>
      isQuestionCorrect(question, answers[question.id] ?? [])
    ).length;
    const nextScore = totalCount > 0 ? nextCorrect / totalCount : 0;

    // quizBestScore は毎回「既存値と今回スコアの大きい方」で更新する（status は触らない）。
    update((current) => {
      const existing: LessonProgress | undefined = current.lessons[archiveId];
      const bestScore = Math.max(existing?.quizBestScore ?? 0, nextScore);
      const nextLesson: LessonProgress = {
        ...existing,
        status: existing?.status ?? "unwatched",
        quizBestScore: bestScore
      };
      const next = {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
      return bumpStreak(next, todayLocalDate());
    });

    // 合格かつ未修了のときだけ修了に更新する（冪等: 既に completed なら completedAt を上書きしない）。
    if (nextScore >= quiz.passThreshold && status !== "completed") {
      markCompleted();
    }

    setGraded(true);
  }

  function handleRetry() {
    setAnswers({});
    setGraded(false);
    setShuffleRound((round) => round + 1);
  }

  return (
    <section className={styles.quiz} id="quiz" aria-labelledby="archive-quiz-heading">
      <h2 id="archive-quiz-heading" className={styles.title}>
        確認クイズ
      </h2>
      <p className={styles.intro}>
        全{totalCount}問に回答すると採点できます。正答率{Math.round(quiz.passThreshold * 100)}%以上で修了です。
      </p>

      <ol className={styles.questionList}>
        {displayQuestions.map((question, questionIndex) => {
          const isMultiple = question.type === "multiple";
          const selected = answers[question.id] ?? [];
          const correctSet = new Set(correctIdsFor(question));
          const questionCorrect = isQuestionCorrect(question, selected);
          return (
            <li key={question.id} className={styles.question}>
              <p className={styles.prompt}>
                <span className={`${styles.promptNumber} tabular-nums`} aria-hidden="true">
                  {questionIndex + 1}
                </span>
                <span className={styles.promptText}>{question.prompt}</span>
              </p>

              {isMultiple ? (
                <p className={styles.multiHint}>該当するものをすべて選んでください（複数選択）。</p>
              ) : null}

              <div
                className={styles.choices}
                role={isMultiple ? "group" : "radiogroup"}
                aria-label={question.prompt}
              >
                {question.choices.map((choice) => {
                  const isSelected = selected.includes(choice.id);
                  const isCorrectChoice = correctSet.has(choice.id);
                  const showCorrect = graded && isCorrectChoice;
                  const showIncorrect = graded && isSelected && !isCorrectChoice;
                  const choiceClassName = [
                    styles.choice,
                    isSelected && !graded ? styles.choiceSelected : "",
                    showCorrect ? styles.choiceCorrect : "",
                    showIncorrect ? styles.choiceIncorrect : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <label key={choice.id} className={choiceClassName}>
                      <input
                        type={isMultiple ? "checkbox" : "radio"}
                        className={styles.choiceInput}
                        name={`quiz-${archiveId}-${question.id}`}
                        value={choice.id}
                        checked={isSelected}
                        disabled={graded}
                        onChange={() =>
                          isMultiple
                            ? handleToggleMultiple(question.id, choice.id)
                            : handleSelectSingle(question.id, choice.id)
                        }
                      />
                      <span className={styles.choiceText}>{choice.text}</span>
                    </label>
                  );
                })}
              </div>

              {graded ? (
                <div className={styles.feedback}>
                  <span
                    className={
                      questionCorrect
                        ? `${styles.verdict} ${styles.verdictCorrect}`
                        : `${styles.verdict} ${styles.verdictIncorrect}`
                    }
                  >
                    {questionCorrect ? "正解" : "不正解"}
                  </span>
                  {question.explanation ? (
                    <p className={styles.explanation}>{question.explanation}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {graded ? (
        <div className={passed ? `${styles.result} ${styles.resultPassed}` : styles.result} role="status">
          <p className={`${styles.score} tabular-nums`}>
            スコア: {correctCount} / {totalCount}（{scorePercent}%）
          </p>
          <p className={styles.resultMessage}>
            {passed
              ? "合格です。このアーカイブを修了として記録しました。"
              : `あと一歩です。正答率${Math.round(quiz.passThreshold * 100)}%以上で合格になります。`}
          </p>
        </div>
      ) : null}

      <div className={styles.actions}>
        {graded ? (
          <Button onClick={handleRetry}>もう一度挑戦する</Button>
        ) : (
          <Button onClick={handleGrade} disabled={!allAnswered}>
            採点する
          </Button>
        )}
        {!graded ? (
          <span className={`${styles.progressNote} tabular-nums`}>
            回答済み {answeredCount} / {totalCount}
          </span>
        ) : null}
      </div>
    </section>
  );
}
