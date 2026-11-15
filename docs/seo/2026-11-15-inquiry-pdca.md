# 2026-11-15 トリオキャリア3サイト｜問い合わせ獲得PDCA（日次実行台帳）

## 本日の結論（08:53 JST頃取得）
会社HPで2026-11-14のGA4 `inquiry_submit_success` **1回**、独自`inquiry_form_start` **3回**、`cta_click` **4回**。会社WordPress CF7の正式受信箱・追加Bcc先への配達証拠はなく、**外部有効問い合わせ数は3サイトとも未照合（0件とみなさない）**。保育・放デイMake 6306695は11/14本人画面ではActiveだがライブのQueue・配送と担当者受信はUNKNOWN。実申込獲得増は未判定。11/09復旧した保育5＋放デイ1件の過去受付は11/14に再計上しない。

## GA4（property 562097032、11/14 JST）
| host | active | new | sessions | PV | CTA | 独自フォーム開始 | 成功イベント | 外部実受付 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| www.triocareer.jp | 27 | 26 | 32 | 53 | 4 | 3 | 1 | 未照合 |
| hoiku.triocareer.jp | 3 | 1 | 5 | 7 | 行なし | 行なし | 行なし | 未照合 |
| afterschool.triocareer.jp | 2 | 0 | 5 | 5 | 行なし | 行なし | 行なし | 未照合 |

データソースWindsor.ai `googleanalytics4`、最新取得`data_fetched_at=2026-11-14T23:53:52Z`。GA4のactive_usersは各hostに対する指標。内部アクセス/スパム未除外。行なしは0件とは扱わない。`form_start`自動イベントは独自フォーム開始に加算しない。11/13→11/14は、会社25→27 active、30→32 sessions、46→53PV、成功4→1イベント。保育9→3 active、10→5 sessions、12→7PV。放デイ2→2 active、2→5 sessions、3→5PV。低母数のため因果断定不可。

### 直近7日（11/08〜14、ユーザーは別期間集計：active/new/sessions/PV）
- 会社189 / 184 / 230 / 401
- 保育40 / 28 / 47 / 67
- 放デイ21 / 12 / 27 / 34

### 当月取得可能分（11/03〜14、11/01〜02欠測・11/03部分日）
- 会社273 / 272 / 343 / 587
- 保育72 / 51 / 85 / 123
- 放デイ26 / 15 / 37 / 51

### 流入元・主要閲覧・入口ページ（GA4 11/14）
- 会社：Organic Search16 / Direct12 / Referral3 / AI Assistant1＝32 sessions。閲覧`/contact/`12PV、トップ7、梅ヶ丘園7、でじるみ事業7。入口`/contact`11 sessions、トップ5、梅ヶ丘園4。
- 保育：Organic Search4 / Direct1＝5 sessions。閲覧`/umegaoka`4PV、トップ1、コラム1、採用記事1。
- 放デイ：Organic Search5 sessions。閲覧`/contact`3PV、採用`/recruit`2PV。入口`/contact`3、トップ1、採用系1。利用相談・採用の流入を分けて扱う。
ページ別/入口ページ/チャネルは別集計であり、閲覧順序や同一利用者の遷移と断定しない。

## GSC（Search Console、America/Los_Angeles）
最新確定 **11/12 PT**（`include_fresh_data:false`）：会社14クリック/387表示・CTR3.62%・平均6.70位、保育0/98・CTR0%・9.66位、放デイ2/30・CTR6.67%・7.30位。日付はGA4 11/14 JSTと同一ではない。
確定7日 **11/06〜12 PT**：会社79/2166・CTR3.65%・表示加重平均7.19位、保育13/459・CTR2.83%・9.72位、放デイ3/125・CTR2.40%・7.98位。期間順位は日別加重近似。
11/13速報：会社10/216、保育1/71、放デイ0/24。11/14速報（途中日）：会社3/55、保育1/24、放デイ0/7。確定値に足さない。
ページ別検索意図（確定取得範囲11/08〜12 PT）：会社・駒沢大学園16クリック/164表示、梅ヶ丘12/62、就労B型でじるみ事業4/611。放デイのクリックに面接記事1、勤務時間記事1、コンパスマイル旧URL1がある。採用と保護者相談を混同しない。検索クエリ本文は取得していない。

