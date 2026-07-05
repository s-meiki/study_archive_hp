"use client";

import { useRef, useState } from "react";
import { useProgress } from "../learning/progress-context";

const DOWNLOAD_FILE_NAME = "study-progress.json";

type MessageState = { type: "success" | "error"; text: string } | null;

export default function DataPortability() {
  const { store } = useProgress();

  const [exportText, setExportText] = useState("");
  const [exportMessage, setExportMessage] = useState<MessageState>(null);

  const [importText, setImportText] = useState("");
  const [importMessage, setImportMessage] = useState<MessageState>(null);
  const [importConfirming, setImportConfirming] = useState(false);

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
    const json = exportText || store.exportJson();
    if (!exportText) {
      setExportText(json);
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = downloadLinkRef.current;
    if (link) {
      link.href = url;
      link.download = DOWNLOAD_FILE_NAME;
      link.click();
    }
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    if (!importText.trim()) {
      setImportMessage({ type: "error", text: "読み込むデータを貼り付けてください。" });
      setImportConfirming(false);
      return;
    }
    if (!importConfirming) {
      setImportConfirming(true);
      setImportMessage(null);
      return;
    }
    const result = store.importJson(importText);
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

  function handleResetClick() {
    if (!resetConfirming) {
      setResetConfirming(true);
      setResetMessage(null);
      return;
    }
    store.reset();
    setResetConfirming(false);
    setResetMessage({ type: "success", text: "すべての進捗を削除しました。" });
    setExportText("");
    setImportText("");
  }

  function handleResetCancel() {
    setResetConfirming(false);
    setResetMessage(null);
  }

  return (
    <details className="learn-portability-panel">
      <summary className="learn-portability-summary">進捗データの引き継ぎ</summary>

      <div className="learn-portability-body">
        <p className="learn-portability-copy">
          この端末に保存されている学習進捗を書き出したり、別の端末で書き出したデータを読み込んだりできます。
        </p>

        <section className="learn-portability-section" aria-labelledby="learn-portability-export-heading">
          <h3 id="learn-portability-export-heading" className="learn-portability-heading">
            書き出し
          </h3>
          <div className="learn-portability-actions">
            <button type="button" className="learn-portability-button" onClick={handleExport}>
              進捗データを表示する
            </button>
            <button
              type="button"
              className="learn-portability-button"
              onClick={handleCopy}
              disabled={!exportText}
            >
              コピー
            </button>
            <button
              type="button"
              className="learn-portability-button"
              onClick={handleDownload}
            >
              .json をダウンロード
            </button>
          </div>
          <textarea
            className="learn-portability-textarea"
            readOnly
            rows={8}
            placeholder="「進捗データを表示する」を押すとここに表示されます。"
            value={exportText}
            aria-label="書き出した進捗データ"
          />
          {exportMessage ? (
            <p
              className={`learn-portability-message learn-portability-message--${exportMessage.type}`}
              role="status"
            >
              {exportMessage.text}
            </p>
          ) : null}
          {/* ダウンロード用の非表示リンク。クリックはJSから発火する。 */}
          <a ref={downloadLinkRef} className="learn-portability-visually-hidden" href="#download">
            ダウンロード
          </a>
        </section>

        <section className="learn-portability-section" aria-labelledby="learn-portability-import-heading">
          <h3 id="learn-portability-import-heading" className="learn-portability-heading">
            読み込み
          </h3>
          <textarea
            className="learn-portability-textarea"
            rows={8}
            placeholder="別の端末で書き出した進捗データ（JSON）をここに貼り付けてください。"
            value={importText}
            onChange={(event) => {
              setImportText(event.target.value);
              setImportConfirming(false);
            }}
            aria-label="読み込む進捗データ"
          />
          <div className="learn-portability-actions">
            <button type="button" className="learn-portability-button" onClick={handleImportClick}>
              読み込む
            </button>
            {importConfirming ? (
              <button type="button" className="learn-portability-button" onClick={handleImportCancel}>
                キャンセル
              </button>
            ) : null}
          </div>
          {importConfirming ? (
            <p className="learn-portability-message learn-portability-message--warning" role="alert">
              現在の進捗はこのデータで置き換わります。よろしければもう一度「読み込む」を押してください。
            </p>
          ) : null}
          {importMessage ? (
            <p
              className={`learn-portability-message learn-portability-message--${importMessage.type}`}
              role="status"
            >
              {importMessage.text}
            </p>
          ) : null}
        </section>

        <section className="learn-portability-section learn-portability-danger" aria-labelledby="learn-portability-reset-heading">
          <h3 id="learn-portability-reset-heading" className="learn-portability-heading">
            リセット
          </h3>
          <div className="learn-portability-actions">
            <button
              type="button"
              className="learn-portability-button learn-portability-button--danger"
              onClick={handleResetClick}
            >
              すべての進捗を削除
            </button>
            {resetConfirming ? (
              <button type="button" className="learn-portability-button" onClick={handleResetCancel}>
                キャンセル
              </button>
            ) : null}
          </div>
          {resetConfirming ? (
            <p className="learn-portability-message learn-portability-message--warning" role="alert">
              本当にすべての進捗を削除しますか。この操作は取り消せません。よろしければもう一度「すべての進捗を削除」を押してください。
            </p>
          ) : null}
          {resetMessage ? (
            <p
              className={`learn-portability-message learn-portability-message--${resetMessage.type}`}
              role="status"
            >
              {resetMessage.text}
            </p>
          ) : null}
        </section>
      </div>
    </details>
  );
}
