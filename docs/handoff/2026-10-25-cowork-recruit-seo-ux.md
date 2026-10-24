# Cowork向け：トリオランド採用SEO・応募UX監査（2026-10-25）

- 状態: OPEN / Cowork受領未確認
- Repo: `t-ooku/trioland-social-publisher` / main
- 役割: Cowork＝文章・応募者心理・UX・重複統合案。Codex＝コード・フォームAPI・計測・CI・本番公開確認。
- 重要: GitHubに保存しただけでCoworkが実行したことにはならない。同じファイルを同時編集しない。

## 当日の確認事実
- 運営会社の正式公開サイト https://www.triocareer.jp/ の現行採用ページ https://www.triocareer.jp/company/recruit/ （2026-10-25確認）では、保育士＝月給310,500円〜、保育補助＝「応募・見学時にご案内」。調理スタッフは現行の募集一覧に掲載されていない。
- 東京都最低賃金は2026-10-01から時給1,280円（東京都公式広報）。時給の未公表職種について具体額を推測しない。
- 採用サイトの既存記事は121本。求人一覧の内部リンク121件・sitemap登録121件で欠落なし（2026-10-25、GitHub main の静的ファイル照合）。これは全記事の内容品質が良いことを意味しない。
- 当日、「現在も調理スタッフを募集」と誤読され得る過去求人記事3本を、**過去の掲載情報**と**現行の募集一覧**を明確に分ける形で修正した。新規記事・削除・301・canonical統合は行っていない。
  - `site/recruit/komazawa-nursery-cook-job-guide.html` / `dea44bbb`
  - `site/recruit/part-time-nursery-cooking-staff.html` / `d59d2994`
  - `site/recruit/fulltime-nursery-cooking-staff-guide.html` / `19f8b2b8`

## Coworkへ依頼する具体的な作業
1. 正式公開された**会社HP → 会社採用情報 → トリオランド採用ページ → 応募フォーム**を求職者視点で確認する。特にフォーム内の職種選択肢にない職種の記事から送る場合は「募集状況の問い合わせ」と分かる表現にする案を作る。実画面未検証ならHTML机上レビューと明記。
2. `site/recruit/*cook*.html`、`*nutritionist*.html`、`*cooking*.html` の見出し・本文・meta description・CTAを比較し、**過去の求人条件を現行募集に見せている箇所**を優先抽出。個別URL、問題文、現行根拠URL、正確な差し替え案を表にする。未確認の募集停止や給与額を断定しない。
3. 次の近接2組を比較して「主ページ・補助ページ」「独自の検索意図」「統合の必要性」を提案する（削除、301、canonicalは実施しない）。
   - `nursery-cook-qualification-required-check-guide.html` と `nursery-cook-experience-preferred-guide.html`
   - `hoiku-assistant-daily-flow-check-guide.html` と `hoiku-assistant-first-day-preparation-guide.html`
4. 求職者の知りたい情報がすぐ見えるファーストビュー、スマホ固定CTA、園見学のみの導線、未確認条件の分かりやすい断り方を監査。実際の待遇・職員の声・実績は創作禁止。
5. 上記のレポートを `docs/seo/` に残し、変更実装はCodexに引き継ぐ。GSC・GA4の閲覧権限があれば期間付き実データで表示・クリック・順位・CTA・応募完了を確認し、無ければ「未取得」とする。定量根拠のない一括削除は禁止。

## Codexへの引き継ぎ（重複担当しない）
- `build_site.py` と `.github/workflows/recruit-sitemap.yml` に、会社HPを「最低賃金未満なのでリンク禁止」とした2026-10-09の古いコメント・リンク置換が残る。現行の会社HPとの相互導線・情報整合性を確認し、古い前提を是正できるか評価する。確認前に自動リンク差し替えルールを撤去しない。
- `site/recruit/index.html` には121本のリンクがあり、一括削除はしない。求人一覧・sitemap・HTTP・CIの別検証を継続。
- 調理職種の記事を修正しても、現行の保育園採用フォームが調理職の募集を受け付ける保証はない。実際の問い合わせAPI送信・個人データ投入は行わず、管理されたテストを優先。

## 最終報告様式
- 対象URLと実際の変更案
- 確認した一次情報／未確認点
- GSC・GA4などのKPI（期間付き、取得できなければ未取得）
- Codexとの役割分担と未完了理由
- Cowork自身の受領・実施状況（未確認なら未確認）
