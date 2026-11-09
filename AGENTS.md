# 定期点検
- Trioland site smoke / 毎日08:15 JST（mainのsite-smoke.yml） / GitHub Actionsログ・Step Summary、失敗時[AUTO][TRIOLAND] Issue。
- 既存画像検査と主要ページ、保育園/放デイPages、問い合わせAPI GET（405想定、実送信なし）、求人記事最終コミット（48h超で警告）を確認。
- 個人情報・Secretを報告しない。D1書込・SNS公開・課金・問い合わせ実送信・価格/規約変更は行わない。
- 問い合わせメールの中継（Make）/ 毎日の「トリオキャリアHP・採用SEO日報」の中で確認 / 手順と異常時の書き方は docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md。取れなければ「未取得」と書き、「正常」としない。

- Make問い合わせ中継：既存site-smokeの `tools/make_inquiry_health.py`（毎日08:15 JST、読取専用）と `docs/handoff/2026-11-09-cowork-to-codex-make-health-check.md` に沿って稼働・キューを確認。2026-11-10のrun42723829749は判定6件PASSだが `MAKE_API_TOKEN` Secret未設定でライブ状態UNKNOWN。CI成功のみで「メール中継正常」と報告しない。重大障害は実問い合わせが届かなくなるため日報で先に注意喚起し、Make再送・キュー削除・本番テスト送信はしない。詳しくは `docs/seo/2026-11-10-inquiry-pdca.md`。
