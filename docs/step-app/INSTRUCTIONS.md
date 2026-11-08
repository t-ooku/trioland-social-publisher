# 指示書：中途採用者のステップアップアプリ（Claude Code 向け）

作成 2026-11-06（2026-11-08 更新）。リポジトリ `t-ooku/trioland-social-publisher`（**公開リポジトリ**）。
最初に `AGENTS.md`・`docs/HANDOVER-2026-09-18.md`・`src/index.js` の管理画面まわり（`handleAdminRequest`・管理コードログイン・CSRF）を読むこと。

---

## 0. 目的（これだけは外さない）

中途採用の保育士が、入社3ヶ月以内にほとんど辞めている。
入社日から **1週間 → 10日 → 30日 → 45日 → 60日 → 3ヶ月（クラス副担任）→ 6ヶ月（クラス担任）** の7段階に業務を細かく分ける。
できた業務に ✓ を入れていく、デュオリンゴのような「道」の画面にする。

- 学ぶ側（新人）と教える側（指導役）が、**同じ画面で「いまどこ・次は何・最後はクラス担任」**を見られる。
- スマホで使う。**紙に印刷**して、手で ✓ を入れても使える。
- 園長・本部は「誰がどの段階で止まっているか」「どこで辞めているか」を一覧で見る。

---

## 1. 置き場所（DNS 変更なし＝加藤様への依頼は不要）

- 既存の Worker `trioland-social-publisher`（`https://trioland-social-publisher.mygate-jp.workers.dev`）に `/step/` として追加する。
- **新しいサブドメインは作らない。** `triocareer.jp` の DNS は Xserver（加藤様の管理）にあるので、サブドメインを作ると CNAME の依頼と費用が要る。
- 保育園サイト（`hoiku.triocareer.jp`・Pages）には載せない。公開サイトに職員用の画面を混ぜないため。
- データは **Cloudflare D1**（新規 `trio_step`）。`wrangler.jsonc` に `d1_databases` のバインディング `STEP_DB` を追加する。
  - D1 の作成は `wrangler d1 create trio_step`。database_id は wrangler.jsonc に書いてよい（秘密ではない）。

---

## 2. 守ること

1. **個人情報をリポジトリに入れない。** 職員の名前・入社日・メモは D1 にだけ入れる。テストデータは架空の名前（例：「テスト 花子」）にする。
2. **GA4 タグを入れない。** `tools/trio_ga4.py` の仕組みは使わない。外部の解析・広告タグは一切なし。
3. 全ページに `<meta name="robots" content="noindex,nofollow">` と `X-Robots-Tag: noindex` を付ける。
4. 子どもの情報は入れさせない。自由記入欄の上に「お子さまの名前・病名は書かない」と常に表示する。記入は 200 字までにする。
5. 認証情報（管理コード・トークン）をコード・ログ・URL のクエリに残さない。リンクのトークンは **D1 には SHA-256 のハッシュだけ**保存する。
6. HOSHILU・黒谷の仕組みには触れない。既存の Instagram 投稿・問い合わせ API・求人管理を壊さない（`npm test` を通す）。
7. 本番へのデプロイは、所有者が画面を確認してから。

---

## 3. 使う人とログイン

| 人 | 入り方 | できること |
|---|---|---|
| 本部（所有者） | 既存の管理ログイン（管理コード／GitHub）→ `/admin/step` | 新人の登録・指導役の割当て・リンク発行／失効・退職の記録・チェック項目の編集・全園の一覧 |
| 園長・園長代理 | **園ごとの園長リンク** `/step/n/<token>` | その園の新人の一覧・進み具合・遅れ・面談記録を見る。指導役としての確認と、チェック項目の編集もできる |
| 指導役 | **新人ごとの指導役リンク** `/step/m/<token>` | その新人の項目に「確認」を入れる・面談記録・ひとことコメント |
| 新人 | **新人ごとの本人リンク** `/step/s/<token>` | 自分の道を見る・「できた」を入れる・週1回の気分チェック |

- リンクはログインなしで開ける（職員は Claude や GitHub のアカウントを持っていない）。トークンは 32 バイトのランダム値（base64url）にする。
- 本部はリンクを再発行できる（古いリンクはすぐ無効）。退職・完了した人のリンクは自動で無効にする。
- 管理画面にリンクの **QR コード**を出す（印刷して手渡しできるように）。QR はサーバー側で SVG を生成し、外部サービスは使わない。
- 書き込み系の API は、トークンを `Authorization` ヘッダーで送る（URL のパスからページが読み取って付ける）。トークンごとにレート制限をかける（例：1分 60 回）。

