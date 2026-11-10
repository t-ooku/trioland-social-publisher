# Codex指示書：KPI管理LPへのGitHubログインが404（2026-11-11）

## 目的と優先度
**P0・ログイン障害修正**。ユーザーがiPhoneのChatGPT内ブラウザから `https://trioland-social-publisher.mygate-jp.workers.dev/admin/kpi` を開き、GitHubログインを選んだところ、**github.com上の404「Didn't find anything here!」**となった。GitHub OAuthが正常に開始できない可能性がある。管理KPIを閲覧できる状態まで復旧すること。原因は未確定。URLを推測せず、実リダイレクトと実設定を照合する。

## 確認した実装（mainの現行コード）
- `src/worker.js`：`/admin/kpi`, `/admin/kpi/data` を既存の `__Host-TRIOLAND_ADMIN_SESSION` で保護。未認証は `/admin/access` に転送。GitHub `main/dashboard/index.html` と `latest.json` を取得して管理画面に返す。
- `src/index.js`：`GET /admin/access` に管理コード用ログイン画面があり、予備リンク `/admin/login` から `startAdminLogin(env)` を呼ぶ。認可先は `https://github.com/login/oauth/authorize`、`client_id=env.GITHUB_CLIENT_ID`、`redirect_uri=${publicOrigin(env)}/github/callback`、state付き。MCP OAuthも同じGitHubクライアントを利用しているため、MCPへの影響に注意。
- 既存の管理コード `ADMIN_TOKEN` / `/admin/access` は予備の復旧経路。GitHub認証が壊れても、これを勝手に無効化しない。
- 配置先はトリオランド専用Worker。HOSHILU等の別事業やSNS投稿・問い合わせ処理を触らない。

## 実行手順
1. 最初に `AGENTS.md`、最新`main`、`src/worker.js`, `src/index.js`、`dashboard/`、`wrangler.jsonc`、既存Actions/デプロイ履歴を確認。ほかの担当による同一箇所の編集・作業中のものがないか確認。
2. 公開GET/HEAD（**ログインや管理コードの値は記録しない**）で `/admin/kpi → /admin/access → /admin/login` のHTTP、Location、発行されるGitHub認可URLのホスト・パス・OAuth client_idの設定有無・redirect_uri・stateを安全に検査。client_secret、トークン、Cookie、stateの生値はログ・Issueに書かない。特にGitHub 404が認可開始前か開始後かを切り分ける。
3. `GITHUB_CLIENT_ID` が現在有効なGitHub OAuth Appのclient IDか、OAuth AppのCallback URLが `/github/callback` と一致するか、本番Worker Secret `GITHUB_CLIENT_SECRET` が現在のアプリと対応するかを既存の**正規権限/設定画面**で検証。原因候補：削除・誤ったクライアントID、リダイレクト不一致、OAuth Appの種類・設定、ログインURLの誤生成。**現時点で断定しない**。値そのものを公開しない。
4. 原因に応じて必要最小限のコード/設定のみ変更。OAuth App新設、Secret再発行、権限拡大は勝手に実施しない。本人しか操作できない場合はGitHub設定の具体的画面と最少手順だけを明示。
5. ログイン後は`/admin/kpi`へ戻り、SNS管理画面`/admin`で迷子にならないよう、安全なreturn pathの実装を検討（同一Originの固定パスのみ許可、open redirect禁止）。既存の一般管理画面ログインとMCP OAuthのフローを破壊しない。
6. **セキュリティ**：認証前のKPIデータの露出、無認証アクセス、Cookie/CSRF/OAuth stateの弱体化禁止。個人情報/認証情報をGitHubやGA4、HTMLのsourceに書かない。公開GitHubのJSONには匿名集計値だけを残す。
7. テスト：モックで有効/無効のstate、失効、誤ユーザー、認証後元画面復帰、管理コードログイン、未認証での`/admin/kpi/data`遮断。実機iPhone/Safari・ChatGPT内ブラウザ（可能な範囲）で認可開始を確認。**本番ログイン成功**は実セッションで確認できた場合のみ明記。
8. main反映→CI→デプロイ→本番HTTP・ページ表示・ログイン後データ表示を区別して検証。DNS等で未確認なら原因と別経路を残す。

## 完了報告の形式
- 404の確定原因／仮説と裏付け
- 変更ファイルとコミットURL、CI、Workerデプロイ結果
- `/admin/kpi`・GitHub認証・管理コード代替・KPI表示、それぞれの本番確認状態
- ユーザーが押すべき**正しいログインURL**。管理コードなどの秘密情報は載せない
- 未完了が残る場合は必要最小限の本人操作、対象URLと理由

## 完了条件
**ユーザーが管理コードまたはGitHub認証でKPI/PDCAの管理画面を閲覧できること。** 実ブラウザで未検証なら「完了」と書かない。Codex側で作業から報告まで進め、ユーザーに長い指示の転送作業を求めない。
