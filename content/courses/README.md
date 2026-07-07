# content/courses — コース定義

学習コース（`LEARNING_CONTENT`）のソースはこのディレクトリの JSON です。
生成物 `public/data/learning-content.js` は手編集せず、必ずここを直して
`npm run learning:build` で再生成します。

## スキーマ

1 ファイル = 1 コース。型は `app/learning/types.ts` の `Course` に厳密準拠します。

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `id` | ○ | `course-<themeId>`（例 `course-cardiology`）。全コースで一意 |
| `themeId` | ○ | `public/data/site-content.js` の `themes[].id` に実在する値 |
| `title` | ○ | 内容が伝わる自然な日本語（「テーマ名＋コース」ではない） |
| `summary` | ○ | 1〜2 文の概要 |
| `level` | 任意 | `"入門" \| "標準" \| "発展"`。`"入門"` は foundations のみ |
| `order` | ○ | コース一覧の表示順。foundations=1 を先頭に、以降 cardiology, neurology, infectious, ai-utilization, research-career |
| `lessons` | ○ | レッスン参照の配列（下記） |
| `updatedAt` | ○ | `YYYY-MM-DD` |

### lessons[]（`CourseLessonRef`）

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `archiveId` | ○ | `site-content.js` の `archives[].id` に実在する値 |
| `order` | ○ | コース内で一意の並び順（1..N） |
| `optional` | 任意 | 補足扱いの回（同内容の再演など）に `true` を付ける |
| `labelOverride` | 任意 | 一覧表示名の上書き（通常は不要） |

## 命名・順序のルール

- ファイル名は `<themeId>.json`。
- `lessons` はそのテーマの全アーカイブを原則 **開催日昇順（古い→新しい）** で並べ、`order` を 1..N で振る。
  ただし学習効果の観点（基礎→応用の勾配）で入替してよい。入替はカリキュラム監査（`docs/course-audit.md`）等の根拠を伴うこと（2026-07-07 の監査採用で foundations / research-career は教育順に変更済み）。
- `optional: true` は「修了判定に含めない補足回」という意味（例: 同内容の再演）。
  任意レッスンはコースの進捗率・修了判定の分母から除外される。
  録画・資料の有無だけでは付けない（資料が無くても概要・学習ポイントは学べるため）。

## ビルド手順

```bash
# 検証のみ（書き込まない）
npm run learning:build:dry

# 検証 → public/data/learning-content.js を生成
npm run learning:build
```

ビルドスクリプト（`scripts/build_learning_content.js`）は次を検証し、
1 つでも違反があれば全違反を列挙して exit code 1 で停止し、ファイルを書きません。

- 各 `archiveId` が `site-content.js` の `archives` に実在する
- `themeId` が `themes` に実在、`id` は一意で `course-` 始まり
- `lessons[].order` がコース内で一意、`title` / `summary` が非空、`updatedAt` が `YYYY-MM-DD`

合格時は `order` 昇順に並べて生成します。
