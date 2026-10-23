# Cowork向け：トリオランド採用LPと求人記事のCV改善（2026-10-24）

status: OPEN  
依頼先: Claude Cowork（文章・応募者心理・スマホUI/UX）  
リポジトリ: `t-ooku/trioland-social-publisher` / `main`

## 前提・今日の実装（重複開発禁止）
- 採用フォーム生成元 `build_site.py` に、希望職種（保育士／保育補助／見学・相談のみ）と希望園（駒沢大学園／梅ヶ丘園／どちらも検討中）の**任意**選択欄を追加済み（`698ad3a`）。受信API `src/inquiry.js` が対応する `jobType` と `facility` を受け取れるため、送信時は既存の `message` にも選択内容を追記して転送先の既存通知との互換性を優先した。
- 採用案内記事 `site/recruit/trioland-application-form-guide.html` は実フォームに合わせて修正済み（`c1d69ba`）。給与条件記事 `site/recruit/hoikushi-tokyo23-salary-condition-guide.html` では運営会社サイトの旧28万円表示への言及を削除（`7f1671b`、`2fa85fb`）。
- 求人一覧の応募方法カード抜粋を修正済み（`f11d2d1`）。
- サイト生成CI `40042241057` 成功、サイト点検 `40042263572` 成功。公開ページの直接取得はこの実行環境でDNS解決できず、**新しいフォーム選択欄が本番ブラウザで見えるかは未確認**。
- 2026-10-24時点の運営会社公式募集表示: 保育士月給310,500円〜、保育補助の給与は応募・見学時案内。調理スタッフの募集は同ページに記載なし。東京都最低賃金は2026-10-01から1,280円。**正式な未公開時給を推測しない**。

## Coworkへ依頼
1. スマホ幅で採用ページ `/recruit.html` のファーストビュー、固定CTA、フォーム、任意選択肢、送信時の説明文言を応募者目線でチェックする。画面確認できない場合はHTMLからの机上レビューと明記。
2. 職種選択／園選択のラベルは分かりやすいか。「見学だけ」「迷っている」求職者が迷わないか。**条件や職員の声・給与・採用実績を創作せず**改善案を提示。
3. 応募記事 `trioland-application-form-guide.html` と採用ページの入力項目表現を突き合わせる。重複した説明を減らし、1クリックでフォームへ進める構成案にする。
4. 既存121記事のうち、以下の近接テーマを優先して読み比べ、**削除や301は行わず**主ページ・補助ページ候補と検索意図の違いを報告する：
   - `nursery-cook-qualification-required-check-guide.html` × `nursery-cook-experience-preferred-guide.html`
   - `hoiku-assistant-daily-flow-check-guide.html` × `hoiku-assistant-first-day-preparation-guide.html`
5. 提案は `docs/seo/` 配下の報告書として残す。コード・自動テスト・CI・デプロイはCodex担当であり、両者が同じファイルを同時編集しない。

## 成果物と判定
各対象URLに対する変更案、応募CTAを改善する根拠、未確認事実、実装担当、計測可否を記録。
受領記録がないためこの指示書は **OPEN（受領未確認）**。GitHubに保存しただけで着手・本番反映済みと判断しない。