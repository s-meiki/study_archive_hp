---
name: design-system-update
description: >
  design-system/ (Claude Design用デザインシステムバンドル) の更新・検証・sync手順。
  トークン変更、コンポーネント/テンプレの追加・修正、OGP再生成、Claude Designへの
  push (/design-sync) を行うとき、または「デザインシステムを更新して」「新しい部品を
  足して」「OGPを作り直して」と言われたときに必ず読む。サイト本体のCSS変更だけで
  design-system/ に触れない作業には不要。
---

# design-system 更新スキル

## 大原則

1. **正の連鎖を守る**: サイト実CSS (`app/globals.css` の `:root`) → `design-system/tokens/tokens.css` → 各プレビューHTMLのインライン `:root`。上流を飛ばして下流だけ変えない。デザインシステム側で新しい値を発明しない。
2. **各プレビューは自己完結**: 外部CSS/JS/フォント/画像参照は禁止。必要なトークンだけをインライン `:root` にコピーする。
3. **1行目マーカー厳守**: 全プレビューHTMLの1行目は `<!-- @dsCard group="…" name="…" subtitle="…" width="…" height="…" -->`。DOCTYPEより前。groupは Foundations / Components / Templates / Assets のいずれか。
4. **文言規約**: 人名なし(担当は「事務局」等)・絵文字/感嘆符なし・誇大表現なし・症例詳細なし。免責「本アーカイブは個別診療の判断を代替するものではありません。」は一字一句変えない。詳細は `design-system/guidelines.md` 第2節・第8節。
5. **サイト実装が正**: 「およそ正しそうな修正」をする前に必ずサイト実物と突合する。過去の実例: 必須マーク「**」やplaceholder「例: 山田 太郎」は一見規約違反に見えるがサイト実装 (`app/contact/contact-form.tsx`) が使っている正式仕様。

## トークンを変更するとき

1. まずサイト本体 (`app/globals.css`。ダーク値は2箇所あるので同期) を変更し、実機で確認する。
2. `tokens/tokens.css` の該当値を追従させる。
3. 全プレビューHTMLへ一括反映:
   ```bash
   cd ~/Developer/study_archive_hp/design-system
   # 例: 旧値→新値 (完全一致文字列で置換)
   grep -rl -- '--primary: #365a5c' foundations components templates assets | \
     xargs sed -i '' 's|--primary: #365a5c|--primary: #NEWVAL|g'
   ```
4. 値の揺れチェック (単一値のみ出力されればOK):
   ```bash
   grep -rhoE -- '--primary: #[0-9a-f]{6}' foundations components templates assets | sort -u
   ```
5. 下記「検証ループ」を回す。

## コンポーネント/テンプレを追加するとき

1. `guidelines.md` と既存の一番近い見本 (`components/buttons.html` が構造の基準) を読み、同じ構成で作る: @dsCardマーカー → 使い方コメント(AI向け2〜4行) → 自己完結HTML → spec-labelで状態・種類を区分。
2. サイトに実在するUIなら該当CSS (`app/globals.css` / `app/ui/*.module.css` / `app/components/*.module.css`) からクラス名・数値ごと忠実に移植する。
3. 検証ループを回してから完了報告。

## 検証ループ (変更のたびに必須)

1. 機械チェック:
   ```bash
   cd ~/Developer/study_archive_hp/design-system
   for f in foundations/*.html components/*.html templates/*.html assets/*.html; do
     head -1 "$f" | grep -q '^<!-- @dsCard group=' || echo "マーカーNG: $f"; done
   grep -rn -E 'src=|href="http|<link|@import|url\(' foundations components templates assets | grep -v 'href="#"'  # 外部参照(出力ゼロが正)
   grep -rhoE '#[0-9a-fA-F]{6}' foundations components templates assets | sort | uniq -c | sort -rn  # 色の全数集計→トークン外がないか目視
   ```
2. 実描画: `.claude/launch.json` の `ds-preview` (python3 http.server) を preview_start で起動し、変更ファイルをスクリーンショット確認。固定サイズ物 (スライド1280x720、A4 794x1123、OGP 1200x630) はDOM実測 (`offsetWidth/Height`) も確認。
   - 注意: スクロール直後のスクリーンショットはstale frameになることがある。ビューポートをページ全高にリサイズしてから撮ると安定する。
3. 修正があれば再描画→再確認まで終えてから完了とする。

## OGP画像の再生成

`design-system/README.md`「OGP画像の書き出し」のコマンドを実行 (原稿=`assets/og-export.html`、出力=`assets/ogp-candidate.png` 2400x1260)。**`public/images/ogp.png` への自動上書きは禁止** — 候補を提示し、めいき承認後に手動コピー。

## Claude Design への push (/design-sync)

- Claude Code Web/デスクトップセッションでは DesignSync 認証不可。**インタラクティブなターミナル**で:
  ```
  claude
  > /design-login      # 初回のみ
  > /design-sync design-system/ をプロジェクト「臨床学術WG Design System」に同期して
  ```
- 増分syncが原則 (全置換しない)。push前にどのパスを書く/消すかの一覧 (dry-run) を提示し、めいきの承認を得る。
- push後、Claude Design側のDesign Systemペインでカードが崩れていないか確認してもらう。

## 完了報告の形式

「完了: <変更ファイルパス>」+ 検証ループの結果1〜2行 + (pushが絡む場合) dry-run一覧。チャットに中間ログを垂れ流さない。
