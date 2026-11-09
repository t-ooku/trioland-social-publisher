---
status: OPEN
from: Cowork（Claude）
to: Codex（「トリオキャリアHP・採用SEO日報」の実行担当）
created: 2026-11-09
---

# Codexへの依頼｜日報に「問い合わせメールの中継（Make）が止まっていないか」を1項目足す

**状態：依頼をmainへ保存。Codexの受領・日報への反映は未確認。**
新しい定期タスクは作らない。既存の「トリオキャリアHP・採用SEO日報」（`docs/seo/YYYY-MM-DD-inquiry-pdca.md`）の中で毎日1回確認する。

## なぜ必要か（2026-11-09 実際に起きたこと）

- 保育HP・放課後等デイの問い合わせは、Worker `/api/inquiry` → Make のWebhook → Make シナリオ（Gmailで各園・各事業所へ送信）で届く。
- 2026-11-01 17:13 JST、Make の Gmail 接続のトークンが失効（`invalid_grant: Token has been expired or revoked`）。シナリオが初期化エラーで止まり、以後の問い合わせは Make のキューに溜まったまま、**どこにもメールが届かなかった**（約8日間）。
- Worker 側は Make のWebhookが 200 を返すため成功扱い。GA4 の成功イベントも出る。**サイト側の数字だけでは止まっていることに気付けない。**
- 2026-11-09 に大隆さんが Gmail 接続を再認証し、シナリオを再開。溜まっていた11件は 2026-11-09 14:44 JST に送信成功（本番確認済み）。
- Make の停止通知は Make アカウントのメール（会社ドメイン）に届く設定で、普段見ている受信箱には届いていなかった。

## 日報で毎日見ること

対象：Make チーム `2538356`、シナリオ `6306695`（トリオキャリアHP 問い合わせ振り分け）、Webhook `2823353`。

| 確認 | 正常 | 異常の判定 |
|---|---|---|
| シナリオ `isActive` | true | false |
| シナリオ `isinvalid` | false | true |
| Webhook `queueCount`（上限50） | 0 | 1以上が日報の時点で残っている（正常なら数秒で0に戻る） |
| 直近の実行の `status` | 1（成功） | 3（エラー）、または `AccountValidationError` / `invalid_grant` を含む警告 |
| Gmail 接続 `11149787` の期限 | — | 期限（現在 2027-05-08）まで30日を切った |

取得方法（どれか使えるもの）：

- Make の MCP / コネクタが使える場合：`scenarios_get(6306695)`、`hooks_get(2823353)`、`executions_list(6306695)`。
- Make API を使う場合：ゾーン `us2.make.com`。`GET /api/v2/scenarios/6306695`、`GET /api/v2/hooks/2823353`、`GET /api/v2/scenarios/6306695/logs`。読み取り専用のトークン（scenarios:read・hooks:read・connections:read）を Secrets から読む。**トークン・Webhook URL はリポジトリ・日報・Issue に書かない**（このリポジトリは公開）。
- どちらも使えない場合：日報に「Make中継：未取得（Make への接続なし）」と書く。**「正常」や「0件」と書かない。** 接続が無いことを1回だけ大隆さんへの依頼として挙げる（Make のAPIトークン作成とSecrets登録）。

## 日報への書き方

- 正常なら1行：`Make中継：正常（シナリオ稼働・キュー0・直近実行 成功 YYYY-MM-DD HH:MM JST）`
- 異常なら日報の**一番上**に：`⚠ 問い合わせメール停止の疑い（理由：…）`。問い合わせの中身・氏名・電話・メールアドレスは書かない（件数だけ）。
- 異常時の「大隆さんがやること」（本人の認証が要るため）：
  1. Make（https://us2.make.com/ ）にログイン → 左メニュー「Connections」
  2. 「大久津隆則's Gmail connection」→「Reauthorize」→ Google でログインして許可
  3. 左メニュー「Scenarios」→「トリオキャリアHP 問い合わせ振り分け（保育園・放デイ）」→ スイッチを ON
  4. 完了確認：シナリオの「History」に成功（緑）が並び、Webhook のキューが 0 になる。溜まっていた分は再開すると自動で送られる。
- 自動で再開・再送・キュー削除はしない（溜まった問い合わせが消えるため）。

## 2026-11-09 時点の基準値（Cowork が Make で確認）

- シナリオ：稼働中（`scenarioIsActive: true`）
- Webhook：`queueCount` 0 / 上限 50、`enabled: true`
- 直近の実行：2026-11-09 14:44 JST に11件すべて成功（status 1）
- その前のエラー：2026-11-01 17:13 JST `AccountValidationError`（Gmail 接続の失効）

## 対象外

- 会社HP（WordPress の Contact Form 7）のメールは Make を通らないので、この確認の対象外。会社HPの受信確認は別途（大隆さんのテスト送信待ち）。
- 本番への問い合わせのテスト送信はしない。

## Codex 記録

（受領日時・日報への反映・初回の確認結果をここに追記）
