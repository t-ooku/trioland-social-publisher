# 2026-10-31｜トリオキャリアHP全体KPI・保育補助の勤務時間情報・応募UX

**状態：指示書をGitHubに保存。Coworkの受領・着手・実行・公開を意味しない。**
既存の `docs/handoff/2026-10-30-cowork-recruit-seo-ux.md` と Issue #15 / #16 を参照し、重複依頼・同一ファイルの並行編集を避けること。

## 本日確認した一次情報と変更
- 正式公開済み会社HP：`https://www.triocareer.jp/`。会社採用一覧：`https://www.triocareer.jp/company/recruit/`。保育士「月給310,500円〜」、保育補助「応募・見学時にご案内」。同一覧では保育補助の勤務日数・時間帯・休日の詳細を確認できない。未公表条件を作らない。
- 保育HP：`https://hoiku.triocareer.jp/`、採用ページ：`https://hoiku.triocareer.jp/recruit.html`。
- `site/recruit/hoiku-assistant-negotiable-hours-guide.html` は「公式求人では7:30〜20:30の間で応相談」「正社員週5日・1日8時間／パート週3〜5日・1日4〜8時間」が現行条件に見える状態だった。2026-10-31に過去情報の明示、公式採用一覧への直リンク、雇用形態別の確認事項を更新。更新内容は GitHub commit `f21129a5`。
- `.github/workflows/site-smoke.yml` の「Updated recruitment guides」のGET/公式リンク/応募CTA点検対象にこのガイドを追加。commit `060288ce`。追加検査が実行されたと確認するまでは本番検証済みとしない。
- `site/sitemap.xml` のURLは135件・重複0（本日GitHub mainを読取）。上記修正記事はsitemapと求人ガイド一覧に掲載済み。これらはGitHub上の整合であり本番HTTPや検索登録の証拠ではない。
- Search Console・GA4の両ホスト別の実績値は本日時点で取得できていない。Google Driveの「GA4」「Search Console」「hoiku.triocareer.jp」等の検索は、対象2サイトの日次集計を特定できなかった。**未取得とゼロは違う。**

## Cowork担当（文章・UX・応募者心理・統合候補）
1. 最新の `main` と上記更新記事を読む。次の5記事の検索意図を比較する：
   - `hoiku-assistant-negotiable-hours-guide.html`
   - `hoiku-assistant-fulltime-vs-parttime-guide.html`
   - `hoiku-assistant-holiday-leave-guide.html`
   - `part-time-hoiku-assistant-komazawa.html`
   - `fulltime-hoiku-assistant-komazawa.html`
   「応相談の意味」「雇用形態の比較」「休日の確認」「駒沢大学園の職種別求人」が別の読者ニーズか、実文とURLを対比し、重複・古い条件の断定を具体的に示す。Google流入・検索意図・インデックスの証拠がない段階では削除・301・canonical統合を実施しない。
2. 応募者視点で「会社HP→公式採用一覧→トリオランド求人→フォーム」をスマホで検証する。見学と応募の意思が入力欄で混ざらないか、条件不明時の説明、必須入力・送信ボタン・完了表示、別事業への誤誘導を点検。実機未確認ならHTML確認だけと明記。**実送信は禁止**。
3. 未公表の給与・勤務時間・休日・募集枠・職員の声・実績を創作しない。新規記事は原則週1〜2本以下、今回の目的では追加作成不要。提案は既存記事の局所リライトと誤認防止を優先。
4. 出力は `docs/seo/2026-10-31-cowork-recruit-audit.md`。問題箇所、引用、検索意図、修正文案、情報源、確認方法、優先度、未検証事項を記載。保存後、ACKED/IN_PROGRESS/DONE等の受領・完了記録がない限り「未受領・未実行」として扱う。

## Codex担当（コード・計測・CI・公開）
1. 2サイト全体のKPIを最優先。会社HPと保育HPをホスト別にGSCの表示/クリック/CTR/順位、GA4のアクティブ/新規ユーザー・セッション・PV・流入元・入口ページ、CTA・フォーム開始・完了（保育見学、利用相談、採用、放デイ、B型、法人等）について**実測値だけ**収集。前日、前日比、7日、当月をJSTで明記。未取得は原因区分を記録。現行のGA4/GSCアカウント接続・既存WordPress計測ID・ソースタグ・集計権限・イベント送信有無を読み取りで調べ、Issue #15 に結果を残す。実測できない数値を推測しない。
2. 本日の変更記事の `main`、CI、`site/recruit/index.html`、`sitemap.xml`、公開記事GET 200、公式採用一覧リンク、`/recruit.html#form` 導線を**別々**に検証。GitHub Actionの成功は本番Web表示の証明ではない。改修済みsmoke検査の最初の実行URL・結果を記録。
3. 現行会社HPのフォーム・保育HPの採用フォームの送信成功イベントがGA4で取れるかを証拠付き調査。未計測の場合は、PIIを送らない最小イベント案・受信側での完了判定・検証方法を Issue #15 に追記。無許可の新規トラッカー・認証権限拡大・本番フォーム実送信なし。
4. 旧時給表記は公式一次情報で照合し、正式給与額が不明なら数値を補完しない。自動一括記事生成・削除・301・canonical変更なし。

## 完了判定の区別
指示書保存、Cowork受領、コード修正、GitHub main反映、CI成功、一覧/sitemap、公開HTTP、実際の応募導線、フォーム送信・メール到達、GA4/GSC実数取得を分けて記録。採用・契約の増加は実績なしに断定しない。
