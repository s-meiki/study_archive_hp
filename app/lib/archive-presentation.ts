import thumbnails from "../../content/archive-thumbnails.json";
import type { SiteArchive } from "../site-data";

export type ArchivePresentation = {
  thumbnailUrl: string | null;
  recordingVideoId: string | null;
  learningOutcome: string;
  durationLabel: string;
  formatLabel: string;
};

export function getArchivePresentation(archive: SiteArchive): ArchivePresentation {
  const catalog = thumbnails as Record<string, { src: string; videoId: string }>;
  const thumbnail = catalog[archive.id];
  const hasRecording = Boolean(archive.assets?.recording && archive.links?.recording);
  let recordingVideoId: string | null = null;
  try {
    const url = new URL(archive.links?.recording ?? "");
    recordingVideoId = url.hostname === "youtu.be" ? url.pathname.slice(1)
      : ["youtube.com", "www.youtube.com"].includes(url.hostname) ? url.searchParams.get("v") : null;
  } catch { /* A missing or invalid recording must never reuse an old thumbnail. */ }
  if (!hasRecording || !recordingVideoId || !/^[A-Za-z0-9_-]{11}$/.test(recordingVideoId)) recordingVideoId = null;
  const hasMaterials = Boolean(
    (archive.assets?.slides && archive.links?.slides)
    || (archive.assets?.references && archive.links?.references)
  );
  const points = archive.detail?.keyPoints?.filter((point) => point.trim()) ?? [];
  const learningOutcome = points.length
    ? points.slice(0, 2).map((point) => point.replace(/[。．]+$/, "")).join("。") + "。"
    : archive.summary;
  const duration = archive.duration?.trim() ?? "";

  return {
    recordingVideoId,
    thumbnailUrl: hasRecording && thumbnail && thumbnail.videoId === recordingVideoId ? thumbnail.src : null,
    learningOutcome,
    durationLabel: /^(?:未記載|未確認|未定|不明|なし|-|—)?$/.test(duration) ? "" : duration,
    formatLabel: hasRecording ? "録画で学ぶ" : hasMaterials ? "資料・要点で学ぶ" : "要点・クイズで学ぶ"
  };
}
