"use client";

import { useState } from "react";
import type { AnnualMeeting, AnnualMeetingsData } from "../site-data";
import { Badge } from "../ui/badge";
import { EmptyState } from "../ui/empty-state";
import type { MilestoneCountdown } from "./meetings-lib";
import {
  buildListGroups,
  formatDateRange,
  formatPeriodLabel,
  isPastMeeting,
  milestoneCountdown,
  milestoneLabel,
  milestoneWindow,
  normalizeExternalUrl,
  resolveMeetingUrl
} from "./meetings-lib";
import styles from "./list-view.module.css";

type ListViewProps = {
  data: AnnualMeetingsData;
  today: string;
};

function MeetingMedia({ item, url }: { item: AnnualMeeting; url: string }) {
  const imageUrl = normalizeExternalUrl(item.imageUrl);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  const content = showImage ? (
    <img
      className={item.imageFit === "contain" ? `${styles.mediaImage} ${styles.mediaContain}` : styles.mediaImage}
      src={imageUrl}
      alt={`${item.eventName} 公式画像`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={styles.mediaFallback}>{item.society}</span>
  );

  if (!url) {
    return <div className={styles.media}>{content}</div>;
  }

  return (
    <a
      className={styles.media}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.eventName}の公式サイトを開く`}
    >
      {content}
    </a>
  );
}

function CountdownBadge({ countdown }: { countdown: MilestoneCountdown }) {
  if (countdown.kind === "remaining") {
    return (
      <Badge variant="status" status="success">
        {countdown.days === 0 ? "本日まで" : `あと${countdown.days}日`}
      </Badge>
    );
  }

  return <Badge>{`${countdown.days}日後に開始`}</Badge>;
}

function MeetingCard({ item, today }: { item: AnnualMeeting; today: string }) {
  const url = resolveMeetingUrl(item);
  const isPast = isPastMeeting(item);
  const isPending = item.status === "pending";
  const cardClasses = [styles.card];

  if (isPast) {
    cardClasses.push(styles.cardPast);
  }

  if (isPending) {
    cardClasses.push(styles.cardPending);
  }

  const milestones = item.milestones ?? [];
  const sourceLinks = (item.sources ?? [])
    .map((source) => ({ label: source.label || "参照リンク", url: normalizeExternalUrl(source.url) }))
    .filter((source) => source.url);
  const showBadges = (item.scope === "local" && item.city) || isPending || isPast;

  return (
    <article className={cardClasses.join(" ")}>
      <MeetingMedia item={item} url={url} />
      <div className={styles.body}>
        {showBadges ? (
          <div className={styles.badges}>
            {item.scope === "local" && item.city ? <Badge>{item.city}</Badge> : null}
            {isPending ? (
              <Badge variant="status" status="warning">
                未公表
              </Badge>
            ) : null}
            {isPast ? <Badge>終了</Badge> : null}
          </div>
        ) : null}

        <h3 className={styles.title}>
          {url ? (
            <a href={url} target="_blank" rel="noopener noreferrer">
              {item.eventName}
            </a>
          ) : (
            item.eventName
          )}
        </h3>

        <dl className={styles.facts}>
          <div>
            <dt>開催日時</dt>
            <dd className="tabular-nums">{formatDateRange(item)}</dd>
          </div>
          <div>
            <dt>開催場所</dt>
            <dd>{item.venue ? `${item.venue}${item.city ? ` / ${item.city}` : ""}` : "会場未公表"}</dd>
          </div>
          {item.theme ? (
            <div>
              <dt>テーマ</dt>
              <dd>{item.theme}</dd>
            </div>
          ) : null}
          {item.lead ? (
            <div>
              <dt>{item.leadLabel || "会長"}</dt>
              <dd>{item.lead}</dd>
            </div>
          ) : null}
        </dl>

        {milestones.length > 0 ? (
          <ul className={styles.milestones}>
            {milestones.map((milestone) => {
              const window = milestoneWindow(milestone);
              const countdown = milestoneCountdown(milestone, today);

              return (
                <li key={milestone.id} className={styles.milestone}>
                  <span className={styles.milestoneLabel}>{milestoneLabel(milestone)}</span>
                  <span className={`${styles.milestonePeriod} tabular-nums`}>
                    {window ? formatPeriodLabel(window.startDate, window.endDate) : "日程調整中"}
                  </span>
                  {countdown ? <CountdownBadge countdown={countdown} /> : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {item.note ? <p className={styles.note}>{item.note}</p> : null}

        {sourceLinks.length > 0 ? (
          <div className={styles.sources}>
            <span className={styles.sourcesLabel}>情報源</span>
            <ul className={styles.sourcesList}>
              {sourceLinks.map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ListView({ data, today }: ListViewProps) {
  const groups = buildListGroups(data.meetings, data.period);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="学会情報がまだありません"
        description="学会年会の情報が公開されると、ここに一覧が表示されます。"
      />
    );
  }

  return (
    <div className={styles.listView}>
      {groups.map((group) => (
        <section key={group.label} className={styles.group} aria-label={group.label}>
          <h2 className={`${styles.groupHeading} tabular-nums`}>{group.label}</h2>
          <div className={styles.cardsGrid}>
            {group.items.map((item) => (
              <MeetingCard key={item.id} item={item} today={today} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
