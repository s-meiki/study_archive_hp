#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "public/data/annual-meetings-2026.js");
const DRY_RUN = process.argv.includes("--dry-run");

function toIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeText(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#12288;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRange(text, pattern) {
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const startMonth = Number(match[2]);
  const startDay = Number(match[3]);
  const endYear = Number(match[4] || match[1]);
  const endMonth = Number(match[5]);
  const endDay = Number(match[6]);

  return {
    startDate: toIsoDate(startYear, startMonth, startDay),
    endDate: toIsoDate(endYear, endMonth, endDay),
  };
}

function extractSection(text, startPattern, endPattern) {
  const startMatch = text.match(startPattern);

  if (!startMatch || typeof startMatch.index !== "number") {
    return "";
  }

  const tail = text.slice(startMatch.index);
  const endMatch = tail.match(endPattern);

  if (!endMatch || typeof endMatch.index !== "number") {
    return tail;
  }

  return tail.slice(0, endMatch.index);
}

function extractAllJapaneseDates(text) {
  return [...String(text ?? "").matchAll(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/gu)].map((match) => ({
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }));
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "study-archive-hp/1.0 (+https://localhost)",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return {
      html,
      text: normalizeText(html),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function loadAnnualMeetingData(raw) {
  const context = { window: {} };
  vm.createContext(context);
  new vm.Script(raw, { filename: "public/data/annual-meetings-2026.js" }).runInContext(context);
  return context.window.ANNUAL_MEETINGS_2026_DATA;
}

function serializeData(data) {
  return `window.ANNUAL_MEETINGS_2026_DATA = ${JSON.stringify(data, null, 2)};\n`;
}

async function refreshClinicalEmergency29() {
  const [abstractPage, registrationPage] = await Promise.all([
    fetchPage("https://site.convention.co.jp/jsem29/abstract/"),
    fetchPage("https://site.convention.co.jp/jsem29/registration/"),
  ]);

  const abstractSection = extractSection(abstractPage.text, /演題募集期間/u, /応募資格/u);
  const abstractDates = extractAllJapaneseDates(abstractSection);

  const abstractRange =
    abstractDates.length >= 2
      ? {
          startDate: toIsoDate(abstractDates[0].year, abstractDates[0].month, abstractDates[0].day),
          endDate: toIsoDate(
            abstractDates[abstractDates.length - 1].year,
            abstractDates[abstractDates.length - 1].month,
            abstractDates[abstractDates.length - 1].day,
          ),
        }
      : null;

  if (!abstractRange) {
    throw new Error("clinical-emergency-29: 演題募集期間を抽出できませんでした。");
  }

  return [
    {
      id: "clinical-emergency-29-abstract",
      label: "演題募集",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
      note: abstractPage.text.includes("締め切りました")
        ? "公式ページでは締切済みと案内されています。"
        : "",
    },
    {
      id: "clinical-emergency-29-registration",
      label: "参加登録",
      category: "registration",
      note: registrationPage.text.includes("公開に向け準備中")
        ? "公式ページでは参加登録の案内は準備中です。"
        : "公式ページを確認してください。",
    },
  ];
}

async function refreshMedicalPharmacyForum2026() {
  const [abstractPage, registrationPage] = await Promise.all([
    fetchPage("https://www.k-gakkai.jp/cps2026/abstract.html"),
    fetchPage("https://www.k-gakkai.jp/cps2026/registration.html"),
  ]);

  const abstractRange = extractRange(
    abstractPage.text,
    /演題募集期間[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );

  if (!abstractRange) {
    throw new Error("medical-pharmacy-forum-2026: 演題募集期間を抽出できませんでした。");
  }

  return [
    {
      id: "medical-pharmacy-forum-2026-abstract",
      label: "演題募集",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
    },
    {
      id: "medical-pharmacy-forum-2026-registration",
      label: "参加登録",
      category: "registration",
      note: /準備中/u.test(registrationPage.html)
        ? "公式ページでは参加登録は準備中です。"
        : "公式ページを確認してください。",
    },
  ];
}

async function refreshTdm42() {
  const page = await fetchPage("https://kwcs.jp/tdm2026/entyou.html");
  const abstractRange = extractRange(
    page.text,
    /演題募集期間[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );

  if (!abstractRange) {
    throw new Error("tdm-42: 演題募集期間を抽出できませんでした。");
  }

  return [
    {
      id: "tdm-42-abstract",
      label: "演題募集",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
      note: page.text.includes("締切延長")
        ? "公式案内では締切延長後の期間として掲載されています。"
        : "",
    },
  ];
}

async function refreshJasds12() {
  const [abstractPage, registrationPage] = await Promise.all([
    fetchPage("https://www.jasds2026.org/abstract.html"),
    fetchPage("https://www.jasds2026.org/registration.html"),
  ]);

  const abstractRange = extractRange(
    abstractPage.text,
    /演題募集期間[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );
  const earlyRange = extractRange(
    registrationPage.text,
    /早期参加登録[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );
  const lateRange = extractRange(
    registrationPage.text,
    /後期[／/]当日参加登録[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );

  if (!abstractRange || !earlyRange || !lateRange) {
    throw new Error("jasds-12: 演題募集または参加登録期間を抽出できませんでした。");
  }

  return [
    {
      id: "jasds-12-abstract",
      label: "演題募集",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
    },
    {
      id: "jasds-12-registration-early",
      label: "早期参加登録",
      category: "registration",
      startDate: earlyRange.startDate,
      endDate: earlyRange.endDate,
    },
    {
      id: "jasds-12-registration-late",
      label: "後期/当日参加登録",
      category: "registration",
      startDate: lateRange.startDate,
      endDate: lateRange.endDate,
    },
  ];
}

const REFRESHERS = [
  ["clinical-emergency-29", refreshClinicalEmergency29],
  ["medical-pharmacy-forum-2026", refreshMedicalPharmacyForum2026],
  ["tdm-42", refreshTdm42],
  ["jasds-12", refreshJasds12],
];

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = loadAnnualMeetingData(raw);
  const resultById = new Map();

  for (const [meetingId, refresh] of REFRESHERS) {
    resultById.set(meetingId, await refresh());
  }

  data.verifiedAt = new Date().toISOString().slice(0, 10);
  data.meetings = data.meetings.map((meeting) => {
    if (!resultById.has(meeting.id)) {
      return meeting;
    }

    return {
      ...meeting,
      milestones: resultById.get(meeting.id),
    };
  });

  const output = serializeData(data);

  if (DRY_RUN) {
    process.stdout.write(output);
    return;
  }

  await fs.writeFile(DATA_PATH, output, "utf8");

  for (const [meetingId, milestones] of resultById) {
    const labels = milestones
      .map((item) => {
        if (item.startDate && item.endDate) {
          return `${item.label}: ${item.startDate} - ${item.endDate}`;
        }

        return `${item.label}: ${item.note || "要確認"}`;
      })
      .join(" / ");

    process.stdout.write(`${meetingId}: ${labels}\n`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
