# Trioland Social Publisher

トリオランド専用のInstagram公式API投稿Workerです。HOSHILUのコード、ドメイン、
データベース、KV、R2、Secret、デプロイ経路を使用しません。

## ワンクリック設置

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/t-ooku/trioland-social-publisher)

Cloudflareへの設置時に、KVとR2はこのWorker専用として自動作成されます。
HOSHILUのWorker、Route、KV、R2、D1、Secretには接続しません。

## 必要な専用リソース

- Worker: `trioland-social-publisher`
- KV: OAuth state / 暗号化済みInstagram token
- R2: `trioland-social-media`
- Secrets:
  - `ADMIN_TOKEN`
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `TOKEN_ENCRYPTION_KEY`（32 bytes, Base64）
  - `MEDIA_SIGNING_SECRET`
  - `GITHUB_CLIENT_ID`（MCP本人確認専用GitHub OAuth App）
  - `GITHUB_CLIENT_SECRET`（公開しない）
- Variables:
  - `META_API_VERSION`（初期値 `v24.0`。Metaアプリの表示値に合わせて更新）
  - `PUBLIC_BASE_URL`（このWorkerのHTTPS URL）
  - `ALLOWED_GITHUB_LOGIN`（初期値 `t-ooku`）

## 安全ルール

- `approved=true` がない素材はアップロード不可。
- R2オブジェクトにも `approved=true` のメタデータがないと公開不可。
- 投稿APIは専用管理トークン必須。
- Meta access tokenはAES-256-GCMで暗号化してKVへ保存。
- Metaへ渡す素材URLは短時間のみ有効な署名URL。
- `hoshilu.app` のRouteやDNSは設定しない。
- Remote MCPはOAuth 2.1で保護し、GitHubログイン名が
  `ALLOWED_GITHUB_LOGIN` と一致する本人だけを許可。
- MCPの投稿ツールも `approved=true` とR2の承認メタデータを二重確認。

## ChatGPT Web用Remote MCP

MCP URL:

```text
https://trioland-social-publisher.mygate-jp.workers.dev/mcp
```

提供ツール:

- `get_trioland_status`
- `get_instagram_account`
- `start_instagram_connection`
- `list_approved_media`
- `import_approved_media`
- `publish_approved_media`
- `refresh_instagram_token`

## ChatGPT Pro向け専用Web管理画面

ChatGPT ProではMCPの書き込み操作を使わず、次の専用画面から承認・投稿します。

```text
https://trioland-social-publisher.mygate-jp.workers.dev/admin
```

- GitHub OAuthで `t-ooku` 本人だけがログイン可能。
- 管理セッションは8時間で自動失効し、CookieはHttpOnly / Secure。
- すべての変更操作でCSRFを検証。
- 画像・動画のアップロード時に掲載許諾確認が必須。
- 公開時に掲載許諾と外部公開の最終確認が必須。
- R2の `approved=true` メタデータを投稿直前にも再確認。
- 投稿本文には次の5つを自動で固定付与。
  `#トリオランド #駒沢大学駅 #三軒茶屋駅 #保育士募集 #園児募集`
- `ADMIN_TOKEN`、Meta/GitHubシークレット、Instagramトークンはブラウザへ返さない。
- HOSHILUのリソース、ドメイン、データへ接続しない。

### GitHub OAuth App

GitHubの **Settings > Developer settings > OAuth Apps > New OAuth App** で、
この連携だけに使うアプリを作成します。

- Homepage URL:
  `https://trioland-social-publisher.mygate-jp.workers.dev`
- Authorization callback URL:
  `https://trioland-social-publisher.mygate-jp.workers.dev/github/callback`

発行されたClient IDとClient secretはCloudflare WorkerのSecretsへ直接設定し、
GitHub、チャット、ログへ保存しません。

### ChatGPTへの接続

GitHub OAuth AppとMeta Secretsの設定後、ChatGPT Webの開発者モードで
上記MCP URLを追加します。接続時はGitHubで `t-ooku` として本人確認し、
トリオランド専用ツールだけを許可します。

## APIの流れ

1. Metaアプリの有効なOAuthリダイレクトURIへ
   `https://<worker>.workers.dev/oauth/callback` を登録。
2. `POST /oauth/start` でInstagram認証URLを取得。
3. Instagramプロアカウントで認証し `/oauth/callback` へ戻る。
4. `POST /media` へ承認済み画像・動画をアップロード。
5. `POST /publish` で `IMAGE` または `REELS` を公開。
6. 定期的に `POST /token/refresh` で長期トークンを更新。

## 導入状況

- 2026-08-11: Cloudflare WorkerとGitHub Buildsの接続を完了。
- 完了: GitHub Builds、専用KV/R2、Worker公開、ヘルスチェック。
- コード追加済み: OAuth 2.1保護Remote MCP、GitHub本人確認、承認済み素材限定ツール。
- 未実施: GitHub OAuth App Secrets、MetaアプリSecrets、Instagram OAuth、
  ChatGPT WebへのMCP追加。
- 認証情報をGitHubやチャットへ保存しないでください。
