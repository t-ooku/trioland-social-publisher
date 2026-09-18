// 放課後等デイサービスの求人内容を、管理画面から変えられるようにする。
//
//   既定値: afterschool/content/recruit.json（リポジトリ。ビルド時に静的ページへ焼き込まれる）
//   上書き: AUTH_KV の "afterschool-recruit"（管理画面 /admin/recruit で保存）
//
//   ブラウザ（afterschool.triocareer.jp の求人ページ）→ GET /api/afterschool/recruit → KV の内容で表示を差し替え
//
// 静的サイトなので、KV に保存した瞬間から本番に反映される（再ビルド不要）。
// 「既定値に戻す」は KV のキーを消すだけ。
import defaults from "../afterschool/content/recruit.json" with { type: "json" };
import { corsHeaders } from "./inquiry.js";

export const RECRUIT_KV_KEY = "afterschool-recruit";

export const JOB_SLOTS = [
  { id: "lopp", facility: "ロップ（練馬区関町東・武蔵関駅）" },
  { id: "compass", facility: "コンパスマイル落合南長崎（豊島区南長崎）" },
];

export const RECRUIT_FIELDS = [
  ["title", "募集職種（見出し）", 1],
  ["type", "雇用形態", 1],
  ["salary", "給与・手当", 6],
  ["hours", "勤務時間", 3],
  ["holidays", "休日・休暇", 3],
  ["duties", "仕事内容", 3],
  ["requirements", "応募資格・歓迎", 4],
  ["benefits", "待遇・福利厚生", 4],
  ["process", "選考の流れ", 3],
  ["appeal", "職場からのひとこと", 4],
];

const FIELD_MAX = 2000;

function cleanText(value, max = FIELD_MAX) {
  let out = "";
  for (const ch of String(value ?? "")) {
    const code = ch.codePointAt(0);
    out += code === 10 || code === 13 || (code >= 32 && code !== 127) ? ch : " ";
  }
  return out.replace(/\r\n?/g, "\n").trim().slice(0, max);
}

export async function loadRecruit(env) {
  let stored = null;
  try {
    const raw = env.AUTH_KV ? await env.AUTH_KV.get(RECRUIT_KV_KEY) : null;
    if (raw) stored = JSON.parse(raw);
  } catch {
    stored = null;
  }
  return { stored, defaults };
}

function effectiveJobs(stored) {
  const jobs = {};
  for (const slot of JOB_SLOTS) {
    const base = defaults.jobs[slot.id] || {};
    const over = stored?.jobs?.[slot.id] || null;
    jobs[slot.id] = over ? { ...base, ...over } : { ...base };
  }
  return jobs;
}

// 公開 API。求人ページの JS が読む。
export async function handleRecruitApi(request, env) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60",
    ...corsHeaders(request),
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }), { status: 405, headers });
  }
  const { stored } = await loadRecruit(env);
  return new Response(JSON.stringify({
    ok: true,
    source: stored ? "admin" : "default",
    updatedAt: stored?.updatedAt || defaults.updatedAt,
    jobs: effectiveJobs(stored),
  }), { headers });
}

