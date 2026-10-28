import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { LearningContent, QuizBank } from "../../app/learning/types";

function readData<T>(file: string): T {
  const source = readFileSync(`public/data/${file}`, "utf8");
  return JSON.parse(source.slice(source.indexOf("=") + 1).trim().replace(/;$/, "")) as T;
}

const quizBank = readData<QuizBank>("quiz-bank.js");
const learning = readData<LearningContent>("learning-content.js");
const quiz = quizBank.quizzes[0];
const secondQuiz = quizBank.quizzes[1];
const key = "cawg.learning.progress.v1";

const test = base.extend<{ consoleHealth: void }>({
  consoleHealth: [async ({ context }, use) => {
    const errors: string[] = [];
    context.on("page", (page) => {
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
    });
    await use();
    expect(errors).toEqual([]);
  }, { auto: true }]
});

async function progress(page: Page) {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) || "{}"), key);
}

test("主要ページ・テーマ切替・レスポンシブ表示", async ({ page }, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  for (const path of ["/", "/archives", "/courses", "/dashboard", "/calendar", "/about"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main").getByRole("heading").first()).not.toBeEmpty();
    expect(new URL(page.url()).pathname).toBe(path);
    expect(await page.title()).not.toBe("");
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "ライト/ダークテーマを切り替え" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "ライト/ダークテーマを切り替え" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: false });
  expect(requests.filter((url) => /fonts\.(googleapis|gstatic)\.com/.test(url))).toEqual([]);
  expect(requests.some((url) => url.includes("/fonts/") && url.endsWith(".woff2"))).toBe(true);
});

test("検索条件を共有・再読み込み・履歴から復元する", async ({ page }, testInfo) => {
  await page.goto("/archives?from=share#catalog");
  const search = page.getByRole("searchbox", { name: "キーワード検索" });
  await search.fill("感染症");
  await expect(page).toHaveURL(/q=/);
  await page.reload();
  await expect(search).toHaveValue("感染症");
  await expect(page.getByText("該当するアーカイブがありません", { exact: true })).toHaveCount(0);
  await page.getByRole("combobox", { name: "年度", exact: true }).selectOption("2025");
  await expect(page).toHaveURL(/year=2025/);
  await page.goBack();
  await expect(page.getByRole("combobox", { name: "年度", exact: true })).toHaveValue("all");
  await expect(search).toHaveValue("感染症");
  await page.goForward();
  await expect(page.getByRole("combobox", { name: "年度", exact: true })).toHaveValue("2025");
  expect(new URL(page.url()).searchParams.get("from")).toBe("share");
  expect(new URL(page.url()).hash).toBe("#catalog");
  await search.fill("存在しない教材xyz987");
  await expect(page.getByText("該当するアーカイブがありません", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("search-empty.png"), fullPage: false });
  await page.getByRole("button", { name: "条件をリセット", exact: true }).click();
  await expect(search).toHaveValue("");
  expect(new URL(page.url()).searchParams.get("q")).toBeNull();
  expect(new URL(page.url()).searchParams.get("from")).toBe("share");
});

