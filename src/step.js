// 中途採用者のステップアップ表（/step/ と /admin/step）。指示書：docs/step-app/INSTRUCTIONS.md
// - データは D1（STEP_DB）。個人情報はリポジトリに入れない。GA4・外部 CDN は使わない。全ページ noindex。
// - 2026-11-11 から ID とパスワードでログインする（本部・園長・指導役・新人）。前の専用リンクは使えない。
// - 最初の本部 ID は、既存の管理ログインの内側（/admin/step）で発行する。
import defaultChecklist from "../content/step_checklist.json";
import { STEP_HTML, STEP_CSS, STEP_JS } from "./step_ui.js";
import {
  isDate, todayJst, dayNumber, mondayOf, computeStages, moodAlert, retentionStats,
  validateChecklist, cleanNote, cleanName, LEFT_REASONS, learnerSignals, turnoverAnalytics,
  cleanLoginId, passwordProblem, cleanReasons, parseStudyUrl,
} from "./step_logic.js";
import {
  SESSION_COOKIE, PBKDF2_ITERATIONS, hashPassword, verifyPassword, tempPassword, createSession, sessionUser,
  endSession, endAllSessions, sessionCookie, clearCookie, tooManyFailures, recordFailure, clearFailures, randomToken,
} from "./step_auth.js";
import { learnerXlsx, learnerDocx, checklistXlsx, checklistDocx, analyticsXlsx } from "./step_export.js";

const MAX_BODY = 64 * 1024;
let schemaReady = false;
// パスワードのハッシュの回数。Workers の無料プランで CPU 時間が足りないときは、環境変数 STEP_PBKDF2_ITERATIONS で下げられる。
let hashIter = PBKDF2_ITERATIONS;
function setHashIter(env) {
  const v = Number(env?.STEP_PBKDF2_ITERATIONS);
  hashIter = Number.isInteger(v) && v >= 10000 && v <= PBKDF2_ITERATIONS ? v : PBKDF2_ITERATIONS;
}

const ROLES = { hq: "本部", director: "園長", mentor: "指導役", learner: "新人" };

const DEFAULT_NURSERIES = [
  { id: "komazawa", name: "駒沢大学園", sort: 1 },
  { id: "umegaoka", name: "梅ヶ丘園", sort: 2 },
];

// 自己研修の公的資料（最初に1回だけ入れる。本部があとで直せる）
const DEFAULT_STUDY = [
  { kind: "link", category: "guideline", title: "保育所保育指針（こども家庭庁「保育」のページ）", url: "https://www.cfa.go.jp/policies/hoiku/" },
  { kind: "link", category: "guideline", title: "保育所保育指針解説（分割版）", url: "https://www.cfa.go.jp/policies/hoiku/shishin-h30-bunkatsu" },
  { kind: "link", category: "guideline", title: "保育所における感染症対策ガイドライン（2018年改訂版・2023年5月一部改訂）", url: "https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/e4b817c9-5282-4ccc-b0d5-ce15d7b5018c/c60bb9fc/20230720_policies_hoiku_25.pdf" },
  { kind: "link", category: "guideline", title: "保育所や幼稚園等における虐待の防止及び発生時の対応等に関するガイドライン", url: "https://www.cfa.go.jp/assets/contents/node/basic_page/field_ref_resources/ee30f1d8-3d23-437e-b44d-7807f9afb66c/b2c3eea8/20260422_hoiku_hoiku-gyakutaiboushi_17.pdf" },
];
const STUDY_CATEGORIES = { skill: "保育スキルの動画", guideline: "保育指針・公的な資料", news: "最新の情報・お知らせ", other: "そのほか" };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY, nursery TEXT NOT NULL, display_name TEXT NOT NULL, employment TEXT NOT NULL,
    start_date TEXT NOT NULL, mentor_name TEXT, checklist_version INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', left_date TEXT, left_stage TEXT, created_at TEXT NOT NULL,
    left_reason TEXT, left_note TEXT, mentor_user_id TEXT)`,
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
  `CREATE TABLE IF NOT EXISTS nurseries (id TEXT PRIMARY KEY, name TEXT NOT NULL, sort INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, login_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, nursery TEXT, learner_id TEXT,
    pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL, pw_iter INTEGER NOT NULL, must_change INTEGER NOT NULL DEFAULT 1,
    disabled_at TEXT, created_at TEXT NOT NULL, last_login_at TEXT)`,
  `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_failures (login_id TEXT NOT NULL, at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS study_items (
    id TEXT PRIMARY KEY, scope TEXT NOT NULL, nursery TEXT, kind TEXT NOT NULL, category TEXT NOT NULL,
    url TEXT NOT NULL, video_id TEXT, title TEXT NOT NULL, note TEXT, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS study_progress (learner_id TEXT NOT NULL, item_key TEXT NOT NULL, done_at TEXT, memo TEXT, PRIMARY KEY (learner_id, item_key))`,
  `CREATE INDEX IF NOT EXISTS idx_learners_nursery ON learners (nursery)`,
  `CREATE INDEX IF NOT EXISTS idx_tokens_learner ON tokens (learner_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_nursery ON users (nursery)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_failures_login ON login_failures (login_id, at)`,
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
    "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://i.ytimg.com; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  };
}

function jsonResponse(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders("application/json; charset=utf-8"), ...extra } });
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(bytes = 10) {
  return [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function addColumn(db, table, col) {
  try {
    await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT`).run();
  } catch (error) {
    if (!/duplicate column/i.test(String(error?.message))) throw error; // 別のリクエストが先に足した
  }
}

