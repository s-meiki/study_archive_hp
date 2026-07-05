#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const COURSES_DIR = path.join(ROOT, "content/courses");
const SITE_CONTENT_PATH = path.join(ROOT, "public/data/site-content.js");
const OUTPUT_PATH = path.join(ROOT, "public/data/learning-content.js");
const DRY_RUN = process.argv.includes("--dry-run");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function loadWindowAssigned(filePath, propertyName) {
  const raw = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  new vm.Script(raw, { filename: filePath }).runInContext(context);
  return context.window[propertyName];
}

function readCourseFiles() {
  const files = fs
    .readdirSync(COURSES_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();

  return files.map((name) => {
    const filePath = path.join(COURSES_DIR, name);
    const raw = fs.readFileSync(filePath, "utf8");

    try {
      return { name, course: JSON.parse(raw) };
    } catch (error) {
      throw new Error(`${name}: JSON として解析できません (${error.message})`);
    }
  });
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validate(entries, site) {
  const errors = [];
  const themeIds = new Set((site.themes || []).map((theme) => theme.id));
  const archiveIds = new Set((site.archives || []).map((archive) => archive.id));
  const seenCourseIds = new Set();

  for (const { name, course } of entries) {
    const where = `${name}`;

    if (!isNonEmptyString(course.id)) {
      errors.push(`${where}: id が空です。`);
    } else {
      if (!course.id.startsWith("course-")) {
        errors.push(`${where}: id は "course-" で始まる必要があります (${course.id})。`);
      }
      if (seenCourseIds.has(course.id)) {
        errors.push(`${where}: course id が重複しています (${course.id})。`);
      }
      seenCourseIds.add(course.id);
    }

    if (!isNonEmptyString(course.themeId)) {
      errors.push(`${where}: themeId が空です。`);
    } else if (!themeIds.has(course.themeId)) {
      errors.push(`${where}: themeId が themes に実在しません (${course.themeId})。`);
    }

    if (!isNonEmptyString(course.title)) {
      errors.push(`${where}: title が空です。`);
    }

    if (!isNonEmptyString(course.summary)) {
      errors.push(`${where}: summary が空です。`);
    }

    if (course.level !== undefined && !["入門", "標準", "発展"].includes(course.level)) {
      errors.push(`${where}: level が不正です (${course.level})。`);
    }

    if (typeof course.order !== "number" || !Number.isFinite(course.order)) {
      errors.push(`${where}: order が数値ではありません。`);
    }

    if (!DATE_RE.test(String(course.updatedAt))) {
      errors.push(`${where}: updatedAt は YYYY-MM-DD 形式で指定してください (${course.updatedAt})。`);
    }

    if (!Array.isArray(course.lessons) || course.lessons.length === 0) {
      errors.push(`${where}: lessons が空です。`);
      continue;
    }

    const seenOrders = new Set();
    course.lessons.forEach((lesson, index) => {
      const lessonWhere = `${where} lessons[${index}]`;

      if (!isNonEmptyString(lesson.archiveId)) {
        errors.push(`${lessonWhere}: archiveId が空です。`);
      } else if (!archiveIds.has(lesson.archiveId)) {
        errors.push(`${lessonWhere}: archiveId が archives に実在しません (${lesson.archiveId})。`);
      }

      if (typeof lesson.order !== "number" || !Number.isFinite(lesson.order)) {
        errors.push(`${lessonWhere}: order が数値ではありません。`);
      } else if (seenOrders.has(lesson.order)) {
        errors.push(`${lessonWhere}: order がコース内で重複しています (${lesson.order})。`);
      } else {
        seenOrders.add(lesson.order);
      }

      if (lesson.optional !== undefined && typeof lesson.optional !== "boolean") {
        errors.push(`${lessonWhere}: optional は真偽値で指定してください。`);
      }

      if (lesson.labelOverride !== undefined && !isNonEmptyString(lesson.labelOverride)) {
        errors.push(`${lessonWhere}: labelOverride が空です。`);
      }
    });
  }

  return errors;
}

function serialize(courses) {
  const data = {
    schemaVersion: 1,
    courses,
  };
  return `window.LEARNING_CONTENT = ${JSON.stringify(data, null, 2)};\n`;
}

function main() {
  const site = loadWindowAssigned(SITE_CONTENT_PATH, "STUDY_ARCHIVE_DATA");

  if (!site || !Array.isArray(site.themes) || !Array.isArray(site.archives)) {
    throw new Error("site-content.js から STUDY_ARCHIVE_DATA を読み込めませんでした。");
  }

  const entries = readCourseFiles();

  if (entries.length === 0) {
    throw new Error("content/courses に *.json が見つかりません。");
  }

  const errors = validate(entries, site);

  if (errors.length > 0) {
    console.error(`検証に失敗しました (${errors.length} 件):`);
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  const courses = entries
    .map((entry) => entry.course)
    .sort((a, b) => a.order - b.order);

  const output = serialize(courses);
  const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0);

  if (DRY_RUN) {
    console.log(`検証 OK: コース ${courses.length} 件 / レッスン ${lessonCount} 件（--dry-run のため書き込みません）。`);
    for (const course of courses) {
      console.log(`  - ${course.id} (order=${course.order}, lessons=${course.lessons.length})`);
    }
    return;
  }

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`生成しました: ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`コース ${courses.length} 件 / レッスン ${lessonCount} 件`);
  for (const course of courses) {
    console.log(`  - ${course.id} (order=${course.order}, lessons=${course.lessons.length})`);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
