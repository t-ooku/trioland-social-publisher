# トリオランド公開サイト（site/）の仕組みと注意点

最終更新：2026-09-11

Cloudflare Workers が `site/` ディレクトリをそのまま静的アセットとして配信しています
（`wrangler.jsonc` の `assets.directory`）。main への push で Cloudflare が自動デプロイします。

公開URL: https://trioland-social-publisher.mygate-jp.workers.dev/

---

## 1. 絶対に守ること：バイナリ画像の入れ方

**GitHub のコンテンツ API（テキストとして本文を渡す方式）でバイナリ画像をコミットしないでください。**

2026-09-11 に調査したところ、`site/assets/` に置かれていた

- `umegaoka.jpg`（15,007 バイト）
- `child1.jpg`（15,009 バイト）
- `child2.jpg`（15,054 バイト）
- `photos-v4.webp.b64`（14,999 バイト）
- `photos-b64-v2/`（連結してもデコード不能）

が、いずれも**ちょうど 15,000 バイト前後で切り詰められた壊れたファイル**でした。
Pillow で開くと `broken data stream` / `image file is truncated` になります。
これが本番の broken-image の直接の原因です。

画像を入れる方法は次のどちらかだけです。

1. `.github/workflows/build-photos.yml`（= "Build site" ワークフロー）で生成させる
2. 通常の `git push`（ローカルから直接）

## 2. もう1つの原因：スプライトの座標定義が存在しなかった

旧実装は `.sprite-photo sp0` 〜 `sp11` というクラスで
1600x900 のスプライト画像から各コマを切り出す想定でしたが、
`site.css` に `.sp0`〜`.sp11` の `background-position` が**1つも定義されていません**でした。
そのため全ての写真枠が同じ位置（左上）を表示していました。

さらに `photo-policy-v2.js` が、リポジトリに存在しない `/assets/umegaoka-hq.jpg` を
HEAD リクエストで探し、無ければ壊れた `/assets/umegaoka.jpg` にフォールバックしていました。

これらは撤去済みです（`photo-loader.js` / `photo-policy-v2.js` / `photos-b64-v2/` / `.sprite-photo`）。

---

## 3. 現在の構成

```
build_site.py                    全ページのHTML / robots.txt / sitemap.xml を生成
tools/build_photos.py            site/assets/photos/*.jpg を生成
site/assets/photos-b64-v5/*.txt  写真の生成元（base64テキスト・唯一無事に残っていた実写素材）
site/assets/photos/*.jpg         生成された写真（CI がコミット）
site/assets/site.css             スタイル（手で編集する唯一のCSS）
site/*.html                      生成物。直接編集しないこと
site/recruit/*.html              旧来の求人SEO記事（インラインCSS・生成対象外）
```

ページを直すときは **`build_site.py` を編集**して `python3 build_site.py` を実行します。
`site/*.html` を直接編集しても、次のビルドで上書きされます。

### ワークフロー

| ファイル | 役割 | 起動条件 |
|---|---|---|
| `.github/workflows/build-photos.yml`（Build site） | HTMLと写真を生成してコミット | main への push（`build_site.py` / `tools/` / `photos-b64-v5/` 変更時）、手動 |
| `.github/workflows/site-smoke.yml` | 本番の疎通・画像デコード検査 | Build site の完了後、手動 |
| `.github/workflows/sync-site-images.yml` | Google Drive から高解像度の元写真を取り込む | そのワークフローファイルを更新した push、手動 |

`site-smoke.yml` は全ページの 200 応答に加えて、
**全画像を Pillow で最後までデコードできるか**を検査します。
これは切り詰め JPEG の再発を止めるためのものです。消さないでください。

---

## 4. 写真の運用ルール

### 4-1. 画質：表示サイズを実解像度より大きくしない

スプライト由来の素材の実解像度は **1カットあたり 400x300px** しかありません
（SNS 動画のフレームを 4列×3行 に並べた 1600x900 のスプライトが元）。

そのため：

- 書き出しは**実解像度の2倍（800px幅）まで**。縦長カットのみ3倍
- 表示枠は `site.css` で **400px前後に制限**（`.hero-media figure`, `.gallery`, `.split img`）
- **画面いっぱいの巨大なヒーロー写真は使わない**

大きく綺麗なメインビジュアルが必要な場合は、**元の高解像度写真を用意する**しかありません。
用意できたら `sync-site-images.yml` を実行するか、`site/assets/photos/` に直接 push します。

### 4-2. 同じ写真をサイト内で2回使わない

1枚につき1箇所だけ。

### 4-3. どの園か確認できない写真を、特定の園のページに置かない

スプライト由来の `exterior.jpg` の看板は「トリオランド」までは読めますが、
**その隣の園名は解像度不足で判読できません**。
どちらの園か断定できないものを、園ページに置かないでください。

### 4-4. 焼き込みテロップ

スプライト素材は SNS 動画のフレームなので、下部に字幕が焼き込まれているコマがあります。
`tools/build_photos.py` の `PLAN` で該当コマの下端をトリミングして除去しています。

### 4-5. 胖像権（要確認）

写真には園児の顔が写っています。掲載範囲について保護者同意が取れているか、
運営側で確認してください。必要ならぼかし処理を入れます。

---

## 5. 掲載情報の出典

サイトに載せている施設情報は、公式サイトおよび施設情報サイトで確認できた内容のみです。
**確認できていない給与・待遇・費用は掲載していません。**

- トリオキャリア株式会社 公式：https://www.triocareer.jp/service/childcare/
- 駒沢大学園：定員19名（0歲9名/1歳7名/2歳3名）、敷地面積98.36㎡、入園料0円、給食費は会費に含む、TEL 03-6450-7390
- 梅ヶ丘園：定員20名、TEL 03-6413-1704
- 両園とも 生後57日目〜2歳児クラス／平日 7:30〜20:30／土日祝 8:00〜17:00／自園調理・園庭あり・延長保育・一時保育・連絡アプリ

新しい情報を載せるときは、必ず出典を確認してからにしてください。
