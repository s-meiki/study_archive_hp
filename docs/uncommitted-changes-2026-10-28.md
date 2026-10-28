# 未コミット変更の整理記録

確認日: 2026-10-28（Asia/Tokyo）。対象は開始時の変更226ファイル。

## 保存とブランチの分離

- 実際のグローバル規約とリポジトリの `AGENTS.md` を読んだ。`AI_LESSONS.md` は対象内に見つからなかった。
- 元チェックアウトのHEADは `701357237ba8acc956566555a8e5b0621c3565a8`、ブランチは `update-annual-meeting-official-listings-2026-10-27`。
- 作業前に全226ファイル、Git bundle、index、status、binary diff、SHA-256一覧をリポジトリ外へ保存し、アーカイブ内の全ファイルを照合した。
- 専用worktreeを `96781b67a62331b93943aee7518a1958e27b1563`（確認時のorigin/main）から作成。ブランチは `codex/organize-pending-changes-2026-10-28`。
- 元チェックアウトは変更せず、HEAD・完全なstatus出力・全226ファイルのSHA-256が開始時と一致することを確認した。
- 各コミットは明示的な個別パスだけをstageし、stage済みのパス集合・差分・Git blobのSHA-256を確認した。191ファイルは開始時と同じ内容でコミット。残る35ファイルも原文のまま保持。
- 年会コミット `7013572` は新ブランチの祖先に含まれない。`public/data/` は起点から差分なし。PR #3の変更・マージ・再デプロイは実施しない。

## コミットの分割

| コミット | 内容 | ファイル数 |
| --- | --- | ---: |
| `27b425b` | Inter / Noto Sans JPのローカル配信、CSS、ライセンス | 136 |
| `ff622a6` | 学習進捗の排他保存、取り込み・バックアップ、保存失敗時の案内、回帰テスト | 6 |
| `ed6e5f4` | 問い合わせの入力検証、配送タイムアウト、本文保持、回帰テスト | 2 |
| `d2d67c6` | 教材データ検証、読み込み障害の表示と再試行、回帰テスト | 4 |
| `869e409` | デザイン更新・作業分解・クイズ作成のスキルと評価定義 | 5 |
| `83b99d5` | 教材構成、初回台本、TTS 8本、HTML/PNG、生成ツールと辞書 | 38 |

本記録は上記とは別のドキュメントコミットで保存する。

## 資産と生成物の確認

