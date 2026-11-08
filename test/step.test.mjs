// ステップアップ表の計算と入力チェックのテスト（node test/step.test.mjs）
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isDate, todayJst, addDays, dayNumber, targetDate, mondayOf, computeStages, moodAlert, retentionStats, validateChecklist,
} from "../src/step_logic.js";

const checklist = JSON.parse(readFileSync(new URL("../content/step_checklist.json", import.meta.url), "utf8"));

// 日付
assert.equal(isDate("2026-02-29"), false);
assert.equal(isDate("2028-02-29"), true);
assert.equal(isDate("2026-13-01"), false);
assert.equal(isDate("2026-1-01"), false);
assert.equal(todayJst(Date.UTC(2026, 10, 30, 15, 0)), "2026-12-01"); // UTC 15時＝日本時間の翌日0時
assert.equal(todayJst(Date.UTC(2026, 10, 30, 14, 59)), "2026-11-30");
assert.equal(addDays("2026-01-31", 1), "2026-02-01");
assert.equal(addDays("2028-02-28", 1), "2028-02-29");
assert.equal(dayNumber("2026-11-01", "2026-11-01"), 1); // 入社当日が1日目
assert.equal(dayNumber("2026-11-01", "2026-10-31"), 0);
assert.equal(dayNumber("2026-10-31", "2026-11-30"), 31);
assert.equal(targetDate("2026-11-01", 7), "2026-11-07"); // 指示書の例
assert.equal(targetDate("2026-11-01", 180), "2027-04-29");
assert.equal(mondayOf("2026-11-08"), "2026-11-02"); // 日曜 → その週の月曜
assert.equal(mondayOf("2026-11-09"), "2026-11-09");

// 初期の項目
const clean = validateChecklist(checklist);
assert.equal(clean.stages.length, 7);
assert.equal(clean.stages.reduce((a, s) => a + s.items.length, 0), 50);
assert.deepEqual(clean.stages.map((s) => s.days), [7, 10, 30, 45, 60, 90, 180]);

// 段階の状態
const start = "2026-11-01";
let v = computeStages(clean, {}, {}, start, "2026-11-01");
assert.equal(v.current.id, "d7");
assert.equal(v.stages[0].state, "current");
assert.equal(v.stages[0].late, false);
assert.equal(v.ok, 0);
assert.equal(v.total, 50);
assert.equal(v.next.length, 3);

v = computeStages(clean, {}, {}, start, "2026-11-08"); // 目標日 11/7 を過ぎた
assert.equal(v.stages[0].late, true);
assert.equal(v.stages[1].late, false); // 10日の目標日は 11/10

const allD7 = Object.fromEntries(clean.stages[0].items.map((i) => [i.id, { mentor_at: "2026-11-05T00:00:00Z" }]));
v = computeStages(clean, allD7, {}, start, "2026-11-05");
assert.equal(v.stages[0].state, "current", "面談前は達成にしない");
assert.equal(v.stages[0].needsReview, true);
v = computeStages(clean, allD7, { d7: { met_on: "2026-11-06" } }, start, "2026-11-08");
assert.equal(v.stages[0].state, "done");
assert.equal(v.stages[0].late, false, "達成した段階は遅れにしない");
assert.equal(v.current.id, "d10");
const selfOnly = { [clean.stages[0].items[0].id]: { self_at: "2026-11-02T00:00:00Z" } };
v = computeStages(clean, selfOnly, {}, start, "2026-11-02");
assert.equal(v.ok, 0, "本人の「できた」だけでは確認済みにしない");

// 気分
assert.equal(moodAlert([{ week: "2026-11-02", level: 3 }, { week: "2026-10-26", level: 3 }], "2026-11-05"), true);
assert.equal(moodAlert([{ week: "2026-11-02", level: 3 }, { week: "2026-10-26", level: 2 }], "2026-11-05"), false);
assert.equal(moodAlert([{ week: "2026-10-26", level: 3 }, { week: "2026-10-19", level: 3 }], "2026-11-05"), true, "今週未回答でも前の2週がつらいなら");
assert.equal(moodAlert([], "2026-11-05"), false);

// 定着
const st = retentionStats([
  { start_date: "2026-01-10", status: "left", left_date: "2026-02-20" }, // 42日目で退職
  { start_date: "2026-01-10", status: "active", left_date: null },
  { start_date: "2026-10-20", status: "active", left_date: null },
], "2026-11-08");
assert.equal(st.total, 3);
assert.deepEqual(st.windows.find((w) => w.days === 30), { days: 30, eligible: 2, stayed: 2 });
assert.deepEqual(st.windows.find((w) => w.days === 90), { days: 90, eligible: 2, stayed: 1 });

// 入力チェック
assert.throws(() => validateChecklist({ stages: [] }), /STAGE_COUNT/);
assert.throws(() => validateChecklist({ stages: [{ id: "a", days: 7, title: "x", items: [{ id: "i1", text: "a" }, { id: "i1", text: "b" }] }] }), /ITEM_ID/);
assert.throws(() => validateChecklist({ stages: [{ id: "A B", days: 7, title: "x", items: [] }] }), /STAGE_ID/);
assert.throws(() => validateChecklist({ stages: [{ id: "a", days: 0, title: "x", items: [] }] }), /STAGE_DAYS/);
const sorted = validateChecklist({ stages: [
  { id: "b", days: 30, title: "30日", items: [{ id: "x1", text: "  長い\n文 ", detail: "d".repeat(400) }] },
  { id: "a", days: 7, title: "1週間", items: [] },
] });
assert.deepEqual(sorted.stages.map((s) => s.id), ["a", "b"], "日数順に並べ直す");
assert.equal(sorted.stages[1].items[0].text, "長い 文");
assert.equal(sorted.stages[1].items[0].detail.length, 300);

// 画面の JS に、テンプレート文字列で壊れる記号が入っていないこと
const ui = readFileSync(new URL("../src/step_ui.js", import.meta.url), "utf8");
const js = ui.slice(ui.indexOf("export const STEP_JS"));
assert.equal(js.slice(js.indexOf("`") + 1, js.lastIndexOf("`")).includes("`"), false);
assert.equal(/\$\{/.test(js), false);
// 外部の解析タグ・CDN を読まない
assert.doesNotMatch(ui, /googletagmanager|gtag\(|cdnjs|jsdelivr|unpkg|fonts\.googleapis/);

console.log("step tests passed");