async function ensureSchema(env) {
  setHashIter(env);
  if (!env.STEP_DB) throw stepError("STEP_DB_NOT_CONFIGURED", 503);
  if (schemaReady) return;
  const db = env.STEP_DB;
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  // あとから足した列（migrations/0002・0003 と同じ）
  const cols = (await db.prepare("PRAGMA table_info(learners)").all()).results.map((c) => c.name);
  for (const col of ["left_reason", "left_note", "mentor_user_id"]) if (!cols.includes(col)) await addColumn(db, "learners", col);
  const row = await db.prepare("SELECT MAX(version) AS v FROM checklists").first();
  if (!row || row.v === null) {
    const clean = validateChecklist(defaultChecklist);
    await db.prepare("INSERT OR IGNORE INTO checklists (version, json, created_at) VALUES (1, ?, ?)").bind(JSON.stringify(clean), nowIso()).run();
  }
  for (const n of DEFAULT_NURSERIES) {
    await db.prepare("INSERT OR IGNORE INTO nurseries (id, name, sort, active, created_at) VALUES (?, ?, ?, 1, ?)").bind(n.id, n.name, n.sort, nowIso()).run();
  }
  const seeded = await db.prepare("SELECT value FROM settings WHERE key = 'study_seeded'").first();
  if (!seeded) {
    // id を決めておき、同時に2回入れても重ならないようにする
    const stmts = DEFAULT_STUDY.map((s, i) => db.prepare("INSERT OR IGNORE INTO study_items (id, scope, nursery, kind, category, url, video_id, title, note, created_by, created_at, updated_at) VALUES (?, 'all', NULL, ?, ?, ?, '', ?, '', 'system', ?, ?)")
      .bind(String(i + 1).padStart(20, "0"), s.kind, s.category, s.url, s.title, nowIso(), nowIso()));
    stmts.push(db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('study_seeded', '1')"));
    await db.batch(stmts);
  }
  schemaReady = true;
}

/* ---------- 設定・園 ---------- */

async function loadConfig(db) {
  const rows = (await db.prepare("SELECT key, value FROM settings WHERE key IN ('reasons', 'alert_weeks')").all()).results;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let reasons = null;
  try { reasons = map.reasons ? JSON.parse(map.reasons) : null; } catch { reasons = null; }
  if (!Array.isArray(reasons) || !reasons.length) reasons = Object.entries(LEFT_REASONS).map(([key, label]) => ({ key, label, active: true }));
  const alertWeeks = Math.max(1, Math.min(8, Number(map.alert_weeks) || 2));
  const nurseries = (await db.prepare("SELECT id, name, sort, active FROM nurseries ORDER BY sort, created_at").all()).results;
  return {
    reasons,
    reasonMap: Object.fromEntries(reasons.map((r) => [r.key, r.label])),
    alertWeeks,
    nurseries,
    nurseryName: Object.fromEntries(nurseries.map((n) => [n.id, n.name])),
  };
}

/* ---------- 項目・新人 ---------- */

async function latestChecklist(db) {
  const row = await db.prepare("SELECT version, json FROM checklists ORDER BY version DESC LIMIT 1").first();
  return { version: row.version, ...JSON.parse(row.json) };
}

async function checklistVersion(db, version) {
  const row = await db.prepare("SELECT version, json FROM checklists WHERE version = ?").bind(version).first();
  if (!row) return latestChecklist(db);
  return { version: row.version, ...JSON.parse(row.json) };
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

async function getLearner(db, id) {
  return db.prepare("SELECT * FROM learners WHERE id = ?").bind(id).first();
}

async function learnerView(db, learner, today, cfg) {
  const checklist = await checklistVersion(db, learner.checklist_version);
  const latest = await db.prepare("SELECT MAX(version) AS v FROM checklists").first();
  const checkRows = (await db.prepare("SELECT item_id, self_at, mentor_at FROM checks WHERE learner_id = ?").bind(learner.id).all()).results;
  const reviewRows = (await db.prepare("SELECT stage_id, met_on, self_note, mentor_note FROM reviews WHERE learner_id = ?").bind(learner.id).all()).results;
  const moodRows = (await db.prepare("SELECT week, level FROM moods WHERE learner_id = ? ORDER BY week DESC LIMIT 12").bind(learner.id).all()).results;
  const checks = Object.fromEntries(checkRows.map((r) => [r.item_id, r]));
  const reviews = Object.fromEntries(reviewRows.map((r) => [r.stage_id, { met_on: r.met_on, self_note: r.self_note || "", mentor_note: r.mentor_note || "" }]));
  const view = computeStages(checklist, checks, reviews, learner.start_date, today);
  const thisWeek = mondayOf(today);
  return {
    learner: {
      id: learner.id, display_name: learner.display_name, nursery: learner.nursery, nursery_name: cfg.nurseryName[learner.nursery] || "",
      employment: learner.employment, start_date: learner.start_date, mentor_name: learner.mentor_name || "", mentor_user_id: learner.mentor_user_id || null,
      status: learner.status, left_date: learner.left_date, checklist_version: checklist.version, latest_version: latest.v,
      left_reason: learner.left_reason || null, left_note: learner.left_note || "",
    },
    dayNo: dayNumber(learner.start_date, today),
    view,
    reviews,
    moods: moodRows.slice(0, 8),
    thisWeek,
    myMood: (moodRows.find((m) => m.week === thisWeek) || {}).level || null,
    moodAlert: moodAlert(moodRows, today, cfg.alertWeeks),
    signals: learnerSignals(checklist, checks, reviews, moodRows, learner, today),
  };
}

function listRow(l, v) {
  return {
    id: l.id, display_name: l.display_name, start_date: l.start_date, mentor_name: l.mentor_name || "", status: l.status,
    left_date: l.left_date, left_stage: l.left_stage, dayNo: v.dayNo,
    current_title: v.view.current ? v.view.current.title : "", ok: v.view.ok, total: v.view.total,
    late: v.view.stages.some((s) => s.late && s.state !== "done"), needsReview: v.view.stages.some((s) => s.needsReview),
    moodAlert: v.moodAlert, lastMood: v.moods[0] ? v.moods[0].level : null, left_reason: l.left_reason || null,
  };
}

async function nurseryOverview(db, nursery, today, cfg) {
  const rows = (await db.prepare("SELECT * FROM learners WHERE nursery = ? ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END, start_date DESC").bind(nursery).all()).results;
  const learners = [];
  const people = [];
  for (const l of rows) {
    const v = await learnerView(db, l, today, cfg);
    learners.push(listRow(l, v));
    people.push({ ...l, signals: v.signals });
  }
  const leftStages = {};
  for (const l of rows) if (l.status === "left") leftStages[l.left_stage || "不明"] = (leftStages[l.left_stage || "不明"] || 0) + 1;
  const stages = (await latestChecklist(db)).stages;
  return { learners, stats: { ...retentionStats(rows, today), leftStages }, analytics: turnoverAnalytics(people, today, 12, stages, cfg.reasonMap) };
}

async function currentStageTitle(db, learner, date, cfg) {
  const v = await learnerView(db, learner, date, cfg);
  return v.view.current ? v.view.current.title : "全段階達成";
}

/* ---------- アカウント ---------- */

function publicUser(u) {
  return { id: u.id, login_id: u.login_id, name: u.name, role: u.role, nursery: u.nursery || null, learner_id: u.learner_id || null, must_change: Boolean(u.must_change), disabled: Boolean(u.disabled_at), last_login_at: u.last_login_at || null, created_at: u.created_at };
}

async function nextLoginId(db, base) {
  for (let i = 1; i < 1000; i += 1) {
    const id = `${base}${String(i).padStart(3, "0")}`;
    const hit = await db.prepare("SELECT 1 FROM users WHERE login_id = ?").bind(id).first();
    if (!hit) return id;
  }
  return `${base}${randomId(3)}`;
}

/** アカウントを作り、仮パスワードを返す（仮パスワードは保存しない。この1回だけ見せる）。 */
async function createAccount(db, { loginId, name, role, nursery = null, learnerId = null }) {
  const login = loginId ? cleanLoginId(loginId) : await nextLoginId(db, `${nursery || "honbu"}-${role === "learner" ? "" : role === "mentor" ? "s" : role === "director" ? "en" : ""}`);
  if (!login) throw stepError("BAD_LOGIN_ID", 400);
  const exists = await db.prepare("SELECT 1 FROM users WHERE login_id = ?").bind(login).first();
  if (exists) throw stepError("LOGIN_ID_TAKEN", 409);
  const temp = tempPassword();
  const h = await hashPassword(temp, null, hashIter);
  const id = randomId();
  await db.prepare("INSERT INTO users (id, login_id, name, role, nursery, learner_id, pw_hash, pw_salt, pw_iter, must_change, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)")
    .bind(id, login, cleanName(name) || login, role, nursery, learnerId, h.hash, h.salt, h.iterations, nowIso()).run();
  return { id, login_id: login, temp_password: temp };
}

async function resetAccount(db, userId) {
  const temp = tempPassword();
  const h = await hashPassword(temp, null, hashIter);
  await db.prepare("UPDATE users SET pw_hash = ?, pw_salt = ?, pw_iter = ?, must_change = 1 WHERE id = ?").bind(h.hash, h.salt, h.iterations, userId).run();
  await endAllSessions(db, userId);
  return temp;
}

/* ---------- 入口 ---------- */

/** /step/... の入口。 */
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
    if (request.method === "GET" && (path === "/step" || path === "/step/")) {
      return new Response(STEP_HTML, { headers: pageHeaders() });
    }
    if (request.method === "GET" && /^\/step\/[smn]\/[A-Za-z0-9_-]{20,80}$/.test(path)) {
      // 2026-11-11 まで使っていた専用リンク。ログインの画面に案内する。
      return new Response(STEP_HTML.replace("<body>", '<body data-oldlink="1">'), { headers: pageHeaders() });
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

function fileResponse(bytes, filename, type) {
  return new Response(bytes, {
    headers: {
      ...baseHeaders(type),
      "content-disposition": `attachment; filename="export.${filename.split(".").pop()}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function handleStepApi(request, env, url) {
  const db = env.STEP_DB;
  const today = todayJst();
  const path = url.pathname.slice("/step/api".length);
  const method = request.method;

  // ---- ログイン（ログイン前でも使える） ----
  if (method === "POST" && path === "/login") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) throw stepError("FORBIDDEN", 403);
    const body = await readJson(request);
    const loginId = cleanLoginId(body.login_id);
    const password = String(body.password ?? "");
    if (!loginId || !password || password.length > 200) throw stepError("LOGIN_FAILED", 401);
    if (await tooManyFailures(db, loginId)) throw stepError("TOO_MANY_TRIES", 429);
    const user = await db.prepare("SELECT * FROM users WHERE login_id = ?").bind(loginId).first();
    let ok = false;
    if (user && !user.disabled_at) ok = await verifyPassword(password, user);
    else await hashPassword(password, null, hashIter); // 時間差で ID の有無がわからないようにする
    if (!ok) {
      await recordFailure(db, loginId);
      throw stepError("LOGIN_FAILED", 401);
    }
    await clearFailures(db, loginId);
    await db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(nowIso(), user.id).run();
    const s = await createSession(db, user.id);
    return jsonResponse({ ok: true, must_change: Boolean(user.must_change) }, 200, { "set-cookie": sessionCookie(s.token, s.maxAge) });
  }

  const me = await sessionUser(request, db);
  if (method === "POST" && path === "/logout") {
    if (me) await endSession(db, me.tokenHash);
    return jsonResponse({ ok: true }, 200, { "set-cookie": clearCookie() });
  }
  if (!me) throw stepError("LOGIN_REQUIRED", 401);
  if (method !== "GET") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) throw stepError("FORBIDDEN", 403);
    if (request.headers.get("x-step-csrf") !== me.csrf) throw stepError("CSRF", 403);
  }
  if (me.must_change && !(path === "/me" || path === "/password")) throw stepError("MUST_CHANGE_PASSWORD", 403);

  const cfg = await loadConfig(db);
  const role = me.role;
  const isHq = role === "hq";
  const isStaff = role === "hq" || role === "director";
  const viewRole = role === "learner" ? "self" : role === "mentor" ? "mentor" : "nursery";
  const pickNursery = (requested) => {
    if (isHq) {
      const want = String(requested || "");
      const hit = cfg.nurseries.find((n) => n.id === want) || cfg.nurseries.find((n) => n.active) || cfg.nurseries[0];
      return hit ? hit.id : null;
    }
    return me.nursery;
  };
  const requireStaff = () => { if (!isStaff) throw stepError("FORBIDDEN", 403); };
  const requireHq = () => { if (!isHq) throw stepError("FORBIDDEN", 403); };
  const canSee = (l) => l && (isHq || (role === "director" && l.nursery === me.nursery) || (role === "mentor" && l.mentor_user_id === me.id) || (role === "learner" && l.id === me.learner_id));
  const canMentor = (l) => l && (isHq || (role === "director" && l.nursery === me.nursery) || (role === "mentor" && l.mentor_user_id === me.id));
  const learnerFor = async (id) => {
    const l = await getLearner(db, String(role === "learner" ? me.learner_id : id || ""));
    if (!canSee(l)) throw stepError("NOT_FOUND", 404);
    return l;
  };
  const requireActive = (l) => { if (l.status !== "active") throw stepError("LEARNER_NOT_ACTIVE", 409); };

  // ---- 自分の情報 ----
  if (method === "GET" && path === "/me") {
    const visible = isHq ? cfg.nurseries : cfg.nurseries.filter((n) => n.id === me.nursery);
    const base = {
      user: { id: me.id, login_id: me.login_id, name: me.name, role, role_label: ROLES[role], nursery: me.nursery || null, must_change: Boolean(me.must_change) },
      csrf: me.csrf, today, nurseries: visible, settings: { reasons: cfg.reasons, alert_weeks: cfg.alertWeeks }, leftReasons: cfg.reasonMap,
    };
    if (me.must_change) return jsonResponse(base);
    if (role === "learner") {
      const l = await getLearner(db, me.learner_id || "");
      if (!l) throw stepError("LEARNER_GONE", 404);
      return jsonResponse({ ...base, role: "self", ...(await learnerView(db, l, today, cfg)) });
    }
    if (role === "mentor") {
      const rows = (await db.prepare("SELECT * FROM learners WHERE mentor_user_id = ? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, start_date DESC").bind(me.id).all()).results;
      const learners = [];
      for (const l of rows) learners.push(listRow(l, await learnerView(db, l, today, cfg)));
      return jsonResponse({ ...base, role: "mentor", nursery: me.nursery, nursery_name: cfg.nurseryName[me.nursery] || "", learners });
    }
    const nursery = pickNursery(url.searchParams.get("nursery"));
    const checklist = await latestChecklist(db);
    const mentors = (await db.prepare("SELECT id, name, role FROM users WHERE nursery = ? AND role IN ('mentor', 'director') AND disabled_at IS NULL ORDER BY role DESC, name").bind(nursery).all()).results;
    return jsonResponse({ ...base, role: "nursery", nursery, nursery_name: cfg.nurseryName[nursery] || "", checklist, mentors, ...(await nurseryOverview(db, nursery, today, cfg)) });
  }

  // ---- パスワード変更（本人） ----
  if (method === "POST" && path === "/password") {
    const body = await readJson(request);
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(me.id).first();
    if (!(await verifyPassword(String(body.current ?? ""), user))) throw stepError("WRONG_PASSWORD", 400);
    const next = String(body.next ?? "");
    const problem = passwordProblem(next, me.login_id);
    if (problem) throw stepError(problem, 400);
    if (next === String(body.current)) throw stepError("PW_SAME", 400);
    const h = await hashPassword(next, null, hashIter);
    await db.prepare("UPDATE users SET pw_hash = ?, pw_salt = ?, pw_iter = ?, must_change = 0 WHERE id = ?").bind(h.hash, h.salt, h.iterations, me.id).run();
    await endAllSessions(db, me.id, me.tokenHash);
    return jsonResponse({ ok: true });
  }

  const learnerMatch = path.match(/^\/learners\/([0-9a-f]{20})(\/upgrade|\/account)?$/);
  if (method === "GET" && learnerMatch && !learnerMatch[2]) {
    if (role === "learner") throw stepError("FORBIDDEN", 403);
    const l = await learnerFor(learnerMatch[1]);
    let account;
    if (isStaff) {
      const a = await db.prepare("SELECT id, login_id, disabled_at, must_change, last_login_at FROM users WHERE learner_id = ?").bind(l.id).first();
      account = a ? { id: a.id, login_id: a.login_id, disabled: Boolean(a.disabled_at), must_change: Boolean(a.must_change), last_login_at: a.last_login_at || null } : null;
    }
    return jsonResponse({ role: viewRole, today, leftReasons: cfg.reasonMap, account, ...(await learnerView(db, l, today, cfg)) });
  }

  if (method === "POST" && path === "/check") {
    const body = await readJson(request);
    const l = await learnerFor(body.learner_id);
    requireActive(l);
    const action = String(body.action || "");
    if (role === "learner") { if (!["self", "undo_self"].includes(action)) throw stepError("FORBIDDEN", 403); }
    else if (!canMentor(l) || !["mentor", "undo_mentor"].includes(action)) throw stepError("FORBIDDEN", 403);
    const checklist = await checklistVersion(db, l.checklist_version);
    const itemId = String(body.item_id || "");
    if (!checklist.stages.some((s) => s.items.some((i) => i.id === itemId))) throw stepError("ITEM_NOT_FOUND", 404);
    const col = action.endsWith("self") ? "self_at" : "mentor_at";
    const value = action.startsWith("undo") ? null : nowIso();
    await db.batch([
      db.prepare(`INSERT INTO checks (learner_id, item_id, ${col}) VALUES (?, ?, ?) ON CONFLICT(learner_id, item_id) DO UPDATE SET ${col} = excluded.${col}`).bind(l.id, itemId, value),
      db.prepare("INSERT INTO check_log (learner_id, item_id, actor, action, at) VALUES (?, ?, ?, ?, ?)").bind(l.id, itemId, `${role}:${me.id}`, action, nowIso()),
    ]);
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/review") {
    const body = await readJson(request);
    const l = await learnerFor(body.learner_id);
    requireActive(l);
    if (role !== "learner" && !canMentor(l)) throw stepError("FORBIDDEN", 403);
    const checklist = await checklistVersion(db, l.checklist_version);
    const stageId = String(body.stage_id || "");
    if (!checklist.stages.some((s) => s.id === stageId)) throw stepError("STAGE_NOT_FOUND", 404);
    await db.prepare("INSERT OR IGNORE INTO reviews (learner_id, stage_id) VALUES (?, ?)").bind(l.id, stageId).run();
    if (role === "learner") {
      await db.prepare("UPDATE reviews SET self_note = ? WHERE learner_id = ? AND stage_id = ?").bind(cleanNote(body.note), l.id, stageId).run();
    } else {
      const metOn = body.met_on === null || body.met_on === "" ? null : String(body.met_on);
      if (metOn !== null && (!isDate(metOn) || metOn > today)) throw stepError("BAD_DATE", 400);
      await db.prepare("UPDATE reviews SET met_on = ?, mentor_note = ? WHERE learner_id = ? AND stage_id = ?").bind(metOn, cleanNote(body.note), l.id, stageId).run();
    }
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/mood") {
    if (role !== "learner") throw stepError("FORBIDDEN", 403);
    const body = await readJson(request);
    const level = Number(body.level);
    if (![1, 2, 3].includes(level)) throw stepError("BAD_LEVEL", 400);
    const l = await learnerFor();
    requireActive(l);
    await db.prepare("INSERT INTO moods (learner_id, week, level) VALUES (?, ?, ?) ON CONFLICT(learner_id, week) DO UPDATE SET level = excluded.level").bind(l.id, mondayOf(today), level).run();
    return jsonResponse({ ok: true });
  }

  // ---- 新人の登録・管理（園長・本部） ----
  const mentorFor = async (nursery, mentorUserId) => {
    if (!mentorUserId) return { id: null, name: "" };
    const m = await db.prepare("SELECT id, name, nursery, role FROM users WHERE id = ? AND disabled_at IS NULL").bind(String(mentorUserId)).first();
    if (!m || m.nursery !== nursery || !["mentor", "director"].includes(m.role)) throw stepError("BAD_MENTOR", 400);
    return m;
  };

  if (method === "POST" && path === "/learners") {
    requireStaff();
    const body = await readJson(request);
    const nursery = pickNursery(body.nursery);
    if (!nursery) throw stepError("NO_NURSERY", 400);
    const name = cleanName(body.display_name);
    if (!name) throw stepError("NAME_REQUIRED", 400);
    if (!isDate(body.start_date)) throw stepError("BAD_DATE", 400);
    const employment = body.employment === "parttime" ? "parttime" : "fulltime";
    const count = await db.prepare("SELECT COUNT(*) AS n FROM learners WHERE nursery = ?").bind(nursery).first();
    if (count.n >= 500) throw stepError("TOO_MANY_LEARNERS", 409);
    const mentor = await mentorFor(nursery, body.mentor_user_id);
    const latest = await latestChecklist(db);
    const id = randomId();
    await db.prepare("INSERT INTO learners (id, nursery, display_name, employment, start_date, mentor_name, mentor_user_id, checklist_version, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)")
      .bind(id, nursery, name, employment, body.start_date, mentor.name || cleanName(body.mentor_name), mentor.id, latest.version, nowIso()).run();
    let account = null;
    if (body.no_account !== true) {
      try {
        account = await createAccount(db, { loginId: body.login_id, name, role: "learner", nursery, learnerId: id });
      } catch (error) {
        await db.prepare("DELETE FROM learners WHERE id = ?").bind(id).run();
        throw error;
      }
    }
    return jsonResponse({ ok: true, id, account });
  }

  if (learnerMatch && method === "POST" && learnerMatch[2] === "/account") {
    requireStaff();
    const l = await learnerFor(learnerMatch[1]);
    const has = await db.prepare("SELECT id FROM users WHERE learner_id = ?").bind(l.id).first();
    if (has) throw stepError("ACCOUNT_EXISTS", 409);
    const body = await readJson(request);
    return jsonResponse({ ok: true, account: await createAccount(db, { loginId: body.login_id, name: l.display_name, role: "learner", nursery: l.nursery, learnerId: l.id }) });
  }

  if (learnerMatch && method === "PATCH" && !learnerMatch[2]) {
    requireStaff();
    const l = await learnerFor(learnerMatch[1]);
    const body = await readJson(request);
    const next = { ...l };
    if (body.display_name !== undefined) { next.display_name = cleanName(body.display_name); if (!next.display_name) throw stepError("NAME_REQUIRED", 400); }
    if (body.mentor_user_id !== undefined) {
      const m = await mentorFor(l.nursery, body.mentor_user_id);
      next.mentor_user_id = m.id;
      next.mentor_name = m.name || "";
    } else if (body.mentor_name !== undefined) next.mentor_name = cleanName(body.mentor_name);
    if (body.start_date !== undefined) { if (!isDate(body.start_date)) throw stepError("BAD_DATE", 400); next.start_date = body.start_date; }
    if (body.employment !== undefined) next.employment = body.employment === "parttime" ? "parttime" : "fulltime";
    if (body.status !== undefined) {
      if (!["active", "completed", "left"].includes(body.status)) throw stepError("BAD_STATUS", 400);
      next.status = body.status;
      if (body.status === "left") {
        const leftDate = body.left_date ? String(body.left_date) : today;
        if (!isDate(leftDate)) throw stepError("BAD_DATE", 400);
        next.left_date = leftDate;
        next.left_stage = l.status === "left" && l.left_stage ? l.left_stage : await currentStageTitle(db, l, leftDate < today ? leftDate : today, cfg);
      } else {
        next.left_date = null;
        next.left_stage = null;
        next.left_reason = null;
        next.left_note = null;
      }
    }
    if (next.status === "left") {
      if (body.left_reason !== undefined) {
        if (body.left_reason !== null && !cfg.reasonMap[body.left_reason]) throw stepError("BAD_REASON", 400);
        next.left_reason = body.left_reason;
      }
      if (body.left_note !== undefined) next.left_note = cleanNote(body.left_note).slice(0, 100);
      if (body.status === undefined && body.left_date !== undefined) {
        if (!isDate(body.left_date)) throw stepError("BAD_DATE", 400);
        next.left_date = body.left_date;
      }
    }
    await db.prepare("UPDATE learners SET display_name = ?, mentor_name = ?, mentor_user_id = ?, start_date = ?, employment = ?, status = ?, left_date = ?, left_stage = ?, left_reason = ?, left_note = ? WHERE id = ?")
      .bind(next.display_name, next.mentor_name, next.mentor_user_id || null, next.start_date, next.employment, next.status, next.left_date, next.left_stage, next.left_reason || null, next.left_note || null, l.id).run();
    // 退職したら新人のログインを止める。受け入れ中・修了に戻したら使えるようにする。
    const acct = await db.prepare("SELECT id FROM users WHERE learner_id = ?").bind(l.id).first();
    if (acct) {
      if (next.status === "left") {
        await db.prepare("UPDATE users SET disabled_at = COALESCE(disabled_at, ?), name = ? WHERE id = ?").bind(nowIso(), next.display_name, acct.id).run();
        await endAllSessions(db, acct.id);
      } else {
        await db.prepare("UPDATE users SET disabled_at = NULL, name = ? WHERE id = ?").bind(next.display_name, acct.id).run();
      }
    }
    return jsonResponse({ ok: true });
  }

  if (learnerMatch && method === "POST" && learnerMatch[2] === "/upgrade") {
    requireStaff();
    const l = await learnerFor(learnerMatch[1]);
    const latest = await latestChecklist(db);
    await db.prepare("UPDATE learners SET checklist_version = ? WHERE id = ?").bind(latest.version, l.id).run();
    return jsonResponse({ ok: true, version: latest.version });
  }

  if (method === "PUT" && path === "/checklist") {
    requireStaff();
    const body = await readJson(request);
    const clean = body.reset === true ? validateChecklist(defaultChecklist) : validateChecklist(body);
    const latest = await latestChecklist(db);
    if (body.reset !== true && Number(body.base_version) !== latest.version) throw stepError("CHECKLIST_CHANGED", 409);
    const version = latest.version + 1;
    await db.prepare("INSERT INTO checklists (version, json, created_at) VALUES (?, ?, ?)").bind(version, JSON.stringify(clean), nowIso()).run();
    return jsonResponse({ ok: true, version });
  }

  // ---- ID の管理 ----
  const accountMatch = path.match(/^\/accounts\/([0-9a-f]{20})(\/reset)?$/);
  const canManage = (u) => {
    if (!u) return false;
    if (isHq) return true;
    return role === "director" && u.nursery === me.nursery && ["mentor", "learner"].includes(u.role);
  };

  if (method === "GET" && path === "/accounts") {
    requireStaff();
    const nursery = isHq ? url.searchParams.get("nursery") : me.nursery;
    const rows = isHq && !nursery
      ? (await db.prepare("SELECT * FROM users ORDER BY CASE role WHEN 'hq' THEN 0 WHEN 'director' THEN 1 WHEN 'mentor' THEN 2 ELSE 3 END, nursery, login_id").all()).results
      : (await db.prepare("SELECT * FROM users WHERE nursery = ? OR (? = 1 AND role = 'hq') ORDER BY CASE role WHEN 'hq' THEN 0 WHEN 'director' THEN 1 WHEN 'mentor' THEN 2 ELSE 3 END, login_id").bind(nursery, isHq ? 1 : 0).all()).results;
    return jsonResponse({ accounts: rows.map((u) => ({ ...publicUser(u), manageable: canManage(u) && u.id !== me.id })) });
  }

  if (method === "POST" && path === "/accounts") {
    requireStaff();
    const body = await readJson(request);
    const want = String(body.role || "");
    if (!["hq", "director", "mentor"].includes(want)) throw stepError("BAD_ROLE", 400);
    if (!isHq && want !== "mentor") throw stepError("FORBIDDEN", 403);
    let nursery = null;
    if (want !== "hq") {
      nursery = isHq ? String(body.nursery || "") : me.nursery;
      if (!cfg.nurseryName[nursery]) throw stepError("NO_NURSERY", 400);
    }
    const name = cleanName(body.name);
    if (!name) throw stepError("NAME_REQUIRED", 400);
    return jsonResponse({ ok: true, account: await createAccount(db, { loginId: body.login_id, name, role: want, nursery }) });
  }

  if (accountMatch && method === "POST" && accountMatch[2] === "/reset") {
    const u = await db.prepare("SELECT * FROM users WHERE id = ?").bind(accountMatch[1]).first();
    if (!canManage(u) || u.id === me.id) throw stepError("FORBIDDEN", 403);
    return jsonResponse({ ok: true, account: { login_id: u.login_id, temp_password: await resetAccount(db, u.id) } });
  }

  if (accountMatch && method === "PATCH" && !accountMatch[2]) {
    const u = await db.prepare("SELECT * FROM users WHERE id = ?").bind(accountMatch[1]).first();
    if (!canManage(u) || u.id === me.id) throw stepError("FORBIDDEN", 403);
    const body = await readJson(request);
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (!name) throw stepError("NAME_REQUIRED", 400);
      await db.prepare("UPDATE users SET name = ? WHERE id = ?").bind(name, u.id).run();
      if (u.role === "mentor" || u.role === "director") await db.prepare("UPDATE learners SET mentor_name = ? WHERE mentor_user_id = ?").bind(name, u.id).run();
      if (u.role === "learner" && u.learner_id) await db.prepare("UPDATE learners SET display_name = ? WHERE id = ?").bind(name, u.learner_id).run();
    }
    if (body.disabled !== undefined) {
      if (body.disabled) {
        if (u.role === "hq") {
          const others = await db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'hq' AND disabled_at IS NULL AND id <> ?").bind(u.id).first();
          if (!others.n) throw stepError("LAST_HQ", 409);
        }
        await db.prepare("UPDATE users SET disabled_at = ? WHERE id = ?").bind(nowIso(), u.id).run();
        await endAllSessions(db, u.id);
      } else {
        await db.prepare("UPDATE users SET disabled_at = NULL WHERE id = ?").bind(u.id).run();
      }
    }
    return jsonResponse({ ok: true });
  }

  // ---- 本部の設定 ----
  if (method === "PUT" && path === "/settings") {
    requireHq();
    const body = await readJson(request);
    const stmts = [];
    if (body.reasons !== undefined) stmts.push(db.prepare("INSERT INTO settings (key, value) VALUES ('reasons', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(cleanReasons(body.reasons))));
    if (body.alert_weeks !== undefined) {
      const w = Number(body.alert_weeks);
      if (!Number.isInteger(w) || w < 1 || w > 8) throw stepError("BAD_WEEKS", 400);
      stmts.push(db.prepare("INSERT INTO settings (key, value) VALUES ('alert_weeks', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(String(w)));
    }
    if (stmts.length) await db.batch(stmts);
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/nurseries") {
    requireHq();
    const body = await readJson(request);
    const name = cleanName(body.name);
    if (!name) throw stepError("NAME_REQUIRED", 400);
    if (cfg.nurseries.length >= 30) throw stepError("TOO_MANY_NURSERIES", 409);
    const id = `n${randomId(3)}`;
    await db.prepare("INSERT INTO nurseries (id, name, sort, active, created_at) VALUES (?, ?, ?, 1, ?)").bind(id, name, cfg.nurseries.length + 1, nowIso()).run();
    return jsonResponse({ ok: true, id });
  }

  const nurseryMatch = path.match(/^\/nurseries\/([a-z0-9]{2,20})$/);
  if (nurseryMatch && method === "PATCH") {
    requireHq();
    if (!cfg.nurseryName[nurseryMatch[1]]) throw stepError("NOT_FOUND", 404);
    const body = await readJson(request);
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (!name) throw stepError("NAME_REQUIRED", 400);
      await db.prepare("UPDATE nurseries SET name = ? WHERE id = ?").bind(name, nurseryMatch[1]).run();
    }
    if (body.active !== undefined) await db.prepare("UPDATE nurseries SET active = ? WHERE id = ?").bind(body.active ? 1 : 0, nurseryMatch[1]).run();
    return jsonResponse({ ok: true });
  }

  // ---- 自己研修 ----
  if (method === "GET" && path === "/study") {
    let items;
    if (role === "learner" || role === "mentor" || role === "director") {
      items = (await db.prepare("SELECT * FROM study_items WHERE scope = 'all' OR (scope = 'nursery' AND nursery = ?) ORDER BY updated_at DESC").bind(me.nursery).all()).results;
    } else {
      const nursery = pickNursery(url.searchParams.get("nursery"));
      items = (await db.prepare("SELECT * FROM study_items WHERE scope = 'all' OR (scope = 'nursery' AND nursery = ?) ORDER BY updated_at DESC").bind(nursery).all()).results;
    }
    const progress = role === "learner"
      ? (await db.prepare("SELECT item_key, done_at, memo FROM study_progress WHERE learner_id = ?").bind(me.learner_id).all()).results
      : [];
    return jsonResponse({
      categories: STUDY_CATEGORIES,
      items: items.map((i) => ({ id: i.id, scope: i.scope, nursery: i.nursery, kind: i.kind, category: i.category, url: i.url, video_id: i.video_id || "", title: i.title, note: i.note || "", created_at: i.created_at, updated_at: i.updated_at, editable: isHq || (role === "director" && i.scope === "nursery" && i.nursery === me.nursery) })),
      progress: Object.fromEntries(progress.map((p) => [p.item_key, { done_at: p.done_at, memo: p.memo || "" }])),
    });
  }

  const studyMatch = path.match(/^\/study\/items\/([0-9a-f]{20})$/);
  if (method === "POST" && path === "/study/items") {
    requireStaff();
    const body = await readJson(request);
    const parsed = parseStudyUrl(body.url);
    if (!parsed) throw stepError("BAD_URL", 400);
    const title = cleanNote(body.title).slice(0, 80);
    if (!title) throw stepError("TITLE_REQUIRED", 400);
    const category = STUDY_CATEGORIES[body.category] ? body.category : (parsed.videoId ? "skill" : "other");
    const scope = isHq && body.scope === "all" ? "all" : "nursery";
    const nursery = scope === "all" ? null : pickNursery(body.nursery);
    const count = await db.prepare("SELECT COUNT(*) AS n FROM study_items").first();
    if (count.n >= 1000) throw stepError("TOO_MANY_ITEMS", 409);
    const id = randomId();
    await db.prepare("INSERT INTO study_items (id, scope, nursery, kind, category, url, video_id, title, note, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, scope, nursery, parsed.videoId ? "video" : "link", category, parsed.url, parsed.videoId, title, cleanNote(body.note).slice(0, 200), me.id, nowIso(), nowIso()).run();
    return jsonResponse({ ok: true, id });
  }

  if (studyMatch && (method === "PATCH" || method === "DELETE")) {
    requireStaff();
    const item = await db.prepare("SELECT * FROM study_items WHERE id = ?").bind(studyMatch[1]).first();
    if (!item || !(isHq || (item.scope === "nursery" && item.nursery === me.nursery))) throw stepError("NOT_FOUND", 404);
    if (method === "DELETE") {
      await db.batch([
        db.prepare("DELETE FROM study_items WHERE id = ?").bind(item.id),
        db.prepare("DELETE FROM study_progress WHERE item_key = ?").bind(`item:${item.id}`),
      ]);
      return jsonResponse({ ok: true });
    }
    const body = await readJson(request);
    let url2 = item.url, vid = item.video_id, kind = item.kind;
    if (body.url !== undefined) {
      const parsed = parseStudyUrl(body.url);
      if (!parsed) throw stepError("BAD_URL", 400);
      url2 = parsed.url; vid = parsed.videoId; kind = parsed.videoId ? "video" : "link";
    }
    const title = body.title !== undefined ? cleanNote(body.title).slice(0, 80) : item.title;
    if (!title) throw stepError("TITLE_REQUIRED", 400);
    const category = body.category !== undefined && STUDY_CATEGORIES[body.category] ? body.category : item.category;
    const note = body.note !== undefined ? cleanNote(body.note).slice(0, 200) : item.note;
    await db.prepare("UPDATE study_items SET url = ?, video_id = ?, kind = ?, title = ?, category = ?, note = ?, updated_at = ? WHERE id = ?")
      .bind(url2, vid, kind, title, category, note, nowIso(), item.id).run();
    return jsonResponse({ ok: true });
  }

  if (method === "POST" && path === "/study/progress") {
    if (role !== "learner") throw stepError("FORBIDDEN", 403);
    const body = await readJson(request);
    const key = String(body.key || "");
    if (!/^(item:[0-9a-f]{20}|guide:[1-5])$/.test(key)) throw stepError("BAD_KEY", 400);
    const doneAt = body.done ? nowIso() : null;
    await db.prepare("INSERT INTO study_progress (learner_id, item_key, done_at, memo) VALUES (?, ?, ?, ?) ON CONFLICT(learner_id, item_key) DO UPDATE SET done_at = excluded.done_at, memo = excluded.memo")
      .bind(me.learner_id, key, doneAt, cleanNote(body.memo)).run();
    return jsonResponse({ ok: true });
  }

  // ---- 書き出し（Excel・Word） ----
  const exportLearner = path.match(/^\/export\/learner\/([0-9a-f]{20})\.(xlsx|docx)$/);
  if (method === "GET" && exportLearner) {
    const l = await learnerFor(exportLearner[1]);
    const v = await learnerView(db, l, today, cfg);
    const name = `ステップアップ表_${l.display_name}_${today}.${exportLearner[2]}`;
    return exportLearner[2] === "xlsx" ? fileResponse(learnerXlsx(v), name, XLSX) : fileResponse(learnerDocx(v), name, DOCX);
  }
  const exportChecklist = path.match(/^\/export\/checklist\.(xlsx|docx)$/);
  if (method === "GET" && exportChecklist) {
    requireStaff();
    const cl = await latestChecklist(db);
    const name = `ステップアップ表_項目一覧_版${cl.version}.${exportChecklist[1]}`;
    return exportChecklist[1] === "xlsx" ? fileResponse(checklistXlsx(cl), name, XLSX) : fileResponse(checklistDocx(cl), name, DOCX);
  }
  if (method === "GET" && path === "/export/analytics.xlsx") {
    requireStaff();
    const nursery = pickNursery(url.searchParams.get("nursery"));
    const o = await nurseryOverview(db, nursery, today, cfg);
    return fileResponse(analyticsXlsx(cfg.nurseryName[nursery] || "", o.analytics, cfg.reasonMap), `退職の分析_${cfg.nurseryName[nursery] || nursery}_${today}.xlsx`, XLSX);
  }

  throw stepError("NOT_FOUND", 404);
}

/* ---------- 本部の管理画面 /admin/step（既存の管理ログイン・CSRF の内側で呼ばれる） ---------- */

export async function renderStepAdmin(request, env, session, helpers, issued = null) {
  const { adminStyles, securityHeaders, escapeHtml } = helpers;
  let body;
  if (!env.STEP_DB) {
    body = `<div class="notice error">D1（STEP_DB）がまだ設定されていません。</div>`;
  } else {
    await ensureSchema(env);
    const db = env.STEP_DB;
    const hq = (await db.prepare("SELECT * FROM users WHERE role = 'hq' ORDER BY created_at").all()).results;
    const origin = new URL(request.url).origin;
    const rows = hq.map((u) => `<li><b>${escapeHtml(u.name)}</b>（ID：<code>${escapeHtml(u.login_id)}</code>）${u.disabled_at ? "・停止中" : ""}${u.last_login_at ? `・最後のログイン ${escapeHtml(u.last_login_at.slice(0, 10))}` : "・まだログインしていません"}
      <form method="post" action="/admin/step/hq" style="display:inline"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><input type="hidden" name="action" value="reset"><input type="hidden" name="user_id" value="${escapeHtml(u.id)}"><button class="publish" type="submit" style="font-size:12px;padding:4px 10px">仮パスワードを発行</button></form></li>`).join("");
    const issuedBox = issued
      ? `<div class="notice"><b>本部ID：<code>${escapeHtml(issued.login_id)}</code>　仮パスワード：<code>${escapeHtml(issued.temp_password)}</code></b><br>この画面を閉じると、仮パスワードは二度と表示されません。<a href="${escapeHtml(origin)}/step/">${escapeHtml(origin)}/step/</a> でログインし、最初にパスワードを変えてください。</div>`
      : "";
    body = `<section><h2>本部のID</h2>${issuedBox}${rows ? `<ul>${rows}</ul>` : "<p>まだありません。最初の本部IDを発行してください。</p>"}
      <form method="post" action="/admin/step/hq"><input type="hidden" name="csrf" value="${escapeHtml(session.csrf)}"><input type="hidden" name="action" value="create">
      <label>名前<br><input name="name" maxlength="20" required style="width:100%;padding:8px;border:1px solid #cbd7d5;border-radius:8px"></label><br>
      <label>ログインID（英小文字・数字・ - . _ 、3〜30文字）<br><input name="login_id" maxlength="30" pattern="[a-z0-9][a-z0-9._\\-]{2,29}" required style="width:100%;padding:8px;border:1px solid #cbd7d5;border-radius:8px"></label><br><br>
      <button class="publish" type="submit">本部IDを発行</button></form>
      <p>園長・指導役・新人のIDは、本部IDでログインしてから「設定」で作れます。</p></section>`;
  }
  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ステップアップ表の管理</title><style>${adminStyles()}</style></head><body><main><section><span class="eyebrow">TRIO CAREER</span><h1>中途採用者のステップアップ表</h1><p>ステップアップ表は ID とパスワードでログインします（<a href="/step/">/step/</a>）。ここでは最初の本部IDの発行と、本部IDの仮パスワード再発行ができます。<a href="/admin">管理画面へ戻る</a></p></section>${body}</main></body></html>`;
  return new Response(html, { headers: { ...securityHeaders(), "x-robots-tag": "noindex, nofollow" } });
}

export async function issueHqAdmin(request, form, env, session, helpers) {
  if (!env.STEP_DB) throw stepError("STEP_DB_NOT_CONFIGURED", 503);
  await ensureSchema(env);
  const db = env.STEP_DB;
  const action = String(form.get("action") || "");
  if (action === "create") {
    const loginId = String(form.get("login_id") || "");
    if (!cleanLoginId(loginId)) throw stepError("ログインIDは英小文字・数字・「-」「.」「_」で3〜30文字にしてください", 400);
    if (!cleanName(form.get("name"))) throw stepError("名前を入れてください", 400);
    let account;
    try {
      account = await createAccount(db, { loginId, name: String(form.get("name") || ""), role: "hq" });
    } catch (error) {
      if (error.message === "LOGIN_ID_TAKEN") throw stepError("そのログインIDはもう使われています", 409);
      throw error;
    }
    return renderStepAdmin(request, env, session, helpers, account);
  }
  if (action === "reset") {
    const u = await db.prepare("SELECT * FROM users WHERE id = ? AND role = 'hq'").bind(String(form.get("user_id") || "")).first();
    if (!u) throw stepError("見つかりません", 404);
    await db.prepare("UPDATE users SET disabled_at = NULL WHERE id = ?").bind(u.id).run();
    return renderStepAdmin(request, env, session, helpers, { login_id: u.login_id, temp_password: await resetAccount(db, u.id) });
  }
  throw stepError("操作が正しくありません", 400);
}

// テストで使う
export const _internal = { SESSION_COOKIE, PBKDF2_ITERATIONS, randomToken };
