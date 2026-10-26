# Coworkへの指示書｜トリオランド採用SEO・応募UX（2026-10-27）

**状態：GitHubへ保存のみ。Cowork未受領・未着手・未実行。**

## 役割分担・禁止事項
- Cowork（Claude MAX）：文章、ユーザー導線、応募者心理、重複・検索意図の統合提案、スマホ/PCでの読みやすさに専念。まず修正案・根拠・差分を報告し、Codexと同一ファイルを同時に編集しない。
- Codex：コード変更、GA4/GSCの実データ取得（権限がある場合のみ）、テスト・CI・本番URL・応募CTA/フォームの挙動確認、公開。
- 1日5本などの機械的な記事作成禁止。新規記事は独自一次情報と既存記事にない検索意図が確認できた場合のみ週1〜2本以下。
- GSC/GA4実データ、既存の内部リンク、検索インデックス状況を確認せずに削除/301/canonical統合を実施しない。
- 時給、給与、休日、待遇、資格、勤務地、募集有無、職員の声、応募実績を推測しない。問い合わせの実送信や個人情報を含む検証は不可。

## 2026-10-27確認した一次情報
- 運営会社の現行採用一覧: https://www.triocareer.jp/company/recruit/
  - トリオランド保育士・保育補助を掲載。保育士は「月給310,500円〜」、保育補助の給与は「応募・見学時にご案内」。
  - 同じ一覧では調理スタッフ募集の掲載は見当たらない。「募集中」「募集終了」は推測しない。
- 東京都最低賃金: 2026-10-01から時給1,280円（東京労働局: https://jsite.mhlw.go.jp/tokyo-roudoukyoku/news_topics/houdou/20260930chinginka_00001.html）。
- main: `site/recruit/` に121記事、`site/recruit/index.html` に121個のユニークな記事リンク、`site/sitemap.xml` に全135 URL。突合した全121記事で一覧・sitemapへの登録欠落なし、sitemap URL重複なし。ただし全121本文の品質・リンク到達・流入データまでは検証できていない。

## 本日Codex/GPT側で実施した変更（同じ箇所の重複編集禁止）
1. `site/recruit/hoikushi-tokyo23-salary-condition-guide.html`：保育士給与について、運営会社の最新公式採用一覧を直接確認できるリンクを設置。個別手当・住居条件は未確認のまま。
2. `site/recruit/nursery-cooking-staff-setagaya.html`：2026-09-11の調理スタッフ求人内容を過去情報と明記。現行一覧に調理職の掲載が見当たらない点を日付と公式リンク付きで記載。
3. `.github/workflows/site-smoke.yml`：給与条件ガイドの本番リンク・採用フォーム導線確認を追加。CI結果と本番反映の成功は別に確認する。

## Coworkの具体的な点検・提案タスク
1. **最優先：採用者を誤誘導する表現の精査**
   - `site/recruit/nursery-cook-qualification-required-check-guide.html` には2026-10-10当時の調理スタッフ募集が説明されている。現在は会社の採用一覧に調理スタッフが見当たらないため、「現在も募集」と誤認させない書き出しを**修正前/修正後**で提案。
   - `site/recruit/part-time-nursery-cooking-staff.html`、`site/recruit/nursery-cooking-staff-setagaya.html` と相互参照し、過去条件が現在の募集条件に見えないか点検。
2. **検索意図のカニバリ候補**
   - `nursery-cook-qualification-required-check-guide.html` vs `nursery-cook-experience-preferred-guide.html`：資格要件と経験者優遇の役割差、重複段落、本文の独自性を比較。
   - `hoikushi-current-opening-official-check-guide.html` vs `hoikushi-job-posting-official-info-compare.html`：募集の有無と求人票の条件比較という検索意図差を明確にする見出し・相互リンクを提案。
   - 他の似た記事も重複タイトル・見出し・文体だけでなく検索意図、実際の掲載順位・クリック（取得可能なときのみ）を根拠に評価。統合の公開操作はしない。
3. **応募導線・UX**
   - 正式公開された会社トップ `https://www.triocareer.jp/` → 会社採用 `https://www.triocareer.jp/company/recruit/` → 園採用 `https://hoiku.triocareer.jp/recruit.html` → `#form` をPC/スマホで点検。実機不能ならHTML上の仮評価と明記。
   - 調理職記事の共通「応募・見学の相談はこちら」CTAが「募集中」と誤解されないか検討。募集の有無を尋ねる表現や現行募集職種だけに進む選択肢など、実装可能な改善コピーを示す。
   - 専用フォームは希望職種（保育士/保育補助/見学相談）、希望園を選択できる。調理スタッフの入力選択肢はないため、募集状況確認導線と応募確約を混同しない。
4. **納品フォーマット**：URL、現状引用（短く）、問題、一次資料、ユーザーへの不利益、改善後コピー、優先度、流入の確認要否、未確認情報を表にし `docs/seo/2026-10-27-cowork-recruit-audit.md` に保存。Codexへ実装候補として引き継ぎ。保存・受領・実装・CI・公開はそれぞれ別ステータスで管理。

## KPIと検証
- GSC：検索表示・クリック・平均掲載順位。GA4：記事→応募CTAクリックと応募完了。期間付き実数のみ。
- 取得できない場合、数値を0としないで「未取得」。
- 本番HTTP 200、実ページ内容、フォームのHTML、送信処理・メール到達を区別する。実送信を伴うテストは許可済みの専用テスト環境が必要。
