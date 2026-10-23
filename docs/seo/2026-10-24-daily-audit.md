# トリオランド採用SEO日次監査 2026-10-24

## 結果（根拠を確認した範囲）
- `site/recruit/`：index.htmlを除き記事HTML **121本**。
- `site/recruit/index.html`：記事へのリンク **121件・重複なし・参照ファイル欠落なし**。
- `site/sitemap.xml`：全 **135 URL、重複なし**。求人関連記事 **122 URL（一覧1 + 記事121）**。
- 今回リライトした2記事内の相互リンク等、抽出された `/recruit/*.html` **4件**は該当ファイルの存在を確認。
- 本文を個別に照合したのは2記事。**121記事全本文の品質評価やSearch Consoleによるカニバリ確定は実施していない**。
- 公式採用表示（2026-10-24取得）：保育士は月給310,500円〜、保育補助は給与を応募・見学時に案内、調理職は公式採用一覧に掲載なし。旧時給1,000/1,100円表示は確認されない。
  - https://www.triocareer.jp/company/recruit/
  - https://jsite.mhlw.go.jp/tokyo-roudoukyoku/news_topics/houdou/20260930chinginka_00001.html （東京都最低賃金：2026-10-01から時給1,280円）

## 変更（すべてGitHub mainへコミット済）
1. `site/recruit/hoikushi-tokyo23-salary-condition-guide.html`：旧28万円記述を削除、現在の公式表示を明記、居住地条件を事実と区別。`7f1671b` → ワークフローによるリンク正規化後、文脈を再調整 `2fa85fb`。
2. `build_site.py`：採用フォームに希望職種・希望園の任意選択を追加、既存APIの `jobType`/`facility` と `message` の両方で送信する方式。`698ad3a`。生成済み `site/recruit.html` に専用選択欄があることをコードで確認。
3. `site/recruit/trioland-application-form-guide.html`：旧専用入力欄（住所・年齢・雇用形態等）の誤記を修正。フォームの現行項目と整合。`c1d69ba`。
4. `site/recruit/index.html`：応募フォームガイドのカード抜粋を更新。`f11d2d1`。
5. Coworkの文章・スマホUX点検を `docs/handoff/2026-10-24-cowork-recruit-ux.md` に保存。`5fe4718`。**受領・着手未確認**。

## CIと公開区別
- `Build site`：成功 https://github.com/t-ooku/trioland-social-publisher/actions/runs/40042241057
- `Trioland site smoke`：成功 https://github.com/t-ooku/trioland-social-publisher/actions/runs/40042263572
  - Steps `All pages return 200` と `Public Pages and inquiry route (GET only)` は成功。問い合わせの**実送信なし**。
- `Preserve recruitment SEO discovery`：成功 https://github.com/t-ooku/trioland-social-publisher/actions/runs/40042324644
- 本実行環境から `https://hoiku.triocareer.jp/recruit.html` への直接HTTP取得はDNS解決エラー。**新しい選択欄の本番レンダリング・実送信・メール到達は未確認**。

## KPI・継続課題
- Google Search Consoleの検索表示・クリック・平均掲載順位、GA4の応募CTA・フォーム完了、面接・採用数：**未取得**。0と混同しない。
- 今回の新規公開記事：**0本**。削除、301、canonical統合も実施なし。
- API側に `child` をご経験用に使う従来仕様が残る。バックエンドとMake通知の互換性を検証してからフィールド名を改修する。
- 正式な保育補助時給は未確認。仮の給与額を掲載しない。
- 記事全体の重複・検索意図の品質評価を順次進める。統合前に検索流入と内部リンクの証拠が必要。