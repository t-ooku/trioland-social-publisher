// 中途採用者のステップアップ表（/step/ と /admin/step）。指示書：docs/step-app/INSTRUCTIONS.md
// - データは D1（STEP_DB）。個人情報はリポジトリに入れない。GA4・外部 CDN は使わない。全ページ noindex。
// - 職員はログインなしの専用リンク（本人・指導役・園長）で開く。リンクのトークンは SHA-256 のハッシュだけ保存する。
// - QR コードは未実装（リンクのコピー・共有で渡す）。
import defaultChecklist from "../content/step_checklist.json";
import { STEP_HTML, STEP_CSS, STEP_JS } from "./step_ui.js";
import {
  NURSERIES, isDate, todayJst, dayNumber, mondayOf, computeStages, moodAlert, retentionStats,
  validateChecklist, cleanNote, cleanName,
} from "./step_logic.js";

const MAX_BODY = 64 * 1024;
let schemaReady = false;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY, nursery TEXT NOT NULL, display_name TEXT NOT NULL, employment TEXT NOT NULL,
    start_date TEXT NOT NULL, mentor_name TEXT, checklist_version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', left_date TEXT, left_stage TEXT, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tokens (
    token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, learner_id TEXT, nursery TEXT,
    revoked_at TEXT, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS checks (
    learner_id TEXT NOT NULL, item_id TEXT NOT NULL, self_at TEXT, mentor_at TEXT,
    PRIMARY KEY (learner_id, item_id))`,
  `CREATE TABLE IF NOT EXISTS check_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT, item_id TEXT, actor TEXT, action TEXT, at TEXT)`,
  `CREATE TABLE IF NOT EXISTS reviews (
    learner_id TEXT NOT NULL, stage_id TEXT NOT NULL, met_on TEXT, self_note TEXT, mentor_note TEXT,
    PRIMARY KEY (learner_id, stage_id))`,
  `CREATE TABLE IF NOT EXISTS moods (
    learner_id TEXT NOT NULL, week TEXT NOT NULL, level INTEGER NOT NULL, PRIMARY KEY (learner_id, week))`,
  `CREATE TABLE IF NOT EXISTS checklists (version INTEGER PRIMARY KEY, json TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_learners_nursery ON learners (nursery)`,
  `CREATE INDEX IF NOT EXISTS idx_tokens_learner ON tokens (learner_id)`,
];

function stepError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function baseHeaders(contentType) {
  return {
    "content-type": contentType,
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}

function pageHeaders() {
  return {
    ...baseHeaders("text/html; charset=utf-8"),
    "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: baseHeaders("application/json; charset=utf-8") });
}

function nowIso() {
  return new Date().toISOString();
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomId() {
  return [...crypto.getRandomValues(new Uint8Array(10))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ensureSchema(env) {
  if (!env.STEP_DB) throw stepError("STEP_DB_NOT_CONFIGURED", 503);
  if (schemaReady) return;
  await env.STEP_DB.batch(SCHEMA.map((sql) => env.STEP_DB.prepare(sql)));
  const row = await env.STEP_DB.prepare("SELECT MAX(version) AS v FROM checklists").first();
  if (!row || row.v === null) {
    const clean = validateChecklist(defaultChecklist);
    await env.STEP_DB.prepare("INSERT OR IGNORE INTO checklists (version, json, created_at) VALUES (1, ?, ?)").bind(JSON.stringify(clean), nowIso()).run();
  }
  schemaReady = true;
}

async function latestChecklist(env) {
  const row = await env.STEP_DB.prepare("SELECT version, json FROM checklists ORDER BY version DESC LIMIT 1").first();
  return { version: row.version, ...JSON.parse(row.json) };
}

async function checklistVersion(env, version) {
  const row = await env.STEP_DB.prepare("SELECT version, json FROM checklists WHERE version = ?").bind(version).first();
  if (!row) return latestChecklist(env);
  return { version: row.version, ...JSON.parse(row.json) };
}

async function resolveToken(request, env) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) throw stepError("LINK_INVALID", 404);
  const row = await env.STEP_DB.prepare("SELECT kind, learner_id, nursery FROM tokens WHERE token_hash = ? AND revoked_at IS NULL").bind(await sha256(token)).first();
  if (!row) throw stepError("LINK_INVALID", 404);
  return row;
}

async function issueToken(env, kind, { learnerId = null, nursery = null }) {
  const token = randomToken();
  await env.STEP_DB.prepare("INSERT INTO tokens (token_hash, kind, learner_id, nursery, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(await sha256(token), kind, learnerId, nursery, nowIso()).run();
  return token;
}

function linkFor(origin, kind, token) {
  const seg = { self: "s", mentor: "m", nursery: "n" }[kind];
  return `${origin}/step/${seg}/${token}`;
}

async function readJson(request) {
  const len = Number(request.headers.get("content-length") || 0);
  if (len > MAX_BODY) throw stepError("BODY_TOO_LARGE", 413);
  const text = await request.text();
  if (text.length > MAX_BODY) throw stepError("BODY_TOO_LARGE", 413);
  try {
    const value = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch {
    throw stepError("BAD_JSON", 400);
  }
}

async function getLearner(env, id) {
  return env.STEP_DB.prepare("SELECT * FROM learners WHERE id = ?").bind(id).first();
}

async function learnerView(env, learner, today) {
  const checklist = await checklistVersion(env, learner.checklist_version);
  const latest = await env.STEP_DB.prepare("SELECT MAX(version) AS v FROM checklists").first();
  const checkRows = (await env.STEP_DB.prepare("SELECT item_id, self_at, mentor_at FROM checks WHERE learner_id = ?").bind(learner.id).all()).results;
  const reviewRows = (await env.STEP_DB.prepare("SELECT stage_id, met_on, self_note, mentor_note FROM reviews WHERE learner_id = ?").bind(learner.id).all()).results;
  const moodRows = (await env.STEP_DB.prepare("SELECT week, level FROM moods WHERE learner_id = ? ORDER BY week DESC LIMIT 8").bind(learner.id).all()).results;
  const checks = Object.fromEntries(checkRows.map((r) => [r.item_id, r]));
  const reviews = Object.fromEntries(reviewRows.map((r) => [r.stage_id, { met_on: r.met_on, self_note: r.self_note || "", mentor_note: r.mentor_note || "" }]));
  const view = computeStages(checklist, checks, reviews, learner.start_date, today);
  const thisWeek = mondayOf(today);
  return {
    learner: {
      id: learner.id, display_name: learner.display_name, nursery: learner.nursery, nursery_name: NURSERIES[learner.nursery] || "",
      employment: learner.employment, start_date: learner.start_date, mentor_name: learner.mentor_name || "",
      status: learner.status, left_date: learner.left_date, checklist_version: checklist.version, latest_version: latest.v,
    },
    dayNo: dayNumber(learner.start_date, today),
    view,
    reviews,
    moods: moodRows,
    thisWeek,
    myMood: (moodRows.find((m) => m.week === thisWeek) || {}).level || null,
    moodAlert: moodAlert(moodRows, today),
  };
}

async function nurseryOverview(env, nursery, today) {
  const rows = (await env.STEP_DB.prepare("SELECT * FROM learners WHERE nursery = ? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, start_date DESC").bind(nursery).all()).results;
  const learners = [];
  for (const l of rows) {
    const v = await learnerView(env, l, today);
    learners.push({
      id: l.id, display_name: l.display_name, start_date: l.start_date, mentor_name: l.mentor_name || "", status: l.status,
      left_date: l.left_date, left_stage: l.left_stage, dayNo: v.dayNo,
      current_title: v.view.current ? v.view.current.title : "", ok: v.view.ok, total: v.view.total,
      late: v.view.stages.some((s) => s.late && s.state !== "done"), needsReview: v.view.stages.some((s) => s.needsReview),
      moodAlert: v.moodAlert, lastMood: v.moods[0] ? v.moods[0].level : null,
    });
  }
  const leftStages = {};
  for (const l of rows) if (l.status === "left") leftStages[l.left_stage || "不明"] = (leftStages[l.left_stage || "不明"] || 0) + 1;
  return { learners, stats: { ...retentionStats(rows, today), leftStages } };
}

async function currentStageTitle(env, learner, today) {
  const v = await learnerView(env, learner, today);
  return v.view.current ? v.view.current.title : "全段階達成";
}

/** /step/... の入口。該当しなければ null。 */
export async function handleStep(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "GET" && path === "/step/app.js") {
      return new Response(STEP_JS, { headers: { ...baseHeaders("text/javascript; charset=utf-8"), "cache-control": "public, max-age=300" } });
    }
    if (request.method === "GET" && path === "/step/app.css") {
      return new Response(STEP_CSS, { headers: { ...baseHeaders("text/css; charset=utf-8"), "cache-control": "public, max-age=300" } });
    }
    if (request.method === "GET" && /^\/step\/[smn]\/[A-Za-z0-9_-]{20,80}$/.test(path)) {
      return new Response(STEP_HTML, { headers: pageHeaders() });
    }
    if (path.startsWith("/step/api/")) {
      await ensureSchema(env);
      return await handleStepApi(request, env, url);
    }
    return new Response(STEP_HTML.replace("<body>", '<body data-notfound="1">'), { status: 404, headers: pageHeaders() });
  } catch (error) {
    const status = Number(error?.status || 500);
    return jsonResponse({ error: status >= 500 && !error?.status ? "INTERNAL_ERROR" : error.message }, status);
  }
}

async function handleStepApi(request, env, url) {
  const auth = await resolveToken(request, env);
  const today = todayJst();
  const path = url.pathname.slice("/step/api".length);
  const method = request.method;

  // 新人・指導役・園長がどの新人を扱えるか
  const learnerFor = async (bodyLearnerId) => {
    if (auth.kind === "self" || auth.kind === "mentor") {
      const l = await getLearner(env, auth.learner_id);
      if (!l) throw stepError("LINK_INVALID", 404);
      return l;
    }
    const l = bodyLearnerId ? await getLearner(env, String(bodyLearnerId)) : null;
    if (!l || l.nursery !== auth.nursery) throw stepError("NOT_FOUND", 404);
    return l;
  };
  const requireNursery = () => { if (auth.kind !== "nursery") throw stepError("FORBIDDEN", 403); };
  const requireActive = (l) => { if (l.status !== "active") throw stepError("LEARNER_NOT_ACTIVE", 409); };

  if (method === "GET" && path === "/me") {
    if (auth.kind === "nursery") {
      const checklist = await latestChecklist(env);
      return jsonResponse({ role: "nursery", nursery: auth.nursery, nursery_name: NURSERIES[auth.nursery] || "", today, checklist, ...(await nurseryOverview(env, auth.nursery, today)) });
    }
    const l = await learnerFor();
    return jsonResponse({ role: auth.kind, today, ...(await learnerView(env, l, today)) });
  }

  const learnerMatch = path.match(/^\/learners\/([0-9a-f]{20})(\/links|\/upgrade)?$/);
  if (method === "GET" && learnerMatch && !learnerMatch[2]) {
    requireNursery();
    const l = await learnerFor(learnerMatch[1]);
    return jsonResponse({ role: "nursery", today, ...(await learnerView(env, l, today)) });
  }

  if (method === "POST" && path === "/check") {
    const body = await readJson(request);
    const l = await learnerFor(body.learner_id);
    requireActive(l);
    const action = String(body.action || "");
    const allowed = auth.kind === "self" ? ["self", "undo_self"] : ["mentor", "undo_mentor"];
    if (!allowed.includes(action)) throw stepError("FORBIDDEN", 403);
    const checklist = await checklistVersion(env, l.checklist_version);
    const itemId = String(body.item_id || "");
    if (!checklist.stages.some((s) => s.items.some((i) => i.id === itemId))) throw stepError("ITEM_NOT_FOUND", 404);
    const col = action.endsWith("self") ? "self_at" : "mentor_at";
    const value = action.startsWith("undo") ? null : nowIso();
    await env.STEP_DB.batch([
      env.STEP_DB.prepare(`INSERT INTO checks (learner_id, item_id, ${col}) VALUES (?, ?, ?) ON CONFLICT(learner_id, item_id) DO UPDATE SET ${col} = excluded.${col}`).bind(l.id, itemId, value),
      env.STEP_DB.prepare("INSERT INTO check_log (learner_id, item_id, actor, action, at) VALUES (?, ?, ?, ?, ?)").bind(l.id, itemId, auth.kind, action, nowIso()),
    ]);
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/review") {
    const body = await readJson(request);
    const l = await learnerFor(body.learner_id);
    requireActive(l);
    const checklist = await checklistVersion(env, l.checklist_version);
    const stageId = String(body.stage_id || "");
    if (!checklist.stages.some((s) => s.id === stageId)) throw stepError("STAGE_NOT_FOUND", 404);
    await env.STEP_DB.prepare("INSERT OR IGNORE INTO reviews (learner_id, stage_id) VALUES (?, ?)").bind(l.id, stageId).run();
    if (auth.kind === "self") {
      await env.STEP_DB.prepare("UPDATE reviews SET self_note = ? WHERE learner_id = ? AND stage_id = ?").bind(cleanNote(body.note), l.id, stageId).run();
    } else {
      const metOn = body.met_on === null || body.met_on === "" ? null : String(body.met_on);
      if (metOn !== null && (!isDate(metOn) || metOn > today)) throw stepError("BAD_DATE", 400);
      await env.STEP_DB.prepare("UPDATE reviews SET met_on = ?, mentor_note = ? WHERE learner_id = ? AND stage_id = ?").bind(metOn, cleanNote(body.note), l.id, stageId).run();
    }
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/mood") {
    if (auth.kind !== "self") throw stepError("FORBIDDEN", 403);
    const body = await readJson(request);
    const level = Number(body.level);
    if (![1, 2, 3].includes(level)) throw stepError("BAD_LEVEL", 400);
    const l = await learnerFor();
    requireActive(l);
    await env.STEP_DB.prepare("INSERT INTO moods (learner_id, week, level) VALUES (?, ?, ?) ON CONFLICT(learner_id, week) DO UPDATE SET level = excluded.level").bind(l.id, mondayOf(today), level).run();
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/learners") {
    requireNursery();
    const body = await readJson(request);
    const name = cleanName(body.display_name);
    if (!name) throw stepError("NAME_REQUIRED", 400);
    if (!isDate(body.start_date)) throw stepError("BAD_DATE", 400);
    const employment = body.employment === "parttime" ? "parttime" : "fulltime";
    const count = await env.STEP_DB.prepare("SELECT COUNT(*) AS n FROM learners WHERE nursery = ?").bind(auth.nursery).first();
    if (count.n >= 300) throw stepError("TOO_MANY_LEARNERS", 409);
    const latest = await latestChecklist(env);
    const id = randomId();
    await env.STEP_DB.prepare("INSERT INTO learners (id, nursery, display_name, employment, start_date, mentor_name, checklist_version, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)")
      .bind(id, auth.nursery, name, employment, body.start_date, cleanName(body.mentor_name), latest.version, nowIso()).run();
    return jsonResponse({ ok: true, id, links: await issueLearnerLinks(env, url.origin, id) });
  }

  if (learnerMatch && method === "PATCH" && !learnerMatch[2]) {
    requireNursery();
    const l = await learnerFor(learnerMatch[1]);
    const body = await readJson(request);
    const next = { ...l };
    if (body.display_name !== undefined) { next.display_name = cleanName(body.display_name); if (!next.display_name) throw stepError("NAME_REQUIRED", 400); }
    if (body.mentor_name !== undefined) next.mentor_name = cleanName(body.mentor_name);
    if (body.start_date !== undefined) { if (!isDate(body.start_date)) throw stepError("BAD_DATE", 400); next.start_date = body.start_date; }
    if (body.employment !== undefined) next.employment = body.employment === "parttime" ? "parttime" : "fulltime";
    if (body.status !== undefined) {
      if (!["active", "completed", "left"].includes(body.status)) throw stepError("BAD_STATUS", 400);
      next.status = body.status;
      if (body.status === "left") {
        const leftDate = body.left_date ? String(body.left_date) : today;
        if (!isDate(leftDate)) throw stepError("BAD_DATE", 400);
        next.left_date = leftDate;
        next.left_stage = l.status === "left" && l.left_stage ? l.left_stage : await currentStageTitle(env, l, today);
      } else {
        next.left_date = null;
        next.left_stage = null;
      }
    }
    await env.STEP_DB.prepare("UPDATE learners SET display_name = ?, mentor_name = ?, start_date = ?, employment = ?, status = ?, left_date = ?, left_stage = ? WHERE id = ?")
      .bind(next.display_name, next.mentor_name, next.start_date, next.employment, next.status, next.left_date, next.left_stage, l.id).run();
    if (next.status !== "active") {
      await env.STEP_DB.prepare("UPDATE tokens SET revoked_at = ? WHERE learner_id = ? AND revoked_at IS NULL").bind(nowIso(), l.id).run();
    }
    return jsonResponse({ ok: true });
  }

  if (learnerMatch && method === "POST" && learnerMatch[2] === "/links") {
    requireNursery();
    const l = await learnerFor(learnerMatch[1]);
    requireActive(l);
    return jsonResponse({ ok: true, links: await issueLearnerLinks(env, url.origin, l.id) });
  }

  if (learnerMatch && method === "POST" && learnerMatch[2] === "/upgrade") {
    requireNursery();
    const l = await learnerFor(learnerMatch[1]);
    const latest = await latestChecklist(env);
    await env.STEP_DB.prepare("UPDATE learners SET checklist_version = ? WHERE id = ?").bind(latest.version, l.id).run();
    return jsonResponse({ ok: true, version: latest.version });
  }

  if (method === "PUT" && path === "/checklist") {
    requireNursery();
    const body = await readJson(request);
    const clean = body.reset === true ? validateChecklist(defaultChecklist) : validateChecklist(body);
    const latest = await latestChecklist(env);
    if (body.reset !== true && Number(body.base_version) !== latest.version) throw stepError("CHECKLIST_CHANGED", 409);
    const version = latest.version + 1;
    await env.STEP_DB.prepare("INSERT INTO checklists (version, json, created_at) VALUES (?, ?, ?)").bind(version, JSON.stringify(clean), nowIso()).run();
    return jsonResponse({ ok: true, version });
  }

  throw stepError("NOT_FOUND", 404);
}

async function issueLearnerLinks(env, origin, learnerId) {
  await env.STEP_DB.prepare("UPDATE tokens SET revoked_at = ? WHERE learner_id = ? AND revoked_at IS NULL").bind(nowIso(), learnerId).run();
  const self = linkFor(origin, "self", await issueToken(env, "self", { learnerId }));
  const mentor = linkFor(origin, "mentor", await issueToken(env, "mentor", { learnerId }));
  return { self: { url: self }, mentor: { url: mentor } };
}

/* ---------- 本部の管理画面 /admin/step（既存の管理ログイン・CSRF の内側で呼ばれる） ---------- */

export async function renderStepAdmin(request, env, session, helpers, issued = null) {
  const { adminStyles, securityHeaders, escapeHtml } = helpers;
  let body;
  if (!env.STEP_DB) {
    body = `<div class="notice error">D1（STEP_DB）がまだ設定されていません。</div>`;
  } else {
    await ensureSchema(env);
    const today = todayJst();
    const sections = [];
    for (const [key, name] of Object.entries(NURSERIES)) {
      const active = await env.STEP_DB.prepare("SELECT COUNT(*) AS n FROM tokens WHERE kind = 'nursery' AND nursery = ? AND revoked_at IS NULL").bind(key).first();
      const rows = (await env.STEP_DB.prepare("SELECT start_date, status, left_date, left_stage FROM learners WHERE nursery = ?").bind(key).all()).results;
      const st = retentionStats(rows, today);
      const leftStages = {};
      for (const r of rows) if (r.status === "left") leftStages[r.left_stage || "不明"] = (leftStages[r.left_stage || "不明"] || 0) + 1;
      const windows = st.windows.map((w) => `<li>${w.days}日：${w.eligible ? `${w.stayed}/${w.eligible}人が残った` : "対象者なし"}</li>`).join("");
      const left = Object.keys(leftStages).length ? Object.entries(leftStages).map(([k, v]) => `${escapeHtml(k)} ${v}人`).join("・") : "なし";
      const issuedHere = issued && issued.nursery === key
        ? `<div class="notice">新しい園長リンクです。<b>この画面を閉じると二度と表示されません。</b>園長に渡してください（古いリンクは無効になりました）。<p style="word-break:break-all"><code>${escapeHtml(issued.url)}</code></p></div>`
        : "";
      sections.push(`<section class="panel"><h2>${escapeHtml(name)}</h2>
        <p>新人 ${st.total}人（受け入れ中 ${st.active}・修了 ${st.completed}・退職 ${st.left}）／有効な園長リンク ${active.n}本</p>
        <ul>${windows}</ul><p>辞めた段階：${left}</p>${issuedHere}
        <form method="post" action="/admin/step/nursery-link"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><input type="hidden" name="nursery" value="${key}">
        <label class="check final"><input type="checkbox" name="confirmed" value="true" required><span>園長リンクを発行する（今のリンクは使えなくなる）</span></label>
        <button class="publish" type="submit">園長リンクを発行</button></form></section>`);
    }
    body = sections.join("");
  }
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ステップアップ表の管理</title><style>${adminStyles()}</style></head><body><main><section><span class="eyebrow">TRIO CAREER</span><h1>中途採用者のステップアップ表</h1><p>園長リンクを開くと、新人の登録・本人と指導役のリンク発行・項目の編集ができます。<a href="/admin">管理画面へ戻る</a></p></section>${body}</main></body></html>`;
  return new Response(html, { headers: { ...securityHeaders(), "x-robots-tag": "noindex, nofollow" } });
}

export async function issueNurseryLinkAdmin(request, form, env, session, helpers) {
  if (!env.STEP_DB) throw stepError("STEP_DB_NOT_CONFIGURED", 503);
  await ensureSchema(env);
  const nursery = String(form.get("nursery") || "");
  if (!NURSERIES[nursery]) throw stepError("園の指定が正しくありません", 400);
  if (String(form.get("confirmed")) !== "true") throw stepError("確認のチェックが必要です", 409);
  await env.STEP_DB.prepare("UPDATE tokens SET revoked_at = ? WHERE kind = 'nursery' AND nursery = ? AND revoked_at IS NULL").bind(nowIso(), nursery).run();
  const token = await issueToken(env, "nursery", { nursery });
  const url = linkFor(new URL(request.url).origin, "nursery", token);
  return renderStepAdmin(request, env, session, helpers, { nursery, url });
}
