# Codex 向け作業指示書｜トリオランドHP

発行日：2026-09-14
発行元：Cowork（Codexクレジット切れ期間の代行担当）
対象：`t-ooku/trioland-social-publisher` / branch `main`
公開URL：https://trioland-social-publisher.mygate-jp.workers.dev/

前提資料：`docs/HANDOVER-2026-09-11.md`（調査記録）、`docs/SITE.md`（運用ルール）
**この指示書が最新です。前2つと矛盾する場合はこちらを優先してください。**

---

## 0. 最初に読む：やり直さなくていいこと

以下はCowork側で**調査・実装・本番確認まで完了**しています。再調査しないでください。

- 本番の broken-image の原因特定と修正（壊れたJPEG／座標定義の無いスプライト／base64ローダー）
- 全ページの再構築（`build_site.py` による生成方式）
- PC余白・スマホ見切れ・日本語行分割・タップ領域の修正
- 画像が縦に引き伸ばされるCSSバグの修正
- 駒沢大学園の公式Instagram由来の情報反映（365日開園／手ぶら登園ほか）
- 採用ページへの給与掲載（月給310,500円〜、出典・時期を明記）
- FAQ13問、JSON-LD、robots.txt、sitemap.xml
- 施設情報の出典確認（両園の住所・電話・定員・開園時間・アクセス）

**未完了は「写真」と「記事の内部リンク」だけです。** 以下の1〜3を順にお願いします。

---

## 1. 【P0】駒沢大学園の外観写真を入れる

### 1-1. 素材の場所

Google Drive フォルダ：`192JtA_y0Mb7uIxJa4tx67H_exlYPPnuu`
https://drive.google.com/drive/folders/192JtA_y0Mb7uIxJa4tx67H_exlYPPnuu

**2026-09-11 01:26 に4枚追加されています。**

| ファイル名 | Drive ファイルID | サイズ |
|---|---|---|
| `unnamed.jpg` | `1o0qt9RUzA7c5pn-8q0pynqN636EwgQeF` | 24,556 B |
| `unnamed (1).jpg` | `1QAyv9OYxb-HHqJk-njtfmqv5GR7ZKw9Z` | 16,881 B |
| `unnamed (2).jpg` | `1ybkz2vNM-JqaCREsUE-5EYj3iuOdkG7H` | 15,037 B |
| `unnamed (3).jpg` | `1S50v50qVZ-s_QlNDHWYf5SywoiuCwfSK` | 14,728 B |

### 1-2. 必ず先に確認すること

**⚠️ 4枚とも 14〜24KB しかありません。** EXIF は Picasa・2019年撮影。
**サムネイル画像の可能性が高く、そのままではHPに使えない恐れがあります。**

作業前に必ず：

1. 4枚を開いて**どれが駒沢大学園の外観か目視で特定**する
2. **実解像度（px）を確認**する

判定基準：

- **横1000px以上** → そのまま採用。1-3へ
- **横1000px未満** → **使わない**。オーナーに「文字の入っていない駒沢大学園の外観写真を、できるだけ大きいサイズで」と再依頼してください

低解像度のまま載せると、オーナーから既に2回指摘されている「画質が荒い」が再発します。**妥協しないでください。**

### 1-3. 採用する場合の反映手順

1. `site/assets/photos/komazawa-exterior.webp` として保存（quality 80, method 6、横1100px程度）
2. `git push`（Codexは直接pushできます。Coworkはできません）
3. `build_site.py` の駒沢大学園ページ（`page_nursery` を KOMA で呼ぶ箇所）に写真枠を追加
4. **トップページの梅ヶ丘園外観と併せて「2園の外観が並ぶ」構成**にすると効果的です

### 1-4. 絶対に使ってはいけない画像

`IMG_8477.jpg`（`1syUIqr8uIlZdwtoAaKCJaCUif1PHhszt`）は駒沢大学園の外観が写っていますが、
**求人テキスト（月給310,500円〜 等）と装飾が全面に焼き込まれています。** 復元不可。使用禁止。

