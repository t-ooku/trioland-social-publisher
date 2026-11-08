// ステップアップ表の画面（HTML・CSS・JS）。外部のフォント・CDN・解析タグは使わない。
// JS は String.raw で埋め込むため、バッククォートと「ドル記号＋波かっこ」は使わないこと。

export const STEP_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<title>保育ステップアップ表</title>
<link rel="stylesheet" href="/step/app.css">
<script src="/step/app.js" defer></script>
</head>
<body>
<header class="top"><div class="wrap">
  <div class="brand">保育ステップアップ表</div>
  <nav class="tabs" id="tabs" aria-label="画面の切り替え" hidden></nav>
</div></header>
<main class="wrap" id="app"><p class="loading">読み込み中…</p></main>
<div id="print" aria-hidden="true"></div>
<noscript><p class="wrap">この画面は JavaScript を有効にして開いてください。</p></noscript>
</body>
</html>`;

export const STEP_CSS = String.raw`
:root{
  --bg:#F4F7F6;--surface:#FFFFFF;--ink:#1C2B30;--muted:#5E7177;--line:#D7E3E1;
  --brand:#1F8A85;--brand-ink:#FFFFFF;--brand-soft:#E3F2F0;
  --accent:#F2A541;--accent-ink:#7A4A06;--accent-soft:#FDF0DD;
  --late:#C7701F;--late-soft:#FCEBDD;--done:#2E9E6A;--done-soft:#E2F4EA;--idle:#B9C6C8;--danger:#C2452D;
  --display:"Hiragino Maru Gothic ProN","Hiragino Maru Gothic Pro","M PLUS Rounded 1c","BIZ UDPGothic","Yu Gothic",sans-serif;
  --body:"Hiragino Sans","Hiragino Kaku Gothic ProN","BIZ UDPGothic","Yu Gothic","Meiryo",sans-serif;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){:root{
  --bg:#0F1A1C;--surface:#172427;--ink:#E6EFEE;--muted:#9AB0B3;--line:#2A3B3F;
  --brand:#3FB0A9;--brand-ink:#08201F;--brand-soft:#1C3533;--accent:#F2B45E;--accent-ink:#F7D9A8;--accent-soft:#3A2E1C;
  --late:#E9A05A;--late-soft:#3A2A1C;--done:#4CC08A;--done-soft:#17322A;--idle:#4A5C60;--danger:#F08A73;color-scheme:dark}}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.6;-webkit-text-size-adjust:100%}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
[hidden]{display:none!important}
.wrap{max-width:720px;margin:0 auto;padding:0 16px 56px}
header.top{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--line)}
.top .wrap{display:flex;align-items:center;gap:10px;padding-top:10px;padding-bottom:10px;flex-wrap:wrap}
.brand{font-family:var(--display);font-weight:800;font-size:18px;margin-right:auto}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tabs a{font-family:var(--display);font-weight:700;font-size:14px;text-decoration:none;color:var(--muted);padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:var(--surface)}
.tabs a[aria-current="page"]{background:var(--brand);color:var(--brand-ink);border-color:var(--brand)}
.loading{padding:24px 0;color:var(--muted)}
.notice{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:var(--accent-soft);font-size:14px}
.notice.err{background:var(--late-soft);color:var(--ink)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:12px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:460px){.grid2{grid-template-columns:1fr}}
label.f{display:grid;gap:4px;font-size:13px;color:var(--muted);font-weight:600}
input[type=text],input[type=date],input[type=number],select,textarea{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:100%}
textarea{resize:vertical;min-height:52px}
.btn{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 14px;font-weight:700;font-size:14px}
.btn.primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.btn.warn{color:var(--danger);border-color:var(--danger)}
.btn.small{padding:4px 10px;font-size:12px}
.btn:disabled{opacity:.45;cursor:not-allowed}
.hint{font-size:12px;color:var(--muted);margin:6px 0 0}
.muted{color:var(--muted)}
h2.sec{font-family:var(--display);font-size:17px;margin:20px 0 0}
.now-head{display:flex;gap:14px;align-items:center}
.daybadge{flex:none;width:76px;height:76px;border-radius:50%;background:var(--brand);color:var(--brand-ink);display:grid;place-content:center;text-align:center;font-family:var(--display);line-height:1.1}
.daybadge b{font-size:26px;display:block}
.daybadge small{font-size:11px}
.now-text h1{margin:0;font-family:var(--display);font-size:19px}
.now-text p{margin:2px 0 0;color:var(--muted);font-size:13px}
.bar{height:10px;border-radius:999px;background:var(--brand-soft);overflow:hidden;margin-top:4px}
.bar i{display:block;height:100%;background:var(--brand);border-radius:999px}
.next h3{margin:12px 0 4px;font-size:13px;color:var(--muted)}
.next ol{margin:0;padding-left:20px}
.mood{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.mood button{flex:1 1 90px;border:1.5px solid var(--line);background:var(--surface);border-radius:12px;padding:10px 6px;font-weight:700}
.mood button[aria-pressed="true"]{border-color:var(--brand);background:var(--brand-soft)}
.alert{border-left:6px solid var(--late);background:var(--late-soft)}
.path{position:relative;margin:24px 0 0;padding:0;list-style:none}
.path::before{content:"";position:absolute;left:50%;top:20px;bottom:30px;width:6px;margin-left:-3px;background:repeating-linear-gradient(to bottom,var(--line) 0 10px,transparent 10px 18px)}
.stage{position:relative;display:grid;justify-items:center;margin-bottom:22px}
.node{position:relative;width:84px;height:84px;border-radius:50%;border:none;background:var(--surface);display:grid;place-content:center;font-family:var(--display);font-weight:800;font-size:15px;color:var(--ink);box-shadow:0 5px 0 var(--line);text-align:center;line-height:1.1}
.node small{display:block;font-size:11px;color:var(--muted)}
.stage.done .node{background:var(--done);color:#fff;box-shadow:0 5px 0 #1f7a50}
.stage.current .node{background:var(--brand);color:var(--brand-ink);box-shadow:0 5px 0 #146a66}
.stage.late .node{background:var(--late);color:#fff;box-shadow:0 5px 0 #8f4f15}
.stage.done .node small,.stage.current .node small,.stage.late .node small{color:inherit;opacity:.85}
.stage.current .node::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:3px solid var(--brand);opacity:.5;animation:pulse 1.8s ease-out infinite}
@keyframes pulse{0%{transform:scale(.92);opacity:.6}100%{transform:scale(1.12);opacity:0}}
@media (prefers-reduced-motion:reduce){.stage.current .node::after{animation:none;opacity:.4}}
.cap{margin-top:10px;text-align:center;font-size:13px;color:var(--muted)}
.cap b{color:var(--ink);font-size:14px}
.chip{display:inline-block;font-size:11px;font-weight:700;padding:1px 8px;border-radius:999px;margin-left:4px}
.chip.late{background:var(--late-soft);color:var(--late)}
.chip.done{background:var(--done-soft);color:var(--done)}
.chip.ms{background:var(--accent-soft);color:var(--accent-ink)}
.chip.rev{background:var(--brand-soft);color:var(--brand)}
.panel{width:100%;margin-top:12px;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:12px;z-index:1}
.items{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.item{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:grid;gap:6px}
.item.ok{border-color:var(--done);background:var(--done-soft)}
.item .t{font-weight:700;display:flex;gap:8px}
.mark{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid var(--idle);display:grid;place-content:center;font-size:13px;margin-top:1px}
.item.ok .mark{background:var(--done);border-color:var(--done);color:#fff}
.item details summary{font-size:12px;color:var(--brand);cursor:pointer}
.item details p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tog{border:1.5px solid var(--line);background:var(--surface);border-radius:999px;padding:3px 10px;font-size:12px;font-weight:700;color:var(--muted)}
.tog[aria-pressed="true"]{background:var(--brand);border-color:var(--brand);color:var(--brand-ink)}
.tog.m[aria-pressed="true"]{background:var(--done);border-color:var(--done);color:#fff}
.when{font-size:11px;color:var(--muted)}
.review{margin-top:10px;border-top:1px dashed var(--line);padding-top:10px;display:grid;gap:8px}
.goal{display:grid;justify-items:center;gap:6px}
.flag{background:var(--accent);color:#3B2604;font-family:var(--display);font-weight:800;font-size:18px;padding:12px 22px;border-radius:14px;box-shadow:0 5px 0 #c9852f}
.list{display:grid;gap:8px;margin-top:12px}
.lrow{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;text-align:left;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px}
.lrow.flagged{border-left:6px solid var(--late)}
.lrow .nm{font-weight:700}
.lrow .meta{font-size:12px;color:var(--muted)}
.links{display:grid;gap:12px;grid-template-columns:1fr 1fr}
@media (max-width:520px){.links{grid-template-columns:1fr}}
.linkbox{border:1px solid var(--line);border-radius:12px;padding:10px;display:grid;gap:6px;justify-items:start}
.linkbox code{font-size:11px;word-break:break-all}
.ed-stage .ed-head{display:grid;grid-template-columns:1fr 96px;gap:8px}
.ed-stage .ed-head .theme{grid-column:1/-1}
.ed-items{list-style:none;margin:12px 0 8px;padding:0;display:grid;gap:8px;min-height:40px}
.ed-items:empty::before{content:"ここに項目をドラッグ";display:block;padding:8px;text-align:center;color:var(--muted);font-size:13px;border:1px dashed var(--line);border-radius:10px}
.ed-item{display:grid;grid-template-columns:38px 1fr 34px;gap:8px;align-items:start;border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--surface)}
.ed-item.dragging{opacity:.55;border-style:dashed;border-color:var(--brand)}
.handle{width:38px;height:38px;border-radius:8px;border:1px solid var(--line);background:var(--bg);display:grid;place-content:center;cursor:grab;touch-action:none;font-size:17px;color:var(--muted);user-select:none;-webkit-user-select:none}
.ed-item .fields{display:grid;gap:6px}
.ed-item .side{display:grid;gap:4px}
.ed-item .side button{width:34px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--surface);font-size:13px;line-height:1}
.ed-item .side .del{color:var(--danger)}
.savebar{position:sticky;bottom:12px;margin-top:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px 12px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
.savebar .st{margin-right:auto;font-size:13px;color:var(--muted)}
.savebar .st.dirty{color:var(--late);font-weight:700}
table.stats{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
table.stats td,table.stats th{border-bottom:1px solid var(--line);padding:6px 4px;text-align:left}
#print{display:none}
@media print{
  @page{size:A4;margin:12mm}
  body{background:#fff;color:#000;font-size:10.5pt}
  header.top,#app{display:none!important}
  #print{display:block}
  .pr h1{font-size:15pt;margin:0 0 4px}
  .pr .meta{font-size:9.5pt;margin:0 0 8px}
  .pr .st{break-inside:avoid;border:1px solid #888;border-radius:6px;padding:6px 8px;margin:0 0 6px}
  .pr .st h2{font-size:11pt;margin:0 0 4px}
  .pr table{width:100%;border-collapse:collapse}
  .pr td{border-top:1px solid #ddd;padding:3px 2px;vertical-align:top}
  .pr td.b{width:16px;font-size:12pt}
  .pr td.d{width:70px;font-size:8.5pt;color:#444}
  .pr .det{font-size:8.5pt;color:#555}
  .pr .sign{font-size:9pt;margin-top:4px}
  .pr .card-print{border:1px dashed #888;padding:8px;margin:0 0 8px;break-inside:avoid}
}
`;

export const STEP_JS = String.raw`(function(){
"use strict";
var app=document.getElementById("app"),tabs=document.getElementById("tabs"),printBox=document.getElementById("print");
var m=location.pathname.match(/^\/step\/([smn])\/([A-Za-z0-9_-]+)$/);
var TOKEN=m?m[2]:"";
var S={me:null,detail:null,detailId:null,draft:null,dirty:false,baseVersion:null,issued:null,busy:false,open:null,msg:""};
var ROLE_LABEL={self:"新人",mentor:"指導役",nursery:"園長"};

function el(tag,attrs){var n=document.createElement(tag);if(attrs){for(var k in attrs){var v=attrs[k];if(v===null||v===undefined||v===false)continue;if(k==="class")n.className=v;else if(k==="text")n.textContent=v;else if(k.indexOf("on")===0)n.addEventListener(k.slice(2),v);else n.setAttribute(k,v===true?"":v);}}for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c===null||c===undefined||c===false)continue;if(Array.isArray(c)){c.forEach(function(x){if(x)n.append(x.nodeType?x:document.createTextNode(String(x)));});}else n.append(c.nodeType?c:document.createTextNode(String(c)));}return n;}
function md(s){if(!s)return "";var p=s.split("-");return Number(p[1])+"/"+Number(p[2]);}
function ts(iso){if(!iso)return "";var d=new Date(iso);return (d.getMonth()+1)+"/"+d.getDate();}

var ERR={LINK_INVALID:"このリンクは使えません。園長に新しいリンクをもらってください。",LEARNER_NOT_ACTIVE:"この新人は修了または退職になっているため、変更できません。",CHECKLIST_CHANGED:"ほかの人が先に項目を保存しました。画面を開き直してから、もう一度編集してください。",BAD_DATE:"日付が正しくありません。",NAME_REQUIRED:"名前を入れてください。",FORBIDDEN:"この操作はできません。",STEP_DB_NOT_CONFIGURED:"準備中です。しばらくしてから開いてください。"};
function api(method,path,body){return fetch("/step/api"+path,{method:method,headers:Object.assign({"authorization":"Bearer "+TOKEN},body?{"content-type":"application/json"}:{}),body:body?JSON.stringify(body):undefined,cache:"no-store"}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(j.error||("HTTP "+r.status));e.code=j.error;e.status=r.status;throw e;}return j;});});}
function errText(e){return ERR[e&&e.code]||"うまくいきませんでした。通信を確認して、もう一度お試しください。";}
function flash(text,isErr){S.msg=text;S.msgErr=!!isErr;render();}

function load(){
  if(!TOKEN||document.body.dataset.notfound){app.replaceChildren(el("div",{class:"card"},el("h1",{text:"ページが見つかりません"}),el("p",{text:"園長からもらったリンクを開いてください。"})));return Promise.resolve();}
  return api("GET","/me").then(function(j){S.me=j;if(j.role==="nursery"&&!S.dirty){S.draft=clone(j.checklist.stages);S.baseVersion=j.checklist.version;}return S.detailId?loadDetail(S.detailId):null;}).then(render).catch(function(e){app.replaceChildren(el("div",{class:"card"},el("h1",{text:"開けませんでした"}),el("p",{text:errText(e)})));});
}
function loadDetail(id){return api("GET","/learners/"+id).then(function(j){S.detail=j;S.detailId=id;}).catch(function(e){S.detail=null;S.detailId=null;flash(errText(e),true);});}
function clone(o){return JSON.parse(JSON.stringify(o));}

/* ---------- 画面の切り替え（園長） ---------- */
function route(){return (location.hash||"").slice(1);}
window.addEventListener("hashchange",function(){var r=route();if(S.me&&S.me.role==="nursery"){var lm=r.match(/^l-([0-9a-f]{20})$/);if(lm){if(S.detailId!==lm[1]){S.detail=null;S.detailId=lm[1];loadDetail(lm[1]).then(render);}else render();return;}S.detailId=null;S.detail=null;}render();});
window.addEventListener("beforeunload",function(e){if(S.dirty){e.preventDefault();e.returnValue="";}});

function render(){
  var me=S.me;if(!me)return;
  var nodes=[];
  if(S.msg)nodes.push(el("p",{class:"notice"+(S.msgErr?" err":""),role:"status",text:S.msg}));
  if(me.role==="nursery"){
    var r=route();
    tabs.hidden=false;
    var tabDefs=[["list","新人の一覧"],["edit","項目の編集"],["stats","集計"]];
    var cur=/^l-/.test(r)?"list":(["list","edit","stats"].indexOf(r)>=0?r:"list");
    tabs.replaceChildren.apply(tabs,tabDefs.map(function(t){return el("a",{href:"#"+t[0],"aria-current":t[0]===cur?"page":null,text:t[1]});}));
    if(/^l-/.test(r)){nodes=nodes.concat(S.detail?renderLearner(S.detail,"nursery"):[el("p",{class:"loading",text:"読み込み中…"})]);}
    else if(r==="edit")nodes=nodes.concat(renderEditor());
    else if(r==="stats")nodes=nodes.concat(renderStats());
    else nodes=nodes.concat(renderList());
  }else{
    tabs.hidden=true;
    nodes=nodes.concat(renderLearner(me,me.role));
  }
  app.replaceChildren.apply(app,nodes);
  if(S.afterRender){var f=S.afterRender;S.afterRender=null;f();}
}

/* ---------- 新人の道（本人・指導役・園長の詳細） ---------- */
function renderLearner(d,role){
  var L=d.learner,v=d.view,out=[];
  var canSelf=role==="self"&&L.status==="active";
  var canMentor=(role==="mentor"||role==="nursery")&&L.status==="active";
  var badge=d.dayNo>=1?el("div",{class:"daybadge"},el("small",{text:"入社"}),el("b",{text:String(d.dayNo)}),el("small",{text:"日目"})):el("div",{class:"daybadge"},el("small",{text:"入社まで"}),el("b",{text:String(1-d.dayNo)}),el("small",{text:"日"}));
  var status={active:"",completed:"（修了）",left:"（退職）"}[L.status]||"";
  var head=el("div",{class:"card"},
    role==="nursery"?el("p",{style:"margin:0 0 8px"},el("a",{href:"#list",text:"← 新人の一覧へ"})):null,
    el("div",{class:"now-head"},badge,el("div",{class:"now-text"},
      el("h1",{text:L.display_name+" さん"+status}),
      el("p",{text:L.nursery_name+"　指導役："+(L.mentor_name||"未定")+"　（"+ROLE_LABEL[role]+"の画面）"}),
      el("p",{text:v.current?"いまの段階："+v.current.title+"「"+v.current.theme+"」":"全段階を達成しました"}))),
    el("div",{style:"margin-top:12px"},el("div",{class:"row",style:"justify-content:space-between;font-size:13px"},el("span",{class:"muted",text:"指導役の確認が済んだ項目"}),el("b",{text:v.ok+" / "+v.total})),
      el("div",{class:"bar",role:"progressbar","aria-valuemin":"0","aria-valuemax":String(v.total),"aria-valuenow":String(v.ok),"aria-label":"確認済みの項目"},el("i",{style:"width:"+(v.total?Math.round(v.ok/v.total*100):0)+"%"}))),
    v.next.length?el("div",{class:"next"},el("h3",{text:"次にやること（"+(v.current?v.current.title:"")+"）"}),el("ol",null,v.next.map(function(t){return el("li",{text:t});}))):null,
    v.current&&v.current.needsReview?el("p",{class:"notice",text:"この段階の項目はすべて確認済みです。振り返り面談をして、面談日を入れると達成になります。"}):null,
    el("div",{class:"row",style:"margin-top:12px"},el("button",{class:"btn",type:"button",onclick:function(){printLearner(d);},text:"印刷する"})));
  out.push(head);
  if(d.moodAlert&&role!=="self")out.push(el("div",{class:"card alert"},el("b",{text:"「つらい」が2週続いています。"}),el("p",{style:"margin:4px 0 0",text:"今週中に、指導役か園長が話を聞く時間をとってください。"})));
  if(role==="self"&&L.status==="active")out.push(renderMood(d));
  if(role!=="self"&&d.moods&&d.moods.length)out.push(el("p",{class:"hint",text:"最近の気分："+d.moods.slice(0,4).map(function(x){return md(x.week)+"週 "+["","順調","ちょっと大変","つらい"][x.level];}).join("　")}));
  var path=el("ol",{class:"path"});
  v.stages.forEach(function(st){
    var cls="stage "+st.state+(st.late?" late":"");
    var li=el("li",{class:cls});
    var open=S.open===st.id;
    li.append(el("button",{class:"node",type:"button","aria-expanded":open?"true":"false",onclick:function(){S.open=open?null:st.id;render();}},st.title,el("small",{text:st.ok+"/"+st.total})));
    li.append(el("div",{class:"cap"},el("b",{text:st.theme}),st.milestone?el("span",{class:"chip ms",text:"節目"}):null,
      st.state==="done"?el("span",{class:"chip done",text:"達成"}):(st.late?el("span",{class:"chip late",text:"目標日を過ぎています"}):null),
      st.needsReview?el("span",{class:"chip rev",text:"面談待ち"}):null,
      el("div",{text:"目標日 "+md(st.target)+"（"+st.days+"日目）"})));
    if(open)li.append(renderStagePanel(d,st,role,canSelf,canMentor));
    path.append(li);
  });
  out.push(path);
  out.push(el("div",{class:"goal"},el("div",{class:"flag",text:"🏁 クラス担任"}),el("p",{class:"muted",style:"margin:0",text:"入社6ヶ月で、クラス担任として一人立ち"})));
  if(role==="nursery")out.push(renderManage(d));
  return out;
}

function renderStagePanel(d,st,role,canSelf,canMentor){
  var L=d.learner;
  var ul=el("ul",{class:"items"});
  st.items.forEach(function(it){
    var ok=!!it.mentor_at;
    var b1=el("button",{class:"tog",type:"button","aria-pressed":it.self_at?"true":"false",disabled:!canSelf,text:"本人 できた",onclick:function(){act({learner_id:L.id,item_id:it.id,action:it.self_at?"undo_self":"self"});}});
    var b2=el("button",{class:"tog m",type:"button","aria-pressed":ok?"true":"false",disabled:!canMentor,text:"指導役 確認",onclick:function(){act({learner_id:L.id,item_id:it.id,action:ok?"undo_mentor":"mentor"});}});
    var w=[];if(it.self_at)w.push("本人 "+ts(it.self_at));if(it.mentor_at)w.push("確認 "+ts(it.mentor_at));
    ul.append(el("li",{class:"item"+(ok?" ok":"")},
      el("div",{class:"t"},el("span",{class:"mark","aria-hidden":"true",text:ok?"✓":""}),el("span",{text:it.text})),
      it.detail?el("details",null,el("summary",{text:"覚えるポイント"}),el("p",{text:it.detail})):null,
      el("div",{class:"acts"},b1,b2,w.length?el("span",{class:"when",text:w.join("・")}):null)));
  });
  var rv=(d.reviews&&d.reviews[st.id])||{met_on:null,self_note:"",mentor_note:""};
  var review=el("div",{class:"review"},el("b",{text:"振り返り面談"}));
  if(role==="self"){
    var ta=el("textarea",{id:"note-"+st.id,maxlength:"200",disabled:!canSelf});ta.value=rv.self_note||"";
    review.append(el("p",{class:"hint",style:"margin:0",text:rv.met_on?"面談日 "+md(rv.met_on)+(rv.mentor_note?"　指導役より：「"+rv.mentor_note+"」":""):"面談はまだです。"}),
      el("label",{class:"f",for:"note-"+st.id},"自分のひとこと（できたこと・不安なこと）",ta),
      el("p",{class:"hint",style:"margin:0",text:"お子さまの名前や病名は書かないでください。"}),
      el("div",null,el("button",{class:"btn small",type:"button",disabled:!canSelf,text:"保存",onclick:function(){saveReview({learner_id:L.id,stage_id:st.id,note:ta.value});}})));
  }else{
    var dt=el("input",{type:"date",id:"met-"+st.id,max:d.today||S.me.today,disabled:!canMentor});dt.value=rv.met_on||"";
    var tb=el("textarea",{id:"mnote-"+st.id,maxlength:"200",disabled:!canMentor});tb.value=rv.mentor_note||"";
    if(rv.self_note)review.append(el("p",{class:"hint",style:"margin:0",text:"本人のひとこと：「"+rv.self_note+"」"}));
    review.append(
      el("div",{class:"grid2"},el("label",{class:"f",for:"met-"+st.id},"面談した日",dt),el("span")),
      el("label",{class:"f",for:"mnote-"+st.id},"指導役のひとこと（本人に見えます）",tb),
      el("p",{class:"hint",style:"margin:0",text:"お子さまの名前や病名は書かないでください。"}),
      el("div",null,el("button",{class:"btn small",type:"button",disabled:!canMentor,text:"保存",onclick:function(){saveReview({learner_id:L.id,stage_id:st.id,met_on:dt.value||null,note:tb.value});}})));
  }
  return el("div",{class:"panel"},ul,review);
}

function act(body){if(S.busy)return;S.busy=true;api("POST","/check",body).then(refresh).catch(function(e){flash(errText(e),true);}).then(function(){S.busy=false;});}
function saveReview(body){api("POST","/review",body).then(function(){S.msg="面談の記録を保存しました。";S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}
function refresh(){return S.detailId?loadDetail(S.detailId).then(function(){return api("GET","/me");}).then(function(j){S.me=j;render();}):api("GET","/me").then(function(j){S.me=j;render();});}

function renderMood(d){
  var opts=[[1,"順調"],[2,"ちょっと大変"],[3,"つらい"]];
  return el("div",{class:"card"},el("b",{text:"今週の気分（"+md(d.thisWeek)+"の週）"}),
    el("div",{class:"mood",role:"group","aria-label":"今週の気分"},opts.map(function(o){return el("button",{type:"button","aria-pressed":d.myMood===o[0]?"true":"false",text:o[1],onclick:function(){api("POST","/mood",{level:o[0]}).then(function(){S.msg=o[0]===3?"教えてくれてありがとう。指導役と園長に伝わります。":"ありがとう。";S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}});})),
    el("p",{class:"hint",text:"週に1回えらんでください。「つらい」が2週続くと、指導役と園長の画面に知らせが出ます。"}));
}

/* ---------- 園長：新人の管理 ---------- */
function renderManage(d){
  var L=d.learner;
  var name=el("input",{type:"text",id:"mg-name",maxlength:"20"});name.value=L.display_name;
  var mentor=el("input",{type:"text",id:"mg-mentor",maxlength:"20"});mentor.value=L.mentor_name;
  var start=el("input",{type:"date",id:"mg-start"});start.value=L.start_date;
  var emp=el("select",{id:"mg-emp"},el("option",{value:"fulltime",text:"常勤"}),el("option",{value:"parttime",text:"パート"}));emp.value=L.employment;
  var box=el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"この新人の管理"}),
    el("div",{class:"grid2",style:"margin-top:8px"},el("label",{class:"f",for:"mg-name"},"名前",name),el("label",{class:"f",for:"mg-mentor"},"指導役",mentor),el("label",{class:"f",for:"mg-start"},"入社日",start),el("label",{class:"f",for:"mg-emp"},"雇用形態",emp)),
    el("div",{class:"row",style:"margin-top:10px"},el("button",{class:"btn primary",type:"button",text:"情報を保存",onclick:function(){patch(L.id,{display_name:name.value,mentor_name:mentor.value,start_date:start.value,employment:emp.value},"保存しました。");}})));
  if(L.status==="active"){
    box.append(el("div",{class:"row",style:"margin-top:12px"},
      el("button",{class:"btn",type:"button",text:"リンクを作り直す",onclick:function(){if(!window.confirm("本人と指導役のリンクを作り直します。今のリンクは使えなくなります。"))return;api("POST","/learners/"+L.id+"/links").then(function(j){S.issued={name:L.display_name,links:j.links};render();window.scrollTo(0,0);}).catch(function(e){flash(errText(e),true);});}}),
      el("button",{class:"btn",type:"button",text:"修了（クラス担任）にする",onclick:function(){if(window.confirm("修了にします。本人と指導役のリンクは使えなくなります。"))patch(L.id,{status:"completed"},"修了にしました。");}}),
      el("button",{class:"btn warn",type:"button",text:"退職を記録",onclick:function(){var dt=window.prompt("退職日（例 2026-11-30）",S.me.today);if(dt===null)return;patch(L.id,{status:"left",left_date:dt||S.me.today},"退職を記録しました。");}})));
  }else{
    box.append(el("div",{class:"row",style:"margin-top:12px"},el("button",{class:"btn",type:"button",text:"受け入れ中に戻す",onclick:function(){patch(L.id,{status:"active"},"受け入れ中に戻しました。リンクを作り直してください。");}})));
  }
  if(L.checklist_version<L.latest_version)box.append(el("div",{class:"row",style:"margin-top:12px"},el("span",{class:"hint",style:"margin:0",text:"この新人は前の版の項目を使っています（版"+L.checklist_version+"／最新 版"+L.latest_version+"）。"}),el("button",{class:"btn small",type:"button",text:"最新の項目にする",onclick:function(){api("POST","/learners/"+L.id+"/upgrade").then(function(){S.msg="最新の項目にしました。";S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}})));
  if(S.issued&&S.issued.name===L.display_name)box.prepend(renderIssued());
  return box;
}
function patch(id,body,okMsg){api("PATCH","/learners/"+id,body).then(function(){S.msg=okMsg;S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}

function renderIssued(){
  var I=S.issued;
  function box(label,obj){return el("div",{class:"linkbox"},el("b",{text:label}),el("code",{text:obj.url}),el("div",{class:"row"},
    el("button",{class:"btn small",type:"button",text:"リンクをコピー",onclick:function(ev){var b=ev.currentTarget;(navigator.clipboard?navigator.clipboard.writeText(obj.url):Promise.reject()).then(function(){b.textContent="コピーしました";},function(){b.textContent="長押しでコピーしてください";});}}),
    navigator.share?el("button",{class:"btn small",type:"button",text:"LINEなどで送る",onclick:function(){navigator.share({title:"保育ステップアップ表（"+label+"）",url:obj.url}).catch(function(){});}}):null));}
  return el("div",{class:"card",style:"border-color:var(--brand)"},el("b",{text:I.name+" さんのリンクができました"}),
    el("p",{class:"hint",text:"この画面を離れると、もう表示されません。本人と指導役に、それぞれのリンクを送ってください（なくした場合は作り直せます）。"}),
    el("div",{class:"links"},box("本人用",I.links.self),box("指導役用",I.links.mentor)),
    el("div",{class:"row",style:"margin-top:8px"},el("button",{class:"btn",type:"button",text:"リンクを印刷",onclick:function(){printLinks(I);}}),el("button",{class:"btn",type:"button",text:"閉じる",onclick:function(){S.issued=null;render();}})));
}

/* ---------- 園長：一覧・登録 ---------- */
function renderList(){
  var me=S.me,out=[];
  out.push(el("div",{class:"card"},el("h1",{style:"margin:0;font-family:var(--display);font-size:19px",text:me.nursery_name+"の新人"}),el("p",{class:"hint",text:"印のついた人（遅れ・面談待ち・つらい）を上に出しています。"})));
  if(S.issued)out.push(renderIssued());
  var ls=me.learners.slice().sort(function(a,b){var fa=a.status==="active"&&(a.late||a.moodAlert||a.needsReview)?0:1,fb=b.status==="active"&&(b.late||b.moodAlert||b.needsReview)?0:1;return fa-fb;});
  var list=el("div",{class:"list"});
  if(!ls.length)list.append(el("p",{class:"muted",text:"まだ新人は登録されていません。下のフォームから登録してください。"}));
  ls.forEach(function(l){
    var flags=[];if(l.status==="active"){if(l.moodAlert)flags.push("つらい");if(l.late)flags.push("遅れ");if(l.needsReview)flags.push("面談待ち");}
    var st={active:"",completed:"修了",left:"退職"}[l.status];
    list.append(el("a",{class:"lrow"+(flags.length?" flagged":""),href:"#l-"+l.id,style:"text-decoration:none;color:inherit"},
      el("div",null,el("div",{class:"nm",text:l.display_name+" さん"}),el("div",{class:"meta",text:(l.status==="active"?"入社"+l.dayNo+"日目・"+(l.current_title||"全段階達成"):st+(l.left_stage?"（"+l.left_stage+"で退職）":""))+"・指導役 "+(l.mentor_name||"未定")})),
      el("div",{style:"text-align:right"},flags.map(function(f){return el("span",{class:"chip late",text:f});}),el("div",{class:"meta",text:l.ok+"/"+l.total}))));
  });
  out.push(list);
  var name=el("input",{type:"text",id:"nw-name",maxlength:"20",required:true});
  var start=el("input",{type:"date",id:"nw-start",required:true});start.value=me.today;
  var mentor=el("input",{type:"text",id:"nw-mentor",maxlength:"20"});
  var emp=el("select",{id:"nw-emp"},el("option",{value:"fulltime",text:"常勤"}),el("option",{value:"parttime",text:"パート"}));
  out.push(el("form",{class:"card",onsubmit:function(ev){ev.preventDefault();api("POST","/learners",{display_name:name.value,start_date:start.value,mentor_name:mentor.value,employment:emp.value}).then(function(j){S.issued={name:name.value.trim(),links:j.links};S.msg="";return refresh();}).then(function(){window.scrollTo(0,0);}).catch(function(e){flash(errText(e),true);});}},
    el("h2",{class:"sec",style:"margin:0",text:"新人を登録"}),
    el("div",{class:"grid2",style:"margin-top:8px"},el("label",{class:"f",for:"nw-name"},"名前（名字だけでも可）",name),el("label",{class:"f",for:"nw-start"},"入社日",start),el("label",{class:"f",for:"nw-mentor"},"指導役",mentor),el("label",{class:"f",for:"nw-emp"},"雇用形態",emp)),
    el("p",{class:"hint",text:"登録すると、本人用と指導役用のリンクができます。"}),
    el("div",{class:"row"},el("button",{class:"btn primary",type:"submit",text:"登録してリンクを作る"}))));
  return out;
}

function renderStats(){
  var s=S.me.stats,out=[];
  out.push(el("div",{class:"card"},el("h1",{style:"margin:0;font-family:var(--display);font-size:19px",text:"集計（"+S.me.nursery_name+"）"}),
    el("table",{class:"stats"},el("tbody",null,
      el("tr",null,el("th",{text:"登録した新人"}),el("td",{text:s.total+"人"})),
      el("tr",null,el("th",{text:"受け入れ中／修了／退職"}),el("td",{text:s.active+"／"+s.completed+"／"+s.left+"人"})),
      s.windows.map(function(w){return el("tr",null,el("th",{text:w.days+"日たっても残った人"}),el("td",{text:w.eligible?(w.stayed+"/"+w.eligible+"人（"+Math.round(w.stayed/w.eligible*100)+"%）"):"対象者なし"}));}))),
    el("h2",{class:"sec",text:"どの段階で辞めたか"}),
    Object.keys(s.leftStages).length?el("ul",null,Object.keys(s.leftStages).map(function(k){return el("li",{text:k+"："+s.leftStages[k]+"人"});})):el("p",{class:"muted",text:"まだありません。"})));
  return out;
}

/* ---------- 園長：項目の編集（ドラッグ） ---------- */
function setDirty(v){S.dirty=v;var st=document.getElementById("save-state");if(st){st.textContent=v?"保存していない変更があります":"変更はありません";st.className="st"+(v?" dirty":"");}var sb=document.getElementById("save-btn");if(sb)sb.disabled=!v;}
function readEditor(){
  var stages=[];
  document.querySelectorAll(".ed-stage").forEach(function(card){
    var base=null;S.draft.forEach(function(s){if(s.id===card.dataset.id)base=s;});
    var st={id:card.dataset.id,title:card.querySelector(".f-title").value.trim()||base.title,days:parseInt(card.querySelector(".f-days").value,10)||base.days,theme:card.querySelector(".f-theme").value.trim(),milestone:!!(base&&base.milestone),items:[]};
    card.querySelectorAll(".ed-item").forEach(function(r){var t=r.querySelector(".f-text").value.trim();if(!t)return;st.items.push({id:r.dataset.id,text:t,detail:r.querySelector(".f-detail").value.trim()});});
    stages.push(st);
  });
  return stages;
}
function newId(){return "i"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function edItem(it){
  var text=el("textarea",{class:"f-text",rows:"2",maxlength:"120","aria-label":"できるようになること",placeholder:"できるようになること"});text.value=it.text||"";
  var det=el("textarea",{class:"f-detail",rows:"2",maxlength:"300","aria-label":"覚えるポイント",placeholder:"覚えるポイント（任意）"});det.value=it.detail||"";
  var li=el("li",{class:"ed-item","data-id":it.id});
  var handle=el("span",{class:"handle",title:"ドラッグして並べ替え","aria-hidden":"true",text:"☰"});
  handle.addEventListener("pointerdown",function(ev){startDrag(ev,li);});
  li.append(handle,el("div",{class:"fields"},text,det),el("div",{class:"side"},
    el("button",{type:"button","aria-label":"上へ",title:"上へ",text:"▲",onclick:function(){move(li,-1);}}),
    el("button",{type:"button","aria-label":"下へ",title:"下へ",text:"▼",onclick:function(){move(li,1);}}),
    el("button",{type:"button",class:"del","aria-label":"この項目を消す",title:"消す",text:"×",onclick:function(){li.remove();setDirty(true);}})));
  return li;
}
function move(li,dir){
  var lists=Array.prototype.slice.call(document.querySelectorAll(".ed-items"));
  if(dir<0){var p=li.previousElementSibling;if(p)li.parentNode.insertBefore(li,p);else{var i=lists.indexOf(li.parentNode);if(i>0)lists[i-1].append(li);}}
  else{var n=li.nextElementSibling;if(n)li.parentNode.insertBefore(n,li);else{var j=lists.indexOf(li.parentNode);if(j<lists.length-1)lists[j+1].prepend(li);}}
  setDirty(true);li.querySelector(".f-text").focus();
}
var drag=null;
function startDrag(ev,li){
  ev.preventDefault();drag={li:li,id:ev.pointerId};li.classList.add("dragging");
  window.addEventListener("pointermove",onDrag);window.addEventListener("pointerup",endDrag);window.addEventListener("pointercancel",endDrag);
}
function onDrag(ev){
  if(!drag||ev.pointerId!==drag.id)return;ev.preventDefault();
  var y=ev.clientY;if(y<60)window.scrollBy(0,-12);else if(y>window.innerHeight-60)window.scrollBy(0,12);
  var under=document.elementFromPoint(ev.clientX,ev.clientY);if(!under)return;
  var target=under.closest(".ed-item"),list=under.closest(".ed-items");
  if(target&&target!==drag.li){var r=target.getBoundingClientRect();if(ev.clientY<r.top+r.height/2)target.parentNode.insertBefore(drag.li,target);else target.parentNode.insertBefore(drag.li,target.nextSibling);}
  else if(list&&!target){list.append(drag.li);}
}
function endDrag(ev){
  if(!drag)return;drag.li.classList.remove("dragging");
  window.removeEventListener("pointermove",onDrag);window.removeEventListener("pointerup",endDrag);window.removeEventListener("pointercancel",endDrag);
  drag=null;setDirty(true);
}
function renderEditor(){
  var out=[];
  out.push(el("div",{class:"card"},el("p",{style:"margin:0",text:"左の「☰」をつかんでドラッグすると、順番の入れ替えや、別の段階への移動ができます（▲▼でも動かせます）。文言もここで直せます。最後に「保存」を押すと、これから登録する新人に使われます。"}),
    el("p",{class:"hint",text:"いま受け入れ中の新人は前の版のまま進みます。最新にするときは、新人の画面の「最新の項目にする」を押してください。"})));
  S.draft.forEach(function(st){
    var title=el("input",{type:"text",class:"f-title",maxlength:"12","aria-label":"段階の名前"});title.value=st.title;
    var days=el("input",{type:"number",class:"f-days",min:"1",max:"400","aria-label":"入社何日目"});days.value=st.days;
    var theme=el("input",{type:"text",class:"f-theme",maxlength:"30","aria-label":"この段階の目標"});theme.value=st.theme||"";
    var ul=el("ul",{class:"ed-items"});st.items.forEach(function(it){ul.append(edItem(it));});
    out.push(el("div",{class:"card ed-stage","data-id":st.id},
      el("div",{class:"ed-head"},el("label",{class:"f"},"段階の名前",title),el("label",{class:"f"},"入社何日目",days),el("label",{class:"f theme"},"この段階の目標",theme)),
      ul,el("button",{class:"btn",type:"button",text:"＋ 項目を追加",onclick:function(){var li=edItem({id:newId(),text:"",detail:""});ul.append(li);setDirty(true);li.querySelector(".f-text").focus();}})));
  });
  out.push(el("div",{class:"savebar"},el("span",{class:"st",id:"save-state",text:"変更はありません"}),
    el("button",{class:"btn warn",type:"button",text:"初期の内容に戻す",onclick:function(){if(!window.confirm("項目を初期の内容（たたき台）に戻します。よろしいですか？"))return;api("PUT","/checklist",{reset:true}).then(function(){S.dirty=false;S.msg="初期の内容に戻しました。";S.msgErr=false;return load();}).catch(function(e){flash(errText(e),true);});}}),
    el("button",{class:"btn",type:"button",text:"変更を取り消す",onclick:function(){S.draft=clone(S.me.checklist.stages);S.dirty=false;render();}}),
    el("button",{class:"btn primary",type:"button",id:"save-btn",disabled:true,text:"保存",onclick:function(){var stages=readEditor();api("PUT","/checklist",{base_version:S.baseVersion,stages:stages}).then(function(j){S.dirty=false;S.msg="保存しました（版"+j.version+"）。";S.msgErr=false;return load();}).catch(function(e){flash(errText(e),true);});}})));
  S.afterRender=function(){document.querySelectorAll(".ed-stage input,.ed-stage textarea").forEach(function(n){n.addEventListener("input",function(){setDirty(true);});});setDirty(S.dirty);};
  return out;
}

/* ---------- 印刷 ---------- */
function printLearner(d){
  var L=d.learner;
  var root=el("div",{class:"pr"},el("h1",{text:"保育ステップアップ表"}),el("p",{class:"meta",text:"名前："+L.display_name+"　園："+L.nursery_name+"　入社日："+L.start_date+"　指導役："+(L.mentor_name||"")+"　（指導役の確認で☑）"}));
  d.view.stages.forEach(function(st){
    var rv=(d.reviews&&d.reviews[st.id])||{};
    var tb=el("tbody");st.items.forEach(function(it){tb.append(el("tr",null,el("td",{class:"b",text:it.mentor_at?"☑":"□"}),el("td",null,it.text,it.detail?el("div",{class:"det",text:it.detail}):null),el("td",{class:"d",text:it.mentor_at?"確認 "+ts(it.mentor_at):""})));});
    root.append(el("div",{class:"st"},el("h2",{text:st.title+"　"+st.theme+"（目標日 "+md(st.target)+"）"}),el("table",null,tb),el("div",{class:"sign",text:"面談日 "+(rv.met_on?md(rv.met_on):"＿＿／＿＿")+"　本人サイン ＿＿＿＿＿＿　指導役サイン ＿＿＿＿＿＿"})));
  });
  root.append(el("p",{style:"text-align:center;font-weight:bold",text:"🏁 6ヶ月でクラス担任"}));
  printBox.replaceChildren(root);window.print();
}
function printLinks(I){
  function card(label,obj){return el("div",{class:"card-print"},el("b",{text:I.name+" さん　"+label}),el("div",{style:"font-size:11pt;word-break:break-all;margin:6px 0",text:obj.url}),el("div",{style:"font-size:9pt",text:"スマホのブラウザでこのアドレスを開き、ホーム画面に追加してください。他の人に渡さないでください。"}));}
  printBox.replaceChildren(el("div",{class:"pr"},card("本人用",I.links.self),card("指導役用",I.links.mentor)));window.print();
}

load();
})();`;
