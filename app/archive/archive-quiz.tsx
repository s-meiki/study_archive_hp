"use client";

import { useState } from "react";
import { useProgress } from "../learning/progress-context";
import { useLessonProgress } from "../learning/use-lesson-progress";
import type { ArchiveQuiz as ArchiveQuizType, LessonProgress } from "../learning/types";

type ArchiveQuizProps = {
  archiveId: string;
  quiz: ArchiveQuizType | null;
};

type AnswerMap = Record<string, string>;

export default function ArchiveQuiz({ archiveId, quiz }: ArchiveQuizProps) {
  const { update } = useProgress();
  const { status, markCompleted } = useLessonProgress(archiveId);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [graded, setGraded] = useState(false);

  if (!quiz) {
    return (
      <section className="panel learn-quiz-panel learn-quiz-pending">
        <div className="section-kicker">Quiz</div>
        <h2>確認クイズ</h2>
        <p className="learn-quiz-pending-copy">確認クイズは準備中です。</p>
      </section>
    );
  }

  // quiz は null ガードで絞り込み済みだが、下位クロージャに narrowing が届かないため const に確定させる。
  const activeQuiz = quiz;
  const questions = activeQuiz.questions;
  const totalCount = questions.length;
  const answeredCount = questions.filter((question) => answers[question.id] != null).length;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  const correctCount = questions.filter(
    (question) => answers[question.id] === question.answerId
  ).length;
  const score = totalCount > 0 ? correctCount / totalCount : 0;
  const scorePercent = Math.round(score * 100);
  const passed = graded && score >= activeQuiz.passThreshold;

  function handleSelect(questionId: string, choiceId: string) {
    if (graded) {
      return;
    }
    setAnswers((current) => ({ ...current, [questionId]: choiceId }));
  }

  function handleGrade() {
    if (!allAnswered) {
      return;
    }

    const nextCorrect = questions.filter(
      (question) => answers[question.id] === question.answerId
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
      return {
        ...current,
        lessons: { ...current.lessons, [archiveId]: nextLesson }
      };
    });

    // 合格かつ未修了のときだけ修了に更新する（冪等: 既に completed なら completedAt を上書きしない）。
    if (nextScore >= activeQuiz.passThreshold && status !== "completed") {
      markCompleted();
    }

    setGraded(true);
  }

  function handleRetry() {
    setAnswers({});
    setGraded(false);
  }

  return (
    <section className="panel learn-quiz-panel">
      <div className="section-kicker">Quiz</div>
      <h2>確認クイズ</h2>
      <p className="learn-quiz-intro">
        全{totalCount}問に回答すると採点できます。正答率{Math.round(activeQuiz.passThreshold * 100)}%以上で修了です。
      </p>

      <ol className="learn-quiz-question-list">
        {questions.map((question, questionIndex) => {
          const selectedId = answers[question.id];
          return (
            <li key={question.id} className="learn-quiz-question">
              <p className="learn-quiz-prompt">
                <span className="learn-quiz-prompt-number">{questionIndex + 1}</span>
                <span className="learn-quiz-prompt-text">{question.prompt}</span>
              </p>

              <div className="learn-quiz-choices" role="radiogroup" aria-label={question.prompt}>
                {question.choices.map((choice) => {
                  const isSelected = selectedId === choice.id;
                  const isCorrectChoice = choice.id === question.answerId;
                  const showCorrect = graded && isCorrectChoice;
                  const showIncorrect = graded && isSelected && !isCorrectChoice;
                  const choiceClassName = [
                    "learn-quiz-choice",
                    showCorrect ? "learn-quiz-choice--correct" : "",
                    showIncorrect ? "learn-quiz-choice--incorrect" : ""
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <label key={choice.id} className={choiceClassName}>
                      <input
                        type="radio"
                        className="learn-quiz-radio"
                        name={`quiz-${archiveId}-${question.id}`}
                        value={choice.id}
                        checked={isSelected}
                        disabled={graded}
                        onChange={() => handleSelect(question.id, choice.id)}
                      />
                      <span className="learn-quiz-choice-text">{choice.text}</span>
                    </label>
                  );
                })}
              </div>

              {graded ? (
                <div className="learn-quiz-feedback">
                  <span
                    className={`learn-quiz-verdict${
                      selectedId === question.answerId
                        ? " learn-quiz-verdict--correct"
                        : " learn-quiz-verdict--incorrect"
                    }`}
                  >
                    {selectedId === question.answerId ? "正解" : "不正解"}
                  </span>
                  {question.explanation ? (
                    <p className="learn-quiz-explanation">{question.explanation}</p>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {graded ? (
        <div
          className={`learn-quiz-result${passed ? " learn-quiz-result--passed" : ""}`}
          role="status"
        >
          <p className="learn-quiz-score">
            スコア: {correctCount} / {totalCount}（{scorePercent}%）
          </p>
          <p className="learn-quiz-result-message">
            {passed
              ? "合格です。このアーカイブを修了として記録しました。"
              : `あと一歩です。正答率${Math.round(activeQuiz.passThreshold * 100)}%以上で合格になります。`}
          </p>
        </div>
      ) : null}

      <div className="learn-quiz-actions">
        {graded ? (
          <button type="button" className="learn-btn-primary" onClick={handleRetry}>
            もう一度挑戦する
          </button>
        ) : (
          <button
            type="button"
            className="learn-btn-primary"
            onClick={handleGrade}
            disabled={!allAnswered}
          >
            採点する
          </button>
        )}
        {!graded ? (
          <span className="learn-quiz-progress-note">
            回答済み {answeredCount} / {totalCount}
          </span>
        ) : null}
      </div>
    </section>
  );
}
