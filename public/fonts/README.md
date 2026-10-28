# ローカル配信フォント

Inter と Noto Sans JP を同梱し、ビルド時・閲覧時の Google Fonts への通信をなくしています。
`app/fonts.css` の `unicode-range` により、表示する文字に必要な WOFF2 のみをブラウザが読み込みます。

- 元データ: このサイトの既存 `next/font/google` ビルド成果物（2026-09-05 に `.next-dev/static/media` と `static/css/app/layout.css` から取得）。フォントのバイナリ、可変ウェイト、Unicode の範囲と代替フォントのメトリクスは変更していません。
- 配信ファイル: WOFF2 131 個、計 5,440,724 bytes。ファイル名は既存ビルド時のハッシュ名を保持しています。
- Inter: https://github.com/rsms/inter — 同梱ライセンス `Inter-OFL.txt`。
- Noto Sans JP: https://github.com/google/fonts/tree/main/ofl/notosansjp — 同梱ライセンス `NotoSansJP-OFL.txt`。
- ライセンス取得日: 2026-09-05。両者とも SIL Open Font License 1.1。

更新時はフォント本体と CSS の `src` / `unicode-range` / ウェイトを一緒に更新し、対応するライセンスを保持してください。通常のビルドでフォントの再取得は不要です。