---

## 2. 【P0】高解像度写真9枚を反映する

現在サイトで使っている写真は、**1600x900のスプライトから切り出した1カット400x300**の低解像度素材です。
Drive に**元の高解像度写真があり、書き出し設定まで決定済み**です。あとは反映するだけです。

### 2-1. 切り出し・書き出し表（実測値。座標を変えないこと）

| 出力名 | Drive ファイルID | 元サイズ | 切り出し box | 出力幅 |
|---|---|---|---|---|
| `umegaoka-exterior` | `1O87r8RVuc6U1ABvsWfAEkKuefs0HVuGM` | 1666x982 | なし | 1100 |
| `koma-nature-1` | `1CLcvw3TAr2ryaFbXB3pn4soCeNItew1R` | 1200x900 | `(0,0,1200,680)` | 880 |
| `koma-nature-2` | `1FtOwi0Giwjv396YaQz3QfqKSCkrr1Zja` | 1200x900 | `(0,0,1200,680)` | 880 |
| `koma-nature-3` | `1RdrQTvRupCEcvTOv7wfmNRxLHAUSuA7L` | 1200x900 | `(0,0,1200,655)` | 880 |
| `koma-room-1` | `1RmgrdK-YLCHcc-qJAsaKSgTWfkkuWQlD` | 1200x1200 | `(0,150,1200,950)` | 880 |
| `koma-room-2` | `1TaEWEmgsfj06Mb6QEOQdPvFCfSfaEoxg` | 1200x1200 | `(0,150,1200,950)` | 880 |
| `koma-room-3` | `1nuspJ-3WKh_jZP5A_g8Ez_3F-zCDgpqA` | 1200x1200 | `(0,150,1200,950)` | 880 |
| `koma-craft` | `1dlX2jVRZIBdznMhSsK37qOrJ1ZT0jBtS` | 1110x1474 | なし | 760 |
| `koma-water` | `1jiXg1imGUyH1LnCmcRpuXqiKcd9t3CQa` | 1170x2064 | `(0,0,1170,1700)` | 760 |

**切り出し座標は、行ごとの輝度分散を測って焼き込み字幕の帯の境界を特定した実測値です。**
素材はInstagram投稿用フレームで、下部（一部は上部にも）に字幕が入っています。座標を動かすと字幕が写り込みます。

書き出し：`.webp` / quality 80 / method 6 / 引き伸ばし禁止

### 2-2. すでに用意してあるもの

`.github/workflows/sync-site-images.yml`（**Sync site photos from Drive**）に上表が実装済みです。
Drive が「リンクを知っている全員」になっていれば、**手動実行するだけ**で完了します。

非公開のままだと Drive が HTMLログインページを返し、サイズ検証で止まります（壊れた画像はコミットされません）。
Codexから直接Driveを読めるなら、ワークフローを使わず手元で処理して `git push` でも構いません。

### 2-3. 反映後に必ずやること

`build_site.py` の img 参照を新ファイル名・新 width/height に差し替えてください。
**`width`/`height` 属性は実寸と一致させること。** 不一致だと写真が歪みます（過去に発生）。

現在の参照（差し替え対象）：

| 現在 | 差し替え先 |
|---|---|
| `exterior.jpg` 800x600 | `umegaoka-exterior.webp` 1100x648 |
| `life-room.jpg` 800x504 | `koma-room-1.webp` 880x587 |
| `life-play.jpg` 800x516 | `koma-room-2.webp` 880x587 |
| `life-nature.jpg` 800x444 | `koma-nature-3.webp` 880x480 |
| `life-table.jpg` 800x444 | `koma-nature-1.webp` 880x499 |
| `life-water.jpg` 672x900 | `koma-water.webp` 760x1104 |
| `life-summer.jpg` 800x600 | `koma-room-3.webp` 880x587 |
| `life-toys.jpg` 800x510 | `koma-craft.webp` 760x1009 |

