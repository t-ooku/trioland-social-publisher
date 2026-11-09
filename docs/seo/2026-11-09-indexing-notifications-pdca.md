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
