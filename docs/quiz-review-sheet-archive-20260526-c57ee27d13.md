# 確認クイズ レビューシート（血液製剤 追加設問）

アーカイブ「血液製剤」（`archive-20260526-c57ee27d13`）の確認クイズに追加した新規設問（`q5` / `q6`）を
薬剤師がレビューするための一覧です。既存のクイズファイル（`content/quizzes/archive-20260526-c57ee27d13.json`、
`reviewStatus: "reviewed"`）に **設問単位で `"reviewStatus": "draft"` を付けて追記**したものです。
ファイル全体は公開中のままですが、draft の設問だけは `npm run quiz:build` の出力
（`public/data/quiz-bank.js`）から自動的に除外されます。既存の `q1`〜`q4` および複数選択 `m1`
（`docs/quiz-review-sheet-multi.md` で承認済み）は変更していません。

## 使い方

1. 各設問の内容（設問文・選択肢・正答・解説）を確認する。
2. 各設問の「判定」欄に、問題なければ `OK`、修正が必要なら `要修正: <修正内容のメモ>` を記入する。
3. `OK` になった設問は、`content/quizzes/archive-20260526-c57ee27d13.json` の当該設問から
   **`"reviewStatus": "draft"` の行を削除する（または `"reviewed"` に変更する）**。
   ファイル全体の `reviewStatus` は `"reviewed"` のままでよい。
4. `npm run quiz:build` を実行して `public/data/quiz-bank.js` を再生成する。
   draft を外した設問だけが公開データに収録される。
5. 検証だけ先に見たい場合は `npm run quiz:build:dry`。`--include-drafts` を付けると draft 設問も含めて
   出力内容を確認できる（公開ファイルは書き換えない）。

※ このシート自体はレビュー記録用であり、`content/quizzes/*.json` を直接書き換えるものではありません。
※ 出題は `content/quizzes/_sources.json` の当該アーカイブの `summary` / `overview` / `keyPoints` の範囲内に
限定し、医学的内容の創作は行っていません。

## サマリー

| # | クイズファイル | 対象アーカイブ（タイトル・日付） | 設問ID | type | reviewStatus |
| --- | --- | --- | --- | --- | --- |
| 1 | `archive-20260526-c57ee27d13.json` | 血液製剤（2026-05-26） | q5 | single | draft |
| 2 | `archive-20260526-c57ee27d13.json` | 血液製剤（2026-05-26） | q6 | single | draft |

**複数選択の見送りについて**: 依頼では「素材的に成立するなら1問は複数選択に」とのことでしたが、
この回の素材（`_sources.json`）は summary 1文・overview 2文・keyPoints 3点のみで、keyPoints 3点は
既に承認済みの複数選択設問 `m1`（`docs/quiz-review-sheet-multi.md` #6）がすべて使用済みです。
新たに複数選択を作ると `m1` のサブセット（重複）か、summary/overview の言い換え（情報量ゼロ）に
しかならないと判断し、単一選択2問（`q5`: keyPoint「種類と特徴を整理する」／`q6`: keyPoint「副作用や
管理上の確認事項を押さえる」）としました。両方とも `q1`〜`q4`・`m1` では単独設問化されていなかった
keyPoints を素材に、既存 `q3` と同型の「現場での確認事項」形式で作問しています。

## クイズ詳細

### `archive-20260526-c57ee27d13.json` — 血液製剤（2026-05-26）

- archiveId: `archive-20260526-c57ee27d13`
- テーマ: 基礎レクチャー（foundations）
- ファイル reviewStatus: `reviewed`（既存設問 q1〜q4, m1 は変更なし）

#### q5（新規・single・reviewStatus: draft）

- 出典: keyPoints「血液製剤の種類と特徴を整理する」

**設問**: 血液製剤について、この勉強会が個別の整理項目として挙げているキーポイントはどれですか。

**選択肢**:

- a. 血液製剤の院内在庫を一元管理するシステムを導入する
- b. 血液製剤の種類と特徴を整理する ✅
- c. 血液製剤の需要予測モデルを構築する

**解説**: キーポイントの一つとして、血液製剤の種類と特徴を整理することが挙げられています。

**判定**: 

---

#### q6（新規・single・reviewStatus: draft）

- 出典: keyPoints「副作用や管理上の確認事項を押さえる」

**設問**: 投与後の対応に関して、この勉強会のキーポイントに挙げられている確認事項はどれですか。

**選択肢**:

- a. 投与実績を院内感染対策委員会へ定期報告する
- b. 血液製剤の廃棄基準を新たに策定する
- c. 副作用や管理上の確認事項を押さえる ✅

**解説**: キーポイントの一つとして、副作用や管理上の確認事項を押さえることが挙げられています。

**判定**: 

---
