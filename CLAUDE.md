# study_archive_hp — Claude Code

リポジトリの規約・構成・検証手順は @AGENTS.md に集約されている（英語）。必ずそれに従うこと。

## 補足（Claude Code 向け）
- ユーザーへの回答・報告は日本語で行う（コード・キーは AGENTS.md の規約どおり）。
- `.env.local` は秘密情報。読まない・値を出力しない（設定状態の確認はスクリプトの出力経由で）。
- 生成データ（`public/data/site-content.js`）は手編集せず、`scripts/import_archives_from_xlsx.py` を直す。
- デプロイ・外部書込みは dry-run → めいきの承認 → 実行の順。

@AGENTS.md
