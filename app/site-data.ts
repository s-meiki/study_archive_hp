import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

export type SiteTheme = {
  id: string;
  name: string;
  summary?: string;
};

export type SiteArchive = {
  id: string;
  themeId: string;
  title: string;
  summary: string;
  speaker?: string;
  date?: string;
  startAt?: string;
  endAt?: string;
  updatedAt?: string;
  duration?: string;
  featured?: boolean;
  assets?: {
    recording?: boolean;
    slides?: boolean;
    notes?: boolean;
    references?: boolean;
  };
  links?: {
    recording?: string;
    slides?: string;
    notes?: string;
    references?: string;
  };
};

export type SiteContent = {
  themes: SiteTheme[];
  archives: SiteArchive[];
};

export type AnnualMeeting = {
  id: string;
  eventName: string;
  society: string;
  primaryUrl?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  note?: string;
  milestones?: Array<{
    id: string;
    label: string;
    category?: "abstract" | "registration" | "deadline" | "info";
    startDate?: string;
    endDate?: string;
    note?: string;
  }>;
};

export type AnnualMeetingsData = {
  fiscalYear: string;
  period: {
    start: string;
    end: string;
  };
  verifiedAt: string;
  meetings: AnnualMeeting[];
};

async function readWindowAssignedJson<T>(relativePath: string, variableName: string) {
  const filePath = path.join(process.cwd(), relativePath);
  const raw = await readFile(filePath, "utf8");
  const propertyName = variableName.replace(/^window\./, "");
  const context = {
    window: {}
  };

  vm.createContext(context);
  new vm.Script(raw, { filename: relativePath }).runInContext(context);

  return (context.window as Record<string, T>)[propertyName];
}

let siteContentPromise: Promise<SiteContent> | null = null;
let annualMeetingsPromise: Promise<AnnualMeetingsData> | null = null;

export function loadSiteContent() {
  siteContentPromise ??= readWindowAssignedJson<SiteContent>("public/data/site-content.js", "window.STUDY_ARCHIVE_DATA");
  return siteContentPromise;
}

export function loadAnnualMeetingsData() {
  annualMeetingsPromise ??= readWindowAssignedJson<AnnualMeetingsData>(
    "public/data/annual-meetings-2026.js",
    "window.ANNUAL_MEETINGS_2026_DATA"
  );
  return annualMeetingsPromise;
}

export async function findArchiveById(archiveId: string) {
  if (!archiveId) {
    return null;
  }

  const data = await loadSiteContent();
  return data.archives.find((archive) => archive.id === archiveId) ?? null;
}