---

## 4. 画面

### 4-1. 新人・指導役の画面「ステップの道」（スマホ優先・幅 390px で崩れない）

上から順に並べる。

1. **いまの位置**：「入社 23 日目」「いまの段階：30日（時間帯をまかされる）」「指導役：○○さん」。
2. **次にやること**：未完了の項目を3つだけ出す。
3. **道（縦のルート）**：7つの段階を丸いノードで縦に並べる。
   - 状態は4つ：達成（緑・✓）／いま（大きく・脈打つ輪。ただし `prefers-reduced-motion` では止める）／遅れ（目標日を過ぎて未達成。オレンジ。責める言葉は使わない）／これから（灰色）。
   - 各ノードに、目標日（入社日＋日数）と達成数「5/7」を出す。
   - いちばん下に最終目標「クラス担任」を旗で表示する。
4. **段階を開くと項目の一覧**：各項目に「できるようになること」と、開閉できる「覚えるポイント」。2つのボタン。
   - 「できた」＝本人が入れる → 「確認」＝指導役が入れる。**指導役の確認で ✓ 完了**とする。
   - 本人が先に入れていない項目も、指導役は確認できる。
   - 押した日時を小さく表示する。取り消しもできる（取り消しの記録は残す）。
5. **振り返り面談**：段階ごとに「面談した日」「本人のひとこと」「指導役のひとこと」。全項目を確認して面談も済むと、その段階が「達成」になる。紙吹雪のような小さな演出を1回出す（動きを減らす設定では出さない）。
6. **週1回の気分チェック**（本人だけ）：「順調／ちょっと大変／つらい」の3択。「つらい」が2週続いたら、指導役と園長の画面に印を出す（辞める前に気づくため）。

### 4-2. 園長の画面

- その園の新人の一覧：名前・入社日数・いまの段階・進み具合のバー・遅れの印・気分の印。
- 遅れ・「つらい」・面談未実施の人を一覧の上に出す。

### 4-3. 本部の管理画面 `/admin/step`

- 新人の登録：表示名（名字だけでよい）・園（駒沢大学園／梅ヶ丘園）・入社日・指導役の名前・雇用形態（常勤／パート）。
- リンクの発行・再発行・QR 表示。
- 退職の記録：退職日・その時点の段階。**「どの段階で辞めたか」の集計**（例：30日までに何人、3ヶ月までに何人）と、30日・90日・180日の定着率を出す。
- チェック項目の編集（6-1）。

### 4-4. 印刷（紙で使う）

- 新人の画面と管理画面に「印刷用」ボタンを置き、印刷用ページを別タブで開く。中身は A4 縦・1人分で、7段階すべての項目に □ を付ける。
  - 済んだ項目は ☑ と日付で出す。各段階の下に「本人サイン・指導役サイン・面談日」の欄を付ける。
- 空欄の型紙（名前なし）も印刷できるようにする。
- 印刷用 CSS（`@media print`）で、ボタン・色の背景を消し、段階の途中で改ページしない（`break-inside: avoid`）。

---

## 5. データ（D1）

```sql
CREATE TABLE learners (
  id TEXT PRIMARY KEY,            -- ランダム ID
  nursery TEXT NOT NULL,          -- 'komazawa' | 'umegaoka'
  display_name TEXT NOT NULL,
  employment TEXT NOT NULL,       -- 'fulltime' | 'parttime'
  start_date TEXT NOT NULL,       -- YYYY-MM-DD（日本時間）
  mentor_name TEXT,
  checklist_version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- active | completed | left
  left_date TEXT, left_stage TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE tokens (
  token_hash TEXT PRIMARY KEY,    -- SHA-256(hex)
  kind TEXT NOT NULL,             -- 'self' | 'mentor' | 'nursery'
  learner_id TEXT, nursery TEXT,
  revoked_at TEXT, created_at TEXT NOT NULL
);
CREATE TABLE checks (
  learner_id TEXT NOT NULL, item_id TEXT NOT NULL,
  self_at TEXT, mentor_at TEXT,
  PRIMARY KEY (learner_id, item_id)
);
CREATE TABLE check_log (          -- 取り消しを含む履歴
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id TEXT, item_id TEXT, actor TEXT, action TEXT, at TEXT
);
CREATE TABLE reviews (
  learner_id TEXT NOT NULL, stage_id TEXT NOT NULL,
  met_on TEXT, self_note TEXT, mentor_note TEXT,
  PRIMARY KEY (learner_id, stage_id)
);
CREATE TABLE moods (
  learner_id TEXT NOT NULL, week TEXT NOT NULL,   -- その週の月曜日
  level INTEGER NOT NULL,                         -- 1 順調 / 2 ちょっと大変 / 3 つらい
  PRIMARY KEY (learner_id, week)
);
CREATE TABLE checklists (version INTEGER PRIMARY KEY, json TEXT NOT NULL, created_at TEXT NOT NULL);
```

