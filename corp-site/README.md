# トリオキャリア コーポレートサイト（www.triocareer.jp）— WordPress テーマ「trio-career」

2026-10-20 社長（渡邉様）OK → 今の WordPress（Xserver・6.0.17）にテーマとして載せる。加藤様への依頼・費用なし。

## 構成

| ファイル | 役割 |
|---|---|
| `gen_pages.py` | 試作版のページ生成（データ：施設 10・事業 4・地図・FAQ・構造化データ）。`TRIO_MODE=wp` で本番用の出力になる |
| `gen_wp_theme.py` | 上のページから WordPress テーマを作る（`pages/*.php`・`functions.php`・投稿/固定ページ/一覧/404 のテンプレート・zip 3 種） |
| `base.css` + `extra.css` | 見た目（つなげて `assets/site.css`） |
| `site.js` | 動き（スライド・地図・カウントアップ・ページ先頭へ） |
| `natural_upscale.py` | AI 補正の「絵っぽさ」を抑える（AI 拡大 55%＋通常拡大 45%＋うすい粒） |
| `media-manifest.json` | テーマに入れた写真・動画 36 点の名前・サイズ・sha256（実ファイルはリポジトリに入れていない） |

生成スクリプトは作業環境の一時フォルダ（scratchpad）のパスを前提にしている。素材（`corp4/a/`）・地図データ（`geo/japan.geojson`・区の境界）は作業環境にあり、元は corp-mirror ブランチ・保育園／放デイのサイト・公開 GeoJSON。

## テーマの動き

- 決まった URL（`inc/routes.php`）は `pages/` のデザインをそのまま出す。今の URL をそのまま使う（`/service/…`・`/company/`・`/company/recruit/`・`/information/`・`/contact/`）。新しいのは `/facilities/`・`/service/after-school/lopp/`・`/service/after-school/compasmile/` だけ。
- 旧 URL の 301：`/company/companyoutline/`→`/company/#company`、`/thought/`→`/company/#philosophy`、`/author/*`→`/information/`。
- お知らせ（投稿）・カテゴリー・固定ページ（プライバシーポリシー・サイトマップ）は同じ見た目で WordPress から表示。トップと「お知らせ」の一覧は投稿から自動。
- お問い合わせは Contact Form 7 の今のフォーム（ID 234）をそのまま表示。
- `wp_head()` の重複（title・description・canonical・OGP・ld+json）は除く。VK ExUnit が本文に足す SNS ボタン・CTA・関連記事は外す。
- wp-sitemap.xml：テーマのページを追加、投稿者（ログイン名）は載せない。
- でじるみ本部サイトの写真は、掲載許可が出るまで使わない（`TRIO_DG_PHOTOS=0`）。紫とアイコンの図に置き換え。許可が出たら `TRIO_DG_PHOTOS=1` で作り直して上書き。
- 写真・動画はテーマの `a/` にあればそれ、無ければメディアライブラリから同じファイル名を探す（アップロード上限が小さいサーバー向けの軽い版）。

## 検証（2026-10-20、作業環境）

本番と同じ版（WordPress 6.0.17・Contact Form 7 5.1.6・VK ExUnit 8.0.2・Simple Lightbox・SI CAPTCHA・Lightning 7.4.0）を corp-mirror の wpkit から立て、本番の固定ページ 21・投稿 13・フォーム ID 234/530 を再現して確認。
全ページ 200・旧 URL 301・横はみ出しなし（390/1366px）・画像切れなし・内部リンク切れなし・PHP の警告なし（テーマ由来）・フォームの入力チェックと送信（Ajax）・管理画面からの zip アップロード→ライブプレビュー→有効化・軽い版＋メディア方式。

## 戻し方

外観 → テーマ → Lightning Child Sample を有効化（記事・固定ページ・フォームは消えない）。
