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
      "type": "single",          // 省略可（省略時は "single"＝単一正答）
      "prompt": "設問文",
      "choices": [
        { "id": "a", "text": "選択肢A" },
        { "id": "b", "text": "選択肢B" },
        { "id": "c", "text": "選択肢C" }
        // 3〜4択。id は a, b, c, d を使う
      ],
      "answerId": "a",           // single: choices のいずれか1つの id
      "explanation": "なぜ正しいかを出典の記述に沿って1〜2文で説明"
    },
    {
      "id": "m1",
      "type": "multiple",        // 複数選択（複数正答）
      "prompt": "該当するものをすべて選ぶ形式の設問文",
      "choices": [
        { "id": "a", "text": "選択肢A" },
        { "id": "b", "text": "選択肢B" },
        { "id": "c", "text": "選択肢C" },
        { "id": "d", "text": "選択肢D" },
        { "id": "e", "text": "選択肢E" }
      ],
      "answerIds": ["a", "b", "c"], // multiple: 正答の id 配列（2〜「選択肢数-1」個、全て choices に実在）
      "explanation": "なぜその組み合わせが正しいかを出典に沿って説明",
      "reviewStatus": "draft"    // 設問単位の状態。draft はビルド時に quiz-bank から除外される安全弁
    }
  ],
  "reviewStatus": "draft",       // ファイル全体の状態。"draft" | "reviewed"（レビュー完了で "reviewed" に変更）
  "generatedBy": "ai",           // 人間が新規に書いた場合は省略可
  "updatedAt": "2026-07-05"      // YYYY-MM-DD
}
```

### 設問タイプと採点

- `type` 省略時は `"single"`（従来どおり単一正答、`answerId` を1つ指定）。**完全に後方互換。**
- `"multiple"` は複数正答。`answerId` の代わりに `answerIds`（配列）を使う。要素数は **2〜「選択肢数-1」個**、
  全要素が `choices` に実在すること（＝全選択肢が正答／正答1つ以下は不可）。
- 採点は **選択集合と `answerIds` の完全一致のみ正解**（部分点なし）。
- 出題UIは multiple のときチェックボックス（複数選択）＋「該当するものをすべて選んでください」を表示する。

### 設問単位の reviewStatus（安全弁）

- 設問に `"reviewStatus": "draft"` を付けると、**ファイル全体が `"reviewed"` でもその設問だけ `quiz-bank.js` から除外**される。
- 新しい形式（複数選択など）の設問を、公開中のファイルへ安全に「下書きとして」追記するために使う。
- レビューが済んだら、その設問の `"reviewStatus": "draft"` を**削除する（または `"reviewed"` に変更）**して `npm run quiz:build`。
- 省略した設問（従来の設問）は常に収録対象。`npm run quiz:build:dry` は draft 設問数を表示し、
  `--include-drafts` を付けると draft 設問も含めて出力を確認できる。

## 出題品質ルール（必須）

1. **出典の範囲内で出題する。** 問題は該当アーカイブの `title` / `summary` / `overview`（`detail.overview`）/ `keyPoints`（`detail.keyPoints`）に書かれている内容の理解確認に限る。出典に書かれていない臨床的断定を創作しない。
2. **3〜4択（multiple は4〜5択）、single の正解は1つ。** 選択肢 id は `a`〜`e` を使う。誤答の選択肢は「もっともらしい誤り」にする（無関係すぎる選択肢や、明らかに変な文章は避ける）。
3. **multiple は「出典に列挙された項目をすべて選ぶ」形が安全。** 例: `keyPoints` の各項目を正答、出典外の項目を誤答にする。正答・誤答とも出典に忠実にし、複数選択でも医学的内容の創作をしない。
4. **explanation は出典に基づく1〜2文。** 「なぜ正しいか」を出典の記述に沿って書く。出典にない理由付けをしない。
5. **医療安全に関わる断定的な数値・用量は出題しない。** 具体的な投与量・用量・カットオフ値などはレビューで確認しづらく、誤りが医療安全に直結するため出題対象から外す。病態理解・治療方針・考え方の整理を優先する。

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
