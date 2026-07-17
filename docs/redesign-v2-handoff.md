# デザイン全面リニューアル v2 — 引き継ぎメモ

最終更新: 2026-07-17　作成: Fable 5（司令塔セッション）

## 現在地（一言で）

**Phase 0〜9 完了（Phase 9 は2件の承認待ちのみ残）。** 本番（https://study-archive-hp.vercel.app）は新デザイン（クリニカル・モダン、案A ダッシュボード型）で稼働中。

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

## Phase 9: 完了（2026-07-17 実施）

1. **OGP画像の軽量化**: めいき選定で「コース進捗ダッシュボード」モチーフ（学習特化5案の案B）に決定。`design-system/assets/og-export.html` を作り直し、候補 `design-system/assets/ogp-candidate.png`（2400x1260・約215KB。現行3.6MBの約6%）を生成済み。**→ めいき承認後に `public/images/ogp.png` へ手動コピー（自動上書き禁止の規約）。** metadata宣言（app/page.tsx / app/about/page.tsx の 2400x1260）はそのままでよい。
2. **favicon一式の新ブランド化**: 完了。`scripts/generate_brand_icons.py`（新規・PILでロゴ幾何を直接描画）で favicon.svg / favicon-32x32.png / favicon.ico(16-48) / icon-192.png / apple-touch-icon.png を再生成。ロゴ変更時はこのスクリプトの座標を直して再実行すればよい。
3. **design-system/ バンドルの再構築**: 完了。tokens.css・guidelines.md・全プレビュー14ファイルを新トークン（案A インディゴ）で刷新。検証ループ（マーカー・外部参照ゼロ・色集計・実描画・固定寸法実測）全通過。**→ Claude Design への `/design-sync` は未実施**（インタラクティブターミナル必須・push前に dry-run 承認の規約）。
5. **ロゴマーク刷新（追加対応）**: 当初のパルス波形は「心電図ぽい」とのめいき指摘で、学習特化5案から**案4「学びの階段」**（階段ライン+到達点ドット、角丸スクエア+インディゴは維持）を選定。`public/images/logo.svg`・ヘッダー（app-header.tsx）・favicon一式・design-system 全複製箇所・OGP原稿へ反映済み。SVGパスの正は tokens.css 末尾に記載。
4. **ドキュメント更新**: 完了。AGENTS.md（Structure/Build/Style/Testing 節を Next.js 構成に）、README.md（URL例を新IAに）、design-system/README.md と `.claude/skills/design-system-update/SKILL.md` の旧パス参照（public/assets/styles.css → app/globals.css）も追従。

## 残っている承認待ち（めいきの判断事項）

1. **ogp.png 差し替え**: `design-system/assets/ogp-candidate.png` を目視確認 → OKなら `cp design-system/assets/ogp-candidate.png public/images/ogp.png` してコミット。
2. **/design-sync push**: インタラクティブターミナルで `claude` → `/design-sync design-system/ をプロジェクト「臨床学術WG Design System」に同期して`（増分sync・dry-run確認後）。
3. 本番反映は main への push（Vercel自動デプロイ）。上記2件の反映と合わせて実施するとよい。

本メモは上記が済んだら削除してよい。