## PDCA・本日実施した改善
### P0 受信の照合が最大障害
**Plan** WordPress会社HPはMakeと別経路。11/14に1回のCF7成功イベントがあるが配達の証拠なし。所有者がCF7「メール」にBcc追加を報告済みだが、保存後スクショと次の本物の問い合わせ時の配達証拠は未取得。保育・放デイMakeは所有者11/14画面でActive、11/10・11/11・11/12各1件実行成功記録はあるが現況保証ではない。
**Do/Check** GitHub Actions site-smoke [run43550213007](https://github.com/t-ooku/trioland-social-publisher/actions/runs/43550213007) 11/14 12:10 JST success、内部の実ログは `Make inquiry relay: UNKNOWN (Read-only Make API token not configured)`、`Recipient delivery: UNKNOWN`。CI成功≠配送正常。接続済みGmail 11/08〜15で同シナリオのMake警告・停止通知は見当たらず、正式通知先と同一か不明。Make FreeプランではAPIアクセスを前提としたトークン新設を要求しない。
**Act** Cowork＝既存WordPress権限内でCF7のBcc設定・送信/通知設定と正式受信先の匿名件数を照合。Codex＝既存のMake管理画面 `https://us2.make.com/` でシナリオ6306695 History・Webhook Queue・Gmail配送を読取、問題箇所だけ復旧。管理画面へアクセスできなければUNKNOWNの理由を残す。フォームの本番テスト送信・無断再送・キュー削除・新規契約なし。

### P1 会社HPのUX改修は本番表示の食い違いを確認
**Plan** 11/14の本人スクショでは `/contact/` 御社名「任意」・説明「送信」へ修正と記録。しかし11/15の外部Webテキスト抽出では「御社名（必須）」・「確認する」が返り、キャッシュと現時点の実HTMLを区別できない。
**Do** 既存`.github/workflows/site-smoke.yml` に会社WPの問い合わせページをGETし、必須表記・誤った確認文を警告する読取専用検査を追加、main [f5179cb](https://github.com/t-ooku/trioland-social-publisher/commit/f5179cb5098cf6655c0a6728742ead1ece09c1ea)。追加スケジュールなし、フォーム送信なし、WordPress本体の編集なし。
**Check** この新検査のActions完了と変更文言の本番表示は未確認。CF7配達成功の確認ではない。
**Act** 新たな実ログで不一致が続けば、Coworkがキャッシュ・現行CF7保存状態を再確認し、WordPress側の修正を担当。D0=11/14、D+7=11/21、D+14=11/28に外部有効問い合わせ数と入力/成功イベントを比較（現状は効果未判定）。

### その他継続
- 放デイAS-03：11/09本番GET、11/16・11/23評価。11/14の相談ページ3PV/採用2PVから申込発生と推定しない。
- 保育駒沢フォーム初期選択：11/12 D0、11/19・11/26に評価。
- 保育 canonical/sitemap：11/09 D0、11/16・11/23・12/07にGSC・Indexing状態を同一URLで追う。旧URL転送の正常動作は解除しない。
- KPI管理画面のGitHub OAuth404はコード修正済みだが本人iPhone実認証未確認。
- 求人時給は正式数値が確定するまで推測変更しない。記事数増加で成果を評価しない。

## 安全・状態
今日日報作成時点のサイト本体新機能改修なし。実施したのは**既存公開GET監視への会社問い合わせ文言の回帰検査追加**。GitHub変更≠CI/配備/実受信。外部有効受付は全サイト未照合、成果率算出不可。相談者個人情報、送信先アドレス、検索クエリ、Secret等は公開GitHubに保存しない。

## 検査完了追記（2026-11-15 08:57 JST頃）
- 新規追加の会社HP公開フォーム文言チェックを含む既存 [site-smoke #43655677352](https://github.com/t-ooku/trioland-social-publisher/actions/runs/43655677352) が **success**。会社 `/contact/` の公開GETは200で、検査が対象とする旧い「御社名必須」「確認する」パターンの警告は**発生しなかった**。これは現行CF7保存・全端末表示・実送信・メール受信の証明ではない。外部Webテキスト抽出の古い内容はキャッシュ等の可能性が残り、当該Actionsの公開HTTP結果を優先して記録する。
- Makeの同じrunの実ログは **Live UNKNOWN / Recipient delivery UNKNOWN**。フォーム表示のCI成功と送達を混同しない。
- [KPI dashboard safety and publish check #43655980373](https://github.com/t-ooku/trioland-social-publisher/actions/runs/43655980373) は **success**。11/15向け `dashboard/latest.json` はGitHub main反映済み、データ検査PASS。ただし認証後の管理画面表示やWorkerデプロイの保証ではない。
