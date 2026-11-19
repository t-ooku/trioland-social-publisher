# 定期点検
- Trioland site smoke / 毎日08:15 JST（mainのsite-smoke.yml） / GitHub Actionsログ・Step Summary、失敗時[AUTO][TRIOLAND] Issue。
- 既存画像検査と主要ページ、保育園/放デイPages、問い合わせAPI GET（405想定、実送信なし）、求人記事最終コミット（48h超で警告）を確認。
- 個人情報・Secretを報告しない。D1書込・SNS公開・課金・問い合わせ実送信・価格/規約変更は行わない。
- 問い合わせメールの中継（Make）/ 毎日の「トリオキャリアHP・採用SEO日報」の中で確認 / 手順と異常時の書き方は docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md。取れなければ「未取得」と書き、「正常」としない。

- Make問い合わせ中継：既存site-smokeの `tools/make_inquiry_health.py`（毎日08:15 JST、読取専用）と `docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md` に沿って稼働・キューを確認。2026-11-10のrun42723829749は判定6件PASSだが `MAKE_API_TOKEN` Secret未設定でライブ状態UNKNOWN。CI成功のみで「メール中継正常」と報告しない。重大障害は実問い合わせが届かなくなるため日報で先に注意喚起し、Make再送・キュー削除・本番テスト送信はしない。詳しくは `docs/seo/2026-11-10-inquiry-pdca.md`。
- 会社HP お問い合わせ（CF7 ID 234）の「御社名」任意化と「確認する」説明の修正は Cowork が WordPress 管理画面で行う（Codex は WP を編集しない。修正後の公開GET・GA4推移の確認だけ）。`docs/handoff/2026-11-14-corp-contact-form-owner.md`。

## 2026-11-15：PV・検索CTR・問い合わせCVRの成長PDCA
- 本人スクショでは会社HPの実問い合わせメールを確認、Make問い合わせ用シナリオ6306695もActiveと履歴あり。配送の安全点検は維持する一方、成長施策の主眼は**サイト別PV、GSCページ別CTR、外部有効問い合わせCVR**。Makeの実行数を問い合わせ数としない。
- 優先改善とCowork引継ぎは `docs/handoff/2026-11-15-cowork-growth-pv-ctr-cvr.md`。まず会社のコールセンター事業ページの低CTRを題材に、1ページ1仮説で試験し、GA4/GSCの7日・14日（必要なら28日）比較を既存日報・dashboard/latest.jsonに記録。保育・放デイは保護者の見学相談と採用応募を分ける。
- Coworkは文章・スマホUX・承認済みWordPress、Codexはコード・CI・本番検証。指示書をGitHubに保存しただけではCoworkが受領した証拠ではない。新しい日次タスク・重複通知は作成しない。

## 2026-11-16 最新状態の優先順（11/15初期計画より新しい）
- Cowork受領・着手は `docs/handoff/ack/2026-11-15-cowork-ack.md` で確認済み。でじるみ事業トップのmeta descriptionは所有者が11/15にWordPress本番で変更・GET確認済み（D0=11/15、11/22・11/29・12/13に評価）。**評価中に同ページのmetaやtitleを再編集しない**。会社コールセンターのタイトル案は未実装。検索本文の取得は禁止。
- 11/16の日報：`docs/seo/2026-11-16-inquiry-pdca.md`。保育トップmeta descriptionを`build_site.py`で1件改善（commit d630a4a）、Build site/site-smoke成功・GitHub生成HTML更新確認。**Cloudflare Pagesのmeta実配信は未検証**なので本番のdescription/og:description確認後にD0を確定する。会社WordPress所有者変更の生成元巻戻り防止は`corp-site/gen_pages.py` commit dd388ad（本番WPへは本日未送信）。
- 放デイAS-03は11/16 D+7評価の前期間に欠測があり、実受付との照合もないため効果未判定。11/23 D+14に継続。保育canonicalのD+7もGSC確定・Indexing UI不足で効果未判定。
- 就労B型は会社HPの内数として別枠のKPI設計を追う。`docs/handoff/2026-11-15-cowork-shuro-kpi.md`参照。ユーザーの新規同目的タスク・重複通知を作らず既存日報/既存Cowork側記録を利用する。

## 2026-11-17：実施済みと未確認（次回は重複改修せず検証）
- 日報は `docs/seo/2026-11-17-inquiry-pdca.md`。11/16 GA4は会社116PV・保育23PV・放デイ21PV。GSC最新確定11/14 PT。実案件・真のCVR未照合。会社のWordPress改修による内部PV混入は未判定。
- Cowork/所有者は11/16にでじるみ6事業所へ会社HP見学・利用相談CTAとFAQ変更を反映し公開確認（`docs/handoff/ack/2026-11-16-cowork-digilumi-consult.md`）。GPTは本日 `corp-site/gen_pages.py` へ同期（`01cff1c3`）、施設バナーの別許可 `DG_FAC_OK` を保つ修正（`6a6f44c`）を完了。既存site-smokeに構文と承認済み文言の回帰検査追加（`1ea9d23`）。**再度WordPressを編集する必要はない**。新commitのCIと最新本番GET・新テーマ配備は未確認。次回は検証から開始。
- 保育トップ11/16新metaのCloudflare Pages実配信はまだ未確認。放デイ11/16はCTA7イベント、独自フォーム開始行なし・成功行なし、実受信未照合。フォームの本番試験送信は禁止。
- 次の評価：会社でじるみmeta 11/22・11/29、でじるみ6事業所CTA 11/23・11/30、保育駒沢フォーム 11/19・11/26、放デイAS-03 11/23。既存朝の日報だけで追跡。新規同目的タスク・重複通知を追加しない。

## 2026-11-20：11/19の本番フォーム・施設導線の巻戻り防止
- 当日GA4/GSC実測と変更記録：`docs/seo/2026-11-20-inquiry-pdca.md`。11/19 CoworkによるCF7 1166・CF7 234の施設別受付、Make見学通知CC、施設公式リンク/地図/CSS/テーマ版1.0.7の変更は`docs/handoff/2026-11-19-cowork-digilumi-and-visit-routing.md`が一次記録。
- `corp-site/gen_pages.py` の施設公式ページの位置、でじるみ専用相談リンクは11/20 main `efd17146`でソース同期済み。**WordPress本番への再配備はしていない**。
- `corp-site/site.js`・`corp-site/base.css`・`corp-site/gen_wp_theme.py`の11/19本番版との完全同期・構文/生成/実ブラウザ検証は未完了。**Codexが全差分を同期・検証するまでWordPressテーマを再生成／上書き／配備しないこと**。本番テーマ1.0.7より古い版に戻さない。最新引継ぎ：`docs/handoff/2026-11-20-theme-source-parity.md`。
- 11/19の保育「園未定」の担当受信事例は1件のメール到達記録だが、GA4成功2イベントとの個別照合・真の外部有効件数は未判定。会社11/19成功1、保育2、放デイ取得行なし。CF7エラー11/17に2、11/18に1、11/19は取得行なしで原因分類/解消は不明。翌日も既存日報だけで追跡。
