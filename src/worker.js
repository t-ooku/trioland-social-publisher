// Worker の入口。ステップアップ表（/step/・/admin/step）だけをここで受け、それ以外は従来の src/index.js にそのまま渡す。
// index.js（Instagram 投稿・問い合わせ API・求人管理・MCP）には手を入れていない。
import mainWorker from "./index.js";
import { handleStep, renderStepAdmin, issueHqAdmin } from "./step.js";
import { assetBody } from "./step_assets.js";

const ADMIN_SESSION_COOKIE = "__Host-TRIOLAND_ADMIN_SESSION";

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function securityHeaders() {
  return {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-robots-tag": "noindex, nofollow",
  };
}

function adminStyles() {
  return "body{margin:0;background:#f4f7f6;color:#1c2b30;font-family:-apple-system,'Hiragino Sans','Yu Gothic',sans-serif;line-height:1.6}main{max-width:720px;margin:0 auto;padding:16px}section{background:#fff;border:1px solid #d7e3e1;border-radius:14px;padding:16px;margin:12px 0}.eyebrow{font-size:12px;color:#5e7177;letter-spacing:.08em}h1{font-size:20px;margin:4px 0}h2{font-size:17px;margin:0 0 6px}.notice{background:#fdf0dd;border-radius:10px;padding:10px;margin:10px 0}.notice.error{background:#fcebdd}.check{display:flex;gap:8px;align-items:flex-start;margin:10px 0}button.publish{background:#1f8a85;color:#fff;border:0;border-radius:999px;padding:8px 16px;font-weight:700;font-size:15px}code{font-size:12px}a{color:#1f8a85}";
}

const helpers = { adminStyles, securityHeaders, escapeHtml };

function readCookie(request, name) {
  const match = (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

// 既存の管理ログイン（index.js が AUTH_KV に保存するセッション）をそのまま使う
async function adminSession(request, env) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  if (!token || !env.AUTH_KV) return null;
  const raw = await env.AUTH_KV.get(`admin-session:${token}`);
  if (!raw) return null;
  try {
    return { ...JSON.parse(raw), token };
  } catch {
    return null;
  }
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function failure(message, status) {
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ステップアップ表の管理</title><style>${adminStyles()}</style></head><body><main><section><h1>処理を完了できませんでした</h1><div class="notice error">${escapeHtml(message)}</div><a href="/admin/step">戻る</a></section></main></body></html>`;
  return new Response(html, { status, headers: securityHeaders() });
}

async function handleStepAdmin(request, env) {
  const url = new URL(request.url);
  const session = await adminSession(request, env);
  if (!session) return Response.redirect(`${url.origin}/admin/access`, 302);
  try {
    if (request.method === "GET" && url.pathname === "/admin/step") {
      return await renderStepAdmin(request, env, session, helpers);
    }
    if (request.method === "POST" && url.pathname === "/admin/step/hq") {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) return failure("別のサイトからの送信は受け付けません", 403);
      const form = await request.formData();
      const csrf = String(form.get("csrf") || "");
      if (!csrf || !session.csrf || !constantTimeEqual(csrf, session.csrf)) return failure("画面を開き直してから、もう一度お試しください（CSRF）", 400);
      return await issueHqAdmin(request, form, env, session, helpers);
    }
    return failure("ページが見つかりません", 404);
  } catch (error) {
    return failure(error?.message || "エラーが発生しました", Number(error?.status || 500));
  }
}


/** Management-only KPI dashboard: never expose analytics in the public site assets. */
const KPI_ASSET_BASE = "https://raw.githubusercontent.com/t-ooku/trioland-social-publisher/main/dashboard/";
async function handleKpiAdmin(request, env) {
  const url = new URL(request.url);
  const session = await adminSession(request, env);
  if (!session) {
    return new Response(null, {
      status: 302,
      headers: {
        location: url.origin + "/admin/access?return_to=/admin/kpi",
        "cache-control": "no-store",
      },
    });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const wantsData = url.pathname === "/admin/kpi/data";
  const upstreamUrl = KPI_ASSET_BASE + (wantsData ? "latest.json" : "index.html");
  try {
    const result = await fetch(upstreamUrl, {
      headers: { accept: wantsData ? "application/json" : "text/html" },
      redirect: "manual",
      cache: "no-store"
    });
    if (!result.ok) throw new Error("KPI_SOURCE_UNAVAILABLE");
    let content = await result.text();
    if (content.length > 250000) throw new Error("KPI_SOURCE_TOO_LARGE");
    if (wantsData) {
      const parsed = JSON.parse(content);
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.sites) || !Array.isArray(parsed.ga4Series))
        throw new Error("KPI_SOURCE_INVALID");
      return new Response(request.method === "HEAD" ? null : JSON.stringify(parsed), {
        headers: { "content-type":"application/json; charset=utf-8", "cache-control":"private, no-store",
          "x-robots-tag":"noindex, nofollow", "x-content-type-options":"nosniff" }
      });
    }
    const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    content = content.replace(/__NONCE__/g, nonce);
    return new Response(request.method === "HEAD" ? null : content, {
      headers: {
        "content-type":"text/html; charset=utf-8", "cache-control":"private, no-store",
        "content-security-policy":"default-src 'none'; script-src 'nonce-" + nonce + "'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
        "x-robots-tag":"noindex, nofollow", "x-frame-options":"DENY",
        "x-content-type-options":"nosniff", "referrer-policy":"no-referrer"
      }
    });
  } catch (e) {
    return new Response("KPIダッシュボードの取得に失敗しました。少し後に再読み込みしてください。", {
      status: 503, headers: { "content-type":"text/plain; charset=utf-8",
        "cache-control":"private, no-store", "x-robots-tag":"noindex, nofollow" }
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/step" || url.pathname.startsWith("/step/")) {
      const asset = request.method === "GET" ? assetBody(url.pathname) : null;
      if (asset) {
        return new Response(asset.body, { headers: { "content-type": asset.type, "cache-control": "public, max-age=86400", "x-content-type-options": "nosniff", "x-robots-tag": "noindex, nofollow" } });
      }
      return handleStep(request, env);
    }
    if (url.pathname === "/admin/step" || url.pathname.startsWith("/admin/step/")) {
      return handleStepAdmin(request, env);
    }
    if (url.pathname === "/admin/kpi" || url.pathname === "/admin/kpi/data") {
      return handleKpiAdmin(request, env);
    }
    return mainWorker.fetch(request, env, ctx);
  },
};