test("視聴からクイズ・コース進捗・バッジ・書き出しまで保存される", async ({ page }) => {
  await page.goto(`/archives/${quiz.archiveId}`);
  await page.getByRole("button", { name: "視聴済みにする", exact: true }).click();
  await expect(page.getByRole("button", { name: "修了にする", exact: true })).toBeVisible();
  for (const question of quiz.questions) {
    const answers = question.type === "multiple" ? question.answerIds! : [question.answerId!];
    for (const answer of answers) {
      await page.locator(`input[name="quiz-${quiz.archiveId}-${question.id}"][value="${answer}"]`).check();
    }
  }
  await page.getByRole("button", { name: "採点する", exact: true }).click();
  await expect(page.getByText("合格です。このアーカイブを修了として記録しました。", { exact: true })).toBeVisible();
  await expect.poll(async () => (await progress(page)).lessons?.[quiz.archiveId]?.status).toBe("completed");
  await page.reload();
  await expect(page.getByRole("region", { name: "レッスン進捗" }).getByText("修了", { exact: true })).toBeVisible();
  const course = learning.courses.find((item) => item.lessons.some((lesson) => lesson.archiveId === quiz.archiveId))!;
  await page.goto(`/courses/${course.id}`);
  await expect(page.getByText("修了", { exact: true }).first()).toBeVisible();
  await page.goto("/dashboard");
  await expect.poll(async () => (await progress(page)).earnedBadges?.["first-lesson"]).toBeTruthy();
  await expect(page.getByText("はじめの一歩", { exact: true })).toBeVisible();
  await page.getByText("進捗データの引き継ぎ", { exact: true }).click();
  await page.getByRole("button", { name: "進捗データを表示する", exact: true }).click();
  const exported = JSON.parse(await page.getByLabel("書き出した進捗データ").inputValue());
  expect(exported.lessons[quiz.archiveId].status).toBe("completed");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: ".json をダウンロード", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("study-progress.json");
});

test("複数タブで別々の教材を更新しても両方残る", async ({ context, page }) => {
  const other = await context.newPage();
  await Promise.all([page.goto(`/archives/${quiz.archiveId}`), other.goto(`/archives/${secondQuiz.archiveId}`)]);
  await Promise.all([
    page.getByRole("button", { name: "視聴済みにする", exact: true }).click(),
    other.getByRole("button", { name: "視聴済みにする", exact: true }).click()
  ]);
  await expect.poll(async () => (await progress(page)).lessons?.[quiz.archiveId]?.status).toBe("watched");
  await expect.poll(async () => (await progress(other)).lessons?.[secondQuiz.archiveId]?.status).toBe("watched");
  await page.reload();
  await other.reload();
  await expect(page.getByRole("button", { name: "修了にする", exact: true })).toBeVisible();
  await expect(other.getByRole("button", { name: "修了にする", exact: true })).toBeVisible();
});

test("誤った進捗ファイルを拒否して既存記録を保持する", async ({ page }) => {
  await page.goto(`/archives/${quiz.archiveId}`);
  await page.getByRole("button", { name: "視聴済みにする", exact: true }).click();
  await expect(page.getByRole("button", { name: "修了にする", exact: true })).toBeVisible();
  await page.goto("/dashboard");
  await page.getByText("進捗データの引き継ぎ", { exact: true }).click();
  await page.getByLabel("読み込む進捗データ").fill('{"unrelated":true}');
  await page.getByRole("button", { name: "読み込む", exact: true }).click();
  await expect(page.getByText("進捗データを読み込みました。", { exact: true })).toHaveCount(0);
  expect((await progress(page)).lessons[quiz.archiveId].status).toBe("watched");
});

test("保存不可を表示しその場で書き出せる", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (storageKey, value) {
      if (storageKey.startsWith("cawg.learning.progress")) throw new DOMException("Full", "QuotaExceededError");
      return original.call(this, storageKey, value);
    };
  });
  await page.goto(`/archives/${quiz.archiveId}`);
  await page.getByRole("button", { name: "視聴済みにする", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "学習進捗を保存できませんでした" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "現在の進捗をダウンロード", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("study-progress-unsaved.json");
});

