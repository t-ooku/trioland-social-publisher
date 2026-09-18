// Cloudflare Pages 用の入口。POST /api/inquiry がここに来る。
//
// 中身は src/inquiry.js と共有している。Workers 版（src/index.js のルート）と
// Pages 版でロジックを二重に持つと、片方だけ直して食い違う事故が必ず起きるため。
//
// 必要なバインディング（Pages プロジェクトの設定に入れること）:
//   AUTH_KV              … 問い合わせの保存とレート制限に使う KV
//   INQUIRY_WEBHOOK_URL  … Make の Webhook URL（シークレット）
import { handleInquiry } from "../../src/inquiry.js";

export const onRequest = (context) => handleInquiry(context.request, context.env);