- マイグレーションは `migrations/` に置き、`wrangler d1 migrations apply` で入れる。
- チェック項目の初期値は `content/step_checklist.json`（6章。個人情報なし）。D1 が空のとき、これを版 1 として入れる。
- 新人ごとに登録時の版を固定する（`learners.checklist_version`）。途中で項目が消えても、その人の表は変わらない。新しい版に切り替えるかは本部が選ぶ。
- 日付は日本時間で計算する。入社日を1日目として数え、目標日＝入社日＋（日数−1）日とする（例：11月1日入社なら「1週間」の目標日は11月7日）。

---

## 6. チェック項目（2026-11-08 更新：調査済みの50項目）

- 中身は `content/step_checklist.json`（7段階・50項目、各項目に「覚えるポイント」つき）。これを版 1 の初期値にする。
- 根拠：東京都「保育施設における睡眠中の事故防止」（0歳5分・1〜2歳10分ごとの確認など）、都の事故防止の事務連絡（誤嚥しやすい食材）、都の指導検査の指摘事項（配置・指導計画・玩具・不適切保育）。
- 試作版（Claude 上のページ・所有者のみ閲覧可）：「保育ステップアップ表」。道の画面・2つのボタン・ドラッグ編集・A4印刷の動きはこれに合わせる。見られない場合は本指示書の記述を正とする。

### 6-1. 園長による項目の編集（必須）

- 管理画面と園長リンクに「項目の編集」画面を置く。
- 各項目の左のつまみ（☰）を**ドラッグして並べ替え**、**別の段階へ移動**できる（スマホのタッチでも動くこと）。SortableJS を使う場合は CDN ではなく、ファイルとして同梱する（ライセンス表記を残す）。
- 文言・覚えるポイント・段階の名前・目標日数を直せる。項目の追加・削除、「初期の内容に戻す」ができる。
- 保存すると版が上がる。チェック済みの記録は項目 ID にひもづけるので、並べ替えても消えない。保存していない変更があるときは画面を離れる前に知らせる。

---

## 7. 作り方の目安

- 画面は素の HTML・CSS・JS で作る。Worker から返し、外部の CDN は使わない（フォントも端末のものでよい）。CSP は既存の `securityHeaders` に合わせる。
- 新しいファイルは `src/step.js`（ルーティング・API）、`src/step_pages.js`（HTML）、`migrations/0001_step.sql` にする。`src/index.js` には `/step/` と `/admin/step` の振り分けだけ足す。
- API（すべて JSON・トークン必須）：
  - `GET /step/api/me` ：自分の画面の全データ
  - `POST /step/api/check` ：`{item_id, action: self|mentor|undo_self|undo_mentor}`
  - `POST /step/api/review` ：面談記録
  - `POST /step/api/mood` ：気分チェック
  - `GET /step/api/nursery` ：園長の一覧
  - `PUT /step/api/checklist` ：項目の保存（園長リンク・本部だけ）

---

## 8. 確認（完了の条件）

1. `npm test` が通る（既存機能が壊れていない）。
2. 段階の計算の単体テスト：入社日・今日の日付・チェックの状態から「いまの段階」「遅れ」「達成」が正しく出る（月末・うるう年・入社当日を含む）。
3. 権限のテスト：本人リンクで「確認」が押せない・項目を編集できない・他人のデータが読めない・失効したリンクは 404・園長リンクで他の園が見えない。
4. Playwright（幅 390px と A4 印刷の PDF）でスクリーンショットを撮り、崩れ・はみ出しがないこと。ドラッグでの並べ替えと段階の移動が保存後も残ること。
5. `noindex` が全ページに付いていること。GA4 や外部への通信が無いこと（ブラウザのネットワーク記録で確認）。
6. ローカル（`wrangler dev` ＋ ローカル D1）で、架空の新人1人を登録して、本人・指導役・園長の3つのリンクで一通り動かす。
7. 作業記録を `docs/HANDOVER-2026-09-18.md` に追記し、Issue #15 にコメントする（状態は「実装済み・本番未確認」などの言葉で）。

## 9. 所有者がすること

- Cloudflare で D1 を作る許可（またはこちらで作成）と、本番デプロイの承認。
- チェック項目のたたき台を、園長代理・主任と見直す。
- 新人・指導役へのリンク（QR）の手渡し。
