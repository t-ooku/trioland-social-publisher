// ステップアップ（/step/）のテスト。
//   1. 段階の計算（入社当日・月末・うるう年・遅れ・達成）
//   2. 権限（本人は確認できない・他人を読めない・失効は 404・園長は他の園を見られない）
//   3. noindex・トークンはハッシュだけ保存・レート制限
// D1 の代わりに Node 組み込みの SQLite に migrations/0001_step.sql をそのまま入れて動かす。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import checklist from "../content/step_checklist.json" with { type: "json" };
import {
  addDays,
  buildProgress,
  checklistToText,
  dayNumber,
  retentionStats,
  summarizeMoods,
  targetDate,
  textToChecklist,
  todayJst,
  validateChecklist,
  weekMonday,
} from "../src/step_logic.js";
import { handleStepAdminGet, handleStepAdminPost, handleStepRequest } from "../src/step.js";
import { encodeQr, qrSvg } from "../src/step_qr.js";

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

// ---------- 1. 日付と段階の計算 ----------

await test("目標日は入社日を1日目として数える", () => {
  assert.equal(targetDate("2026-11-01", 7), "2026-11-07");
  assert.equal(targetDate("2026-11-01", 1), "2026-11-01");
  assert.equal(dayNumber("2026-11-01", "2026-11-01"), 1);
  assert.equal(dayNumber("2026-11-01", "2026-10-31"), 0);
  assert.equal(dayNumber("2026-11-01", "2026-11-23"), 23);
});

await test("月末・年末・うるう年", () => {
  assert.equal(targetDate("2026-01-31", 7), "2026-02-06");
  assert.equal(targetDate("2026-12-28", 7), "2027-01-03");
  assert.equal(targetDate("2028-02-25", 7), "2028-03-02"); // 2028 はうるう年（2/29 あり）
  assert.equal(targetDate("2027-02-25", 7), "2027-03-03");
  assert.equal(targetDate("2028-02-29", 180), "2028-08-26");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(addDays("2100-02-28", 1), "2100-03-01"); // 2100 はうるう年ではない
});

await test("週の月曜日", () => {
  assert.equal(weekMonday("2026-11-07"), "2026-11-02"); // 土曜
  assert.equal(weekMonday("2026-11-08"), "2026-11-02"); // 日曜
  assert.equal(weekMonday("2026-11-09"), "2026-11-09"); // 月曜
  assert.equal(weekMonday("2027-01-01"), "2026-12-28");
});

await test("日本時間の今日", () => {
  assert.equal(todayJst(new Date("2026-11-06T14:59:59Z")), "2026-11-06");
  assert.equal(todayJst(new Date("2026-11-06T15:00:00Z")), "2026-11-07");
});

const learner = { start_date: "2026-11-01" };
const allItems = (ids) => checklist.stages.filter((s) => ids.includes(s.id)).flatMap((s) => s.items.map((i) => ({ item_id: i.id, self_at: null, mentor_at: "2026-11-05T00:00:00Z" })));

await test("入社当日：いまの段階は1週間、遅れなし", () => {
  const p = buildProgress({ learner, checklist, today: "2026-11-01" });
  assert.equal(p.day, 1);
  assert.equal(p.nowStageId, "d7");
  assert.equal(p.stages[0].state, "now");
  assert.equal(p.stages[0].target, "2026-11-07");
  assert.equal(p.flags.late, false);
  assert.equal(p.next.length, 3);
  assert.equal(p.next[0].item_id, "d7-1");
});

await test("目標日当日はまだ遅れではない・翌日から遅れ", () => {
  assert.equal(buildProgress({ learner, checklist, today: "2026-11-07" }).stages[0].state, "now");
  const p = buildProgress({ learner, checklist, today: "2026-11-08" });
  assert.equal(p.stages[0].state, "late");
  assert.equal(p.nowStageId, "d10");
  assert.equal(p.stages[1].state, "now");
  assert.equal(p.flags.late, true);
});

await test("全項目を確認しても面談が済むまでは達成にならない", () => {
  const checks = allItems(["d7"]);
  let p = buildProgress({ learner, checklist, checks, today: "2026-11-05" });
  assert.equal(p.stages[0].done, false);
  assert.equal(p.stages[0].reviewDue, true);
  p = buildProgress({ learner, checklist, checks, reviews: [{ stage_id: "d7", met_on: "2026-11-05" }], today: "2026-11-05" });
  assert.equal(p.stages[0].state, "done");
  assert.equal(p.nowStageId, "d10");
  assert.equal(p.doneStages, 1);
});

