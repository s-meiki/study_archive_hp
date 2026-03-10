# Study Archive

公開ページと管理画面を分けた勉強会アーカイブです。公開側は Next.js で配信し、`/contact` の問い合わせフォームは Turnstile 検証後に Discord Webhook へ通知します。

## フォルダ構成

```text
app/      Next.js のページと API ルート
public/   公開する静的ページと配布ファイル
admin/    ローカル運用用の管理画面
content/  元Excelなどの保存用データ
scripts/  一括取り込みや補助スクリプト
docs/     運用メモ
```

## 使い方

- 依存関係の導入: `npm install`
- 公開ページの開発: `npm run dev`
- 管理画面を開く: `open admin/index.html`
- ブラウザ表示:
  - 公開ページ: `http://localhost:3000/`
  - 問い合わせフォーム: `http://localhost:3000/contact`
  - 管理画面: `http://localhost:4173/admin/`

管理画面は引き続き静的ファイルなので、必要なら別ターミナルで次を使います。

```bash
python3 -m http.server 4173
```

## 環境変数

`.env.local` に次を設定します。

```bash
NEXT_PUBLIC_CF_SITE_KEY=...
CF_SECRET_KEY=...
WEBHOOK_URL=...
```

## デプロイ

このリポジトリは Vercel での運用を前提にしています。Vercel 側にも同じ環境変数を登録してください。

## 更新フロー

1. `admin/index.html` で URL や資料を編集
2. `一覧へ反映` を押す
3. `リポジトリへ保存` で `public/data/site-content.js` と `public/uploads/` を更新

Excel から再生成したいときは次を使います。

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```
