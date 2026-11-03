"""トリオキャリア公式サイト群の GA4 計測タグ（保育HP・放課後デイ・採用ガイドで共通）。2026-11-03。

- GA4 プロパティ「トリオキャリア公式サイト群」（プロパティ ID 562097032）、測定 ID G-773Y7ZR3JX。
  会社HP（www.triocareer.jp）は WordPress のカスタマイズ画面の「GA4 の測定 ID」で同じ ID を入れる。
- 本番の3ホストのときだけ送る。Cloudflare Pages のプレビュー・localhost・workers.dev からは何も送らない（gtag.js も読まない）。
- page_view は gtag('config') の自動送信だけ。手で page_view は送らない（二重送信を防ぐ）。
- URL のクエリは utm_ だけ残して送る。フォームの入力値（氏名・電話・メール・相談内容・お子さまの情報）は送らない。
  イベントの値は、決まった分類コード（下の CTA 種別・フォーム種別・施設コード・エラーコード）だけ。
- Google シグナル・広告のパーソナライズは使わない。
- 確認用：URL に ?ga_debug=1 を付けて開くと、その端末だけ DebugView に出す（debug_mode）＋ traffic_type=internal を付ける。
  ?ga_debug=0 で解除。一般の訪問者には付かない。

イベント（名前は GA4 の自動イベント form_start / form_submit / click と重ならないようにしている）：
- cta_click             問い合わせ・見学・採用・電話・LINE への導線を押した。cta_type = contact | recruit | tel | line | mail、
                        link_location = header | nav | mobilebar | footer | content。押しただけで、問い合わせ完了ではない。
- inquiry_form_start    問い合わせフォームに最初に入力した（1ページ1回）。form_type。
- inquiry_submit_success  フォームの送信先（/api/inquiry）が成功を返し、画面に「送信しました」を出したとき。form_type・facility。
- inquiry_submit_error  送信先がエラーを返した／通信できなかった。form_type・error_code（決まったコードだけ）。
会社HP（WordPress・Contact Form 7）では、CF7 の DOM イベントに結び付ける：
  wpcf7mailsent → inquiry_submit_success（CF7 がメール送信に成功したときだけ出る）、
  wpcf7invalid / wpcf7spam / wpcf7mailfailed → inquiry_submit_error（error_code = invalid / spam / mail_failed）。
  form_type は corp_form_<フォームID>（234＝お問い合わせ、530＝旧採用フォーム）。
"""
import re

MEASUREMENT_ID = "G-773Y7ZR3JX"
HOSTS = ("www.triocareer.jp", "hoiku.triocareer.jp", "afterschool.triocareer.jp")