await test("本人の「できた」だけでは確認済みにならない", () => {
  const checks = [{ item_id: "d7-1", self_at: "2026-11-02T00:00:00Z", mentor_at: null }];
  const p = buildProgress({ learner, checklist, checks, today: "2026-11-02" });
  assert.equal(p.stages[0].confirmed, 0);
  assert.equal(p.next[0].self_at, "2026-11-02T00:00:00Z");
});

await test("入社23日目・前の段階を達成していれば「30日」が今", () => {
  const checks = allItems(["d7", "d10"]);
  const reviews = [{ stage_id: "d7", met_on: "2026-11-07" }, { stage_id: "d10", met_on: "2026-11-10" }];
  const p = buildProgress({ learner, checklist, checks, reviews, today: "2026-11-23" });
  assert.equal(p.day, 23);
  assert.equal(p.nowStageId, "d30");
  assert.equal(p.nowStageTheme, "時間帯をまかされる");
  assert.equal(p.flags.late, false);
  assert.deepEqual(p.stages.map((s) => s.state), ["done", "done", "now", "upcoming", "upcoming", "upcoming", "upcoming"]);
});

await test("前倒しで達成したら次の段階が今になる", () => {
  const checks = allItems(["d7"]);
  const p = buildProgress({ learner, checklist, checks, reviews: [{ stage_id: "d7", met_on: "2026-11-03" }], today: "2026-11-03" });
  assert.equal(p.nowStageId, "d10");
});

await test("6ヶ月を過ぎて未達成なら最初の未達成が今（遅れ）", () => {
  const p = buildProgress({ learner, checklist, today: "2027-06-01" });
  assert.equal(p.nowStageId, "d7");
  assert.ok(p.stages.every((s) => s.state === "late"));
});

await test("全段階達成で completed", () => {
  const checks = allItems(checklist.stages.map((s) => s.id));
  const reviews = checklist.stages.map((s) => ({ stage_id: s.id, met_on: "2027-04-01" }));
  const p = buildProgress({ learner, checklist, checks, reviews, today: "2027-04-30" });
  assert.equal(p.completed, true);
  assert.equal(p.nowStageId, null);
  assert.equal(p.next.length, 0);
  assert.equal(p.confirmedItems, 42);
});

await test("「つらい」が2週続いたら印", () => {
  const today = "2026-11-18"; // 週 = 11/16
  assert.equal(summarizeMoods([{ week: "2026-11-16", level: 3 }, { week: "2026-11-09", level: 3 }], today).alert, true);
  assert.equal(summarizeMoods([{ week: "2026-11-09", level: 3 }, { week: "2026-11-02", level: 3 }], today).alert, true); // 先週まで2週
  assert.equal(summarizeMoods([{ week: "2026-11-16", level: 3 }, { week: "2026-11-09", level: 2 }], today).alert, false);
  assert.equal(summarizeMoods([{ week: "2026-11-16", level: 3 }, { week: "2026-11-02", level: 3 }], today).alert, false); // 連続していない
  assert.equal(summarizeMoods([{ week: "2026-11-02", level: 3 }, { week: "2026-10-26", level: 3 }], today).alert, false); // 古い
  assert.equal(summarizeMoods([{ week: "2026-11-16", level: 3 }], today).alert, false);
  assert.equal(summarizeMoods([{ week: "2026-11-16", level: 2 }], today).thisWeek, 2);
});

await test("定着率と辞めた時期の集計", () => {
  const rows = [
    { start_date: "2026-01-01", status: "left", left_date: "2026-01-20", left_stage: "d30" }, // 20日目
    { start_date: "2026-01-01", status: "left", left_date: "2026-03-15", left_stage: "d60" }, // 74日目
    { start_date: "2026-01-01", status: "active" },
    { start_date: "2026-10-20", status: "active" },
  ];
  const stats = retentionStats(rows, "2026-11-07", checklist);
  assert.equal(stats.leftTotal, 2);
  assert.equal(stats.byTenure.find((b) => b.limit === 30).count, 1);
  assert.equal(stats.byTenure.find((b) => b.limit === 90).count, 1);
  assert.equal(stats.byStage.find((s) => s.id === "d30").count, 1);
  const r30 = stats.retention.find((r) => r.days === 30);
  assert.deepEqual([r30.eligible, r30.stayed], [3, 2]); // 10/20 入社は 19日目なので対象外
  const r90 = stats.retention.find((r) => r.days === 90);
  assert.deepEqual([r90.eligible, r90.stayed], [3, 1]);
});

