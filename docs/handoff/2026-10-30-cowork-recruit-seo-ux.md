# 2026-10-30｜会社HP全体KPI・保育補助の勤務条件・求人UX 改善指示（Cowork / Codex）

**状態：GitHubに依頼を保存するのみ。Coworkの受領・実施を確認したものではない。**
前回の `docs/handoff/2026-10-29-cowork-recruit-seo-ux.md` と最新の `main` を必ず参照し、同一箇所の並行編集は避ける。

## 10月30日に確認できた事実
- トリオキャリアの公式会社HP `https://www.triocareer.jp/` は公開中。公式採用一覧 `https://www.triocareer.jp/company/recruit/` は、保育士「月給310,500円〜」、保育補助「応募・見学時にご案内」。調理スタッフは確認した一覧に項目がない（募集終了と断言しない）。
- `site/recruit/hoiku-assistant-fulltime-vs-parttime-guide.html` に、2026年9月16日時点の「正社員週5日・1日8時間」「パート週3〜5日・1日4〜8時間」が現在の募集条件のように読める箇所を確認。10月30日に過去情報と明示し、現行公式採用一覧にリンクする修正をGitHubにコミットした。**現行の雇用形態・勤務日数・休日はこの一覧だけでは確認できない**。
- `site/recruit/hoiku-assistant-holiday-leave-guide.html` は10月29日に同趣旨の過去情報の明示を実施。記事を統合・削除する判断はまだ行わない。
- `site/recruit/*.html` にはガイド記事と一覧ページがあり、新規記事量産はしない。重複/薄い内容/カニバリはファイルごとの証拠とGSC流入・インデックス確認が必要。
- Google Drive上で「トリオキャリア」「Search Console」「GA4」「hoiku.triocareer.jp」「www.triocareer.jp」を検索した範囲で、当該両サイトのGA4/GSC**日別の実績レポートは確認できなかった**。GA4/GSCの本番設定やアカウント内データの不存在を証明するものではない。

## Cowork担当：文章品質・UX・検索意図
1. `hoiku-assistant-fulltime-vs-parttime-guide.html`、`hoiku-assistant-holiday-leave-guide.html`、`hoiku-assistant-negotiable-hours-guide.html`、`fulltime-hoiku-assistant-komazawa.html`、`part-time-hoiku-assistant-komazawa.html` の「雇用形態・勤務時間・休暇」の重複と検索意図差分を比較し、独自情報のない反復表現、誤認を招く文を**具体的なURL・原文引用とともに**監査する。
2. 現在公表されていない待遇・時給・休日・採用実績・職員の声は推測しない。新規記事は原則週1〜2本以下。独自有益情報と別の検索意図を示せなければ公開しない。削除、301、canonicalはアクセス・インデックス・内部リンクの根拠を確認するまで提案に留める。
3. 「会社HP→会社採用→保育採用→希望職種・希望園→応募フォーム」のスマホ導線で、見学希望と正式応募が混同されないか、個人情報入力への不安、必須欄、送信完了説明、離脱の理由となる文言を具体的に点検する。実機未確認なら「HTMLのみ」と明示する。
4. 出力先 `docs/seo/2026-10-30-cowork-recruit-audit.md`。URL、検索意図、具体的な問題表現、裏付け、改善文案、実機/コード確認の区別、実施優先度、未確認事項を記載。**保存だけで受領した扱いにしない。**

## Codex担当：計測・コード・CI・公開検証
1. 最優先はトリオキャリア会社HP `www.triocareer.jp` とトリオランド保育HP `hoiku.triocareer.jp` の**全体KPI実測値**。GA4、GSC、既存WordPress設定、既存Analyticsレポートの読取経路を調査。GA4測定IDやGSCタグの存在だけでアクセス数を推定しない。接続なし/権限なし/タグなし/データ反映遅延を区別。
2. 報告をHP別に、前日00:00〜23:59 JST、前日比、直近7日、当月累計で統一。検索表示/クリック/CTR/平均順位、アクティブユーザー/新規ユーザー/セッション/PV、流入元、入口ページ、CTAクリック/フォーム開始、問合せ・見学・採用応募など**完了数**をそれぞれ出典と期間付きで取得。事業別区分は記録で判明するもののみ。未取得を0で埋めない。
3. 既存の計測を監査し、足りない場合に限り、ページ閲覧/フォーム開始/送信成功/事業別CTAのプライバシーに配慮した最小追加計測の実装案と検証手順をIssueに記録。新規有料契約、無断の個人情報収集、実問い合わせ送信、権限拡大なし。
4. 10月30日に修正した `hoiku-assistant-fulltime-vs-parttime-guide.html` の本番 GET 200、公式採用一覧へのリンク、`/recruit.html#form` CTA、生成CI、求人一覧・sitemap登録を別々に検証し、Run URLと実測結果を残す。GitHubコミットやCI成功を本番反映の証明とみなさない。
5. 旧時給表示を発見したら現行の公式資料に照合。新給与を作らず、歴史的な記述と現行条件の混同を解消する。新規記事量産しない。

## 完了を別々に判定
指示書の保存 / Cowork受領 / コード更新 / GitHub main反映 / CI成功 / 一覧・sitemap / 本番HTTP / CTA遷移 / フォーム実送信・メール到達 / GSC・GA4実数取得。未確認箇所は理由を書き、予定を成果として報告しない。
