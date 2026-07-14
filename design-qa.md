# Design QA

## 対象

- 今日の復習コンセプト: `/Users/meiki/.codex/generated_images/019f5a08-fe8b-70c3-af20-d41b59347260/exec-221bc20e-d2e2-4c47-baae-6955ad338351.png`
- 復習インボックスコンセプト: `/Users/meiki/.codex/generated_images/019f5a08-fe8b-70c3-af20-d41b59347260/exec-2b7f1e1c-686a-494e-9b27-e3c07cc75e9f.png`
- 学習マップコンセプト: `/Users/meiki/.codex/generated_images/019f5a08-fe8b-70c3-af20-d41b59347260/exec-2ee44bbe-7ed3-444f-9f9f-c0dc5e2d9857.png`

## 実装スクリーンショット

- PC・今日の復習: `/Users/meiki/.codex/visualizations/2026/07/13/019f5a08-fe8b-70c3-af20-d41b59347260/study-archive-implementation/home-desktop-final.png`
- PC・復習インボックス: `/Users/meiki/.codex/visualizations/2026/07/13/019f5a08-fe8b-70c3-af20-d41b59347260/study-archive-implementation/home-desktop-inbox.png`
- PC・学習マップ: `/Users/meiki/.codex/visualizations/2026/07/13/019f5a08-fe8b-70c3-af20-d41b59347260/study-archive-implementation/home-desktop-map-final.png`
- スマホ・今日の復習: `/Users/meiki/.codex/visualizations/2026/07/13/019f5a08-fe8b-70c3-af20-d41b59347260/study-archive-implementation/home-mobile-final.png`

## Viewport / state

- PC: 1440 x 1024、1件修了後。次のコース回、復習候補、修了履歴が表示される状態。
- スマホ: 390 x 844、同じ端末内進捗を反映した状態。
- 初回状態、視聴済み状態、クイズ100%合格後の状態もDOMスナップショットで確認。

## 比較結果

- Full-view: 3案それぞれと同じ幅の実装画面を同一比較入力で目視。余白、階層、タイポグラフィ、ティール基調、低いカード密度を維持した。
- Focused: 今日の復習、2ペインの復習インボックス、展開式コースマップを個別に比較。既存データ量に合わせ、架空の学習時間や期限表示は追加していない。
- ブラウザのfull-pageステッチでは一部が重複したため、同じ1440px幅の連続セクション画像で全体を確認した。

## Findings / history

1. P1: 390px幅で学習マップのmin-contentが親グリッドを押し広げ、横スクロールが発生。`.home-main`を`minmax(0, 1fr)`にし、主要グリッド子へ`min-width: 0`を追加。再確認時 `scrollWidth 375 <= innerWidth 390`。
2. P1: コースの「次の回」が確認クイズへ直接遷移していた。`next`は詳細へ、`review` / `refresh`のみクイズへ遷移するよう修正。
3. P2: hash遷移時に見出しが上端へ密着。主要セクションへ`scroll-margin-top: 24px`を追加。
4. P2: ローディング用セレクタが実DOMと一致していなかったため修正。

## Functional evidence

- 初回の「最初の回を見る」からコース文脈付き詳細へ遷移。
- 「視聴済みにする」後、ホームの今日の復習、インボックス、マップ、一覧へ即時反映。
- 5問すべて正答で100%合格し、修了・ベストスコア・コース1/5・次の回を確認。
- キーワード検索、資料種別フィルター、リセット、カレンダー切り替えを確認。
- ブラウザのwarning/errorログは0件。

final result: passed