- フォント131本・5,440,724 bytes。CSS参照集合と実ファイル集合が一致し、全バイナリをfontToolsで読み取った。Inter 7本、Noto Sans JP 124本。内部著作権表記と同梱ライセンスの権利者が一致。
- [Interの公式OFL](https://raw.githubusercontent.com/rsms/inter/master/LICENSE.txt) と [Noto Sans JPの公式OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/OFL.txt) を確認。同梱ライセンスは原文保持。`NotoSansJP-OFL.txt:21` に公式原文にもある末尾空白1か所があり、通常の `git diff --check` はそこを指摘する。それ以外にstage差分の空白エラーはない。
- YouTube画像8枚はすべて480×360、EXIFなし。メタデータに元URL・動画IDはあるが、公開GitHubへの同梱・再配布の許諾根拠は確認できていない。取得元URLがあることを許諾の証明とは扱わない。
- 教材のTTS 8/8は台本と辞書からの再計算に完全一致。個別HTML 8/8は親HTMLからの分割結果に完全一致。PNG 8/8は1920×1080、全枚の目視で文字欠け・第三者画像を認めなかった。
- Pythonツール2本の構文を確認。教材は制作資料であり、全12回の医学的・制度的な内容検証完了を意味しない。第9回の実例と制度要件の確認は原稿内の未完了事項のまま。
- スライドはGoogle Fontsの外部参照を使う。オフライン再生成と、過去の本人ヒアリング・収録承認記録の独立確認は未実施。`export_slides.py` は撮影失敗時の旧PNG誤認余地があり、今回の原文保存では改修していない。
- 追加ファイルの認証情報パターン検査に一致なし。教材に患者氏名・年齢・性別・施設名・具体的診療日は見当たらない。

## 今回の再検証

未コミット分を含む全226ファイルのコピーと、push対象のコミットだけのコピーを区別した。

| 対象 | 検証 | 結果 |
| --- | --- | --- |
| 全変更のコピー | 一時ディレクトリで `npm ci --no-audit --no-fund` | 成功。既存node_modulesは変更していない |
| 全変更のコピー | `npm run verify` | Node 22件、43ページ生成、PC/スマホ18件が成功 |
| `83b99d5` のGit archive | コンテンツ・公開情報・アップロードメタデータ検査 | 成功。24教材、テーマ参照・日付順を確認 |
| 同上 | learning / quiz生成のdry-run | 6コース・24レッスン・24クイズ、書込みなし |
| 同上 | `node --test tests/*.test.cjs` | 15件成功 |
| 同上 | `npm run build` | 型検査と43ページ生成が成功 |
| 同上 | 一時配置したPlaywright設定・テストから対象機能だけ実行 | PC/スマホ14件成功（13.3秒） |
| 同上 | PC/スマホのホーム画面 | スクリーンショットを目視確認 |

push対象の操作検証には保留中のテスト定義を一時コピーし、`--grep-invert '検索条件を共有|ホームの録画'` で、保留した機能に依存する2シナリオ×2環境を除外した。アプリコードはGit archiveの内容のまま。確認したのは主要ページ、テーマ、進捗→クイズ→修了→バッジ→書き出し、複数タブ、正常/不正取り込みとバックアップ復元、保存失敗、問い合わせ不正JSON。

`package.json`・Playwright設定・Actionsは下記の保留対象なので、このコミットだけのブランチには `npm run verify` コマンドはまだ追加されていない。ブラウザ検証は一時ハーネスを使った今回の検証である。実機Safari/Firefox、問い合わせの実送信・実Turnstile認証、YouTube全動画の実再生、CIの実サービス実行、本番反映は検証していない。

## 保留35ファイル

画像8枚の同梱・再配布許諾が未確認のため、画像と依存するホーム・一覧・詳細表示、検索URLの混在差分を27ファイル単位で保留する。現状のE2Eは新ホームと画像8枚を必須条件とし、package.json、AGENTS.md、信頼性資料もその検証入口を前提としているため、関連8ファイルも同時に保留する。元データの削除や巻き戻しはしていない。

### ホーム・アーカイブ・画像と依存ファイル（27）

- `app/archives/[archiveId]/archive-recording.module.css`
- `app/archives/[archiveId]/archive-recording.tsx`
- `app/archives/[archiveId]/page.tsx`
- `app/archives/archive-library.module.css`
- `app/archives/archive-library.tsx`
- `app/archives/page.module.css`
- `app/archives/page.tsx`
- `app/archives/search-filters.ts`
- `app/home/home-dashboard.module.css`
- `app/home/home-dashboard.tsx`
- `app/home/home-static-cards.tsx`
- `app/home/home-types.ts`
- `app/lib/archive-presentation.ts`
- `app/page.tsx`
- `content/archive-thumbnails.json`
- `docs/content-centered-home.md`
- `public/images/archives/archive-20241210-c9374cc04a.jpg`
- `public/images/archives/archive-20250419-93d5ff6ad9.jpg`
- `public/images/archives/archive-20250512-f649d5f0a6.jpg`
- `public/images/archives/archive-20250610-e55425f87e.jpg`
- `public/images/archives/archive-20260318-1yp7m9p.jpg`
- `public/images/archives/archive-20260408-3a9fc4db6d.jpg`
- `public/images/archives/archive-20260424-7f508bbae8.jpg`
- `public/images/archives/archive-20260515-4799a9755a.jpg`
- `scripts/refresh_archive_thumbnails.js`
- `tests/archive-presentation.test.cjs`
- `tests/search-filters.test.cjs`

### 検証基盤・規約・資料（8）

- `.gitignore`
- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `.github/workflows/verify.yml`
- `tests/e2e/site.spec.ts`
- `docs/site-reliability-improvements.md`

画像の許諾が確認できた場合は、上記35ファイルを元スナップショットと照合し、機能群と検証基盤の2まとまりでコミットする。既存の年会ブランチには追加しない。
