// ステップアップ（/step/）の HTML。外部の CDN・フォント・解析タグは使わない。
// スクリプトは /step/app.js（このファイルの clientApp）だけ。インラインスクリプトは置かない（CSP）。
import { NURSERIES, EMPLOYMENTS, MOOD_LABELS } from "./step_logic.js";

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function md(value) {
  if (!value) return "";
  const [, m, d] = String(value).split("-");
  return `${Number(m)}/${Number(d)}`;
}

function ymd(value) {
  if (!value) return "";
  const [y, m, d] = String(value).split("-");
  return `${y}年${Number(m)}月${Number(d)}日`;
}

function jstStamp(iso) {
  if (!iso) return "";
  const date = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

const HEAD = (title, extraCss = "") => `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#087f74"><title>${esc(title)}</title><style>${BASE_CSS}${extraCss}</style></head>`;

const BASE_CSS = `:root{color-scheme:light;--ink:#1d2a30;--muted:#5d6b72;--line:#dde6e6;--brand:#087f74;--brand2:#e2f4ef;--done:#2f9e5d;--late:#e07a1f;--late2:#fff3e6;--todo:#b8c3c6;--bg:#f5f8f7;--danger:#b33a35}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Hiragino Sans","Noto Sans JP","Yu Gothic UI",Meiryo,sans-serif;line-height:1.6;font-size:16px}
.wrap{max-width:560px;margin:0 auto;padding:12px 14px 48px}
.top{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 2px 10px}.top .brand{font-size:12px;font-weight:800;letter-spacing:.12em;color:var(--brand)}.top a{color:var(--brand);font-size:14px;font-weight:700;text-decoration:none}
h1{font-size:22px;margin:0 0 2px;letter-spacing:-.01em}h2{font-size:17px;margin:0 0 10px}
.card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px;margin:12px 0;box-shadow:0 6px 22px #153b320d}
.muted{color:var(--muted)}.small{font-size:13px}.tiny{font-size:12px}
.where{display:grid;gap:4px}.where .day{font-size:15px;color:var(--muted)}.where .day b{font-size:30px;color:var(--ink);margin:0 2px}.where .stage{font-size:17px;font-weight:800}.where .stage span{display:block;font-size:14px;font-weight:600;color:var(--muted)}
.bar{height:10px;background:#e7eeee;border-radius:99px;overflow:hidden;margin-top:8px}.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--done));border-radius:99px}
.alert{background:var(--late2);border:1px solid #f3c99b;color:#7a4106;border-radius:14px;padding:12px 14px;margin:12px 0;font-weight:700;font-size:15px}
.alert.mood{background:#fdeeee;border-color:#efb9b6;color:#7d2622}
.next ol{margin:0;padding:0;list-style:none;display:grid;gap:8px}.next li{display:flex;gap:10px;align-items:flex-start;background:#f7faf9;border-radius:12px;padding:10px 12px}.next li b{flex:none;font-size:12px;color:#fff;background:var(--brand);border-radius:99px;padding:2px 8px;margin-top:2px}
.mood-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.mood-row button{min-height:52px;border-radius:14px;border:2px solid var(--line);background:#fff;font:inherit;font-weight:700;color:var(--ink);cursor:pointer;padding:6px 4px}.mood-row button[aria-pressed=true]{border-color:var(--brand);background:var(--brand2);color:#065e56}
.road{position:relative;margin:8px 0 0;padding:0;list-style:none}
.road:before{content:"";position:absolute;left:31px;top:20px;bottom:40px;width:6px;border-radius:6px;background:repeating-linear-gradient(#d3dcdd 0 10px,transparent 10px 16px)}
.stage{position:relative;margin:0 0 14px}
.stage>details>summary{list-style:none;display:grid;grid-template-columns:68px 1fr;gap:10px;align-items:center;cursor:pointer;padding:4px 0;border-radius:16px}
.stage>details>summary::-webkit-details-marker{display:none}
.stage>details>summary:focus-visible{outline:3px solid #0d6efd55;outline-offset:2px}
.node{position:relative;width:62px;height:62px;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:20px;color:#fff;background:var(--todo);box-shadow:0 5px 0 #0000001a;margin-left:3px;z-index:1}
.st-done .node{background:var(--done)}.st-late .node{background:var(--late)}.st-now .node{background:var(--brand)}
.is-now .node{width:68px;height:68px;margin-left:0;font-size:22px}
.is-now .node:after{content:"";position:absolute;inset:-7px;border-radius:50%;border:4px solid var(--brand);opacity:.55;animation:pulse 1.8s ease-out infinite}
.st-late.is-now .node:after{border-color:var(--late)}
@keyframes pulse{0%{transform:scale(.92);opacity:.7}100%{transform:scale(1.25);opacity:0}}
.label{min-width:0}.label .t{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.label .t strong{font-size:18px}.label .theme{font-size:14px;color:var(--muted);line-height:1.45}
.chip{display:inline-block;font-size:12px;font-weight:700;border-radius:99px;padding:1px 8px;background:#edf2f2;color:#4d5b61;white-space:nowrap}
.chip.done{background:#e3f4ea;color:#1f7543}.chip.late{background:var(--late2);color:#94500f}.chip.now{background:var(--brand2);color:#065e56}.chip.mood{background:#fdeeee;color:#8c2d28}
.meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:3px}
.panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px;margin:8px 0 4px 0}
.items{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.item{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:#fbfdfc}.item.ok{background:#f1faf4;border-color:#cfe9d8}
.item .text{display:flex;gap:8px;align-items:flex-start;font-size:15px}.item .box{flex:none;width:22px;height:22px;border-radius:6px;border:2px solid #9fb0b3;display:grid;place-items:center;font-size:14px;font-weight:900;margin-top:1px;color:#fff}.item.ok .box{background:var(--done);border-color:var(--done)}
.item .acts{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:8px;padding-left:30px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-height:40px;border:0;border-radius:12px;background:var(--brand);color:#fff;font:inherit;font-size:15px;font-weight:800;padding:6px 16px;cursor:pointer;text-decoration:none}
.btn.sub{background:#e8f2f0;color:#075f56}.btn.ghost{background:transparent;color:var(--muted);border:1px solid var(--line);min-height:34px;font-size:13px;padding:4px 10px}.btn:disabled{opacity:.5;cursor:wait}
.state{font-size:13px;color:var(--muted)}.state.ok{color:#1f7543;font-weight:700}
.review{margin-top:12px;border-top:1px dashed var(--line);padding-top:12px;display:grid;gap:10px}
.review label{display:grid;gap:4px;font-size:14px;font-weight:700}
.review input[type=date],.review textarea{font:inherit;font-weight:400;border:1px solid #c9d6d4;border-radius:10px;padding:9px 10px;width:100%;background:#fff;color:var(--ink)}
.review textarea{min-height:76px;resize:vertical}
.warn{background:#fff7e8;border:1px solid #f1d39a;color:#6d4a07;border-radius:10px;padding:8px 10px;font-size:13px;font-weight:700}
.readonly{background:#f6f8f8;border-radius:10px;padding:8px 10px;font-size:14px;white-space:pre-wrap;word-break:break-word;min-height:38px}
.counter{font-size:12px;color:var(--muted);text-align:right;font-weight:400}
.goal{display:grid;grid-template-columns:68px 1fr;gap:10px;align-items:center;margin-top:4px}
.flag{width:68px;height:68px;border-radius:18px;background:#fff6d8;border:2px solid #f0cf62;display:grid;place-items:center}
.goal strong{font-size:19px}.goal.done .flag{background:#e3f4ea;border-color:var(--done)}
.foot{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#1d2a30;color:#fff;padding:10px 16px;border-radius:12px;font-size:14px;z-index:20;max-width:92vw}
.cele{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;z-index:30}.cele .msg{background:#fff;border:2px solid var(--done);border-radius:18px;padding:16px 22px;font-size:20px;font-weight:900;color:#1f7543;box-shadow:0 10px 40px #0002}
.cele i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:fall 1.6s ease-in forwards}
@keyframes fall{to{transform:translateY(105vh) rotate(540deg);opacity:.9}}
.list{display:grid;gap:10px}.person{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px}.person.flagged{border-color:#f0c08d;box-shadow:0 0 0 2px #fbe3c9}
.person .row{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}.person strong{font-size:18px}
@media (prefers-reduced-motion: reduce){.is-now .node:after{animation:none;transform:scale(1.12);opacity:.5}.cele i{display:none}}
@media (max-width:360px){.wrap{padding:10px}.stage>details>summary,.goal{grid-template-columns:60px 1fr}.node{width:54px;height:54px}.is-now .node{width:60px;height:60px}.road:before{left:27px}}
`;

// ---------- 新人・指導役の「ステップの道」 ----------

export function renderPathPage({ role, nurseryName }) {
  const title = role.kind === "self" ? "わたしのステップの道" : "ステップの道（指導役）";
  return `${HEAD(title)}<body data-view="path" data-role="${esc(role.kind)}"><div class="wrap"><div class="top"><span class="brand">TRIOLAND ${esc(nurseryName || "")}</span><span id="back"></span></div><main id="app" aria-live="polite"><p class="muted">読み込み中…</p></main><noscript><p class="card">この画面はJavaScriptを使います。紙で使う場合は「印刷用」を本部にお願いしてください。</p></noscript></div><script src="/step/app.js" defer></script></body></html>`;
}

export function renderNurseryPage({ nurseryName }) {
  return `${HEAD(`${nurseryName} 新人の進み具合`)}<body data-view="nursery"><div class="wrap"><div class="top"><span class="brand">TRIOLAND ${esc(nurseryName)}</span></div><h1>新人の進み具合</h1><p class="muted small">遅れ・「つらい」・面談がまだの人を上に出しています。名前を押すと、その人の道を開いて指導役として確認を入れられます。</p><main id="app" aria-live="polite"><p class="muted">読み込み中…</p></main></div><script src="/step/app.js" defer></script></body></html>`;
}

export function renderNotFound() {
  return `${HEAD("見つかりません")}<body><div class="wrap"><div class="card"><h1>このページは開けません</h1><p class="muted">リンクが古くなったか、使えなくなっています。新しいリンクを本部・園長に確認してください。</p></div></div></body></html>`;
}

export function renderStepError(message, { admin = false } = {}) {
  return `${HEAD("表示できませんでした")}<body><div class="wrap"><div class="card"><h1>表示できませんでした</h1><p>${esc(message)}</p>${admin ? `<p><a class="btn sub" href="/admin/step">ステップアップ管理へ戻る</a></p>` : ""}</div></div></body></html>`;
}

// ---------- 印刷用（A4 縦・1人分。learner が null なら空欄の型紙） ----------

const PRINT_CSS = `body{background:#fff;font-size:12.5px;line-height:1.5}.sheet{max-width:780px;margin:0 auto;padding:16px}
.ph{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-bottom:2px solid #1d2a30;padding-bottom:6px;margin-bottom:8px}.ph h1{font-size:19px}.ph .who{font-size:13px;text-align:right}
.fill{display:inline-block;min-width:9em;border-bottom:1px solid #333}
.ps{border:1.5px solid #8a9a9e;border-radius:8px;padding:6px 10px;margin:0 0 8px;break-inside:avoid;page-break-inside:avoid}
.ps h2{font-size:14px;margin:0 0 3px;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}.ps h2 small{font-weight:400;font-size:12px}
.ps ul{list-style:none;margin:0;padding:0}.ps li{display:grid;grid-template-columns:20px 1fr auto;gap:6px;padding:2px 0;border-bottom:1px dotted #c9d1d3}.ps li:last-child{border-bottom:0}
.ps .bx{font-size:15px;line-height:1.1}.ps .dt{font-size:11px;color:#333;white-space:nowrap}
.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:5px}.sign div{border:1px solid #8a9a9e;border-radius:6px;height:34px;padding:1px 6px;font-size:10.5px;color:#444}
.pgoal{border:2px solid #c9a227;border-radius:8px;padding:8px 10px;font-weight:800;break-inside:avoid}
.noprint{margin:0 0 12px;display:flex;gap:8px;flex-wrap:wrap}
@page{size:A4 portrait;margin:11mm}
@media print{.noprint{display:none!important}body{background:#fff!important;-webkit-print-color-adjust:economy}.sheet{padding:0;max-width:none}.ps,.pgoal{background:none!important}}
`;

export function renderPrintPage({ learner, checklist, progress }) {
  const stageMap = new Map((progress?.stages || []).map((stage) => [stage.id, stage]));
  const stages = checklist.stages.map((stage) => {
    const p = stageMap.get(stage.id);
    const target = p ? `目標 ${ymd(p.target)}` : `入社から${stage.days}日`;
    const items = stage.items.map((item) => {
      const pi = p?.items.find((x) => x.id === item.id);
      const ok = Boolean(pi?.mentor_at);
      const self = Boolean(pi?.self_at);
      const dt = ok ? `確認 ${jstStamp(pi.mentor_at)}` : self ? `本人 ${jstStamp(pi.self_at)}` : "";
      return `<li><span class="bx" aria-label="${ok ? "済み" : "未"}">${ok ? "☑" : "□"}</span><span>${esc(item.text)}</span><span class="dt">${esc(dt)}</span></li>`;
    }).join("");
    const met = p?.review?.met_on ? ymd(p.review.met_on) : "";
    return `<section class="ps"><h2><span>${esc(stage.title)}${stage.milestone ? " 🚩" : ""}：${esc(stage.theme || "")}</span><small>${esc(target)}</small></h2><ul>${items}</ul><div class="sign"><div>本人サイン</div><div>指導役サイン</div><div>面談日 ${esc(met)}</div></div></section>`;
  }).join("");
  const who = learner
    ? `<div class="who">${esc(learner.nursery_name)}／${esc(learner.display_name)}さん<br>入社日 ${esc(ymd(learner.start_date))}／指導役 ${esc(learner.mentor_name || "")}</div>`
    : `<div class="who">園 <span class="fill"></span><br>名前 <span class="fill"></span>　入社日 <span class="fill"></span><br>指導役 <span class="fill"></span></div>`;
  return `${HEAD(learner ? `ステップの道（印刷用）` : "ステップの道（型紙）", PRINT_CSS)}<body data-view="print"><div class="sheet"><div class="noprint"><button class="btn" type="button" data-print>印刷する</button><span class="muted small">A4 縦で印刷します。✓は「指導役の確認」が済んだ項目です。</span></div><div class="ph"><div><h1>ステップの道 チェック表</h1><div class="small">できたら本人が□に✓、指導役が確認してサイン。お子さまの名前・病名は書かないでください。</div></div>${who}</div>${stages}<div class="pgoal">🚩 最終目標：${esc(checklist.goal)}</div></div><script src="/step/app.js" defer></script></body></html>`;
}

// ---------- 本部の管理画面 ----------

const ADMIN_CSS = `.wrap{max-width:980px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;color:var(--muted);font-weight:700}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
form.inline{display:inline}label.f{display:grid;gap:4px;font-size:13px;font-weight:700}label.f input,label.f select,textarea.code{font:inherit;font-weight:400;border:1px solid #c9d6d4;border-radius:10px;padding:9px 10px;background:#fff;width:100%}
textarea.code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;min-height:520px;line-height:1.55}
.notice{background:#e6f6ef;color:#075f4f;border-radius:12px;padding:12px 14px;font-weight:700;margin:10px 0}.notice.error{background:#fff0ef;color:#8c2d28}
.stat{background:#f7faf9;border-radius:12px;padding:12px}.stat b{display:block;font-size:24px}
.linkbox{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;word-break:break-all;background:#f6f8f8;border-radius:10px;padding:10px;user-select:all}
.qr{display:grid;place-items:center;margin:12px 0}.qr svg{max-width:100%;height:auto}
.danger{color:var(--danger)}button.btn.red{background:var(--danger)}
.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
@media print{.noprint,.top{display:none!important}.card{box-shadow:none;border:0}}
@media(max-width:640px){table.wide thead{display:none}table.wide tr{display:block;border-bottom:1px solid var(--line);padding:6px 0}table.wide td{display:block;border:0;padding:2px 0}}
`;

function adminShell(title, body, { back = "/admin/step" } = {}) {
  return `${HEAD(title, ADMIN_CSS)}<body data-view="admin"><div class="wrap"><div class="top"><span class="brand">TRIOLAND 本部・ステップアップ</span><span class="actions"><a href="${esc(back)}">← 戻る</a><a href="/admin">管理トップ</a></span></div>${body}</div><script src="/step/app.js" defer></script></body></html>`;
}

function hidden(csrf) {
  return `<input type="hidden" name="csrf" value="${esc(csrf)}">`;
}

function flagChips(progress) {
  const out = [];
  if (progress.flags.mood) out.push(`<span class="chip mood">つらい2週</span>`);
  if (progress.flags.late) out.push(`<span class="chip late">遅れ</span>`);
  if (progress.flags.reviewDue.length) out.push(`<span class="chip">面談未実施</span>`);
  return out.join(" ");
}

const STATUS_LABELS = { active: "在籍", completed: "完了", left: "退職" };
const DONE_MESSAGES = {
  created: "新人を登録しました。本人・指導役のリンクを発行してください。",
  updated: "保存しました。",
  revoked: "リンクを無効にしました。",
  left: "退職を記録しました。この人のリンクはすべて無効になりました。",
  completed: "完了にしました。この人のリンクはすべて無効になりました。",
  reactivated: "在籍に戻しました。リンクは発行し直してください。",
  deleted: "削除しました。",
};

export function renderAdminHome({ rows, tokens, stats, latest, today, csrf, notice = "", errorMessage = "" }) {
  const active = rows.filter((row) => row.learner.status === "active");
  const weight = ({ progress }) => (progress.flags.mood ? 4 : 0) + (progress.flags.late ? 2 : 0) + (progress.flags.reviewDue.length ? 1 : 0);
  const sorted = [...active].sort((a, b) => weight(b) - weight(a) || b.progress.day - a.progress.day);
  const others = rows.filter((row) => row.learner.status !== "active");
  const tr = ({ learner, progress }) => {
    const pct = progress.totalItems ? Math.round((progress.confirmedItems / progress.totalItems) * 100) : 0;
    const links = tokens.byLearner.get(learner.id) || {};
    return `<tr><td><a href="/admin/step/l/${esc(learner.id)}"><strong>${esc(learner.display_name)}</strong></a><br><span class="tiny muted">${esc(NURSERIES[learner.nursery] || learner.nursery)}・${esc(EMPLOYMENTS[learner.employment] || "")}</span></td><td>${learner.status === "active" ? `${progress.day}日目` : esc(STATUS_LABELS[learner.status])}<br><span class="tiny muted">入社 ${esc(learner.start_date)}</span></td><td>${esc(progress.nowStageTitle || "全段階達成")}<div class="bar" style="width:140px"><i style="width:${pct}%"></i></div><span class="tiny muted">${progress.confirmedItems}/${progress.totalItems}</span></td><td>${learner.status === "active" ? flagChips(progress) : learner.status === "left" ? `<span class="tiny">${esc(learner.left_date)} 退職</span>` : ""}</td><td class="tiny">${esc(learner.mentor_name || "—")}<br>${links.self ? "本人✓" : "本人—"} ${links.mentor ? "指導✓" : "指導—"}</td></tr>`;
  };
  const tenure = stats.byTenure.map((b) => `<div class="stat"><span class="tiny muted">${b.lower + 1}〜${b.limit}日</span><b>${b.count}人</b></div>`).join("")
    + `<div class="stat"><span class="tiny muted">181日〜</span><b>${stats.over180}人</b></div>`;
  const byStage = stats.byStage.map((s) => `<div class="stat"><span class="tiny muted">${esc(s.title)}の段階で</span><b>${s.count}人</b></div>`).join("");
  const retention = stats.retention.map((r) => `<div class="stat"><span class="tiny muted">${r.days}日定着率</span><b>${r.rate == null ? "—" : `${r.rate}%`}</b><span class="tiny muted">${r.stayed}/${r.eligible}人</span></div>`).join("");
  const nurseryRows = Object.entries(NURSERIES).map(([code, name]) => `<tr><td><strong>${esc(name)}</strong></td><td class="small">${tokens.byNursery.get(code) ? `発行済み（${esc(tokens.byNursery.get(code).slice(0, 10))}）` : "未発行"}</td><td><div class="actions"><form method="post" action="/admin/step/nursery/${code}/link" class="inline">${hidden(csrf)}<button class="btn sub" type="submit">${tokens.byNursery.get(code) ? "再発行（古いリンクは無効）" : "発行"}</button></form>${tokens.byNursery.get(code) ? `<form method="post" action="/admin/step/nursery/${code}/revoke" class="inline">${hidden(csrf)}<button class="btn ghost" type="submit">無効にする</button></form>` : ""}</div></td></tr>`).join("");

  const body = `<h1>中途採用者のステップアップ</h1><p class="muted small">今日 ${esc(today)}（日本時間）・チェック項目 版${latest}</p>
${notice && DONE_MESSAGES[notice] ? `<div class="notice">${esc(DONE_MESSAGES[notice])}</div>` : ""}${errorMessage ? `<div class="notice error">${esc(errorMessage)}</div>` : ""}
<section class="card"><h2>在籍中の新人（${active.length}人）</h2>${sorted.length ? `<table class="wide"><thead><tr><th>名前</th><th>入社から</th><th>いまの段階</th><th>印</th><th>指導役・リンク</th></tr></thead><tbody>${sorted.map(tr).join("")}</tbody></table>` : `<p class="muted">まだ登録がありません。</p>`}</section>
<section class="card"><h2>新人を登録</h2><p class="warn">表示名は名字だけで十分です。お子さまの情報は入れないでください。</p><form method="post" action="/admin/step/learners" class="grid2">${hidden(csrf)}
<label class="f">表示名（名字だけでよい）<input name="display_name" maxlength="20" required></label>
<label class="f">園<select name="nursery" required>${Object.entries(NURSERIES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></label>
<label class="f">入社日<input type="date" name="start_date" required></label>
<label class="f">指導役の名前<input name="mentor_name" maxlength="20"></label>
<label class="f">雇用形態<select name="employment" required>${Object.entries(EMPLOYMENTS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("")}</select></label>
<div style="align-self:end"><button class="btn" type="submit">登録する</button></div></form></section>
<section class="card"><h2>園長リンク</h2><p class="muted small">園ごとに1本。園長・園長代理が、その園の新人の一覧を見て、指導役としての確認もできます。リンクは発行した画面でしか表示されません（保存しているのはハッシュだけ）。</p><table>${nurseryRows}</table></section>
<section class="card"><h2>どこで辞めているか</h2><p class="muted small">退職を記録した人 ${stats.leftTotal}人。入社から退職日までの日数で数えています。</p><div class="grid2">${tenure}</div><h2 style="margin-top:16px">退職時の段階</h2><div class="grid2">${byStage}</div><h2 style="margin-top:16px">定着率</h2><p class="muted tiny">入社から30・90・180日を迎えた人のうち、その日まで在籍していた人の割合。</p><div class="grid2">${retention}</div></section>
${others.length ? `<section class="card"><h2>退職・完了（${others.length}人）</h2><table class="wide"><thead><tr><th>名前</th><th>状態</th><th>段階</th><th></th><th>指導役</th></tr></thead><tbody>${others.map(tr).join("")}</tbody></table></section>` : ""}
<section class="card"><h2>チェック項目・印刷</h2><div class="actions"><a class="btn sub" href="/admin/step/checklist">チェック項目を編集</a><a class="btn ghost" href="/admin/step/print/blank" target="_blank" rel="noopener">空欄の型紙を印刷</a></div></section>`;
  return adminShell("ステップアップ管理", body, { back: "/admin" });
}

export function renderAdminLearner({ learner, progress, links, latest, log, csrf, notice = "", errorMessage = "" }) {
  const id = esc(learner.id);
  const active = learner.status === "active";
  const linkRow = (kind, label) => `<tr><td><strong>${label}</strong></td><td class="small">${links[kind] ? `発行済み（${esc(links[kind].slice(0, 10))}）` : "未発行"}</td><td><div class="actions">${active ? `<form method="post" action="/admin/step/l/${id}/link" class="inline">${hidden(csrf)}<input type="hidden" name="kind" value="${kind}"><button class="btn sub" type="submit">${links[kind] ? "再発行（古いリンクは無効）" : "発行してQRを出す"}</button></form>` : ""}${links[kind] ? `<form method="post" action="/admin/step/l/${id}/revoke" class="inline">${hidden(csrf)}<input type="hidden" name="kind" value="${kind}"><button class="btn ghost" type="submit">無効にする</button></form>` : ""}</div></td></tr>`;
  const stages = progress.stages.map((s) => `<tr><td><strong>${esc(s.title)}</strong><br><span class="tiny muted">${esc(s.theme)}</span></td><td>${esc(s.target)}</td><td>${s.confirmed}/${s.total}</td><td>${s.review.met_on ? esc(s.review.met_on) : "—"}</td><td>${s.state === "done" ? `<span class="chip done">達成</span>` : s.state === "late" ? `<span class="chip late">遅れ</span>` : s.isNow ? `<span class="chip now">いま</span>` : `<span class="chip">これから</span>`}</td></tr>`).join("");
  const moods = progress.mood.recent.map((m) => `${esc(md(m.week))}週 ${esc(MOOD_LABELS[m.level])}`).join("／") || "記録なし";
  const logRows = log.map((row) => `<tr><td class="tiny">${esc(row.at.replace("T", " ").slice(0, 16))}Z</td><td class="tiny">${esc({ self: "本人", mentor: "指導役", nursery: "園長" }[row.actor] || row.actor)}</td><td class="tiny">${esc(row.action)}</td><td class="tiny">${esc(row.item_id)}</td></tr>`).join("");
  const stageOptions = progress.stages.map((s) => `<option value="${esc(s.id)}"${s.isNow ? " selected" : ""}>${esc(s.title)}</option>`).join("");

  const body = `<h1>${esc(learner.display_name)}さん</h1><p class="muted small">${esc(NURSERIES[learner.nursery])}・${esc(EMPLOYMENTS[learner.employment])}・入社 ${esc(learner.start_date)}・${esc(STATUS_LABELS[learner.status])}${learner.status === "left" ? `（${esc(learner.left_date)}）` : ""}・チェック項目 版${learner.checklist_version}${Number(learner.checklist_version) !== latest ? `（最新は版${latest}。登録時の版のまま）` : ""}</p>
${notice && DONE_MESSAGES[notice] ? `<div class="notice">${esc(DONE_MESSAGES[notice])}</div>` : ""}${errorMessage ? `<div class="notice error">${esc(errorMessage)}</div>` : ""}
<section class="card"><h2>いま</h2><p>${active ? `入社 <b>${progress.day}</b> 日目・いまの段階：<b>${esc(progress.nowStageTitle || "全段階達成")}</b>` : esc(STATUS_LABELS[learner.status])} ${active ? flagChips(progress) : ""}</p><div class="bar"><i style="width:${progress.totalItems ? Math.round((progress.confirmedItems / progress.totalItems) * 100) : 0}%"></i></div><p class="small muted">確認済み ${progress.confirmedItems}/${progress.totalItems} 項目・気分：${moods}</p>${progress.completed && active ? `<p class="notice">全段階を達成しました。「完了にする」でリンクを止められます。</p>` : ""}</section>
<section class="card"><h2>リンクと QR</h2><p class="muted small">発行すると、その画面にだけリンクと QR が出ます（あとから見ることはできません）。なくした場合は再発行してください。退職・完了にするとリンクは自動で無効になります。</p><table>${linkRow("self", "本人リンク")}${linkRow("mentor", "指導役リンク")}</table><div class="actions" style="margin-top:10px"><a class="btn ghost" href="/admin/step/print/${id}" target="_blank" rel="noopener">印刷用（チェック表）</a></div></section>
<section class="card"><h2>段階ごとの進み具合</h2><table class="wide"><thead><tr><th>段階</th><th>目標日</th><th>確認</th><th>面談日</th><th>状態</th></tr></thead><tbody>${stages}</tbody></table></section>
<section class="card"><h2>名前・指導役の変更</h2><form method="post" action="/admin/step/l/${id}/update" class="grid2">${hidden(csrf)}<label class="f">表示名<input name="display_name" maxlength="20" value="${esc(learner.display_name)}" required></label><label class="f">指導役の名前<input name="mentor_name" maxlength="20" value="${esc(learner.mentor_name || "")}"></label><div style="align-self:end"><button class="btn sub" type="submit">保存</button></div></form></section>
${active ? `<section class="card"><h2>退職の記録</h2><form method="post" action="/admin/step/l/${id}/leave" class="grid2">${hidden(csrf)}<label class="f">退職日（最終出勤日）<input type="date" name="left_date" min="${esc(learner.start_date)}" required></label><label class="f">その時点の段階<select name="left_stage"><option value="">退職日から自動で決める</option>${stageOptions}</select></label><div style="align-self:end"><button class="btn red" type="submit">退職を記録</button></div></form>
<form method="post" action="/admin/step/l/${id}/complete" style="margin-top:12px">${hidden(csrf)}<button class="btn sub" type="submit">完了にする（クラス担任まで到達）</button></form></section>`
    : `<section class="card"><form method="post" action="/admin/step/l/${id}/reactivate">${hidden(csrf)}<button class="btn sub" type="submit">在籍に戻す（記録の間違いを直すとき）</button></form></section>`}
<section class="card"><h2>操作の記録（直近30件）</h2>${logRows ? `<table><tbody>${logRows}</tbody></table>` : `<p class="muted small">まだありません。</p>`}</section>
<section class="card"><h2 class="danger">削除</h2><p class="small muted">テストで作ったデータなどを消すときだけ使います。チェック・面談・気分・リンクもすべて消えます。退職した人は「退職の記録」を使ってください（集計に残ります）。</p><form method="post" action="/admin/step/l/${id}/delete">${hidden(csrf)}<label class="small"><input type="checkbox" name="deleteConfirmed" value="true" required> この人のデータをすべて削除する</label> <button class="btn red" type="submit">削除</button></form></section>`;
  return adminShell(`${learner.display_name}さん｜ステップアップ管理`, body);
}

export function renderAdminIssuedLink({ title, who, link, qr, back }) {
  const body = `<section class="card"><h1>${esc(title)}</h1><p><strong>${esc(who)}</strong> に渡してください。このリンクを持っている人は、ログインなしで画面を開けます。</p><p class="warn noprint">この画面を閉じるとリンクは二度と表示できません（本部にはハッシュだけ保存）。なくしたら再発行してください。再読み込みすると、さらに新しいリンクになります。</p><div class="qr">${qr}</div><div class="linkbox">${esc(link)}</div><div class="actions noprint" style="margin-top:12px"><button class="btn" type="button" data-print>この QR を印刷</button><a class="btn ghost" href="${esc(back)}">戻る</a></div></section>`;
  return adminShell(title, body, { back });
}

export function renderAdminChecklist({ version, text, csrf, errors = [], saved = null }) {
  const body = `<h1>チェック項目の編集</h1><p class="muted small">いまの版：${version}。保存すると版が上がります。すでに登録した新人は、登録したときの版のまま（途中で項目が消えません）。これから登録する人に新しい版が使われます。</p>
${saved === "same" ? `<div class="notice">変更がなかったので、版は上げていません。</div>` : saved ? `<div class="notice">版${esc(saved)}として保存しました。</div>` : ""}${errors.length ? `<div class="notice error">${errors.map(esc).join("<br>")}</div>` : ""}
<section class="card"><h2>書き方</h2><ul class="small"><li><code>goal | クラス担任</code> … 最終目標</li><li><code>## d7 | 7 | 1週間 | テーマ</code> … 段階（ID｜入社からの日数｜名前｜テーマ）。末尾に <code>| 節目</code> で旗つき</li><li><code>- d7-1 | 項目の文</code> … 項目。文言を直すときは ID を残す。新しい項目は <code>- 文</code> だけ書けば ID が付きます</li><li>並べ替えは行を入れ替えるだけ。日数は上から順に大きくしてください。</li><li class="danger">個人名・お子さまの情報は書かないでください。</li></ul></section>
<form method="post" action="/admin/step/checklist" class="card">${hidden(csrf)}<textarea class="code" name="checklist" spellcheck="false">${esc(text)}</textarea><div class="actions" style="margin-top:10px"><button class="btn" type="submit">新しい版として保存</button><a class="btn ghost" href="/admin/step">やめる</a></div></form>`;
  return adminShell("チェック項目の編集", body);
}

// ---------- ブラウザ側（/step/app.js） ----------

function clientApp() {
  "use strict";
  for (const button of document.querySelectorAll("[data-print]")) button.addEventListener("click", () => window.print());
  const view = document.body.dataset.view;
  if (view !== "path" && view !== "nursery") return;
  const match = location.pathname.match(/^\/step\/([smn])\/([A-Za-z0-9_-]{43})(?:\/l\/([a-f0-9]{32}))?/);
  if (!match) return;
  const token = match[2];
  const learnerId = match[3] || null;
  const base = `/step/${match[1]}/${token}`;
  const root = document.getElementById("app");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const open = new Set();
  const drafts = new Map();
  let data = null;
  let busy = false;

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value == null || value === false) continue;
      if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else if (key === "class") el.className = value;
      else if (key === "style") el.setAttribute("style", value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  }

  const stampFmt = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const stamp = (iso) => (iso ? stampFmt.format(new Date(iso)) : "");
  const md = (value, today) => {
    if (!value) return "";
    const [y, m, d] = value.split("-");
    return today && today.slice(0, 4) !== y ? `${y}/${Number(m)}/${Number(d)}` : `${Number(m)}/${Number(d)}`;
  };

  function toast(message) {
    const el = h("div", { class: "toast", role: "status" }, message);
    document.body.append(el);
    setTimeout(() => el.remove(), 3200);
  }

  function celebrate(title) {
    const layer = h("div", { class: "cele", "aria-hidden": "true" }, h("div", { class: "msg" }, `「${title}」達成！`));
    if (!reduceMotion) {
      const colors = ["#2f9e5d", "#087f74", "#f0cf62", "#e07a1f", "#6aa9ff", "#ef8fa8"];
      for (let i = 0; i < 36; i += 1) {
        layer.append(h("i", { style: `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.4}s` }));
      }
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), reduceMotion ? 2200 : 2000);
    toast(`「${title}」達成です。おつかれさまでした。`);
  }

  async function api(method, name, body) {
    const query = method === "GET" && learnerId ? `?learner=${learnerId}` : "";
    const response = await fetch(`/step/api/${name}${query}`, {
      method,
      headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(learnerId ? { ...body, learner_id: learnerId } : body) : undefined,
      cache: "no-store",
      credentials: "omit",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const messages = { RATE_LIMITED: "操作が多すぎます。1分ほど待ってください。", NOT_FOUND: "このリンクは使えなくなっています。", NOTE_TOO_LONG: "200字までにしてください。", FORBIDDEN: "この操作はできません。" };
      throw new Error(messages[payload.error] || "うまく保存できませんでした。通信を確認してもう一度押してください。");
    }
    return payload;
  }

  async function act(name, body) {
    if (busy) return;
    busy = true;
    document.body.classList.add("busy");
    for (const b of root.querySelectorAll("button")) b.disabled = true;
    const before = new Map((data?.progress?.stages || []).map((s) => [s.id, s.done]));
    try {
      data = await api("POST", name, body);
      render();
      for (const s of data.progress.stages) if (s.done && before.get(s.id) === false) celebrate(s.title);
      return true;
    } catch (error) {
      toast(error.message);
      render();
      return false;
    } finally {
      busy = false;
      document.body.classList.remove("busy");
    }
  }

  // ---- 新人・指導役 ----
  function renderPath() {
    const { learner, role, progress, noteMax } = data;
    const nodes = [];
    if (learnerId) document.getElementById("back").replaceChildren(h("a", { href: `/step/n/${token}` }, "← 一覧へ"));

    const pct = progress.totalItems ? Math.round((progress.confirmedItems / progress.totalItems) * 100) : 0;
    const dayText = progress.day >= 1 ? h("div", { class: "day" }, "入社", h("b", {}, String(progress.day)), "日目") : h("div", { class: "day" }, `入社日は ${md(learner.start_date, progress.today)} です`);
    nodes.push(h("section", { class: "card where", "aria-label": "いまの位置" },
      h("h1", {}, role.kind === "self" ? `${learner.display_name}さんのステップの道` : `${learner.display_name}さんの道`),
      dayText,
      progress.completed
        ? h("div", { class: "stage" }, `全段階を達成！ ${progress.goal}へ`)
        : h("div", { class: "stage" }, `いまの段階：${progress.nowStageTitle}`, h("span", {}, progress.nowStageTheme)),
      h("div", { class: "small muted" }, `指導役：${learner.mentor_name ? `${learner.mentor_name}さん` : "未定"}`),
      h("div", { class: "bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(progress.totalItems), "aria-valuenow": String(progress.confirmedItems) }, h("i", { style: `width:${pct}%` })),
      h("div", { class: "tiny muted" }, `確認済み ${progress.confirmedItems}/${progress.totalItems} 項目・最後は「${progress.goal}」`)));

    if (role.kind !== "self" && progress.mood.alert) nodes.push(h("div", { class: "alert mood" }, "「つらい」が2週続いています。声をかけて、話を聞く時間をとってください。"));
    if (progress.flags.late) {
      nodes.push(h("div", { class: "alert" }, role.kind === "self"
        ? "目標日を過ぎた段階があります。あせらなくて大丈夫。指導役と一緒に、次の1つから進めましょう。"
        : "目標日を過ぎた段階があります。どこでつまずいているか、一緒に確認してください。"));
    }

    if (progress.next.length) {
      nodes.push(h("section", { class: "card next" }, h("h2", {}, "次にやること"),
        h("ol", {}, progress.next.map((n) => h("li", {}, h("b", {}, n.stage_title), h("span", {}, n.text, n.self_at ? h("span", { class: "tiny muted" }, "（できた・確認待ち）") : null))))));
    }

    if (role.canMood) {
      const levels = [[1, "順調"], [2, "ちょっと大変"], [3, "つらい"]];
      nodes.push(h("section", { class: "card" }, h("h2", {}, "今週の気分は？"),
        h("div", { class: "mood-row", role: "group", "aria-label": "今週の気分" }, levels.map(([level, label]) => h("button", {
          type: "button",
          "aria-pressed": progress.mood.thisWeek === level ? "true" : "false",
          onclick: () => act("mood", { level }).then((ok) => ok && toast("ありがとうございます。指導役にも伝わります。")),
        }, label))),
        h("p", { class: "tiny muted", style: "margin:8px 0 0" }, "週に1回。何度でも選び直せます。")));
    }

    const road = h("ol", { class: "road", "aria-label": "ステップの道" });
    for (const stage of progress.stages) {
      const stateLabel = { done: "達成", late: "目標日を過ぎています", now: "いま", upcoming: "これから" }[stage.state];
      const icon = stage.state === "done" ? "✓" : stage.milestone ? "★" : String(progress.stages.indexOf(stage) + 1);
      const details = h("details", { ontoggle: (event) => (event.target.open ? open.add(stage.id) : open.delete(stage.id)) });
      if (open.has(stage.id)) details.open = true;
      details.append(h("summary", { "aria-label": `${stage.title} ${stateLabel} ${stage.confirmed}/${stage.total}` },
        h("span", { class: "node", "aria-hidden": "true" }, icon),
        h("span", { class: "label" },
          h("span", { class: "t" }, h("strong", {}, stage.title), h("span", { class: "tiny muted" }, `目標 ${md(stage.target, progress.today)}`)),
          h("span", { class: "theme" }, stage.theme),
          h("span", { class: "meta" },
            h("span", { class: `chip ${stage.state === "done" ? "done" : stage.state === "late" ? "late" : stage.isNow ? "now" : ""}` }, stage.state === "late" ? "まだのところあり" : stateLabel),
            h("span", { class: "chip" }, `${stage.confirmed}/${stage.total}`),
            stage.reviewDue ? h("span", { class: "chip" }, "面談まだ") : null))));
      details.append(renderStagePanel(stage, role, noteMax, progress.today));
      road.append(h("li", { class: `stage st-${stage.state}${stage.isNow ? " is-now" : ""}` }, details));
    }
    nodes.push(h("section", { "aria-label": "道" }, road,
      h("div", { class: `goal${progress.completed ? " done" : ""}` }, h("span", { class: "flag", "aria-hidden": "true" }, h("span", { style: "font-size:30px" }, "🚩")), h("span", {}, h("span", { class: "tiny muted" }, "最終目標"), h("br"), h("strong", {}, progress.goal)))));

    nodes.push(h("div", { class: "foot" },
      h("a", { class: "btn sub", href: `${location.pathname.replace(/\/$/, "")}/print`, target: "_blank", rel: "noopener" }, "印刷用"),
      h("button", { class: "btn ghost", type: "button", onclick: load }, "最新にする")));
    root.replaceChildren(...nodes);
  }

  function renderStagePanel(stage, role, noteMax, today) {
    const items = h("ul", { class: "items" });
    for (const item of stage.items) {
      const ok = Boolean(item.mentor_at);
      const acts = [];
      if (role.canSelf) {
        if (item.self_at) acts.push(h("span", { class: "state" }, `できた ${stamp(item.self_at)}`), h("button", { class: "btn ghost", type: "button", onclick: () => act("check", { item_id: item.id, action: "undo_self" }) }, "取り消す"));
        else acts.push(h("button", { class: "btn", type: "button", onclick: () => act("check", { item_id: item.id, action: "self" }) }, "できた"));
        acts.push(h("span", { class: `state${ok ? " ok" : ""}` }, ok ? `✓ 指導役が確認 ${stamp(item.mentor_at)}` : item.self_at ? "指導役の確認待ち" : ""));
      } else {
        acts.push(h("span", { class: "state" }, item.self_at ? `本人：できた ${stamp(item.self_at)}` : "本人：まだ"));
        if (ok) acts.push(h("span", { class: "state ok" }, `✓ 確認 ${stamp(item.mentor_at)}`), h("button", { class: "btn ghost", type: "button", onclick: () => act("check", { item_id: item.id, action: "undo_mentor" }) }, "取り消す"));
        else acts.push(h("button", { class: "btn", type: "button", onclick: () => act("check", { item_id: item.id, action: "mentor" }) }, "確認"));
      }
      items.append(h("li", { class: `item${ok ? " ok" : ""}` },
        h("div", { class: "text" }, h("span", { class: "box", "aria-hidden": "true" }, ok ? "✓" : ""), h("span", {}, item.text)),
        h("div", { class: "acts" }, acts)));
    }

    const review = h("div", { class: "review" }, h("strong", {}, "振り返り面談"),
      h("div", { class: "tiny muted" }, "全部の項目を指導役が確認して、面談も済むと、この段階は「達成」です。"));
    const field = (key, label, editable) => {
      const draftKey = `${stage.id}:${key}`;
      const value = drafts.has(draftKey) ? drafts.get(draftKey) : stage.review[key] || "";
      if (!editable) return h("label", {}, label, h("div", { class: "readonly" }, value || "—"));
      const counter = h("span", { class: "counter" }, `${[...value].length}/${noteMax}`);
      const area = h("textarea", { maxlength: String(noteMax), oninput: (e) => { drafts.set(draftKey, e.target.value); counter.textContent = `${[...e.target.value].length}/${noteMax}`; } });
      area.value = value;
      return h("label", {}, label, area, counter);
    };
    let dateInput = null;
    if (role.canMentor) {
      const dk = `${stage.id}:met_on`;
      dateInput = h("input", { type: "date", max: today, oninput: (e) => drafts.set(dk, e.target.value) });
      dateInput.value = drafts.has(dk) ? drafts.get(dk) : stage.review.met_on || "";
      review.append(h("label", {}, "面談した日", dateInput));
    } else {
      review.append(h("label", {}, "面談した日", h("div", { class: "readonly" }, stage.review.met_on ? md(stage.review.met_on, today) : "まだ")));
    }
    review.append(h("div", { class: "warn" }, "お子さまの名前・病名は書かないでください（200字まで）"));
    review.append(field("self_note", "本人のひとこと", role.canSelf));
    review.append(field("mentor_note", "指導役のひとこと", role.canMentor));
    review.append(h("div", {}, h("button", {
      class: "btn sub",
      type: "button",
      onclick: async () => {
        const body = { stage_id: stage.id };
        if (role.canSelf) body.self_note = drafts.has(`${stage.id}:self_note`) ? drafts.get(`${stage.id}:self_note`) : stage.review.self_note;
        if (role.canMentor) {
          body.mentor_note = drafts.has(`${stage.id}:mentor_note`) ? drafts.get(`${stage.id}:mentor_note`) : stage.review.mentor_note;
          body.met_on = dateInput.value || null;
        }
        const keys = ["self_note", "mentor_note", "met_on"].map((k) => `${stage.id}:${k}`);
        const saved = keys.map((k) => [k, drafts.get(k)]);
        keys.forEach((k) => drafts.delete(k));
        const ok = await act("review", body);
        if (ok) toast("面談の記録を保存しました。");
        else {
          for (const [k, v] of saved) if (v !== undefined) drafts.set(k, v);
          render();
        }
      },
    }, "面談の記録を保存")));
    return h("div", { class: "panel" }, h("p", { class: "small muted", style: "margin:0 0 8px" }, `目標日 ${md(stage.target, today)}（入社から${stage.days}日）`), items, review);
  }

  // ---- 園長 ----
  function renderNursery() {
    const { learners } = data;
    if (!learners.length) {
      root.replaceChildren(h("div", { class: "card" }, h("p", {}, "いま登録されている新人はいません。")));
      return;
    }
    const list = h("div", { class: "list" });
    for (const p of learners) {
      const flagged = p.flags.late || p.flags.mood || p.flags.reviewDue;
      const pct = p.total ? Math.round((p.confirmed / p.total) * 100) : 0;
      list.append(h("a", { class: `person${flagged ? " flagged" : ""}`, href: `${base}/l/${p.id}` },
        h("div", { class: "row" }, h("strong", {}, `${p.display_name}さん`), h("span", { class: "small muted" }, p.day >= 1 ? `入社${p.day}日目` : "入社前")),
        h("div", { class: "small" }, p.completed ? "全段階達成" : `いま：${p.now_stage}（${p.now_theme}）`),
        h("div", { class: "bar" }, h("i", { style: `width:${pct}%` })),
        h("div", { class: "meta" },
          h("span", { class: "chip" }, `${p.confirmed}/${p.total}`),
          p.flags.mood ? h("span", { class: "chip mood" }, "つらい2週") : null,
          p.flags.late ? h("span", { class: "chip late" }, "遅れ") : null,
          p.flags.reviewDue ? h("span", { class: "chip" }, "面談未実施") : null,
          h("span", { class: "tiny muted" }, `指導役 ${p.mentor_name || "未定"}・${p.employment}`))));
    }
    root.replaceChildren(list);
  }

  function render() {
    if (!data) return;
    if (view === "nursery") renderNursery();
    else renderPath();
  }

  async function load() {
    try {
      data = await api("GET", view === "nursery" ? "nursery" : "me");
      render();
    } catch (error) {
      root.replaceChildren(h("div", { class: "card" }, h("p", {}, error.message)));
    }
  }

  load();
}

// wrangler の bundler（esbuild の keepNames）は関数の中に __name(...) を差し込むので、受け皿を先に置く。
export const STEP_APP_JS = `var __name = function (fn) { return fn; };\n(${clientApp.toString()})();\n`;
