#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""トリオランド サイトビルダー
すべてのページを共通ヘッダー/フッターから生成する。
写真は1枚につきサイト全体で1回だけ使用する（重複禁止）。
"""
import os, re, json, pathlib

BASE = "https://trioland-social-publisher.mygate-jp.workers.dev"
OUT = pathlib.Path(__file__).parent / "site"
V = "20260915-02"

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

RECRUIT_URL = "https://www.triocareer.jp/company/recruit/"
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
</div><div class="copyright">© トリオランド／トリオキャリア株式会社</div></footer>
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
        ("設備・サービス", "園庭あり／延長保育／一時保育／連絡アプリ"),
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
    return f'''<section><div class="cta"><h2>{title}</h2><p>{text}</p>
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
    fetch("/api/inquiry", {{
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

PHOTO_NOTE = "写真はトリオランドの実際の園生活の記録です。"
