# デザイン全面リニューアル v2 — 引き継ぎメモ

最終更新: 2026-07-16　作成: Fable 5（司令塔セッション）

## 現在地（一言で）

**Phase 0〜8 完了・本番反映済み。** 本番（https://study-archive-hp.vercel.app）は新デザイン（クリニカル・モダン、案A ダッシュボード型）で稼働中。**Phase 9（フォローアップ）のみ未着手**で、これは優先度低・締切なし。

計画全文: `~/.claude/plans/grill-me-generic-feather.md`（めいき承認済み）

## やったこと（Phase 0〜8）

1. **足場整理**: 旧作業をmainに着地、`redesign/v2` ブランチで作業
2. **モック3案→めいきが案A（ダッシュボード型・インディゴ）を選定**（`mockups/home-{a,b,c}.html` に現存、契約は `mockups/DESIGN_BRIEF.md`）
3. **トークン/基盤**: `app/globals.css` 全面刷新（ライト/ダーク3段構え）、`app/theme/`、`app/ui/` プリミティブ9種、`app/components/`（AppHeader/AppFooter）
4. **全ページ実装**: 新IA（`/` `/archives` `/archives/[id]` `/courses` `/courses/[id]` `/dashboard` `/calendar` + About/Contact/Terms/Privacy）。学会カレンダーはReactネイティブ再実装（仕様書 `docs/calendar-reimplementation-spec.md`）
5. **レガシー一掃**: 旧静的HTML・バニラJS削除。admin用資産は `admin/assets/` へ移設
6. **旧URLリダイレクト**: `next.config.mjs` の `redirects()` に8パターン
7. **進捗互換**: localStorage `cawg.learning.progress.v1` は同一スキーマ継続、引き継ぎ確認済み
8. **QA→PR #2→本番マージ→デプロイ**

### カットオーバー後に見つけて直したもの（重要な学び）

- **本番限定バグ**: `/courses/[courseId]` がアプリ唯一の「真の動的（SSR）」ページで、Vercelの実行時ファイルトレースが `public/data/*.js` を含められず全件500。`generateStaticParams` を追加してビルド時静的化（`/archives/[archiveId]` と同じパターン）で解消。ついでに両詳細ページの未知ID（`dynamicParams`のデフォルトフォールバックSSR）も同じ理由で500だったため `dynamicParams = false` に固定。**教訓: このリポジトリで新しく「本当に動的なページ」を追加する場合、`public/data/*.js` を読むなら要注意。可能なら `generateStaticParams` で静的化するのが安全**（`next.config.mjs` に `outputFileTracingIncludes` も保険で追加済み）。
- **並行セッションの成果物**: 作業ツリーに未コミットのカレンダー拡張（クリック選択→詳細パネル表示・学会名短縮表示）が残っていた。内容確認の上、めいきの承認を得てmainへ反映済み（コミット `e83dd6d`）。

### 現在のcommit履歴（新しい順、リニューアル関連）
```
e83dd6d Add click-to-select detail panel to the calendar view
b434e07 Pin unknown detail-page ids to build-time 404, not SSR fallback
8534831 Prerender course detail pages to fix production 500s
b0d447d Merge pull request #2 from s-meiki/redesign/v2  ← カットオーバー
16e2bca Redirect legacy URLs to the new information architecture
5295ba6 Remove legacy static site and relocate admin dependencies
067fd2a Rebuild all pages on the new design system
80a4749 Build redesign foundation: tokens, theme system, shell, UI primitives
9793dde Add home redesign mock candidates A/B/C with shared design brief
```

### 本番検証済み（2026-07-16時点）
- 主要16ルート200、旧URLリダイレクト5パターン308、未知ID404
- クイズ実フロー（採点→修了→バッジ）、進捗データ互換、モバイル375px
- `redesign/v2` ブランチは main と同期済み（fast-forward、差分なし）

## Phase 9: 残タスク（優先度低・締切なし）

着手時は `docs/design-system-update` スキルを読むこと（design-system/ 更新の規約）。

1. **OGP画像の軽量化**: `public/images/ogp.png` が **3.6MB**（要 300KB以下）。新ブランド（インディゴ系・パルス波形ロゴ `public/images/logo.svg`）で作り直す。`design-system/assets/og-export.html` が生成元。
2. **favicon一式の新ブランド化**: `public/favicon.svg` `public/favicon-32x32.png` `public/favicon.ico` `public/icon-192.png` `public/apple-touch-icon.png` は旧ブランド（Learning Loopロゴ）のまま。新ロゴ（`public/images/logo.svg` のパルス波形、`--primary: #4f46e5`）で差し替え。
3. **design-system/ バンドルの再構築**: `design-system/tokens/tokens.css` 含め全体が旧トークン（暖色オフホワイト×ティール）のまま。`app/globals.css` の新トークンに合わせて作り直し、`/design-sync` で Claude Design へ反映。
4. **ドキュメント更新**: `AGENTS.md` の「Build, Test, and Development Commands」節が旧構成（`public/index.html` を開く等）の記述のまま古い。新IA・新コマンド体系に更新。`README.md` があれば同様に確認。

## 次に着手するときの入り方

1. `git status` / `git log --oneline -5` で現在地確認（このメモの内容と齟齬がないか）
2. `docs/design-system-update` スキルを読む
3. Phase 9 の4項目は互いに独立なので、どれから着手してもよい。OGP/favicon は画像生成、design-system/ 再構築はデザイン反映、ドキュメント更新は軽作業。
4. 完了したら本メモを更新するか、不要になれば削除してよい。
