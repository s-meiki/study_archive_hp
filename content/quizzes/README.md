# content/quizzes — 確認クイズの執筆・レビュー手順

各アーカイブの理解確認クイズ（ArchiveQuiz）のソースを管理するディレクトリ。ここに置いた `*.json` を元に、ビルドスクリプトが `public/data/quiz-bank.js`（`window.QUIZ_BANK`）を生成する。

## ファイル構成

- `content/quizzes/<archiveId>.json` — アーカイブ1件につき1ファイル。`ArchiveQuiz` 型（`app/learning/types.ts`）準拠。
- `content/quizzes/_template.json` — 新規作成時の見本（見本1問付き）。コピーして使う。
- `content/quizzes/_sources.json` — `scripts/generate_quiz_drafts.py` が生成する、クイズ未作成アーカイブの出題材料一覧。**これ自体はビルド対象ではない**（ファイル名が `_` で始まるものはビルドで無視される）。
- `content/quizzes/README.md` — 本ファイル。

## スキーマ（ArchiveQuiz）

```jsonc
{
  "archiveId": "archive-YYYYMMDD-xxxxxxxxxx", // site-content.js の archives[].id と一致させる
  "passThreshold": 0.7,                       // 標準値。原則そのまま使う
  "questions": [
    {
      "id": "q1",
      "prompt": "設問文",
      "choices": [
        { "id": "a", "text": "選択肢A" },
        { "id": "b", "text": "選択肢B" },
        { "id": "c", "text": "選択肢C" }
        // 3〜4択。id は a, b, c, d を使う
      ],
      "answerId": "a",           // choices のいずれか1つの id
      "explanation": "なぜ正しいかを出典の記述に沿って1〜2文で説明"
    }
  ],
  "reviewStatus": "draft",       // "draft" | "reviewed"（レビュー完了で "reviewed" に変更）
  "generatedBy": "ai",           // 人間が新規に書いた場合は省略可
  "updatedAt": "2026-07-05"      // YYYY-MM-DD
}
```

## 出題品質ルール（必須）

1. **出典の範囲内で出題する。** 問題は該当アーカイブの `title` / `summary` / `overview`（`detail.overview`）/ `keyPoints`（`detail.keyPoints`）に書かれている内容の理解確認に限る。出典に書かれていない臨床的断定を創作しない。
2. **3〜4択、正解は1つ。** 選択肢 id は `a`〜`d` を使う。誤答の選択肢は「もっともらしい誤り」にする（無関係すぎる選択肢や、明らかに変な文章は避ける）。
3. **explanation は出典に基づく1〜2文。** 「なぜ正しいか」を出典の記述に沿って書く。出典にない理由付けをしない。
4. **医療安全に関わる断定的な数値・用量は出題しない。** 具体的な投与量・用量・カットオフ値などはレビューで確認しづらく、誤りが医療安全に直結するため出題対象から外す。病態理解・治療方針・考え方の整理を優先する。

## 執筆・レビュー手順

1. `content/quizzes/_template.json` を `content/quizzes/<archiveId>.json` としてコピーする（`archiveId` は `content/quizzes/_sources.json` または `public/data/site-content.js` の `archives[].id` から取得）。
2. `_sources.json` の該当エントリ（`title` / `summary` / `overview` / `keyPoints`）だけを根拠に設問・選択肢・explanation を書く。出題品質ルールを満たすこと。
3. 書き終えたら `reviewStatus` は `"draft"` のままにしておく（レビュー前提のため）。
4. 人間によるレビューが完了したら、`reviewStatus` を `"reviewed"` に変更する。
5. `npm run quiz:build` を実行し、`public/data/quiz-bank.js` を再生成する（既定では `reviewStatus: "reviewed"` のクイズのみ収録される）。
   - スクリプトが未導入の場合は、フェーズの実装状況を確認すること（`scripts/build_learning_content.js` と同様の検証ビルドスクリプトとして追加される想定）。

## AI下書きの再生成手順

新しいアーカイブが追加され、まだクイズが無い場合:

```bash
python3 scripts/generate_quiz_drafts.py
```

- `public/data/site-content.js` を読み込み、`content/quizzes/<archiveId>.json` が**存在しないアーカイブのみ**を対象に、出題材料を `content/quizzes/_sources.json` にまとめて書き出す。
- **既存のクイズファイルは reviewStatus を問わず絶対に上書きしない。**
- 骨組み（空の `questions: []` を持つ `ArchiveQuiz` ひな形）も同時に作りたい場合は `--scaffold` を付ける。

```bash
python3 scripts/generate_quiz_drafts.py --scaffold
```

- 生成された `_sources.json` を見ながら、各アーカイブの `content/quizzes/<archiveId>.json` に設問を書き足していく（`_template.json` を参考に、出題品質ルールに従う）。