// 管理画面。認証・CSRF は呼び出し側（index.js の handleAdminRequest）が済ませている。
export async function renderRecruitAdmin(request, env, session, deps, errorMessage = "", status = 200) {
  const { adminStyles, securityHeaders, escapeHtml } = deps;
  const url = new URL(request.url);
  const { stored } = await loadRecruit(env);
  const jobs = effectiveJobs(stored);
  const notices = [];
  if (url.searchParams.get("saved") === "1") notices.push("保存しました。求人ページには1分以内に反映されます（ブラウザの再読み込みで確認できます）。");
  if (url.searchParams.get("reset") === "1") notices.push("既定値（リポジトリの recruit.json）に戻しました。");
  if (errorMessage) notices.push(`エラー: ${errorMessage}`);

  const sections = JOB_SLOTS.map((slot, i) => {
    const job = jobs[slot.id];
    const fields = RECRUIT_FIELDS.map(([key, label, rows]) => rows === 1
      ? `<label>${escapeHtml(label)}<input type="text" name="${slot.id}_${key}" maxlength="${FIELD_MAX}" value="${escapeHtml(job[key] || "")}"></label>`
      : `<label>${escapeHtml(label)}<textarea name="${slot.id}_${key}" rows="${rows}" maxlength="${FIELD_MAX}">${escapeHtml(job[key] || "")}</textarea></label>`
    ).join("");
    return `<section><div class="section-head"><div><span class="step">${i + 1}</span><h2>${escapeHtml(slot.facility)}</h2></div><span class="pill ${job.open ? "done" : "danger"}">${job.open ? "募集中" : "募集停止中"}</span></div>
<div class="stack">
<label class="check"><input type="checkbox" name="${slot.id}_open" value="true" ${job.open ? "checked" : ""}><span>この事業所の求人を掲載する（外すと「現在募集していません」と表示）</span></label>
${fields}
</div></section>`;
  }).join("");

  const body = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>放デイ求人の編集 | 管理</title><style>${adminStyles()}input[type=text]{display:block;width:100%;margin-top:7px;border:1px solid #cbd7d5;border-radius:10px;padding:11px;font:inherit}.inline-danger{display:flex;align-items:center;gap:12px;margin-top:18px}.inline-danger .check{flex:1}.sticky{position:sticky;bottom:0;background:#f4f7f6;padding:12px 0;border-top:1px solid var(--line)}</style></head>
<body><header><div><span class="eyebrow">AFTERSCHOOL RECRUIT</span><h1>放デイ求人の編集</h1><p>ロップ・コンパスマイルの採用ページ（afterschool.triocareer.jp/recruit.html）に表示する内容です。保存するとすぐ本番に反映されます。現在の表示元：<strong>${stored ? "管理画面で保存した内容" : "既定値（リポジトリ）"}</strong>${stored?.updatedAt ? `（${escapeHtml(stored.updatedAt)} 保存）` : ""}</p></div><a class="button ghost" href="/admin">管理トップへ</a></header><main>
${notices.map((n) => `<div class="notice ${n.startsWith("エラー:") ? "error" : ""}">${escapeHtml(n)}</div>`).join("")}
<form method="post" action="/admin/recruit"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}">
${sections}
<div class="sticky"><button type="submit">この内容で保存して公開</button></div>
</form>
<form method="post" action="/admin/recruit/reset" class="inline-danger"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><label class="check final"><input type="checkbox" name="resetConfirmed" value="true" required><span>管理画面の内容を破棄して、リポジトリの既定値に戻す</span></label><button class="publish" type="submit">既定値に戻す</button></form>
<p class="help">給与・条件は必ず確認したものだけを載せてください（未確認の数字は公開しない）。改行はそのまま表示されます。</p>
</main><footer>保存先: Cloudflare KV（AUTH_KV / ${RECRUIT_KV_KEY}）</footer></body></html>`;
  return new Response(body, { status, headers: securityHeaders() });
}

export async function saveRecruitAdmin(form, env, session) {
  const jobs = {};
  for (const slot of JOB_SLOTS) {
    const job = { open: String(form.get(`${slot.id}_open`)) === "true" };
    for (const [key] of RECRUIT_FIELDS) {
      job[key] = cleanText(form.get(`${slot.id}_${key}`));
    }
    if (!job.title) throw Object.assign(new Error(`${slot.facility} の「募集職種（見出し）」は必須です`), { status: 400 });
    jobs[slot.id] = job;
  }
  const value = {
    updatedAt: new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 16).replace("T", " ") + " JST",
    updatedBy: session?.login || session?.authMethod || "admin",
    jobs,
  };
  await env.AUTH_KV.put(RECRUIT_KV_KEY, JSON.stringify(value));
  return value;
}

export async function resetRecruitAdmin(form, env) {
  if (String(form.get("resetConfirmed")) !== "true") {
    throw Object.assign(new Error("既定値に戻す確認が必要です"), { status: 409 });
  }
  await env.AUTH_KV.delete(RECRUIT_KV_KEY);
}
