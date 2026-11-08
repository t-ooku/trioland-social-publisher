// 中途採用者のステップアップ表：日付・段階の計算と入力チェック（副作用なし。test/step.test.mjs で検証）。
// 日付はすべて日本時間の "YYYY-MM-DD" 文字列で扱う。入社日を1日目と数える。

export const NURSERIES = { komazawa: "駒沢大学園", umegaoka: "梅ヶ丘園" };
const DAY_MS = 86400000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function toUtc(value) {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayJst(now = Date.now()) {
  return fromUtc(now + 9 * 3600 * 1000);
}

export function addDays(date, days) {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** 入社日を1日目とした今日の日数（入社前は0以下）。 */
export function dayNumber(startDate, today) {
  return Math.round((toUtc(today) - toUtc(startDate)) / DAY_MS) + 1;
}

/** 段階の目標日：入社日＋（日数−1）日。 */
export function targetDate(startDate, days) {
  return addDays(startDate, days - 1);
}

/** その週の月曜日（日本時間）。 */
export function mondayOf(date) {
  const dow = new Date(toUtc(date)).getUTCDay(); // 0=日
  return addDays(date, -((dow + 6) % 7));
}

/**
 * 段階ごとの状態。項目がすべて指導役の確認済みで、振り返り面談の日が入っていれば「達成」。
 * 最初の未達成の段階が「いま」。目標日を過ぎて未達成なら late。
 */
export function computeStages(checklist, checks, reviews, startDate, today) {
  let currentFound = false;
  const stages = checklist.stages.map((stage) => {
    const items = stage.items.map((item) => {
      const c = checks[item.id] || {};
      return { id: item.id, text: item.text, detail: item.detail || "", self_at: c.self_at || null, mentor_at: c.mentor_at || null };
    });
    const total = items.length;
    const ok = items.filter((i) => i.mentor_at).length;
    const allConfirmed = total > 0 && ok === total;
    const review = reviews[stage.id] || null;
    const reviewed = Boolean(review && review.met_on);
    const complete = allConfirmed && reviewed;
    const target = startDate ? targetDate(startDate, stage.days) : null;
    let state = "upcoming";
    if (complete) state = "done";
    else if (!currentFound) { state = "current"; currentFound = true; }
    const late = !complete && Boolean(target) && today > target;
    return {
      id: stage.id, title: stage.title, theme: stage.theme || "", days: stage.days, milestone: Boolean(stage.milestone),
      target, late, state, ok, total, needsReview: allConfirmed && !reviewed, items,
    };
  });
  const current = stages.find((s) => s.state === "current") || null;
  const ok = stages.reduce((a, s) => a + s.ok, 0);
  const total = stages.reduce((a, s) => a + s.total, 0);
  const next = current ? current.items.filter((i) => !i.mentor_at).slice(0, 3).map((i) => i.text) : [];
  return { stages, current: current && { id: current.id, title: current.title, theme: current.theme, needsReview: current.needsReview }, ok, total, next };
}

/** 直近2週続けて「つらい」(3) なら true。moods は {week, level} の配列。 */
export function moodAlert(moods, today) {
  const thisWeek = mondayOf(today);
  const lastWeek = addDays(thisWeek, -7);
  const twoAgo = addDays(thisWeek, -14);
  const byWeek = new Map(moods.map((m) => [m.week, Number(m.level)]));
  const a = byWeek.get(thisWeek), b = byWeek.get(lastWeek), c = byWeek.get(twoAgo);
  return (a === 3 && b === 3) || (a === undefined && b === 3 && c === 3);
}

/** 定着の集計。learners は {start_date, status, left_date}。 */
export function retentionStats(learners, today) {
  const out = { total: learners.length, active: 0, completed: 0, left: 0, windows: [] };
  for (const l of learners) out[l.status === "left" ? "left" : l.status === "completed" ? "completed" : "active"] += 1;
  for (const days of [30, 90, 180]) {
    const eligible = learners.filter((l) => dayNumber(l.start_date, today) > days);
    const stayed = eligible.filter((l) => l.status !== "left" || (l.left_date && dayNumber(l.start_date, l.left_date) > days));
    out.windows.push({ days, eligible: eligible.length, stayed: stayed.length });
  }
  return out;
}

const STAGE_ID = /^[a-z0-9-]{1,20}$/;
const ITEM_ID = /^[A-Za-z0-9_-]{1,40}$/;

function cleanText(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

/** 園長が保存する項目の検証。問題があれば Error（status 400）。 */
export function validateChecklist(input) {
  const fail = (msg) => { const e = new Error(msg); e.status = 400; throw e; };
  if (!input || !Array.isArray(input.stages)) fail("STAGES_REQUIRED");
  if (input.stages.length < 1 || input.stages.length > 12) fail("STAGE_COUNT");
  const stageIds = new Set(), itemIds = new Set();
  const stages = input.stages.map((s) => {
    const id = String(s?.id || "");
    if (!STAGE_ID.test(id) || stageIds.has(id)) fail("STAGE_ID");
    stageIds.add(id);
    const days = Number(s.days);
    if (!Number.isInteger(days) || days < 1 || days > 400) fail("STAGE_DAYS");
    const title = cleanText(s.title, 12);
    if (!title) fail("STAGE_TITLE");
    if (!Array.isArray(s.items) || s.items.length > 30) fail("ITEM_COUNT");
    const items = s.items.map((it) => {
      const iid = String(it?.id || "");
      if (!ITEM_ID.test(iid) || itemIds.has(iid)) fail("ITEM_ID");
      itemIds.add(iid);
      const text = cleanText(it.text, 120);
      if (!text) fail("ITEM_TEXT");
      return { id: iid, text, detail: cleanText(it.detail, 300) };
    });
    return { id, days, title, theme: cleanText(s.theme, 30), milestone: Boolean(s.milestone), items };
  });
  stages.sort((a, b) => a.days - b.days);
  return { goal: "クラス担任", stages };
}

export function cleanNote(value) {
  return cleanText(value, 200);
}

export function cleanName(value) {
  return cleanText(value, 20);
}
