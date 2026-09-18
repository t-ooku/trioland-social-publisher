// 見学・入園相談／採用の問い合わせを受ける公開エンドポイント。
//
// このリポジトリは公開されている。したがって受信メールアドレスをここに書いてはいけない。
// Worker が扱うのは宛先の「記号」だけで、実アドレスは Make 側のシナリオだけが持つ。
//
//   ブラウザ → POST /api/inquiry → この関数 → Make の Webhook → Gmail で該当アドレスへ
//
// 設計上のきまり:
//   1. 何より先に KV へ保存する。メール送信が失敗しても問い合わせ内容は残る。
//   2. 送信に失敗したら成功と偽らない。フォームには「お電話ください」と出す。
//   3. 迷惑メール対策は honeypot と IP 単位のレート制限。CAPTCHA は入れない
//      （保護者の申し込みを止める副作用のほうが大きい）。

const DESTINATIONS = {
  // 保育園（hoiku.triocareer.jp）
  komazawa: "駒沢大学園",
  umegaoka: "梅ヶ丘園",
  general: "総合受付",
  recruit: "採用",
  // 放課後等デイサービス（afterschool.triocareer.jp）
  lopp: "放デイ ロップ",
  compass: "放デイ コンパスマイル落合南長崎",
  afterschool_recruit: "放デイ 採用",
};

const LIMITS = {
  name: 100,
  email: 200,
  tel: 40,
  child: 120,
  timing: 120,
  // 放デイの利用相談だけが送る項目（学年・学校名・お住まいの町名）
  grade: 60,
  school: 120,
  area: 120,
  // 放デイの採用だけが送る項目
  facility: 40,
  jobType: 60,
  age: 10,
  gender: 20,
  experience: 40,
  license: 200,
  employment: 40,
  message: 4000,
};

// 宛先ごとの必須項目。保育園は従来どおり（名前・連絡先・内容）。
// 放デイは事業所の指示で「利用相談は学年・学校名・町名・電話番号まで必須、採用は希望施設〜電話番号まで必須」。
const REQUIRED_BY_DESTINATION = {
  lopp: ["grade", "school", "area", "tel"],
  compass: ["grade", "school", "area", "tel"],
  afterschool_recruit: ["facility", "jobType", "age", "gender", "experience", "license", "employment", "tel"],
};
// 放デイは「補足」なので本文は任意。
const MESSAGE_OPTIONAL = new Set(["lopp", "compass", "afterschool_recruit"]);

const RATE_MAX = 5;                 // 同一IPから
const RATE_WINDOW_SECONDS = 600;    // 10分で5件まで
const RECORD_TTL_SECONDS = 400 * 24 * 60 * 60;   // 保存は約13か月
const WEBHOOK_TIMEOUT_MS = 10_000;

// このエンドポイントは Worker（workers.dev）に置いたまま、フォーム本体は
// Cloudflare Pages の hoiku.triocareer.jp / afterschool.triocareer.jp から呼ぶ。
// オリジンが違うのでブラウザは CORS を要求する。許可するのは自社サイトだけ。
//   - *.triocareer.jp        本番のサブドメイン
//   - *.pages.dev            Pages のプレビュー
//   - *.workers.dev          Worker 自身（従来どおり同一オリジンで動く）
function allowedOrigin(origin) {
  if (!origin) return "";
  let host;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return "";
    host = u.hostname;
  } catch {
    return "";
  }
  const ok = host === "triocareer.jp"
    || host.endsWith(".triocareer.jp")
    || host.endsWith(".pages.dev")
    || host.endsWith(".workers.dev");
  return ok ? origin : "";
}

export function corsHeaders(request) {
  const origin = allowedOrigin(request.headers.get("origin"));
  if (!origin) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "origin",
  };
}

function reply(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...corsHeaders(request),
    },
  });
}

function clean(value, max) {
  if (typeof value !== "string") return "";
  // 制御文字（改行・タブ・NUL など）を空白にする。ヘッダ偽装にも使われるため。
  // 正規表現に制御文字を直接書くとソース自体に制御バイトが入ってしまうので、
  // コードポイントで判定する。
  let out = "";
  for (const ch of value) {
    const code = ch.codePointAt(0);
    out += code < 32 || code === 127 ? " " : ch;
  }
  return out.trim().slice(0, max);
}

function looksLikeEmail(value) {
  return /^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(value);
}

