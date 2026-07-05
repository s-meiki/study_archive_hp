"use client";

import { useLessonProgress, useRecordVisit } from "../learning/use-lesson-progress";
import type { LessonStatus } from "../learning/types";

type LessonProgressControlsProps = {
  archiveId?: string;
};

const STATUS_LABEL: Record<LessonStatus, string> = {
  unwatched: "未視聴",
  watched: "視聴済み",
  completed: "修了"
};

export default function LessonProgressControls({ archiveId }: LessonProgressControlsProps) {
  useRecordVisit(archiveId);
  const { status, markWatched, markCompleted, resetToUnwatched } = useLessonProgress(archiveId ?? "");

  if (!archiveId) {
    return null;
  }

  return (
    <div className="learn-progress-panel">
      <span
        className={`learn-status-badge${
          status === "completed" ? " learn-status-badge--completed" : ""
        }${status === "watched" ? " learn-status-badge--watched" : ""}`}
      >
        {STATUS_LABEL[status]}
      </span>

      <div className="learn-progress-actions">
        {status === "unwatched" ? (
          <button type="button" className="learn-btn-primary" onClick={markWatched}>
            視聴済みにする
          </button>
        ) : null}

        {status === "watched" ? (
          <>
            <button type="button" className="learn-btn-primary" onClick={markCompleted}>
              修了にする
            </button>
            <button type="button" className="learn-btn-text" onClick={resetToUnwatched}>
              未視聴に戻す
            </button>
          </>
        ) : null}

        {status === "completed" ? (
          <button type="button" className="learn-btn-text" onClick={resetToUnwatched}>
            未視聴に戻す
          </button>
        ) : null}
      </div>

      <p className="learn-progress-note">この進捗はこの端末のブラウザにのみ保存されます。</p>
    </div>
  );
}
