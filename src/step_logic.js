// ステップアップ（/step/）の計算だけを集めたファイル。D1 にも Request にも触らない。
// 日付はすべて日本時間の "YYYY-MM-DD" 文字列で扱う。
//   入社日を1日目と数える。目標日 = 入社日 + (日数 - 1) 日。
//   例: 11月1日入社なら「1週間（7日）」の目標日は 11月7日。

export const NURSERIES = {
  komazawa: "駒沢大学園",
  umegaoka: "梅ヶ丘園",
};

export const EMPLOYMENTS = {
  fulltime: "常勤",
  parttime: "パート",
};

export const MOOD_LABELS = { 1: "順調", 2: "ちょっと大変", 3: "つらい" };

export const NOTE_MAX = 200;

const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayJst(now = new Date()) {
  return new Date(now.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toEpochDay(value) {
  const [y, m, d] = value.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function fromEpochDay(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(value, days) {
  return fromEpochDay(toEpochDay(value) + days);
}

export function diffDays(from, to) {
  return toEpochDay(to) - toEpochDay(from);
}

// 入社日が1日目。入社前は 0 以下になる。
export function dayNumber(startDate, today) {
  return diffDays(startDate, today) + 1;
}

export function targetDate(startDate, days) {
  return addDays(startDate, days - 1);
}

// その日を含む週の月曜日。
export function weekMonday(value) {
  const day = toEpochDay(value);
  const weekday = (day + 4) % 7; // 1970-01-01 は木曜日。0 = 日曜
  return fromEpochDay(day - ((weekday + 6) % 7));
}

// ---------- チェック項目（版） ----------

const ID_RE = /^[a-z0-9][a-z0-9-]{0,31}$/;

export function validateChecklist(checklist) {
  const errors = [];
  if (!checklist || typeof checklist !== "object") return ["チェック項目の形式が正しくありません"];
  const goal = String(checklist.goal || "").trim();
  if (!goal || goal.length > 40) errors.push("最終目標（goal）は1〜40字にしてください");
  const stages = Array.isArray(checklist.stages) ? checklist.stages : [];
  if (stages.length < 1 || stages.length > 12) errors.push("段階は1〜12個にしてください");
  const ids = new Set();
  let lastDays = 0;
  for (const stage of stages) {
    const label = stage?.title || stage?.id || "?";
    if (!ID_RE.test(String(stage?.id || ""))) errors.push(`段階「${label}」の ID は英小文字・数字・ハイフンで32字までにしてください`);
    if (ids.has(stage?.id)) errors.push(`ID「${stage?.id}」が重複しています`);
    ids.add(stage?.id);
    const days = Number(stage?.days);
    if (!Number.isInteger(days) || days < 1 || days > 730) errors.push(`段階「${label}」の日数は1〜730の整数にしてください`);
    else if (days <= lastDays) errors.push(`段階「${label}」の日数は前の段階より大きくしてください`);
    else lastDays = days;
    if (!String(stage?.title || "").trim() || String(stage.title).length > 20) errors.push(`段階「${label}」の名前は1〜20字にしてください`);
    if (String(stage?.theme || "").length > 60) errors.push(`段階「${label}」のテーマは60字までにしてください`);
    const items = Array.isArray(stage?.items) ? stage.items : [];
    if (items.length < 1 || items.length > 20) errors.push(`段階「${label}」の項目は1〜20個にしてください`);
    for (const item of items) {
      if (!ID_RE.test(String(item?.id || ""))) errors.push(`段階「${label}」に ID の正しくない項目があります`);
      if (ids.has(item?.id)) errors.push(`ID「${item?.id}」が重複しています`);
      ids.add(item?.id);
      const text = String(item?.text || "").trim();
      if (!text || text.length > 120) errors.push(`段階「${label}」の項目の文は1〜120字にしてください`);
    }
  }
  return errors;
}

export function itemIds(checklist) {
  const set = new Set();
  for (const stage of checklist.stages) for (const item of stage.items) set.add(item.id);
  return set;
}

export function stageIds(checklist) {
  return new Set(checklist.stages.map((stage) => stage.id));
}

// 管理画面の編集欄（テキスト）⇔ チェック項目。
//   goal | クラス担任
//   ## d7 | 7 | 1週間 | 園の1日と安全のルールがわかる
//   - d7-1 | クラスの子どもの名前と顔が一致する
//   - 新しい項目（ID を書かなければ自動で付く）
//   ## 3ヶ月 の行の末尾に「| 節目」と書くと旗のついた節目になる
export function checklistToText(checklist) {
  const lines = [`goal | ${checklist.goal}`];
  for (const stage of checklist.stages) {
    lines.push("");
    lines.push(`## ${stage.id} | ${stage.days} | ${stage.title} | ${stage.theme || ""}${stage.milestone ? " | 節目" : ""}`);
    for (const item of stage.items) lines.push(`- ${item.id} | ${item.text}`);
  }
  return `${lines.join("\n")}\n`;
}

export function textToChecklist(text, previous) {
  const used = previous ? itemIds(previous) : new Set();
  for (const stage of previous?.stages || []) used.add(stage.id);
  const out = { goal: "", stages: [] };
  const errors = [];
  let current = null;
  const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;
    const where = `${index + 1}行目`;
    if (/^goal\s*\|/i.test(line)) {
      out.goal = line.replace(/^goal\s*\|/i, "").trim();
      return;
    }
    if (line.startsWith("##")) {
      const parts = line.slice(2).split("|").map((part) => part.trim());
      const [id, days, title, theme = "", flag = ""] = parts;
      current = { id, days: Number(days), title, theme };
      if (flag === "節目") current.milestone = true;
      current.items = [];
      out.stages.push(current);
      return;
    }
    if (line.startsWith("-")) {
      if (!current) {
        errors.push(`${where}: 項目の前に段階（## の行）を書いてください`);
        return;
      }
      const body = line.slice(1).trim();
      const pipe = body.indexOf("|");
      let id = "";
      let itemText = body;
      if (pipe >= 0 && ID_RE.test(body.slice(0, pipe).trim())) {
        id = body.slice(0, pipe).trim();
        itemText = body.slice(pipe + 1).trim();
      }
      if (!id) {
        let n = current.items.length + 1;
        do {
          id = `${current.id}-n${n}`;
          n += 1;
        } while (used.has(id) || current.items.some((item) => item.id === id) || out.stages.some((s) => s.items.some((item) => item.id === id)));
      }
      used.add(id);
      current.items.push({ id, text: itemText });
      return;
    }
    errors.push(`${where}: 「goal |」「##」「-」のどれかで始めてください`);
  });
  return { checklist: out, errors: errors.concat(errors.length ? [] : validateChecklist(out)) };
}

// ---------- 進み具合の計算 ----------

// learner: { start_date, ... }
// checks: [{ item_id, self_at, mentor_at }]
// reviews: [{ stage_id, met_on, self_note, mentor_note }]
// moods: [{ week, level }]
export function buildProgress({ learner, checklist, checks = [], reviews = [], moods = [], today }) {
  const checkMap = new Map(checks.map((row) => [row.item_id, row]));
  const reviewMap = new Map(reviews.map((row) => [row.stage_id, row]));
  const day = dayNumber(learner.start_date, today);

  const stages = checklist.stages.map((stage) => {
    const target = targetDate(learner.start_date, stage.days);
    const items = stage.items.map((item) => {
      const check = checkMap.get(item.id) || {};
      return { id: item.id, text: item.text, self_at: check.self_at || null, mentor_at: check.mentor_at || null };
    });
    const confirmed = items.filter((item) => item.mentor_at).length;
    const review = reviewMap.get(stage.id) || {};
    const allConfirmed = confirmed === items.length;
    const met = Boolean(review.met_on);
    return {
      id: stage.id,
      title: stage.title,
      theme: stage.theme || "",
      days: stage.days,
      milestone: Boolean(stage.milestone),
      target,
      items,
      total: items.length,
      confirmed,
      allConfirmed,
      done: allConfirmed && met,
      review: { met_on: review.met_on || null, self_note: review.self_note || "", mentor_note: review.mentor_note || "" },
    };
  });

  // いまの段階: まだ達成していない段階のうち、目標日が今日以降で最初のもの。
  // 残りがすべて目標日を過ぎていれば、まだ達成していない最初の段階。
  const open = stages.filter((stage) => !stage.done);
  const now = open.find((stage) => stage.target >= today) || open[0] || null;

  for (const stage of stages) {
    if (stage.done) stage.state = "done";
    else if (today > stage.target) stage.state = "late";
    else if (now && stage.id === now.id) stage.state = "now";
    else stage.state = "upcoming";
    stage.isNow = Boolean(now && stage.id === now.id);
    stage.reviewDue = !stage.review.met_on && (stage.allConfirmed || today > stage.target);
  }

  const next = [];
  for (const stage of stages) {
    for (const item of stage.items) {
      if (next.length >= 3) break;
      if (!item.mentor_at) next.push({ stage_id: stage.id, stage_title: stage.title, item_id: item.id, text: item.text, self_at: item.self_at });
    }
  }

  const totalItems = stages.reduce((sum, stage) => sum + stage.total, 0);
  const confirmedItems = stages.reduce((sum, stage) => sum + stage.confirmed, 0);
  const moodInfo = summarizeMoods(moods, today);

  return {
    today,
    day,
    goal: checklist.goal,
    completed: open.length === 0,
    nowStageId: now ? now.id : null,
    nowStageTitle: now ? now.title : null,
    nowStageTheme: now ? now.theme : null,
    doneStages: stages.filter((stage) => stage.done).length,
    totalItems,
    confirmedItems,
    stages,
    next,
    mood: moodInfo,
    flags: {
      late: stages.some((stage) => stage.state === "late"),
      lateStages: stages.filter((stage) => stage.state === "late").map((stage) => stage.id),
      reviewDue: stages.filter((stage) => stage.reviewDue).map((stage) => stage.id),
      mood: moodInfo.alert,
    },
  };
}

// 「つらい」が2週続いたら印を出す。
// 直近に記録した2つの週が連続していて、どちらも「つらい」で、
// 新しいほうが今週か先週のときに alert = true。
export function summarizeMoods(moods, today) {
  const sorted = [...moods].sort((a, b) => (a.week < b.week ? 1 : -1));
  const thisWeek = weekMonday(today);
  const current = sorted.find((row) => row.week === thisWeek) || null;
  let alert = false;
  if (sorted.length >= 2) {
    const [a, b] = sorted;
    const recent = diffDays(a.week, thisWeek) <= 7;
    alert = recent && diffDays(b.week, a.week) === 7 && Number(a.level) === 3 && Number(b.level) === 3;
  }
  return {
    week: thisWeek,
    thisWeek: current ? Number(current.level) : null,
    recent: sorted.slice(0, 6).map((row) => ({ week: row.week, level: Number(row.level) })),
    alert,
  };
}

// ---------- 定着率・退職の集計（本部） ----------

export const LEAVE_BUCKETS = [7, 10, 30, 45, 60, 90, 180];

// learners: [{ start_date, status, left_date, left_stage }]
export function retentionStats(learners, today, checklist) {
  const left = learners.filter((row) => row.status === "left" && row.left_date);
  const byTenure = LEAVE_BUCKETS.map((limit, index) => {
    const lower = index === 0 ? 0 : LEAVE_BUCKETS[index - 1];
    const count = left.filter((row) => {
      const days = dayNumber(row.start_date, row.left_date);
      return days > lower && days <= limit;
    }).length;
    return { limit, lower, count };
  });
  const over = left.filter((row) => dayNumber(row.start_date, row.left_date) > 180).length;

  const byStage = (checklist?.stages || []).map((stage) => ({
    id: stage.id,
    title: stage.title,
    count: left.filter((row) => row.left_stage === stage.id).length,
  }));

  const retention = [30, 90, 180].map((days) => {
    // 入社から days 日目を迎えた（または迎える前に辞めた）人だけを分母にする。
    const eligible = learners.filter((row) => dayNumber(row.start_date, today) >= days);
    const stayed = eligible.filter((row) => row.status !== "left" || !row.left_date || dayNumber(row.start_date, row.left_date) >= days);
    return {
      days,
      eligible: eligible.length,
      stayed: stayed.length,
      rate: eligible.length ? Math.round((stayed.length / eligible.length) * 1000) / 10 : null,
    };
  });

  return { leftTotal: left.length, byTenure, over180: over, byStage, retention };
}

// ---------- 入力の整形 ----------

export function cleanText(value, max) {
  let out = "";
  for (const ch of String(value ?? "").replace(/\r\n?/g, "\n")) {
    const code = ch.codePointAt(0);
    out += code === 10 || (code >= 32 && code !== 127) ? ch : " ";
  }
  return [...out.trim()].slice(0, max).join("");
}

export function textLength(value) {
  return [...String(value ?? "")].length;
}
