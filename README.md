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

## Make / Googleビジネスプロフィール診断

GitHub認証済みの管理者だけが、次の画面でMakeシナリオを診断できます。

```text
https://trioland-social-publisher.mygate-jp.workers.dev/admin/make
```

対象はMakeの `us2` ゾーン、シナリオ `5623382` にコード側で固定しています。

### Make APIトークン

[Make公式のAPIトークン作成手順](https://developers.make.com/api-documentation/authentication/create-authentication-token)
に従ってトークンを作成し、次のscopeだけを付けます。

- `scenarios:read`（シナリオ、Blueprint構造、直近ログの診断）

トークンは管理画面のpassword入力から送信され、既存の
`TOKEN_ENCRYPTION_KEY` でAES-256-GCM暗号化して `AUTH_KV` に保存されます。
保存後に値をブラウザへ表示せず、アプリケーションログにも出力しません。

### 読み取り専用診断

- 「診断だけ実行」は固定シナリオの概要、ライブ/下書きBlueprint、直近ログを
  Make公式APIからGETするだけです。
- Blueprintのmapper / parameters / value / connection設定は保存・表示しません。
  モジュールID・アプリ種別・フィルター有無など、明示した安全な項目だけを抽出します。
- ログはログID、時刻、status、処理時間、operation数などだけを抽出し、
  outputs、bundle、本文、個人情報を保存・表示しません。
- 抽出済み診断は7日間だけKVへ保存します。
- endpointは `us2` のシナリオ `5623382` に対するGET 4種だけをコードで許可します。
- PATCH / run / replay / DLQ retryは実装していません。診断結果から原因を特定した後、
  Google側の投稿重複をサーバー側で照合できる専用修正をコードレビューして追加します。
- したがって、この画面の診断だけで「改善・未投稿の投稿完了」とは表示しません。

### 別端末へ安全にログインを引き継ぐ

通常ブラウザでログイン済みの管理者が、別の投稿端末を10分限定コードで承認できます。

1. 接続する端末で `https://trioland-social-publisher.mygate-jp.workers.dev/admin/pair` を開く。
2. 「承認コードを発行」を押し、表示された6桁コードと承認URLを確認する。
3. ログイン済みの通常ブラウザで承認URLを開き、コード一致を確認して明示的に承認する。
4. 接続する端末へ戻り、「承認済みか確認」を押す。

承認されるのは新しい8時間の管理セッションだけです。GitHub・Instagramのパスワードや
永久トークンは端末間で渡しません。承認秘密はハッシュで保存し、HOSHILUには接続しません。

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
