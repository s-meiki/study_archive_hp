"use client";

import { useProgress } from "../learning/progress-context";

type DashboardTheme = {
  id: string;
  name: string;
};

type DashboardArchive = {
  id: string;
  themeId: string;
  title: string;
  date?: string;
};

type ProgressDashboardProps = {
  themes: DashboardTheme[];
  archives: DashboardArchive[];
};

const archiveListUrl = "/";

function archiveHref(archiveId: string) {
  return `/archive?id=${encodeURIComponent(archiveId)}`;
}

export default function ProgressDashboard({ themes, archives }: ProgressDashboardProps) {
  const { state } = useProgress();

  const archiveById = new Map(archives.map((archive) => [archive.id, archive]));
  const lessonEntries = Object.entries(state.lessons);

  const watchedCount = lessonEntries.filter(
    ([, lesson]) => lesson.status === "watched" || lesson.status === "completed"
  ).length;
  const completedCount = lessonEntries.filter(([, lesson]) => lesson.status === "completed").length;
  const totalArchives = archives.length;

  const hasProgress = lessonEntries.length > 0;

  const continueArchive = state.lastVisited ? archiveById.get(state.lastVisited.archiveId) : undefined;

  const themeProgress = themes.map((theme) => {
    const themeArchives = archives.filter((archive) => archive.themeId === theme.id);
    const themeCompletedCount = themeArchives.filter((archive) => {
      const lesson = state.lessons[archive.id];
      return lesson?.status === "completed";
    }).length;
    const total = themeArchives.length;
    const rate = total > 0 ? Math.round((themeCompletedCount / total) * 100) : null;

    return {
      id: theme.id,
      name: theme.name,
      completedCount: themeCompletedCount,
      total,
      rate
    };
  });

  return (
    <div className="learn-dashboard">
      <section className="panel learn-header">
        <div className="section-kicker">Learning Dashboard</div>
        <h1>学習ダッシュボード</h1>
        <p className="learn-header-copy">これまでの視聴・修了状況をテーマ別に確認できます。</p>
      </section>

      {continueArchive ? (
        <section className="panel learn-continue-card" aria-labelledby="learn-continue-heading">
          <div className="section-kicker">続きから</div>
          <h2 id="learn-continue-heading" className="learn-continue-title">
            {continueArchive.title}
          </h2>
          <a className="button button-primary learn-continue-link" href={archiveHref(continueArchive.id)}>
            続きを見る
          </a>
        </section>
      ) : null}

      <section className="panel learn-summary" aria-labelledby="learn-summary-heading">
        <div className="section-kicker">全体サマリ</div>
        <h2 id="learn-summary-heading" className="learn-visually-hidden">
          全体サマリ
        </h2>
        <div className="learn-summary-grid">
          <div className="learn-summary-item">
            <span className="learn-summary-value">{watchedCount}</span>
            <span className="learn-summary-label">視聴済み</span>
          </div>
          <div className="learn-summary-item">
            <span className="learn-summary-value">{completedCount}</span>
            <span className="learn-summary-label">修了</span>
          </div>
          <div className="learn-summary-item">
            <span className="learn-summary-value">{totalArchives}</span>
            <span className="learn-summary-label">全アーカイブ数</span>
          </div>
        </div>
      </section>

      {hasProgress ? (
        <section className="panel learn-theme-section" aria-labelledby="learn-theme-heading">
          <div className="section-kicker">テーマ別進捗</div>
          <h2 id="learn-theme-heading" className="learn-visually-hidden">
            テーマ別進捗
          </h2>
          <ul className="learn-theme-list">
            {themeProgress.map((theme) => (
              <li className="learn-theme-progress" key={theme.id}>
                <div className="learn-theme-progress-head">
                  <span className="learn-theme-name">{theme.name}</span>
                  <span className="learn-theme-rate">
                    {theme.total > 0 ? `${theme.completedCount}/${theme.total}（${theme.rate}%）` : "対象なし"}
                  </span>
                </div>
                {theme.total > 0 ? (
                  <div className="learn-progress-bar" role="presentation">
                    <div className="learn-progress-bar-fill" style={{ width: `${theme.rate}%` }} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="panel learn-empty-state" aria-labelledby="learn-empty-heading">
          <h2 id="learn-empty-heading">まだ学習記録がありません</h2>
          <p className="learn-empty-copy">
            アーカイブを視聴すると、ここに進捗が表示されるようになります。まずは気になる回から始めてみましょう。
          </p>
          <a className="button button-primary learn-empty-link" href={archiveListUrl}>
            アーカイブ一覧を見る
          </a>
        </section>
      )}

      <p className="learn-storage-note">進捗はこの端末のブラウザに保存されます。</p>
    </div>
  );
}
