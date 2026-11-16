# でじるみ6事業所：相談ボタンの行き先は会社HPのフォーム（2026-11-16 21:43 JST、所有者の決定）

- 所有者が「1でOK」と決めた。選択肢は、1＝会社HPのお問い合わせフォーム、2＝でじるみ本部サイトの事業所ページのまま。
- 理由：就労の問い合わせを会社HPで数える方針（`docs/handoff/2026-11-15-cowork-shuro-kpi.md`）。フォームの「ご用件」に「就労継続支援B型（でじるみ）の見学・利用相談」があり、info@ と就労の担当者（Bcc）に届く設定（実メールでの Bcc 着信は未確認）。
- **状態：本番確認済み（2026-11-16 22:15 JST ごろ、Cowork が6ページの公開ページを読むだけで確認。送信・クリックなし）。D0＝2026-11-16**（Codex の GET で確定してください）。D+7＝11/23、D+14＝11/30。

## 公開ページで確かめたこと（6ページとも同じ）

- 上のボタンの列：「見学・利用を相談する」（`https://www.triocareer.jp/contact/#form`）→「TEL」→「地図アプリで開く」→「でじるみ公式の事業所ページ」。
- よくある質問「見学や体験はできますか？」の答え：「無料見学・無料体験を随時受け付けています。このページの「見学・利用を相談する」ボタンか、お電話でお問い合わせください。」
- PHP のエラー表示なし。
- 検索エンジン向けの情報（FAQPage）の答えも直すよう案内した。所有者は2か所とも直したと報告。Cowork は HTML そのものを見ていないので、この部分は**未確認**（Codex の GET で確かめてください）。

## 変えたこと（6ページとも同じ）

| ページ | テーマのファイル | ボタンを貼った場所（この直前） |
|---|---|---|
| `/service/digilumi/tokyooota/` | `pages/f-dg-ota.php` | `<a class="btn" href="tel:0367154307">` |
| `/service/digilumi/chibaabiko/` | `pages/f-dg-abiko.php` | `<a class="btn" href="tel:0471976820">` |
| `/service/digilumi/chibaichikawa/` | `pages/f-dg-ichikawa.php` | `<a class="btn" href="tel:0473214289">` |
| `/service/digilumi/tochigiutsunomiya/` | `pages/f-dg-utsunomiya.php` | `<a class="btn" href="tel:0286899125">` |
| `/service/digilumi/chibacyuo/` | `pages/f-dg-chuo.php` | `<a class="btn" href="tel:0433015344">` |
| `/service/digilumi/tochigioyama/` | `pages/f-dg-oyama.php` | `<a class="btn" href="tel:0285326459">` |

1. ボタン（全ページ同じ1行）：
   `<a class="btn" href="/contact/#form" style="background:var(--ink);color:#fff">見学・利用を相談する</a>`
   - 同じタブで開く（会社HPの中なので）。「ご用件」は自動では選ばれない。フォームの設定（CF7 234）は変えていない。
2. よくある質問「見学や体験はできますか？」の答え（1ファイルに2か所：検索エンジン向け情報と、ページ下のよくある質問）：
   - 前：`でじるみ公式サイトの事業所ページからお問い合わせください。`
   - 後：`このページの「見学・利用を相談する」ボタンか、お電話でお問い合わせください。`
   - 前半の「無料見学・無料体験を随時受け付けています。」は変えていない（でじるみ公式サイトの記載）。

## 見る指標

- 会社HPの各事業所ページの `cta_click`（`cta_type=contact`、`link_path=/contact/`）。会社HPの `/contact/` は `tools/trio_ga4.py` の判定で contact に入る。変更前は、このページから `/contact/` へのリンクはフッター近くの共通ブロック（「お問い合わせ方法を見る」）だけ。
- 会社HPフォームの送信成功と、外部の実受付のうち「ご用件」が「就労継続支援B型（でじるみ）の見学・利用相談」の件数（Codex が照らした件数だけ）。
- 迷惑メール（11/16 未明の1通は、このご用件を選んだ迷惑メールの可能性が高い）は有効な問い合わせから外す。
- でじるみ事業トップ `/service/digilumi/` は説明文を評価中（D+7＝11/22）。今回は触っていない（同じ日に画像は戻した。`2026-11-16-cowork-digilumi-images.md`）。

## Codex へ

- 6ページを GET し、上の列とよくある質問（本文と FAQPage の両方）を確かめ、D0 を台帳に書く。
- 生成元 `corp-site/gen_pages.py`：でじるみの `visit="/contact/#form"`、`visit_label="見学・利用を相談する"`（相対パスなので `target="_blank"` を付けない）。`DG` の `faq` の4つ目の答えを上の「後」に直す。次のテーマ版を作る前に。
- 次の段階の案（今回はしない）：CF7 の `default:get` で「ご用件」を URL から選んだ状態にする。フォームの設定を変えることになるので、所有者の確認が要る。
