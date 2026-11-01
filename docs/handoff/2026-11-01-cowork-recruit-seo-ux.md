# 2026-11-01｜トリオキャリアHP全体KPI・保育補助面接ガイドの品質点検

**状態：GitHubへの指示書保存のみ。Coworkの受領・着手・完了を意味しない。**
既存の `docs/handoff/2026-10-31-cowork-recruit-seo-ux.md`、Issue #15（KPI・SEO品質）と #16（正式給与・応募フォーム）を先に参照。重複依頼や同一ファイルの並行編集は避けること。

## 本日の一次情報・実施内容
- 会社HP `https://www.triocareer.jp/` は正式公開済み。公式採用一覧 `https://www.triocareer.jp/company/recruit/`（2026-11-01確認）では保育士「月給310,500円〜」、保育補助「応募・見学時にご案内」、勤務地は駒沢大学園・梅ヶ丘園。保育補助の詳細な勤務時間・日数・手当はこの公式一覧だけでは確認できない。新しい給与額は推測しない。
- `site/recruit/hoiku-assistant-interview-reverse-questions-guide.html` を修正。2026年9月24日時点の勤務時間・日数を現在の条件と誤認しないよう明示し、旧住所の単独表記による園の取り違えを防止、会社公式採用一覧へのリンクを各該当箇所に追加。構造化データのdateModifiedは2026-11-01。記事修正 `3ef1f7a6`。
- `.github/workflows/site-smoke.yml` の「Updated recruitment guides」に当該URLのGET/公式採用一覧/応募CTA検査を追加。commit `dc2b6ef9`。この検査は成功実行まで「本番検証済み」と呼ばない。
- main上の `site/recruit/index.html` と `site/sitemap.xml` への当該記事掲載を確認。sitemap 135 URL・重複0。これは検索登録や本番HTML表示の証明ではない。
- 2026-10-31実行の `Trioland site smoke` は成功（run 41159503007、今回の修正より前）。2026-11-01の採用SEO関連CIは記事修正commit `3ef1f7a6` で成功（run 41256557407）。変更記事の新しい本番検査・フォーム実送信は未確認。
- 会社HP・保育HP両ホストのGA4/GSC実数は本日も取得できていない。接続済みGoogle Driveで `triocareer` / `トリオキャリア` / `GA4` / `Search Console` / `hoiku.triocareer.jp` / `アクセス解析` を照会したが対象日別実績の特定には至らず、GA4/GSC本体への読取権限・計測開始日は未確認。未取得を0件と扱わない。

## Cowork担当：文章・UX・応募者心理・重複分析
1. 面接関連の `site/recruit/hoiku-assistant-interview-reverse-questions-guide.html`、`hoiku-assistant-interview-preparation-guide.html`、`hoiku-assistant-application-motivation-noqualification.html` を全文比較。読者の検索意図（逆質問、面接準備、志望理由）が区別できるか、同じ一般論の反復や古い条件が残る箇所を引用して監査。流入・インデックス実数が未取得の間、削除・301・canonical統合は行わない。
2. 保育補助の応募候補者視点で、会社HP→会社公式採用一覧→トリオランド採用 `/recruit.html` → `#form` をスマートフォンで検証。採用前の園見学と応募の目的、入力欄「ご経験」とHTML名 `child` の紛らわしさ、必須欄、完了表示をチェック。実送信は禁止。ブラウザ操作できなければコード確認のみと明示。
3. 修正案は差分単位で作成し、勤務条件・時給・募集枠・職員の声・応募者数などを補完・創作しない。新規記事は不要。保存先は `docs/seo/2026-11-01-cowork-recruit-audit.md`。ACKED/IN_PROGRESS/DONEの記録なしに受領・実行済みと扱わない。

## Codex担当：計測・コード・テスト・公開確認
1. 最優先は2サイト全体の実測KPI。対象期間：前日2026-10-31（JST）、前日比の基準10/30、直近7日10/25〜10/31。月次は「前月10月確定（10/1〜10/31）」と「当月11月速報（11/1 00:00〜取得時点）」を分け、当日速報を前日実績に混ぜない。GSC表示・クリック・CTR・順位、GA4ユーザー・新規・セッション・PV・流入元・入口ページ、保育見学/利用相談/法人/採用などのCTA/フォーム開始/完了。サイト別・事業別に実測値のみ。GSC遅延は最新確定日を別記、未取得は未計測/権限不足/接続未確認/処理待ちに区分。
2. 会社HP WordPressのGA4設定 `trio_ga4` の本番有無とホスト別タグ発火、GA4/GSCの読取経路、実フォーム完了イベントの定義を確認。PIIを送らない設計を優先し、新規有料契約・権限拡大・本番への実問い合わせ送信をしない。結果は Issue #15 に根拠付きで記録する。
3. 新記事の追加・一括削除はしない。記事修正 `3ef1f7a6` とsmoke追加 `dc2b6ef9` について、main反映・採用SEO CI・次回smokeのジョブ結果・本番記事GET 200・公式リンク・`/recruit.html#form`・一覧・sitemapを別々に判定。GET確認をメール到達・応募完了と呼ばない。
4. #16のフォーム項目は受信側API互換性が判明するまで破壊的変更を避ける。最低賃金を下回る旧時給表示が見つかったら根拠を添えて優先報告し、正式額がない場合は金額変更をしない。

## 報告の順番
HP全体KPI（会社/保育、前日・前日比・7日・当月、未取得理由）→事業別成果→主な増減と根拠→記事修正URL・commit→CIと本番HTTP→応募導線と送信検証区別→残課題。作業量を成果数と混同しない。
