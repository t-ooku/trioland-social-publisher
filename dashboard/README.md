# KPI・PDCA専用LP（会社／保育／放課後デイ）

## 設置先と保護

管理者限定URL: `https://trioland-social-publisher.mygate-jp.workers.dev/admin/kpi`。

既存のWorker管理セッション（GitHub本人確認・管理コードログイン、8時間セッション）を再利用する。未ログイン時はKPI画面を開くログイン画面へ転送し、どちらの認証方法でも認証後に `/admin/kpi` を表示する。公開3サイトのHTMLには追加しない。HTMLは `dashboard/index.html`、日報データは `dashboard/latest.json`。管理者のブラウザにはWorkerの `/admin/kpi/data` から返す。GitHubのrawファイルにアクセスできない場合は実測値を偽造せず取得失敗を表示。認証情報・氏名・メール・電話・相談本文・子どもの情報・送信本文・Makeトークンは保存しない。

**重要：このGitHubリポジトリはpublic。dashboard/latest.jsonもGitHub上では公開される。現在は、既存の公開日報に記載済みの匿名・集計値だけを使う。非公開の顧客成果・社内売上・未公開の取引情報を追加する場合は、このJSONに記録せず、認証済みのサーバー側非公開ストレージへ方式変更する。**

## 表示内容

- 会社HP、トリオランド、アフタースクールの3サイト切替と、前日／取得可能7日切替。
- GA4アクティブユーザー、新規、セッション、PV、日別PV推移。
- GSC検索表示・クリック・CTR・平均順位。GA4日付は日本時間、GSC日付は米国太平洋時間。
- CTAクリック／フォーム開始／送信成功イベント。外部の真正な問い合わせ完了は受付台帳と照合できるまで「未照合」。
- PDCA施策（P0/P1、Plan/Do/Check/Act、実施状況、次アクション、担当、根拠リンク）、実行履歴、計測品質・欠測の注記。
- 3ホスト間のユーザー重複は未判定。ユーザーの合算で「全体ユニーク人数」と言わない。

## 毎朝の更新（既存タスクに統合）

既存の「トリオキャリアHP・問い合わせ改善日報」を別タスクなしで使う。Windsor.aiからデータを実取得し、匿名集計だけで `dashboard/latest.json` の同じスキーマを更新する。データ期間、欠測、未判定のままの受付、確認したPDCA状態、変更URL/commit/CI/本番確認を必ず更新する。日報の実行に失敗した場合は前回値を残し、更新日を偽らない。毎朝の更新が完了すると管理者画面の「↻ 再取得」で最新版を取得できる。毎回表示の鮮度を確認する。

スキーマは `schemaVersion: 1`、`sites`、`ga4Series`、`ga4Seven`、`gscSeries`、`events`、`pdca`、`history`、`warnings` を持つ。ユーザー指標 `ga4Series[][site][0]` は期間内アクティブユーザー。期間計のユーザー数は日別値を加算せず、GA4から期間集計を別取得して `ga4Seven` に保存する。GSCの確定7日は直近確定日の前6日から取得する。

## リリース検証

1. `main`に反映しただけでは本番のWorkerのデプロイを保証しない。Workerのバージョンと本番反映を区別。
2. `/admin/kpi` 未ログインは `/admin/access` へ302。ログイン済みなら200でダッシュボードを表示。
3. `/admin/kpi/data` 未ログインは302、ログイン済みならJSON 200。機密情報が入っていないこと。
4. CSP、noindex、no-store、X-Frame-Optionsを確認する。パスワード・Cookie・認証トークンをログに出さない。
5. 期間とサイトの切替、欠測の「未取得」表示、外部問合せの「未照合」、スマホ表示を確認。
6. GitHubの更新は失敗したら原因を調べて安全に再試行し、古い数値を新しいものとして見せない。
7. 本番への反映が未確認なら、実装済み・未公開と明確に報告。

## 主な参照元

- `docs/seo/2026-11-10-inquiry-pdca.md`
- `docs/seo/2026-11-09-inquiry-pdca.md`
- `docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md`
- [既存Issue #15](https://github.com/t-ooku/trioland-social-publisher/issues/15)

