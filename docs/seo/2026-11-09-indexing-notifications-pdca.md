# 2026-11-09 Search Console通知PDCA

## 対象と境界
- ユーザー添付通知：hoiku.triocareer.jp の「ページにリダイレクトがあります」「代替ページ（適切なcanonicalタグあり）」、hoshilu.app の「robots.txtによりブロック」。
- 画像に個別URL/件数なし。Gmail検索で通知本文未取得。WindsorはSearch Analytics/Sitemaps対応でPage Indexingの例URL・URL Inspectionは非対応。ブラウザはSearch Console紹介画面に転送され、管理レポート未取得。通知の対象と本監査で再現したURLの完全一致は未確認。
- フォーム実送信、D1書込、認証/権限変更、SNS/営業送信なし。

## Plan / baseline
- 2026-11-09 公開GET、hoikuのrobots/sitemap各200。robotsは /admin・/api/ のみDisallow、全体遮断なし。
- サイトマップ135 URL/重複0を全件GET。全件最終200、うち133件で .html→拡張子なしへ1回転送され、canonicalが転送前の.htmlを指す不整合。root / と /recruit/ は一致。
- 例：/komazawa.html→/komazawa、canonical=/komazawa.html。/recruit/nursery-shift-hours-check-guide.htmlも同様。
- WindsorのSearch Console sitemap結果：hoiku sitemap提出135、最終取得2026-11-06T04:05:58.207Z、errors0/warnings0。これをページのindex済み数と呼ばない。
- GSC確定のみ(include_fresh_data既定false) 11/1〜6 PT：hoiku 359表示24クリック（CTR6.69%）、HOSHILU 90表示3クリック（CTR3.33%）。6日基準であり7日窓/月間完全値ではない。UI通知の検出日・未登録数は未取得。

## Do
- tools/normalize_public_urls.py：hoikuホストのcanonical/og:urlとsitemap locをCloudflare Pagesの転送後URLへ統一。物理HTML名、内部/formリンク、API、他ホスト、本文、待遇、写真は変更しない。サイトマップ重複排除、掲載URLと実ファイル/正規URL/noindex整合検証。
- Build siteとPreserve recruitment SEO discoveryの両経路で実行し、上書き再発を防止。求人sitemap追記は正規化後のURLで存在判定。
- 既存site-smokeへ本番sitemap+主要5ページの200/転送なし/self-canonical/noindexなしを追加。新規定期タスクなし。
- 回帰テスト8件PASS。現行136生成ファイルに対し134ファイル更新、135掲載URLの検証エラー0。二回目変更0（冪等性）。本書作成時点では配備検証待ち。

## HOSHILU
- 本番robots200でAllow:/。意図的除外は /api/、/go、/line/、/shop/*?。ソースと一致。/goは10/31のクローラ送客過多、/line/は11/8の副作用ある入口、shop絞込は無限URL対策。個別例なしに解除しない。
- /healthは今回GETでok=true/missing0/weak0、X/Instagram connected=true、Runway ready=true、database_features全true。本週Seller QA job DONE。既存#369/#691は新規検索障害としない。
- 本日既存selfcheckの動的genre sitemap/noindex不整合は別件。既存日次改善責任者と競合して同時修正しない。今回の通知がこの別件によると断定しない。

## Check / Act
- 本番の新sitemap・canonicalをGETで確認した日をD0にする。CI成功だけで本番確認としない。
- D+7/D+14/D+28で同定義の検索表示/クリック・Search Console対象URL状態を追跡。効果未判定を維持。旧.htmlの転送自体は残す（正常なURL正規化）；通知ゼロを成果目標にしない。
- 通知の「代替ページ」の個別URL・Google-selected canonicalとHOSHILU robots除外の例URLは未取得。ユーザーからレポートの例URL/CSVが届けば意図を照合し、公開主要ページの誤除外のみ追加対応。
- 継続担当：Codex、既存「トリオキャリアHP・問い合わせ改善日報」およびHOSHILU既存改善/点検。保育とHOSHILUのKPIを混ぜず、重複タスクなし。


## 本番確認追記 — 2026-11-09 17:23 JST
- 実装commit: 29fe2590f825a975448136779cf374183b140019。
- Build site [42584943857](https://github.com/t-ooku/trioland-social-publisher/actions/runs/42584943857) success、生成commit 0c1934553267dcf0cb0a4e0b37de987d4ef19838。求人追記run42584991890 success、生成commit e7a342e5355a87ef82d6e589953897ba6c1d49a8。最終ソースsitemap135 URL/.html0。
- 新監視の初回run42584943844と続く42584991968は追加したurllib GETが403で失敗。既存curlチェック・手元curl GETは成功しており、サイト停止と解釈しない。監視を既存と同じcurlに統一（d07a4689a128d9b4a16a66db2f97d59df16fad51）、UA偽装/WAF変更/権限変更なし、401/403は再試行せず止まる。
- 修正後 [site-smoke 42585308376](https://github.com/t-ooku/trioland-social-publisher/actions/runs/42585308376)、job129054161222 **全ステップsuccess**。新規canonical検査、従来の画像decode・問い合わせAPIのGET405・採用導線・GA4タグ・放デイCTAもsuccess。フォーム送信/メール受信は本件でテストしていない。
- 独立した本番GET再監査は2026-11-09 17:20:23〜17:23:06 JST。現在の公開sitemap135 URLを全件GET、**全135でHTTP200・転送0・self-canonical一致・noindexなし・robots遮断なし**。標準sitemap重複0。改修前の133不整合→観測母集団内0。本番確認日D0=2026-11-09。
- D+7=11/16、D+14=11/23、D+28=12/7。既存の日報自動タスクへ追跡を実際に追記（スケジュール/有効状態変更なし）。Google登録状態・通知の個別対象URL・効果は未確認。旧.htmlは正規URLへ転送を維持するため、Googleレポートから旧URLのリダイレクト分類が消えることは完了条件ではない。
- HOSHILUの標準158+商品先頭12+genre先頭12=182 GETでrobots遮断0・HTTP200・self-canonical一致。genre12中8のnoindex不整合を再現（robots通知と別件）。詳細はP-GATE docs/handoff/2026-11-09-codex-indexing-notification-pdca.md（bccf1e745925979ef556bec714c323cf85d2485f）。既存日次改善タスクのpromptへ追跡を実際に追記済み。HOSHILUコード/robotsの変更・Google登録完了はしていない。
