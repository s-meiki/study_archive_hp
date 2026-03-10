# 勉強会アーカイブ 更新メモ

## 編集する場所
- 元データ: `/Users/meiki/Devloper/study_archive_hp/content/source/lecture-archives.xlsx`
- 公開用データ: `/Users/meiki/Devloper/study_archive_hp/public/data/site-content.js`
- 変換スクリプト: `/Users/meiki/Devloper/study_archive_hp/scripts/import_archives_from_xlsx.py`
- 表示ロジック: `/Users/meiki/Devloper/study_archive_hp/public/assets/app.js`
- 見た目: `/Users/meiki/Devloper/study_archive_hp/public/assets/styles.css`

通常は `admin/index.html` から更新するのが最短です。Excel 取り込みは一括更新したいときだけ使います。

## いちばん簡単な更新方法
1. `/Users/meiki/Devloper/study_archive_hp/admin/index.html` を開く
2. `新規追加` か既存アーカイブの編集を選ぶ
3. `アーカイブ URL` や `スライド URL` を入力する
4. Chrome / Edge なら `リポジトリを接続` -> `リポジトリへ保存`
5. それ以外のブラウザなら `data をダウンロード` して `public/data/site-content.js` を置き換える

## 資料ファイルを直接置きたいとき
- Chrome / Edge の `admin/index.html` では、スライド・メモ・参考資料をファイル選択できます
- `リポジトリへ保存` を押すと `public/uploads/` 配下へ自動で配置されます
- 保存後、リンクは相対パスに自動で切り替わります

## 動画URLについて
- `YouTube のURLで問題ありません`
- `admin/index.html` の `アーカイブ URL` に通常の共有URLをそのまま入れれば大丈夫です
- 例:

```text
https://www.youtube.com/watch?v=xxxxxxxxxxx
```

## 1件追加するときの流れ
1. `admin/index.html` を開いて `新規追加` を押す
2. タイトル、開催日、講師、テーマを入れる
3. 録画URLや資料URLを入力する。必要なら資料ファイルを選ぶ
4. `一覧へ反映` を押す
5. `リポジトリへ保存` か `data をダウンロード` を実行する

## Excel からまとめて取り込みたいとき
1. `content/source/lecture-archives.xlsx` を更新する
2. リポジトリ直下で次を実行する

```bash
python3 scripts/import_archives_from_xlsx.py --source content/source/lecture-archives.xlsx
```

3. `public/index.html` を開いて表示確認する
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
- この実装は `public/index.html` を直接開いても確認できます
- ローカルサーバーで確認したい場合は、このフォルダで簡単なサーバーを立てても大丈夫です
- 例:

```bash
cd /Users/meiki/Devloper/study_archive_hp
python3 -m http.server 4173
```

その後、ブラウザで `http://localhost:4173/public/` を開きます。

## セキュリティ運用ルール
- `public/data/site-content.js` と `public/uploads/` には、公開して問題ない情報だけを置く
- メールアドレス、ログイン情報、氏名、施設名、内部メモ、限定公開URL、トークン、APIキーは公開データへ入れない
- APIキー、環境変数、認証トークン、DB 接続情報は絶対にハードコードしない
- 個人情報や機密情報を扱う処理はクライアントサイドではなくサーバーサイドで実装する
- サーバーから返す JSON / HTML / API レスポンスは最小限にし、ブラウザの開発者ツールで見えても問題ない内容だけを返す
- ユーザー入力や外部データを画面表示するときは、XSS を防ぐため HTML 注入を避け、エスケープまたはサニタイズを行う
- 更新系 API を追加する場合は、CSRF トークン、`SameSite` Cookie、`Origin / Referer` 検証を前提にする
- DB を使う機能を追加する場合は、SQL を文字列連結せず、プレースホルダや ORM のバインド機能を使う
- 外部画像、外部埋め込み、外部スクリプト、外部 API を追加した時は、HTML の CSP も合わせて更新する

## 公開前のセキュリティ確認
1. `python3 scripts/check_public_security_basics.py` を実行し、公開データ内のメールアドレス、秘密っぽい値、危険な URL が検出されないことを確認する
2. `python3 scripts/check_public_uploads_metadata.py` を実行し、`.DS_Store` や macOS 拡張属性、資料メタデータの異常がないことを確認する
3. `public/data/site-content.js` に個人情報や機密情報が入っていないか確認する
4. `public/uploads/` の PDF や資料ファイルに個人情報、コメント、埋め込みメタデータが残っていないか確認する
5. ブラウザのネットワークタブでレスポンスを確認し、不要な個人情報や内部情報が返っていないか確認する
6. 将来 API やログイン機能を追加した場合は、XSS / CSRF / SQL インジェクション対策の観点でレビューしてから公開する

## macOS で資料を扱うときの注意
- Finder で触った PDF やフォルダには、`com.apple.quarantine` や `kMDItemWhereFroms` などの拡張属性が付くことがあります
- 公開前に `python3 scripts/check_public_uploads_metadata.py` で検出し、必要なら `xattr -cr public/uploads` で消してから確認し直します
- `public/uploads/` 配下に `.DS_Store` が残っていないことも確認します
