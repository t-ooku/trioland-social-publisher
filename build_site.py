#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""トリオランド サイトビルダー
すべてのページを共通ヘッダー/フッターから生成する。
写真は1枚につきサイト全体で1回だけ使用する（重複禁止）。
"""
import os, re, json, pathlib

# 本番 URL。2026-09-18 に Cloudflare Pages（hoiku.triocareer.jp）へ切り替えた。
# workers.dev 側にも同じ HTML が出るが、canonical はこの URL に統一する（検索エンジンの評価を新ドメインへ集める）。
BASE = "https://hoiku.triocareer.jp"
# 問い合わせフォームの送信先。サイト本体を Cloudflare Pages（hoiku.triocareer.jp）へ移しても
# 受け口は Worker に置いたままなので、相対パスではなく絶対 URL で呼ぶ（Worker 側で CORS 許可済み）。
API = "https://trioland-social-publisher.mygate-jp.workers.dev/api/inquiry"
OUT = pathlib.Path(__file__).parent / "site"
V = "20261009-01"

# ---------------------------------------------------------------- 施設データ
KOMA = dict(
    name="トリオランド駒沢大学園",
    zip="154-0003",
    addr="東京都世田谷区野沢2-33-5 グランドメゾン野沢103号室",
    tel="03-6450-7390",
    capacity="19名（0歳児9名／1歳児7名／2歳児3名）",
    ages="生後57日目〜2歳児クラス",
    hours="平日 7:30〜20:30（18:30以降のお預かりは事前相談）／土・日・祝 8:00〜17:00",
    access=["東急田園都市線 駒沢大学駅 徒歩約6分（約550m）",
            "東急田園都市線 三軒茶屋駅 徒歩約14分（約1.0km）",
            "東急世田谷線 西太子堂駅 徒歩約16分"],
    extra="敷地面積 98.36㎡／入園料 0円／給食費は会費に含まれます",
    geo=("35.6266", "139.6620"),
    photo="komazawa-exterior.webp",
    photo_alt="トリオランド駒沢大学園の園舎外観。通りに面した明るい入口と「トリオランド こまざわ保育園」の看板",
)
UME = dict(
    name="トリオランド梅ヶ丘園",
    zip="154-0022",
    addr="東京都世田谷区梅丘1-21-9 ルミエール梅丘1階",
    tel="03-6413-1704",
    capacity="20名",
    ages="生後57日目〜2歳児クラス",
    hours="平日 7:30〜20:30（18:30以降のお預かりは事前相談）／土・日・祝 8:00〜17:00",
    access=["小田急小田原線 梅ヶ丘駅 徒歩約1分（約90m）",
            "東急世田谷線 山下駅 徒歩約11分",
            "京王井の頭線 東松原駅 徒歩約13分"],
    extra=None,
    geo=("35.6533", "139.6480"),
    photo="umegaoka-exterior.webp",
    photo_alt="トリオランド梅ヶ丘園の園舎外観。梅ヶ丘駅前の通りに面した入口と「トリオランド 梅ヶ丘園」の看板",
)

# トリオキャリア HP の採用ページ（https://www.triocareer.jp/company/recruit/）にはリンクしない（2026-10-09 オーナーの指示：パート・アルバイトの賃金が最低賃金を下回ったまま）。
# Codex の求人ガイド（site/recruit/*.html）のリンクは build-photos.yml の手順で /recruit.html#jobs に付け替える。
CONTACT_URL = "https://www.triocareer.jp/contact/"

# ------------------------------------------------------------------- 部品
def head(title, desc, path, extra_ld=None, robots="index,follow,max-image-preview:large",
         og_image="komazawa-exterior.webp"):
    # og:image はSNSで共有されたときに出る絵。園ページではその園の外観を渡すこと。
    # ここを固定にすると、梅ヶ丘のページを共有したのに駒沢の写真が出てしまう。
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
<meta property="og:site_name" content="トリオランド">
<meta property="og:locale" content="ja_JP">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{BASE}/assets/photos/{og_image}?v={V}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fffdf9">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap">
<link rel="stylesheet" href="/assets/site.css?v={V}">
{ldtags}
</head>
<body>'''

def nav(active=""):
    items = [("/", "トリオランドについて"), ("/komazawa.html", "駒沢大学園"),
             ("/umegaoka.html", "梅ヶ丘園"), ("/faq.html", "よくある質問"),
             ("/recruit.html", "採用情報"), ("/column.html", "求人コラム")]
    cur = ' aria-current="page"'
    links = "".join(
        f'<a href="{h}"{cur if h == active else ""}>{t}</a>' for h, t in items)
    return f'''<header><div class="nav">
<a class="brand" href="/" aria-label="トリオランド ホームへ"><img src="/assets/photos/trioland-logo.webp?v={V}" width="466" height="140" alt="トリオランド 企業主導型保育所" decoding="async"><small>世田谷区／駒沢大学園・梅ヶ丘園</small></a>
<nav class="links" aria-label="メインメニュー">{links}<a class="cta-top" href="/contact.html">見学・入園相談</a></nav>
</div></header>'''

def footer():
    return f'''<footer><div class="wrap">
<div>
<strong>トリオランド</strong>
東京都世田谷区の企業主導型保育園。<br>駒沢大学園・梅ヶ丘園の2園で、生後57日目〜2歳児クラスのお子さまをお預かりしています。<br>
運営：トリオキャリア株式会社
</div>
<div>
<strong>園のご案内</strong>
<ul>
<li>{KOMA["name"]}<br>〒{KOMA["zip"]} {KOMA["addr"]}<br><a href="tel:{KOMA["tel"].replace("-","")}">{KOMA["tel"]}</a></li>
<li style="margin-top:10px">{UME["name"]}<br>〒{UME["zip"]} {UME["addr"]}<br><a href="tel:{UME["tel"].replace("-","")}">{UME["tel"]}</a></li>
</ul>
</div>
<div>
<strong>サイトマップ</strong>
<ul>
<li><a href="/">トリオランドについて</a></li>
<li><a href="/komazawa.html">駒沢大学園</a></li>
<li><a href="/umegaoka.html">梅ヶ丘園</a></li>
<li><a href="/faq.html">よくある質問</a></li>
<li><a href="/contact.html">見学・入園相談</a></li>
<li><a href="/recruit.html">採用情報（保育士・保育補助）</a></li>
<li><a href="/recruit/">求人ガイド一覧</a></li>
<li><a href="/column.html">保育士求人コラム</a></li>
</ul>
</div>
</div><div class="copyright">{trio("trio-sm", "bounce")}<br>© トリオランド／トリオキャリア株式会社</div></footer>
<div class="mobilebar"><a class="a" href="/contact.html">見学・入園相談</a><a class="b" href="/recruit.html">採用情報</a></div>
</body></html>'''

def spec_table(p):
    rows = [
        ("所在地", f'〒{p["zip"]}<br>{p["addr"]}'),
        ("電話番号", f'<a href="tel:{p["tel"].replace("-","")}">{p["tel"]}</a>'),
        ("対象年齢", p["ages"]),
        ("定員", p["capacity"]),
        ("開園時間", p["hours"]),
        ("アクセス", "<br>".join(p["access"])),
        ("給食", "自園調理" + ("／アレルギー対応食あり" if p is KOMA else "")),
        ("設備・サービス", "自園調理／連絡アプリ（園庭なし／一時保育・延長保育は行っていません）"),
    ]
    if p["extra"]:
        rows.append(("その他", p["extra"]))
    body = "".join(f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows)
    return f'<div class="table-scroll"><table class="spec">{body}</table></div>'

def nursery_ld(p, url):
    return {
        "@context": "https://schema.org", "@type": "ChildCare",
        "name": p["name"], "url": BASE + url, "telephone": p["tel"],
        "parentOrganization": {"@type": "Organization", "name": "トリオキャリア株式会社"},
        "address": {"@type": "PostalAddress", "postalCode": p["zip"], "addressRegion": "東京都",
                    "addressLocality": "世田谷区", "streetAddress": p["addr"].replace("東京都世田谷区", ""),
                    "addressCountry": "JP"},
        "openingHours": ["Mo-Fr 07:30-20:30", "Sa-Su 08:00-17:00"],
        # 検索結果に出る写真。ここも園ごとに変えること（固定にすると別の園の写真が出る）。
        "image": BASE + "/assets/photos/" + p["photo"],
        "areaServed": "東京都世田谷区",
    }

ORG_LD = {
    "@context": "https://schema.org", "@type": "Organization",
    "name": "トリオランド", "url": BASE,
    "parentOrganization": {"@type": "Organization", "name": "トリオキャリア株式会社"},
    "logo": BASE + "/assets/photos/trioland-logo.webp",
    "department": [
        {"@type": "ChildCare", "name": KOMA["name"], "url": BASE + "/komazawa.html", "telephone": KOMA["tel"]},
        {"@type": "ChildCare", "name": UME["name"], "url": BASE + "/umegaoka.html", "telephone": UME["tel"]},
    ],
}

def crumbs(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n,
                                 "item": BASE + u} for i, (n, u) in enumerate(items)]}

def cta(title, text, primary=("/contact.html", "見学・入園相談をする"), second=None):
    s = f'<a class="btn ghost" href="{second[0]}">{second[1]}</a>' if second else ""
    return f'''<section><div class="cta">{trio("trio-cta", "wobble")}<h2>{title}</h2><p>{text}</p>
<div class="actions"><a class="btn" href="{primary[0]}">{primary[1]}</a>{s}</div></div></section>'''

# 問い合わせフォーム。送信先の実アドレスはこのコードに書かない（リポジトリは公開）。
# ブラウザは宛先の記号だけを送り、Worker が Make 経由で該当アドレスへ転送する。
def inquiry_form(mode):
    if mode == "recruit":
        title = "採用へのお問い合わせ"
        lead = "保育士・保育補助のご応募、見学のご希望、働き方のご相談など、どんな内容でも構いません。"
        dest_field = '<input type="hidden" name="destination" value="recruit">'
        extra = """
    <div class="row">
      <div class="field"><label for="f-child">ご経験</label>
        <input id="f-child" name="child" placeholder="例：保育士5年 / ブランクあり / 未経験"></div>
      <div class="field"><label for="f-timing">勤務開始のご希望</label>
        <input id="f-timing" name="timing" placeholder="例：来月から / 相談したい"></div>
    </div>"""
        label = "ご質問・ご相談"
        submit = "この内容で応募・相談する"
    else:
        title = "見学・入園のお問い合わせ"
        lead = "下のフォームからお送りください。ご希望の園に直接届きます。お電話でも承っています。"
        dest_field = f"""<div class="field">
      <label for="f-dest">ご希望の園 <span class="req">必須</span></label>
      <select id="f-dest" name="destination" required>
        <option value="">選択してください</option>
        <option value="komazawa">{KOMA["name"]}（駒沢大学駅 徒歩約6分）</option>
        <option value="umegaoka">{UME["name"]}（梅ヶ丘駅 徒歩約1分）</option>
        <option value="general">まだ決めていない／どちらも見てみたい</option>
      </select>
    </div>"""
        extra = """
    <div class="row">
      <div class="field"><label for="f-child">お子さまの月齢・年齢</label>
        <input id="f-child" name="child" placeholder="例：生後8か月 / 1歳児クラス"></div>
      <div class="field"><label for="f-timing">入園希望時期</label>
        <input id="f-timing" name="timing" placeholder="例：来年度4月 / なるべく早く"></div>
    </div>"""
        label = "ご相談内容"
        submit = "この内容で送信する"

    return f'''
<section id="form">
  <div class="kicker">CONTACT</div>
  <h2>{title}</h2>
  <p class="lead">{lead}</p>
  <form class="inquiry" id="inquiry-form" novalidate>
    {dest_field}
    <div class="field"><label for="f-name">お名前 <span class="req">必須</span></label>
      <input id="f-name" name="name" required autocomplete="name"></div>
    <div class="row">
      <div class="field"><label for="f-email">メールアドレス</label>
        <input id="f-email" name="email" type="email" autocomplete="email" inputmode="email"></div>
      <div class="field"><label for="f-tel">電話番号</label>
        <input id="f-tel" name="tel" type="tel" autocomplete="tel" inputmode="tel"></div>
    </div>
    <p class="hint">メールアドレスと電話番号は、どちらか一方で構いません。</p>{extra}
    <div class="field"><label for="f-message">{label} <span class="req">必須</span></label>
      <textarea id="f-message" name="message" rows="6" required></textarea></div>
    <div class="hp" aria-hidden="true"><label>会社名（入力しないでください）
      <input name="company" tabindex="-1" autocomplete="off"></label></div>
    <button class="btn pink" type="submit">{submit}</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>
</section>
<script>
(function () {{
  var form = document.getElementById("inquiry-form");
  if (!form) return;
  var status = form.querySelector(".form-status");
  var button = form.querySelector("button[type=submit]");
  var MESSAGES = {{
    NAME_REQUIRED: "お名前をご記入ください。",
    CONTACT_REQUIRED: "メールアドレスか電話番号のどちらかをご記入ください。",
    INVALID_EMAIL: "メールアドレスの形式をご確認ください。",
    MESSAGE_REQUIRED: "ご相談内容をご記入ください。",
    INVALID_DESTINATION: "ご希望の園を選択してください。",
    TOO_MANY_REQUESTS: "送信が続いています。しばらく時間をおいてからお試しください。"
  }};
  var FALLBACK = "送信できませんでした。恐れ入りますが、お電話でご連絡ください。"
    + " {KOMA["name"]} {KOMA["tel"]} ／ {UME["name"]} {UME["tel"]}";
  function show(text, kind) {{
    status.textContent = text;
    status.className = "form-status " + kind;
  }}
  form.addEventListener("submit", function (event) {{
    event.preventDefault();
    var data = {{}};
    new FormData(form).forEach(function (value, key) {{ data[key] = value; }});
    button.disabled = true;
    show("送信しています…", "sending");
    fetch("{API}", {{
      method: "POST",
      headers: {{ "content-type": "application/json" }},
      body: JSON.stringify(data)
    }}).then(function (response) {{
      return response.json().then(function (body) {{ return {{ response: response, body: body }}; }});
    }}).then(function (result) {{
      if (result.response.ok && result.body.ok) {{
        form.reset();
        show("送信しました。担当者より折り返しご連絡いたします。", "done");
        return;
      }}
      show(MESSAGES[result.body.error] || FALLBACK, "error");
      button.disabled = false;
    }}).catch(function () {{
      show(FALLBACK, "error");
      button.disabled = false;
    }});
  }});
}})();
</script>'''

PHOTO_NOTE = "映像はトリオランドの実際の園生活の記録です（園の Instagram に投稿した動画から。お顔のぼかしは投稿時のものです）。"

MASCOT_SVG = {
    # まる（黄）: びっくり顔と「！」
    "maru": '''<svg viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
<g class="m-body"><circle cx="0" cy="4" r="46" fill="#f0c26a"/>
<g class="m-eyes"><circle cx="-16" cy="-6" r="9" fill="#fff"/><circle cx="-13.5" cy="-3" r="5" fill="#f0c26a"/><circle cx="16" cy="-6" r="9" fill="#fff"/><circle cx="18.5" cy="-3" r="5" fill="#f0c26a"/></g>
<ellipse cx="2" cy="20" rx="7.5" ry="10" fill="#fff"/></g>
<g class="m-mark" fill="#f0c26a"><path d="M-56 -46 l-3 -16 a4 4 0 0 1 8 -1 l-1 17 a2 2 0 0 1 -4 0z" transform="translate(6 2) rotate(-12 -56 -46)"/><circle cx="-52" cy="-36" r="3.2"/></g></svg>''',
    # しかく（青）: にっこり顔と頭の上のキラキラ
    "shikaku": '''<svg viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
<g class="m-body" transform="rotate(-6)"><rect x="-46" y="-44" width="92" height="90" rx="24" fill="#86c5d7"/>
<g class="m-eyes"><circle cx="-17" cy="-8" r="9" fill="#fff"/><circle cx="-14.5" cy="-5" r="5" fill="#86c5d7"/><circle cx="17" cy="-8" r="9" fill="#fff"/><circle cx="19.5" cy="-5" r="5" fill="#86c5d7"/></g>
<path d="M-14 16 q14 10 28 0 q2 9 -14 11 q-16 -2 -14 -11z" fill="#fff"/></g>
<g class="m-mark" stroke="#86c5d7" stroke-width="5" stroke-linecap="round" fill="none"><path d="M-12 -58 l-2 -11"/><path d="M0 -60 l0 -12"/><path d="M12 -58 l2 -11"/></g></svg>''',
    # さんかく（桃）: 大きな笑顔と「？」
    "sankaku": '''<svg viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
<g class="m-body"><path d="M8 -36 L44 30 L-42 34 Z" fill="#da7499" stroke="#da7499" stroke-width="26" stroke-linejoin="round"/>
<g class="m-eyes"><circle cx="-9" cy="4" r="8.5" fill="#fff"/><circle cx="-6.8" cy="6.8" r="4.8" fill="#da7499"/><circle cx="21" cy="6" r="8.5" fill="#fff"/><circle cx="23.2" cy="8.8" r="4.8" fill="#da7499"/></g>
<path d="M-14 20 Q6 36 26 22 Q22 34 6 34 Q-10 34 -14 20 Z" fill="#fff"/></g>
<g class="m-mark"><path d="M44 -48 a9 9 0 1 1 12 8 q-4 2 -4 7" stroke="#da7499" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="52" cy="-22" r="3.2" fill="#da7499"/></g></svg>''',
}


def mascot(kind, cls=""):
    return f'<span class="mc mc-{kind} {cls}">{MASCOT_SVG[kind]}</span>'


def trio(cls="", anim="dance"):
    return (f'<span class="trio {cls}" aria-hidden="true">'
            f'{mascot("maru", anim + " d1")}{mascot("shikaku", anim + " d2")}{mascot("sankaku", anim + " d3")}</span>')

# トップの自動スライド。映像の中にキャッチコピーを重ねる（2026-10-07 オーナーの指示：「Instagram に上げている動画を流したい。
# 今のキャッチは映像の枠の中に残しつつ、静止画より動画の方がいい」）。
# (動画の名前, aria-label, キャッチ, サブコピー)。動画は .github/workflows/hero-videos.yml が Drive の Instagram 動画から
# 場面を切り出し、コマごとに AI 補正（Real-ESRGAN realesr-general-x4v3）して site/assets/video/<名前>.webm・.mp4（1200x800・音なし）と
# 最初のコマの静止画 <名前>.webp を作る。静止画は読み込み中・動きを減らす設定の人・JavaScript が無いときに出る。
# 顔のぼかしは園が Instagram 投稿のときに入れたもの（外さない）。外観写真は下の「2園」カードで使うので、ここには入れない。
HERO_SLIDES = [
    ("v-dekita", "保育士と一緒にやわらかい積み木を高く積み上げる子どもたち",
     "はじめての「できた！」が、<br>毎日うまれる。", "0・1・2歳の小さな挑戦を、保育士がいちばん近くで見守ります。"),
    ("v-mizu", "タライの水あそびで、おもちゃをすくって遊ぶ子どもたちと保育士",
     "水しぶきも、笑い声も、<br>夏のたからもの。", "季節を感じるあそびを、毎日の保育に取り入れています。"),
    ("v-inochi", "枝にとまったカブトムシに、そっと手をのばす子ども",
     "小さな命に、<br>そっとふれる。", "力を加減しながら、生き物とふれあう時間。"),
    ("v-karada", "保育室で、保育士に支えられながら積み木の上に立つ子ども",
     "雨の日だって、<br>からだを動かそう。", "お散歩に行けない日も、室内で体をたっぷり動かします。"),
    ("v-gohan", "給食の時間、テーブルを囲んで食べる子どもたちと保育士",
     "いただきます！<br>みんなで食べると、おいしいね。", "園内の調理室でつくる給食。食べるペースも一人ひとりに合わせます。"),
    ("v-minna", "やわらかい積み木を運んで遊ぶ子どもたち",
     "みんなで遊ぶと、<br>もっと楽しい。", "お友だちと一緒に、積み木で大きなものをつくります。"),
]


def hero_slider():
    n = len(HERO_SLIDES)
    slides = ""
    for i, (f, alt, catch, sub) in enumerate(HERO_SLIDES):
        slides += f'''
    <div class="hs-slide" role="group" aria-roledescription="slide" aria-label="{i+1} / {n}">
      <video muted playsinline loop preload="none" width="1200" height="800" poster="/assets/video/{f}.webp?v={V}" aria-label="{alt}"><source data-src="/assets/video/{f}.webm?v={V}" type="video/webm"><source data-src="/assets/video/{f}.mp4?v={V}" type="video/mp4"></video>
      <div class="hs-cap"><div class="hs-bubble"><p class="hs-tag">0・1・2さいの まいにち</p><p class="hs-catch">{catch}</p><p class="hs-sub">{sub}</p></div></div>
    </div>'''
    dots = "".join(f'<button class="hs-dot" type="button" aria-label="{i+1}枚目へ" data-go="{i}"></button>' for i in range(n))
    return f'''
<section class="hs" aria-roledescription="carousel" aria-label="トリオランドの園生活">
  <div class="hs-deco" aria-hidden="true">
    <span class="dc m-left">{mascot("maru", "bounce d1")}</span>
    <span class="dc m-right">{mascot("sankaku", "bounce d3")}</span>
    <span class="dc m-top">{mascot("shikaku", "peek-down d2")}</span>
    <span class="dc star s1">★</span><span class="dc star s2">★</span><span class="dc star s3">✦</span>
    <span class="dc cloud cl1"></span><span class="dc cloud cl2"></span>
  </div>
  <div class="hs-stage">{slides}
  </div>
  <div class="hs-bar">
    <button class="hs-prev" type="button" aria-label="前の映像">‹</button>
    <div class="hs-dots">{dots}</div>
    <span class="hs-count"><b>01</b> / {n:02d}</span>
    <button class="hs-next" type="button" aria-label="次の映像">›</button>
    <button class="hs-pause" type="button" aria-label="自動再生を一時停止" aria-pressed="false"><span></span></button>
  </div>
  <p class="hs-note">{PHOTO_NOTE}</p>
  <svg class="wave" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0,40 C180,80 360,0 540,30 C720,60 900,70 1080,35 C1260,0 1350,20 1440,40 L1440,70 L0,70 Z" fill="#fffdf9"/></svg>
</section>
<script>
(function () {{
  var root = document.querySelector(".hs");
  if (!root) return;
  var slides = [].slice.call(root.querySelectorAll(".hs-slide"));
  var dots = [].slice.call(root.querySelectorAll(".hs-dot"));
  var count = root.querySelector(".hs-count b");
  var pauseBtn = root.querySelector(".hs-pause");
  var n = slides.length, cur = 0, timer = null;
  // 2026-10-08 オーナーの指示：「最初から動かしておいて。停止もできるように。停止していても次にスライドしたら再生されている状態から」
  // → 最初から再生する（動きを減らす設定でも自動で止めない）。一時停止ボタンで止められ、前後・点・スワイプで動かしたら再生に戻る。
  var paused = false, shown = -1;
  function setPaused(v) {{
    paused = v;
    pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    pauseBtn.setAttribute("aria-label", paused ? "自動再生を再開" : "自動再生を一時停止");
    root.classList.toggle("paused", paused);
  }}
  function playV(v) {{
    // スマホ（iPhone など）で自動再生させるための決まり：音なし・画面の中で再生（playsinline）
    v.muted = true; v.defaultMuted = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.autoplay = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {{}});
  }}
  function render() {{
    var changed = shown !== cur; shown = cur;
    slides.forEach(function (el, i) {{
      var d = i - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      el.style.setProperty("--d", d);
      el.classList.toggle("is-active", d === 0);
      el.classList.toggle("is-near", Math.abs(d) === 1);
      el.setAttribute("aria-hidden", d === 0 ? "false" : "true");
      // 映像：今のスライドだけ再生し、となりは読み込みだけしておく（通信量を抑える）。一時停止中は止める
      var v = el.querySelector("video");
      if (!v) return;
      if ((d === 0 || Math.abs(d) === 1) && !v.hasAttribute("data-loaded")) {{
        v.setAttribute("data-loaded", "");
        v.preload = d === 0 ? "auto" : "metadata";
        [].forEach.call(v.querySelectorAll("source"), function (s) {{ s.src = s.getAttribute("data-src"); }});
        v.load();
      }}
      if (d === 0) {{
        if (changed) {{ try {{ v.currentTime = 0; }} catch (e) {{}} }}
        if (!paused && !document.hidden) playV(v); else v.pause();
      }} else {{ v.autoplay = false; v.pause(); }}
    }});
    dots.forEach(function (b, i) {{ b.classList.toggle("on", i === cur); b.setAttribute("aria-current", i === cur ? "true" : "false"); }});
    count.textContent = (cur + 1 < 10 ? "0" : "") + (cur + 1);
  }}
  function restart() {{
    clearInterval(timer);
    if (!paused && !document.hidden) timer = setInterval(function () {{ cur = (cur + 1) % n; render(); }}, 5600);
  }}
  // 前後・点・スワイプで動かしたら、一時停止していても再生に戻す
  function go(i) {{ cur = (i + n) % n; if (paused) setPaused(false); render(); restart(); }}
  root.querySelector(".hs-prev").addEventListener("click", function () {{ go(cur - 1); }});
  root.querySelector(".hs-next").addEventListener("click", function () {{ go(cur + 1); }});
  dots.forEach(function (b) {{ b.addEventListener("click", function () {{ go(+b.getAttribute("data-go")); }}); }});
  slides.forEach(function (el, i) {{ el.addEventListener("click", function () {{ if (i !== cur) go(i); }}); }});
  pauseBtn.addEventListener("click", function () {{ setPaused(!paused); render(); restart(); }});
  var x0 = null;
  root.addEventListener("touchstart", function (e) {{ x0 = e.touches[0].clientX; }}, {{ passive: true }});
  root.addEventListener("touchend", function (e) {{
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  }});
  document.addEventListener("visibilitychange", function () {{ render(); restart(); }});
  // 読み込みが終わったら、今のスライドの映像を再生する（読み込み前の play が通らない端末向け）
  slides.forEach(function (el, i) {{
    var v = el.querySelector("video");
    if (v) v.addEventListener("canplay", function () {{ if (i === cur && !paused && !document.hidden && v.paused) playV(v); }});
  }});
  // 省電力モードなどで自動再生が止められた端末：画面のどこかに最初にふれたときに再生する
  function kick() {{
    var v = slides[cur] && slides[cur].querySelector("video");
    if (v && !paused && v.paused) playV(v);
  }}
  ["touchstart", "pointerdown", "scroll"].forEach(function (t) {{ window.addEventListener(t, kick, {{ passive: true, once: true }}); }});
  render(); restart();
}})();
</script>
<div class="marquee" aria-hidden="true"><div class="marquee-in">
  <span>🍼 あそぶ</span><span>🍙 たべる</span><span>😴 ねんね</span><span>😊 わらう</span><span>🎉 できた！</span><span>💛 だいすき</span><span>🌳 おさんぽ</span><span>🎈 えがお</span>
  <span>🍼 あそぶ</span><span>🍙 たべる</span><span>😴 ねんね</span><span>😊 わらう</span><span>🎉 できた！</span><span>💛 だいすき</span><span>🌳 おさんぽ</span><span>🎈 えがお</span>
</div></div>'''

# =================================================================== ページ
def page_index():
    ld = [ORG_LD, {
        "@context": "https://schema.org", "@type": "WebSite", "name": "トリオランド",
        "url": BASE, "inLanguage": "ja"}]
    return head(
        "トリオランド｜世田谷区の企業主導型保育園（駒沢大学園・梅ヶ丘園）｜0〜2歳児 園児募集中",
        "東京都世田谷区の企業主導型保育園トリオランド。駒沢大学駅・三軒茶屋駅の駒沢大学園と、梅ヶ丘駅すぐの梅ヶ丘園。生後57日目〜2歳児クラス、自園調理・7:30〜20:30開園。園見学・入園相談、保育士／保育補助の求人も受付中です。",
        "/", ld) + nav("/") + f'''
<main>
{hero_slider()}
<div class="wrap">

<section class="hero single home-intro">
  <div>
    {trio("trio-lg")}
    <span class="badge">東京都世田谷区／企業主導型保育園</span>
    <h1><span class="num n0">0</span><span class="dot">・</span><span class="num n1">1</span><span class="dot">・</span><span class="num n2">2</span>歳の「やってみたい」を、<br>いちばん近くで見守る保育園。</h1>
    <p class="lead">トリオランドは、世田谷区で<b>駒沢大学園</b>と<b>梅ヶ丘園</b>の2園を運営する企業主導型保育園です。生後57日目から2歳児クラスまで、少人数だからこそできる一人ひとりに合わせた保育で、子どもの毎日の「できた」を積み重ねます。</p>
    <div class="actions">
      <a class="btn pink" href="/contact.html">園見学・入園相談（受付中）</a>
      <a class="btn outline" href="/recruit.html">保育士・保育補助の採用情報</a>
    </div>
  </div>
</section>

<section class="tight">
  <div class="kicker">OUR NURSERIES</div>
  <h2>世田谷区のトリオランド2園</h2>
  <p class="lead">どちらの園も生後57日目〜2歳児クラス、平日7:30〜20:30開園です。ご自宅・勤務先からの通いやすさでお選びいただけます。</p>
  <div class="branch-grid">
    <div class="branch">
      {mascot("maru", "peek")}
      <img src="/assets/photos/komazawa-exterior.webp?v={V}" width="1080" height="720" alt="トリオランド駒沢大学園の園舎外観。通りに面した明るい入口と「トリオランド こまざわ保育園」の看板" fetchpriority="high" decoding="async">
      <div class="content">
      <h3>{KOMA["name"]}</h3>
      <div class="meta">駒沢大学駅 徒歩約6分／三軒茶屋駅 徒歩約14分</div>
      <p>世田谷区野沢2丁目。駒沢大学・三軒茶屋エリアからお通いいただける園です。</p>
      <ul>
        <li>定員 {KOMA["capacity"]}</li>
        <li>{KOMA["ages"]}</li>
        <li>365日開園・土日祝もOK</li>
        <li>管理栄養士監修の自園調理／アレルギー対応食あり</li>
        <li>入園料 0円／給食費は会費に含まれます</li>
      </ul>
      <div class="btnrow">
        <a class="btn outline sm" href="/komazawa.html">園の詳細を見る</a>
        <a class="btn pink sm" href="/contact.html">見学を申し込む</a>
      </div>
    </div></div>
    <div class="branch">
      {mascot("sankaku", "peek")}
      <img src="/assets/photos/umegaoka-exterior.webp?v={V}" width="1080" height="720" alt="トリオランド梅ヶ丘園の園舎外観。梅ヶ丘駅すぐの通りに面した入口と「トリオランド 梅ヶ丘園」の看板" fetchpriority="high" decoding="async">
      <div class="content">
      <h3>{UME["name"]}</h3>
      <div class="meta">小田急線 梅ヶ丘駅 徒歩約1分</div>
      <p>世田谷区梅丘1丁目。駅から約90m、雨の日や送迎の負担が少ない立地です。</p>
      <ul>
        <li>定員 {UME["capacity"]}</li>
        <li>{UME["ages"]}</li>
        <li>自園調理／季節のイベントを実施</li>
        <li>山下駅・東松原駅からも徒歩圏</li>
      </ul>
      <div class="btnrow">
        <a class="btn outline sm" href="/umegaoka.html">園の詳細を見る</a>
        <a class="btn pink sm" href="/contact.html">見学を申し込む</a>
      </div>
    </div></div>
  </div>
</section>

<section class="tight">
  <div class="quick">
    <div><b>世田谷区に2園</b>野沢（駒沢大学駅）／梅丘（梅ヶ丘駅）</div>
    <div><b>生後57日目〜2歳児</b>乳児期に特化した少人数保育</div>
    <div><b>7:30〜20:30 開園</b>土・日・祝も 8:00〜17:00 開園</div>
    <div><b>自園調理の給食</b>園内のキッチンで毎日調理</div>
  </div>
</section>

<section>
  <div class="kicker">ABOUT TRIOLAND</div>
  <h2>「楽しむ」を真ん中に置いた、子ども主体の保育。</h2>
  <div class="split">
    <div class="prose">
      <p>0〜2歳は、歩く・話す・食べる・眠る・人と関わるといった生活のすべてが、そのまま成長につながる時期です。トリオランドでは、大人が先回りしてすべてを決めるのではなく、子どもが「何を見つけたのか」「何をやってみたいのか」を丁寧に見取ることから保育をはじめます。</p>
      <p>散歩、室内あそび、食事、季節の生き物とのふれあい。何気ない一日の中で生まれる「見つけた」「触ってみたい」「もう一回やりたい」を大切にし、その気持ちが続くように環境と声のかけ方を工夫しています。</p>
      <p>定員19名・20名という規模だからこそ、担任だけでなく園全体で一人ひとりの育ちを共有できます。はじめて園に預ける保護者の方にも、その日の様子を具体的にお伝えできることを大切にしています。</p>
    </div>
    <div class="facts">
      <div><b>保育の考え方</b>子どもの主体性を引き出す関わりを基盤にしています</div>
      <div><b>専門職との連携</b>理学療法士による勉強会を定期的に実施し、発達運動学的な視点を保育に取り入れています</div>
      <div><b>少人数だからできること</b>担任以外の職員も含め、園全体で一人ひとりの育ちを把握します</div>
      <div><b>ご家庭との共有</b>連絡アプリで日々の様子をお伝えします</div>
    </div>
  </div>
</section>

<section class="soft">
  <div class="kicker">DAILY LIFE</div>
  <h2>毎日が、ちいさな発見でいっぱい。</h2>
  <p class="lead">お散歩、給食、水あそび、制作。0・1・2歳の毎日は、「はじめて」と「できた！」の連続です。保育士も一緒に笑いながら、子どもたちの毎日を見守っています。</p>
  <div class="fun-grid">
    <div class="fun c1">{mascot("maru", "fun-m wobble d1")}<span class="fun-ico">🌳</span><b>お散歩・外あそび</b><p>天気の良い日は近くの公園へ。思いきり体を動かします。</p></div>
    <div class="fun c2">{mascot("shikaku", "fun-m wobble d2")}<span class="fun-ico">🍙</span><b>自園調理の給食</b><p>両園とも園内のキッチンで調理。食べる量やペースも一人ひとりに合わせます。</p></div>
    <div class="fun c3">{mascot("sankaku", "fun-m wobble d3")}<span class="fun-ico">💦</span><b>季節のあそび</b><p>夏は水あそび。季節を感じるあそびを保育に取り入れています。</p></div>
    <div class="fun c4">{mascot("maru", "fun-m wobble d2")}<span class="fun-ico">🎨</span><b>制作あそび</b><p>のり・シール・クレヨン。指先をたくさん使って「つくる」を楽しみます。</p></div>
  </div>
</section>

<section>
  <div class="kicker">A DAY AT TRIOLAND</div>
  <h2>一日の流れ（例）</h2>
  <p class="lead">月齢・発達に応じて、一人ひとりの生活リズムに合わせて調整します。</p>
  <div class="flow">
    <div><time>7:30〜</time><b>順次登園</b><p>健康観察をしながらお預かりします。その日の体調やご家庭での様子をうかがいます。</p></div>
    <div><time>9:30〜</time><b>あそび・お散歩</b><p>天気の良い日は近隣の公園へ。室内では体を動かすあそびや手先を使うあそびを。</p></div>
    <div><time>11:00〜</time><b>給食・午睡</b><p>自園調理の給食。食べる量やペースも一人ひとりに合わせます。</p></div>
    <div><time>15:00〜</time><b>おやつ・順次降園</b><p>その日の様子をお伝えします。18:30以降は事前のご相談で対応します。</p></div>
  </div>
</section>

<section class="blue">
  <div class="kicker">ADMISSION</div>
  <h2>園児募集について</h2>
  <div class="prose" style="max-width:900px">
      <p>トリオランドは企業主導型保育事業を実施する保育園です。提携企業にお勤めの方（従業員枠）だけでなく、お住まいの地域から通われる方（地域枠）もご利用いただけます。</p>
      <p>企業主導型保育園は、認可保育園のように自治体を通した申込みではなく、<b>園へ直接お申し込みいただく</b>のが基本です。年度途中の入園についてもご相談いただけます。</p>
      <p>空き状況は月齢・クラスによって変わります。まずはご希望の園と入園希望時期をお知らせください。</p>
  </div>
  <div class="steps">
      <div><b>お問い合わせ</b><p>フォームまたはお電話で、ご希望の園と入園希望時期をお知らせください。</p></div>
      <div><b>園見学</b><p>保育室の環境や子どもたちの様子を実際にご覧いただきます。</p></div>
      <div><b>ご相談・お申し込み</b><p>空き状況を確認し、必要な書類をご案内します。</p></div>
      <div><b>入園</b><p>慣らし保育の期間や進め方は、お子さまの様子に合わせて相談します。</p></div>
  </div>
</section>

<section>
  <div class="kicker">RECRUIT</div>
  <h2>保育士・保育補助を募集しています</h2>
  <div class="split">
    <div class="prose">
      <p>トリオランドでは、子どもの「やってみたい」を一緒に楽しめる仲間を探しています。0〜2歳の少人数保育なので、一人ひとりの育ちにじっくり関われる環境です。</p>
      <p><b>保育士</b>は保育士・看護師・准看護師の資格をお持ちの方が対象です。ブランクのある方、経験の浅い方もご相談ください。<b>保育補助</b>は無資格・未経験の方も対象です。</p>
      <p>応募前の園見学も受け付けています。求人票の条件だけでは分からない園の雰囲気を、ぜひ確かめにいらしてください。</p>
      <div class="actions">
        <a class="btn navy" href="/recruit.html">採用情報を詳しく見る</a>
        <a class="btn outline" href="/recruit/">職種・エリア別の求人ガイド</a>
      </div>
    </div>
    <div class="cards two" style="margin-top:0">
      <div class="card"><span class="num">保</span><h3>保育士</h3><p>保育士・看護師・准看護師の資格をお持ちの方。0〜2歳児の保育を担当します。</p></div>
      <div class="card"><span class="num">補</span><h3>保育補助</h3><p>無資格・未経験の方も対象。子育て経験を活かして働く方も歓迎しています。</p></div>
    </div>
  </div>
</section>

<section class="mintbox">
  <div class="kicker">LOCAL GUIDE</div>
  <h2>世田谷区・駒沢大学・三軒茶屋・梅ヶ丘で保育園をお探しの方へ</h2>
  <div class="prose">
    <p>トリオランドは、世田谷区野沢の<b>駒沢大学園</b>と、世田谷区梅丘の<b>梅ヶ丘園</b>を運営しています。駒沢大学園は東急田園都市線 駒沢大学駅から徒歩約6分、三軒茶屋駅からも徒歩圏内。梅ヶ丘園は小田急線 梅ヶ丘駅から徒歩約1分で、山下駅・東松原駅からも通えます。</p>
    <p>「駒沢大学駅の保育園」「三軒茶屋の保育園」「梅ヶ丘の保育園」「世田谷区の0歳児保育」「企業主導型保育園」といった条件でお探しの方に向けて、所在地・対象年齢・開園時間・保育方針が一目で分かるようページを整理しています。認可保育園の申込みと並行して検討される方も、まずはお気軽にご相談ください。</p>
  </div>
</section>

{cta("写真だけでは伝わらない園の空気を、見に来ませんか。",
     "保育室の環境、子どもたちの表情、職員の声のかけ方。園見学でしか分からないことがあります。ご希望の園と時期をお知らせください。",
     ("/contact.html","見学・入園相談をする"), ("/recruit.html","採用をご検討の方はこちら"))}

</div>
</main>
''' + footer()


def page_nursery(p, path, kicker, h1, intro, features, local_text, active):
    ld = [nursery_ld(p, path), crumbs([("トリオランド", "/"), (p["name"], path)])]
    feat = "".join(f'<div class="card"><span class="num">{i+1}</span><h3>{t}</h3><p>{d}</p></div>'
                   for i, (t, d) in enumerate(features))
    return head(
        f'{p["name"]}｜{kicker}',
        intro[:150],
        path, ld, og_image=p["photo"]) + nav(active) + f'''
<main>
<div class="wrap">

<section class="hero single">
  <div>
    <span class="badge">世田谷区／企業主導型保育園</span>
    <h1>{h1}</h1>
    <p class="lead">{intro}</p>
    <div class="actions">
      <a class="btn pink" href="/contact.html">この園の見学を申し込む</a>
      <a class="btn outline" href="tel:{p["tel"].replace("-","")}">電話でご相談（{p["tel"]}）</a>
    </div>
  </div>
</section>

<figure class="exterior">
  <img src="/assets/photos/{p["photo"]}?v={V}" width="1080" height="720" alt="{p["photo_alt"]}" fetchpriority="high" decoding="async">
  <figcaption>{p["name"]}の園舎外観（〒{p["zip"]} {p["addr"]}）</figcaption>
</figure>

<section class="tight">
  <div class="kicker">FACILITY</div>
  <h2>園の基本情報</h2>
  {spec_table(p)}
</section>

<section>
  <div class="kicker">FEATURES</div>
  <h2>{p["name"]}の特徴</h2>
  <div class="cards">{feat}</div>
</section>

<section class="soft">
  <div class="kicker">A DAY</div>
  <h2>一日の流れ（例）</h2>
  <div class="flow">
    <div><time>7:30〜</time><b>順次登園</b><p>健康観察をしながらお預かりします。ご家庭での様子もうかがいます。</p></div>
    <div><time>9:30〜</time><b>あそび・お散歩</b><p>天気の良い日は近隣の公園へ。室内では体を動かすあそびを中心に。</p></div>
    <div><time>11:00〜</time><b>給食・午睡</b><p>自園調理の給食。量やペースは一人ひとりに合わせます。</p></div>
    <div><time>15:00〜</time><b>おやつ・順次降園</b><p>その日の様子をお伝えします。お迎えは20:30までにお願いします。</p></div>
  </div>
</section>

<section>
  <div class="kicker">ACCESS</div>
  <h2>アクセス</h2>
  <div class="split">
    <div class="prose">
      <p>{local_text}</p>
      <p><b>住所：</b>〒{p["zip"]} {p["addr"]}<br><b>電話：</b><a href="tel:{p["tel"].replace("-","")}">{p["tel"]}</a></p>
    </div>
    <div class="facts">
      {"".join(f"<div><b>最寄り駅{i+1}</b>{a}</div>" for i, a in enumerate(p["access"]))}
      <div><b>開園時間</b>{p["hours"]}</div>
    </div>
  </div>
</section>

<section class="blue">
  <div class="kicker">ADMISSION &amp; RECRUIT</div>
  <h2>園児募集・採用について</h2>
  <div class="split">
    <div class="prose">
      <p><b>園児募集：</b>企業主導型保育園のため、自治体を通さず園へ直接お申し込みいただけます。地域枠でのご利用も可能です。空き状況はクラス・月齢により変わりますので、まずはお問い合わせください。</p>
      <div class="actions"><a class="btn pink" href="/contact.html">入園について相談する</a></div>
    </div>
    <div class="prose">
      <p><b>採用：</b>{p["name"]}でも保育士・保育補助を募集しています。0〜2歳児の少人数保育に関心のある方、応募前に園を見てみたい方もご相談ください。</p>
      <div class="actions"><a class="btn navy" href="/recruit.html">採用情報を見る</a></div>
    </div>
  </div>
</section>

<section class="tight">
  <div class="notice"><strong>もう一方の園もご検討いただけます。</strong><br>
  {"梅ヶ丘駅から徒歩約1分の" if p is KOMA else "駒沢大学駅・三軒茶屋駅からお通いいただける"}
  <a href="{"/umegaoka.html" if p is KOMA else "/komazawa.html"}">{UME["name"] if p is KOMA else KOMA["name"]}</a>
  も、同じ保育方針・同じ開園時間で運営しています。通いやすさに合わせてお選びください。</div>
</section>

{cta(f"{p['name']}を、実際に見てみませんか。",
     "保育室の環境や子どもたちの過ごし方は、見学がいちばん分かりやすくお伝えできます。ご希望の日程をお知らせください。")}

</div>
</main>
''' + footer()


def page_contact():
    ld = [crumbs([("トリオランド", "/"), ("見学・入園相談", "/contact.html")])]
    return head(
        "見学・入園相談｜トリオランド駒沢大学園・梅ヶ丘園（世田谷区の企業主導型保育園）",
        "世田谷区の企業主導型保育園トリオランドの園見学・入園相談の窓口。駒沢大学園（駒沢大学駅 徒歩約6分）と梅ヶ丘園（梅ヶ丘駅 徒歩約1分）。0〜2歳児クラスの空き状況もお問い合わせください。",
        "/contact.html", ld) + nav("/contact.html") + f'''
<main>
<div class="wrap">

<section class="hero">
  <div>
    <span class="badge">見学・入園相談 受付中</span>
    <h1>まずは、園の空気を<br>見に来てください。</h1>
    <p class="lead">写真や文章でも園の日常はお伝えしていますが、保育室の広さ、子どもへの声のかけ方、職員同士の雰囲気は、実際に見ていただくのがいちばんです。お子さまと一緒のご見学も歓迎しています。</p>
    <div class="actions">
      <a class="btn pink" href="#form">お問い合わせフォームへ</a>
      <a class="btn outline" href="tel:{KOMA["tel"].replace("-","")}">駒沢大学園 {KOMA["tel"]}</a>
      <a class="btn outline" href="tel:{UME["tel"].replace("-","")}">梅ヶ丘園 {UME["tel"]}</a>
    </div>
  </div>
  <div class="hero-media"><figure>
    <img src="/assets/photos/life-summer.webp?v={V}" width="1600" height="781" alt="水をはったタライでボールなどを使って水あそびをする子どもたち" loading="lazy" decoding="async">
    <figcaption>園での過ごし方も、見学でご案内します</figcaption>
  </figure></div>
</section>

<section>
  <div class="kicker">FLOW</div>
  <h2>見学から入園までの流れ</h2>
  <div class="steps">
    <div><b>お問い合わせ</b><p>フォームまたはお電話で、ご希望の園・入園希望時期・お子さまの月齢をお知らせください。</p></div>
    <div><b>日程調整</b><p>園の生活リズムに合わせて、ご案内しやすい時間帯をご相談します。</p></div>
    <div><b>園見学</b><p>保育室や子どもたちの様子をご覧いただき、その場でご質問にお答えします。</p></div>
    <div><b>ご相談・お申し込み</b><p>空き状況を確認のうえ、必要な手続きをご案内します。</p></div>
  </div>
</section>

{inquiry_form("visit")}

<section class="soft">
  <div class="kicker">BEFORE YOU VISIT</div>
  <h2>お問い合わせのときに、教えていただけると助かること</h2>
  <div class="cards">
    <div class="card"><span class="num">1</span><h3>ご希望の園</h3><p>駒沢大学園／梅ヶ丘園のどちらか、または両方をご検討中かをお知らせください。</p></div>
    <div class="card"><span class="num">2</span><h3>入園希望時期</h3><p>「来月から」「来年度4月から」など、おおよその時期で構いません。</p></div>
    <div class="card"><span class="num">3</span><h3>お子さまの月齢</h3><p>クラスによって空き状況が異なるため、月齢が分かるとご案内がスムーズです。</p></div>
  </div>
</section>

<section>
  <h2>見学を検討している園を確認する</h2>
  <div class="branch-grid">
    <div class="branch"><div class="content">
      <h3>{KOMA["name"]}</h3>
      <div class="meta">駒沢大学駅 徒歩約6分／三軒茶屋駅 徒歩約14分</div>
      <p>〒{KOMA["zip"]}<br>{KOMA["addr"]}<br>TEL <a href="tel:{KOMA["tel"].replace("-","")}">{KOMA["tel"]}</a></p>
      <ul><li>定員 {KOMA["capacity"]}</li><li>{KOMA["hours"]}</li></ul>
      <div class="btnrow"><a class="btn outline sm" href="/komazawa.html">園情報を見る</a></div>
    </div></div>
    <div class="branch"><div class="content">
      <h3>{UME["name"]}</h3>
      <div class="meta">小田急線 梅ヶ丘駅 徒歩約1分</div>
      <p>〒{UME["zip"]}<br>{UME["addr"]}<br>TEL <a href="tel:{UME["tel"].replace("-","")}">{UME["tel"]}</a></p>
      <ul><li>定員 {UME["capacity"]}</li><li>{UME["hours"]}</li></ul>
      <div class="btnrow"><a class="btn outline sm" href="/umegaoka.html">園情報を見る</a></div>
    </div></div>
  </div>
</section>

<section class="tight">
  <div class="notice"><strong>採用（保育士・保育補助）についてのお問い合わせも受け付けています。</strong><br>
  応募前の園見学も可能です。<a href="/recruit.html">採用情報のページ</a>もあわせてご覧ください。</div>
</section>

</div>
</main>
''' + footer()


# 動画の小窓（採用ページなど）。見えている間だけ再生する。動画は hero-videos.yml が作ったもの（AI 補正済み）
def clip(name, alt, cls=""):
    return (f'<video class="clip {cls}" muted playsinline loop autoplay preload="metadata" width="1200" height="800" '
            f'poster="/assets/video/{name}.webp?v={V}" aria-label="{alt}">'
            f'<source src="/assets/video/{name}.webm?v={V}" type="video/webm">'
            f'<source src="/assets/video/{name}.mp4?v={V}" type="video/mp4"></video>')


CLIP_JS = """
<script>
(function () {
  var vs = [].slice.call(document.querySelectorAll("video.clip"));
  function play(v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  if (!("IntersectionObserver" in window)) { vs.forEach(play); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
  }, { threshold: 0.25 });
  vs.forEach(function (v) { io.observe(v); });
  ["touchstart", "pointerdown", "scroll"].forEach(function (t) {
    window.addEventListener(t, function () { vs.forEach(function (v) { var r = v.getBoundingClientRect(); if (v.paused && r.bottom > 0 && r.top < innerHeight) play(v); }); }, { passive: true, once: true });
  });
})();
</script>"""


# 採用ページ（2026-10-09 オーナーの指示：「トリオキャリアの HP の PA 賃金が最低賃金を下回ったままだから、採用ページはリンクしないで良い。
# 現在の正しい賃金を採用ページに掲載して。楽しい雰囲気などは全面に出してね」）。
# → トリオキャリア HP の採用ページ（RECRUIT_URL）へのリンクはすべて外した。応募はこのページのフォームと園見学で受ける。
# 賃金はオーナーから受け取った数字だけを JOBS に書く（推測で書かない）。
def page_recruit():
    ld = [crumbs([("トリオランド", "/"), ("採用情報", "/recruit.html")])]
    return head(
        "採用情報｜世田谷区の保育士・保育補助求人｜トリオランド（駒沢大学・梅ヶ丘）",
        "世田谷区の企業主導型保育園トリオランドの保育士・保育補助の採用情報。駒沢大学園・梅ヶ丘園で0〜2歳児の少人数保育。無資格・未経験から始める保育補助、ブランクのある保育士の方もご相談ください。応募前の園見学も受付中。",
        "/recruit.html", ld, og_image="life-play.webp") + nav("/recruit.html") + f'''
<main class="rc">
<div class="wrap">

<section class="hero rc-hero">
  <div>
    <span class="badge rc-badge">🎉 保育士・保育補助 募集中</span>
    <h1>子どもの「やってみたい」を、<br><span class="rc-hl">一緒に楽しめる人</span>へ。</h1>
    <p class="lead">トリオランドは世田谷区で2園を運営する、0〜2歳児の少人数の保育園です。積み木を高く積んで、水あそびで笑って、カブトムシにそっとふれて。子どもたちの「はじめて」と「できた！」に、毎日いちばん近くで立ち会える仕事です。</p>
    <div class="actions">
      <a class="btn pink" href="#form">応募・相談フォームへ</a>
      <a class="btn outline" href="/contact.html">まずは園見学から相談する</a>
    </div>
  </div>
  <div class="rc-stage">
    {trio("rc-trio")}
    <div class="rc-video">{clip("v-karada", "保育室で、保育士に支えられながら積み木の上に立つ子ども")}</div>
    <span class="rc-sticker">一緒に<br>あそぼう！</span>
  </div>
</section>
</div>

<div class="marquee rc-marquee" aria-hidden="true"><div class="marquee-in">
  <span>🧸 一緒にあそぶ</span><span>🍙 一緒に食べる</span><span>😊 一緒にわらう</span><span>🎉 「できた！」を喜ぶ</span><span>🌱 0・1・2歳の育ちを見守る</span>
  <span>🧸 一緒にあそぶ</span><span>🍙 一緒に食べる</span><span>😊 一緒にわらう</span><span>🎉 「できた！」を喜ぶ</span><span>🌱 0・1・2歳の育ちを見守る</span>
</div></div>

<div class="wrap">
<section>
  <div class="kicker">OUR DAYS</div>
  <h2>トリオランドの毎日を、映像で。</h2>
  <p class="lead">園の Instagram に投稿している、実際の園生活の一場面です（お顔のぼかしは投稿時のものです）。</p>
  <div class="vid-strip">
    <figure class="pola p1">{clip("v-mizu", "タライの水あそびで、おもちゃをすくって遊ぶ子どもたちと保育士")}<figcaption>💦 夏は水あそび</figcaption></figure>
    <figure class="pola p2">{clip("v-inochi", "枝にとまったカブトムシに、そっと手をのばす子ども")}<figcaption>🪲 生き物とふれあう</figcaption></figure>
    <figure class="pola p3">{clip("v-gohan", "給食の時間、テーブルを囲んで食べる子どもたちと保育士")}<figcaption>🍙 みんなで給食</figcaption></figure>
  </div>
</section>

<section class="soft">
  <div class="kicker">WHY TRIOLAND</div>
  <h2>ここが楽しい！トリオランドで働く4つのこと</h2>
  <div class="fun-grid">
    <div class="fun c1">{mascot("maru", "fun-m wobble d1")}<span class="fun-ico">👶</span><b>0〜2歳に、じっくり</b><p>定員19名・20名の少人数。担任だけで抱え込まず、園全体で一人ひとりの育ちを共有します。</p></div>
    <div class="fun c2">{mascot("shikaku", "fun-m wobble d2")}<span class="fun-ico">🧠</span><b>専門職から学べる</b><p>理学療法士による勉強会を定期的に実施。からだの発達の視点を、毎日の保育に生かせます。</p></div>
    <div class="fun c3">{mascot("sankaku", "fun-m wobble d3")}<span class="fun-ico">🧸</span><b>子どもと本気であそぶ</b><p>決められた活動をこなすのではなく、子どもの「やってみたい」から保育をつくります。</p></div>
    <div class="fun c4">{mascot("maru", "fun-m wobble d2")}<span class="fun-ico">🚃</span><b>通いやすい2園</b><p>駒沢大学駅 徒歩約6分・梅ヶ丘駅 徒歩約1分。通いやすい園を選べます。</p></div>
  </div>
</section>

<section id="jobs">
  <div class="kicker">OPEN ROLES</div>
  <h2>募集職種</h2>
  <p class="lead">応募の前の園見学も歓迎しています。条件のご相談は、下のフォームからお気軽にどうぞ。</p>
  <div class="branch-grid">
    <div class="branch"><div class="content">
      <h3>保育士</h3>
      <div class="meta">資格をお持ちの方</div>
      <p>0〜2歳児クラスの保育を担当していただきます。少人数のため、担任だけで抱え込まず園全体で子どもの育ちを共有できる体制です。</p>
      <ul>
        <li>対象資格：保育士／看護師／准看護師</li>
        <li>月給 310,500円 〜（月1シフト制・月公休10日）</li>
        <li>『未経験』『ブランク有り』でも意欲があれば歓迎</li>
        <li>研修制度あり。安心して始められます</li>
        <li>勤務地：駒沢大学園（世田谷区野沢）／梅ヶ丘園（世田谷区梅丘）</li>
      </ul>
      <div class="btnrow"><a class="btn pink sm" href="#form">応募・相談する</a><a class="btn outline sm" href="/contact.html">園見学を申し込む</a></div>
    </div></div>
    <div class="branch"><div class="content">
      <h3>保育補助</h3>
      <div class="meta">無資格・未経験の方も対象</div>
      <p>保育士と一緒に、子どもたちの生活とあそびをサポートしていただくお仕事です。保育の現場がはじめての方も、少人数の環境から始められます。</p>
      <ul>
        <li>無資格・未経験の方も応募できます</li>
        <li>幼稚園教諭／子育て支援員／ベビーシッター経験者を歓迎</li>
        <li>子育て経験のある方も歓迎</li>
        <li>勤務地：駒沢大学園（世田谷区野沢）／梅ヶ丘園（世田谷区梅丘）</li>
      </ul>
      <div class="btnrow"><a class="btn pink sm" href="#form">応募・相談する</a><a class="btn outline sm" href="/contact.html">園見学を申し込む</a></div>
    </div></div>
  </div>
</section>

<section class="soft">
  <div class="kicker">WORKPLACE</div>
  <h2>働く場所について</h2>
  <div class="table-scroll"><table class="spec">
    <tr><th>勤務地</th><td>
      {KOMA["name"]}（〒{KOMA["zip"]} {KOMA["addr"]}）<br>
      {KOMA["access"][0]}／{KOMA["access"][1]}<br><br>
      {UME["name"]}（〒{UME["zip"]} {UME["addr"]}）<br>
      {UME["access"][0]}／{UME["access"][1]}
    </td></tr>
    <tr><th>園の規模</th><td>駒沢大学園 定員{KOMA["capacity"]}／梅ヶ丘園 定員{UME["capacity"]}</td></tr>
    <tr><th>対象年齢</th><td>生後57日目〜2歳児クラス（乳児保育に特化した園です）</td></tr>
    <tr><th>給与（保育士）</th><td>月給 310,500円 〜<br>※駒沢大学園の公式Instagram採用投稿（2026年7月）で案内されていた金額です。</td></tr>
    <tr><th>シフト・休日</th><td>月1シフト制（月公休10日）</td></tr>
    <tr><th>歓迎する方</th><td>『未経験』『ブランク有り』でも意欲があれば歓迎です。研修制度があり、安心して始められる体制です。</td></tr>
    <tr><th>開園時間</th><td>平日 7:30〜20:30／土・日・祝 8:00〜17:00<br>※実際のシフト・勤務時間は面接・見学の際にご説明します</td></tr>
    <tr><th>園の設備</th><td>自園調理／連絡アプリ導入（園庭なし）</td></tr>
    <tr><th>学びの機会</th><td>理学療法士による勉強会を定期的に実施しています</td></tr>
    <tr><th>雇用形態・その他の待遇</th><td>面接・見学の際にご説明します。ご質問は<a href="#form">応募・相談フォーム</a>からどうぞ。</td></tr>
  </table></div>
</section>

<section>
  <div class="split">
    <div>
      <div class="kicker">CAREER GUIDE</div>
      <h2>職種・エリア別の求人ガイド</h2>
      <p class="lead">「世田谷区で探している」「保育補助から始めたい」「乳児保育に関わりたい」など、条件ごとに確認したいポイントをまとめています。</p>
      <div class="actions"><a class="btn navy" href="/recruit/">求人ガイド一覧を見る</a><a class="btn outline" href="/column.html">保育士求人コラム</a></div>
    </div>
    <div class="imgcol">
      <img class="portrait" src="/assets/photos/life-water.webp?v={V}" width="1400" height="1867" alt="タライのそばに立って水あそびに夢中になっている子ども" loading="lazy" decoding="async">
    </div>
  </div>
</section>

<section class="tight">
  <div class="notice"><strong>掲載内容についてのご注意</strong><br>
  募集職種・勤務時間・待遇などは時期により変わることがあります。このページでは、確認できていない条件を推測して掲載していません。くわしい条件は、面接・見学の際にご説明します。</div>
</section>

{inquiry_form("recruit")}

{cta("応募の前に、園の雰囲気を見てみませんか。",
     "実際の保育の様子、子どもたちとの距離感、職員同士の関わり方。見学してから判断していただいて大丈夫です。",
     ("/contact.html","園見学・採用相談を申し込む"), ("#form","応募・相談フォームへ"))}

</div>
</main>
{CLIP_JS}
''' + footer()


FAQS = [
    ("トリオランドはどこにありますか？",
     f'東京都世田谷区に2園あります。<b>{KOMA["name"]}</b>は世田谷区野沢2-33-5（駒沢大学駅 徒歩約6分／三軒茶屋駅 徒歩約14分）、<b>{UME["name"]}</b>は世田谷区梅丘1-21-9（小田急線 梅ヶ丘駅 徒歩約1分）です。'),
    ("何歳から預けられますか？",
     "両園とも生後57日目（生後2か月）から2歳児クラスまでのお子さまをお預かりしています。0〜2歳の乳児保育に特化した園です。"),
    ("開園時間と開園日を教えてください。",
     "平日は7:30〜20:30、土曜・日曜・祝日は8:00〜17:00です。駒沢大学園では18:30以降のお預かりは事前のご相談が必要です。"),
    ("土日祝も預けられますか？",
     "駒沢大学園は365日開園・土日祝もOKと案内されています。ご利用の条件や空き状況は園までお問い合わせください。"),
    ("毎日の持ち物は多いですか？",
     "おむつ・着替えなどの持ち物は保護者の方にご持参いただいています。必要なものの一覧は見学時にご案内します。"),
    ("認可保育園とどう違いますか？",
     "トリオランドは企業主導型保育事業を実施する保育園です。認可保育園のように自治体を通して申し込むのではなく、<b>園へ直接お申し込みいただく</b>のが基本です。提携企業の従業員枠だけでなく、地域枠でのご利用もいただけます。"),
    ("年度の途中でも入園できますか？",
     "空きがあれば年度途中の入園もご相談いただけます。空き状況はクラス・月齢によって変わりますので、ご希望の園と入園希望時期をお知らせのうえお問い合わせください。"),
    ("給食はありますか？アレルギー対応は？",
     "両園とも自園調理の給食を提供しています。駒沢大学園では管理栄養士監修・旬の食材を使った給食、アレルギー対応食にも対応していると案内されています。詳しいご相談は園までお問い合わせください。"),
    ("延長保育や一時保育はありますか？",
     "延長保育・一時保育は行っていません。開園時間は平日 7:30〜20:30、土・日・祝 8:00〜17:00です。"),
    ("園庭はありますか？",
     "園庭はありません。天気の良い日は近隣の公園へお散歩に出かけ、室内でも体をたっぷり動かすあそびを取り入れています。"),
    ("入園料や給食費はかかりますか？",
     "駒沢大学園については、入園料0円・給食費は会費に含まれると案内されています。梅ヶ丘園の費用については園までお問い合わせください。"),
    ("園見学はできますか？",
     '見学を受け付けています。<a href="/contact.html">見学・入園相談のページ</a>から、ご希望の園・入園希望時期・お子さまの月齢をお知らせください。お子さまと一緒のご見学も歓迎しています。'),
    ("保育士・保育補助の求人はありますか？",
     '保育士・保育補助を募集しています。保育補助は無資格・未経験の方も対象です。詳しくは<a href="/recruit.html">採用情報のページ</a>をご覧ください。応募前の園見学も可能です。'),
]


def page_faq():
    ld = [
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q,
                         "acceptedAnswer": {"@type": "Answer", "text": re.sub("<[^>]+>", "", a)}}
                        for q, a in FAQS]},
        crumbs([("トリオランド", "/"), ("よくある質問", "/faq.html")]),
    ]
    items = "".join(
        f'<details{" open" if i == 0 else ""}><summary>{q}</summary><p>{a}</p></details>'
        for i, (q, a) in enumerate(FAQS))
    return head(
        "よくある質問｜トリオランド駒沢大学園・梅ヶ丘園（世田谷区の企業主導型保育園）",
        "世田谷区の企業主導型保育園トリオランドへのよくある質問。対象年齢、開園時間、土日祝の受け入れ、持ち物、認可保育園との違い、年度途中の入園、給食・アレルギー対応、延長保育、園見学、保育士・保育補助の求人までまとめています。",
        "/faq.html", ld) + nav("/faq.html") + f'''
<main>
<div class="wrap">

<section class="hero single">
  <div>
    <span class="badge">よくある質問</span>
    <h1>入園・見学について、<br>よくいただくご質問。</h1>
    <p class="lead">対象年齢や開園時間、企業主導型保育園と認可保育園の違い、年度途中の入園、給食や延長保育まで。保護者の方からよくいただくご質問をまとめました。ここに載っていないことも、お気軽にお問い合わせください。</p>
    <div class="actions"><a class="btn pink" href="/contact.html">見学・入園相談をする</a></div>
  </div>
</section>

<section class="tight">
  <div class="faq">{items}</div>
</section>

<section class="soft">
  <div class="kicker">STILL WONDERING?</div>
  <h2>解決しないことは、直接おたずねください。</h2>
  <p class="lead">お子さまの月齢や生活リズム、ご家庭のご事情によって、お答えできることが変わります。園見学のときにその場でご質問いただくこともできます。</p>
  <div class="actions">
    <a class="btn pink" href="/contact.html">見学・入園相談</a>
    <a class="btn outline" href="tel:{KOMA["tel"].replace("-","")}">駒沢大学園 {KOMA["tel"]}</a>
    <a class="btn outline" href="tel:{UME["tel"].replace("-","")}">梅ヶ丘園 {UME["tel"]}</a>
  </div>
</section>

<section>
  <h2>園ごとの詳しい情報</h2>
  <div class="branch-grid">
    <div class="branch"><div class="content">
      <h3>{KOMA["name"]}</h3><div class="meta">駒沢大学駅 徒歩約6分</div>
      <p>定員{KOMA["capacity"]}／{KOMA["ages"]}</p>
      <div class="btnrow"><a class="btn outline sm" href="/komazawa.html">園情報を見る</a></div>
    </div></div>
    <div class="branch"><div class="content">
      <h3>{UME["name"]}</h3><div class="meta">梅ヶ丘駅 徒歩約1分</div>
      <p>定員{UME["capacity"]}／{UME["ages"]}</p>
      <div class="btnrow"><a class="btn outline sm" href="/umegaoka.html">園情報を見る</a></div>
    </div></div>
  </div>
</section>

</div>
</main>
''' + footer()


COLUMNS = [
    ("世田谷区で保育士求人を探すときの5つの確認ポイント", "地域から求人を探す方へ。通勤・園規模・保育方針の見方。", "/recruit/setagaya-hoikushi-job-guide.html"),
    ("梅ヶ丘駅周辺で保育士求人を探す方へ", "梅丘エリアで働きたい方向けの求人の見方。", "/recruit/umegaoka-hoikushi.html"),
    ("駒沢大学駅周辺で保育士求人を探す方へ", "野沢・駒沢大学エリアで働きたい方向け。", "/recruit/komazawa-hoikushi.html"),
    ("保育補助の仕事を探す前に確認したいこと", "無資格・未経験から保育の仕事を考える方へ。", "/recruit/hoiku-assistant-guide.html"),
    ("0〜2歳児の保育に関わりたい方へ", "乳児保育を軸に職場を選ぶ方向け。", "/recruit/infant-care-career.html"),
    ("子ども主体の保育を大切にしたい保育士へ", "保育理念から職場を選びたい方向け。", "/recruit/child-led-care-hoikushi.html"),
    ("発達を学びながら保育したい保育士へ", "研修・発達理解など学びを重視する方向け。", "/recruit/development-learning-hoikushi.html"),
    ("定員20名前後の保育園で働きたい方へ", "園規模から求人を比較したい方向け。", "/recruit/around-20-capacity-nursery-job.html"),
    ("企業主導型保育園の求人を探す保育士へ", "園種別から応募先を検討する方向け。", "/recruit/company-led-nursery-hoikushi-job.html"),
    ("土日祝も開園する保育園の求人を見るときの確認ポイント", "開園日と実際の勤務条件を分けて確認したい方へ。", "/recruit/weekend-open-nursery-job-guide.html"),
    ("駒沢大学で正社員保育士求人を探す方へ", "少人数保育の職場選びで見るべきポイント。", "/recruit/fulltime-hoikushi-komazawa.html"),
    ("駒沢大学でパート保育士求人を探す方へ", "勤務日数・時間の確認ポイント。", "/recruit/part-time-hoikushi-komazawa.html"),
    ("看護師・准看護師資格を保育現場で生かしたい方へ", "資格を保育園で活かす選択肢。", "/recruit/nurse-qualification-nursery-care.html"),
    ("子育て支援員・幼稚園教諭経験を保育補助で生かすには", "経験を保育補助につなげる求人選び。", "/recruit/child-support-worker-hoiku-assistant.html"),
    ("保育園の調理スタッフ求人を探す方へ", "子どもの食を支える仕事と確認ポイント。", "/recruit/nursery-cooking-staff-setagaya.html"),
]


# ── 求人コラム（読みものの記事。オーナーの指示 2026-10-07「保育園の求人コラムも運用していこう」）──
# 記事は content/column/*.md。先頭に「key: value」の見出し（title / desc / date / 任意 updated・tags・keywords）、
# "---" の行のあとが本文。本文は「## 見出し」「- 箇条書き」「1. 番号」「**強調**」「[文](URL)」だけ。
# 出力は /column/<slug>.html（サイトと同じ見た目・ナビ・フッター）。一覧は /column.html の「新着コラム」。
# 給与・手当・待遇の数字は書かない（募集要項へ誘導する）。制度の説明には「目安」「最新の案内で確認」を添える。
# Codex が作る求人ガイド（site/recruit/*.html）とは別物。テーマが重ならないよう recruit/ の一覧を見てから書く。
COLUMN_DIR = pathlib.Path(__file__).parent / "content" / "column"


def _inline(t):
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', t)
    return t


def md_to_html(body):
    out, para, ul, ol = [], [], [], []

    def flush():
        nonlocal para, ul, ol
        if para:
            out.append("<p>" + _inline(" ".join(para)) + "</p>"); para = []
        if ul:
            out.append("<ul>" + "".join(f"<li>{_inline(x)}</li>" for x in ul) + "</ul>"); ul = []
        if ol:
            out.append("<ol>" + "".join(f"<li>{_inline(x)}</li>" for x in ol) + "</ol>"); ol = []
    for line in body.split("\n"):
        st = line.strip()
        if not st:
            flush(); continue
        if st.startswith("## "):
            flush(); out.append(f"<h2>{_inline(st[3:])}</h2>"); continue
        if st.startswith("### "):
            flush(); out.append(f"<h3>{_inline(st[4:])}</h3>"); continue
        if st.startswith("- "):
            if para or ol: flush()
            ul.append(st[2:]); continue
        m = re.match(r"^\d+\. (.*)$", st)
        if m:
            if para or ul: flush()
            ol.append(m.group(1)); continue
        if ul or ol: flush()
        para.append(st)
    flush()
    return "\n".join(out)


def load_articles():
    arts = []
    for f in sorted(COLUMN_DIR.glob("*.md")):
        head_, _, body = f.read_text(encoding="utf-8").partition("\n---\n")
        meta = {}
        for line in head_.splitlines():
            if ":" in line:
                k, v = line.split(":", 1); meta[k.strip()] = v.strip()
        for k in ("title", "desc", "date"):
            assert meta.get(k), f"{f.name}: {k} がありません"
        a = dict(meta, slug=f.stem, path=f"/column/{f.stem}.html", body=body.strip())
        a["tags"] = [t.strip() for t in meta.get("tags", "").split(",") if t.strip()]
        a["html"] = md_to_html(a["body"])
        a["updated"] = meta.get("updated", meta["date"])
        a["minutes"] = max(1, round(len(a["body"]) / 500))
        arts.append(a)
    arts.sort(key=lambda a: (a["date"], a["slug"]), reverse=True)
    return arts


ARTICLES = load_articles()


def esc_(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def article_card(a):
    tags = "".join(f'<span class="col-tag">{esc_(t)}</span>' for t in a["tags"][:2])
    return (f'<a class="card col-card" href="{a["path"]}"><div class="col-tags">{tags}</div>'
            f'<h3>{esc_(a["title"])}</h3><p>{esc_(a["desc"])}</p>'
            f'<div class="col-meta"><time datetime="{a["date"]}">{a["date"].replace("-", ".")}</time>・約{a["minutes"]}分</div></a>')


def column_cta():
    return '''<div class="col-cta">
  <div class="kicker">RECRUIT</div>
  <h2>0〜2歳の少人数保育で、一緒に働きませんか。</h2>
  <p>トリオランドは世田谷区の駒沢大学園（駒沢大学駅 徒歩約6分）と梅ヶ丘園（梅ヶ丘駅 徒歩約1分）で職員を募集しています。募集職種・給与・勤務時間などは、応募時点の最新の募集要項でご確認ください。応募の前の園見学も歓迎しています。</p>
  <div class="actions"><a class="btn pink" href="/recruit.html">採用情報を見る</a><a class="btn outline" href="/contact.html">園見学を申し込む</a></div>
</div>'''


def page_article(a):
    ld = [crumbs([("トリオランド", "/"), ("保育士求人コラム", "/column.html"), (a["title"], a["path"])]),
          {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["desc"],
           "datePublished": a["date"], "dateModified": a["updated"], "mainEntityOfPage": BASE + a["path"],
           "inLanguage": "ja", "image": f"{BASE}/assets/photos/life-play.webp",
           "author": {"@type": "Organization", "name": "トリオランド（トリオキャリア株式会社）", "url": BASE + "/"},
           "publisher": {"@type": "Organization", "name": "トリオランド", "url": BASE + "/",
                         "logo": {"@type": "ImageObject", "url": f"{BASE}/assets/photos/trioland-logo.webp"}}}]
    others = [b for b in ARTICLES if b["slug"] != a["slug"]]
    same = [b for b in others if set(b["tags"]) & set(a["tags"])]
    rel = (same + [b for b in others if b not in same])[:3]
    tags = "".join(f'<span class="col-tag">{esc_(t)}</span>' for t in a["tags"])
    upd = ("・更新 " + a["updated"].replace("-", ".")) if a["updated"] != a["date"] else ""
    return head(f"{a['title']}｜トリオランド", a["desc"], a["path"], ld, og_image="life-play.webp") + nav("/column.html") + f'''
<main>
<div class="wrap col-article">
  <nav class="col-crumbs" aria-label="現在地"><a href="/">トリオランド</a> › <a href="/column.html">保育士求人コラム</a></nav>
  <div class="col-tags">{tags}</div>
  <h1>{esc_(a["title"])}</h1>
  <p class="col-meta">公開 <time datetime="{a["date"]}">{a["date"].replace("-", ".")}</time>{upd}・読む目安 約{a["minutes"]}分・トリオランド（世田谷区の企業主導型保育園）</p>
  <div class="col-body">{a["html"]}</div>
  <p class="col-note">この記事は公開時点の一般的な情報をもとに書いています。制度や基準は自治体・年度で変わることがあるため、最新の案内でご確認ください。募集職種・給与・休日などは<a href="/recruit.html">採用情報</a>と公式の募集要項が優先します。</p>
  {column_cta()}
  <section class="tight">
    <div class="kicker">MORE</div>
    <h2>ほかのコラム</h2>
    <div class="cards">{"".join(article_card(b) for b in rel)}</div>
    <div class="actions"><a class="btn outline" href="/column.html">コラム一覧へ</a><a class="btn outline" href="/recruit/">求人ガイド一覧</a></div>
  </section>
</div>
</main>
''' + footer()


def page_column():
    ld = [crumbs([("トリオランド", "/"), ("保育士求人コラム", "/column.html")])]
    cards = "".join(
        f'<a class="card" href="{u}"><h3>{t}</h3><p>{d}</p></a>' for t, d, u in COLUMNS)
    newest = "".join(article_card(a) for a in ARTICLES)
    new_sec = ('<section>\n  <div class="kicker">NEW</div>\n  <h2>新着コラム</h2>\n  <div class="cards">' + newest + '</div>\n</section>') if ARTICLES else ""
    return head(
        "保育士求人コラム｜世田谷区で保育の仕事を探す方へ｜トリオランド",
        "世田谷区で保育士・保育補助の仕事を探す方に向けた求人コラム。乳児保育、無資格からの保育補助、企業主導型保育園、園規模、土日祝開園など、応募前に確認したいポイントを解説します。",
        "/column.html", ld) + nav("/column.html") + f'''
<main>
<div class="wrap">

<section class="hero">
  <div>
    <span class="badge">保育士・保育補助 求人コラム</span>
    <h1>世田谷区で保育の仕事を<br>探している方へ。</h1>
    <p class="lead">保育士の転職・復職、無資格からの保育補助、0〜2歳の乳児保育、企業主導型保育園という選択肢。求人票を見る前に知っておくと迷いにくくなるポイントを、テーマごとに整理しています。</p>
    <div class="actions">
      <a class="btn pink" href="/recruit.html">トリオランドの採用情報</a>
      <a class="btn outline" href="/recruit/">求人ガイド一覧</a>
    </div>
  </div>
  <div class="hero-media"><figure>
    <img src="/assets/photos/life-toys.webp?v={V}" width="1600" height="1027" alt="保育室でベビーベッドのそばを歩く子どもと見守る保育士" loading="lazy" decoding="async">
    <figcaption>0〜2歳の少人数保育の現場です</figcaption>
  </figure></div>
</section>

{new_sec}

<section>
  <div class="kicker">GUIDES</div>
  <h2>テーマ別の求人ガイド</h2>
  <div class="cards">{cards}</div>
</section>

<section class="soft">
  <div class="kicker">WHY TRIOLAND</div>
  <h2>記事のあとは、実際の園を見てください。</h2>
  <div class="prose">
    <p>求人情報を比べていると条件の話に寄りがちですが、実際に働きやすいかどうかは「どんな子どもたちと、どんな職員と、どんな環境で過ごすか」で決まります。トリオランドは世田谷区で駒沢大学園・梅ヶ丘園の2園を運営する、0〜2歳児に特化した企業主導型保育園です。</p>
    <p>定員19名・20名の少人数。理学療法士による勉強会など学びの機会もあります。応募の前に園を見てから決めていただいて構いません。</p>
  </div>
  <div class="actions">
    <a class="btn pink" href="/recruit.html">採用情報を見る</a>
    <a class="btn outline" href="/contact.html">園見学から相談する</a>
  </div>
</section>

</div>
</main>
''' + footer()


# =================================================================== 出力
def write(path, html):
    f = OUT / path.lstrip("/")
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(html, encoding="utf-8")
    print(f"  {path:24s} {len(html.encode()):>7,} bytes")


def main():
    print("building…")
    write("/index.html", page_index())
    write("/komazawa.html", page_nursery(
        KOMA, "/komazawa.html", "世田谷区野沢・駒沢大学駅の保育園（0〜2歳児）",
        "駒沢大学駅から徒歩6分。<br>世田谷区野沢の、<br>0〜2歳児のための保育園。",
        "トリオランド駒沢大学園は、東京都世田谷区野沢2丁目にある企業主導型保育園です。東急田園都市線 駒沢大学駅から徒歩約6分、三軒茶屋駅からも徒歩圏内。生後57日目〜2歳児クラス、定員19名の少人数保育。365日開園で、働くご家庭の毎日を支えます。",
        [("駅から徒歩6分の通いやすさ", "駒沢大学駅から約550m。三軒茶屋駅、西太子堂駅からも徒歩圏内で、通勤途中の送迎がしやすい立地です。"),
         ("365日開園・土日祝もOK", "園の案内では365日開園とされています。土日祝のお仕事やシフト勤務のご家庭にもご相談いただけます。"),
         ("持ち物は見学時にご案内", "おむつ・着替えなどは保護者の方にご持参いただきます。必要なものの一覧は見学時にお渡しします。"),
         ("管理栄養士監修の自園調理給食", "園内の調理室で、旬の食材を使った給食を用意します。管理栄養士監修、アレルギー対応食にも対応していると案内されています。"),
         ("定員19名の少人数保育", "0歳児9名・1歳児7名・2歳児3名。園全体で一人ひとりの様子を把握できる規模です。"),
         ("「子ども主体のあそび」を大切に", "自分で選ぶ楽しさを大切にし、感覚統合の視点から心と体の育ちを支えます。"),
         ("理学療法士など専門職と連携", "理学療法士などの専門スタッフが連携し、一人ひとりの発達に合わせたサポートを行います。"),
         ("毎日のお散歩", "天気の良い日は近隣の公園に出かけ、季節を感じながら体を動かします。"),
         ("入園料0円／給食費は会費込み", "入園料は0円、給食費は会費に含まれると案内されています。")],
        "駒沢大学園は世田谷区野沢2丁目、東急田園都市線 駒沢大学駅から徒歩約6分（約550m）の場所にあります。三軒茶屋駅からは徒歩約14分（約1.0km）、東急世田谷線 西太子堂駅からは徒歩約16分。駒沢大学・三軒茶屋・野沢エリアで0歳・1歳・2歳のお子さまの保育園をお探しの方に通いやすい立地です。",
        "/komazawa.html"))
    write("/umegaoka.html", page_nursery(
        UME, "/umegaoka.html", "世田谷区梅丘・梅ヶ丘駅すぐの保育園（0〜2歳児）",
        "梅ヶ丘駅から徒歩1分。<br>雨の日の送迎も、<br>負担の少ない保育園。",
        "トリオランド梅ヶ丘園は、東京都世田谷区梅丘1丁目にある企業主導型保育園です。小田急線 梅ヶ丘駅から徒歩約1分（約90m）。生後57日目〜2歳児クラス、定員20名。駅からの近さを活かして、毎日の送迎の負担を軽くできる園です。",
        [("梅ヶ丘駅から徒歩1分", "駅から約90m。雨の日も、抱っこやベビーカーでの送迎の負担が小さい立地です。"),
         ("3路線から通える", "小田急線 梅ヶ丘駅のほか、東急世田谷線 山下駅 徒歩約11分、京王井の頭線 東松原駅 徒歩約13分。"),
         ("定員20名の少人数保育", "0〜2歳児のみの構成。発達の差が大きい時期を、少人数でていねいに見守ります。"),
         ("自園調理の給食", "園内の調理室で給食を用意します。食べる量やペースも一人ひとりに合わせます。"),
         ("季節のイベント", "季節のイベントを実施しています。生き物とのふれあいなど、季節を感じる経験を大切にしています。"),
         ("理学療法士による勉強会", "定期的に専門職から学ぶ機会を設け、発達の視点を保育に取り入れています。")],
        "梅ヶ丘園は世田谷区梅丘1丁目、小田急小田原線 梅ヶ丘駅から徒歩約1分（約90m）の場所にあります。東急世田谷線 山下駅からは徒歩約11分、京王井の頭線 東松原駅からは徒歩約13分。梅ヶ丘・豪徳寺・東松原エリアで0歳・1歳・2歳のお子さまの保育園をお探しの方に通いやすい立地です。",
        "/umegaoka.html"))
    write("/contact.html", page_contact())
    write("/recruit.html", page_recruit())
    write("/faq.html", page_faq())
    write("/column.html", page_column())
    for a in ARTICLES:
        write(a["path"], page_article(a))
    keep = {a["slug"] + ".html" for a in ARTICLES}
    for old in (OUT / "column").glob("*.html") if (OUT / "column").is_dir() else []:
        if old.name not in keep:
            old.unlink(); print(f"  removed {old}")

    # robots.txt
    write("/robots.txt", f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: {BASE}/sitemap.xml\n")

    # sitemap
    urls = [("/", "1.0", "weekly"), ("/komazawa.html", "0.9", "monthly"),
            ("/umegaoka.html", "0.9", "monthly"), ("/contact.html", "0.9", "monthly"),
            ("/recruit.html", "0.9", "weekly"), ("/faq.html", "0.7", "monthly"),
            ("/column.html", "0.6", "monthly"), ("/recruit/", "0.6", "monthly")]
    urls += [(u, "0.5", "monthly") for _, _, u in COLUMNS]
    body = "".join(
        f"<url><loc>{BASE}{u}</loc><changefreq>{c}</changefreq><priority>{p}</priority></url>"
        for u, p, c in urls)
    body += "".join(
        f"<url><loc>{BASE}{a['path']}</loc><lastmod>{a['updated']}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>"
        for a in ARTICLES)
    write("/sitemap.xml",
          f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>\n')
    print("done.")


if __name__ == "__main__":
    main()
