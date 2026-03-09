const dataUtils = window.StudyArchiveDataUtils;

const FILE_KINDS = ["slides", "notes", "references"];
const HANDLE_DB_NAME = "study-archive-admin";
const HANDLE_STORE_NAME = "file-handles";
const ROOT_HANDLE_KEY = "project-root";

let workingData = dataUtils.getSiteData();
let selectedArchiveId = "";
let projectRootHandle = null;
let isDirty = false;

const pendingUploads = new Map();

const elements = {
  archiveForm: document.querySelector("#archive-form"),
  archiveList: document.querySelector("#archive-admin-list"),
  archiveSearch: document.querySelector("#archive-search"),
  autofillSummary: document.querySelector("#autofill-summary"),
  connectFolder: document.querySelector("#connect-folder"),
  createArchive: document.querySelector("#create-archive"),
  copyRootPath: document.querySelector("#copy-root-path"),
  deleteArchive: document.querySelector("#delete-archive"),
  downloadData: document.querySelector("#download-data"),
  draftIndicator: document.querySelector("#draft-indicator"),
  editorTitle: document.querySelector("#editor-title"),
  fsSupportNote: document.querySelector("#fs-support-note"),
  libraryPanel: document.querySelector(".admin-library"),
  editorPanel: document.querySelector(".admin-editor"),
  rootPathValue: document.querySelector("#root-path-value"),
  saveProject: document.querySelector("#save-project"),
  stats: document.querySelector("#admin-stats"),
  statusStrip: document.querySelector("#status-strip"),
  fields: {
    title: document.querySelector("#field-title"),
    date: document.querySelector("#field-date"),
    speaker: document.querySelector("#field-speaker"),
    themeId: document.querySelector("#field-theme"),
    duration: document.querySelector("#field-duration"),
    featured: document.querySelector("#field-featured"),
    summary: document.querySelector("#field-summary"),
    recording: document.querySelector("#field-recording"),
    slides: document.querySelector("#field-slides"),
    notes: document.querySelector("#field-notes"),
    references: document.querySelector("#field-references"),
  },
  files: {
    slides: document.querySelector("#file-slides"),
    notes: document.querySelector("#file-notes"),
    references: document.querySelector("#file-references"),
  },
  uploadNotes: {
    slides: document.querySelector("#upload-note-slides"),
    notes: document.querySelector("#upload-note-notes"),
    references: document.querySelector("#upload-note-references"),
  },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function getThemeName(themeId) {
  return workingData.themes.find((theme) => theme.id === themeId)?.name ?? themeId;
}

function sortedArchives() {
  return [...workingData.archives].sort((a, b) => b.date.localeCompare(a.date));
}

function selectedArchive() {
  return workingData.archives.find((archive) => archive.id === selectedArchiveId) ?? null;
}

function selectedPendingUploads() {
  return pendingUploads.get(selectedArchiveId) ?? {};
}

function emptyArchiveDraft() {
  return {
    id: "",
    themeId: workingData.themes[0]?.id ?? "",
    title: "",
    summary: "",
    speaker: "",
    date: todayIso(),
    updatedAt: todayIso(),
    duration: "未記載",
    featured: false,
    assets: {
      recording: false,
      slides: false,
      notes: false,
      references: false,
    },
    links: {
      recording: "",
      slides: "",
      notes: "",
      references: "",
    },
    thumbnail: dataUtils.getThemeColors(workingData.themes[0]?.id ?? ""),
  };
}

function showStatus(message, tone = "") {
  elements.statusStrip.hidden = !message;
  elements.statusStrip.textContent = message;
  elements.statusStrip.className = "status-strip panel";

  if (tone) {
    elements.statusStrip.classList.add(`is-${tone}`);
  }
}

function openHandleDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(HANDLE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(HANDLE_STORE_NAME)) {
        database.createObjectStore(HANDLE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveStoredRootHandle(handle) {
  const database = await openHandleDb();
  if (!database) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readwrite");
    transaction.objectStore(HANDLE_STORE_NAME).put(handle, ROOT_HANDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function loadStoredRootHandle() {
  const database = await openHandleDb();
  if (!database) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readonly");
    const request = transaction.objectStore(HANDLE_STORE_NAME).get(ROOT_HANDLE_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function clearStoredRootHandle() {
  const database = await openHandleDb();
  if (!database) {
    return;
  }

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE_NAME, "readwrite");
    transaction.objectStore(HANDLE_STORE_NAME).delete(ROOT_HANDLE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function setDirtyState(nextDirty) {
  isDirty = nextDirty;
  elements.draftIndicator.textContent = nextDirty ? "フォームに未保存の変更があります" : "一覧の内容は最新です";
  elements.draftIndicator.classList.toggle("is-dirty", nextDirty);
}

function renderThemeOptions() {
  elements.fields.themeId.innerHTML = workingData.themes
    .map((theme) => `<option value="${theme.id}">${theme.name}</option>`)
    .join("");
}

function renderStats() {
  if (!elements.stats) {
    return;
  }

  const recordingCount = workingData.archives.filter((archive) => archive.assets.recording).length;
  const referenceCount = workingData.archives.filter((archive) => archive.assets.references).length;

  elements.stats.innerHTML = `
    <span class="stat-chip">${workingData.archives.length}件のアーカイブ</span>
    <span class="stat-chip">${recordingCount}件に録画あり</span>
    <span class="stat-chip">${referenceCount}件に参考資料あり</span>
  `;
}

function archiveBadges(archive) {
  const badges = [];

  if (archive.assets.recording) badges.push("録画");
  if (archive.assets.slides) badges.push("スライド");
  if (archive.assets.notes) badges.push("メモ");
  if (archive.assets.references) badges.push("参考資料");
  if (archive.featured) badges.push("注目");

  return badges;
}

function archiveMatchesSearch(archive, query) {
  if (!query) {
    return true;
  }

  const haystack = [archive.title, archive.summary, archive.speaker, getThemeName(archive.themeId)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function renderArchiveList() {
  const query = elements.archiveSearch.value.trim().toLowerCase();
  const items = sortedArchives().filter((archive) => archiveMatchesSearch(archive, query));

  if (items.length === 0) {
    elements.archiveList.innerHTML = '<p class="archive-admin-empty">該当するアーカイブがありません。</p>';
    return;
  }

  elements.archiveList.innerHTML = "";

  items.forEach((archive) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `archive-admin-item${archive.id === selectedArchiveId ? " is-active" : ""}`;
    button.innerHTML = `
      <div class="archive-admin-title">${archive.title}</div>
      <div class="archive-admin-meta">
        <span>${formatDate(archive.date)}</span>
        <span>${getThemeName(archive.themeId)}</span>
        <span>${archive.speaker}</span>
      </div>
      <div class="archive-admin-badges">
        ${archiveBadges(archive)
          .map((badge) => `<span>${badge}</span>`)
          .join("")}
      </div>
    `;

    button.addEventListener("click", () => {
      selectArchive(archive.id);
    });

    elements.archiveList.append(button);
  });
}

function updateUploadNotes() {
  const archive = selectedArchive();
  const uploads = selectedPendingUploads();

  FILE_KINDS.forEach((kind) => {
    const note = elements.uploadNotes[kind];
    const pendingFile = uploads[kind];
    const currentLink = archive?.links?.[kind] || "";

    if (pendingFile) {
      note.textContent = `保存予定: ${pendingFile.name}。プロジェクトへ保存すると content/uploads/ 配下へ配置します。`;
      return;
    }

    if (currentLink) {
      note.textContent = `現在のリンク: ${currentLink}`;
      return;
    }

    note.textContent = "URL を使うか、ファイルを選んで保存できます。";
  });
}

function populateForm(archive) {
  const target = archive ?? emptyArchiveDraft();

  elements.fields.title.value = target.title ?? "";
  elements.fields.date.value = target.date ?? todayIso();
  elements.fields.speaker.value = target.speaker ?? "";
  elements.fields.themeId.value = target.themeId ?? workingData.themes[0]?.id ?? "";
  elements.fields.duration.value = target.duration ?? "未記載";
  elements.fields.featured.checked = Boolean(target.featured);
  elements.fields.summary.value = target.summary ?? "";
  elements.fields.recording.value = target.links?.recording ?? "";
  elements.fields.slides.value = target.links?.slides ?? "";
  elements.fields.notes.value = target.links?.notes ?? "";
  elements.fields.references.value = target.links?.references ?? "";

  FILE_KINDS.forEach((kind) => {
    elements.files[kind].value = "";
  });

  updateUploadNotes();
  setDirtyState(false);
}

function confirmDiscardChanges() {
  if (!isDirty) {
    return true;
  }

  return window.confirm("保存前の変更があります。破棄して移動しますか？");
}

function selectArchive(archiveId) {
  if (!confirmDiscardChanges()) {
    return;
  }

  selectedArchiveId = archiveId;
  const archive = selectedArchive();
  elements.editorTitle.textContent = archive ? "アーカイブを編集" : "新規アーカイブ";
  populateForm(archive);
  renderArchiveList();
}

function clearPendingUpload(kind) {
  const uploads = selectedPendingUploads();

  if (!uploads[kind]) {
    elements.files[kind].value = "";
    updateUploadNotes();
    return;
  }

  delete uploads[kind];

  if (Object.keys(uploads).length === 0) {
    pendingUploads.delete(selectedArchiveId);
  } else {
    pendingUploads.set(selectedArchiveId, uploads);
  }

  elements.files[kind].value = "";
  updateUploadNotes();
  showStatus(`${kind} のファイル指定をクリアしました。`, "success");
}

function markThemeFeatured(themeId, archiveId, featured) {
  if (!featured) {
    return;
  }

  workingData.archives.forEach((archive) => {
    if (archive.themeId === themeId) {
      archive.featured = archive.id === archiveId;
    }
  });
}

function syncPendingFiles(previousId, nextId) {
  const nextUploads = { ...(pendingUploads.get(previousId) ?? pendingUploads.get(nextId) ?? {}) };

  FILE_KINDS.forEach((kind) => {
    const file = elements.files[kind].files[0];
    if (file) {
      nextUploads[kind] = file;
    }
  });

  pendingUploads.delete(previousId);

  if (Object.keys(nextUploads).length > 0) {
    pendingUploads.set(nextId, nextUploads);
  }
}

function formToArchive() {
  const previousId = selectedArchiveId;
  const archiveId = previousId || dataUtils.createArchiveId(elements.fields.date.value, elements.fields.title.value);
  const themeId = elements.fields.themeId.value;
  const themeName = getThemeName(themeId);
  const colors = dataUtils.getThemeColors(themeId);

  const archive = {
    id: archiveId,
    themeId,
    title: dataUtils.normalizeText(elements.fields.title.value),
    summary: dataUtils.normalizeText(elements.fields.summary.value) || dataUtils.buildSummary(elements.fields.title.value, themeName),
    speaker: dataUtils.normalizeText(elements.fields.speaker.value),
    date: elements.fields.date.value,
    updatedAt: todayIso(),
    duration: dataUtils.normalizeText(elements.fields.duration.value) || "未記載",
    featured: elements.fields.featured.checked,
    assets: {
      recording: Boolean(dataUtils.normalizeText(elements.fields.recording.value)),
      slides: Boolean(dataUtils.normalizeText(elements.fields.slides.value)),
      notes: Boolean(dataUtils.normalizeText(elements.fields.notes.value)),
      references: Boolean(dataUtils.normalizeText(elements.fields.references.value)),
    },
    links: {
      recording: dataUtils.normalizeText(elements.fields.recording.value),
      slides: dataUtils.normalizeText(elements.fields.slides.value),
      notes: dataUtils.normalizeText(elements.fields.notes.value),
      references: dataUtils.normalizeText(elements.fields.references.value),
    },
    thumbnail: colors,
  };

  const uploads = pendingUploads.get(previousId) ?? {};
  FILE_KINDS.forEach((kind) => {
    if (uploads[kind] || elements.files[kind].files[0]) {
      archive.assets[kind] = true;
    }
  });

  return archive;
}

function validateArchive(archive) {
  if (!archive.title) {
    throw new Error("タイトルは必須です。");
  }
  if (!archive.date) {
    throw new Error("開催日は必須です。");
  }
  if (!archive.speaker) {
    throw new Error("講師は必須です。");
  }
  if (!archive.themeId) {
    throw new Error("テーマを選択してください。");
  }
}

function upsertCurrentArchive(options = {}) {
  const { quiet = false } = options;
  const previousId = selectedArchiveId;
  const archive = formToArchive();

  validateArchive(archive);
  syncPendingFiles(previousId, archive.id);

  const index = workingData.archives.findIndex((item) => item.id === previousId || item.id === archive.id);
  if (index >= 0) {
    workingData.archives[index] = archive;
  } else {
    workingData.archives.push(archive);
  }

  if (archive.featured) {
    markThemeFeatured(archive.themeId, archive.id, true);
  }

  selectedArchiveId = archive.id;
  renderStats();
  renderArchiveList();
  populateForm(archive);

  if (!quiet) {
    showStatus("一覧へ反映しました。公開データへ反映するには保存かダウンロードを実行してください。", "success");
  }
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function pendingUploadCount() {
  return Array.from(pendingUploads.values()).reduce((count, uploads) => count + Object.keys(uploads).length, 0);
}

function expectedRootPath() {
  try {
    return decodeURIComponent(new URL(".", window.location.href).pathname).replace(/\/$/, "");
  } catch (error) {
    return "/Users/meiki/Devloper/study_archive_hp";
  }
}

async function queryReadwritePermission(handle) {
  if (typeof handle.queryPermission !== "function") {
    return "prompt";
  }

  return handle.queryPermission({ mode: "readwrite" });
}

async function copyRootPath() {
  const path = expectedRootPath();

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(path);
    showStatus("保存先パスをコピーしました。", "success");
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = path;
  helper.setAttribute("readonly", "");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.append(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  showStatus("保存先パスをコピーしました。", "success");
}

async function isProjectRootHandle(handle) {
  try {
    await handle.getFileHandle("index.html");
    await handle.getFileHandle("admin.html");
    return true;
  } catch (error) {
    return false;
  }
}

async function resolveProjectRootHandle(handle) {
  if (await isProjectRootHandle(handle)) {
    return handle;
  }

  const repoName = expectedRootPath().split("/").filter(Boolean).at(-1);

  try {
    const childHandle = await handle.getDirectoryHandle(repoName);
    if (await isProjectRootHandle(childHandle)) {
      return childHandle;
    }
  } catch (error) {
    // Ignore and fall through to the explicit error below.
  }

  throw new Error(`保存先フォルダには ${expectedRootPath()} を選んでください。`);
}

async function connectProjectFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    throw new Error("このブラウザは直接保存に未対応です。Chrome または Edge を使ってください。");
  }

  const handle = await window.showDirectoryPicker({ mode: "readwrite" });
  projectRootHandle = await resolveProjectRootHandle(handle);
  await saveStoredRootHandle(projectRootHandle);
  elements.fsSupportNote.textContent = "接続済みです。このままリポジトリへ保存を押せます。";
  showStatus("リポジトリを接続しました。このまま「リポジトリへ保存」を押せます。", "success");
}

async function ensureDirectory(rootHandle, pathParts) {
  let directoryHandle = rootHandle;

  for (const part of pathParts) {
    directoryHandle = await directoryHandle.getDirectoryHandle(part, { create: true });
  }

  return directoryHandle;
}

async function writeTextFile(rootHandle, relativePath, text) {
  const pathParts = relativePath.split("/");
  const fileName = pathParts.pop();
  const directoryHandle = await ensureDirectory(rootHandle, pathParts);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function writeBinaryFile(rootHandle, relativePath, file) {
  const pathParts = relativePath.split("/");
  const fileName = pathParts.pop();
  const directoryHandle = await ensureDirectory(rootHandle, pathParts);
  const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
}

async function persistPendingUploads() {
  const archivesById = new Map(workingData.archives.map((archive) => [archive.id, archive]));

  for (const [archiveId, uploads] of pendingUploads.entries()) {
    const archive = archivesById.get(archiveId);
    if (!archive) {
      continue;
    }

    for (const [kind, file] of Object.entries(uploads)) {
      const relativePath = dataUtils.createUploadPath(archive, kind, file.name);
      await writeBinaryFile(projectRootHandle, relativePath, file);
      archive.links[kind] = relativePath;
      archive.assets[kind] = true;
    }
  }

  pendingUploads.clear();
}

async function saveProjectFiles() {
  upsertCurrentArchive({ quiet: true });

  if (!projectRootHandle) {
    await connectProjectFolder();
  }

  await persistPendingUploads();
  await writeTextFile(projectRootHandle, "data/site-content.js", dataUtils.serializeSiteData(workingData));

  updateUploadNotes();
  showStatus("プロジェクトへ保存しました。index.html を再読み込みすると反映を確認できます。", "success");
}

function updateSupportNote() {
  if (projectRootHandle) {
    elements.fsSupportNote.textContent = "接続済みです。このままリポジトリへ保存を押せます。";
    return;
  }

  if (typeof window.showDirectoryPicker === "function") {
    elements.fsSupportNote.textContent = "初回だけリポジトリを接続してください。以後は自動で再接続を試します。";
    return;
  }

  elements.fsSupportNote.textContent = "直接保存は未対応です。Chrome / Edge かダウンロード運用を使ってください。";
}

function syncLibraryHeight() {
  if (!elements.libraryPanel || !elements.editorPanel) {
    return;
  }

  if (window.matchMedia("(max-width: 1180px)").matches) {
    elements.libraryPanel.style.removeProperty("--library-panel-height");
    return;
  }

  const editorHeight = Math.ceil(elements.editorPanel.getBoundingClientRect().height);
  if (editorHeight > 0) {
    elements.libraryPanel.style.setProperty("--library-panel-height", `${editorHeight}px`);
  }
}

async function restoreStoredProjectRootHandle() {
  if (typeof window.showDirectoryPicker !== "function") {
    return;
  }

  try {
    const storedHandle = await loadStoredRootHandle();
    if (!storedHandle) {
      return;
    }

    const resolvedHandle = await resolveProjectRootHandle(storedHandle);
    const permission = await queryReadwritePermission(resolvedHandle);

    if (permission !== "granted") {
      updateSupportNote();
      return;
    }

    projectRootHandle = resolvedHandle;
    updateSupportNote();
    showStatus("前回接続したリポジトリを自動で再接続しました。", "success");
  } catch (error) {
    projectRootHandle = null;
    await clearStoredRootHandle().catch(() => {});
    updateSupportNote();
  }
}

function startNewArchive() {
  if (!confirmDiscardChanges()) {
    return;
  }

  selectedArchiveId = "";
  elements.editorTitle.textContent = "新規アーカイブ";
  populateForm(emptyArchiveDraft());
  renderArchiveList();
  showStatus("新規アーカイブを入力中です。", "success");
}

function deleteCurrentArchive() {
  const archive = selectedArchive();
  if (!archive) {
    startNewArchive();
    return;
  }

  if (!window.confirm(`「${archive.title}」を削除します。よければ続けてください。`)) {
    return;
  }

  workingData.archives = workingData.archives.filter((item) => item.id !== archive.id);
  pendingUploads.delete(archive.id);
  selectedArchiveId = sortedArchives()[0]?.id ?? "";

  renderStats();
  renderArchiveList();

  if (selectedArchiveId) {
    populateForm(selectedArchive());
  } else {
    populateForm(emptyArchiveDraft());
  }

  showStatus("アーカイブを削除しました。公開データへ反映するには保存かダウンロードを実行してください。", "success");
}

function handleDownload() {
  upsertCurrentArchive({ quiet: true });

  if (pendingUploadCount() > 0) {
    throw new Error("ファイルアップロードが含まれています。プロジェクトへ保存を使うか、URL入力へ切り替えてください。");
  }

  downloadTextFile("site-content.js", dataUtils.serializeSiteData(workingData));
  showStatus("site-content.js をダウンロードしました。data/ に置き換えれば反映できます。", "success");
}

function attachEvents() {
  elements.archiveForm.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      upsertCurrentArchive();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.archiveSearch.addEventListener("input", () => {
    renderArchiveList();
  });

  elements.createArchive.addEventListener("click", () => {
    startNewArchive();
  });

  elements.autofillSummary.addEventListener("click", () => {
    const themeName = getThemeName(elements.fields.themeId.value);
    elements.fields.summary.value = dataUtils.buildSummary(elements.fields.title.value, themeName);
    setDirtyState(true);
  });

  elements.deleteArchive.addEventListener("click", () => {
    deleteCurrentArchive();
  });

  elements.downloadData.addEventListener("click", () => {
    try {
      handleDownload();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.connectFolder.addEventListener("click", async () => {
    try {
      await connectProjectFolder();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  elements.copyRootPath.addEventListener("click", async () => {
    try {
      await copyRootPath();
    } catch (error) {
      showStatus("パスをコピーできませんでした。手動でコピーしてください。", "error");
    }
  });

  elements.saveProject.addEventListener("click", async () => {
    try {
      await saveProjectFiles();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

  Object.values(elements.fields).forEach((field) => {
    field.addEventListener("input", () => {
      setDirtyState(true);
    });
    field.addEventListener("change", () => {
      setDirtyState(true);
    });
  });

  FILE_KINDS.forEach((kind) => {
    elements.files[kind].addEventListener("change", () => {
      updateUploadNotes();
      setDirtyState(true);
    });
  });

  document.querySelectorAll("[data-clear-upload]").forEach((button) => {
    button.addEventListener("click", () => {
      clearPendingUpload(button.dataset.clearUpload);
      setDirtyState(true);
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (!isDirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  });

  window.addEventListener("resize", () => {
    syncLibraryHeight();
  });
}

async function initialize() {
  elements.rootPathValue.textContent = expectedRootPath();
  renderThemeOptions();
  renderStats();
  updateSupportNote();
  attachEvents();

  selectedArchiveId = sortedArchives()[0]?.id ?? "";

  if (selectedArchiveId) {
    populateForm(selectedArchive());
  } else {
    populateForm(emptyArchiveDraft());
  }

  renderArchiveList();
  syncLibraryHeight();

  if ("ResizeObserver" in window && elements.editorPanel) {
    const observer = new ResizeObserver(() => {
      syncLibraryHeight();
    });
    observer.observe(elements.editorPanel);
  }

  await restoreStoredProjectRootHandle();
  syncLibraryHeight();
}

initialize();