差し替え後、`site/assets/photos/*.jpg`（旧低解像度）は削除してください。

---

## 3. 【P1】求人記事15本が内部リンクされていない

### 3-1. 状況

`site/recruit/` に**記事が30本**あります。sitemap には30本すべて入っています
（`recruit-sitemap.yml` が自動で補完してくれるため）。

**しかし `build_site.py` の `COLUMNS` には15本しか登録されていません。**
残り15本は `/column.html` にカードが出ず、**サイト内のどこからもリンクされていない孤立ページ**です。

sitemap に載っていてもリンクが無い記事は評価されにくいため、SEO上もったいない状態です。

### 3-2. COLUMNS に未登録の15本

```
babysitter-experience-hoiku-assistant.html
childcare-work-balance-nursery-job.html
early-career-hoikushi-komazawa.html
fulltime-hoiku-assistant-komazawa.html
hoikushi-application-motivation-guide.html
hoikushi-interview-reverse-questions.html
hoikushi-leave-benefits-checklist.html
hoikushi-vs-hoiku-assistant-job-choice.html
no-qualification-hoiku-assistant-komazawa.html
nursery-shift-hours-check-guide.html
nursery-tour-job-change-checklist.html
nutritionist-cook-nursery-career.html
part-time-hoiku-assistant-komazawa.html
part-time-nursery-cooking-staff.html
return-to-work-hoikushi-komazawa.html
```

### 3-3. やること

`build_site.py` の `COLUMNS` に上記15本を `("タイトル", "説明文", "/recruit/xxx.html")` の形で追加。
タイトルは各HTMLの `<title>` から取ってください。

**今後、記事を追加したら必ず `COLUMNS` にも追加してください。**
`recruit-sitemap.yml` は sitemap しか直しません。`/column.html` のカードは直しません。

---

## 4. 【P2】残りの確認事項

| 項目 | 状態 | やること |
|---|---|---|
| 管理画面 | `/admin` は robots.txt で Disallow、公開ページからリンクなし。`/health` で `adminConfigured:true` 確認済み | **ログイン動作の実機確認が未実施。** 実際にログインして、管理者以外から保護されているか確認 |
| 独自ドメイン | **未接続で確定**（`wrangler.jsonc` に `routes`/`custom_domain` 記述なし、`workers_dev:true` のみ） | 取得予定があるならDNS設定。無ければ現状維持でよい |
| 肖像権 | 写真に園児の顔が写っている | 掲載範囲の保護者同意をオーナーに確認。必要ならぼかし処理 |
| 梅ヶ丘園の写真 | **外観1枚しかない** | 梅ヶ丘園の園内写真をオーナーに依頼 |
| 梅ヶ丘園の費用 | 入園料・給食費が未確認（駒沢のみ確認済み） | 確認できたら `build_site.py` の `UME` に追加 |
| 給与の鮮度 | 月給310,500円〜は2026年7月のInstagram投稿由来 | 条件が変わっていないかオーナーに確認 |

---

## 5. 作業時の必読ルール

### 5-1. ページの直し方

**`build_site.py` を編集して `python3 build_site.py` を実行してください。**
`site/*.html` を直接編集しても、次のビルドで上書きされて消えます。

### 5-2. 画像の入れ方

**GitHubのコンテンツAPI（本文をテキストで渡す方式）でバイナリ画像をコミットしないでください。**
過去にこれで `umegaoka.jpg` などが**ちょうど15,000バイトで切り詰められた壊れたJPEG**になり、本番がbroken-imageになりました。

画像は `git push` か CI ワークフローで入れてください。

### 5-3. 写真の3原則

1. **表示サイズを実解像度より大きくしない**（`site.css` で表示枠を制限済み。広げないこと）
2. **同じ写真をサイト内で2回使わない**（1枚1箇所）
3. **どの園か確認できない写真を、特定の園のページに置かない**

### 5-4. 園の帰属（確認済み）

