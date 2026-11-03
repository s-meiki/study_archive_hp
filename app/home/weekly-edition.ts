import type { SiteArchive } from "../site-data";
import { getArchivePresentation } from "../lib/archive-presentation";

const edition = {
  from: "2026-11-02",
  through: "2026-11-08",
  picks: [
    {
      id: "archive-20260828-9a2c06e58a",
      chapter: "取れなかった認定もある",
      lines: ["取れなかった", "認定もある"],
      category: "キャリア",
      source: "薬剤師キャリアの描き方"
    },
    {
      id: "archive-20260515-oioyea",
      chapter: "ポリファーマシーと継続・中止の判断",
      lines: ["入院時、どの薬を続ける？"],
      category: "病棟業務",
      source: "病棟薬剤師の仕事と点数のはなし"
    }
  ]
};

function chapterSeconds(time?: string) {
  if (!time || !/^\d+:[0-5]\d$/.test(time)) return NaN;
  const [minutes, seconds] = time.split(":").map(Number);
  return minutes * 60 + seconds;
}

export function getWeeklyEdition(archives: Map<string, SiteArchive>, today: string) {
  if (today < edition.from || today > edition.through) return null;

  const picks = edition.picks.flatMap((pick) => {
    const archive = archives.get(pick.id);
    if (!archive) return [];
    const { recordingVideoId, thumbnailUrl } = getArchivePresentation(archive);
    const chapters = archive.detail?.chapters ?? [];
    const index = chapters.findIndex((item) => item.label === pick.chapter);
    if (!recordingVideoId || index < 0) return [];
    const start = chapterSeconds(chapters[index].time);
    const end = chapterSeconds(chapters[index + 1]?.time);
    if (!(end > start)) return [];
    const length = end - start;
    return [{
      ...pick, videoId: recordingVideoId, thumbnailUrl, speaker: archive.speaker, start, end,
      range: `${chapters[index].time} 〜 ${chapters[index + 1].time}`,
      duration: `${Math.floor(length / 60)}分${length % 60}秒`
    }];
  });

  return picks.length ? { from: edition.from, through: edition.through, picks } : null;
}

export type WeeklyEdition = NonNullable<ReturnType<typeof getWeeklyEdition>>;
