#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""放課後等デイサービス（ロップ・コンパスマイル落合南長崎）のサイトを生成する。

出力先: afterschool/site/  … Cloudflare Pages がそのまま配信する（ルートディレクトリ afterschool、出力 site）。

写真とPDFは tools/fetch_assets.py が Google Drive から取得して site/assets/ に置く。
このスクリプトは HTML / robots.txt / sitemap.xml だけを書く。

問い合わせフォームの送信先は保育園サイトと同じ Worker の /api/inquiry（クロスオリジン）。
受信メールアドレスはこのリポジトリ（公開）には書かない。宛先の記号だけを送る。
"""
import json
import pathlib

BASE = "https://afterschool.triocareer.jp"
API = "https://trioland-social-publisher.mygate-jp.workers.dev/api/inquiry"
HOIKU = "https://hoiku.triocareer.jp"
CORP = "https://www.triocareer.jp/"
OUT = pathlib.Path(__file__).parent / "site"
V = "20260918-01"

SITE_NAME = "トリオキャリア 放課後等デイサービス"

LOPP = dict(
    key="lopp", name="ロップ", full="放課後等デイサービス ロップ",
    zip="177-0052", addr="東京都練馬区関町東2-14-4 橋本ビル1階",
    ward="練馬区", street="関町東2-14-4 橋本ビル1階",
    tel="03-6904-7469",
    access=["西武新宿線「武蔵関」駅 徒歩約3分（約185m）"],
    hours="平日 10:00〜19:00／学校休業日 9:00〜18:00",
    hours_ld=["Mo-Fr 10:00-19:00"],
    pickup="あり（練馬区・武蔵野市・西東京市）",
    capacity="要相談（お問い合わせください）",
    supports=["感覚統合療法", "遊戯・運動療法", "集団療育", "預かり支援"],
    photo="lopp-exterior.webp", photo_alt="放課後等デイサービス ロップ（練馬区関町東）の入口",
    logo="lopp-logo.webp", logo_w=600, logo_h=600,
    docs=[("支援プログラム（2025年2月）", "lopp-program-20250210.pdf"),
          ("事業所の自己評価表（2025年10月）", "lopp-self-assessment-20251008.pdf"),
          ("保護者評価表（2025年10月）", "lopp-guardian-assessment-20251008.pdf")],
    map="https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%83%BD%E7%B7%B4%E9%A6%AC%E5%8C%BA%E9%96%A2%E7%94%BA%E6%9D%B12-14-4",
)
COMPASS = dict(
    key="compass", name="コンパスマイル落合南長崎", full="放課後等デイサービス コンパスマイル落合南長崎",
    zip="171-0052", addr="東京都豊島区南長崎3-6-14 栄正印刷ビル",
    ward="豊島区", street="南長崎3-6-14 栄正印刷ビル",
    tel="03-3565-6929",
    access=["都営大江戸線「落合南長崎」駅 徒歩約5分（約354m）",
            "西武池袋線「椎名町」駅 徒歩約9分（約702m）"],
    hours="放課後 13:30〜17:30／学校休業日 10:00〜16:00",
    hours_ld=["Mo-Fr 13:30-17:30"],
    pickup="あり",
    capacity="要相談（お問い合わせください）",
    supports=["遊びを中心とした支援", "運動・感覚遊び", "個別支援", "集団活動"],
    photo="compass-exterior.webp", photo_alt="放課後等デイサービス コンパスマイル落合南長崎（豊島区南長崎）の入口",
    logo="compass-logo.webp", logo_w=700, logo_h=496,
    docs=[("支援プログラム（2025年3月）", "compass-program-20250301.pdf"),
          ("事業所の自己評価表（2026年5月）", "compass-self-assessment-20260501.pdf"),
          ("保護者評価表（2026年5月）", "compass-guardian-assessment-20260501.pdf")],
    map="https://www.google.com/maps/search/?api=1&query=%E6%9D%B1%E4%BA%AC%E9%83%BD%E8%B1%8A%E5%B3%B6%E5%8C%BA%E5%8D%97%E9%95%B7%E5%B4%8E3-6-14",
)
FACILITIES = [LOPP, COMPASS]


# =================================================================== 共通部品
def head(title, desc, path, extra_ld=None, og_image="compass-room-a.webp",
         robots="index,follow,max-image-preview:large"):
    # og:image はSNSで共有されたときに出る絵。施設ページではその施設の写真を渡すこと。
    ld = extra_ld or []
    ldtags = "".join(
        f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False, separators=(",",":"))}</script>'
        for x in ld)
    return f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="robots" content="{robots}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{BASE}/assets/photos/{og_image}?v={V}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fffdf8">
<link rel="stylesheet" href="/assets/site.css?v={V}">
{ldtags}
</head>
<body>'''


NAV_ITEMS = [("/", "ホーム"), ("/approach.html", "支援について"), ("/lopp.html", "ロップ"),
             ("/compass.html", "コンパスマイル"), ("/availability.html", "空き状況"),
             ("/recruit.html", "採用情報")]


def nav(active=""):
    cur = ' aria-current="page"'
    links = "".join(
        f'<a href="{h}"{cur if h == active else ""}>{t}</a>' for h, t in NAV_ITEMS)
    return f'''<header><div class="nav">
<a class="brand" href="/" aria-label="{SITE_NAME} ホームへ"><span class="brand-main">放課後等デイサービス</span><span class="brand-sub">ロップ・コンパスマイル｜トリオキャリア</span></a>
<nav class="links" aria-label="メインメニュー">{links}<a class="cta-top" href="/contact.html">見学・利用相談</a></nav>
</div></header>'''


def footer():
    fac = "".join(
        f'<li><b>{p["full"]}</b><br>〒{p["zip"]} {p["addr"]}<br>'
        f'<a href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a></li>' for p in FACILITIES)
    return f'''<footer><div class="wrap">
<div>
<strong>{SITE_NAME}</strong>
練馬区（ロップ）と豊島区（コンパスマイル落合南長崎）の2事業所で、小学生から高校生までのお子さまをお迎えしています。<br>
運営：トリオキャリア株式会社<br>東京都千代田区富士見2-14-38 富士見イースト511<br>
<a href="{CORP}" rel="noopener" target="_blank">会社サイト</a>／<a href="{HOIKU}/">保育園（トリオランド）</a>
</div>
<div>
<strong>事業所</strong>
<ul class="fac">{fac}</ul>
</div>
<div>
<strong>サイトマップ</strong>
<ul>
<li><a href="/">ホーム</a></li>
<li><a href="/approach.html">支援について</a></li>
<li><a href="/lopp.html">ロップ（練馬区関町東）</a></li>
<li><a href="/compass.html">コンパスマイル落合南長崎（豊島区）</a></li>
<li><a href="/availability.html">空き状況</a></li>
<li><a href="/recruit.html">採用情報</a></li>
<li><a href="/contact.html">見学・利用のご相談</a></li>
</ul>
</div>
</div><div class="copyright">© トリオキャリア株式会社</div></footer>
<div class="mobilebar"><a class="a" href="/contact.html">見学・利用相談</a><a class="b" href="/recruit.html">採用情報</a></div>
</body></html>'''


def crumbs(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n,
                                 "item": BASE + u} for i, (n, u) in enumerate(items)]}


def facility_ld(p, url):
    return {
        "@context": "https://schema.org", "@type": "LocalBusiness",
        "name": p["full"], "url": BASE + url, "telephone": p["tel"],
        "parentOrganization": {"@type": "Organization", "name": "トリオキャリア株式会社"},
        "address": {"@type": "PostalAddress", "postalCode": p["zip"], "addressRegion": "東京都",
                    "addressLocality": p["ward"], "streetAddress": p["street"], "addressCountry": "JP"},
        "openingHours": p["hours_ld"],
        "image": BASE + "/assets/photos/" + p["photo"],
    }


ORG_LD = {
    "@context": "https://schema.org", "@type": "Organization",
    "name": SITE_NAME, "url": BASE,
    "parentOrganization": {"@type": "Organization", "name": "トリオキャリア株式会社", "url": CORP},
    "department": [
        {"@type": "LocalBusiness", "name": p["full"], "url": BASE + f"/{p['key']}.html", "telephone": p["tel"]}
        for p in FACILITIES
    ],
}


def cta(title, text, primary=("/contact.html", "見学・利用のご相談"), second=None):
    s = f'<a class="btn ghost" href="{second[0]}">{second[1]}</a>' if second else ""
    return f'''<section><div class="wrap"><div class="cta"><h2>{title}</h2><p>{text}</p>
<div class="actions"><a class="btn" href="{primary[0]}">{primary[1]}</a>{s}</div></div></div></section>'''


def spec_table(p):
    rows = [
        ("所在地", f'〒{p["zip"]}<br>{p["addr"]}<br><a href="{p["map"]}" rel="noopener" target="_blank">地図を開く</a>'),
        ("電話番号", f'<a href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a>'),
        ("アクセス", "<br>".join(p["access"])),
        ("対象", "小学生〜高校生（受給者証をお持ちの方）"),
        ("サービス提供時間", p["hours"]),
        ("送迎", p["pickup"]),
        ("定員・空き", p["capacity"]),
        ("主な支援", "／".join(p["supports"])),
    ]
    body = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows)
    return f'<div class="table-scroll"><table class="spec">{body}</table></div>'


def docs_list(p):
    items = "".join(
        f'<li><a href="/assets/docs/{f}" target="_blank" rel="noopener">{t}（PDF）</a></li>'
        for t, f in p["docs"])
    return f'''<div class="docs"><h3>公開資料</h3>
<p>支援プログラムと、事業所の自己評価・保護者評価の結果を公表しています。</p>
<ul>{items}</ul></div>'''


# 問い合わせフォーム。送信先の実アドレスはこのコードに書かない（リポジトリは公開）。
# 種別（利用／採用）と施設の選択から宛先の記号を決め、Worker が Make 経由で転送する。
FORM_JS = r'''
<script>
(function () {
  var form = document.getElementById("inquiry-form");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var button = form.querySelector("button[type=submit]");
  var kind = form.querySelector("[name=kind]");
  var facility = form.querySelector("[name=facility]");
  var useOnly = form.querySelectorAll(".use-only");
  var MESSAGES = {
    NAME_REQUIRED: "お名前をご記入ください。",
    CONTACT_REQUIRED: "電話番号かメールアドレスのどちらかをご記入ください。",
    INVALID_EMAIL: "メールアドレスの形式をご確認ください。",
    MESSAGE_REQUIRED: "ご相談内容をご記入ください。",
    INVALID_DESTINATION: "希望施設を選択してください。",
    TOO_MANY_REQUESTS: "送信が続いています。しばらく時間をおいてからお試しください。"
  };
  var FALLBACK = "送信できませんでした。恐れ入りますが、お電話でご連絡ください。 __TEL__";
  function show(text, cls) { status.textContent = text; status.className = "form-status " + cls; }
  function syncKind() {
    var recruit = kind.value === "recruit";
    for (var i = 0; i < useOnly.length; i++) useOnly[i].hidden = recruit;
    facility.required = !recruit;
    var opt = facility.querySelector("option[value=any]");
    if (opt) opt.hidden = !recruit;
    if (!recruit && facility.value === "any") facility.value = "";
  }
  kind.addEventListener("change", syncKind);
  syncKind();
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    var recruit = data.kind === "recruit";
    if (recruit) {
      data.destination = "afterschool_recruit";
      var label = facility.options[facility.selectedIndex] ? facility.options[facility.selectedIndex].text : "";
      if (data.facility && data.facility !== "any") data.message = "【希望勤務先】" + label + "\n" + data.message;
    } else {
      if (data.facility !== "lopp" && data.facility !== "compass") { show(MESSAGES.INVALID_DESTINATION, "error"); return; }
      data.destination = data.facility;
    }
    if (!data.agree) { show("個人情報の取り扱いへの同意をご確認ください。", "error"); return; }
    delete data.kind; delete data.facility; delete data.agree;
    button.disabled = true;
    show("送信しています…", "sending");
    fetch("__API__", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (response) {
      return response.json().then(function (body) { return { response: response, body: body }; });
    }).then(function (result) {
      if (result.response.ok && result.body.ok) {
        form.reset(); syncKind();
        show("送信しました。担当者より折り返しご連絡いたします。", "done");
        return;
      }
      show(MESSAGES[result.body.error] || FALLBACK, "error");
      button.disabled = false;
    }).catch(function () {
      show(FALLBACK, "error");
      button.disabled = false;
    });
  });
})();
</script>'''


def inquiry_form(default_kind="use", default_facility=""):
    tel_note = "／".join(f'{p["name"]} {p["tel"]}' for p in FACILITIES)
    js = FORM_JS.replace("__API__", API).replace("__TEL__", tel_note)
    sel = lambda v, cur: ' selected' if v == cur else ''
    return f'''
<section id="form"><div class="wrap">
  <div class="kicker">CONTACT</div>
  <h2>見学・利用のご相談／採用のお問い合わせ</h2>
  <p class="lead">下のフォームからお送りください。ご希望の事業所に直接届きます。お電話でも承っています。</p>
  <form class="inquiry" id="inquiry-form" novalidate>
    <div class="row">
      <div class="field"><label for="f-kind">お問い合わせの種別 <span class="req">必須</span></label>
        <select id="f-kind" name="kind" required>
          <option value="use"{sel("use", default_kind)}>利用・見学のご相談</option>
          <option value="recruit"{sel("recruit", default_kind)}>求人・採用について</option>
        </select></div>
      <div class="field"><label for="f-facility">希望施設 <span class="req">必須</span></label>
        <select id="f-facility" name="facility" required>
          <option value="">選択してください</option>
          <option value="lopp"{sel("lopp", default_facility)}>ロップ（練馬区関町東・武蔵関駅）</option>
          <option value="compass"{sel("compass", default_facility)}>コンパスマイル落合南長崎（豊島区）</option>
          <option value="any" hidden>どちらでも／相談したい</option>
        </select></div>
    </div>
    <div class="field"><label for="f-name">お名前 <span class="req">必須</span></label>
      <input id="f-name" name="name" required autocomplete="name"></div>
    <div class="row">
      <div class="field"><label for="f-tel">電話番号</label>
        <input id="f-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel"></div>
      <div class="field"><label for="f-email">メールアドレス（任意）</label>
        <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
    </div>
    <p class="hint">電話番号とメールアドレスは、どちらか一方で構いません。</p>
    <div class="row use-only">
      <div class="field"><label for="f-grade">お子さまの学年</label>
        <input id="f-grade" name="grade" placeholder="例：小学3年生 / 来年度 小1"></div>
      <div class="field"><label for="f-school">学校名</label>
        <input id="f-school" name="school" placeholder="例：○○小学校"></div>
    </div>
    <div class="field"><label for="f-area">お住まい（町名まで）</label>
      <input id="f-area" name="area" placeholder="例：練馬区関町北 / 豊島区南長崎"></div>
    <p class="hint">送迎の可否を確認するために伺います。番地までは不要です。</p>
    <div class="field"><label for="f-message">ご相談内容・補足 <span class="req">必須</span></label>
      <textarea id="f-message" name="message" rows="6" required placeholder="例：見学を希望します。受給者証は申請中です。／ 求人について詳しく聞きたいです。"></textarea></div>
    <div class="hp" aria-hidden="true"><label>会社名（入力しないでください）
      <input name="company" tabindex="-1" autocomplete="off"></label></div>
    <label class="agree"><input type="checkbox" name="agree" value="1" required>
      ご入力いただいた内容は、お問い合わせへの対応と見学・利用・採用のご案内にのみ使用します。この取り扱いに同意して送信します。</label>
    <button class="btn accent" type="submit">この内容で送信する</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</div></section>{js}'''


# =================================================================== ページ
APPROACH_ITEMS = [
    ("感覚特性に寄り添う",
     "触覚・前庭覚・固有覚など、お子さま一人ひとりの感覚の受け取り方はちがいます。「苦手」を無理に克服させるのではなく、安心して過ごせる環境と遊びを通して、感覚を心地よく整えていきます。"),
    ("専門性を学び続ける",
     "感覚統合療法や遊戯・運動療法の考え方を土台に、職員が学び合いながら支援の質を高めています。目の前の行動だけを見るのではなく、その背景にある理由を考えて関わります。"),
    ("「好き」「楽しい」を増やす",
     "夢中になれる遊びの中で、身体の使い方・人との関わり・気持ちの切り替えが自然と育ちます。小さな「できた」を自信と次の挑戦へつなげます。"),
]


def page_index():
    ld = [ORG_LD, {
        "@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME, "url": BASE}]
    approach = "".join(
        f'<div class="card"><span class="num">{i+1}</span><h3>{t}</h3><p>{d}</p></div>'
        for i, (t, d) in enumerate(APPROACH_ITEMS))
    fac_cards = ""
    for p in FACILITIES:
        fac_cards += f'''
<article class="branch">
  <a href="/{p["key"]}.html"><img src="/assets/photos/{p["photo"]}?v={V}" alt="{p["photo_alt"]}" loading="lazy" decoding="async"></a>
  <div class="content">
    <img class="logo" src="/assets/photos/{p["logo"]}?v={V}" width="{p["logo_w"]}" height="{p["logo_h"]}" alt="{p["name"]} ロゴ" loading="lazy" decoding="async">
    <h3>{p["name"]}</h3>
    <div class="meta">{p["access"][0]}</div>
    <ul>
      <li>〒{p["zip"]} {p["addr"]}</li>
      <li>{p["hours"]}</li>
      <li>送迎：{p["pickup"]}</li>
      <li>主な支援：{"／".join(p["supports"])}</li>
    </ul>
    <div class="btnrow"><a class="btn sm accent" href="/{p["key"]}.html">施設の詳細</a><a class="btn sm outline" href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a></div>
  </div>
</article>'''
    return head(
        f"{SITE_NAME}｜ロップ（練馬区）・コンパスマイル落合南長崎（豊島区）",
        "遊びきる時間が、成長の土台になる。一人ひとりの個性と感覚特性に寄り添い、「好き」「楽しい」から育つ力を支える放課後等デイサービス。練馬区関町東のロップ、豊島区南長崎のコンパスマイル落合南長崎。小学生〜高校生、送迎あり。",
        "/", ld) + nav("/") + f'''
<main>
<section class="hero-wrap"><div class="wrap hero">
  <div>
    <div class="badge">小学生〜高校生／両施設とも送迎あり</div>
    <h1>遊びきる時間が、<br>成長の土台になる。</h1>
    <p class="lead">一人ひとりの個性と感覚特性に寄り添い、「好き」「楽しい」から育つ力を支える放課後等デイサービスです。練馬区（ロップ）と豊島区（コンパスマイル落合南長崎）の2事業所で、小学生から高校生までのお子さまをお迎えしています。</p>
    <div class="actions"><a class="btn accent" href="/contact.html">見学・利用のご相談</a><a class="btn outline" href="/approach.html">支援の考え方を見る</a></div>
  </div>
  <div class="collage">
    <img class="big" src="/assets/photos/lopp-room.webp?v={V}" alt="ロップの室内。トランポリンやバランスボール、ハンモックのある運動・感覚遊びのスペース" decoding="async">
    <img class="small" src="/assets/photos/compass-playroom.webp?v={V}" alt="コンパスマイル落合南長崎の遊戯スペース" loading="lazy" decoding="async">
    <img class="small" src="/assets/photos/compass-room-a.webp?v={V}" alt="コンパスマイル落合南長崎の活動室" loading="lazy" decoding="async">
  </div>
</div></section>

<section class="tight"><div class="wrap quick">
  <div><b>小学生〜高校生</b>受給者証をお持ちのお子さまを受け入れています</div>
  <div><b>両施設とも送迎あり</b>学校やご自宅への送迎に対応します（地域は要相談）</div>
  <div><b>遊び中心の発達支援</b>感覚統合・運動遊びを土台にした支援</div>
  <div><b>2事業所</b>練馬区関町東（ロップ）／豊島区南長崎（コンパスマイル）</div>
</div></section>

<section><div class="wrap"><div class="band">
  <div class="kicker">OUR APPROACH</div>
  <h2>遊びを中心に、発達の土台へアプローチ</h2>
  <div class="band-tags"><span>感覚を育てる</span><span>できたを増やす</span><span>好きに出会う</span></div>
  <p class="lead">目の前の行動だけを見るのではなく、その背景にある感覚の受け取り方や気持ちに目を向けます。夢中になれる遊びの中で身体と心を育て、小さな「できた」を自信と次の挑戦へつなげます。</p>
  <div class="cards">{approach}</div>
  <div class="actions"><a class="btn outline" href="/approach.html">支援についてくわしく</a></div>
</div></div></section>

<section><div class="wrap">
  <div class="kicker">FACILITIES</div>
  <h2>事業所のご案内</h2>
  <p class="lead">どちらの事業所も、まずは見学からどうぞ。お子さまの様子やご希望を伺いながら、利用の流れをご案内します。</p>
  <div class="branch-grid">{fac_cards}</div>
</div></section>

<section class="tight"><div class="wrap split">
  <div>
    <div class="kicker">RECRUIT</div>
    <h2>一緒に遊び、一緒に育つ。</h2>
    <p>遊びの中にある成長を、支える仕事です。児童指導員・保育士・指導員（パート・アルバイト）を募集しています。資格をお持ちの方はもちろん、お子さまと関わることが好きな方のご応募をお待ちしています。</p>
    <div class="actions"><a class="btn navy" href="/recruit.html">採用情報を見る</a></div>
  </div>
  <div class="imgcol"><img src="/assets/photos/compass-room-b.webp?v={V}" alt="コンパスマイル落合南長崎の活動室。天井の高い広い空間" loading="lazy" decoding="async"></div>
</div></section>
</main>
{cta("まずは見学から、お気軽に。", "受給者証の申請がこれからの方も、ご相談いただけます。空き状況や送迎の範囲もお問い合わせください。", second=("/availability.html", "空き状況を見る"))}
''' + footer()


def page_approach():
    ld = [crumbs([("ホーム", "/"), ("支援について", "/approach.html")])]
    items = "".join(
        f'<div class="card"><span class="num">{i+1}</span><h3>{t}</h3><p>{d}</p></div>'
        for i, (t, d) in enumerate(APPROACH_ITEMS))
    return head(
        f"支援について｜{SITE_NAME}",
        "感覚特性に寄り添い、遊びを中心に発達の土台へアプローチする放課後等デイサービスの支援の考え方。感覚統合療法・遊戯・運動療法・集団療育・個別支援。",
        "/approach.html", ld, og_image="lopp-room.webp") + nav("/approach.html") + f'''
<main>
<section class="hero-wrap"><div class="wrap hero single">
  <div class="kicker">OUR APPROACH</div>
  <h1>遊びを中心に、発達の土台へアプローチ</h1>
  <p class="lead">目の前の行動だけを見るのではなく、その背景にある感覚の受け取り方や気持ちに目を向けます。夢中になれる遊びの中で身体と心を育て、小さな「できた」を自信と次の挑戦へつなげます。</p>
</div></section>

<section class="tight"><div class="wrap"><div class="cards">{items}</div></div></section>

<section><div class="wrap split">
  <div class="imgcol"><img src="/assets/photos/lopp-room.webp?v={V}" alt="ロップの室内。トランポリン、バランスボール、ハンモックなど感覚遊びの道具" loading="lazy" decoding="async"></div>
  <div>
    <div class="kicker">SENSORY PLAY</div>
    <h2>身体を思いきり使う遊びから</h2>
    <p>トランポリンで跳ぶ、ハンモックで揺れる、ボールプールに沈む。こうした遊びは、前庭覚や固有覚といった「身体の感覚」を心地よく整え、姿勢や集中、気持ちの落ち着きにつながります。</p>
    <p>お子さまが自分で選び、夢中になれることを大切にしています。職員はその遊びに一緒に入りながら、無理のない範囲で少しずつ挑戦の幅を広げていきます。</p>
  </div>
</div></section>

<section><div class="wrap">
  <div class="kicker">SUPPORT</div>
  <h2>主な支援内容</h2>
  <div class="cards two">
    <div class="card"><h3>感覚統合療法・運動遊び</h3><p>身体の感覚を整える遊びを通して、姿勢・運動の協調・注意の切り替えを育てます。</p></div>
    <div class="card"><h3>遊戯療法・個別支援</h3><p>お子さまの興味に沿った遊びの中で、コミュニケーションや気持ちの表現を支えます。</p></div>
    <div class="card"><h3>集団療育・集団活動</h3><p>少人数の活動で、順番を待つ・ルールを共有する・友だちと協力する経験を重ねます。</p></div>
    <div class="card"><h3>預かり支援・送迎</h3><p>放課後や学校休業日に安心して過ごせる居場所として、学校・ご自宅への送迎にも対応します。</p></div>
  </div>
  <p class="note">支援内容は事業所によって異なります。くわしくは <a href="/lopp.html">ロップ</a>・<a href="/compass.html">コンパスマイル落合南長崎</a> の各ページと、公開している支援プログラム（PDF）をご覧ください。</p>
</div></section>
</main>
{cta("お子さまに合う過ごし方を、一緒に考えます。", "見学では、実際の活動の様子をご覧いただけます。ご家庭でのご様子もお聞かせください。")}
''' + footer()


def page_facility(p, path, gallery, intro, active):
    ld = [facility_ld(p, path), crumbs([("ホーム", "/"), (p["name"], path)])]
    other = COMPASS if p is LOPP else LOPP
    gal = "".join(
        f'<figure><img src="/assets/photos/{f}?v={V}" alt="{alt}" loading="lazy" decoding="async"><figcaption>{cap}</figcaption></figure>'
        for f, alt, cap in gallery)
    return head(
        f"{p['full']}（{p['ward']}）｜{SITE_NAME}",
        f"{p['full']}。〒{p['zip']} {p['addr']}。{p['access'][0]}。{p['hours']}。送迎{p['pickup']}。小学生〜高校生。見学・利用のご相談はお電話（{p['tel']}）またはフォームから。",
        path, ld, og_image=p["photo"]) + nav(active) + f'''
<main>
<section class="hero-wrap"><div class="wrap hero">
  <div>
    <div class="badge">{p["ward"]}／{p["access"][0].split("「")[1].split("」")[0]}駅</div>
    <img class="page-logo" src="/assets/photos/{p["logo"]}?v={V}" width="{p["logo_w"]}" height="{p["logo_h"]}" alt="{p["name"]} ロゴ" decoding="async">
    <h1>{p["full"]}</h1>
    <p class="lead">{intro}</p>
    <div class="actions"><a class="btn accent" href="/contact.html?facility={p["key"]}">見学・利用のご相談</a><a class="btn outline" href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a></div>
  </div>
  <div class="hero-media"><figure><img src="/assets/photos/{p["photo"]}?v={V}" alt="{p["photo_alt"]}" decoding="async"><figcaption>{p["name"]} 入口</figcaption></figure></div>
</div></section>

<section class="tight"><div class="wrap">
  <div class="kicker">INFORMATION</div>
  <h2>施設概要</h2>
  {spec_table(p)}
</div></section>

<section><div class="wrap">
  <div class="kicker">PHOTOS</div>
  <h2>施設の様子</h2>
  <div class="gallery">{gal}</div>
</div></section>

<section class="tight"><div class="wrap">{docs_list(p)}</div></section>

<section class="tight"><div class="wrap">
  <div class="kicker">FLOW</div>
  <h2>利用までの流れ</h2>
  <div class="steps">
    <div><b>お問い合わせ</b><p>フォームまたはお電話で。空き状況と送迎の範囲をお伝えします。</p></div>
    <div><b>見学・面談</b><p>お子さまと一緒に施設をご覧ください。ご家庭でのご様子も伺います。</p></div>
    <div><b>受給者証の手続き</b><p>お住まいの区市町村で通所受給者証を申請します。申請中の方もご相談ください。</p></div>
    <div><b>契約・利用開始</b><p>個別支援計画を作成し、利用を開始します。</p></div>
  </div>
  <p class="note">もう一つの事業所：<a href="/{other["key"]}.html">{other["full"]}（{other["ward"]}）</a></p>
</div></section>
</main>
{cta(f"{p['name']}の見学を受け付けています。", "お子さまの学年やお住まいの町名をお知らせいただくと、送迎の可否を含めてご案内できます。", primary=(f"/contact.html?facility={p['key']}", "見学・利用のご相談"))}
''' + footer()


def page_availability():
    ld = [crumbs([("ホーム", "/"), ("空き状況", "/availability.html")])]
    rows = "".join(
        f'<tr><th>{p["full"]}</th><td>{p["capacity"]}<br><a href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a>（{p["hours"]}）</td></tr>'
        for p in FACILITIES)
    return head(
        f"空き状況｜{SITE_NAME}",
        "ロップ（練馬区）・コンパスマイル落合南長崎（豊島区）の空き状況のご案内。曜日によって空きが異なります。最新の状況はお電話またはフォームでお問い合わせください。",
        "/availability.html", ld) + nav("/availability.html") + f'''
<main>
<section class="hero-wrap"><div class="wrap hero single">
  <div class="kicker">AVAILABILITY</div>
  <h1>空き状況</h1>
  <p class="lead">曜日や時間帯によって空きの状況が異なります。最新の状況は各事業所にお問い合わせください。受給者証の申請がこれからの方も、先に見学・ご相談いただけます。</p>
</div></section>
<section class="tight"><div class="wrap">
  <div class="table-scroll"><table class="spec">{rows}</table></div>
  <p class="note">送迎は地域によって対応できない場合があります。お住まいの町名をお知らせください。</p>
</div></section>
</main>
{cta("空き状況の確認は、フォームからも。", "ご希望の曜日とお子さまの学年をお書き添えください。折り返しご連絡します。")}
''' + footer()


def page_recruit():
    ld = [crumbs([("ホーム", "/"), ("採用情報", "/recruit.html")])]
    return head(
        f"採用情報（児童指導員・保育士・指導員）｜{SITE_NAME}",
        "放課後等デイサービス ロップ（練馬区）・コンパスマイル落合南長崎（豊島区）の求人。児童指導員・保育士・指導員（パート・アルバイト）。遊びの中にある成長を支える仕事です。",
        "/recruit.html", ld, og_image="compass-room-b.webp") + nav("/recruit.html") + f'''
<main>
<section class="hero-wrap"><div class="wrap hero">
  <div>
    <div class="kicker">RECRUIT</div>
    <h1>一緒に遊び、一緒に育つ。</h1>
    <p class="lead">遊びの中にある成長を、支える仕事です。お子さまが夢中になれる時間をつくり、小さな「できた」を一緒に喜ぶ。そんな毎日を一緒に過ごす仲間を募集しています。</p>
    <div class="actions"><a class="btn accent" href="/contact.html?kind=recruit">応募・問い合わせ</a></div>
  </div>
  <div class="hero-media"><figure><img src="/assets/photos/compass-room-b.webp?v={V}" alt="コンパスマイル落合南長崎の活動室" decoding="async"><figcaption>コンパスマイル落合南長崎 活動室</figcaption></figure></div>
</div></section>

<section class="tight"><div class="wrap">
  <div class="kicker">JOB</div>
  <h2>募集要項</h2>
  <div class="table-scroll"><table class="spec">
    <tr><th>職種</th><td>児童指導員・保育士・指導員（パート・アルバイト）</td></tr>
    <tr><th>勤務地</th><td>ロップ（練馬区関町東2-14-4 橋本ビル1階／武蔵関駅 徒歩約3分）<br>コンパスマイル落合南長崎（豊島区南長崎3-6-14 栄正印刷ビル／落合南長崎駅 徒歩約5分）</td></tr>
    <tr><th>給与</th><td>時給 1,300円〜1,700円（経験・資格による）</td></tr>
    <tr><th>勤務時間</th><td>平日 13:00〜19:00／土曜・祝日・長期休暇 9:00〜18:00<br>週の日数・時間はご相談ください</td></tr>
    <tr><th>休日</th><td>日曜ほか（相談のうえ決定）</td></tr>
    <tr><th>仕事内容</th><td>児童の療育・自立支援、遊びや活動のサポート、保護者対応、学校・ご自宅への送迎、記録や清掃など</td></tr>
    <tr><th>資格・経験</th><td>保育士・児童指導員任用資格をお持ちの方歓迎。未経験の方もご相談ください</td></tr>
  </table></div>
</div></section>

<section><div class="wrap">
  <div class="kicker">WORK</div>
  <h2>こんな方と働きたい</h2>
  <div class="cards">
    <div class="card"><h3>子どもと本気で遊べる</h3><p>トランポリンで一緒に跳び、ごっこ遊びに付き合う。遊びの中に支援があると考えています。</p></div>
    <div class="card"><h3>行動の背景を考えられる</h3><p>「困った行動」の裏にある感覚や気持ちに目を向け、職員同士で話し合いながら関わり方を考えます。</p></div>
    <div class="card"><h3>学び続けたい</h3><p>感覚統合や運動療法の考え方を、現場の実践を通して学べます。資格取得を目指す方も歓迎です。</p></div>
  </div>
</div></section>

<section class="tight"><div class="wrap">
  <div class="kicker">FLOW</div>
  <h2>応募から採用まで</h2>
  <div class="steps">
    <div><b>お問い合わせ</b><p>下のフォームから。希望する事業所と勤務できる曜日をお書きください。</p></div>
    <div><b>見学・面談</b><p>実際の活動を見ていただいたうえで、働き方をご相談します。</p></div>
    <div><b>採用</b><p>勤務開始日を決めて、先輩職員と一緒に業務に入ります。</p></div>
    <div><b>研修・OJT</b><p>お子さまとの関わり方や記録の書き方を、現場で少しずつ覚えていきます。</p></div>
  </div>
</div></section>
</main>
{inquiry_form(default_kind="recruit")}
''' + footer()


def page_contact():
    ld = [crumbs([("ホーム", "/"), ("見学・利用のご相談", "/contact.html")])]
    tels = "".join(
        f'<div><b>{p["full"]}</b><a href="tel:{p["tel"].replace("-", "")}">{p["tel"]}</a><br><span class="muted">{p["hours"]}</span></div>'
        for p in FACILITIES)
    # URL の ?facility=lopp / ?kind=recruit で初期選択を切り替える（施設ページ・採用ページからの導線）。
    preset_js = '''
<script>
(function () {
  var q = new URLSearchParams(location.search);
  var f = document.getElementById("f-facility"), k = document.getElementById("f-kind");
  if (q.get("facility") && f) f.value = q.get("facility");
  if (q.get("kind") === "recruit" && k) { k.value = "recruit"; k.dispatchEvent(new Event("change")); }
})();
</script>'''
    return head(
        f"見学・利用のご相談｜{SITE_NAME}",
        "放課後等デイサービス ロップ（練馬区）・コンパスマイル落合南長崎（豊島区）への見学・利用のご相談、採用のお問い合わせ。フォームまたはお電話で受け付けています。",
        "/contact.html", ld) + nav("/contact.html") + f'''
<main>
<section class="hero-wrap"><div class="wrap hero single">
  <div class="kicker">CONTACT</div>
  <h1>見学・利用のご相談</h1>
  <p class="lead">見学のご希望、空き状況、送迎の範囲、受給者証の手続きなど、どんなことでもお気軽にご相談ください。求人・採用のお問い合わせもこちらから。</p>
</div></section>
<section class="tight"><div class="wrap">
  <div class="facts tel">{tels}</div>
</div></section>
</main>
{inquiry_form()}{preset_js}
''' + footer()


# =================================================================== 出力
PAGES = ["/", "/approach.html", "/lopp.html", "/compass.html", "/availability.html",
         "/recruit.html", "/contact.html"]


def write(path, html):
    out = OUT / path.lstrip("/")
    if path.endswith("/"):
        out = OUT / path.strip("/") / "index.html" if path != "/" else OUT / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"  wrote {out.relative_to(OUT.parent)}  {len(html.encode('utf-8')):,} bytes")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    write("/", page_index())
    write("/approach.html", page_approach())
    write("/lopp.html", page_facility(
        LOPP, "/lopp.html",
        [("lopp-exterior.webp", "ロップの入口。橋本ビル1階、ガラス面にうさぎのイラスト", "入口（橋本ビル1階）"),
         ("lopp-room.webp", "ロップの室内。トランポリン、バランスボール、ハンモック", "運動・感覚遊びのスペース")],
        "練馬区関町東、武蔵関駅から徒歩約3分。感覚統合療法や遊戯・運動療法の考え方をもとに、身体を思いきり使う遊びから発達の土台を育てます。練馬区・武蔵野市・西東京市への送迎に対応しています。",
        "/lopp.html"))
    write("/compass.html", page_facility(
        COMPASS, "/compass.html",
        [("compass-exterior.webp", "コンパスマイル落合南長崎の入口。海の生き物のイラストが描かれたガラス面", "入口（栄正印刷ビル）"),
         ("compass-playroom.webp", "コンパスマイル落合南長崎の遊戯スペース。トランポリンとボールプール", "遊戯スペース"),
         ("compass-room-a.webp", "コンパスマイル落合南長崎の活動室", "活動室"),
         ("compass-room-b.webp", "コンパスマイル落合南長崎の活動室（天井の高い広い空間）", "活動室"),
         ("compass-consult.webp", "コンパスマイル落合南長崎の相談室", "相談室"),
         ("compass-map.webp", "コンパスマイル落合南長崎の壁に描かれた世界地図", "壁の世界地図")],
        "豊島区南長崎、落合南長崎駅から徒歩約5分、椎名町駅から徒歩約9分。遊びを中心とした支援と運動・感覚遊びを軸に、個別支援と集団活動を組み合わせてお子さまの成長を支えます。送迎にも対応しています。",
        "/compass.html"))
    write("/availability.html", page_availability())
    write("/recruit.html", page_recruit())
    write("/contact.html", page_contact())

    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8")
    urls = "".join(f"<url><loc>{BASE}{p}</loc></url>" for p in PAGES)
    (OUT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n',
        encoding="utf-8")
    # Pages 用: 直接 /api/ を叩かれたときの誤解を防ぐため、サーバ側の関数は置かない（送信先は Worker）。
    (OUT / "_headers").write_text(
        "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n"
        "/assets/photos/*\n  Cache-Control: public, max-age=31536000, immutable\n"
        "/assets/docs/*\n  Cache-Control: public, max-age=3600\n", encoding="utf-8")
    print("done.")


if __name__ == "__main__":
    main()
