"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircleIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import styles from "./archive-recording.module.css";

export default function ArchiveRecording({ videoId, title, thumbnailUrl, recordingUrl }: {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  recordingUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  const player = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playing) player.current?.focus();
  }, [playing]);

  return (
    <div className={styles.recording}>
      <div className={styles.screen}>
        {playing ? (
          <iframe
            ref={player}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
            title={`${title}の動画プレーヤー`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button type="button" className={styles.poster} onClick={() => setPlaying(true)} aria-label={`${title}をこのページで再生`}>
            {thumbnailUrl ? <img src={thumbnailUrl} alt={`${title}の動画サムネイル`} width={480} height={360} fetchPriority="high" /> : null}
            <span className={styles.play}><PlayCircleIcon size={44} weight="fill" aria-hidden="true" />このページで再生</span>
          </button>
        )}
      </div>
      <div className={styles.caption}>
        <span>{playing ? "再生できない場合はYouTubeでご覧ください。" : "再生するとYouTubeに接続します。"}</span>
        <a href={recordingUrl} target="_blank" rel="noopener noreferrer">YouTubeで見る<ArrowSquareOutIcon size={16} aria-hidden="true" /><span className="visually-hidden">（新しいタブで開く）</span></a>
      </div>
    </div>
  );
}
