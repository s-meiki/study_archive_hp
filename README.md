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
  - 詳細ページ: `http://localhost:3000/archive?id=archive-20241210-c9374cc04a`
  - 学会年会一覧: `http://localhost:3000/annual-meetings-2026`
  - 問い合わせフォーム: `http://localhost:3000/contact`
  - 利用規約: `http://localhost:3000/terms`
  - プライバシーポリシー: `http://localhost:3000/privacy`
  - 管理画面: `http://localhost:4173/admin/`

管理画面は引き続き静的ファイルなので、必要なら別ターミナルで次を使います。

```bash
python3 -m http.server 4173
```

## 環境変数

`.env.local` に次を設定します。

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain
NEXT_PUBLIC_CF_SITE_KEY=...
CF_SECRET_KEY=...
WEBHOOK_URL=...
```

## デプロイ

このリポジトリは Vercel での運用を前提にしています。Vercel 側にも同じ環境変数を登録してください。

`NEXT_PUBLIC_SITE_URL` を入れると、`/` の OGP と canonical URL を本番ドメイン基準で生成できます。未設定でも、Vercel の `VERCEL_PROJECT_PRODUCTION_URL` を使って自動解決するようにしています。

## 運用上の注意

- 本サイトは `関係者向け` を前提としているため、公開ページと Next.js ページは `noindex` で配信する想定です。一般公開へ切り替える場合は `robots` 設定を見直してください。
- `Google Drive` `Google Forms` `Vimeo` `Loom` などの外部サービスを追加したら、`app/privacy/page.tsx` と `app/terms/page.tsx` の文面も更新してください。
- 本番ドメインが確定するまでは、静的トップページに絶対 URL の OGP を固定しないでください。共有向けの OGP を入れる場合は、公開 URL 確定後に設定してください。

## 更新フロー

1. `admin/index.html` で URL や資料を編集
2. `一覧へ反映` を押す
3. `リポジトリへ保存` で `public/data/site-content.js` と `public/uploads/` を更新

Excel から再生成したいときは次を使います。

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```
