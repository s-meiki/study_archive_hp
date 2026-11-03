"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ClockIcon, MagnifyingGlassIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import { RecordingFrame } from "../components/recording-frame";
import type { WeeklyEdition } from "./weekly-edition";
import styles from "./weekly-picks.module.css";

type Pick = WeeklyEdition["picks"][number];

export default function WeeklyPicks({ edition }: { edition: WeeklyEdition }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Pick | null>(null);
  const [full, setFull] = useState(false);

  function openPick(pick: Pick) {
    setFull(false);
    setSelected(pick);
    dialog.current?.showModal();
  }

  return (
    <section className={styles.weekly} aria-labelledby="weekly-title">
      <div className={styles.issue}>
        <span lang="en">WEEKLY PICKS</span>
        <span>{edition.from.slice(5).replace("-", ".")} — {edition.through.slice(5).replace("-", ".")}</span>
      </div>
      <div className={styles.heading}>
        <h1 id="weekly-title">今週のピックアップ</h1>
        <Link href="/archives"><MagnifyingGlassIcon aria-hidden="true" size={16} />教材を探す</Link>
      </div>
      <p className={styles.lead}>ひと息ついたら、気になる話をひとつ。</p>
      <div className={styles.cards}>
        {edition.picks.map((pick, index) => (
          <button type="button" key={pick.id} className={index === 0 ? styles.hero : styles.compact}
            aria-haspopup="dialog" onClick={() => openPick(pick)}>
            {index > 0 && pick.thumbnailUrl && <img className={styles.thumb} src={pick.thumbnailUrl} alt="" />}
            <span className={styles.body}>
              <span className={styles.meta}>
                <span className={styles.tag}>{pick.category}</span>
                <span className={styles.time}><ClockIcon size={14} aria-hidden="true" />{pick.duration}</span>
              </span>
              <span className={styles.title}>{pick.lines.map(line => <span key={line}>{line}</span>)}</span>
              {index === 0 && (
                <span className={styles.byline}>
                  {pick.thumbnailUrl && pick.id === "archive-20260828-9a2c06e58a" && (
                    <span className={styles.portrait}><img src={pick.thumbnailUrl} alt="" /></span>
                  )}
                  <span>{pick.speaker && <b>講師　{pick.speaker}</b>}「{pick.source}」より</span>
                </span>
              )}
              <span className={styles.play}><PlayIcon size={16} weight="fill" aria-hidden="true" />この話から見る</span>
            </span>
          </button>
        ))}
      </div>
      <dialog ref={dialog} aria-labelledby="pick-player-title" className={styles.dialog} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className={styles.playerHead}>
              <div><small>{full ? "全編" : selected.range}</small>
                <h2 id="pick-player-title">{full ? selected.source : selected.chapter}</h2></div>
              <button type="button" aria-label="閉じてホームに戻る" onClick={() => dialog.current?.close()}>
                <XIcon size={20} aria-hidden="true" />
              </button>
            </div>
            <RecordingFrame key={full ? "full" : "chapter"} videoId={selected.videoId}
              title={full ? selected.source : selected.chapter}
              start={full ? undefined : selected.start} end={full ? undefined : selected.end} />
            <div className={styles.playerFoot}>
              <p>収録元　<Link href={`/archives/${selected.id}`}>{selected.source}</Link></p>
              {!full && <button type="button" onClick={() => setFull(true)}>全編を最初から見る</button>}
              <a href={`https://youtu.be/${selected.videoId}?t=${full ? 0 : selected.start}`}
                target="_blank" rel="noopener noreferrer">YouTubeで見る（別タブ）</a>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
