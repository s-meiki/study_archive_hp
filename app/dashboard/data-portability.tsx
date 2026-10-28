"use client";

import { useRef, useState } from "react";
import { previewProgressJson, type ProgressPreview } from "../learning/progress-store";
import { useProgress } from "../learning/progress-context";
import { Button } from "../ui/button";
import styles from "./data-portability.module.css";

const DOWNLOAD_FILE_NAME = "study-progress.json";

type MessageState = { type: "success" | "error"; text: string } | null;

const messageClassName: Record<"success" | "error" | "warning", string> = {
  success: styles.messageSuccess,
  error: styles.messageError,
  warning: styles.messageWarning
};

export default function DataPortability() {
  const { store } = useProgress();

  const [exportText, setExportText] = useState("");
  const [exportMessage, setExportMessage] = useState<MessageState>(null);

  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<MessageState>(null);
  const [importConfirming, setImportConfirming] = useState(false);

  const [preview, setPreview] = useState<ProgressPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [backupText, setBackupText] = useState("");

  const [resetConfirming, setResetConfirming] = useState(false);
  const [resetMessage, setResetMessage] = useState<MessageState>(null);

  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null);

  function handleExport() {
    const json = store.exportJson();
    setExportText(json);
    setExportMessage(null);
  }

  async function handleCopy() {
    if (!exportText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(exportText);
      setExportMessage({ type: "success", text: "クリップボードにコピーしました。" });
    } catch {
      setExportMessage({
        type: "error",
        text: "コピーに失敗しました。テキストエリアの内容を手動で選択してコピーしてください。"
      });
    }
  }

  function handleDownload() {
    const json = store.exportJson();
    setExportText(json);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;
    if (link) {
      link.href = url;
      link.download = DOWNLOAD_FILE_NAME;
      link.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function handleImportClick() {
    if (!importText.trim()) {
      setImportMessage({ type: "error", text: "読み込むデータを貼り付けてください。" });
      setImportConfirming(false);
      return;
    }
    if (!importConfirming) {
      const checked = previewProgressJson(importText);
      setPreview(checked);
      if (!checked.ok) {
        setImportMessage({ type: "error", text: checked.error! });
        return;
      }
      setImportConfirming(true);
      setImportMessage(null);
      return;
    }
    setBusy(true);
    const result = await store.importJson(importText);
    setBusy(false);
    if (result.ok) setBackupText(store.exportBackup() ?? "");
    if (result.ok) {
      setImportMessage({ type: "success", text: "進捗データを読み込みました。" });
    } else {
      setImportMessage({ type: "error", text: result.error ?? "読み込みに失敗しました。" });
    }
    setImportConfirming(false);
  }

  function handleImportCancel() {
    setImportConfirming(false);
    setImportMessage(null);
  }

  async function handleResetClick() {
    if (!resetConfirming) {
      setResetConfirming(true);
      setResetMessage(null);
      return;
    }
    setBusy(true);
    const result = await store.reset();
    setBusy(false);
    if (!result.ok) {
      setResetMessage({ type: "error", text: result.error! });
      setResetConfirming(false);
      return;
    }
    setResetConfirming(false);
    setResetMessage({ type: "success", text: "すべての進捗を削除しました。" });
    setBackupText(store.exportBackup() ?? "");
    setExportText("");
    setImportText("");
  }

  function handleResetCancel() {
    setResetConfirming(false);
    setResetMessage(null);
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>進捗データの引き継ぎ</summary>

      <div className={styles.body}>
        <p className={styles.copy}>
          この端末に保存されている学習進捗を書き出したり、別の端末で書き出したデータを読み込んだりできます。
        </p>

        <section className={styles.section} aria-labelledby="dashboard-portability-export-heading">
          <h3 id="dashboard-portability-export-heading" className={styles.heading}>
            書き出し
          </h3>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" size="sm" onClick={handleExport}>
              進捗データを表示する
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleCopy} disabled={!exportText}>
              コピー
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleDownload}>
              .json をダウンロード
            </Button>
          </div>
          <textarea
            className={styles.textarea}
            readOnly
            rows={8}
            placeholder="「進捗データを表示する」を押すとここに表示されます。"
            value={exportText}
            aria-label="書き出した進捗データ"
          />
          {exportMessage ? (
            <p className={`${styles.message} ${messageClassName[exportMessage.type]}`} role="status">
              {exportMessage.text}
            </p>
          ) : null}
          {/* ダウンロード用の非表示リンク。クリックはJSから発火する。 */}
          <a ref={downloadLinkRef} className="visually-hidden" href="#download">
            ダウンロード
          </a>
        </section>

        <section className={styles.section} aria-labelledby="dashboard-portability-import-heading">
          <h3 id="dashboard-portability-import-heading" className={styles.heading}>
            読み込み
          </h3>
          <textarea
            className={styles.textarea}
            rows={8}
            placeholder="別の端末で書き出した進捗データ（JSON）をここに貼り付けてください。"
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportConfirming(false);
            }}
            aria-label="読み込む進捗データ"
          />
          <div className={styles.actions}>
            <Button type="button" variant="secondary" size="sm" onClick={handleImportClick} disabled={busy}>
              読み込む
            </Button>
            {importConfirming ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleImportCancel}>
                キャンセル
              </Button>
            ) : null}
          </div>
          {importConfirming ? (
            <p className={`${styles.message} ${messageClassName.warning}`} role="alert">
              教材 {preview?.lessons} 件・バッジ {preview?.badges} 件を読み込みます。現在の進捗はバックアップを保存した後、このデータで置き換わります。よろしければもう一度「読み込む」を押してください。
            </p>
          ) : null}
          {importMessage ? (
            <p className={`${styles.message} ${messageClassName[importMessage.type]}`} role="status">
              {importMessage.text}
            </p>
          ) : null}
        </section>

        <section className={styles.section} aria-label="読み込み前のバックアップ">
          <h3 className={styles.heading}>置き換え前のバックアップ</h3>
          <Button type="button" variant="secondary" size="sm" onClick={() => {
            const saved = store.exportBackup();
            setBackupText(saved ?? "バックアップはありません。");
          }}>直前のバックアップを表示</Button>
          {backupText ? <textarea className={styles.textarea} readOnly rows={8} value={backupText} aria-label="置き換え前のバックアップデータ" /> : null}
          <p className={styles.copy}>復元する場合は、この内容を「読み込み」に貼り付けてください。</p>
        </section>

        <section className={`${styles.section} ${styles.danger}`} aria-labelledby="dashboard-portability-reset-heading">
          <h3 id="dashboard-portability-reset-heading" className={styles.heading}>
            リセット
          </h3>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" size="sm" onClick={handleResetClick} disabled={busy}>
              すべての進捗を削除
            </Button>
            {resetConfirming ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleResetCancel}>
                キャンセル
              </Button>
            ) : null}
          </div>
          {resetConfirming ? (
            <p className={`${styles.message} ${messageClassName.warning}`} role="alert">
              本当にすべての進捗を削除しますか。削除前の進捗はバックアップに保存されます。よろしければもう一度「すべての進捗を削除」を押してください。
            </p>
          ) : null}
          {resetMessage ? (
            <p className={`${styles.message} ${messageClassName[resetMessage.type]}`} role="status">
              {resetMessage.text}
            </p>
          ) : null}
        </section>
      </div>
    </details>
  );
}
