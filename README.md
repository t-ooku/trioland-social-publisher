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
- Variables:
  - `META_API_VERSION`（初期値 `v24.0`。Metaアプリの表示値に合わせて更新）

## 安全ルール

- `approved=true` がない素材はアップロード不可。
- R2オブジェクトにも `approved=true` のメタデータがないと公開不可。
- 投稿APIは専用管理トークン必須。
- Meta access tokenはAES-256-GCMで暗号化してKVへ保存。
- Metaへ渡す素材URLは短時間のみ有効な署名URL。
- `hoshilu.app` のRouteやDNSは設定しない。

## APIの流れ

1. Metaアプリの有効なOAuthリダイレクトURIへ
   `https://<worker>.workers.dev/oauth/callback` を登録。
2. `POST /oauth/start` でInstagram認証URLを取得。
3. Instagramプロアカウントで認証し `/oauth/callback` へ戻る。
4. `POST /media` へ承認済み画像・動画をアップロード。
5. `POST /publish` で `IMAGE` または `REELS` を公開。
6. 定期的に `POST /token/refresh` で長期トークンを更新。

## 未実施

Cloudflareへのデプロイ、Metaアプリ作成、Secret設定、Instagram OAuthは外部アカウント
操作が必要なため、ローカル実装とは別に実施します。認証情報をチャットへ貼らないでください。