- **梅ヶ丘園で確定**：`梅ヶ丘園外観119380.jpg`（元データ1666x982で看板の「梅ヶ丘園」を判読）
- **駒沢大学園と判断**：園生活の写真はすべて Instagram `trioland.komazawa`（トリオランド駒沢大学園）の投稿素材
  → 判断材料は十分ですが、**オーナーに最終確認**を取ってください

### 5-5. ワークフロー一覧

| ファイル | name | 役割 | 起動条件 |
|---|---|---|---|
| `build-photos.yml` | Build site | HTMLと写真を生成してコミット | `build_site.py` / `tools/` / `photos-b64-v5/` への push |
| `site-smoke.yml` | Trioland site smoke | 本番疎通＋**全画像の完全デコード検査** | Build site 完了後 |
| `sync-site-images.yml` | Sync site photos from Drive | Driveから高解像度写真を生成 | 自身への push、手動 |
| `recruit-sitemap.yml` | Preserve recruitment SEO sitemap | sitemapに求人記事を補完 | `site/recruit/**` への push、Build site 完了後 |

**`site-smoke.yml` の画像デコード検査は切り詰めJPEG再発防止用です。消さないでください。**

### 5-6. デプロイ

main への push で Cloudflare Workers Builds が自動デプロイします（30〜60秒）。
`wrangler deploy` は不要です。

---

## 6. 完了判定

以下がすべて満たされたら完了としてください。**「たぶん直った」は不可。本番URLで確認すること。**

- [ ] 駒沢大学園ページに、文字の入っていない外観写真が表示されている
- [ ] その写真が横1000px以上（または、不足のためオーナーに再依頼済みと記録されている）
- [ ] 全8〜9枚が高解像度版に差し替わり、焼き込み字幕が写っていない
- [ ] 同じ写真が2箇所で使われていない
- [ ] `width`/`height` 属性が実寸と一致し、写真が歪んでいない
- [ ] `/column.html` に求人記事30本すべてのカードが出ている
- [ ] スマホ幅（390px）で横スクロールが発生しない
- [ ] PC（1440px）で写真がぼやけていない
- [ ] `site-smoke.yml` が成功している

報告は**「本番確認済み」「実装済み・本番未確認」「未実装」「不具合あり」「要確認」**を使い分けてください。

---

## 7. 掲載情報の出典

**確認できていない条件は推測で掲載しないでください。**

- トリオキャリア株式会社 公式：https://www.triocareer.jp/service/childcare/
- hoicil（駒沢）：https://www.hoicil.com/f/trmajx
- hoicil（梅ヶ丘）：https://www.hoicil.com/f/opgfqr
- 駒沢大学園 公式Instagram `trioland.komazawa`（特徴・給与の出典）

| 項目 | 駒沢大学園 | 梅ヶ丘園 |
|---|---|---|
| 住所 | 〒154-0003 世田谷区野沢2-33-5 グランドメゾン野沢103 | 〒154-0022 世田谷区梅丘1-21-9 ルミエール梅丘1階 |
| 電話 | 03-6450-7390 | 03-6413-1704 |
| 定員 | 19名（0歳9・1歳7・2歳3） | 20名 |
| 対象年齢 | 生後57日目〜2歳児クラス | 同左 |
| 開園時間 | 平日7:30〜20:30（18:30以降事前相談）／土日祝8:00〜17:00 | 平日7:30〜20:30／土日祝8:00〜17:00 |
| アクセス | 駒沢大学駅 徒歩6分・約550m／三軒茶屋 徒歩14分／西太子堂 徒歩16分 | 梅ヶ丘駅 徒歩1分・約90m／山下 徒歩11分／東松原 徒歩13分 |
| その他 | 敷地98.36㎡／入園料0円／給食費は会費込／365日開園／手ぶら登園／おむつ処理対応 | （費用は未確認） |

両園共通：自園調理・園庭あり・延長保育・一時保育・連絡アプリ・理学療法士による勉強会
