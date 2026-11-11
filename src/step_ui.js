// ステップアップ表の画面（HTML・CSS・JS）。外部のフォント・CDN・解析タグは使わない。
// JS は String.raw で埋め込むため、バッククォートと「ドル記号＋波かっこ」は使わないこと。

export const STEP_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#FFF9F0">
<title>トリオランド ステップアップ表</title>
<link rel="icon" type="image/png" href="/step/icon.png">
<link rel="apple-touch-icon" href="/step/icon.png">
<link rel="stylesheet" href="/step/app.css?v=2">
<script src="/step/app.js?v=2" defer></script>
</head>
<body>
<header class="top"><div class="wrap">
  <div class="brand"><img src="/step/logo.webp" width="280" height="84" alt="トリオランド"><span class="app-name">ステップアップ表</span></div>
  <nav class="tabs" id="tabs" aria-label="画面の切り替え" hidden></nav>
</div></header>
<main class="wrap" id="app"><p class="loading">読み込み中…</p></main>
<div id="print" aria-hidden="true"></div>
<noscript><p class="wrap">この画面は JavaScript を有効にして開いてください。</p></noscript>
</body>
</html>`;

export const STEP_CSS = String.raw`
:root{
  --bg:#FFF9F0;--surface:#FFFFFF;--ink:#3B3346;--muted:#6F6578;--line:#EFE3D3;
  --blue:#84C5D9;--blue-d:#1F7A99;--blue-soft:#E4F3F8;
  --yellow:#F0C26A;--yellow-d:#C99231;--yellow-soft:#FFF1D6;--yellow-ink:#6B4A0E;
  --pink:#DA7499;--pink-d:#B8456B;--pink-soft:#FBE6EE;
  --brand:var(--blue-d);--brand-ink:#FFFFFF;--brand-soft:var(--blue-soft);
  --done:var(--yellow);--late:var(--pink-d);--late-soft:var(--pink-soft);--idle:#D9CFC2;--danger:#C0392B;
  --display:"Hiragino Maru Gothic ProN","Hiragino Maru Gothic Pro","M PLUS Rounded 1c","Zen Maru Gothic","BIZ UDPGothic","Yu Gothic",sans-serif;
  --body:"Hiragino Sans","Hiragino Kaku Gothic ProN","BIZ UDPGothic","Yu Gothic","Meiryo",sans-serif;
  color-scheme:light;
}
*{box-sizing:border-box}
html,body{margin:0}
body{background-color:var(--bg);background-image:radial-gradient(circle at 12px 12px,rgba(132,197,217,.18) 3px,transparent 4px),radial-gradient(circle at 40px 36px,rgba(240,194,106,.20) 3px,transparent 4px),radial-gradient(circle at 64px 10px,rgba(218,116,153,.14) 3px,transparent 4px);background-size:76px 52px;color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.65;-webkit-text-size-adjust:100%}
button,input,select,textarea{font:inherit;color:inherit}
button{cursor:pointer}
:focus-visible{outline:3px solid var(--yellow);outline-offset:2px}
[hidden]{display:none!important}
.wrap{max-width:720px;margin:0 auto;padding:0 16px 64px}
header.top{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.96);border-bottom:3px solid transparent;border-image:linear-gradient(90deg,var(--yellow) 0 33%,var(--blue) 33% 66%,var(--pink) 66% 100%) 1;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.top .wrap{display:flex;align-items:center;gap:8px 10px;padding-top:8px;padding-bottom:8px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0}
.brand img{height:34px;width:auto;display:block}
.app-name{font-family:var(--display);font-weight:800;font-size:13px;color:var(--pink-d);background:var(--pink-soft);padding:3px 10px;border-radius:999px;white-space:nowrap}
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tabs a{font-family:var(--display);font-weight:700;font-size:14px;text-decoration:none;color:var(--muted);padding:6px 12px;border-radius:999px;border:2px solid var(--line);background:var(--surface)}
.tabs a[aria-current="page"]{background:var(--blue-d);color:#fff;border-color:var(--blue-d)}
.loading{padding:24px 0;color:var(--muted)}
.notice{margin:12px 0 0;padding:10px 14px;border-radius:14px;background:var(--yellow-soft);font-size:14px;font-weight:600}
.notice.err{background:var(--pink-soft)}
.card{background:var(--surface);border:2px solid var(--line);border-radius:22px;padding:16px;margin-top:14px;box-shadow:0 4px 0 rgba(59,51,70,.05)}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:460px){.grid2{grid-template-columns:1fr}}
label.f{display:grid;gap:4px;font-size:13px;color:var(--muted);font-weight:700}
input[type=text],input[type=date],input[type=number],select,textarea{background:var(--surface);border:2px solid var(--line);border-radius:12px;padding:8px 10px;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--blue)}
textarea{resize:vertical;min-height:52px}
.btn{border:2px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 16px;font-family:var(--display);font-weight:800;font-size:14px;box-shadow:0 3px 0 var(--line)}
.btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--line)}
.btn.primary{background:var(--blue-d);border-color:var(--blue-d);color:#fff;box-shadow:0 3px 0 #145A72}
.btn.warn{color:var(--danger);border-color:#F2C5BE;box-shadow:0 3px 0 #F2C5BE}
.btn.small{padding:4px 12px;font-size:12px}
.btn:disabled{opacity:.45;cursor:not-allowed}
.hint{font-size:12px;color:var(--muted);margin:6px 0 0}
.muted{color:var(--muted)}
h1.ttl{margin:0;font-family:var(--display);font-size:20px}
h2.sec{font-family:var(--display);font-size:17px;margin:20px 0 0}
/* ヒーロー */
.hero{display:flex;gap:14px;align-items:center}
.daybadge{flex:none;width:80px;height:80px;border-radius:26px;background:var(--blue);color:#fff;display:grid;place-content:center;text-align:center;font-family:var(--display);line-height:1.1;box-shadow:0 4px 0 #5FA6BC;transform:rotate(-4deg)}
.daybadge b{font-size:28px;display:block;text-shadow:0 1px 0 rgba(0,0,0,.12)}
.daybadge small{font-size:11px;font-weight:800}
.hero-text{min-width:0}
.hero-text h1{margin:0;font-family:var(--display);font-size:21px;line-height:1.3}
.hero-text p{margin:2px 0 0;color:var(--muted);font-size:13px}
.role{display:inline-block;font-size:11px;font-weight:800;padding:1px 8px;border-radius:999px;background:var(--yellow-soft);color:var(--yellow-ink);margin-left:4px;vertical-align:2px}
.buddy{display:flex;align-items:flex-end;gap:8px;margin-top:12px}
.buddy img{width:58px;height:auto;flex:none}
.bubble{position:relative;background:var(--yellow-soft);border-radius:16px;padding:8px 12px;font-family:var(--display);font-weight:800;font-size:14px;line-height:1.45}
.bubble::before{content:"";position:absolute;left:-8px;bottom:12px;border:8px solid transparent;border-right-color:var(--yellow-soft);border-left:0}
.stars{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;margin-top:14px}
.stars b{font-family:var(--display);font-size:16px}
.bar{height:14px;border-radius:999px;background:#F6EEE3;overflow:hidden;margin-top:4px;box-shadow:inset 0 2px 0 rgba(0,0,0,.04)}
.bar i{display:block;height:100%;border-radius:999px;background:repeating-linear-gradient(-45deg,var(--yellow) 0 10px,#F5CF85 10px 20px)}
.next{margin-top:12px;background:var(--blue-soft);border-radius:16px;padding:10px 12px}
.next h3{margin:0 0 6px;font-size:13px;font-family:var(--display);color:var(--blue-d)}
.next ol{margin:0;padding:0;list-style:none;counter-reset:n;display:grid;gap:4px}
.next li{counter-increment:n;display:flex;gap:8px;font-size:14px}
.next li::before{content:counter(n);flex:none;width:22px;height:22px;border-radius:50%;background:#fff;color:var(--blue-d);font-weight:800;font-size:12px;display:grid;place-content:center;margin-top:1px}
/* 未来カード（3ヶ月・6ヶ月のすがた） */
.future h2{margin:0;font-family:var(--display);font-size:17px}
.track{position:relative;margin:58px 6px 4px;height:62px}
.track .rail{position:absolute;left:0;right:0;top:27px;height:8px;border-radius:999px;background:#F2E8DA}
.track .rail i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--yellow),var(--blue),var(--pink))}
.track .pt{position:absolute;top:0;transform:translateX(-50%);display:grid;justify-items:center;width:84px;text-align:center}
.track .pt .ic{width:44px;height:44px;border-radius:50%;background:#fff;border:3px solid var(--line);display:grid;place-content:center;font-size:22px;margin-top:9px}
.track .pt.reached .ic{border-color:var(--yellow);background:var(--yellow-soft)}
.track .pt .lb{font-size:11px;font-weight:800;color:var(--muted);margin-top:2px;white-space:nowrap}
.track .me{position:absolute;bottom:calc(100% - 22px);transform:translateX(-50%);z-index:2;display:grid;justify-items:center}
.track .me::after{content:"";width:0;height:0;border:6px solid transparent;border-top-color:var(--pink-d);border-bottom:0}
.track .me img{width:42px;height:auto;animation:hop 2.4s ease-in-out infinite;order:-1}
.track .me span{font-size:11px;font-weight:800;color:#fff;background:var(--pink-d);border-radius:999px;padding:1px 8px;margin-top:-2px;white-space:nowrap}
@keyframes hop{0%,70%,100%{transform:translateY(0)}80%{transform:translateY(-6px)}90%{transform:translateY(0)}}
.goals{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
@media (max-width:420px){.goals{grid-template-columns:1fr}}
.goalcard{border-radius:18px;padding:12px;display:grid;gap:6px;align-content:start}
.goalcard.g3{background:var(--blue-soft)}
.goalcard.g6{background:var(--pink-soft)}
.goalcard .gh{display:flex;align-items:center;gap:8px}
.goalcard .gi{font-size:30px;line-height:1}
.goalcard .gt{font-family:var(--display);font-weight:800;font-size:16px;line-height:1.25}
.goalcard .gt small{display:block;font-size:11px;color:var(--muted);font-weight:700}
.goalcard .left{font-family:var(--display);font-weight:800;font-size:13px}
.goalcard.g3 .left{color:var(--blue-d)}
.goalcard.g6 .left{color:var(--pink-d)}
.goalcard ul{margin:0;padding:0;list-style:none;display:grid;gap:3px;font-size:13px}
.goalcard li{display:flex;gap:6px}
.goalcard li::before{content:"✿";flex:none;color:var(--yellow-d)}
.goalcard li.ok::before{content:"★";color:var(--yellow-d)}
.gauge{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);font-weight:700}
.gauge .bar{flex:1;height:10px;margin:0}
.pace{display:inline-block;margin-top:12px;font-family:var(--display);font-weight:800;font-size:13px;padding:4px 12px;border-radius:999px}
.pace.good{background:var(--yellow-soft);color:var(--yellow-ink)}
.pace.slow{background:var(--pink-soft);color:var(--pink-d)}
/* 気分 */
.mood{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.mood button{flex:1 1 90px;border:2px solid var(--line);background:var(--surface);border-radius:18px;padding:8px 6px;font-family:var(--display);font-weight:800;font-size:13px;display:grid;justify-items:center;gap:2px}
.mood button .em{font-size:28px;line-height:1.1}
.mood button[aria-pressed="true"]{border-color:var(--blue-d);background:var(--blue-soft);transform:scale(1.04)}
.mood button.m3[aria-pressed="true"]{border-color:var(--pink-d);background:var(--pink-soft)}
.alert{border-color:var(--pink);background:var(--pink-soft)}
/* すごろくの道 */
.path{position:relative;margin:26px 0 0;padding:0;list-style:none}
.stage{position:relative;display:grid;justify-items:center;margin-bottom:26px}
.stage .spot{display:grid;justify-items:center;transform:translateX(var(--x,0))}
.stage+.stage::before{content:"";position:absolute;top:-24px;left:50%;width:6px;height:20px;margin-left:-3px;background:radial-gradient(circle,var(--idle) 2.5px,transparent 3px) 0 0/6px 7px repeat-y;transform:translateX(var(--mx,0))}
.node{position:relative;width:88px;height:88px;border-radius:50%;border:none;background:#fff;display:grid;place-content:center;font-family:var(--display);font-weight:800;font-size:16px;color:var(--ink);box-shadow:0 6px 0 var(--idle),inset 0 0 0 3px var(--line);text-align:center;line-height:1.15}
.stage:nth-child(3n+2) .node{border-radius:28px}
.stage:nth-child(3n) .node{border-radius:50% 50% 42% 42%/58% 58% 42% 42%}
.node small{display:block;font-size:11px;color:var(--muted);margin-top:2px}
.node .badge{position:absolute;top:-6px;right:-6px;width:28px;height:28px;border-radius:50%;display:grid;place-content:center;font-size:15px;box-shadow:0 2px 0 rgba(0,0,0,.12)}
.stage.done .node{background:var(--yellow);color:var(--yellow-ink);box-shadow:0 6px 0 var(--yellow-d)}
.stage.done .node .badge{background:#fff;color:var(--yellow-d)}
.stage.current .node{background:var(--blue-d);color:#fff;box-shadow:0 6px 0 #145A72;width:100px;height:100px;font-size:18px}
.stage.late .node{background:var(--pink-d);color:#fff;box-shadow:0 6px 0 #8C2F4F}
.stage.late .node .badge{background:#fff;color:var(--pink-d)}
.stage.done .node small,.stage.current .node small,.stage.late .node small{color:inherit;opacity:.9}
.stage.current .node::after{content:"";position:absolute;inset:-10px;border-radius:inherit;border:4px solid var(--blue);opacity:.6;animation:pulse 1.8s ease-out infinite}
@keyframes pulse{0%{transform:scale(.92);opacity:.7}100%{transform:scale(1.14);opacity:0}}
.here{position:absolute;top:8px;display:grid;justify-items:center;width:76px}
.here img{width:60px;height:auto;animation:hop 2.4s ease-in-out infinite}
.here span{font-family:var(--display);font-size:11px;font-weight:800;background:var(--pink-d);color:#fff;border-radius:999px;padding:1px 8px;margin-top:-4px;white-space:nowrap}
.cap{margin-top:12px;text-align:center;font-size:13px;color:var(--muted);max-width:230px}
.cap b{color:var(--ink);font-size:14px;font-family:var(--display)}
.chip{display:inline-block;font-size:11px;font-weight:800;padding:1px 8px;border-radius:999px;margin:0 2px}
.chip.late{background:var(--pink-soft);color:var(--pink-d)}
.chip.done{background:var(--yellow-soft);color:var(--yellow-ink)}
.chip.ms{background:var(--blue-soft);color:var(--blue-d)}
.chip.rev{background:var(--blue-soft);color:var(--blue-d)}
.panel{width:100%;margin-top:14px;background:var(--surface);border:2px solid var(--line);border-radius:22px;padding:12px;z-index:1}
.items{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.item{border:2px solid var(--line);border-radius:16px;padding:10px 12px;display:grid;gap:6px;background:#fff}
.item.ok{border-color:var(--yellow);background:var(--yellow-soft)}
.item .t{font-weight:700;display:flex;gap:8px}
.mark{flex:none;width:26px;height:26px;border-radius:50%;border:2px dashed var(--idle);display:grid;place-content:center;font-size:15px;margin-top:-1px;position:relative}
.item.self .mark{border:2px solid var(--blue);color:var(--blue-d)}
.item.ok .mark{background:var(--yellow);border:none;color:#fff;text-shadow:0 1px 0 var(--yellow-d)}
.mark.pop{animation:pop .5s cubic-bezier(.3,1.6,.5,1)}
@keyframes pop{0%{transform:scale(.3) rotate(-30deg)}100%{transform:scale(1) rotate(0)}}
.mark.pop::after{content:"";position:absolute;inset:-10px;border-radius:50%;background:radial-gradient(circle,var(--pink) 2px,transparent 3px) 0 0/10px 10px,radial-gradient(circle,var(--blue) 2px,transparent 3px) 5px 5px/10px 10px;opacity:0;animation:burst .7s ease-out}
@keyframes burst{0%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(1.6)}}
.item details summary{font-size:12px;color:var(--blue-d);cursor:pointer;font-weight:700}
.item details p{margin:4px 0 0;font-size:13px;color:var(--muted)}
.acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.tog{border:2px solid var(--line);background:var(--surface);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:800;color:var(--muted);font-family:var(--display)}
.tog[aria-pressed="true"]{background:var(--blue-d);border-color:var(--blue-d);color:#fff}
.tog[aria-pressed="true"]::before{content:"✓ "}
.tog.m[aria-pressed="true"]{background:var(--yellow);border-color:var(--yellow);color:var(--yellow-ink)}
.tog.m[aria-pressed="true"]::before{content:"★ "}
.when{font-size:11px;color:var(--muted)}
.review{margin-top:12px;border-top:2px dashed var(--line);padding-top:12px;display:grid;gap:8px}
.review>b{font-family:var(--display)}
.goal{display:grid;justify-items:center;gap:6px;margin-top:4px}
.goal img{width:84px;height:auto}
.flag{background:linear-gradient(90deg,var(--yellow),#F5CF85);color:var(--yellow-ink);font-family:var(--display);font-weight:800;font-size:19px;padding:12px 24px;border-radius:18px;box-shadow:0 5px 0 var(--yellow-d)}
/* 園長：一覧 */
.list{display:grid;gap:10px;margin-top:12px}
.lrow{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left;width:100%;background:var(--surface);border:2px solid var(--line);border-radius:20px;padding:12px;text-decoration:none;color:inherit;box-shadow:0 4px 0 rgba(59,51,70,.05)}
.lrow.flagged{border-color:var(--pink)}
.avatar{width:44px;height:44px;border-radius:50%;display:grid;place-content:center;font-family:var(--display);font-weight:800;font-size:18px;color:#fff}
.avatar.c0{background:var(--yellow);color:var(--yellow-ink)}
.avatar.c1{background:var(--blue-d);border-radius:14px}
.avatar.c2{background:var(--pink-d);border-radius:50% 50% 40% 40%/60% 60% 40% 40%}
.lrow .nm{font-weight:800;font-family:var(--display)}
.lrow .meta{font-size:12px;color:var(--muted)}
.mini{position:relative;height:32px;margin-top:6px}
.mini .rail{position:absolute;left:0;right:0;top:14px;height:5px;border-radius:999px;background:#F2E8DA}
.mini .rail i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,var(--yellow),var(--blue),var(--pink))}
.mini .f{position:absolute;top:0;transform:translateX(-50%);font-size:11px;line-height:1;display:grid;justify-items:center;row-gap:9px}
.mini .f b{display:block;font-size:9px;color:var(--muted);white-space:nowrap}
.mini .dot{position:absolute;top:9px;z-index:1;width:14px;height:14px;border-radius:50%;background:var(--pink-d);border:2px solid #fff;transform:translateX(-50%);box-shadow:0 1px 2px rgba(0,0,0,.2)}
.links{display:grid;gap:12px;grid-template-columns:1fr 1fr}
@media (max-width:520px){.links{grid-template-columns:1fr}}
.linkbox{border:2px solid var(--line);border-radius:16px;padding:10px;display:grid;gap:6px;justify-items:start}
.linkbox code{font-size:11px;word-break:break-all}
.ed-stage .ed-head{display:grid;grid-template-columns:1fr 96px;gap:8px}
.ed-stage .ed-head .theme{grid-column:1/-1}
.ed-items{list-style:none;margin:12px 0 8px;padding:0;display:grid;gap:8px;min-height:40px}
.ed-items:empty::before{content:"ここに項目をドラッグ";display:block;padding:8px;text-align:center;color:var(--muted);font-size:13px;border:2px dashed var(--line);border-radius:12px}
.ed-item{display:grid;grid-template-columns:38px 1fr 34px;gap:8px;align-items:start;border:2px solid var(--line);border-radius:16px;padding:8px;background:var(--surface)}
.ed-item.dragging{opacity:.6;border-style:dashed;border-color:var(--blue-d);background:var(--blue-soft)}
.handle{width:38px;height:38px;border-radius:10px;border:2px solid var(--line);background:var(--yellow-soft);display:grid;place-content:center;cursor:grab;touch-action:none;font-size:17px;color:var(--yellow-ink);user-select:none;-webkit-user-select:none}
.ed-item .fields{display:grid;gap:6px}
.ed-item .side{display:grid;gap:4px}
.ed-item .side button{width:34px;height:30px;border-radius:10px;border:2px solid var(--line);background:var(--surface);font-size:13px;line-height:1}
.ed-item .side .del{color:var(--danger)}
.savebar{position:sticky;bottom:12px;margin-top:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:var(--surface);border:2px solid var(--line);border-radius:18px;padding:10px 12px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
.savebar .st{margin-right:auto;font-size:13px;color:var(--muted)}
.savebar .st.dirty{color:var(--pink-d);font-weight:800}
/* 分析 */
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.tile{background:var(--bg);border-radius:16px;padding:10px 12px;display:grid;gap:0}
.tile .tl{font-size:12px;color:var(--muted);font-weight:700}
.tile b{font-family:var(--display);font-size:24px;line-height:1.25}
.tile small{font-size:11px;color:var(--muted)}
.tile:nth-child(3) b{color:var(--pink-d)}
.hb{display:grid;grid-template-columns:minmax(64px,34%) 1fr auto;gap:8px;align-items:center;margin-top:8px;font-size:13px}
.hb .hl{font-weight:700;overflow-wrap:anywhere}
.hb .ht{height:12px;border-radius:999px;background:#F2E8DA;overflow:hidden}
.hb .ht i{display:block;height:100%;border-radius:999px}
.hb .ht i.pink{background:var(--pink)}
.hb .ht i.yellow{background:var(--yellow)}
.hb .ht i.blue{background:var(--blue)}
.hb .hv{font-weight:800;font-size:12px;white-space:nowrap}
h3.sub{font-family:var(--display);font-size:14px;margin:16px 0 0;color:var(--ink)}
.chart{width:100%;height:auto;display:block;margin-top:8px}
.chart .grid{stroke:#F2E8DA;stroke-width:1}
.chart .ax{font-size:9px;fill:var(--muted)}
.chart .vl{font-size:10px;font-weight:700;fill:var(--pink-d)}
.chart .bj{fill:var(--blue)}
.chart .bl{fill:var(--pink)}
.chart .bm{fill:#F2D3DE}
.legend{display:flex;gap:12px;margin-top:6px;font-size:12px;font-weight:700}
.lg::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.lg.blue::before{background:var(--blue)}
.lg.pink::before{background:var(--pink)}
.tbl{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tbl table.stats{font-size:13px;white-space:nowrap}
.tbl table.stats th:first-child{white-space:normal;min-width:6.5em}
.tbl table.stats td,.tbl table.stats th{padding:8px 6px 8px 0}
.card details>summary{cursor:pointer;font-weight:700;color:var(--blue-d);margin-top:10px;font-size:13px}
.ins ul{margin:8px 0 0;padding-left:20px;display:grid;gap:4px;font-size:14px}
.ins{background:var(--yellow-soft);border-color:var(--yellow)}
details.retire{margin-top:14px;border-top:2px dashed var(--line);padding-top:8px}
details.retire>summary{color:var(--danger);font-weight:800;cursor:pointer;font-size:14px}
.leftform{margin-top:8px}
table.stats{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
table.stats td,table.stats th{border-bottom:2px solid var(--line);padding:8px 4px;text-align:left}
@media (prefers-reduced-motion:reduce){.stage.current .node::after,.here img,.track .me img,.mark.pop,.mark.pop::after{animation:none}}
#print{display:none}
@media print{
  @page{size:A4;margin:12mm}
  body{background:#fff;color:#000;font-size:10.5pt}
  header.top,#app{display:none!important}
  #print{display:block}
  .pr .ph{display:flex;align-items:center;gap:10px;margin:0 0 4px}
  .pr .ph img{height:28px;width:auto}
  .pr h1{font-size:15pt;margin:0}
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

var ERR={LINK_INVALID:"このリンクは使えません。園長に新しいリンクをもらってください。",LEARNER_NOT_ACTIVE:"この新人は修了または退職になっているため、変更できません。",CHECKLIST_CHANGED:"ほかの人が先に項目を保存しました。画面を開き直してから、もう一度編集してください。",BAD_DATE:"日付が正しくありません。",NAME_REQUIRED:"名前を入れてください。",FORBIDDEN:"この操作はできません。",NOT_FOUND:"この新人さんは見つかりませんでした。一覧から選び直してください。",STEP_DB_NOT_CONFIGURED:"準備中です。しばらくしてから開いてください。"};
function api(method,path,body){return fetch("/step/api"+path,{method:method,headers:Object.assign({"authorization":"Bearer "+TOKEN},body?{"content-type":"application/json"}:{}),body:body?JSON.stringify(body):undefined,cache:"no-store"}).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok){var e=new Error(j.error||("HTTP "+r.status));e.code=j.error;e.status=r.status;throw e;}return j;});});}
function errText(e){return ERR[e&&e.code]||"うまくいきませんでした。通信を確認して、もう一度お試しください。";}
function flash(text,isErr){S.msg=text;S.msgErr=!!isErr;render();}

function load(){
  if(!TOKEN||document.body.dataset.notfound){app.replaceChildren(el("div",{class:"card"},el("h1",{text:"ページが見つかりません"}),el("p",{text:"園長からもらったリンクを開いてください。"})));return Promise.resolve();}
  return api("GET","/me").then(function(j){S.me=j;if(j.role==="nursery"){if(!S.dirty){S.draft=clone(j.checklist.stages);S.baseVersion=j.checklist.version;}var lm=route().match(/^l-([0-9a-f]{20})$/);if(lm&&!S.detailId)S.detailId=lm[1];}return S.detailId?loadDetail(S.detailId):null;}).then(render).catch(function(e){app.replaceChildren(el("div",{class:"card"},el("h1",{text:"開けませんでした"}),el("p",{text:errText(e)})));});
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
    var tabDefs=[["list","👥 新人"],["edit","✏️ 項目の編集"],["stats","📊 分析"]];
    var cur=/^l-/.test(r)?"list":(["list","edit","stats"].indexOf(r)>=0?r:"list");
    tabs.replaceChildren.apply(tabs,tabDefs.map(function(t){return el("a",{href:"#"+t[0],"aria-current":t[0]===cur?"page":null,text:t[1]});}));
    if(/^l-/.test(r)&&(S.detail||S.detailId)){nodes=nodes.concat(S.detail?renderLearner(S.detail,"nursery"):[el("p",{class:"loading",text:"読み込み中…"})]);}
    else if(r==="edit")nodes=nodes.concat(renderEditor());
    else if(r==="stats")nodes=nodes.concat(renderStats());
    else nodes=nodes.concat(renderList());
  }else{
    tabs.hidden=true;
    nodes=nodes.concat(renderLearner(me,me.role));
  }
  app.replaceChildren.apply(app,nodes);
  S.pop=null;
  if(S.afterRender){var f=S.afterRender;S.afterRender=null;f();}
}

/* ---------- 新人の道（本人・指導役・園長の詳細） ---------- */
function dd(a,b){if(!a||!b)return 0;var p=a.split("-"),q=b.split("-");return Math.round((Date.UTC(+q[0],q[1]-1,+q[2])-Date.UTC(+p[0],p[1]-1,+p[2]))/864e5);}
function mascot(cls){return el("img",{src:"/step/mascot.webp",alt:"",width:"153",height:"134",class:cls||null,"aria-hidden":"true"});}
function pct(p){p=Math.max(0,Math.min(1,p));return "calc(28px + (100% - 56px) * "+p.toFixed(3)+")";}
function buddyMsg(d,role){
  var L=d.learner,v=d.view,c=v.current;
  if(L.status==="completed")return "クラス担任、おめでとう！ 🎉";
  if(L.status==="left")return "おつかれさまでした。";
  if(d.dayNo<1)return "入社まで あと"+(1-d.dayNo)+"日。たのしみに待ってるね！";
  if(!c)return "ぜんぶの段階を達成！ すごい！";
  if(c.needsReview)return "★がぜんぶそろったよ！ あとは振り返り面談だけ！";
  var late=v.stages.some(function(s){return s.late;});
  if(role==="self")return late?"あせらなくて大丈夫。ひとつずつ、いっしょにやろう！":"いまは「"+c.theme+"」。きょうも いっしょに がんばろう！";
  return late?"目標日をすぎた段階があります。次の1つを、いっしょにやってみよう。":"できたら「指導役 確認」で ★ をつけてね！";
}
function renderLearner(d,role){
  var L=d.learner,v=d.view,out=[];
  var canSelf=role==="self"&&L.status==="active";
  var canMentor=(role==="mentor"||role==="nursery")&&L.status==="active";
  var badge=d.dayNo>=1?el("div",{class:"daybadge"},el("small",{text:"入社"}),el("b",{text:String(d.dayNo)}),el("small",{text:"日目"})):el("div",{class:"daybadge"},el("small",{text:"入社まで"}),el("b",{text:String(1-d.dayNo)}),el("small",{text:"日"}));
  var status={active:"",completed:"（修了）",left:"（退職）"}[L.status]||"";
  var head=el("div",{class:"card"},
    role==="nursery"?el("p",{style:"margin:0 0 8px"},el("a",{href:"#list",text:"← 新人の一覧へ"})):null,
    el("div",{class:"hero"},badge,el("div",{class:"hero-text"},
      el("h1",{text:L.display_name+" さん"+status}),
      el("p",null,L.nursery_name+"・指導役 "+(L.mentor_name||"未定"),el("span",{class:"role",text:ROLE_LABEL[role]+"の画面"})),
      el("p",{text:v.current?"いま："+v.current.title+"「"+v.current.theme+"」":"全段階を達成しました"}))),
    el("div",{class:"buddy"},mascot(),el("div",{class:"bubble",text:buddyMsg(d,role)})),
    el("div",{class:"stars"},el("span",{class:"muted",text:"指導役の確認（★）"}),el("b",{text:"★ "+v.ok+" / "+v.total})),
    el("div",{class:"bar",role:"progressbar","aria-valuemin":"0","aria-valuemax":String(v.total),"aria-valuenow":String(v.ok),"aria-label":"確認済みの項目"},el("i",{style:"width:"+(v.total?Math.round(v.ok/v.total*100):0)+"%"})),
    v.next.length?el("div",{class:"next"},el("h3",{text:"次にやること（"+(v.current?v.current.title:"")+"）"}),el("ol",null,v.next.map(function(t){return el("li",{text:t});}))):null,
    v.current&&v.current.needsReview?el("p",{class:"notice",text:"この段階の項目はすべて確認済みです。振り返り面談をして、面談日を入れると達成になります。"}):null,
    el("div",{class:"row",style:"margin-top:12px"},el("button",{class:"btn",type:"button",onclick:function(){printLearner(d);},text:"🖨 印刷する"})));
  out.push(head);
  if(d.moodAlert&&role!=="self")out.push(el("div",{class:"card alert"},el("b",{text:"😢「つらい」が2週続いています。"}),el("p",{style:"margin:4px 0 0",text:"今週中に、指導役か園長が話を聞く時間をとってください。"})));
  var fut=renderFuture(d,role);if(fut)out.push(fut);
  if(role==="self"&&L.status==="active")out.push(renderMood(d));
  if(role!=="self"&&d.moods&&d.moods.length)out.push(el("p",{class:"hint",text:"最近の気分："+d.moods.slice(0,4).map(function(x){return md(x.week)+"週 "+["","😊順調","😅ちょっと大変","😢つらい"][x.level];}).join("　")}));
  out.push(el("h2",{class:"sec",text:"🗺 すごろくマップ"}),el("p",{class:"hint",style:"margin-top:2px",text:"段階をタップすると、覚えることが開きます。"}));
  var path=el("ol",{class:"path"}),prevK=0;
  v.stages.forEach(function(st,i){
    var k=Math.round(Math.sin(i*0.9)*100)/100;
    var cls="stage "+st.state+(st.late?" late":"");
    var li=el("li",{class:cls,style:"--x:calc("+k+" * min(56px,14vw));--mx:calc("+((k+prevK)/2)+" * min(56px,14vw))"});prevK=k;
    var open=S.open===st.id;
    var badgeTxt=st.state==="done"?"★":(st.late?"!":"");
    var node=el("button",{class:"node",type:"button","aria-expanded":open?"true":"false",onclick:function(){S.open=open?null:st.id;render();}},st.title,el("small",{text:"★"+st.ok+"/"+st.total}),badgeTxt?el("span",{class:"badge","aria-hidden":"true",text:badgeTxt}):null);
    var spot=el("div",{class:"spot"},el("div",{style:"position:relative"},node,
      st.state==="current"&&L.status==="active"?el("div",{class:"here",style:k>0?"right:calc(100% + 8px)":"left:calc(100% + 8px)"},mascot(),el("span",{text:"いまここ！"})):null),
      el("div",{class:"cap"},el("b",{text:st.theme}),el("div",null,st.milestone?el("span",{class:"chip ms",text:"節目"}):null,
        st.state==="done"?el("span",{class:"chip done",text:"達成"}):(st.late?el("span",{class:"chip late",text:"目標日をすぎています"}):null),
        st.needsReview?el("span",{class:"chip rev",text:"面談待ち"}):null),
        el("div",{text:"目標日 "+md(st.target)+"（"+st.days+"日目）"})));
    li.append(spot);
    if(open)li.append(renderStagePanel(d,st,role,canSelf,canMentor));
    path.append(li);
  });
  out.push(path);
  out.push(el("div",{class:"goal"},mascot(),el("div",{class:"flag",text:"🎓 クラス担任"}),el("p",{class:"muted",style:"margin:0",text:"入社6ヶ月で、クラス担任として一人立ち"})));
  if(role==="nursery")out.push(renderManage(d));
  return out;
}

/* ---------- 3ヶ月後・6ヶ月後のすがた ---------- */
function renderFuture(d,role){
  var L=d.learner,v=d.view,today=d.today||S.me.today;
  var ms=v.stages.filter(function(s){return s.milestone;});
  if(!ms.length)ms=[v.stages[v.stages.length-1]];
  var T=Math.max(ms[ms.length-1].days,1);
  var icons=["🌷","🌳","🌟"];
  var dayP=d.dayNo<1?0:Math.min(1,(d.dayNo-1)/(T-1||1));
  var track=el("div",{class:"track","aria-hidden":"true"},el("div",{class:"rail"},el("i",{style:"width:"+(dayP*100).toFixed(1)+"%"})));
  track.append(el("div",{class:"pt reached",style:"left:"+pct(0)},el("div",{class:"ic",text:"🌱"}),el("div",{class:"lb",text:"入社 "+md(L.start_date)})));
  ms.forEach(function(s,i){track.append(el("div",{class:"pt"+(s.state==="done"?" reached":""),style:"left:"+pct((s.days-1)/(T-1||1))},el("div",{class:"ic",text:icons[i]||"🌟"}),el("div",{class:"lb",text:s.title+" "+md(s.target)})));});
  if(L.status==="active")track.append(el("div",{class:"me",style:"left:"+pct(dayP)},mascot(),el("span",{text:d.dayNo>=1?"いま "+d.dayNo+"日目":"入社前"})));
  var goals=el("div",{class:"goals"});
  ms.forEach(function(s,i){
    var upto=v.stages.filter(function(x){return x.days<=s.days;});
    var ok=upto.reduce(function(a,x){return a+x.ok;},0),tot=upto.reduce(function(a,x){return a+x.total;},0);
    var left=dd(today,s.target);
    var when=s.state==="done"?"達成しました ★":(left>=0?"あと "+left+" 日（"+md(s.target)+"）":"目標日 "+md(s.target)+" をすぎています");
    goals.append(el("div",{class:"goalcard "+(i===0?"g3":"g6")},
      el("div",{class:"gh"},el("span",{class:"gi","aria-hidden":"true",text:icons[i]||"🌟"}),el("div",{class:"gt"},el("small",{text:s.title+"後の"+(role==="self"?"わたし":L.display_name+" さん")}),s.theme)),
      el("div",{class:"left",text:when}),
      el("div",{class:"gauge"},el("span",{text:"★"+ok+"/"+tot}),el("div",{class:"bar"},el("i",{style:"width:"+(tot?Math.round(ok/tot*100):0)+"%"}))),
      el("div",{style:"font-size:12px;font-weight:700;color:var(--muted)",text:"そのころには、こんなことが できる"}),
      el("ul",null,s.items.slice(0,3).map(function(it){return el("li",{class:it.mentor_at?"ok":null,text:it.text});}))));
  });
  var lateN=v.stages.filter(function(s){return s.late;}).length;
  var pace=L.status!=="active"||d.dayNo<1?null:(lateN?el("span",{class:"pace slow",text:"🐢 ゆっくりペース（目標日すぎ "+lateN+"段階）"}):el("span",{class:"pace good",text:"🐇 順調ペース！"}));
  return el("div",{class:"card future"},el("h2",{text:role==="self"?"✨ 3ヶ月後・6ヶ月後のわたし":"✨ "+L.display_name+" さんの3ヶ月後・6ヶ月後"}),track,pace,goals);
}

function renderStagePanel(d,st,role,canSelf,canMentor){
  var L=d.learner;
  var ul=el("ul",{class:"items"});
  st.items.forEach(function(it){
    var ok=!!it.mentor_at;
    var b1=el("button",{class:"tog",type:"button","aria-pressed":it.self_at?"true":"false",disabled:!canSelf,text:"本人 できた",onclick:function(){act({learner_id:L.id,item_id:it.id,action:it.self_at?"undo_self":"self"});}});
    var b2=el("button",{class:"tog m",type:"button","aria-pressed":ok?"true":"false",disabled:!canMentor,text:"指導役 確認",onclick:function(){act({learner_id:L.id,item_id:it.id,action:ok?"undo_mentor":"mentor"});}});
    var w=[];if(it.self_at)w.push("本人 "+ts(it.self_at));if(it.mentor_at)w.push("確認 "+ts(it.mentor_at));
    ul.append(el("li",{class:"item"+(ok?" ok":(it.self_at?" self":""))},
      el("div",{class:"t"},el("span",{class:"mark"+(S.pop===it.id?" pop":""),"aria-hidden":"true",text:ok?"★":(it.self_at?"✓":"")}),el("span",{text:it.text})),
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

function act(body){if(S.busy)return;S.busy=true;S.pop=(body.action==="self"||body.action==="mentor")?body.item_id:null;api("POST","/check",body).then(refresh).catch(function(e){flash(errText(e),true);}).then(function(){S.busy=false;});}
function saveReview(body){api("POST","/review",body).then(function(){S.msg="面談の記録を保存しました。";S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}
function refresh(){return S.detailId?loadDetail(S.detailId).then(function(){return api("GET","/me");}).then(function(j){S.me=j;render();}):api("GET","/me").then(function(j){S.me=j;render();});}

function renderMood(d){
  var opts=[[1,"順調","😊"],[2,"ちょっと大変","😅"],[3,"つらい","😢"]];
  return el("div",{class:"card"},el("b",{style:"font-family:var(--display)",text:"今週の気分は？（"+md(d.thisWeek)+"の週）"}),
    el("div",{class:"mood",role:"group","aria-label":"今週の気分"},opts.map(function(o){return el("button",{type:"button",class:"m"+o[0],"aria-pressed":d.myMood===o[0]?"true":"false",onclick:function(){api("POST","/mood",{level:o[0]}).then(function(){S.msg=o[0]===3?"教えてくれてありがとう。指導役と園長に伝わります。":"ありがとう。";S.msgErr=false;return refresh();}).catch(function(e){flash(errText(e),true);});}},el("span",{class:"em","aria-hidden":"true",text:o[2]}),o[1]);})),
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
  var R=S.me.leftReasons||{};
  function leftForm(isNew){
    var dt=el("input",{type:"date",id:"lf-date",max:S.me.today});dt.value=L.left_date||S.me.today;
    var rs=el("select",{id:"lf-reason"},el("option",{value:"",text:"えらんでください"}),Object.keys(R).map(function(k){return el("option",{value:k,text:R[k]});}));rs.value=L.left_reason||"";
    var nt=el("textarea",{id:"lf-note",maxlength:"100",placeholder:"例：早番が続いて体力的にきつかった"});nt.value=L.left_note||"";
    return el("div",{class:"leftform"},
      el("div",{class:"grid2"},el("label",{class:"f",for:"lf-date"},"退職日",dt),el("label",{class:"f",for:"lf-reason"},"いちばん大きな理由",rs)),
      el("label",{class:"f",for:"lf-note",style:"margin-top:8px"},"ひとこと（任意・100字まで）",nt),
      el("p",{class:"hint",text:"本人や子どもが特定できること、病名は書かないでください。"}),
      el("div",{class:"row",style:"margin-top:6px"},el("button",{class:isNew?"btn warn":"btn primary",type:"button",text:isNew?"この内容で退職を記録":"退職の記録を直す",onclick:function(){
        if(!rs.value){flash("退職の理由をえらんでください。",true);return;}
        var body={left_date:dt.value||S.me.today,left_reason:rs.value,left_note:nt.value};if(isNew)body.status="left";
        patch(L.id,body,isNew?"退職を記録しました。":"退職の記録を直しました。");}})));
  }
  if(L.status==="active"){
    box.append(el("div",{class:"row",style:"margin-top:12px"},
      el("button",{class:"btn",type:"button",text:"リンクを作り直す",onclick:function(){if(!window.confirm("本人と指導役のリンクを作り直します。今のリンクは使えなくなります。"))return;api("POST","/learners/"+L.id+"/links").then(function(j){S.issued={name:L.display_name,links:j.links};render();window.scrollTo(0,0);}).catch(function(e){flash(errText(e),true);});}}),
      el("button",{class:"btn",type:"button",text:"修了（クラス担任）にする",onclick:function(){if(window.confirm("修了にします。本人と指導役のリンクは使えなくなります。"))patch(L.id,{status:"completed"},"修了にしました。");}})),
      el("details",{class:"retire"},el("summary",{text:"退職を記録"}),leftForm(true)));
  }else{
    if(L.status==="left")box.append(el("h3",{class:"sub",text:"退職の記録"}),leftForm(false));
    box.append(el("div",{class:"row",style:"margin-top:12px"},el("button",{class:"btn",type:"button",text:"受け入れ中に戻す",onclick:function(){if(!window.confirm("受け入れ中に戻します。退職の記録は消えます。"))return;patch(L.id,{status:"active"},"受け入れ中に戻しました。リンクを作り直してください。");}})));
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
  out.push(el("div",{class:"card"},el("h1",{class:"ttl",text:me.nursery_name+"の新人さん"}),
    el("div",{class:"buddy"},mascot(),el("div",{class:"bubble",text:"印のついた人（遅れ・面談待ち・つらい）を上に出しているよ。"}))));
  if(S.issued)out.push(renderIssued());
  var stages=(me.checklist&&me.checklist.stages)||[];
  var ms=stages.filter(function(s){return s.milestone;});if(!ms.length&&stages.length)ms=[stages[stages.length-1]];
  var T=ms.length?ms[ms.length-1].days:180;
  var ls=me.learners.slice().sort(function(a,b){var fa=a.status==="active"&&(a.late||a.moodAlert||a.needsReview)?0:1,fb=b.status==="active"&&(b.late||b.moodAlert||b.needsReview)?0:1;return fa-fb;});
  var list=el("div",{class:"list"});
  if(!ls.length)list.append(el("p",{class:"muted",text:"まだ新人さんは登録されていません。下のフォームから登録してください。"}));
  ls.forEach(function(l,i){
    var flags=[];if(l.status==="active"){if(l.moodAlert)flags.push("😢つらい");if(l.late)flags.push("遅れ");if(l.needsReview)flags.push("面談待ち");}
    var st={active:"",completed:"修了",left:"退職"}[l.status];
    var mini=null;
    if(l.status==="active"){
      var p=l.dayNo<1?0:Math.min(1,(l.dayNo-1)/(T-1||1));
      mini=el("div",{class:"mini","aria-hidden":"true"},el("div",{class:"rail"},el("i",{style:"width:"+(p*100).toFixed(1)+"%"})),
        ms.map(function(m,j){return el("div",{class:"f",style:"left:calc(7px + (100% - 14px) * "+((m.days-1)/(T-1||1)).toFixed(3)+")"},["🌷","🌳","🌟"][j]||"🌟",el("b",{text:m.title}));}),
        el("div",{class:"dot",style:"left:calc(7px + (100% - 14px) * "+p.toFixed(3)+")"}));
    }
    list.append(el("a",{class:"lrow"+(flags.length?" flagged":""),href:"#l-"+l.id},
      el("div",{class:"avatar c"+(i%3),"aria-hidden":"true",text:(l.display_name||"？").trim().charAt(0)}),
      el("div",{style:"min-width:0"},el("div",{class:"nm",text:l.display_name+" さん"}),el("div",{class:"meta",text:(l.status==="active"?"入社"+l.dayNo+"日目・"+(l.current_title||"全段階達成"):st+(l.left_stage?"（"+l.left_stage+"で退職"+(l.left_reason&&S.me.leftReasons&&S.me.leftReasons[l.left_reason]?"・"+S.me.leftReasons[l.left_reason]:"")+"）":""))+"・指導役 "+(l.mentor_name||"未定")}),mini),
      el("div",{style:"text-align:right"},flags.map(function(f){return el("div",null,el("span",{class:"chip late",text:f}));}),el("div",{class:"meta",style:"font-weight:800",text:"★"+l.ok+"/"+l.total}))));
  });
  out.push(list);
  var name=el("input",{type:"text",id:"nw-name",maxlength:"20",required:true});
  var start=el("input",{type:"date",id:"nw-start",required:true});start.value=me.today;
  var mentor=el("input",{type:"text",id:"nw-mentor",maxlength:"20"});
  var emp=el("select",{id:"nw-emp"},el("option",{value:"fulltime",text:"常勤"}),el("option",{value:"parttime",text:"パート"}));
  out.push(el("form",{class:"card",onsubmit:function(ev){ev.preventDefault();api("POST","/learners",{display_name:name.value,start_date:start.value,mentor_name:mentor.value,employment:emp.value}).then(function(j){S.issued={name:name.value.trim(),links:j.links};S.msg="";return refresh();}).then(function(){window.scrollTo(0,0);}).catch(function(e){flash(errText(e),true);});}},
    el("h2",{class:"sec",style:"margin:0",text:"🌱 新人さんを登録"}),
    el("div",{class:"grid2",style:"margin-top:8px"},el("label",{class:"f",for:"nw-name"},"名前（名字だけでも可）",name),el("label",{class:"f",for:"nw-start"},"入社日",start),el("label",{class:"f",for:"nw-mentor"},"指導役",mentor),el("label",{class:"f",for:"nw-emp"},"雇用形態",emp)),
    el("p",{class:"hint",text:"登録すると、本人用と指導役用のリンクができます。"}),
    el("div",{class:"row"},el("button",{class:"btn primary",type:"submit",text:"登録してリンクを作る"}))));
  return out;
}

function renderStats(){
  var A=S.me.analytics,R=S.me.leftReasons||{},out=[];
  if(!A)return [el("p",{class:"loading",text:"読み込み中…"})];
  var today=S.me.today,fyNow=Number(today.slice(5,7))>=4?Number(today.slice(0,4)):Number(today.slice(0,4))-1;
  var cur=A.yearly.filter(function(y){return y.fy===fyNow;})[0]||{rate:null,left:0,atStart:0,joined:0};
  var thisMonth=A.monthly[A.monthly.length-1];
  out.push(el("div",{class:"card"},el("h1",{class:"ttl",text:"📊 分析（"+S.me.nursery_name+"）"}),
    el("div",{class:"buddy"},mascot(),el("div",{class:"bubble",text:"いつ・なぜ辞めているかを見て、受け入れ方を直していこう。"})),
    el("div",{class:"kpis"},
      tile("受け入れ中",A.active+"人",""),
      tile("今月の退職",thisMonth.left+"人",thisMonth.rate===null?"":"退職率 "+pctTxt(thisMonth.rate)),
      tile(fyNow+"年度の退職率",pctTxt(cur.rate),cur.left+"人／"+(cur.atStart+cur.joined)+"人"),
      tile("これまでの退職",A.leftTotal+"人","登録 "+A.total+"人"))));
  // 早期退職率
  var early=el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"入社してから辞めた人の割合"}),el("p",{class:"hint",text:"その期間を過ぎた人のうち、期間内に辞めた人の割合です。"}));
  [["1か月以内",0],["3か月以内",1],["6か月以内",2]].forEach(function(x){var w=A.early[x[1]];early.append(hbar(x[0],w.rate===null?0:w.rate,w.eligible?pctTxt(w.rate)+"（"+w.left+"/"+w.eligible+"人）":"対象者なし","pink"));});
  out.push(early);
  out.push(insights(A,R));
  // 月次
  var mc=el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"月ごとの入社と退職（直近12か月）"}),
    el("div",{class:"legend"},el("span",{class:"lg blue",text:"入社"}),el("span",{class:"lg pink",text:"退職"})),monthChart(A.monthly));
  var mt=el("tbody");A.monthly.slice().reverse().forEach(function(m){mt.append(el("tr",null,el("td",{text:Number(m.ym.slice(0,4))+"/"+Number(m.ym.slice(5))}),el("td",{text:m.headcount}),el("td",{text:m.joined}),el("td",{text:m.left}),el("td",{text:pctTxt(m.rate)})));});
  mc.append(el("details",null,el("summary",{text:"数字で見る"}),el("div",{class:"tbl"},el("table",{class:"stats"},el("thead",null,el("tr",null,el("th",{text:"月"}),el("th",{text:"月初の在籍"}),el("th",{text:"入社"}),el("th",{text:"退職"}),el("th",{text:"退職率"}))),mt))));
  out.push(mc);
  // 年度
  var yt=el("tbody");A.yearly.forEach(function(y){yt.append(el("tr",null,el("td",{text:y.fy+"年度"}),el("td",{text:y.joined}),el("td",{text:y.left}),el("td",{text:pctTxt(y.rate)}),y.early.map(function(w){return el("td",{text:w.eligible?pctTxt(w.rate):"—"});})));});
  out.push(el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"年度ごと（4月〜3月）"}),
    el("div",{class:"tbl"},el("table",{class:"stats"},el("thead",null,el("tr",null,el("th",{text:"年度"}),el("th",{text:"入社"}),el("th",{text:"退職"}),el("th",{text:"退職率"}),el("th",{text:"〜1か月"}),el("th",{text:"〜3か月"}),el("th",{text:"〜6か月"}))),yt)),
    el("p",{class:"hint",text:"退職率＝その年度に辞めた人 ÷（年度初めにいた人＋年度内に入社した人）。〜1か月・〜3か月・〜6か月は、その年度に入社した人のうち、入社からその期間内に辞めた割合です。"})));
  // いつ
  var stages=(S.me.checklist&&S.me.checklist.stages)||[];var maxSt=1;var stKeys=stages.map(function(s){return s.title;}).concat(["それ以降"]);
  stKeys.forEach(function(k){maxSt=Math.max(maxSt,A.byStage[k]||0);});
  var when=el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"いつ辞めているか"}),el("h3",{class:"sub",text:"どの段階の時期に（入社からの日数で分けています）"}));
  stKeys.forEach(function(k){if(k==="それ以降"&&!A.byStage[k])return;var n=A.byStage[k]||0;when.append(hbar(k,n/maxSt,n+"人","pink"));});
  when.append(el("h3",{class:"sub",text:"辞めた月（1月〜12月）"}),calChart(A.calMonths));
  out.push(when);
  // なぜ
  var why=el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"なぜ辞めているか"}));
  var rk=Object.keys(A.byReason).sort(function(a,b){return A.byReason[b]-A.byReason[a];});var maxR=1;rk.forEach(function(k){maxR=Math.max(maxR,A.byReason[k]);});
  if(!rk.length)why.append(el("p",{class:"muted",text:"まだ退職者はいません。"}));
  rk.forEach(function(k){why.append(hbar(R[k]||"理由の記録なし",A.byReason[k]/maxR,A.byReason[k]+"人","yellow"));});
  var C=A.compare;
  why.append(el("h3",{class:"sub",text:"辞めた人と、続いている人のちがい"}),el("div",{class:"tbl"},el("table",{class:"stats"},
    el("thead",null,el("tr",null,el("th",{text:""}),el("th",{text:"辞めた人"}),el("th",{text:"続いている人"}))),
    el("tbody",null,
      el("tr",null,el("th",{text:"比べた人数"}),el("td",{text:C.left.n+"人"}),el("td",{text:C.stayed.n+"人"})),
      el("tr",null,el("th",{text:"「つらい」が出ていた"}),el("td",{text:ratio(C.left.tsurai,C.left.n)}),el("td",{text:ratio(C.stayed.tsurai,C.stayed.n)})),
      el("tr",null,el("th",{text:"目標日をすぎた段階があった"}),el("td",{text:ratio(C.left.late,C.left.n)}),el("td",{text:ratio(C.stayed.late,C.stayed.n)})),
      el("tr",null,el("th",{text:"振り返り面談の実施率"}),el("td",{text:pctTxt(C.left.reviewRate)}),el("td",{text:pctTxt(C.stayed.reviewRate)}))))),
    el("p",{class:"hint",text:"このアプリで記録がある人だけで比べています。辞めた人は退職日の時点、続いている人（入社31日以上）は今日の時点で見ています。"}));
  out.push(why);
  // 指導役・雇用形態
  function grp(title,rows){var tb=el("tbody");rows.forEach(function(r){tb.append(el("tr",null,el("th",{text:r.key}),el("td",{text:r.total+"人"}),el("td",{text:r.left+"人"}),el("td",{text:r.total?pctTxt(r.left/r.total):"—"})));});
    return [el("h3",{class:"sub",text:title}),el("div",{class:"tbl"},el("table",{class:"stats"},el("thead",null,el("tr",null,el("th",{text:""}),el("th",{text:"担当・人数"}),el("th",{text:"退職"}),el("th",{text:"割合"}))),tb))];}
  out.push(el("div",{class:"card"},el("h2",{class:"sec",style:"margin:0",text:"指導役・雇用形態ごと"}),grp("指導役ごと",A.byMentor),grp("雇用形態ごと",A.byEmployment),
    el("p",{class:"hint",text:"人数が少ないうちは、1人で割合が大きく変わります。人を責めるためではなく、受け入れ方を見直すために使ってください。"})));
  out.push(el("div",{class:"card"},el("b",{text:"過去に辞めた人も分析に入れられます"}),el("p",{class:"hint",text:"「新人」タブで入社日を入れて登録し、その人の画面の「退職を記録」で退職日と理由を入れてください。"}),
    el("p",{class:"hint",text:"このアプリに登録した人だけを数えています（園全体の退職率ではありません）。"})));
  return out;
}
function pctTxt(r){return r===null||r===undefined?"—":Math.round(r*100)+"%";}
function ratio(a,n){return n?pctTxt(a/n)+"（"+a+"人）":"—";}
function tile(label,big,small){return el("div",{class:"tile"},el("span",{class:"tl",text:label}),el("b",{text:big}),small?el("small",{text:small}):null);}
function hbar(label,p,val,color){return el("div",{class:"hb"},el("span",{class:"hl",text:label}),el("span",{class:"ht"},el("i",{class:color||"pink",style:"width:"+Math.round(Math.max(0,Math.min(1,p))*100)+"%"})),el("span",{class:"hv",text:val}));}
function sv(tag,attrs){var n=document.createElementNS("http://www.w3.org/2000/svg",tag);for(var k in attrs)n.setAttribute(k,attrs[k]);for(var i=2;i<arguments.length;i++){var c=arguments[i];if(c)n.append(c.nodeType?c:document.createTextNode(String(c)));}return n;}
function monthChart(ms){
  var W=340,H=150,top=16,bot=22,max=1;ms.forEach(function(m){max=Math.max(max,m.joined,m.left);});
  var g=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"chart",role:"img","aria-label":"月ごとの入社と退職"});
  var cw=W/ms.length,bh=H-top-bot;
  for(var t=0;t<=max;t+=Math.max(1,Math.ceil(max/3))){var y=top+bh-bh*t/max;g.append(sv("line",{x1:0,x2:W,y1:y,y2:y,class:"grid"}),sv("text",{x:2,y:y-2,class:"ax"},t));}
  ms.forEach(function(m,i){var x=i*cw;var bw=Math.min(10,cw/2-3);
    var hj=bh*m.joined/max,hl=bh*m.left/max;
    g.append(sv("rect",{x:x+cw/2-bw-1,y:top+bh-hj,width:bw,height:Math.max(hj,0),rx:3,class:"bj"}),sv("rect",{x:x+cw/2+1,y:top+bh-hl,width:bw,height:Math.max(hl,0),rx:3,class:"bl"}));
    if(m.left)g.append(sv("text",{x:x+cw/2+1+bw/2,y:top+bh-hl-3,class:"vl","text-anchor":"middle"},m.left));
    g.append(sv("text",{x:x+cw/2,y:H-6,class:"ax","text-anchor":"middle"},Number(m.ym.slice(5))+"月"));});
  return g;
}
function calChart(cm){
  var W=340,H=110,top=14,bot=20,max=1;cm.forEach(function(n){max=Math.max(max,n);});
  var g=sv("svg",{viewBox:"0 0 "+W+" "+H,class:"chart",role:"img","aria-label":"辞めた月"});var cw=W/12,bh=H-top-bot;
  cm.forEach(function(n,i){var h=bh*n/max,bw=cw-8;g.append(sv("rect",{x:i*cw+4,y:top+bh-h,width:bw,height:Math.max(h,0),rx:4,class:n===max&&n>0?"bl":"bm"}));
    if(n)g.append(sv("text",{x:i*cw+cw/2,y:top+bh-h-3,class:"vl","text-anchor":"middle"},n));
    g.append(sv("text",{x:i*cw+cw/2,y:H-5,class:"ax","text-anchor":"middle"},(i+1)+"月"));});
  return g;
}
function insights(A,R){
  var box=el("div",{class:"card ins"},el("h2",{class:"sec",style:"margin:0",text:"💡 わかったこと"}));var ul=el("ul");
  if(!A.leftTotal){ul.append(el("li",{text:"まだ退職者はいません。退職を記録すると、ここに辞めた時期や理由が出ます。"}));box.append(ul);return box;}
  function top(obj){var best=null;Object.keys(obj).forEach(function(k){if(best===null||obj[k]>obj[best])best=k;});return best;}
  var st=top(A.byStage);if(st)ul.append(el("li",{text:"辞めた人がいちばん多いのは「"+st+"」の時期です（"+A.byStage[st]+"人）。"}));
  var known={};Object.keys(A.byReason).forEach(function(k){if(R[k])known[k]=A.byReason[k];});
  var rs=top(known);if(rs)ul.append(el("li",{text:"いちばん多い理由は「"+R[rs]+"」です（"+known[rs]+"人）。"}));
  if(A.byReason.unknown)ul.append(el("li",{text:"理由が記録されていない人が"+A.byReason.unknown+"人います。退職の記録から理由を入れると、分析が正確になります。"}));
  var mx=Math.max.apply(null,A.calMonths);if(mx>=2)ul.append(el("li",{text:(A.calMonths.indexOf(mx)+1)+"月に辞める人が多くなっています（"+mx+"人）。"}));
  var C=A.compare;
  if(C.left.n&&C.stayed.n){
    ul.append(el("li",{text:"辞めた人の"+pctTxt(C.left.tsurai/C.left.n)+"に「つらい」が出ていました（続いている人は"+pctTxt(C.stayed.tsurai/C.stayed.n)+"）。"}));
    if(C.left.reviewRate!==null&&C.stayed.reviewRate!==null)ul.append(el("li",{text:"振り返り面談の実施率は、辞めた人が"+pctTxt(C.left.reviewRate)+"、続いている人が"+pctTxt(C.stayed.reviewRate)+"です。"}));
  }
  box.append(ul);
  if(A.leftTotal<5)box.append(el("p",{class:"hint",text:"※まだ人数が少ないので、傾向は参考程度に見てください。"}));
  return box;
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
  var root=el("div",{class:"pr"},el("div",{class:"ph"},el("img",{src:"/step/logo.webp",alt:"トリオランド"}),el("h1",{text:"ステップアップ表"})),el("p",{class:"meta",text:"名前："+L.display_name+"　園："+L.nursery_name+"　入社日："+L.start_date+"　指導役："+(L.mentor_name||"")+"　（指導役の確認で☑）"}));
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
