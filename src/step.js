// 中途採用者のステップアップ（/step/ と /admin/step）。
//
//   新人      /step/s/<token>   自分の道を見る・「できた」・週1回の気分チェック
//   指導役    /step/m/<token>   その新人の項目に「確認」・面談記録
//   園長      /step/n/<token>   その園の新人の一覧（指導役としての確認もできる）
//   本部      /admin/step       既存の管理ログインの内側
//
// 守ること（指示書 2 章）:
//   - 職員の名前・入社日・メモは D1（STEP_DB）にだけ入れる。リポジトリに個人情報を入れない。
//   - リンクのトークンは D1 に SHA-256 のハッシュだけを保存する。トークンはログに出さない。
//   - 書き込み API はトークンを Authorization ヘッダーで受け取る（URL のクエリには載せない）。
//   - 全ページ noindex。外部の解析・広告タグ・CDN は使わない。
import defaultChecklist from "../content/step_checklist.json" with { type: "json" };
import {
  NURSERIES,
  EMPLOYMENTS,
  NOTE_MAX,
  buildProgress,
  checklistToText,
  cleanText,
  isValidDate,
  itemIds,
  retentionStats,
  stageIds,
  textLength,
  textToChecklist,
  todayJst,
  weekMonday,
} from "./step_logic.js";
import { qrSvg } from "./step_qr.js";
import {
  STEP_APP_JS,
  renderAdminChecklist,
  renderAdminHome,
  renderAdminIssuedLink,
  renderAdminLearner,
  renderNotFound,
  renderNurseryPage,
  renderPathPage,
  renderPrintPage,
  renderStepError,
} from "./step_pages.js";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const ID_RE = /^[a-f0-9]{32}$/;
const RATE_LIMIT_PER_MINUTE = 60;
const KIND_BY_LETTER = { s: "self", m: "mentor", n: "nursery" };
const LETTER_BY_KIND = { self: "s", mentor: "m", nursery: "n" };

// ---------- 共通 ----------

function stepError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function stepHeaders(contentType = "text/html; charset=utf-8") {
  return {
    "content-type": contentType,
    "cache-control": "no-store",
    "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "x-robots-tag": "noindex, nofollow",
  };
}

function html(body, status = 200) {
  return new Response(body, { status, headers: stepHeaders() });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: stepHeaders("application/json; charset=utf-8") });
}

