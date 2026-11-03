import type { Ref } from "react";

type RecordingFrameProps = {
  videoId: string;
  title: string;
  ref?: Ref<HTMLIFrameElement>;
  start?: number;
  end?: number;
};

export function RecordingFrame({ videoId, title, ref, start, end }: RecordingFrameProps) {
  const options = new URLSearchParams({ autoplay: "1", playsinline: "1", rel: "0" });
  if (start !== undefined) options.set("start", String(start));
  if (end !== undefined) options.set("end", String(end));

  return (
    <iframe
      ref={ref}
      src={`https://www.youtube-nocookie.com/embed/${videoId}?${options}`}
      title={`${title}の動画プレーヤー`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
