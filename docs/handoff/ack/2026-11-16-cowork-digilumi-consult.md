# でじるみ6事業所：相談ボタンの行き先は会社HPのフォーム（2026-11-16 21:43 JST、所有者の決定）

- 所有者が「1でOK」と決めた。選択肢は、1＝会社HPのお問い合わせフォーム、2＝でじるみ本部サイトの事業所ページのまま。
- 理由：就労の問い合わせを会社HPで数える方針（`docs/handoff/2026-11-15-cowork-shuro-kpi.md`）。フォームの「ご用件」に「就労継続支援B型（でじるみ）の見学・利用相談」があり、info@ と就労の担当者（Bcc）に届く設定（実メールでの Bcc 着信は未確認）。
- **状態：手順を渡した。貼ったか・公開されたかは未確認。**

## 変えること（6ページとも同じ）

| ページ | テーマのファイル | ボタンを貼る場所（この直前） |
|---|---|---|
| `/service/digilumi/tokyooota/` | `pages/f-dg-ota.php` | `<a class="btn" href="tel:0367154307">` |
| `/service/digilumi/chibaabiko/` | `pages/f-dg-abiko.php` | `<a class="btn" href="tel:0471976820">` |
| `/service/digilumi/chibaichikawa/` | `pages/f-dg-ichikawa.php` | `<a class="btn" href="tel:0473214289">` |
| `/service/digilumi/tochigiutsunomiya/` | `pages/f-dg-utsunomiya.php` | `<a class="btn" href="tel:0286899125">` |
| `/service/digilumi/chibacyuo/` | `pages/f-dg-chuo.php` | `<a class="btn" href="tel:0433015344">` |
| `/service/digilumi/tochigioyama/` | `pages/f-dg-oyama.php` | `<a class="btn" href="tel:0285326459">` |

1. ボタン（全ページ同じ1行）：
   `<a class="btn" href="/contact/#form" style="background:var(--ink);color:#fff">見学・利用を相談する</a>`
   - 同じタブで開く（会社HPの中なので）。「ご用件」は自動では選ばれない。フォームの設定（CF7 234）は変えない。
2. よくある質問「見学や体験はできますか？」の答え（1ファイルに2か所：上の方の検索エンジン向け情報と、ページ下のよくある質問）：
   - 現行：`でじるみ公式サイトの事業所ページからお問い合わせください。`
   - 案：`このページの「見学・利用を相談する」ボタンか、お電話でお問い合わせください。`
   - 前半の「無料見学・無料体験を随時受け付けています。」は変えない（でじるみ公式サイトの記載）。

## 見る指標

- D0＝公開を確かめた日。D+7・D+14。
- 会社HPの各事業所ページの `cta_click`（`cta_type=contact`、`link_path=/contact/`）。会社HPの `/contact/` は `tools/trio_ga4.py` の判定で contact に入る。
- 会社HPフォームの送信成功と、外部の実受付のうち「ご用件」が「就労継続支援B型（でじるみ）の見学・利用相談」の件数（Codex が照らした件数だけ）。
- 迷惑メール（11/16 未明の1通は、このご用件を選んだ迷惑メールの可能性が高い）は有効な問い合わせから外す。
- でじるみ事業トップ `/service/digilumi/` は説明文を評価中（D+7＝11/22）。今回は触らない。

## Codex へ

- 6ページを GET し、上の列が「見学・利用を相談する」「TEL」「地図アプリで開く」「でじるみ公式の事業所ページ」になったか、よくある質問の答えが変わったかを確かめ、D0 を台帳に書く。
- 生成元 `corp-site/gen_pages.py`：でじるみの `visit="/contact/#form"`、`visit_label="見学・利用を相談する"`（相対パスなので `target="_blank"` を付けない）。`DG` の `faq` の4つ目の答えを上の案に直す。次のテーマ版を作る前に。
- 次の段階の案（今回はしない）：CF7 の `default:get` で「ご用件」を URL から選んだ状態にする。フォームの設定を変えることになるので、所有者の確認が要る。
