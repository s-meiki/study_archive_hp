# 勉強会アーカイブ 更新メモ

## 編集する場所
- 元データ: `/Users/meiki/Devloper/study_archive_hp/content/source/lecture-archives.xlsx`
- 公開用データ: `/Users/meiki/Devloper/study_archive_hp/data/site-content.js`
- 変換スクリプト: `/Users/meiki/Devloper/study_archive_hp/scripts/import_archives_from_xlsx.py`
- 表示ロジック: `/Users/meiki/Devloper/study_archive_hp/assets/app.js`
- 見た目: `/Users/meiki/Devloper/study_archive_hp/assets/styles.css`

通常は `admin.html` から更新するのが最短です。Excel 取り込みは一括更新したいときだけ使います。

## いちばん簡単な更新方法
1. `/Users/meiki/Devloper/study_archive_hp/admin.html` を開く
2. `新規追加` か既存アーカイブの編集を選ぶ
3. `アーカイブ URL` や `スライド URL` を入力する
4. Chrome / Edge なら `保存先フォルダを接続` -> `プロジェクトへ保存`
5. それ以外のブラウザなら `data をダウンロード` して `data/site-content.js` を置き換える

## 資料ファイルを直接置きたいとき
- Chrome / Edge の `admin.html` では、スライド・メモ・参考資料をファイル選択できます
- `プロジェクトへ保存` を押すと `content/uploads/` 配下へ自動で配置されます
- 保存後、リンクは相対パスに自動で切り替わります

## 動画URLについて
- `YouTube のURLで問題ありません`
- `admin.html` の `アーカイブ URL` に通常の共有URLをそのまま入れれば大丈夫です
- 例:

```text
https://www.youtube.com/watch?v=xxxxxxxxxxx
```

## 1件追加するときの流れ
1. `admin.html` を開いて `新規追加` を押す
2. タイトル、開催日、講師、テーマを入れる
3. 録画URLや資料URLを入力する。必要なら資料ファイルを選ぶ
4. `一覧へ反映` を押す
5. `プロジェクトへ保存` か `data をダウンロード` を実行する

## Excel からまとめて取り込みたいとき
1. `content/source/lecture-archives.xlsx` を更新する
2. リポジトリ直下で次を実行する

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```

3. `index.html` を開いて表示確認する
4. 問題なければ公開する

## 最低限入れる項目

```text
開催日 | 内容 | 講師 | アーカイブリンク | 参考資料
```

## 項目の考え方
- `開催日`: Excel の日付形式で入力する
- `内容`: ページにそのまま近い形で出るので、タイトルとして読める書き方にする
- `講師`: 一覧カード右下に表示される
- `アーカイブリンク`: 録画URL。未公開なら空欄でよい
- `参考資料`: 補助資料URL。未公開なら空欄でよい

## テーマ分けについて
- 現在はタイトル内キーワードから自動分類しています
- 分類ロジックを変える場合は `scripts/import_archives_from_xlsx.py` を更新します
- テーマを追加したい場合も、同じスクリプト内の `THEMES` と分類ルールを更新します

## ローカル確認について
- この実装は `index.html` を直接開いても確認できます
- ローカルサーバーで確認したい場合は、このフォルダで簡単なサーバーを立てても大丈夫です
- 例:

```bash
cd /Users/meiki/Devloper/study_archive_hp
python3 -m http.server 4173
```

その後、ブラウザで `http://localhost:4173` を開きます。