await test("チェック項目の初期値は正しい形・42項目", () => {
  assert.deepEqual(validateChecklist(checklist), []);
  assert.equal(checklist.stages.length, 7);
  assert.equal(checklist.stages.flatMap((s) => s.items).length, 42);
});

await test("チェック項目の編集（テキスト ⇔ JSON）", () => {
  const text = checklistToText(checklist);
  const back = textToChecklist(text, checklist);
  assert.deepEqual(back.errors, []);
  assert.deepEqual(back.checklist, checklist);
  // 追加・並べ替え・文言修正
  const edited = text.replace("- d7-2 |", "- 新しく足した項目\n- d7-2 |").replace("クラスの子どもの名前と顔が一致する", "子どもの名前と顔が一致する");
  const result = textToChecklist(edited, checklist);
  assert.deepEqual(result.errors, []);
  const d7 = result.checklist.stages[0];
  assert.equal(d7.items[1].text, "新しく足した項目");
  assert.match(d7.items[1].id, /^d7-n\d+$/);
  assert.equal(d7.items[0].text, "子どもの名前と顔が一致する");
  assert.equal(d7.items[0].id, "d7-1");
  // 日数が逆順ならエラー
  assert.ok(textToChecklist(text.replace("## d10 | 10 |", "## d10 | 5 |"), checklist).errors.length > 0);
  assert.ok(textToChecklist(text.replace("- d10-1 |", "- d7-1 |"), checklist).errors.some((e) => e.includes("重複")));
});

await test("QR は型番内に収まる", () => {
  const link = `https://trioland-social-publisher.mygate-jp.workers.dev/step/s/${"A".repeat(43)}`;
  const qr = encodeQr(link);
  assert.ok(qr.version <= 10);
  assert.equal(qr.size, qr.version * 4 + 17);
  assert.match(qrSvg(link), /^<svg [^>]*viewBox/);
  assert.doesNotMatch(qrSvg(link), /https?:\/\/(?!www\.w3\.org)/);
});

// ---------- 2. D1 の代わり ----------

function createD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../migrations/0001_step.sql", import.meta.url), "utf8"));
  const wrap = (sql, args = []) => ({
    sql,
    args,
    bind(...values) {
      return wrap(sql, values);
    },
    async first() {
      return sqlite.prepare(sql).get(...args) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...args) };
    },
    async run() {
      sqlite.prepare(sql).run(...args);
      return { success: true };
    },
  });
  return {
    sqlite,
    prepare: (sql) => wrap(sql),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) sqlite.prepare(s.sql).run(...s.args);
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
      return [];
    },
  };
}

const ORIGIN = "https://step.test";
const env = { STEP_DB: createD1() };
const session = { csrf: "csrf-test" };
const h = { escapeHtml: (v) => String(v) };

async function adminPost(path, fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return handleStepAdminPost(new Request(`${ORIGIN}${path}`, { method: "POST" }), form, env, session, h);
}

async function register(fields) {
  const res = await adminPost("/admin/step/learners", fields);
  assert.equal(res.status, 303);
  return res.headers.get("location").match(/\/admin\/step\/l\/([a-f0-9]{32})/)[1];
}

async function issue(path, fields = {}) {
  const res = await adminPost(path, fields);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /<svg /);
  const m = body.match(/\/step\/([smn])\/([A-Za-z0-9_-]{43})/);
  return m[2];
}

const page = (path) => handleStepRequest(new Request(`${ORIGIN}${path}`), env);
const api = (name, token, { method = "GET", body, query = "" } = {}) => handleStepRequest(new Request(`${ORIGIN}/step/api/${name}${query}`, {
  method,
  headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body ? { "content-type": "application/json" } : {}) },
  body: body ? JSON.stringify(body) : undefined,
}), env);

const start = addDays(todayJst(), -9); // 入社10日目
const hanako = await register({ display_name: "テスト 花子", nursery: "komazawa", employment: "fulltime", start_date: start, mentor_name: "テスト 指導" });
const taro = await register({ display_name: "テスト 太郎", nursery: "komazawa", employment: "parttime", start_date: start, mentor_name: "" });
const ume = await register({ display_name: "テスト 梅子", nursery: "umegaoka", employment: "fulltime", start_date: start, mentor_name: "" });