async function clientKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const bytes = new TextEncoder().encode(`inquiry:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `inquiry-rate:${[...new Uint8Array(digest)].slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function overRateLimit(env, key) {
  if (!env.AUTH_KV) return false;
  const current = Number((await env.AUTH_KV.get(key)) || 0);
  if (current >= RATE_MAX) return true;
  await env.AUTH_KV.put(key, String(current + 1), {
    expirationTtl: RATE_WINDOW_SECONDS,
  });
  return false;
}

// 送信先の Webhook URL は Cloudflare 側の設定から読む。
// 設定の入れ方によって、ただの文字列で来る場合と、Secrets Store の
// バインディング（.get() で取り出すオブジェクト）で来る場合がある。
// どちらでも動くようにしておく。
async function resolveEndpoint(env) {
  const value = env.INQUIRY_WEBHOOK_URL;
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value.get === "function") {
    try {
      return String((await value.get()) || "").trim();
    } catch {
      return "";
    }
  }
  return "";
}

async function forwardToMake(env, record) {
  const endpoint = await resolveEndpoint(env);
  if (!endpoint || !endpoint.startsWith("https://")) {
    return { delivered: false, reason: "WEBHOOK_NOT_CONFIGURED" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(record),
      signal: controller.signal,
    });
    if (!response.ok) {
      return { delivered: false, reason: `WEBHOOK_HTTP_${response.status}` };
    }
    return { delivered: true };
  } catch (error) {
    return { delivered: false, reason: `WEBHOOK_FAILED_${error?.name || "ERROR"}` };
  } finally {
    clearTimeout(timer);
  }
}

export async function handleInquiry(request, env) {
  // CORS のプリフライト。許可外のオリジンには許可ヘッダを付けずに返す
  // （ブラウザ側で止まる）。
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return reply({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405, request);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return reply({ ok: false, error: "INVALID_JSON" }, 400, request);
  }

  // honeypot: 人間には見えない項目。埋まっていればボット。
  // 黙って成功を返す（失敗を教えると作り直してくる）。
  if (clean(payload?.company, 50)) {
    return reply({ ok: true, delivered: true }, 200, request);
  }

  const destination = String(payload?.destination || "").trim();
  if (!DESTINATIONS[destination]) {
    return reply({ ok: false, error: "INVALID_DESTINATION" }, 400, request);
  }

  const name = clean(payload?.name, LIMITS.name);
  const email = clean(payload?.email, LIMITS.email);
  const tel = clean(payload?.tel, LIMITS.tel);
  const child = clean(payload?.child, LIMITS.child);
  const timing = clean(payload?.timing, LIMITS.timing);
  const extra = {};
  for (const key of ["grade", "school", "area", "facility", "jobType", "age", "gender", "experience", "license", "employment"]) {
    extra[key] = clean(payload?.[key], LIMITS[key]);
  }
  let message = clean(payload?.message, LIMITS.message);

  if (!name) return reply({ ok: false, error: "NAME_REQUIRED" }, 400, request);
  if (!email && !tel) return reply({ ok: false, error: "CONTACT_REQUIRED" }, 400, request);
  if (email && !looksLikeEmail(email)) {
    return reply({ ok: false, error: "INVALID_EMAIL" }, 400, request);
  }
  for (const key of REQUIRED_BY_DESTINATION[destination] || []) {
    const value = key === "tel" ? tel : extra[key];
    if (!value) return reply({ ok: false, error: "FIELD_REQUIRED", field: key }, 400, request);
  }
  if (!message) {
    if (!MESSAGE_OPTIONAL.has(destination)) {
      return reply({ ok: false, error: "MESSAGE_REQUIRED" }, 400, request);
    }
    message = "（補足なし）";
  }

  const rateKey = await clientKey(request);
  if (await overRateLimit(env, rateKey)) {
    return reply({ ok: false, error: "TOO_MANY_REQUESTS" }, 429, request);
  }

  const receivedAt = new Date().toISOString();
  const id = `${receivedAt.replace(/[:.]/g, "-")}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    id,
    receivedAt,
    destination,
    destinationLabel: DESTINATIONS[destination],
    name,
    email,
    tel,
    child,
    timing,
    ...extra,
    message,
    userAgent: (request.headers.get("user-agent") || "").slice(0, 300),
  };

  // 1. まず保存する。ここを送信より後にしないこと。
  if (env.AUTH_KV) {
    try {
      await env.AUTH_KV.put(`inquiry:${id}`, JSON.stringify(record), {
        expirationTtl: RECORD_TTL_SECONDS,
      });
    } catch {
      // 保存に失敗しても送信は試みる。
    }
  }

  // 2. そのうえで送信する。
  const result = await forwardToMake(env, record);
  if (!result.delivered) {
    console.log(`inquiry ${id} stored but not delivered: ${result.reason}`);
    return reply({ ok: false, error: "DELIVERY_FAILED", id }, 502, request);
  }

  return reply({ ok: true, delivered: true, id }, 200, request);
}
