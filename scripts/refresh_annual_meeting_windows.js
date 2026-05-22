#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "public/data/annual-meetings-2026.js");
const DRY_RUN = process.argv.includes("--dry-run");
const VERIFIED_AT_ARG = process.argv.find((arg) => arg.startsWith("--verified-at="));
const VERIFIED_AT = VERIFIED_AT_ARG ? VERIFIED_AT_ARG.split("=").slice(1).join("=") : todayInTokyo();

if (!/^\d{4}-\d{2}-\d{2}$/.test(VERIFIED_AT)) {
  throw new Error("--verified-at は YYYY-MM-DD 形式で指定してください。");
}

function todayInTokyo() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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
  return extractJapaneseDateMentions(text);
}

function extractJapaneseDateMentions(text, { defaultYear = null, defaultMonth = null } = {}) {
  let currentYear = defaultYear ? Number(defaultYear) : null;
  let currentMonth = defaultMonth ? Number(defaultMonth) : null;

  return [
    ...String(text ?? "").matchAll(/(?:(\d{4})年\s*)?(?:(\d{1,2})月\s*)?(\d{1,2})日/gu),
  ]
    .map((match) => {
      if (match[1]) {
        currentYear = Number(match[1]);
      }

      if (match[2]) {
        currentMonth = Number(match[2]);
      }

      if (!currentYear || !currentMonth) {
        return null;
      }

      return {
        year: currentYear,
        month: currentMonth,
        day: Number(match[3]),
      };
    })
    .filter(Boolean);
}

function toRangeFromDates(dates) {
  if (dates.length < 2) {
    return null;
  }

  return {
    startDate: toIsoDate(dates[0].year, dates[0].month, dates[0].day),
    endDate: toIsoDate(dates[dates.length - 1].year, dates[dates.length - 1].month, dates[dates.length - 1].day),
  };
}

function extractRangeFromSection(text, startPattern, endPattern, options = {}) {
  const section = extractSection(text, startPattern, endPattern);
  return toRangeFromDates(extractJapaneseDateMentions(section, options));
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

  const abstractRange = extractRangeFromSection(abstractPage.text, /演題募集期間/u, /応募資格/u, {
    defaultYear: 2026,
  });

  if (!abstractRange) {
    throw new Error("clinical-emergency-29: 演題募集期間を抽出できませんでした。");
  }

  const registrationRange = extractRangeFromSection(registrationPage.text, /参加登録期間/u, /銀行振込受付期間/u, {
    defaultYear: 2026,
  });

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
      ...(registrationRange
        ? {
            startDate: registrationRange.startDate,
            endDate: registrationRange.endDate,
          }
        : {
            note: registrationPage.text.includes("公開に向け準備中")
              ? "公式ページでは参加登録の案内は準備中です。"
              : "公式ページを確認してください。",
          }),
    },
  ];
}

async function refreshHokkaidoPharma73() {
  const registrationPage = await fetchPage("https://www.c-linkage.co.jp/yakugakutaikai73/registration.html");

  const advanceRange = extractRangeFromSection(registrationPage.text, /事前参加登録/u, /直前参加登録/u, {
    defaultYear: 2026,
  });
  const lateRange = extractRangeFromSection(registrationPage.text, /直前参加登録/u, /当日参加登録/u, {
    defaultYear: 2026,
  });
  const onsiteRange = extractRangeFromSection(registrationPage.text, /当日参加登録/u, /参加登録費/u, {
    defaultYear: 2026,
  });

  if (!advanceRange || !lateRange || !onsiteRange) {
    throw new Error("hokkaido-pharma-73: 参加登録期間を抽出できませんでした。");
  }

  return [
    {
      id: "hokkaido-pharma-73-registration-advance",
      label: "事前参加登録",
      category: "registration",
      startDate: advanceRange.startDate,
      endDate: advanceRange.endDate,
    },
    {
      id: "hokkaido-pharma-73-registration-late",
      label: "直前参加登録",
      category: "registration",
      startDate: lateRange.startDate,
      endDate: lateRange.endDate,
    },
    {
      id: "hokkaido-pharma-73-registration-onsite",
      label: "当日参加登録",
      category: "registration",
      startDate: onsiteRange.startDate,
      endDate: onsiteRange.endDate,
    },
  ];
}