test("正常な進捗の件数を確認して取り込み、バックアップから復元できる", async ({ page }) => {
  await page.goto(`/archives/${quiz.archiveId}`);
  await page.getByRole("button", { name: "視聴済みにする", exact: true }).click();
  await expect(page.getByRole("button", { name: "修了にする", exact: true })).toBeVisible();
  const incoming = await progress(page);
  incoming.lessons = { [secondQuiz.archiveId]: { status: "completed" } };
  incoming.earnedBadges = {};
  await page.goto("/dashboard");
  await page.getByText("進捗データの引き継ぎ", { exact: true }).click();
  const input = page.getByLabel("読み込む進捗データ");
  const importButton = page.getByRole("button", { name: "読み込む", exact: true });
  await input.fill(JSON.stringify(incoming));
  await importButton.click();
  await expect(page.getByRole("alert").filter({ hasText: "教材 1 件・バッジ 0 件" })).toBeVisible();
  expect((await progress(page)).lessons[quiz.archiveId].status).toBe("watched");
  await importButton.click();
  await expect(page.getByText("進捗データを読み込みました。", { exact: true })).toBeVisible();
  expect(Object.keys((await progress(page)).lessons)).toEqual([secondQuiz.archiveId]);
  const backup = await page.getByLabel("置き換え前のバックアップデータ").inputValue();
  expect(JSON.parse(backup).lessons[quiz.archiveId].status).toBe("watched");
  await input.fill(backup);
  await importButton.click();
  await importButton.click();
  await expect.poll(async () => Object.keys((await progress(page)).lessons)).toEqual([quiz.archiveId]);
  const reset = page.getByRole("button", { name: "すべての進捗を削除", exact: true });
  await reset.click();
  await reset.click();
  await expect(page.getByText("すべての進捗を削除しました。", { exact: true })).toBeVisible();
  expect((await progress(page)).lessons).toEqual({});
  expect((await progress(page)).earnedBadges).toEqual({});
  expect(JSON.parse(await page.getByLabel("置き換え前のバックアップデータ").inputValue()).lessons[quiz.archiveId].status).toBe("watched");
});

test("問い合わせの不正JSONは外部送信せず400で返す", async ({ request }) => {
  for (const data of ["null", "{", "[]", "{}", '{"name":"test"}']) {
    const response = await request.post("/api/contact", { data, headers: { "Content-Type": "application/json" } });
    expect(response.status()).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  }
});

test("ホームの録画・分野から教材を選び、学習を再開できる", async ({ page }, testInfo) => {
  await page.goto('/');
  const latest = page.getByRole('region', { name: '新着の録画', exact: true });
  await expect(latest.locator('li')).toHaveCount(3);
  for (const image of await latest.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth >= 480)).toBe(true);
    expect(await image.getAttribute('src')).toMatch(/^\/images\/archives\//);
  }
  await expect(latest).not.toContainText('未記載');
  const recording = latest.locator('li a').first();
  const href = await recording.getAttribute('href');
  await recording.click();
  await expect(page).toHaveURL(new RegExp(href!));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('病院薬剤師の仕事');
  const detailThumbnail = page.getByRole('img', { name: '病院薬剤師の仕事の動画サムネイル' });
  await expect(detailThumbnail).toBeVisible();
  await expect.poll(() => detailThumbnail.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 480)).toBe(true);
  await expect(page.getByRole('link', { name: /^YouTubeで見る/  })).toHaveAttribute('target', '_blank');
  await expect(page.locator('iframe')).toHaveCount(0);
  await page.route('https://www.youtube-nocookie.com/embed/**', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>Test player</body></html>' }));
  await page.getByRole('button', { name: '病院薬剤師の仕事をこのページで再生', exact: true }).click();
  await expect(page.locator('iframe')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/DkLGmSEnxtE?autoplay=1&playsinline=1&rel=0');
  await expect(page.locator('iframe')).toBeVisible();
  await expect(page).toHaveURL(new RegExp(href!));
  await page.screenshot({ path: testInfo.outputPath('archive-detail.png'), fullPage: false });
  await page.goto('/');
  await expect(page.getByRole('link', { name: '学習を再開する' , exact: true })).toHaveAttribute('href', new RegExp(href!));
  await page.getByRole('navigation', { name: '学ぶ分野から探す' }).getByRole('link', { name: '感染症' }).click();
  await expect(page).toHaveURL(/theme=infectious/);
  await expect(page.getByRole('heading', { name: '感染症治療~肺炎~', exact: true })).toBeVisible();
  await page.goto('/archives?asset=recording');
  await expect(page.locator('main img')).toHaveCount(8);
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('archives-recordings.png'), fullPage: true });
});
