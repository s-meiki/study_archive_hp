# Claude Design 用デザインシステムバンドル

臨床学術ワーキンググループのブランドで、Claude Design がスライド・LP・ワンページャー・SNS画像などを生成できるようにするアセット一式。サイト本体 (`public/assets/styles.css` / `app/globals.css`) の実トークンから作られており、**このバンドルが参照されていれば成果物はサイトと同一ブランドに見える**ことをゴールにしている。

## 構成

```
design-system/
├── README.md          … このファイル (人間向け)
├── guidelines.md      … ブランド仕様書 (Claude Design/AI向けの判断基準)
├── tokens/tokens.css  … デザイントークンの正 (色・型・余白・影)
├── foundations/       … 基礎の実物見本 (カラー/タイポ/余白・角丸・影/ブランド)
├── components/        … 部品の実物見本 (ボタン/カード/バッジ/統計/ナビ/注記/フォーム)
└── templates/         … 用途別テンプレート (スライド16:9/LP/ワンページャーA4/SNS画像)
```

- 各プレビューHTMLは**完全自己完結** (外部CSS・JS・フォント・画像なし)。単体でブラウザ表示できる。
- 1行目の `<!-- @dsCard group="…" -->` コメントが Claude Design の Design System ペインのカード情報になる。

## Claude Design への渡し方

### A. Claude Code から sync する (推奨)

インタラクティブなターミナルで:

```
cd ~/Developer/study_archive_hp
claude
> /design-login   # 初回のみ。claude.ai のデザインシステム権限を付与
> /design-sync design-system/ を新規プロジェクト「臨床学術WG Design System」として同期して
```

以後、トークンや見本を更新したら同じコマンドで差分syncする (全置換ではなく増分)。

### B. Claude Design に直接貼る (sync を使わない場合)

`guidelines.md` の全文を Claude Design のプロジェクト設定 (またはチャット冒頭) に貼り、加えて作りたい用途に近いテンプレHTML (例: `templates/slides.html`) を添付して「この見本のデザイン語彙で作って」と指示する。

## 使い方のコツ (Claude Design 側での頼み方)

- 「第◯回勉強会の告知スライドを、デザインシステムの `templates/slides.html` の型で」のように**見本ファイルを名指し**すると再現度が上がる。
- 新規の見た目が必要になったら、その場で発明させず「`components/` の一番近い部品を流用して」と付ける。
- 文言のトーン・禁止事項は `guidelines.md` の第2節と第8節が効く。

## 他ブランドへの転用手順 (汎用テンプレとして使う)

1. `tokens/tokens.css` の値を新ブランドの色・角丸に差し替える。
2. 各プレビューHTMLの `<style>` 冒頭にある `:root { … }` ブロックは tokens.css のコピーなので、一括置換で追従させる:
   - 置換対象は全HTMLの `--bg` 〜 `--font-sans` の変数値。エディタの全体検索置換か、Claude Code に「tokens.css の変更を design-system/ 配下の全HTMLの :root に反映して」と頼む。
3. `guidelines.md` の第1〜2節 (ブランドの正体・声とトーン) と、見本内のサンプル文言を新ブランドの文脈に書き換える。
4. ロゴ (`foundations/brand.html` のインライン Learning Loop マーク。各プレビューにも同じSVGパスが複製されている) を差し替える。外部画像参照は作らない。
5. ブラウザで全プレビューを開いて崩れ確認 → sync。

## OGP画像の書き出し

`assets/og-export.html` が ogp.png の実寸原稿 (1200x630 フルブリード)。文言・チップを更新したら:

```bash
cd ~/Developer/study_archive_hp
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --force-device-scale-factor=2 --window-size=1200,630 \
  --screenshot=design-system/assets/ogp-candidate.png \
  "file://$PWD/design-system/assets/og-export.html"
```

生成物は `assets/ogp-candidate.png` (2400x1260)。目視確認のうえ、差し替えるときだけ `public/images/ogp.png` に手動でコピーする (自動上書きはしない)。

## メンテナンス規約

- 色・型を変えたいときは、まずサイト本体 (`public/assets/styles.css`) を変え、その値を `tokens.css` → 各プレビューへ反映する。**このバンドル側で勝手に新しい値を発明しない。**
- サンプル文言は匿名・架空・教育的文脈のみ。患者情報・個人名・誇大表現は書かない (guidelines.md 第8節)。
- 免責文言「本アーカイブは個別診療の判断を代替するものではありません。」は削らない。
