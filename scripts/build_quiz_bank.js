#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const QUIZZES_DIR = path.join(ROOT, "content/quizzes");
const SITE_CONTENT_PATH = path.join(ROOT, "public/data/site-content.js");
const OUTPUT_PATH = path.join(ROOT, "public/data/quiz-bank.js");
const DRY_RUN = process.argv.includes("--dry-run");
const INCLUDE_DRAFTS = process.argv.includes("--include-drafts");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REVIEW_STATUSES = ["draft", "reviewed"];

function loadWindowAssigned(filePath, propertyName) {
  const raw = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  new vm.Script(raw, { filename: filePath }).runInContext(context);
  return context.window[propertyName];
}

function readQuizFiles() {
  if (!fs.existsSync(QUIZZES_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(QUIZZES_DIR)
    .filter((name) => name.endsWith(".json"))
    .filter((name) => !name.startsWith("_"))
    .sort();

  return files.map((name) => {
    const filePath = path.join(QUIZZES_DIR, name);
    const raw = fs.readFileSync(filePath, "utf8");

    try {
      return { name, quiz: JSON.parse(raw) };
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
  const archiveIds = new Set((site.archives || []).map((archive) => archive.id));
  const seenArchiveIds = new Set();

  for (const { name, quiz } of entries) {
    const where = `${name}`;
    const expectedArchiveId = name.replace(/\.json$/, "");

    if (!isNonEmptyString(quiz.archiveId)) {
      errors.push(`${where}: archiveId が空です。`);
    } else {
      if (quiz.archiveId !== expectedArchiveId) {
        errors.push(
          `${where}: archiveId がファイル名と一致しません (archiveId=${quiz.archiveId}, ファイル名=${expectedArchiveId})。`
        );
      }
      if (!archiveIds.has(quiz.archiveId)) {
        errors.push(`${where}: archiveId が archives に実在しません (${quiz.archiveId})。`);
      }
      if (seenArchiveIds.has(quiz.archiveId)) {
        errors.push(`${where}: archiveId が重複しています (${quiz.archiveId})。`);
      }
      seenArchiveIds.add(quiz.archiveId);
    }

    if (typeof quiz.passThreshold !== "number" || !Number.isFinite(quiz.passThreshold)) {
      errors.push(`${where}: passThreshold が数値ではありません。`);
    } else if (!(quiz.passThreshold > 0 && quiz.passThreshold <= 1)) {
      errors.push(`${where}: passThreshold は 0 より大きく 1 以下で指定してください (${quiz.passThreshold})。`);
    }

    if (!isNonEmptyString(quiz.reviewStatus)) {
      errors.push(`${where}: reviewStatus が空です。`);
    } else if (!REVIEW_STATUSES.includes(quiz.reviewStatus)) {
      errors.push(`${where}: reviewStatus が不正です (${quiz.reviewStatus})。`);
    }

    if (!DATE_RE.test(String(quiz.updatedAt))) {
      errors.push(`${where}: updatedAt は YYYY-MM-DD 形式で指定してください (${quiz.updatedAt})。`);
    }

    if (!Array.isArray(quiz.questions)) {
      errors.push(`${where}: questions が配列ではありません。`);
      continue;
    }

    if (quiz.questions.length === 0) {
      if (quiz.reviewStatus === "draft") {
        console.warn(`警告: ${where}: draft ですが questions が 0 問です。`);
      } else {
        errors.push(`${where}: questions が 1 問以上必要です。`);
      }
      continue;
    }

    const seenQuestionIds = new Set();
    quiz.questions.forEach((question, index) => {
      const questionWhere = `${where} questions[${index}]`;

      if (!isNonEmptyString(question.id)) {
        errors.push(`${questionWhere}: id が空です。`);
      } else if (seenQuestionIds.has(question.id)) {
        errors.push(`${questionWhere}: question id が重複しています (${question.id})。`);
      } else {
        seenQuestionIds.add(question.id);
      }

      if (!isNonEmptyString(question.prompt)) {
        errors.push(`${questionWhere}: prompt が空です。`);
      }

      if (!Array.isArray(question.choices) || question.choices.length < 2) {
        errors.push(`${questionWhere}: choices は 2 件以上必要です。`);
      } else {
        const seenChoiceIds = new Set();
        question.choices.forEach((choice, choiceIndex) => {
          const choiceWhere = `${questionWhere} choices[${choiceIndex}]`;

          if (!isNonEmptyString(choice.id)) {
            errors.push(`${choiceWhere}: id が空です。`);
          } else if (seenChoiceIds.has(choice.id)) {
            errors.push(`${choiceWhere}: choice id が重複しています (${choice.id})。`);
          } else {
            seenChoiceIds.add(choice.id);
          }

          if (!isNonEmptyString(choice.text)) {
            errors.push(`${choiceWhere}: text が空です。`);
          }
        });

        if (!isNonEmptyString(question.answerId)) {
          errors.push(`${questionWhere}: answerId が空です。`);
        } else if (!seenChoiceIds.has(question.answerId)) {
          errors.push(`${questionWhere}: answerId が choices に存在しません (${question.answerId})。`);
        }
      }
    });
  }

  return errors;
}

function serialize(quizzes) {
  const data = {
    schemaVersion: 1,
    quizzes,
  };
  return `window.QUIZ_BANK = ${JSON.stringify(data, null, 2)};\n`;
}

function main() {
  const site = loadWindowAssigned(SITE_CONTENT_PATH, "STUDY_ARCHIVE_DATA");

  if (!site || !Array.isArray(site.archives)) {
    throw new Error("site-content.js から STUDY_ARCHIVE_DATA を読み込めませんでした。");
  }

  const entries = readQuizFiles();

  const errors = validate(entries, site);

  if (errors.length > 0) {
    console.error(`検証に失敗しました (${errors.length} 件):`);
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  const draftCount = entries.filter((entry) => entry.quiz.reviewStatus === "draft").length;
  const reviewedCount = entries.filter((entry) => entry.quiz.reviewStatus === "reviewed").length;

  const included = entries
    .map((entry) => entry.quiz)
    .filter((quiz) => (INCLUDE_DRAFTS ? true : quiz.reviewStatus === "reviewed"))
    .sort((a, b) => a.archiveId.localeCompare(b.archiveId));

  const output = serialize(included);

  const summary = `クイズ ${entries.length} 件（reviewed ${reviewedCount} 件 / draft ${draftCount} 件）`;
  const includeNote = INCLUDE_DRAFTS
    ? `収録 ${included.length} 件（--include-drafts のため draft も収録）`
    : `収録 ${included.length} 件（reviewed のみ）`;

  if (DRY_RUN) {
    console.log(`検証 OK: ${summary}（--dry-run のため書き込みません）。`);
    console.log(`  ${includeNote}`);
    for (const quiz of included) {
      console.log(`  - ${quiz.archiveId} (${quiz.reviewStatus}, questions=${quiz.questions.length})`);
    }
    return;
  }

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`生成しました: ${path.relative(ROOT, OUTPUT_PATH)}`);
  console.log(`${summary}`);
  console.log(`${includeNote}`);
  for (const quiz of included) {
    console.log(`  - ${quiz.archiveId} (${quiz.reviewStatus}, questions=${quiz.questions.length})`);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
}
