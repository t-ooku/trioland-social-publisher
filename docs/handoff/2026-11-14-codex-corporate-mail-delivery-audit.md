# Codex P0｜会社HPの実受信監視とMake障害再発防止（2026-11-14）

状態：**実行指示保存。Codex受領／修正／本番稼働／問い合わせ受信確認は未確認。** ユーザー指示は「会社HPのMakeが正常か、どう改善するか」。現時点の確認では会社HPはMake中継**対象外**なので、原因系統を分ける。

## 重要な事実と監査起点
- 会社 `https://www.triocareer.jp/contact/` はWordPress Contact Form 7。ソースは `corp-site/gen_wp_theme.py` の `trio_form()` （CF7ショートコード）。`corp-site/README.md` に現行フォームID 234/530 とある。現在の本番フォーム設定は未取得。
- 保育 `https://hoiku.triocareer.jp/`・放デイ `https://afterschool.triocareer.jp/` は `src/inquiry.js` の `/api/inquiry` → Make Webhook → Gmail通知。Makeの記録 `docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md` で会社WPのCF7はこの中継を通らないと明記。
- 11/13 JST 会社GA4：フォーム開始5イベント、`inquiry_submit_success` 4イベント、`/contact/` 7PV。**これは4件の外部有効問い合わせ・4通の着信を意味しない。** `wpcf7mailsent` はWordPressのメール送信処理の成功イベントであり相手受信まで保証しない（CF7公式FAQの説明参照）。会社の本番送信先、SMTP/配送ログ、受信箱、内部テスト、スパム除外は未確認。
- 11/13 12:23 JSTの最後に確認されたsite-smoke run 43358648380 はCI成功だがMakeチェックは `UNKNOWN (Read-only Make API token not configured)`。保育・放デイについてMakeの現在稼働を正常と断定不可。
- 11/1〜9にMake経由の問い合わせが11件滞留、11/9に配送復旧（外部実件6、所有者テスト5）。**これを会社WPの障害と誤認しない。**

## やること（順番厳守）

### P0-WP-01: WordPress会社HPの現行受信経路を実確認
1. `AGENTS.md`、`corp-site/README.md`、`corp-site/gen_wp_theme.py`、`docs/seo/2026-11-14-inquiry-pdca.md`、Issue #15/#16を読み、重複編集を避ける。
2. 既存の**正規権限**でWordPress管理画面のContact Form 7（フォームID 234/530を実画面と突合）、Mail/Additional Settings、宛先種別、From/Reply-To、送信先複数・転送、`skip_mail`/demo設定、SMTP/メールログ設定、現行プラグインを読み取りで監査。**アドレス・認証情報・メール本文をGitHub、日報、Issuesへ掲載しない。**
3. WordPressの送信成功・失敗（CF7・wp_mail）、SMTPやXserver送信ログ、宛先メールボックスの受信（迷惑メール・隔離含む）、実担当者の確認を、直近7日の日付/サイト/種別/件数だけで照合。許可された受信側の読取専用経路がなければ `未取得（受信先権限がない）` と明記。接続済み一般Gmailが実際の受信先かは不明。そこに見つからなかったことを「実問い合わせ0件」としない。
4. CF7の成功イベント（11/13に4回）とメール受信は別指標。フォーム送信済みでも送信処理成功／SMTP受理／配達／担当閲覧を混同しない。送信に成功したが配送されない場合、SPF/DKIM/DMARC、SMTP認証・Return-Path、送信ログ/バウンス/隔離を調査する（設定変更は根拠・影響確認・既存承認が必要）。
5. 送信先・通知設定の変更、SMTPプロバイダ契約、追加メールアドレス、受信内容の保存／顧客情報収集、管理権限の拡大、本番テスト送信は**事前確認なしに禁止**。CF7に保存機能が無い場合、Flamingo等を勝手に入れない。データ最小化と個人情報保護を優先。

### P0-WP-02: 受信異常を毎朝の日報で検出
- 新しい定期タスクは作らず既存8:30の日報・既存GitHub Actionsの再利用を優先。
- 会社WPについて **CF7受付／送信処理成功／SMTP配達通知／受信側の確認** を、実際に使える既存の権限付き匿名集計で比較する方式を設計・実装。ユーザー名、本文、電話、メール、IP、Cookie、Secret、Message-ID実値を公開GitHub/GA4に記録しない。
- 検証済み同一定義・同期間の `送信成功 > 受信確認` や送信失敗／設定異常を検知したらアラート。タイムラグ・重複・内部試験を調整し、行なし＝0としない。
- データ経路が未整備なら本番監視 `UNKNOWN` のまま、読取できない理由と必要な権限だけを報告。Web GETでフォーム表示が見えてもメール到達を「正常」としない。個人情報を含むログを書かない。

### P0-MAKE-01: 保育・放デイのMakeは**別監視**
- `tools/make_inquiry_health.py` と `.github/workflows/site-smoke.yml` は既存のまま利用・二重監視を避ける。シナリオ稼働／Webhook enabled／キュー数／エラー・配送実行を読み取り専用で検査。
- `MAKE_API_TOKEN` がGitHub Actions Secretに無ければ、シークレットを捏造・公開しない。既存のMakeセッションまたは正規のAPIトークン（必要なread scopeのみ）を利用できるか確認し、必要なら**本人に一度だけ** `https://us2.make.com/` の操作を最小限案内。
- シナリオの再実行、失敗キューの削除・再送、本番フォームテスト送信はしない。メール中継が未知でもCI全体が成功する設計なら、日報・管理LPには `UNKNOWN` を明示する。静かにsuccessへ置換しない。

### P1-UX-01: 会社のフォーム説明矛盾は**配送監視と別に**改修
- `https://www.triocareer.jp/contact/` の実ページには「御社名（必須）」と個人の相談案内が混在し、「確認する」ボタン説明と「確認画面は表示されません」が矛盾。まず現行CF7フォーム/テンプレートのどちらが文章を持つか特定。
- 操作説明は本当の送信手順と一致させる。個人の見学相談に法人名を必須とする必要性は業務要件を確認。独断で必須を削除しない。変更時はスマホ本番表示、業務側の分類/受信先、イベント検証を分ける。

## 実装・検証報告
- 変更する場合は `main`、GitHub Actions CI、WordPress本番反映（WordPressはGitHub更新だけで配備されない）、CF7設定、実受信を別判定。
- ブラウザGET・コードテストは実メール配送の証明ではない。本番の偽問い合わせ送信は禁止。
- 既存Issue #15に追記し、匿名の結果のみを `docs/seo/YYYY-MM-DD-inquiry-pdca.md` と `dashboard/latest.json` に反映。公開JSONは匿名集計だけ。
- 完了報告は各サイトの **フォーム受付状況／送信処理／SMTP配送／実受信確認**、取得期間・読取権限・エラー、コミット・CI・公開URL、問い合わせ実件数の根拠、残る本人操作を示す。実際の受信まで確かめられない場合「正常」と宣言しない。

## 担当
Codex＝コード・監視・テスト・公開検証、Cowork＝既存WP/Make認証済み画面での確認とフォームUX、GPT＝KPI集計とPDCA評価。**指示書の保存は担当の受領／実行を意味しない。**
