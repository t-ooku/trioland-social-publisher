# Claude Cowork向け：トリオランド採用SEO改善指示書（2026-10-18）

## 目的
トリオランドの採用応募を増やす。記事の大量生成を停止し、既存121記事の価値と応募導線を高める。

## 作業範囲
対象リポジトリ：t-ooku/trioland-social-publisher
対象：site/recruit/*.html、site/recruit/index.html、site/recruit.html、関連記事、募集CTA。
最初に docs/seo/2026-10-18-recruit-seo-policy.md と AGENTS.md を読む。Codexと競合しないよう、コード/CI/デプロイ/計測はCodexに任せる。

### P0 応募者視点の品質監査
- 求職者が知りたい具体的な答えがなく、「不明なので面接で確認」だけで終わる記事を洗い出す。
- 同じ検索意図の重複候補をクラスタ化。少なくとも次の6ファイルを比較：
  - site/recruit/nursery-cook-allergy-meal-role-guide.html
  - site/recruit/nursery-cook-food-safety-records-role-guide.html
  - site/recruit/nursery-cook-qualification-required-check-guide.html
  - site/recruit/nursery-cook-experience-preferred-guide.html
  - site/recruit/hoiku-assistant-daily-flow-check-guide.html
  - site/recruit/hoiku-assistant-first-day-preparation-guide.html
- 検索意図、独自性、読みやすさ、採用CTA、関連内部リンク、古い条件、重複率を記事ごとに評価する。
- 削除や統合は勝手に行わず、正規URL候補と統合理由、リダイレクト案を提出。検索実績が取れない場合は「候補」に留める。

### P1 採用ページの改善案
- 求職者が30秒で「どんな園か」「応募資格」「仕事内容」「勤務地」「働き方」「応募先」を理解できる導線を設計。
- 園の実写真、職員の実際の声、1日の流れ、研修・福利厚生は一次資料が確認できたものだけ使用。架空の声・実績・数字を作らない。
- スマホでの改行・CTA・フォーム遷移を優先。変更前後の比較と理由を示す。
- 公式採用ページの保育補助/調理スタッフの古い時給表示はP0課題。正式な改訂額を推測して書き換えない。古い額を記事へ転載しない。

### P2 コンテンツ改善
- 新規記事を毎日5本作らない。新規公開は原則週1〜2本以下、既存記事で答えられない独自の検索意図がある場合だけ。
- 既存記事の冒頭に求職者への具体的な答え、確認済みの園独自情報、応募導線を配置する。
- title/H1/meta description/内部リンク/CTAの改善案を優先順位付きで提出。
- 公式募集条件・法令・勤務地・給与・手当は推測禁止。

## 成果物
1. docs/seo/ 配下に監査報告書（記事ごとにURL・検索意図・重複候補・修正案・優先順位）。
2. 採用LPのスマホ/PC改善案と文言案。
3. 統合候補ごとに正規URL、残す内容、301/canonical方針、リスク、計測が必要な項目。
4. 実行した場合は変更ファイル・commit/PR・公開URLと検証結果。実行していなければ「未実施」。
5. 指標は検索クリック→採用CTAクリック→応募完了→面接→採用。取得できない数値は0にせず未取得。

## 安全・連携
- 最初は監査と修正案。公開変更はCodexと作業分担を確認してから行う。
- CodexがSEO計測・実装・デプロイを担当。二重実装しない。
- GitHubへの保存はCoworkへの受領確認ではない。実際の受領・着手・完了を区別する。