_JS = r"""(function(){
var ID="__ID__",HOSTS=__HOSTS__;
window.trioTrack=function(){};
if(HOSTS.indexOf(location.hostname)<0)return;
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
window.gtag=gtag;
var dbg=false;
try{
if(/[?&]ga_debug=1(&|$)/.test(location.search))localStorage.setItem("trio_ga_debug","1");
if(/[?&]ga_debug=0(&|$)/.test(location.search))localStorage.removeItem("trio_ga_debug");
dbg=localStorage.getItem("trio_ga_debug")==="1";
}catch(e){}
var keep=[];
location.search.replace(/^\?/,"").split("&").forEach(function(p){if(/^utm_[a-z_]+=/.test(p))keep.push(p);});
var cfg={page_location:location.origin+location.pathname+(keep.length?"?"+keep.join("&"):""),
allow_google_signals:false,allow_ad_personalization_signals:false};
if(dbg){cfg.debug_mode=true;cfg.traffic_type="internal";}
gtag("js",new Date());
gtag("config",ID,cfg);
var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+ID;
document.head.appendChild(s);
window.trioTrack=function(name,params){
var p={};for(var k in params){if(Object.prototype.hasOwnProperty.call(params,k))p[k]=params[k];}
if(dbg){p.debug_mode=true;p.traffic_type="internal";}
gtag("event",name,p);
};
function where(a){
if(a.closest(".mobilebar"))return "mobilebar";
if(a.closest("footer"))return "footer";
if(a.closest("nav"))return "nav";
if(a.closest("header"))return "header";
return "content";
}
document.addEventListener("click",function(e){
var a=e.target&&e.target.closest?e.target.closest("a[href]"):null;
if(!a)return;
var h=a.getAttribute("href")||"",t="",u=null;
if(/^tel:/i.test(h))t="tel";
else if(/^mailto:/i.test(h))t="mail";
else{
try{u=new URL(h,location.href);}catch(x){return;}
if(/(^|\.)line\.me$|(^|\.)lin\.ee$/.test(u.hostname))t="line";
else if(HOSTS.indexOf(u.hostname)>=0){
if(/\/contact(\.html|\/)?$/.test(u.pathname))t=/[?&]kind=recruit/.test(u.search)?"recruit":"contact";
else if(/\/recruit\.html$|\/company\/recruit\/?$/.test(u.pathname))t="recruit";
}
}
if(!t)return;
var p={cta_type:t,link_location:where(a),transport_type:"beacon"};
if(u){p.link_domain=u.hostname;p.link_path=u.pathname;}
window.trioTrack("cta_click",p);
},true);
var started=false;
function formType(f){
var b=f.getAttribute("data-ga-form");
if(!b){var m=/wpcf7-f(\d+)-/.exec((f.closest(".wpcf7")||{}).id||"");b=m?"corp_form_"+m[1]:"";}
var k=f.querySelector("[name=kind]");
if(b&&k&&/^(use|recruit)$/.test(k.value))b+="_"+k.value;
return b||"unknown";
}
window.trioFormType=formType;
function start(e){
if(started)return;
var f=e.target&&e.target.closest?e.target.closest("form#inquiry-form,form.wpcf7-form"):null;
if(!f||(e.target.closest&&e.target.closest(".hp"))||e.target.name==="kind")return;
started=true;
window.trioTrack("inquiry_form_start",{form_type:formType(f)});
}
document.addEventListener("input",start,true);
document.addEventListener("change",start,true);
function cf7(name,code){
document.addEventListener(name,function(e){
var w=e.target,f=w&&w.querySelector?(w.matches&&w.matches("form")?w:w.querySelector("form")):null;
var t=f?formType(f):"unknown";
if(code)window.trioTrack("inquiry_submit_error",{form_type:t,error_code:code});
else window.trioTrack("inquiry_submit_success",{form_type:t});
},false);
}
cf7("wpcf7mailsent","");cf7("wpcf7invalid","invalid");cf7("wpcf7spam","spam");cf7("wpcf7mailfailed","mail_failed");
})();"""


def head_tag(measurement_id=MEASUREMENT_ID):
    """<head> に入れる1行。id="trio-ga4" で何度入れ直しても1つだけになる。
    会社HPのテーマは measurement_id に置き換え用の文字列を渡し、WordPress の設定値を入れる。"""
    js = _JS.replace("__ID__", measurement_id).replace("__HOSTS__", '["' + '","'.join(HOSTS) + '"]')
    js = re.sub(r"\n", "", js)
    return '<script id="trio-ga4">' + js + "</script>"


_BLOCK = re.compile(r'<script id="trio-ga4">.*?</script>\n?', re.S)


def ensure_in_html(html):
    """既にある trio-ga4 を最新に置き換える。なければ </head> の直前に入れる。何度呼んでも結果は同じ。"""
    tag = head_tag()
    if _BLOCK.search(html):
        return _BLOCK.sub(lambda m: tag + ("\n" if m.group(0).endswith("\n") else ""), html, count=1)
    i = html.find("</head>")
    if i < 0:
        return html
    return html[:i] + tag + html[i:]