const hanakoSelf = await issue(`/admin/step/l/${hanako}/link`, { kind: "self" });
const hanakoMentor = await issue(`/admin/step/l/${hanako}/link`, { kind: "mentor" });
const taroSelf = await issue(`/admin/step/l/${taro}/link`, { kind: "self" });
const umeSelf = await issue(`/admin/step/l/${ume}/link`, { kind: "self" });
const komazawa = await issue("/admin/step/nursery/komazawa/link");
const umegaoka = await issue("/admin/step/nursery/umegaoka/link");

await test("本人の画面が開ける・noindex", async () => {
  const res = await page(`/step/s/${hanakoSelf}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  const body = await res.text();
  assert.match(body, /<meta name="robots" content="noindex,nofollow">/);
  assert.doesNotMatch(body, /googletagmanager|gtag\(|G-773Y7ZR3JX|https?:\/\/(?!www\.w3\.org)/);
  assert.match(res.headers.get("content-security-policy"), /connect-src 'self'/);
});

await test("トークンの種類とパスが合わなければ 404", async () => {
  assert.equal((await page(`/step/m/${hanakoSelf}`)).status, 404);
  assert.equal((await page(`/step/n/${hanakoSelf}`)).status, 404);
  assert.equal((await page(`/step/s/${"A".repeat(43)}`)).status, 404);
  assert.equal((await page("/step/")).status, 404);
  assert.equal((await page("/step/")).headers.get("x-robots-tag"), "noindex, nofollow");
});

await test("トークンなし・不正なトークンの API は 404", async () => {
  assert.equal((await api("me", null)).status, 404);
  assert.equal((await api("me", "x".repeat(43))).status, 404);
});

await test("本人の画面データ", async () => {
  const res = await api("me", hanakoSelf);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.learner.display_name, "テスト 花子");
  assert.equal(data.progress.day, 10);
  assert.equal(data.role.canMentor, false);
  assert.equal(data.progress.stages.length, 7);
});

await test("本人リンクで「確認」は押せない", async () => {
  const res = await api("check", hanakoSelf, { method: "POST", body: { item_id: "d7-1", action: "mentor" } });
  assert.equal(res.status, 403);
  const undo = await api("check", hanakoSelf, { method: "POST", body: { item_id: "d7-1", action: "undo_mentor" } });
  assert.equal(undo.status, 403);
});

await test("指導役リンクで「できた」（本人の欄）は押せない・気分も入れられない", async () => {
  assert.equal((await api("check", hanakoMentor, { method: "POST", body: { item_id: "d7-1", action: "self" } })).status, 403);
  assert.equal((await api("mood", hanakoMentor, { method: "POST", body: { level: 1 } })).status, 403);
});

await test("他人のデータは読めない・書けない", async () => {
  assert.equal((await api("me", hanakoSelf, { query: `?learner=${taro}` })).status, 404);
  assert.equal((await api("me", hanakoMentor, { query: `?learner=${ume}` })).status, 404);
  assert.equal((await api("check", hanakoSelf, { method: "POST", body: { item_id: "d7-1", action: "self", learner_id: taro } })).status, 404);
  assert.equal((await api("nursery", hanakoMentor)).status, 403);
});

await test("できた → 確認 → 取り消し（記録が残る）", async () => {
  let res = await api("check", hanakoSelf, { method: "POST", body: { item_id: "d7-1", action: "self" } });
  assert.equal(res.status, 200);
  let data = await res.json();
  assert.ok(data.progress.stages[0].items[0].self_at);
  assert.equal(data.progress.stages[0].confirmed, 0);
  // 本人が入れていない項目も指導役は確認できる
  res = await api("check", hanakoMentor, { method: "POST", body: { item_id: "d7-2", action: "mentor" } });
  data = await res.json();
  assert.equal(data.progress.stages[0].confirmed, 1);
  res = await api("check", hanakoMentor, { method: "POST", body: { item_id: "d7-2", action: "undo_mentor" } });
  data = await res.json();
  assert.equal(data.progress.stages[0].confirmed, 0);
  const log = env.STEP_DB.sqlite.prepare("SELECT actor, action FROM check_log WHERE learner_id = ? ORDER BY id").all(hanako);
  assert.deepEqual(log.map((r) => `${r.actor}:${r.action}`), ["self:self", "mentor:mentor", "mentor:undo_mentor"]);
  assert.equal((await api("check", hanakoSelf, { method: "POST", body: { item_id: "zz-9", action: "self" } })).status, 400);
});

await test("全項目の確認＋面談で段階が達成", async () => {
  for (const item of checklist.stages[0].items) {
    assert.equal((await api("check", hanakoMentor, { method: "POST", body: { item_id: item.id, action: "mentor" } })).status, 200);
  }
  let data = await (await api("me", hanakoSelf)).json();
  assert.equal(data.progress.stages[0].allConfirmed, true);
  assert.equal(data.progress.stages[0].done, false);
  const res = await api("review", hanakoMentor, { method: "POST", body: { stage_id: "d7", met_on: todayJst(), mentor_note: "よくできました" } });
  assert.equal(res.status, 200);
  data = await res.json();
  assert.equal(data.progress.stages[0].state, "done");
  // 本人のひとこと（本人は面談日・指導役の欄を書けない）
  assert.equal((await api("review", hanakoSelf, { method: "POST", body: { stage_id: "d7", self_note: "がんばります" } })).status, 200);
  assert.equal((await api("review", hanakoSelf, { method: "POST", body: { stage_id: "d7", met_on: todayJst() } })).status, 403);
  assert.equal((await api("review", hanakoMentor, { method: "POST", body: { stage_id: "d7", self_note: "x" } })).status, 403);
  data = await (await api("me", hanakoMentor)).json();
  assert.equal(data.progress.stages[0].review.self_note, "がんばります");
  assert.equal(data.progress.stages[0].review.mentor_note, "よくできました");
});

await test("記入は200字まで・未来の面談日は不可", async () => {
  assert.equal((await api("review", hanakoSelf, { method: "POST", body: { stage_id: "d10", self_note: "あ".repeat(201) } })).status, 400);
  assert.equal((await api("review", hanakoSelf, { method: "POST", body: { stage_id: "d10", self_note: "あ".repeat(200) } })).status, 200);
  assert.equal((await api("review", hanakoMentor, { method: "POST", body: { stage_id: "d10", met_on: addDays(todayJst(), 1) } })).status, 400);
});

await test("気分チェック（本人だけ）", async () => {
  const res = await api("mood", hanakoSelf, { method: "POST", body: { level: 3 } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).progress.mood.thisWeek, 3);
  assert.equal((await api("mood", hanakoSelf, { method: "POST", body: { level: 4 } })).status, 400);
});

await test("園長リンクで他の園は見えない", async () => {
  const res = await api("nursery", komazawa);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data.learners.map((l) => l.display_name).sort(), ["テスト 太郎", "テスト 花子"]);
  assert.equal((await api("me", komazawa, { query: `?learner=${ume}` })).status, 404);
  assert.equal((await page(`/step/n/${komazawa}/l/${ume}`)).status, 404);
  assert.equal((await api("check", komazawa, { method: "POST", body: { item_id: "d7-1", action: "mentor", learner_id: ume } })).status, 404);
  const other = await (await api("nursery", umegaoka)).json();
  assert.deepEqual(other.learners.map((l) => l.display_name), ["テスト 梅子"]);
});

await test("園長は指導役として確認できる", async () => {
  assert.equal((await page(`/step/n/${komazawa}`)).status, 200);
  assert.equal((await page(`/step/n/${komazawa}/l/${taro}`)).status, 200);
  const res = await api("check", komazawa, { method: "POST", body: { item_id: "d7-1", action: "mentor", learner_id: taro } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).progress.stages[0].confirmed, 1);
  assert.equal((await api("check", komazawa, { method: "POST", body: { item_id: "d7-2", action: "self", learner_id: taro } })).status, 403);
  assert.equal((await api("me", komazawa)).status, 400); // learner の指定が必要
});

await test("再発行すると古いリンクはすぐ 404", async () => {
  const fresh = await issue(`/admin/step/l/${taro}/link`, { kind: "self" });
  assert.equal((await page(`/step/s/${taroSelf}`)).status, 404);
  assert.equal((await api("me", taroSelf)).status, 404);
  assert.equal((await api("me", fresh)).status, 200);
  const newNursery = await issue("/admin/step/nursery/komazawa/link");
  assert.equal((await api("nursery", komazawa)).status, 404);
  assert.equal((await api("nursery", newNursery)).status, 200);
});

await test("退職を記録するとリンクは自動で無効・集計に入る", async () => {
  const res = await adminPost(`/admin/step/l/${ume}/leave`, { left_date: todayJst(), left_stage: "" });
  assert.equal(res.status, 303);
  assert.equal((await page(`/step/s/${umeSelf}`)).status, 404);
  assert.equal((await api("mood", umeSelf, { method: "POST", body: { level: 1 } })).status, 404);
  const row = env.STEP_DB.sqlite.prepare("SELECT status, left_stage FROM learners WHERE id = ?").get(ume);
  assert.equal(row.status, "left");
  assert.equal(row.left_stage, "d10"); // 10日目なので「10日」の段階
  assert.equal((await api("nursery", umegaoka)).status, 200);
  assert.equal((await (await api("nursery", umegaoka)).json()).learners.length, 0);
});

await test("D1 にはトークンのハッシュだけ", () => {
  const dump = JSON.stringify(env.STEP_DB.sqlite.prepare("SELECT * FROM tokens").all())
    + JSON.stringify(env.STEP_DB.sqlite.prepare("SELECT * FROM check_log").all())
    + JSON.stringify(env.STEP_DB.sqlite.prepare("SELECT * FROM rate_limits").all());
  for (const token of [hanakoSelf, hanakoMentor, komazawa, umegaoka]) assert.equal(dump.includes(token), false);
  assert.ok(env.STEP_DB.sqlite.prepare("SELECT token_hash FROM tokens").all().every((r) => /^[a-f0-9]{64}$/.test(r.token_hash)));
});

await test("印刷用ページ（本人・空欄の型紙）", async () => {
  const res = await page(`/step/s/${hanakoSelf}/print`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /☑/);
  assert.match(body, /本人サイン/);
  assert.match(body, /break-inside:avoid/);
  assert.match(body, /noindex,nofollow/);
  const blank = await handleStepAdminGet(new Request(`${ORIGIN}/admin/step/print/blank`), env, session, h);
  const blankBody = await blank.text();
  assert.equal(blank.status, 200);
  assert.doesNotMatch(blankBody, /テスト/);
  assert.equal((blankBody.match(/class="bx" aria-label="未">□/g) || []).length, 42);
});

await test("管理画面の一覧と集計", async () => {
  const res = await handleStepAdminGet(new Request(`${ORIGIN}/admin/step`), env, session, h);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  const body = await res.text();
  assert.match(body, /テスト 花子/);
  assert.match(body, /30日定着率/);
  const detail = await handleStepAdminGet(new Request(`${ORIGIN}/admin/step/l/${hanako}`), env, session, h);
  assert.equal(detail.status, 200);
  assert.doesNotMatch(await detail.text(), new RegExp(hanakoSelf));
});

await test("チェック項目を編集すると版が上がり、既存の人は元の版のまま", async () => {
  const text = checklistToText(checklist).replace("- d7-1 | クラスの子どもの名前と顔が一致する\n", "");
  const res = await adminPost("/admin/step/checklist", { checklist: text });
  assert.equal(res.status, 303);
  assert.match(res.headers.get("location"), /saved=2/);
  const data = await (await api("me", hanakoSelf)).json();
  assert.equal(data.progress.stages[0].items.length, 7);
  const jiro = await register({ display_name: "テスト 次郎", nursery: "komazawa", employment: "fulltime", start_date: todayJst(), mentor_name: "" });
  assert.equal(env.STEP_DB.sqlite.prepare("SELECT checklist_version FROM learners WHERE id = ?").get(jiro).checklist_version, 2);
  const bad = await adminPost("/admin/step/checklist", { checklist: "## x" });
  assert.equal(bad.status, 400);
});

await test("トークンごとのレート制限（1分60回）", async () => {
  const fresh = await issue(`/admin/step/l/${hanako}/link`, { kind: "mentor" });
  let last = 0;
  for (let i = 0; i < 61; i += 1) last = (await api("me", fresh)).status;
  assert.equal(last, 429);
});

await test("登録の入力チェック", async () => {
  const res = await adminPost("/admin/step/learners", { display_name: "", nursery: "komazawa", employment: "fulltime", start_date: "2026-02-30" });
  assert.equal(res.status, 400);
});

console.log(`step tests passed (${passed})`);
