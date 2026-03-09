# Study Archive

公開ページと管理画面を分けた、静的な勉強会アーカイブです。

## フォルダ構成

```text
public/   公開するページと配布ファイル
admin/    ローカル運用用の管理画面
content/  元Excelなどの保存用データ
scripts/  一括取り込みや補助スクリプト
docs/     運用メモ
```

## 使い方

- 公開ページを確認: `open public/index.html`
- 管理画面を開く: `open admin/index.html`
- ローカルサーバー: `python3 -m http.server 4173`
- ブラウザ表示:
  - 公開ページ: `http://localhost:4173/public/`
  - 管理画面: `http://localhost:4173/admin/`

## 更新フロー

1. `admin/index.html` で URL や資料を編集
2. `一覧へ反映` を押す
3. `リポジトリへ保存` で `public/data/site-content.js` と `public/uploads/` を更新

Excel から再生成したいときは次を使います。

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```
