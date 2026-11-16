# 会社HPの施設ページ：相談ボタン（2026-11-16、`2026-11-16-cowork-ack.md` の続き）

## 駒沢大学園ページ：公開確認済み

- 所有者が 2026-11-16 11:59 JST に、テーマファイルエディターで `pages/f-komazawa.php` の22行目に1行を貼り、「ファイルの編集に成功しました」を確認（所有者の報告と編集画面のスクショ）。
- Cowork が 12:00 JST ごろ公開ページを読むだけで開いて確認：園名の下のボタンが「見学・入園を相談する」（`https://hoiku.triocareer.jp/contact.html?destination=komazawa#form`）・「TEL」・「地図アプリで開く」の3つ。PHP のエラー表示なし。押したあとのフォームの動きは確かめていない（送信なし）。
- **D0＝2026-11-16**（Codex の GET で確定してください）。D+7＝11/23、D+14＝11/30。指標と分け方は `2026-11-16-cowork-ack.md` の「Codex へのお願い」3・4。

## ほかの施設へ広げる（所有者の指示「他の店舗も貼ろう」、11:59 JST）

朝の記録では「今日は1ページだけ。広げるかは結果を見てから」と書いたが、所有者の判断で同じ日に広げる。仮説は同じ（施設ページに相談へ進むボタンが無い）。

**状態：次の3ページの手順を渡した。貼ったか・公開されたかは未確認。**

| ページ | テーマのファイル | 貼る場所（この直前） | ボタンの言葉 | 行き先 |
|---|---|---|---|---|
| 梅ヶ丘園 `/service/childcare/trioland-umegaoka/` | `pages/f-umegaoka.php` | `<a class="btn" href="tel:0364131704">` | 見学・入園を相談する | `https://hoiku.triocareer.jp/contact.html?destination=umegaoka#form` |
| ロップ `/service/after-school/lopp/` | `pages/f-lopp.php` | `<a class="btn" href="tel:0369047469">` | 見学・利用を相談する | `https://afterschool.triocareer.jp/contact.html?facility=lopp#form` |
| コンパスマイル `/service/after-school/compasmile/` | `pages/f-compass.php` | `<a class="btn" href="tel:0335656929">` | 見学・利用を相談する | `https://afterschool.triocareer.jp/contact.html?facility=compass#form` |

- 貼る1行の形は駒沢と同じ（`<a class="btn" href="（行き先）" target="_blank" rel="noopener" style="background:var(--ink);color:#fff">（言葉）</a>`）。
- 行き先はどれも、保育・放課後デイのサイトがすでに使っているもの（保育 `build_site.py` の `inquiry_form` は `destination=umegaoka` を受け取る。放課後デイ `afterschool/build_site.py` は `?facility=lopp`・`?facility=compass` で施設を初期選択し、`#form` 付きのリンクを自分のページでも使っている）。
- ボタンの言葉は、行き先のページの題（保育「見学・入園相談」、放課後デイ「見学・利用のご相談」）に合わせた。料金・空き状況などは入れていない。

**でじるみの6事業所ページは、今日は貼らない。** ページのよくある質問は「でじるみ公式サイトの事業所ページからお問い合わせください」と案内している。会社HPのフォーム（ご用件に就労の選択肢あり）へ送るなら、この案内文と受け先の決め直しが要る。所有者に受け先をたずねている。

## Codex へのお願い

1. 3ページを GET し、ボタンがあれば、その日をページごとの D0 として台帳に書く。無ければ「未公開」。
2. 生成元（`corp-site/gen_pages.py`）：朝の案の `visit=` に加えて、言葉が施設で違うので `visit_label=` も持たせる（保育は「見学・入園を相談する」、放課後デイは「見学・利用を相談する」）。貼られた施設だけに付ける。次のテーマ版を作る前に。
3. 評価中の施策に混ざる点：
   - 梅ヶ丘園：保育のフォームの開始・送信成功（`facility=umegaoka`）に混ざる。駒沢と同じ扱い。
   - ロップ・コンパスマイル：放課後デイ AS-03（D+14＝11/23）と AS-01 の、フォーム開始・送信成功に混ざる。
   - 分け方は駒沢と同じ：会社HPの各ページで起きた `cta_click`（`link_domain` が保育・放課後デイのホスト、`link_path` が `/contact.html`）の回数が「会社HPから入った人の上限」。11/19・11/23・11/26 の判定では、この回数を並べて書く。分けられなければ「会社HPからの流入が混ざった」と書き、効果未判定にする。