async function refreshMedicalPharmacyForum2026() {
  const [abstractPage, registrationPage] = await Promise.all([
    fetchPage("https://www.k-gakkai.jp/cps2026/abstract.html"),
    fetchPage("https://www.k-gakkai.jp/cps2026/registration.html"),
  ]);

  const abstractRange = extractRangeFromSection(abstractPage.text, /演題募集期間/u, /演題応募資格/u, {
    defaultYear: 2026,
  });
  const advanceRange = extractRangeFromSection(registrationPage.text, /事前参加登録/u, /直前・当日参加登録/u, {
    defaultYear: 2026,
  });
  const onsiteRange = extractRangeFromSection(registrationPage.text, /直前・当日参加登録/u, /参加登録・支払方法/u, {
    defaultYear: 2026,
  });

  if (!abstractRange || !advanceRange || !onsiteRange) {
    throw new Error("medical-pharmacy-forum-2026: 演題募集または参加登録期間を抽出できませんでした。");
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
      id: "medical-pharmacy-forum-2026-registration-advance",
      label: "事前参加登録",
      category: "registration",
      startDate: advanceRange.startDate,
      endDate: advanceRange.endDate,
    },
    {
      id: "medical-pharmacy-forum-2026-registration-onsite",
      label: "直前・当日参加登録",
      category: "registration",
      startDate: onsiteRange.startDate,
      endDate: onsiteRange.endDate,
    },
  ];
}

async function refreshTdm42() {
  const [page, registrationPage] = await Promise.all([
    fetchPage("https://kwcs.jp/tdm2026/entyou.html"),
    fetchPage("https://kwcs.jp/tdm2026/reg.html"),
  ]);
  const abstractRange = extractRange(
    page.text,
    /演題募集期間[^0-9]*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日[^0-9]*[～〜]\s*(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})日/u,
  );
  const earlyRange = extractRangeFromSection(registrationPage.text, /早期/u, /通常/u, {
    defaultYear: 2026,
  });
  const standardRange = extractRangeFromSection(registrationPage.text, /通常/u, /参加費/u, {
    defaultYear: 2026,
  });

  if (!abstractRange || !earlyRange || !standardRange) {
    throw new Error("tdm-42: 演題募集または参加登録期間を抽出できませんでした。");
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
    {
      id: "tdm-42-registration-early",
      label: "早期参加登録",
      category: "registration",
      startDate: earlyRange.startDate,
      endDate: earlyRange.endDate,
    },
    {
      id: "tdm-42-registration-standard",
      label: "通常参加登録",
      category: "registration",
      startDate: standardRange.startDate,
      endDate: standardRange.endDate,
    },
  ];
}

async function refreshJsct48() {
  const [abstractPage, registrationPage] = await Promise.all([
    fetchPage("https://jsct48.jp/abstract.html"),
    fetchPage("https://jsct48.jp/registration.html"),
  ]);
  const abstractRange = extractRangeFromSection(abstractPage.text, /募集期間/u, /発表資格/u, {
    defaultYear: 2026,
  });

  if (!abstractRange) {
    throw new Error("jsct-48: 演題募集期間を抽出できませんでした。");
  }

  return [
    {
      id: "jsct-48-abstract",
      label: "演題募集",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
      note: abstractPage.text.includes("終了いたしました") ? "公式ページでは締切済みと案内されています。" : "",
    },
    {
      id: "jsct-48-registration",
      label: "参加登録",
      category: "registration",
      note: registrationPage.text.includes("準備中") ? "公式ページでは参加登録は準備中です。" : "公式ページを確認してください。",
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

async function refreshJsphcs36() {
  const abstractPage = await fetchPage("https://www.c-linkage.co.jp/36jsphcs/abstract.html");
  const abstractRange = extractRangeFromSection(abstractPage.text, /演題登録受付期間/u, /申し込み方法/u, {
    defaultYear: 2026,
  });

  if (!abstractRange) {
    throw new Error("jsphcs-36: 演題登録受付期間を抽出できませんでした。");
  }

  return [
    {
      id: "jsphcs-36-abstract",
      label: "一般演題登録",
      category: "abstract",
      startDate: abstractRange.startDate,
      endDate: abstractRange.endDate,
    },
    {
      id: "jsphcs-36-registration",
      label: "参加登録",
      category: "registration",
      note: abstractPage.text.includes("6月開始予定")
        ? "公式ページでは参加登録は6月開始予定です。"
        : "公式ページを確認してください。",
    },
  ];
}

const REFRESHERS = [
  ["hokkaido-pharma-73", refreshHokkaidoPharma73],
  ["clinical-emergency-29", refreshClinicalEmergency29],
  ["medical-pharmacy-forum-2026", refreshMedicalPharmacyForum2026],
  ["jsct-48", refreshJsct48],
  ["tdm-42", refreshTdm42],
  ["jasds-12", refreshJasds12],
  ["jsphcs-36", refreshJsphcs36],
];

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = loadAnnualMeetingData(raw);
  const resultById = new Map();

  for (const [meetingId, refresh] of REFRESHERS) {
    resultById.set(meetingId, await refresh());
  }

  data.verifiedAt = VERIFIED_AT;
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
