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

/* ---------- 退職の分析（園長のダッシュボード） ---------- */

/** 退職理由の選択肢（園長が退職を記録するときに選ぶ）。 */
export const LEFT_REASONS = {
  workload: "業務量・忙しさ",
  relations: "職場の人間関係",
  fit: "仕事内容・保育の考え方が合わない",
  pay: "給与・待遇",
  hours: "勤務時間・シフト",
  health: "体調・家庭の事情",
  move: "転居・転職・進学",
  other: "その他・わからない",
};

/** 年度（4月はじまり）。2026-03-31 → 2025、2026-04-01 → 2026。 */
export function fiscalYearOf(date) {
  const y = Number(date.slice(0, 4));
  const m = Number(date.slice(5, 7));
  return m >= 4 ? y : y - 1;
}

function monthStart(ym) {
  return ym + "-01";
}

function nextMonth(ym) {
  let [y, m] = ym.split("-").map(Number);
  m += 1;
  if (m > 12) { m = 1; y += 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/**
 * 一人ぶんの「辞める前のサイン」。退職者は退職日の時点、それ以外は今日の時点で見る。
 * moods は {week, level}、reviews は {stage_id: {met_on}}。
 */
export function learnerSignals(checklist, checks, reviews, moods, learner, today) {
  const end = learner.status === "left" && learner.left_date ? learner.left_date : today;
  const v = computeStages(checklist, checks, reviews, learner.start_date, end);
  const due = v.stages.filter((s) => s.target && s.target < end);
  const held = due.filter((s) => reviews[s.id] && reviews[s.id].met_on && reviews[s.id].met_on <= end);
  return {
    // あとから登録した過去の退職者など、アプリで何も記録していない人は「ちがい」の比較に入れない
    tracked: Object.keys(checks).length > 0 || Object.keys(reviews).length > 0 || moods.length > 0,
    tsurai: moods.some((m) => Number(m.level) === 3 && m.week <= end),
    late: v.stages.some((s) => s.late),
    reviewsDue: due.length,
    reviewsHeld: held.length,
  };
}

/**
 * 退職の集計。people は {start_date, status, left_date, left_stage, left_reason, employment, mentor_name, signals}。
 * 月次の退職率＝その月の退職者 ÷ 月初に在籍していた人。年度の退職率＝年度内の退職者 ÷（年度初めの在籍＋年度内の入社）。
 * 修了（クラス担任になった人）は在籍として数える。
 * stages（{title, days} の配列）を渡すと、「どの段階の時期に辞めたか」を退職日の入社何日目で数える
 * （過去の退職者をあとから登録した場合も時期で分けられるように）。渡さなければ記録した left_stage で数える。
 */
export function turnoverAnalytics(people, today, months = 12, stages = null) {
  const left = people.filter((p) => p.status === "left" && p.left_date);
  const inPlaceOn = (p, date) => p.start_date < date && !(p.status === "left" && p.left_date && p.left_date < date);
  const thisYm = today.slice(0, 7);
  const yms = [];
  let ym = thisYm;
  for (let i = 0; i < months; i += 1) {
    yms.unshift(ym);
    let [y, m] = ym.split("-").map(Number);
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    ym = `${y}-${String(m).padStart(2, "0")}`;
  }
  const monthly = yms.map((k) => {
    const from = monthStart(k);
    const to = monthStart(nextMonth(k));
    const headcount = people.filter((p) => inPlaceOn(p, from)).length;
    const joined = people.filter((p) => p.start_date >= from && p.start_date < to).length;
    const leftN = left.filter((p) => p.left_date >= from && p.left_date < to).length;
    return { ym: k, headcount, joined, left: leftN, rate: headcount ? leftN / headcount : null };
  });

  const years = new Set([fiscalYearOf(today)]);
  for (const p of people) years.add(fiscalYearOf(p.start_date));
  for (const p of left) years.add(fiscalYearOf(p.left_date));
  const windowsOf = (group) => [30, 90, 180].map((days) => {
    const eligible = group.filter((p) => dayNumber(p.start_date, today) > days);
    const gone = eligible.filter((p) => p.status === "left" && p.left_date && dayNumber(p.start_date, p.left_date) <= days);
    return { days, eligible: eligible.length, left: gone.length, rate: eligible.length ? gone.length / eligible.length : null };
  });
  const yearly = [...years].sort((a, b) => b - a).map((fy) => {
    const from = `${fy}-04-01`;
    const to = `${fy + 1}-04-01`;
    const atStart = people.filter((p) => inPlaceOn(p, from)).length;
    const cohort = people.filter((p) => p.start_date >= from && p.start_date < to);
    const leftN = left.filter((p) => p.left_date >= from && p.left_date < to).length;
    const base = atStart + cohort.length;
    return { fy, atStart, joined: cohort.length, left: leftN, rate: base ? leftN / base : null, early: windowsOf(cohort) };
  });

  const count = (arr, keyOf) => {
    const out = {};
    for (const p of arr) { const k = keyOf(p); out[k] = (out[k] || 0) + 1; }
    return out;
  };
  const tenure = [["〜30日", 1, 30], ["31〜90日", 31, 90], ["91〜180日", 91, 180], ["181日〜", 181, Infinity]].map(([label, lo, hi]) => ({
    label, n: left.filter((p) => { const d = dayNumber(p.start_date, p.left_date); return d >= lo && d <= hi; }).length,
  }));
  const calMonths = Array.from({ length: 12 }, (_, i) => left.filter((p) => Number(p.left_date.slice(5, 7)) === i + 1).length);

  const stayedGroup = people.filter((p) => p.status !== "left" && dayNumber(p.start_date, today) > 30);
  const profile = (group) => {
    const withSig = group.filter((p) => p.signals && p.signals.tracked !== false);
    const due = withSig.reduce((a, p) => a + p.signals.reviewsDue, 0);
    const held = withSig.reduce((a, p) => a + p.signals.reviewsHeld, 0);
    return {
      n: withSig.length,
      tsurai: withSig.filter((p) => p.signals.tsurai).length,
      late: withSig.filter((p) => p.signals.late).length,
      reviewRate: due ? held / due : null,
    };
  };
  const groupRows = (keyOf) => {
    const keys = [...new Set(people.map(keyOf))];
    return keys.map((k) => {
      const all = people.filter((p) => keyOf(p) === k);
      const gone = all.filter((p) => p.status === "left").length;
      return { key: k, total: all.length, left: gone };
    }).sort((a, b) => b.total - a.total);
  };

  return {
    total: people.length,
    active: people.filter((p) => p.status === "active").length,
    leftTotal: left.length,
    monthly,
    yearly,
    early: windowsOf(people),
    byStage: stages && stages.length
      ? count(left, (p) => { const d = dayNumber(p.start_date, p.left_date); const st = [...stages].sort((a, b) => a.days - b.days).find((x) => d <= x.days); return st ? st.title : "それ以降"; })
      : count(left, (p) => p.left_stage || "不明"),
    byReason: count(left, (p) => (p.left_reason && LEFT_REASONS[p.left_reason] ? p.left_reason : "unknown")),
    tenure,
    calMonths,
    compare: { left: profile(left), stayed: profile(stayedGroup) },
    byMentor: groupRows((p) => p.mentor_name || "未定"),
    byEmployment: groupRows((p) => (p.employment === "parttime" ? "パート" : "常勤")),
  };
}