function nowIso() {
  return new Date().toISOString();
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomTokenValue() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomId() {
  return [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function db(env) {
  if (!env.STEP_DB) throw stepError("STEP_DB_NOT_CONFIGURED", 503);
  return env.STEP_DB;
}

// ---------- チェック項目（版） ----------

const checklistCache = new Map();

async function ensureChecklistSeed(env) {
  const row = await db(env).prepare("SELECT MAX(version) AS v FROM checklists").first();
  if (row && row.v) return Number(row.v);
  await db(env).prepare("INSERT OR IGNORE INTO checklists (version, json, created_at) VALUES (1, ?, ?)")
    .bind(JSON.stringify(defaultChecklist), nowIso()).run();
  return 1;
}

export async function latestChecklistVersion(env) {
  return ensureChecklistSeed(env);
}

export async function loadChecklist(env, version) {
  if (checklistCache.has(version)) return checklistCache.get(version);
  const row = await db(env).prepare("SELECT json FROM checklists WHERE version = ?").bind(version).first();
  if (!row) {
    if (version === 1) {
      await ensureChecklistSeed(env);
      return loadChecklist(env, 1);
    }
    throw stepError("CHECKLIST_NOT_FOUND", 500);
  }
  const parsed = JSON.parse(row.json);
  checklistCache.set(version, parsed);
  return parsed;
}

// ---------- レート制限（トークンごと 1分 60 回） ----------

async function rateLimit(env, key) {
  const window = Math.floor(Date.now() / 60_000);
  const row = await db(env).prepare(
    "INSERT INTO rate_limits (key, window, count) VALUES (?, ?, 1) "
    + "ON CONFLICT(key) DO UPDATE SET count = CASE WHEN rate_limits.window = excluded.window THEN rate_limits.count + 1 ELSE 1 END, window = excluded.window "
    + "RETURNING count",
  ).bind(key, window).first();
  if (Math.random() < 0.02) {
    await db(env).prepare("DELETE FROM rate_limits WHERE window < ?").bind(window - 5).run();
  }
  if (row && Number(row.count) > RATE_LIMIT_PER_MINUTE) throw stepError("RATE_LIMITED", 429);
}

// ---------- トークン ----------

// 有効なトークンなら { kind, learnerId, nursery, hash } を返す。無効なら null。
export async function resolveToken(env, token) {
  if (!TOKEN_RE.test(String(token || ""))) return null;
  const hash = await sha256Hex(token);
  const row = await db(env).prepare("SELECT kind, learner_id, nursery, revoked_at FROM tokens WHERE token_hash = ?").bind(hash).first();
  if (!row || row.revoked_at) return null;
  if (row.kind === "nursery") {
    if (!NURSERIES[row.nursery]) return null;
    return { kind: "nursery", learnerId: null, nursery: row.nursery, hash };
  }
  const learner = await db(env).prepare("SELECT id, nursery, status FROM learners WHERE id = ?").bind(row.learner_id).first();
  // 退職・完了した人のリンクは自動で無効
  if (!learner || learner.status !== "active") return null;
  return { kind: row.kind, learnerId: learner.id, nursery: learner.nursery, hash };
}

function bearer(request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

async function apiPrincipal(request, env) {
  const principal = await resolveToken(env, bearer(request));
  if (!principal) throw stepError("NOT_FOUND", 404);
  await rateLimit(env, principal.hash);
  return principal;
}

// 誰のデータを扱うか。本人・指導役は自分の新人だけ。園長は自分の園の新人だけ。
async function targetLearner(env, principal, requestedId) {
  let id = principal.learnerId;
  if (principal.kind === "nursery") {
    if (!ID_RE.test(String(requestedId || ""))) throw stepError("LEARNER_REQUIRED", 400);
    id = requestedId;
  } else if (requestedId && requestedId !== id) {
    throw stepError("NOT_FOUND", 404);
  }
  const learner = await db(env).prepare("SELECT * FROM learners WHERE id = ?").bind(id).first();
  if (!learner || learner.nursery !== principal.nursery) throw stepError("NOT_FOUND", 404);
  if (principal.kind === "nursery" && learner.status !== "active") throw stepError("NOT_FOUND", 404);
  return learner;
}

// ---------- 進み具合の読み出し ----------

async function learnerProgress(env, learner, today = todayJst()) {
  const checklist = await loadChecklist(env, Number(learner.checklist_version));
  const [checks, reviews, moods] = await Promise.all([
    db(env).prepare("SELECT item_id, self_at, mentor_at FROM checks WHERE learner_id = ?").bind(learner.id).all(),
    db(env).prepare("SELECT stage_id, met_on, self_note, mentor_note FROM reviews WHERE learner_id = ?").bind(learner.id).all(),
    db(env).prepare("SELECT week, level FROM moods WHERE learner_id = ? ORDER BY week DESC LIMIT 12").bind(learner.id).all(),
  ]);
  return buildProgress({ learner, checklist, checks: checks.results || [], reviews: reviews.results || [], moods: moods.results || [], today });
}

function publicLearner(learner) {
  return {
    id: learner.id,
    display_name: learner.display_name,
    nursery: learner.nursery,
    nursery_name: NURSERIES[learner.nursery] || learner.nursery,
    employment: EMPLOYMENTS[learner.employment] || learner.employment,
    start_date: learner.start_date,
    mentor_name: learner.mentor_name || "",
    status: learner.status,
  };
}

function rolePayload(kind) {
  return {
    kind,
    canSelf: kind === "self",
    canMentor: kind === "mentor" || kind === "nursery",
    canMood: kind === "self",
  };
}

async function mePayload(env, principal, learner) {
  const progress = await learnerProgress(env, learner);
  return { learner: publicLearner(learner), role: rolePayload(principal.kind), progress, noteMax: NOTE_MAX };
}

// 園（または全体）の新人を、進み具合つきでまとめて読む。
async function learnersWithProgress(env, { nursery = null, statuses = ["active"] } = {}) {
  const where = [];
  const binds = [];
  if (nursery) {
    where.push("nursery = ?");
    binds.push(nursery);
  }
  if (statuses) {
    where.push(`status IN (${statuses.map(() => "?").join(",")})`);
    binds.push(...statuses);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const learners = (await db(env).prepare(`SELECT * FROM learners ${clause} ORDER BY start_date DESC`).bind(...binds).all()).results || [];
  if (!learners.length) return [];
  const sub = `SELECT id FROM learners ${clause}`;
  const [checks, reviews, moods] = await Promise.all([
    db(env).prepare(`SELECT learner_id, item_id, self_at, mentor_at FROM checks WHERE learner_id IN (${sub})`).bind(...binds).all(),
    db(env).prepare(`SELECT learner_id, stage_id, met_on, self_note, mentor_note FROM reviews WHERE learner_id IN (${sub})`).bind(...binds).all(),
    db(env).prepare(`SELECT learner_id, week, level FROM moods WHERE learner_id IN (${sub})`).bind(...binds).all(),
  ]);
  const group = (rows) => {
    const map = new Map();
    for (const row of rows.results || []) {
      if (!map.has(row.learner_id)) map.set(row.learner_id, []);
      map.get(row.learner_id).push(row);
    }
    return map;
  };
  const checkMap = group(checks);
  const reviewMap = group(reviews);
  const moodMap = group(moods);
  const today = todayJst();
  const out = [];
  for (const learner of learners) {
    const checklist = await loadChecklist(env, Number(learner.checklist_version));
    const progress = buildProgress({
      learner,
      checklist,
      checks: checkMap.get(learner.id) || [],
      reviews: reviewMap.get(learner.id) || [],
      moods: moodMap.get(learner.id) || [],
      today,
    });
    out.push({ learner, progress });
  }
  return out;
}

function nurserySummary({ learner, progress }) {
  return {
    id: learner.id,
    display_name: learner.display_name,
    employment: EMPLOYMENTS[learner.employment] || learner.employment,
    mentor_name: learner.mentor_name || "",
    start_date: learner.start_date,
    day: progress.day,
    now_stage: progress.nowStageTitle,
    now_theme: progress.nowStageTheme,
    completed: progress.completed,
    confirmed: progress.confirmedItems,
    total: progress.totalItems,
    done_stages: progress.doneStages,
    stage_count: progress.stages.length,
    flags: {
      late: progress.flags.late,
      mood: progress.flags.mood,
      reviewDue: progress.flags.reviewDue.length > 0,
    },
  };
}

// ---------- 公開側のルーティング ----------

export async function handleStepRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  try {
    if (request.method === "GET" && path === "/step/app.js") {
      return new Response(STEP_APP_JS, { headers: { ...stepHeaders("text/javascript; charset=utf-8"), "cache-control": "public, max-age=300" } });
    }
    if (path.startsWith("/step/api/")) return await handleStepApi(request, env, path.slice("/step/api/".length));

    const match = path.match(/^\/step\/([smn])\/([A-Za-z0-9_-]{43})(?:\/l\/([a-f0-9]{32}))?(\/print)?\/?$/);
    if (!match || request.method !== "GET") return html(renderNotFound(), 404);
    const [, letter, token, learnerId, print] = match;
    const principal = await resolveToken(env, token);
    if (!principal || principal.kind !== KIND_BY_LETTER[letter]) return html(renderNotFound(), 404);
    if (learnerId && principal.kind !== "nursery") return html(renderNotFound(), 404);
    await rateLimit(env, principal.hash);

    if (principal.kind === "nursery" && !learnerId) {
      if (print) return html(renderNotFound(), 404);
      return html(renderNurseryPage({ nurseryName: NURSERIES[principal.nursery] }));
    }
    let learner;
    try {
      learner = await targetLearner(env, principal, learnerId);
    } catch {
      return html(renderNotFound(), 404);
    }
    if (print) {
      const checklist = await loadChecklist(env, Number(learner.checklist_version));
      const progress = await learnerProgress(env, learner);
      return html(renderPrintPage({ learner: publicLearner(learner), checklist, progress }));
    }
    return html(renderPathPage({ role: rolePayload(principal.kind), nurseryName: NURSERIES[learner.nursery] }));
  } catch (error) {
    const status = Number(error?.status || 500);
    if (path.startsWith("/step/api/")) return jsonResponse({ error: error?.message || "INTERNAL_ERROR" }, status);
    if (status === 429) return html(renderStepError("アクセスが集中しています。1分ほど待ってから開き直してください。"), 429);
    if (status === 503) return html(renderStepError("準備中です。本部にお問い合わせください。"), 503);
    return html(renderStepError("表示できませんでした。時間をおいて開き直してください。"), status);
  }
}

async function readJson(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw stepError("JSON_REQUIRED", 415);
  const text = await request.text();
  if (text.length > 8_000) throw stepError("TOO_LARGE", 413);
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw stepError("INVALID_JSON", 400);
  }
}

async function handleStepApi(request, env, name) {
  try {
    const url = new URL(request.url);
    if (request.method === "GET" && name === "me") {
      const principal = await apiPrincipal(request, env);
      const learner = await targetLearner(env, principal, url.searchParams.get("learner"));
      return jsonResponse(await mePayload(env, principal, learner));
    }
    if (request.method === "GET" && name === "nursery") {
      const principal = await apiPrincipal(request, env);
      if (principal.kind !== "nursery") throw stepError("FORBIDDEN", 403);
      const rows = await learnersWithProgress(env, { nursery: principal.nursery });
      const learners = rows.map(nurserySummary);
      const weight = (row) => (row.flags.mood ? 4 : 0) + (row.flags.late ? 2 : 0) + (row.flags.reviewDue ? 1 : 0);
      learners.sort((a, b) => weight(b) - weight(a) || b.day - a.day);
      return jsonResponse({ nursery: principal.nursery, nursery_name: NURSERIES[principal.nursery], today: todayJst(), learners });
    }
    if (request.method !== "POST" || !["check", "review", "mood"].includes(name)) throw stepError("NOT_FOUND", 404);

    const principal = await apiPrincipal(request, env);
    const body = await readJson(request);
    const learner = await targetLearner(env, principal, body.learner_id);
    if (learner.status !== "active") throw stepError("NOT_FOUND", 404);
    const checklist = await loadChecklist(env, Number(learner.checklist_version));
    const at = nowIso();

    if (name === "check") {
      const action = String(body.action || "");
      const itemId = String(body.item_id || "");
      if (!itemIds(checklist).has(itemId)) throw stepError("UNKNOWN_ITEM", 400);
      const selfActions = { self: "self_at = ?", undo_self: "self_at = NULL" };
      const mentorActions = { mentor: "mentor_at = ?", undo_mentor: "mentor_at = NULL" };
      let set;
      if (principal.kind === "self") set = selfActions[action];
      else set = mentorActions[action];
      if (!set) throw stepError(selfActions[action] || mentorActions[action] ? "FORBIDDEN" : "UNKNOWN_ACTION", selfActions[action] || mentorActions[action] ? 403 : 400);
      const usesAt = set.includes("?");
      const column = set.split(" ")[0];
      await db(env).batch([
        db(env).prepare(
          `INSERT INTO checks (learner_id, item_id, ${column}) VALUES (?, ?, ?) ON CONFLICT(learner_id, item_id) DO UPDATE SET ${set}`,
        ).bind(learner.id, itemId, usesAt ? at : null, ...(usesAt ? [at] : [])),
        db(env).prepare("INSERT INTO check_log (learner_id, item_id, actor, action, at) VALUES (?, ?, ?, ?, ?)")
          .bind(learner.id, itemId, principal.kind, action, at),
      ]);
      return jsonResponse(await mePayload(env, principal, learner));
    }

    if (name === "review") {
      const stageId = String(body.stage_id || "");
      if (!stageIds(checklist).has(stageId)) throw stepError("UNKNOWN_STAGE", 400);
      for (const key of ["self_note", "mentor_note"]) {
        if (body[key] != null && textLength(String(body[key])) > NOTE_MAX) throw stepError("NOTE_TOO_LONG", 400);
      }
      if (principal.kind === "self") {
        if (body.met_on !== undefined || body.mentor_note !== undefined) throw stepError("FORBIDDEN", 403);
        const note = cleanText(body.self_note, NOTE_MAX);
        await db(env).prepare(
          "INSERT INTO reviews (learner_id, stage_id, self_note) VALUES (?, ?, ?) ON CONFLICT(learner_id, stage_id) DO UPDATE SET self_note = excluded.self_note",
        ).bind(learner.id, stageId, note).run();
      } else {
        if (body.self_note !== undefined) throw stepError("FORBIDDEN", 403);
        const metOn = body.met_on ? String(body.met_on) : null;
        if (metOn && (!isValidDate(metOn) || metOn > todayJst())) throw stepError("INVALID_DATE", 400);
        const note = cleanText(body.mentor_note, NOTE_MAX);
        await db(env).prepare(
          "INSERT INTO reviews (learner_id, stage_id, met_on, mentor_note) VALUES (?, ?, ?, ?) ON CONFLICT(learner_id, stage_id) DO UPDATE SET met_on = excluded.met_on, mentor_note = excluded.mentor_note",
        ).bind(learner.id, stageId, metOn, note).run();
      }
      await db(env).prepare("INSERT INTO check_log (learner_id, item_id, actor, action, at) VALUES (?, ?, ?, ?, ?)")
        .bind(learner.id, `review:${stageId}`, principal.kind, "review", at).run();
      return jsonResponse(await mePayload(env, principal, learner));
    }

    // mood（本人だけ）
    if (principal.kind !== "self") throw stepError("FORBIDDEN", 403);
    const level = Number(body.level);
    if (![1, 2, 3].includes(level)) throw stepError("INVALID_LEVEL", 400);
    await db(env).prepare(
      "INSERT INTO moods (learner_id, week, level) VALUES (?, ?, ?) ON CONFLICT(learner_id, week) DO UPDATE SET level = excluded.level",
    ).bind(learner.id, weekMonday(todayJst()), level).run();
    return jsonResponse(await mePayload(env, principal, learner));
  } catch (error) {
    return jsonResponse({ error: error?.message || "INTERNAL_ERROR" }, Number(error?.status || 500));
  }
}

// ---------- 本部の管理画面 /admin/step ----------

async function issueToken(env, { kind, learnerId = null, nursery = null }) {
  const token = randomTokenValue();
  const hash = await sha256Hex(token);
  const at = nowIso();
  const revoke = kind === "nursery"
    ? db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE kind = 'nursery' AND nursery = ? AND revoked_at IS NULL").bind(at, nursery)
    : db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE kind = ? AND learner_id = ? AND revoked_at IS NULL").bind(at, kind, learnerId);
  await db(env).batch([
    revoke,
    db(env).prepare("INSERT INTO tokens (token_hash, kind, learner_id, nursery, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(hash, kind, learnerId, nursery, at),
  ]);
  return token;
}

async function activeTokenInfo(env) {
  const rows = (await db(env).prepare("SELECT kind, learner_id, nursery, created_at FROM tokens WHERE revoked_at IS NULL").all()).results || [];
  const byLearner = new Map();
  const byNursery = new Map();
  for (const row of rows) {
    if (row.kind === "nursery") byNursery.set(row.nursery, row.created_at);
    else {
      if (!byLearner.has(row.learner_id)) byLearner.set(row.learner_id, {});
      byLearner.get(row.learner_id)[row.kind] = row.created_at;
    }
  }
  return { byLearner, byNursery };
}

function readLearnerForm(form, { partial = false } = {}) {
  const out = {};
  const name = cleanText(form.get("display_name"), 40).replace(/\n/g, " ");
  if (!name) throw stepError("表示名を入れてください");
  if (textLength(name) > 20) throw stepError("表示名は20字までにしてください");
  out.display_name = name;
  const mentor = cleanText(form.get("mentor_name"), 40).replace(/\n/g, " ");
  if (textLength(mentor) > 20) throw stepError("指導役の名前は20字までにしてください");
  out.mentor_name = mentor || null;
  if (!partial) {
    const nursery = String(form.get("nursery") || "");
    if (!NURSERIES[nursery]) throw stepError("園を選んでください");
    out.nursery = nursery;
    const employment = String(form.get("employment") || "");
    if (!EMPLOYMENTS[employment]) throw stepError("雇用形態を選んでください");
    out.employment = employment;
    const start = String(form.get("start_date") || "");
    if (!isValidDate(start)) throw stepError("入社日を正しく入れてください");
    out.start_date = start;
  }
  return out;
}

function baseUrl(request) {
  return new URL(request.url).origin;
}

function linkFor(request, kind, token) {
  return `${baseUrl(request)}/step/${LETTER_BY_KIND[kind]}/${token}`;
}

async function adminLearner(env, id) {
  if (!ID_RE.test(id)) throw stepError("見つかりません", 404);
  const learner = await db(env).prepare("SELECT * FROM learners WHERE id = ?").bind(id).first();
  if (!learner) throw stepError("見つかりません", 404);
  return learner;
}

async function adminHomeData(env) {
  const latest = await latestChecklistVersion(env);
  const latestChecklist = await loadChecklist(env, latest);
  const rows = await learnersWithProgress(env, { statuses: null });
  const all = rows.map((row) => row.learner);
  const tokens = await activeTokenInfo(env);
  const stats = retentionStats(all, todayJst(), latestChecklist);
  return { rows, tokens, stats, latest, today: todayJst() };
}

// GET /admin/step...
export async function handleStepAdminGet(request, env, session, h) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  try {
    if (path === "/admin/step") {
      const data = await adminHomeData(env);
      return html(renderAdminHome({ ...data, csrf: session.csrf, notice: url.searchParams.get("done") || "", h }));
    }
    if (path === "/admin/step/checklist") {
      const latest = await latestChecklistVersion(env);
      const checklist = await loadChecklist(env, latest);
      return html(renderAdminChecklist({ version: latest, text: checklistToText(checklist), csrf: session.csrf, saved: url.searchParams.get("saved"), h }));
    }
    if (path === "/admin/step/print/blank") {
      const latest = await latestChecklistVersion(env);
      const checklist = await loadChecklist(env, latest);
      return html(renderPrintPage({ learner: null, checklist, progress: null }));
    }
    let match = path.match(/^\/admin\/step\/print\/([a-f0-9]{32})$/);
    if (match) {
      const learner = await adminLearner(env, match[1]);
      const checklist = await loadChecklist(env, Number(learner.checklist_version));
      const progress = await learnerProgress(env, learner);
      return html(renderPrintPage({ learner: publicLearner(learner), checklist, progress }));
    }
    match = path.match(/^\/admin\/step\/l\/([a-f0-9]{32})$/);
    if (match) return await adminLearnerPage(env, match[1], session, h, url.searchParams.get("done") || "");
    return html(renderNotFound(), 404);
  } catch (error) {
    return adminFailure(error, h);
  }
}

async function adminLearnerPage(env, id, session, h, notice = "", errorMessage = "", status = 200) {
  const learner = await adminLearner(env, id);
  const progress = await learnerProgress(env, learner);
  const tokens = await activeTokenInfo(env);
  const latest = await latestChecklistVersion(env);
  const log = (await db(env).prepare("SELECT item_id, actor, action, at FROM check_log WHERE learner_id = ? ORDER BY id DESC LIMIT 30").bind(id).all()).results || [];
  return html(renderAdminLearner({
    learner,
    progress,
    links: tokens.byLearner.get(id) || {},
    latest,
    log,
    csrf: session.csrf,
    notice,
    errorMessage,
    h,
  }), status);
}

function adminFailure(error, h) {
  const status = Number(error?.status || 500);
  const message = status === 503
    ? "D1（STEP_DB）がまだ用意されていません。wrangler.jsonc の d1_databases とマイグレーションを確認してください。"
    : status < 500 ? error.message : "処理を完了できませんでした。";
  return html(renderStepError(message, { admin: true, h }), status);
}

// POST /admin/step...（CSRF は index.js で確認済み）
export async function handleStepAdminPost(request, form, env, session, h) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  const redirect = (location) => new Response(null, { status: 303, headers: { location, "cache-control": "no-store" } });
  let learnerId = null;
  try {
    if (path === "/admin/step/learners") {
      const values = readLearnerForm(form);
      const version = await latestChecklistVersion(env);
      const id = randomId();
      await db(env).prepare(
        "INSERT INTO learners (id, nursery, display_name, employment, start_date, mentor_name, checklist_version, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)",
      ).bind(id, values.nursery, values.display_name, values.employment, values.start_date, values.mentor_name, version, nowIso()).run();
      return redirect(`/admin/step/l/${id}?done=created`);
    }

    let match = path.match(/^\/admin\/step\/nursery\/([a-z]+)\/(link|revoke)$/);
    if (match) {
      const [, nursery, op] = match;
      if (!NURSERIES[nursery]) throw stepError("園が見つかりません", 404);
      if (op === "revoke") {
        await db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE kind = 'nursery' AND nursery = ? AND revoked_at IS NULL").bind(nowIso(), nursery).run();
        return redirect("/admin/step?done=revoked");
      }
      const token = await issueToken(env, { kind: "nursery", nursery });
      const link = linkFor(request, "nursery", token);
      return html(renderAdminIssuedLink({ title: `${NURSERIES[nursery]} 園長リンク`, who: "園長・園長代理", link, qr: qrSvg(link, { scale: 5 }), back: "/admin/step", h }));
    }

    if (path === "/admin/step/checklist") {
      const latest = await latestChecklistVersion(env);
      const previous = await loadChecklist(env, latest);
      const { checklist, errors } = textToChecklist(String(form.get("checklist") || ""), previous);
      if (errors.length) {
        return html(renderAdminChecklist({ version: latest, text: String(form.get("checklist") || ""), csrf: session.csrf, errors, h }), 400);
      }
      if (JSON.stringify(checklist) === JSON.stringify(previous)) return redirect("/admin/step/checklist?saved=same");
      await db(env).prepare("INSERT INTO checklists (version, json, created_at) VALUES (?, ?, ?)").bind(latest + 1, JSON.stringify(checklist), nowIso()).run();
      return redirect(`/admin/step/checklist?saved=${latest + 1}`);
    }

    match = path.match(/^\/admin\/step\/l\/([a-f0-9]{32})\/([a-z-]+)$/);
    if (!match) throw stepError("操作が見つかりません", 404);
    const [, id, op] = match;
    learnerId = id;
    const learner = await adminLearner(env, id);
    const at = nowIso();

    if (op === "update") {
      const values = readLearnerForm(form, { partial: true });
      await db(env).prepare("UPDATE learners SET display_name = ?, mentor_name = ? WHERE id = ?").bind(values.display_name, values.mentor_name, id).run();
      return redirect(`/admin/step/l/${id}?done=updated`);
    }
    if (op === "link") {
      const kind = String(form.get("kind") || "");
      if (!["self", "mentor"].includes(kind)) throw stepError("リンクの種類が正しくありません");
      if (learner.status !== "active") throw stepError("在籍中の人だけリンクを発行できます", 409);
      const token = await issueToken(env, { kind, learnerId: id });
      const link = linkFor(request, kind, token);
      const who = kind === "self" ? `${learner.display_name}さん（本人）` : `${learner.mentor_name || "指導役"}さん（指導役）`;
      return html(renderAdminIssuedLink({ title: kind === "self" ? "本人リンク" : "指導役リンク", who, link, qr: qrSvg(link, { scale: 5 }), back: `/admin/step/l/${id}`, h }));
    }
    if (op === "revoke") {
      const kind = String(form.get("kind") || "");
      if (!["self", "mentor"].includes(kind)) throw stepError("リンクの種類が正しくありません");
      await db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE kind = ? AND learner_id = ? AND revoked_at IS NULL").bind(at, kind, id).run();
      return redirect(`/admin/step/l/${id}?done=revoked`);
    }
    if (op === "leave") {
      const leftDate = String(form.get("left_date") || "");
      if (!isValidDate(leftDate) || leftDate < learner.start_date) throw stepError("退職日を正しく入れてください（入社日より後）");
      const checklist = await loadChecklist(env, Number(learner.checklist_version));
      let leftStage = String(form.get("left_stage") || "");
      if (!leftStage) leftStage = (await learnerProgress(env, learner, leftDate)).nowStageId || checklist.stages.at(-1).id;
      if (!stageIds(checklist).has(leftStage)) throw stepError("段階が正しくありません");
      await db(env).batch([
        db(env).prepare("UPDATE learners SET status = 'left', left_date = ?, left_stage = ? WHERE id = ?").bind(leftDate, leftStage, id),
        db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE learner_id = ? AND revoked_at IS NULL").bind(at, id),
      ]);
      return redirect(`/admin/step/l/${id}?done=left`);
    }
    if (op === "complete") {
      await db(env).batch([
        db(env).prepare("UPDATE learners SET status = 'completed' WHERE id = ?").bind(id),
        db(env).prepare("UPDATE tokens SET revoked_at = ? WHERE learner_id = ? AND revoked_at IS NULL").bind(at, id),
      ]);
      return redirect(`/admin/step/l/${id}?done=completed`);
    }
    if (op === "reactivate") {
      await db(env).prepare("UPDATE learners SET status = 'active', left_date = NULL, left_stage = NULL WHERE id = ?").bind(id).run();
      return redirect(`/admin/step/l/${id}?done=reactivated`);
    }
    if (op === "delete") {
      if (String(form.get("deleteConfirmed")) !== "true") throw stepError("削除の確認にチェックを入れてください", 409);
      await db(env).batch([
        db(env).prepare("DELETE FROM checks WHERE learner_id = ?").bind(id),
        db(env).prepare("DELETE FROM check_log WHERE learner_id = ?").bind(id),
        db(env).prepare("DELETE FROM reviews WHERE learner_id = ?").bind(id),
        db(env).prepare("DELETE FROM moods WHERE learner_id = ?").bind(id),
        db(env).prepare("DELETE FROM tokens WHERE learner_id = ?").bind(id),
        db(env).prepare("DELETE FROM learners WHERE id = ?").bind(id),
      ]);
      return redirect("/admin/step?done=deleted");
    }
    throw stepError("操作が見つかりません", 404);
  } catch (error) {
    const status = Number(error?.status || 500);
    if (learnerId && status < 500 && status !== 404) {
      try {
        return await adminLearnerPage(env, learnerId, session, h, "", error.message, status);
      } catch {
        // 下の共通エラーへ
      }
    }
    if (path === "/admin/step/learners" && status < 500) {
      try {
        const data = await adminHomeData(env);
        return html(renderAdminHome({ ...data, csrf: session.csrf, errorMessage: error.message, h }), status);
      } catch {
        // 下の共通エラーへ
      }
    }
    return adminFailure(error, h);
  }
}
