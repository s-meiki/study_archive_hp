import type { AnnualMeeting } from "../site-data";

// site-data.ts の AnnualMeeting 型には venue が定義されていないが、実データには含まれる。
// site-data.ts は変更禁止のため、ここでローカルに拡張して読み取る。
type MeetingRecord = AnnualMeeting & { venue?: string; city?: string };

export type UpcomingMeetingView = {
  id: string;
  eventName: string;
  dateLabel: string;
  venue?: string;
  /** 今日時点で受付中の registration マイルストーン（例: 「事前参加登録 受付中」） */
  openMilestoneLabel?: string;
};

function formatMeetingDates(startDate: string, endDate?: string): string {
  if (!endDate || endDate === startDate) {
    return startDate;
  }
  if (endDate.slice(0, 7) === startDate.slice(0, 7)) {
    return `${startDate}〜${endDate.slice(8)}`;
  }
  return `${startDate}〜${endDate}`;
}

function isRegistrationOpen(
  milestone: NonNullable<AnnualMeeting["milestones"]>[number],
  todayIso: string
): boolean {
  if (milestone.category !== "registration" || !milestone.startDate) {
    return false;
  }
  if (milestone.startDate > todayIso) {
    return false;
  }
  return !milestone.endDate || todayIso <= milestone.endDate;
}

function findOpenRegistration(meeting: AnnualMeeting, todayIso: string) {
  return meeting.milestones?.find((milestone) => isRegistrationOpen(milestone, todayIso));
}

function toView(meeting: MeetingRecord, todayIso: string): UpcomingMeetingView {
  const openRegistration = findOpenRegistration(meeting, todayIso);
  return {
    id: meeting.id,
    eventName: meeting.eventName,
    dateLabel: formatMeetingDates(meeting.startDate ?? "", meeting.endDate),
    venue: meeting.venue,
    openMilestoneLabel: openRegistration ? `${openRegistration.label} 受付中` : undefined
  };
}

/**
 * ホームの学会カレンダー導線に出す1件を選ぶ。
 * 今日以降に開催が終わっていない学会のうち開催日が最も近いものを返し、
 * その学会で registration マイルストーンが受付中なら受付中ラベルを添える。
 * （受付中の学会は必ず開催前なので、開催日基準の選定に包含される）
 */
export function pickUpcomingMeeting(
  meetings: AnnualMeeting[],
  todayIso: string
): UpcomingMeetingView | null {
  const upcoming = meetings
    .filter((meeting) => meeting.status !== "past" && Boolean(meeting.startDate))
    .filter((meeting) => (meeting.endDate ?? meeting.startDate ?? "") >= todayIso)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));

  const nearest = upcoming[0] as MeetingRecord | undefined;
  return nearest ? toView(nearest, todayIso) : null;
}
