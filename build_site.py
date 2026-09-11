#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""トリオランド サイトビルダー
すべてのページを共通ヘッダー/フッターから生成する。
写真は1枚につきサイト全体で1回だけ使用する（重複禁止）。
"""
import os, re, json, pathlib

BASE = "https://trioland-social-publisher.mygate-jp.workers.dev"
OUT = pathlib.Path(__file__).parent / "site"
V = "20260911-03"

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
)
UME = dict(
    name="トリオランド梅ヶ丘園",
    zip="154-0022",
    addr="東京都世田谷区梅丘1-21-9 ルミエール梅丘1階",
    tel="03-6413-1704",
    capacity="20名",
    ages="生後57日目〜2歳児クラス",
    hours="平日 7:30〜20:30／土・日・祝 8:00〜17:00",
    access=["小田急小田原線 梅ヶ丘駅 徒歩約1分（約90m）",
            "東急世田谷線 山下駅 徒歩約11分",
            "京王井の頭線 東松原駅 徒歩約13分"],
    extra=None,
    geo=("35.6533", "139.6480"),
)

RECRUIT_URL = "https://www.triocareer.jp/company/recruit/"
CONTACT_URL = "https://www.triocareer.jp/contact/"

# ------------------------------------------------------------------- 部品
def head(title, desc, path, extra_ld=None, robots="index,follow,max-image-preview:large"):
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
<meta property="og:image" content="{BASE}/assets/photos/exterior.jpg">
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
<a class="brand" href="/">トリオランド<small>企業主導型保育園／世田谷区</small></a>
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
        "image": BASE + "/assets/photos/exterior.jpg",
        "areaServed": "東京都世田谷区",
    }

ORG_LD = {
    "@context": "https://schema.org", "@type": "Organization",
    "name": "トリオランド", "url": BASE,
    "parentOrganization": {"@type": "Organization", "name": "トリオキャリア株式会社"},
    "logo": BASE + "/assets/photos/exterior.jpg",
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

PHOTO_NOTE = "写真はトリオランドの実際の園生活の記録です。"

# =================================================================== ページ
def page_index():
    ld = [ORG_LD, {
        "@context": "https://schema.org", "@type": "WebSite", "name": "トリオランド",
        "url": BASE, "inLanguage": "ja"}]
    return head(
        "トリオランド｜世田谷区の企業主導型保育園（駒沢大学園・梅ヶ丘園）｜0〜2歳児 園児募集中",
        "東京都世田谷区の企業主導型保育園トリオランド。駒沢大学駅・三軒茶屋駅の駒沢大学園と、梅ヶ丘駅すぐの梅ヶ丘園。生後57日目〜2歳児クラス、自園調理・園庭あり・7:30〜20:30開園。園見学・入園相談、保育士／保育補助の求人も受付中です。",
        "/", ld) + nav("/") + f'''
<main>
<div class="wrap">

<section class="hero">
  <div>
    <span class="badge">東京都世田谷区／企業主導型保育園</span>
    <h1>0・1・2歳の「やってみたい」を、<br>いちばん近くで見守る保育園。</h1>
    <p class="lead">トリオランドは、世田谷区で<b>駒沢大学園</b>と<b>梅ヶ丘園</b>の2園を運営する企業主導型保育園です。生後57日目から2歳児クラスまで、少人数だからこそできる一人ひとりに合わせた保育で、子どもの毎日の「できた」を積み重ねます。</p>
    <div class="actions">
      <a class="btn pink" href="/contact.html">園見学・入園相談（受付中）</a>
      <a class="btn outline" href="/recruit.html">保育士・保育補助の採用情報</a>
    </div>
  </div>
  <div class="hero-media"><figure>
    <img src="/assets/photos/exterior.jpg?v={V}" width="800" height="600" alt="トリオランド梅ヶ丘園の園舎外観。通りに面した明るい入口" fetchpriority="high" decoding="async">
    <figcaption>トリオランド梅ヶ丘園の園舎外観</figcaption>
  </figure></div>
</section>

<section class="tight">
  <div class="quick">
    <div><b>世田谷区に2園</b>野沢（駒沢大学駅）／梅丘（梅ヶ丘駅）</div>
    <div><b>生後57日目〜2歳児</b>乳児期に特化した少人数保育</div>
    <div><b>7:30〜20:30 開園</b>土・日・祝も 8:00〜17:00 開園</div>
    <div><b>自園調理・園庭あり</b>延長保育／一時保育にも対応</div>
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
  <h2>写真で見る、トリオランドの毎日。</h2>
  <p class="lead">文章だけでは伝わりにくい「楽しそう」「安心して預けられそう」を、実際の園生活の記録からご紹介します。</p>
  <div class="gallery">
    <figure>
      <img src="/assets/photos/life-room.jpg?v={V}" width="800" height="504" alt="保育室でソフトブロックを使って遊ぶ子どもたちと保育士" loading="lazy" decoding="async">
      <figcaption>お散歩に行けない日も、室内で体をたっぷり動かします。</figcaption>
    </figure>
    <figure>
      <img src="/assets/photos/life-play.jpg?v={V}" width="800" height="516" alt="保育室でおもちゃを受け取る子どもと保育士の手" loading="lazy" decoding="async">
      <figcaption>「やってみたい」に、そっと手が届く距離で。</figcaption>
    </figure>
    <figure>
      <img src="/assets/photos/life-nature.jpg?v={V}" width="800" height="444" alt="机を囲んで生き物をやさしく観察する子どもたち" loading="lazy" decoding="async">
      <figcaption>力を加減しながら、生き物とふれあう時間。</figcaption>
    </figure>
  </div>
  <p class="lead" style="margin-top:18px;font-size:14px;color:#6d7a88">※園ごとの写真は順次追加しています。園内の雰囲気は園見学でもご確認いただけます。</p>
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

<section>
  <div class="kicker">OUR NURSERIES</div>
  <h2>世田谷区のトリオランド2園</h2>
  <p class="lead">どちらの園も生後57日目〜2歳児クラス、平日7:30〜20:30開園です。ご自宅・勤務先からの通いやすさでお選びいただけます。</p>
  <div class="branch-grid">
    <div class="branch"><div class="content">
      <h3>{KOMA["name"]}</h3>
      <div class="meta">駒沢大学駅 徒歩約6分／三軒茶屋駅 徒歩約14分</div>
      <p>世田谷区野沢2丁目。駒沢大学・三軒茶屋エリアからお通いいただける園です。</p>
      <ul>
        <li>定員 {KOMA["capacity"]}</li>
        <li>{KOMA["ages"]}</li>
        <li>365日開園・土日祝もOK／手ぶら登園</li>
        <li>管理栄養士監修の自園調理／アレルギー対応食あり</li>
        <li>入園料 0円／給食費は会費に含まれます</li>
      </ul>
      <div class="btnrow">
        <a class="btn outline sm" href="/komazawa.html">園の詳細を見る</a>
        <a class="btn pink sm" href="/contact.html">見学を申し込む</a>
      </div>
    </div></div>
    <div class="branch"><div class="content">
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
        path, ld) + nav(active) + f'''
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
    <div><time>15:00〜</time><b>おやつ・順次降園</b><p>その日の様子をお伝えします。延長保育にも対応しています。</p></div>
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
      <a class="btn pink" href="{CONTACT_URL}" target="_blank" rel="noopener">お問い合わせフォーム</a>
      <a class="btn outline" href="tel:{KOMA["tel"].replace("-","")}">駒沢大学園 {KOMA["tel"]}</a>
      <a class="btn outline" href="tel:{UME["tel"].replace("-","")}">梅ヶ丘園 {UME["tel"]}</a>
    </div>
  </div>
  <div class="hero-media"><figure>
    <img src="/assets/photos/life-summer.jpg?v={V}" width="800" height="600" alt="保育室で保育士と一緒に水あそびを楽しむ子どもたち" loading="lazy" decoding="async">
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


def page_recruit():
    ld = [crumbs([("トリオランド", "/"), ("採用情報", "/recruit.html")])]
    return head(
        "採用情報｜世田谷区の保育士・保育補助求人｜トリオランド（駒沢大学・梅ヶ丘）",
        "世田谷区の企業主導型保育園トリオランドの保育士・保育補助の採用情報。駒沢大学園・梅ヶ丘園で0〜2歳児の少人数保育。無資格・未経験から始める保育補助、ブランクのある保育士の方もご相談ください。応募前の園見学も受付中。",
        "/recruit.html", ld) + nav("/recruit.html") + f'''
<main>
<div class="wrap">

<section class="hero">
  <div>
    <span class="badge">保育士・保育補助 募集中</span>
    <h1>子どもの「やってみたい」を、<br>一緒に楽しめる人へ。</h1>
    <p class="lead">トリオランドは世田谷区で2園を運営する企業主導型保育園です。0〜2歳児の少人数保育だからこそ、一人ひとりの育ちにじっくり関わることができます。求人票の条件だけでは分からない園の空気を、応募前の見学で確かめてください。</p>
    <div class="actions">
      <a class="btn pink" href="{RECRUIT_URL}" target="_blank" rel="noopener">最新の募集要項を見る</a>
      <a class="btn outline" href="/contact.html">まずは園見学から相談する</a>
    </div>
  </div>
  <div class="hero-media"><figure>
    <img src="/assets/photos/life-table.jpg?v={V}" width="800" height="444" alt="机を囲んで活動する子どもたちと保育士" fetchpriority="high" decoding="async">
    <figcaption>0〜2歳の少人数保育です</figcaption>
  </figure></div>
</section>

<section>
  <div class="kicker">OPEN ROLES</div>
  <h2>募集職種</h2>
  <p class="lead">公式の採用案内で確認できている募集職種です。募集状況・条件は時期により変わるため、応募前に最新の募集要項をご確認ください。</p>
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
      <div class="btnrow"><a class="btn pink sm" href="{RECRUIT_URL}" target="_blank" rel="noopener">募集要項を確認</a><a class="btn outline sm" href="/contact.html">園見学を申し込む</a></div>
    </div></div>
    <div class="branch"><div class="content">
      <h3>保育補助</h3>
      <div class="meta">無資格・未経験の方も対象</div>
      <p>保育士と一緒に、子どもたちの生活とあそびをサポートしていただくお仕事です。保育の現場がはじめての方も、少人数の環境から始められます。</p>
      <ul>
        <li>無資格・未経験の方も応募可能と案内されています</li>
        <li>幼稚園教諭／子育て支援員／ベビーシッター経験者を歓迎</li>
        <li>子育て経験のある方も歓迎と案内されています</li>
        <li>勤務地：駒沢大学園（世田谷区野沢）／梅ヶ丘園（世田谷区梅丘）</li>
      </ul>
      <div class="btnrow"><a class="btn pink sm" href="{RECRUIT_URL}" target="_blank" rel="noopener">募集要項を確認</a><a class="btn outline sm" href="/contact.html">園見学を申し込む</a></div>
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
    <tr><th>給与（保育士）</th><td>月給 310,500円 〜<br>※駒沢大学園の公式Instagram採用投稿（2026年7月）で案内されていた金額です。応募時点の条件は募集要項でご確認ください。</td></tr>
    <tr><th>シフト・休日</th><td>月1シフト制（月公休10日）と案内されています。</td></tr>
    <tr><th>歓迎する方</th><td>『未経験』『ブランク有り』でも意欲があれば歓迎と案内されています。研修制度があり、安心して始められる体制です。</td></tr>
    <tr><th>開園時間</th><td>平日 7:30〜20:30／土・日・祝 8:00〜17:00<br>※実際のシフト・勤務時間は募集要項をご確認ください</td></tr>
    <tr><th>園の設備</th><td>園庭あり／自園調理／延長保育／一時保育／連絡アプリ導入</td></tr>
    <tr><th>学びの機会</th><td>理学療法士による勉強会を定期的に実施しています</td></tr>
    <tr><th>雇用形態・その他の待遇</th><td>公式の募集要項をご確認ください。<a href="{RECRUIT_URL}" target="_blank" rel="noopener">最新の募集要項はこちら</a></td></tr>
  </table></div>
</section>

<section>
  <div class="kicker">WHY TRIOLAND</div>
  <h2>トリオランドで働く4つの特徴</h2>
  <div class="cards">
    <div class="card"><span class="num">1</span><h3>0〜2歳に特化</h3><p>乳児保育に集中できる環境です。発達の差が大きい時期だからこそ、一人ひとりに合わせた関わりを学べます。</p></div>
    <div class="card"><span class="num">2</span><h3>定員19名・20名の少人数</h3><p>大規模園とは違い、園全体で子どもの様子を共有できます。相談しやすい距離感です。</p></div>
    <div class="card"><span class="num">3</span><h3>専門職から学べる</h3><p>理学療法士による勉強会を定期的に実施。発達運動学的な視点を保育に取り入れています。</p></div>
    <div class="card"><span class="num">4</span><h3>子ども主体の保育</h3><p>決められた活動をこなすのではなく、子どもの興味から保育を組み立てる園です。</p></div>
    <div class="card"><span class="num">5</span><h3>通いやすい2園</h3><p>駒沢大学駅 徒歩約6分、梅ヶ丘駅 徒歩約1分。ご自宅から通いやすい園を選べます。</p></div>
    <div class="card"><span class="num">6</span><h3>応募前に見学できます</h3><p>職場の雰囲気は文字では伝わりません。見学してから判断していただけます。</p></div>
  </div>
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
      <img class="portrait" src="/assets/photos/life-water.jpg?v={V}" width="672" height="900" alt="保育士が子どもたちと一緒に水あそびをしている様子" loading="lazy" decoding="async">
    </div>
  </div>
</section>

<section class="tight">
  <div class="notice"><strong>掲載内容についてのご注意</strong><br>
  給与・シフトは<b>園の公式Instagram採用投稿（2026年7月）で案内されていた条件</b>です。募集職種・雇用形態・勤務時間・待遇などは時期により変わり、このページでは<b>確認できていない条件を推測して掲載していません</b>。応募の際は必ず
  <a href="{RECRUIT_URL}" target="_blank" rel="noopener">公式の募集要項</a>で最新の条件をご確認ください。</div>
</section>

{cta("応募の前に、園の雰囲気を見てみませんか。",
     "実際の保育の様子、子どもたちとの距離感、職員同士の関わり方。見学してから判断していただいて大丈夫です。",
     ("/contact.html","園見学・採用相談を申し込む"), (RECRUIT_URL,"募集要項を見る"))}

</div>
</main>
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
     "駒沢大学園では、おむつの手配・着替えの用意を園で行う「手ぶら登園」と案内されています。使用済みおむつも園で処理するため持ち帰りは不要です。詳細は見学時にご案内します。"),
    ("認可保育園とどう違いますか？",
     "トリオランドは企業主導型保育事業を実施する保育園です。認可保育園のように自治体を通して申し込むのではなく、<b>園へ直接お申し込みいただく</b>のが基本です。提携企業の従業員枠だけでなく、地域枠でのご利用もいただけます。"),
    ("年度の途中でも入園できますか？",
     "空きがあれば年度途中の入園もご相談いただけます。空き状況はクラス・月齢によって変わりますので、ご希望の園と入園希望時期をお知らせのうえお問い合わせください。"),
    ("給食はありますか？アレルギー対応は？",
     "両園とも自園調理の給食を提供しています。駒沢大学園では管理栄養士監修・旬の食材を使った給食、アレルギー対応食にも対応していると案内されています。詳しいご相談は園までお問い合わせください。"),
    ("延長保育や一時保育はありますか？",
     "両園とも延長保育・一時保育に対応しています。ご利用条件は園によって異なる場合がありますので、お問い合わせください。"),
    ("園庭はありますか？",
     "両園とも園庭ありと案内されています。天気の良い日は近隣の公園へお散歩にも出かけています。"),
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
        "世田谷区の企業主導型保育園トリオランドへのよくある質問。対象年齢、開園時間、土日祝の受け入れ、手ぶら登園、認可保育園との違い、年度途中の入園、給食・アレルギー対応、延長保育、園見学、保育士・保育補助の求人までまとめています。",
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


def page_column():
    ld = [crumbs([("トリオランド", "/"), ("保育士求人コラム", "/column.html")])]
    cards = "".join(
        f'<a class="card" href="{u}"><h3>{t}</h3><p>{d}</p></a>' for t, d, u in COLUMNS)
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
    <img src="/assets/photos/life-toys.jpg?v={V}" width="800" height="510" alt="保育室でおもちゃを手に取る子ども" loading="lazy" decoding="async">
    <figcaption>0〜2歳の少人数保育の現場です</figcaption>
  </figure></div>
</section>

<section>
  <div class="kicker">ARTICLES</div>
  <h2>テーマ別に読む</h2>
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
        "トリオランド駒沢大学園は、東京都世田谷区野沢2丁目にある企業主導型保育園です。東急田園都市線 駒沢大学駅から徒歩約6分、三軒茶屋駅からも徒歩圏内。生後57日目〜2歳児クラス、定員19名の少人数保育。365日開園・手ぶら登園で、働くご家庭の毎日を支えます。",
        [("駅から徒歩6分の通いやすさ", "駒沢大学駅から約550m。三軒茶屋駅、西太子堂駅からも徒歩圏内で、通勤途中の送迎がしやすい立地です。"),
         ("365日開園・土日祝もOK", "園の案内では365日開園とされています。土日祝のお仕事やシフト勤務のご家庭にもご相談いただけます。"),
         ("手ぶら登園でお支度いらず", "おむつの手配、着替えの用意を園で行うと案内されています。毎朝の荷物づくりの負担を減らせます。"),
         ("おむつ処理対応・持ち帰り不要", "使用済みおむつは園で処理すると案内されています。お迎えの荷物が増えません。"),
         ("管理栄養士監修の自園調理給食", "園内の調理室で、旬の食材を使った給食を用意します。管理栄養士監修、アレルギー対応食にも対応していると案内されています。"),
         ("定員19名の少人数保育", "0歳児9名・1歳児7名・2歳児3名。園全体で一人ひとりの様子を把握できる規模です。"),
         ("「子ども主体のあそび」を大切に", "自分で選ぶ楽しさを大切にし、感覚統合の視点から心と体の育ちを支えます。"),
         ("理学療法士など専門職と連携", "理学療法士などの専門スタッフが連携し、一人ひとりの発達に合わせたサポートを行います。"),
         ("園庭あり・お散歩も", "園庭があり、天気の良い日は近隣の公園にも出かけます。"),
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
         ("園庭あり・季節のイベント", "園庭があり、季節のイベントも実施しています。生き物とのふれあいなど、季節を感じる経験を大切にしています。"),
         ("理学療法士による勉強会", "定期的に専門職から学ぶ機会を設け、発達の視点を保育に取り入れています。")],
        "梅ヶ丘園は世田谷区梅丘1丁目、小田急小田原線 梅ヶ丘駅から徒歩約1分（約90m）の場所にあります。東急世田谷線 山下駅からは徒歩約11分、京王井の頭線 東松原駅からは徒歩約13分。梅ヶ丘・豪徳寺・東松原エリアで0歳・1歳・2歳のお子さまの保育園をお探しの方に通いやすい立地です。",
        "/umegaoka.html"))
    write("/contact.html", page_contact())
    write("/recruit.html", page_recruit())
    write("/faq.html", page_faq())
    write("/column.html", page_column())

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
    write("/sitemap.xml",
          f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>\n')
    print("done.")


if __name__ == "__main__":
    main()
