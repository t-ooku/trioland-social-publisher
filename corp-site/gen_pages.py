# トリオキャリア HP 試作版（複数ページ）を作る。
# 出力：corp4/index.html（Artifact が外枠を付けるので中身だけ）と、ほかのページ（完全な HTML）、assets/site.css・site.js
import json, math, html, pathlib, datetime, os
MODE = os.environ.get("TRIO_MODE", "proto")   # proto＝試作版（Artifact）／wp＝本番の WordPress テーマ
# でじるみ本部サイトの写真は掲載許可が要確認（中村さん経由）。許可が出るまで本番では使わない（2026-10-20 オーナー回答）
DG_OK = os.environ.get("TRIO_DG_PHOTOS", "1" if MODE == "proto" else "0") == "1"

S = pathlib.Path("/tmp/claude-0/-home-claude/79e7618f-a508-5a14-b194-2bf7b5ffae0d/scratchpad")
OUT = S / "corp4"
GEO = S / "geo"
TODAY = "2026-10-17"
BASE = "https://www.triocareer.jp"   # 本番に移すときの URL（canonical・構造化データ用）
ASSET_BASE = BASE + "/wp-content/themes/trio-career"   # 本番のテーマの場所（構造化データの画像 URL）
E = html.escape

# ------------------------------------------------------------------ 施設データ（公式 HP・各事業の HP・でじるみ公式の掲載値）
ORG = dict(name="トリオキャリア株式会社", zip="102-0071", pref="東京都", city="千代田区", street="富士見2-14-38 富士見イースト511",
           tel="03-6450-7390", lat=35.697304, lng=139.744293)

F = [
 dict(k="komazawa", biz="hoiku", name="トリオランド駒沢大学園", short="駒沢大学園", kind="企業主導型保育園",
      zip="154-0003", pref="東京都", city="世田谷区", street="野沢2-33-5 グランドメゾン野沢103号室", tel="03-6450-7390",
      lat=35.635754, lng=139.665405, station="駒沢大学",
      access=["東急田園都市線 駒沢大学駅 徒歩約6分（約550m）", "東急田園都市線 三軒茶屋駅 徒歩約14分", "東急世田谷線 西太子堂駅 徒歩約16分"],
      hours="平日 7:30〜20:30（18:30以降は事前にご相談）／土・日・祝 8:00〜17:00",
      hours_ld=[("Mo,Tu,We,Th,Fr", "07:30", "20:30"), ("Sa,Su", "08:00", "17:00")],
      target="生後57日目〜2歳児クラス", capacity="19名（0歳児9名・1歳児7名・2歳児3名）", opened="2019-05-01",
      photo="komazawa-exterior.webp", photo_wh=(1080, 720), photo_alt="トリオランド駒沢大学園の外観。通りに面した入口と看板",
      gallery=[("life-table.webp", 1400, 1004, "駒沢大学園でのテーブル活動"), ("life-room.webp", 1600, 1027, "駒沢大学園の保育室")],
      site="https://hoiku.triocareer.jp/komazawa.html", insta="https://www.instagram.com/trioland.komazawa/",
      vacancy="https://www.hoikue.com/nursery/tokyo/13112/8486/#cost",
      points=["東急田園都市線「駒沢大学」駅から徒歩約6分", "生後57日目から2歳児クラスまでの0〜2歳児専門の小規模な園", "平日7:30〜20:30まで開園、土日祝も開園",
              "給食は園内で調理（給食費は会費に含まれます）", "入園料0円・延長料金なし"],
      extra=[("敷地面積", "98.36㎡"), ("入園料", "0円"), ("延長料金", "なし")],
      faq=[("トリオランド駒沢大学園の最寄り駅はどこですか？", "東急田園都市線の駒沢大学駅です。徒歩約6分（約550m）です。三軒茶屋駅からも徒歩約14分です。"),
           ("何歳から預けられますか？", "生後57日目から2歳児クラスまでお預かりしています。定員は19名（0歳児9名・1歳児7名・2歳児3名）です。"),
           ("会社に勤めていなくても利用できますか？", "企業主導型保育園のため、従業員枠・提携企業枠のほかに地域枠があります。空き状況は保育園のHPか「空き状況」のページでご確認ください。"),
           ("見学はできますか？", "できます。トリオランドのHPのお問い合わせから、園見学をお申し込みください。")]),
 dict(k="umegaoka", biz="hoiku", name="トリオランド梅ヶ丘園", short="梅ヶ丘園", kind="企業主導型保育園",
      zip="154-0022", pref="東京都", city="世田谷区", street="梅丘1-21-9 ルミエール梅丘1階", tel="03-6413-1704",
      lat=35.655685, lng=139.653961, station="梅ヶ丘",
      access=["小田急小田原線 梅ヶ丘駅 徒歩約1分（約90m）", "東急世田谷線 山下駅 徒歩約11分", "京王井の頭線 東松原駅 徒歩約13分"],
      hours="平日 7:30〜20:30（18:30以降は事前にご相談）／土・日・祝 8:00〜17:00",
      hours_ld=[("Mo,Tu,We,Th,Fr", "07:30", "20:30"), ("Sa,Su", "08:00", "17:00")],
      target="生後57日目〜2歳児クラス", capacity="20名（0歳児7名・1歳児7名・2歳児6名）", opened="2021-04-29",
      photo="umegaoka-exterior.webp", photo_wh=(1080, 720), photo_alt="トリオランド梅ヶ丘園の外観。梅ヶ丘駅前の通りに面した入口と看板",
      gallery=[],
      site="https://hoiku.triocareer.jp/umegaoka.html", insta="https://www.instagram.com/trioland.umegaoka/",
      vacancy="https://www.hoikue.com/nursery/8788/",
      points=["小田急線「梅ヶ丘」駅から徒歩約1分", "生後57日目から2歳児クラスまでの0〜2歳児専門の小規模な園", "平日7:30〜20:30まで開園、土日祝も開園",
              "給食は園内で調理（給食費は会費に含まれます）", "入園料0円・延長料金なし"],
      extra=[("敷地面積", "116.3㎡"), ("入園料", "0円"), ("延長料金", "なし")],
      faq=[("トリオランド梅ヶ丘園の最寄り駅はどこですか？", "小田急小田原線の梅ヶ丘駅です。徒歩約1分（約90m）です。"),
           ("何歳から預けられますか？", "生後57日目から2歳児クラスまでお預かりしています。定員は20名（0歳児7名・1歳児7名・2歳児6名）です。"),
           ("会社に勤めていなくても利用できますか？", "企業主導型保育園のため、従業員枠・提携企業枠のほかに地域枠があります。空き状況は保育園のHPか「空き状況」のページでご確認ください。"),
           ("見学はできますか？", "できます。トリオランドのHPのお問い合わせから、園見学をお申し込みください。")]),
 dict(k="lopp", biz="houkago", name="放課後等デイサービス ロップ", short="ロップ", kind="放課後等デイサービス",
      zip="177-0052", pref="東京都", city="練馬区", street="関町東2-14-4 橋本ビル1階", tel="03-6904-7469",
      lat=35.728046, lng=139.578354, station="武蔵関",
      access=["西武新宿線 武蔵関駅 徒歩約3分（約185m）", "西武新宿線 上石神井駅 徒歩約16分"],
      hours="平日 10:00〜19:00／土日祝・学校休業日 9:00〜18:00",
      hours_ld=[("Mo,Tu,We,Th,Fr", "10:00", "19:00"), ("Sa,Su", "09:00", "18:00")],
      target="小学生〜高校生（6〜18歳）", capacity="お問い合わせください", opened="2019-12-01",
      photo="lopp-room.webp", photo_wh=(700, 700), photo_alt="ロップの室内。トランポリンやバランスボール、ハンモック",
      gallery=[("lopp-act-park.webp", 800, 600, "公園の芝生で職員と子どもたちが遊ぶ様子（お顔はスタンプで隠しています）"), ("lopp-act-craft.webp", 450, 600, "職員と一緒に工作をする様子")],
      site="https://afterschool.triocareer.jp/lopp.html", insta=None, vacancy=None,
      points=["西武新宿線「武蔵関」駅から徒歩約3分", "「遊び」を中心に、感覚統合の考え方で発達の土台を育てる", "平日10:00〜19:00、土日祝・学校休業日も9:00〜18:00で開所",
              "送迎あり（練馬区・武蔵野市・西東京市）", "理学療法士・社会福祉士・保育士などが在籍"],
      extra=[("送迎", "あり（練馬区・武蔵野市・西東京市）"), ("支援", "感覚統合療法、遊戯療法・運動療法、集団療育、預かり支援"), ("職員", "保育士・幼稚園教諭、児童指導員、理学療法士、社会福祉士")],
      faq=[("ロップはどこにありますか？", "東京都練馬区関町東2-14-4 橋本ビル1階です。西武新宿線の武蔵関駅から徒歩約3分です。"),
           ("何歳のお子さんが通えますか？", "小学生から高校生まで（6〜18歳）のお子さんが対象です。"),
           ("送迎はありますか？", "あります。練馬区・武蔵野市・西東京市の方面に対応しています。範囲はお問い合わせください。"),
           ("どんな支援をしていますか？", "机の上の課題ではなく「遊び」を中心に、感覚統合の考え方で体と心の土台を育てています。")]),
 dict(k="compass", biz="houkago", name="放課後等デイサービス コンパスマイル落合南長崎", short="コンパスマイル", kind="放課後等デイサービス",
      zip="171-0052", pref="東京都", city="豊島区", street="南長崎3-6-14 栄正印刷ビル", tel="03-3565-6929",
      lat=35.724274, lng=139.687164, station="落合南長崎",
      access=["都営大江戸線 落合南長崎駅 徒歩約5分（約354m）", "西武池袋線 椎名町駅 徒歩約9分"],
      hours="平日（放課後）13:30〜17:30／土曜・学校休業日 10:00〜16:00（日曜・年末年始休み）",
      hours_ld=[("Mo,Tu,We,Th,Fr", "13:30", "17:30"), ("Sa", "10:00", "16:00")],
      target="小学生〜高校生（6〜18歳）", capacity="お問い合わせください", opened="2020-06-01",
      photo="compass-room-b.webp", photo_wh=(1200, 900), photo_alt="コンパスマイル落合南長崎の室内",
      gallery=[("compass-playroom.webp", 700, 700, "トランポリンとボールプールのあるプレイルーム"), ("compass-consult.webp", 1200, 900, "相談スペース")],
      site="https://afterschool.triocareer.jp/compass.html", insta=None, vacancy=None,
      points=["都営大江戸線「落合南長崎」駅から徒歩約5分", "「遊び」を中心に、運動・感覚遊びで発達の土台を育てる", "平日は放課後13:30〜17:30、土曜・学校休業日は10:00〜16:00",
              "送迎あり（営業日は全日実施）", "理学療法士・保育士などが在籍"],
      extra=[("休業日", "日曜日、年末年始（12月29日〜1月3日）"), ("送迎", "あり（営業日は全日実施。範囲はお問い合わせください）"), ("利用料", "世帯所得に応じた月額上限（0円／4,600円／37,200円）。おやつ代1回50円")],
      faq=[("コンパスマイル落合南長崎はどこにありますか？", "東京都豊島区南長崎3-6-14 栄正印刷ビルです。都営大江戸線の落合南長崎駅から徒歩約5分です。"),
           ("何歳のお子さんが通えますか？", "小学生から高校生まで（6〜18歳）のお子さんが対象です。"),
           ("利用料はいくらですか？", "世帯所得に応じた月額上限（0円・4,600円・37,200円）があります。おやつ代は1回50円です。"),
           ("お休みの日はいつですか？", "日曜日と年末年始（12月29日〜1月3日）がお休みです。")]),
]
DG = [("ota", "東京大田", "146-0083", "東京都", "大田区", "千鳥2丁目3-20", "03-6715-4307", 35.571266, 139.693375, "千鳥町", ["東急池上線 千鳥町駅 徒歩3分", "東急多摩川線 武蔵新田駅 徒歩6分"], "2025-04-01", "tokyo-ota"),
      ("abiko", "千葉我孫子", "270-1176", "千葉県", "我孫子市", "柴崎台1丁目10-3 磯源第三ビル1F", "04-7197-6820", 35.873024, 140.040909, "天王台", ["JR常磐線 天王台駅 北口出てすぐ"], "2025-07-01", "chiba-abiko"),
      ("ichikawa", "千葉市川", "272-0144", "千葉県", "市川市", "新井3-15-12", "047-321-4289", 35.673649, 139.898117, "南行徳", ["東京メトロ東西線 南行徳駅 徒歩7分"], "2025-10-01", "chiba-ichikawa"),
      ("utsunomiya", "栃木宇都宮", "320-0811", "栃木県", "宇都宮市", "大通り5丁目1-15 池田屋ビル3F", "028-689-9125", 36.561043, 139.892258, "宇都宮", ["宇都宮駅 徒歩11分"], "2025-10-01", "tochigi-utsunomiya"),
      ("chuo", "千葉中央", "260-0021", "千葉県", "千葉市中央区", "新宿1-8-11 IDビル千葉4F", "043-301-5344", 35.605244, 140.113846, "千葉中央", ["京成千葉線 千葉中央駅 徒歩9分", "千葉都市モノレール 市役所前駅 徒歩10分"], "2026-01-01", "chiba-chuo"),
      ("oyama", "栃木小山", "323-0022", "栃木県", "小山市", "駅東通1-6-3 小山駅東ビル3F", "0285-32-6459", 36.308849, 139.809631, "小山", ["JR小山駅 徒歩3分"], "2026-07-01", "tochigi-oyama")]
for k, n, z, pf, c, st, tel, la, ln, sta, acc, op, slug in DG:
    F.append(dict(k="dg-" + k, biz="digilumi", name="でじるみ" + n, short="でじるみ" + n, kind="就労継続支援B型事業所",
        zip=z, pref=pf, city=c, street=st, tel=tel, lat=la, lng=ln, station=sta, access=acc, hours=None, hours_ld=[],
        target="障がいのある方（就労継続支援B型）", capacity="20名", opened=op,
        photo=f"dg-{k}.webp", photo_wh=(960, 720), photo_alt=f"でじるみ{n}の制作スペース", banner=f"dgb-{k}.webp",
        gallery=[], site=f"https://digilumi.jp/office/{slug}/", insta=None, vacancy=None,
        points=[f"{acc[0]}", "イラスト・動画・デザインに特化した就労継続支援B型事業所", "学習費用はかからず、プロのクリエイターが制作をサポート",
                "雇用契約を結ばず、自分のペースで通所。作業に応じて工賃を受け取れる", "無料見学・無料体験を随時受付"],
        extra=[("学べること", "動画・映像編集／イラスト・キャラクターデザイン／グラフィックデザイン／WEB・SNS運営／データ入力・事務／社会体験・イベント")],
        faq=[(f"でじるみ{n}はどこにありますか？", f"{pf}{c}{st}です。{acc[0]}です。"),
             ("利用にお金はかかりますか？", "学習費用はかかりません。福祉サービスとしての利用料については、各事業所にお問い合わせください。"),
             ("どんなことができますか？", "イラスト・キャラクターデザイン、動画編集、グラフィックデザイン、WEB・SNS運営、データ入力などを学びながら作業し、工賃を受け取れます。"),
             ("見学や体験はできますか？", "無料見学・無料体験を随時受け付けています。でじるみ公式サイトの事業所ページからお問い合わせください。")]))
BIZ = {
  "hoiku": dict(label="企業主導型保育", sub="トリオランド", page="hoiku.html", color="#e0875a", no="01"),
  "houkago": dict(label="放課後等デイサービス", sub="ロップ・コンパスマイル", page="afterschool.html", color="#3ea37a", no="02"),
  "digilumi": dict(label="就労継続支援B型", sub="でじるみ", page="digilumi.html", color="#8a6fe0", no="03"),
  "call": dict(label="コールセンター", sub="本社（千代田区）", page="callcenter.html", color="#005c87", no="04"),
}
for f in F:
    f["page"] = f"f-{f['k']}.html"
    f["addr"] = f"{f['pref']}{f['city']}{f['street']}"
    f["gmap"] = "https://www.google.com/maps/search/?api=1&query=" + html.escape(f"{f['addr']} {f['name']}").replace(" ", "+")
PREFS_USED = sorted(set(f["pref"] for f in F))

# ------------------------------------------------------------------ 地図（国土数値情報ベースの公開 GeoJSON から都県・区の境界を描く）
JP = json.load(open(GEO / "japan.geojson", encoding="utf-8"))
KANTO = ["東京都", "神奈川県", "埼玉県", "千葉県", "茨城県", "栃木県", "群馬県", "山梨県", "静岡県", "福島県", "長野県"]

def rings(geom):
    if geom["type"] == "Polygon": return [geom["coordinates"][0]]
    return [p[0] for p in geom["coordinates"]]

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]; x1, y1 = a; x2, y2 = b
        d = abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / (math.hypot(x2 - x1, y2 - y1) or 1)
        if d > dmax: dmax, idx = d, i
    if dmax > tol:
        return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [a, b]

class Proj:
    def __init__(s, lng0, lng1, lat0, lat1, W):
        s.lng0, s.lat1 = lng0, lat1; s.k = math.cos(math.radians((lat0 + lat1) / 2))
        s.sc = W / ((lng1 - lng0) * s.k); s.W = W; s.H = (lat1 - lat0) * s.sc
    def __call__(s, lng, lat): return ((lng - s.lng0) * s.k * s.sc, (s.lat1 - lat) * s.sc)

def path_of(rs, P, tol, bbox):
    out = []
    lng0, lng1, lat0, lat1 = bbox
    for r in rs:
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        m = max(.01, (lng1 - lng0) * .15)
        if max(xs) < lng0 - m or min(xs) > lng1 + m or max(ys) < lat0 - m or min(ys) > lat1 + m: continue
        q = [P(x, y) for x, y in r]
        h = len(q) // 2
        pts = simplify(q[:h + 1], tol)[:-1] + simplify(q[h:], tol)   # 閉じた輪は半分ずつ間引く
        if len(pts) < 3: continue
        out.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
    return "".join(out)

UID = [0]
def map_svg(bbox, W, pins, tol=0.6, wards=False, cls="kmap", labels=True, show_lines=True, inset_rect=None):
    P = Proj(*bbox, W); UID[0] += 1; sid = f"sh{UID[0]}"
    parts = [f'<svg class="{cls}" viewBox="0 0 {W:.0f} {P.H:.0f}" role="img" aria-label="トリオキャリアの施設マップ" preserveAspectRatio="xMidYMid meet">']
    parts.append(f'<defs><filter id="{sid}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#00384d" flood-opacity=".35"/></filter></defs>')
    parts.append(f'<rect width="{W:.0f}" height="{P.H:.0f}" class="sea"/>')
    for ft in JP["features"]:
        n = ft["properties"]["nam_ja"]
        if n not in KANTO: continue
        d = path_of(rings(ft["geometry"]), P, tol, bbox)
        if not d: continue
        on = "on" if n in PREFS_USED else ""
        parts.append(f'<path class="pref {on}" d="{d}"><title>{n}</title></path>')
    if wards:
        for wf in sorted((GEO / "wards").glob("*.json")):
            g = json.load(open(wf, encoding="utf-8"))
            for ft in g["features"]:
                d = path_of(rings(ft["geometry"]), P, tol * .6, bbox)
                if d: parts.append(f'<path class="ward" d="{d}"/>')
    # 都県名
    if labels and not wards:
        for n, (lng, lat) in {"東京都": (139.50, 35.70), "千葉県": (140.22, 35.52), "栃木県": (139.75, 36.70), "埼玉県": (139.45, 36.02), "茨城県": (140.25, 36.15), "神奈川県": (139.38, 35.42)}.items():
            x, y = P(lng, lat)
            if 0 < x < W and 0 < y < P.H: parts.append(f'<text class="plabel" x="{x:.0f}" y="{y:.0f}">{n}</text>')
    if inset_rect:
        (a, b), (c, d) = P(inset_rect[0], inset_rect[3]), P(inset_rect[1], inset_rect[2])
        parts.append(f'<rect class="insetbox" x="{a:.0f}" y="{b:.0f}" width="{c-a:.0f}" height="{d-b:.0f}"/>')
    hx, hy = P(ORG["lng"], ORG["lat"])
    if show_lines:
        for i, p in enumerate(pins):
            x, y = P(p["lng"], p["lat"])
            parts.append(f'<path class="link b-{p["biz"]}" style="--i:{i}" d="M{hx:.1f},{hy:.1f}Q{(hx+x)/2:.1f},{min(hy,y)-30:.1f} {x:.1f},{y:.1f}"/>')
    for i, p in enumerate(pins):
        x, y = P(p["lng"], p["lat"])
        col = BIZ[p["biz"]]["color"]
        href = p.get("page", "about.html#company")
        parts.append(f'<a class="pin b-{p["biz"]}" href="{href}" style="--i:{i};--c:{col}" data-biz="{p["biz"]}" aria-label="{E(p["name"])}">'
                     f'<g transform="translate({x:.1f},{y:.1f})"><circle class="pulse" r="9"/><g class="drop"><path filter="url(#{sid})" d="M0,0C-2,-6 -9,-9 -9,-16A9,9 0 1 1 9,-16C9,-9 2,-6 0,0Z"/><circle cy="-16" r="3.6" fill="#fff"/></g>'
                     f'<text class="tip" y="-30">{E(p["short"])}</text></g></a>')
    parts.append("</svg>")
    return "".join(parts)

HQPIN = dict(k="hq", biz="call", name="トリオキャリア本社（コールセンター）", short="本社", lat=ORG["lat"], lng=ORG["lng"], page="callcenter.html")
PINS = [HQPIN] + F
MAIN_BBOX = (139.28, 140.42, 35.40, 36.72)
INSET_BBOX = (139.545, 139.79, 35.545, 35.765)

def big_map(compact=False):
    kanto = map_svg(MAIN_BBOX, 520, PINS, tol=.7, inset_rect=INSET_BBOX)
    tokyo = map_svg(INSET_BBOX, 520, [p for p in PINS if INSET_BBOX[0] < p["lng"] < INSET_BBOX[1] and INSET_BBOX[2] < p["lat"] < INSET_BBOX[3]], tol=.5, wards=True, cls="kmap tmap", labels=False)
    legend = "".join(f'<button type="button" class="lg-btn" data-f="{k}" aria-pressed="true"><i style="background:{v["color"]}"></i>{v["label"]}</button>' for k, v in BIZ.items())
    return f'''<div class="mapbox">
  <div class="maps">
    <figure class="m-k"><figcaption>関東エリア</figcaption>{kanto}</figure>
    <figure class="m-t"><figcaption>東京23区周辺（拡大）</figcaption>{tokyo}</figure>
  </div>
  <div class="legend" role="group" aria-label="事業で絞り込む">{legend}</div>
</div>'''

def counters():
    n_fac = len(F); n_pref = len(PREFS_USED)
    return f'''<div class="stats">
  <div><b class="cnt" data-to="{n_fac}">{n_fac}</b><span>施設・事業所</span></div>
  <div><b class="cnt" data-to="{n_pref}">{n_pref}</b><span>都県（東京・千葉・栃木）</span></div>
  <div><b class="cnt" data-to="4">4</b><span>事業</span></div>
  <div><b class="cnt" data-to="2018">2018</b><span>年 設立</span></div>
</div>'''

# ------------------------------------------------------------------ 共通部品
NAV = [("index.html", "ホーム", "Home"), ("facilities.html", "施設マップ", "Facilities"), ("business.html", "事業紹介", "Business"),
       ("about.html", "トリオキャリアについて", "About"), ("recruit.html", "採用情報", "Recruit"), ("news.html", "お知らせ・コラム", "News"), ("contact.html", "お問い合わせ", "Contact")]
SUBNAV = [(v["page"], v["label"]) for v in BIZ.values()]
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&family=Shippori+Mincho:wght@600&family=Jost:wght@300;400;500&display=swap">'

def header(active):
    items = []
    for href, ja, en in NAV:
        cur = ' aria-current="page"' if href == active else ""
        if href == "business.html":
            sub = "".join(f'<a href="{h}">{E(l)}</a>' for h, l in SUBNAV)
            items.append(f'<div class="dd"><a href="{href}"{cur}>{ja}</a><div class="ddm">{sub}</div></div>')
        else:
            items.append(f'<a href="{href}"{cur}>{ja}</a>')
    return f'''<div class="proto">試作版（コピー）です。本番のトリオキャリアHPにはまだ反映していません。</div>
<header class="hd"><div class="wrap">
  <a class="logo" href="index.html"><img src="a/logo_y.png" width="280" height="60" alt="トリオキャリア株式会社"></a>
  <button class="menu-btn" id="menuBtn" type="button" aria-label="メニュー" aria-expanded="false" aria-controls="gnav"><span></span><span></span><span></span></button>
  <nav class="gnav" id="gnav" aria-label="メニュー">{"".join(items)}</nav>
</div></header>'''

def footer():
    links = "".join(f'<a href="{h}"><span>{en}</span><span>{ja}</span></a>' for h, ja, en in NAV[1:])
    fac = "".join(f'<li><a href="{f["page"]}">{E(f["short"])}</a></li>' for f in F)
    return f'''<footer class="ft"><div class="wrap">
  <div>
    <a class="logo" href="index.html"><img src="a/logo_y.png" width="280" height="60" alt="トリオキャリア株式会社"></a>
    <div class="addr">〒{ORG["zip"]} {ORG["pref"]}{ORG["city"]}{ORG["street"]}<br>TEL {ORG["tel"]}（受付 9:00〜18:00・土日祝を除く）</div>
    <div class="copy">© 2026 Trio Career Co., Ltd. All rights reserved.</div>
  </div>
  <div><nav class="fnav" aria-label="フッター">{links}</nav>
    <div class="ffac"><span>施設一覧</span><ul>{fac}</ul></div></div>
</div></footer>'''

def page_head(title, desc, path, ld=None, og="a/v-minna.webp"):
    canon = f"{BASE}/{'' if path == 'index.html' else path.replace('.html', '/')}"
    lds = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in (ld or []))
    return f'''<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="website"><meta property="og:url" content="{canon}"><meta property="og:image" content="{ASSET_BASE}/{og}"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:site_name" content="トリオキャリア株式会社"><meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
{FONTS}
<link rel="stylesheet" href="assets/site.css">
{lds}'''

ORG_LD = {"@context": "https://schema.org", "@type": "Organization", "@id": f"{BASE}/#org", "name": ORG["name"], "alternateName": "Trio Career",
          "url": f"{BASE}/", "logo": f"{BASE}/wp-content/uploads/2018/06/logo_y.png", "telephone": "+81-3-6450-7390", "foundingDate": "2018-02-06",
          "address": {"@type": "PostalAddress", "postalCode": ORG["zip"], "addressRegion": ORG["pref"], "addressLocality": ORG["city"], "streetAddress": ORG["street"], "addressCountry": "JP"},
          "sameAs": ["https://www.facebook.com/profile.php?id=61591966192630"],
          "subOrganization": [{"@id": f"{BASE}/facilities/{f['k']}/#place"} for f in F]}

def write(path, title, desc, body, active, ld=None):
    head = page_head(title, desc, path, ld)
    tail = f'{footer()}\n<script src="assets/site.js"></script>'
    if path == "index.html":   # Artifact が外枠（doctype・head・body）を付ける
        doc = f'{head}\n<meta name="claude:viewport-fit-sides" content="cover">\n{header(active)}\n<main id="top">{body}</main>\n{tail}\n'
    else:
        doc = f'<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n{head}\n</head><body>\n{header(active)}\n<main id="top">{body}</main>\n{tail}\n</body></html>\n'
    (OUT / path).write_text(doc, encoding="utf-8")

def crumbs(items):
    vis = " / ".join((f'<a href="{h}">{E(t)}</a>' if h else f'<span aria-current="page">{E(t)}</span>') for t, h in items)
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": t, **({"item": f"{BASE}/{'' if h == 'index.html' else (h or '').replace('.html', '/')}"} if h else {})} for i, (t, h) in enumerate(items)]}
    return f'<nav class="crumb wrap" aria-label="パンくず">{vis}</nav>', ld

def phead(en, ja, lead, img=None):
    bg = f' style="--bg:url(../a/{img})"' if img else ""
    return f'''<section class="phead"{bg}><div class="wrap"><div class="eyebrow">{en}</div><h1 class="sub">{ja}</h1>{f'<p>{lead}</p>' if lead else ''}</div></section>'''

def fdate(d): y, m, dd = d.split("-"); return f"{y}年{int(m)}月{int(dd)}日"

DG_ICONS = '''<svg viewBox="0 0 120 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="38" height="26" rx="3"/><path d="M15 42h16M23 32v10"/><path d="M19 13l10 6-10 6z" fill="currentColor" stroke="none"/><path d="M58 38l16-16 5 5-16 16-7 2z"/><path d="M71 25l5 5"/><circle cx="100" cy="20" r="11"/><path d="M93 36c4-3 10-3 14 0"/><path d="M96 18h.01M104 18h.01" stroke-width="3.4"/></svg>'''
def dgart(label, sub="", cls=""):
    return f'<span class="dgart {cls}" role="img" aria-label="{E(label)}">{DG_ICONS}<b>でじるみ</b>{f"<small>{E(sub)}</small>" if sub else ""}</span>'

def fac_card(f):
    b = BIZ[f["biz"]]
    ph = dgart(f["name"], f["short"].replace("でじるみ", "")) if (f["biz"] == "digilumi" and not DG_OK) else f'<img src="a/{f["photo"]}" width="{f["photo_wh"][0]}" height="{f["photo_wh"][1]}" alt="{E(f["photo_alt"])}" loading="lazy">'
    return f'''<a class="fcard rv" href="{f["page"]}" data-biz="{f["biz"]}"><div class="ph">{ph}<span class="bz" style="--c:{b["color"]}">{b["label"]}</span></div>
<div class="in"><b>{E(f["name"])}</b><span>{E(f["pref"] + f["city"])}／{E(f["access"][0])}</span><em>詳しく見る →</em></div></a>'''

# ------------------------------------------------------------------ ページ
# トップのスライド：園の動画と各事業の写真を交互に。動画は表示されるたびに最初から（mp4 を先に＝iPhone の Safari 向け）
SLIDES = [("v", "v-minna", "保育園で保育士と子どもたちが積み木あそびをする様子", "No.01", "企業主導型保育 トリオランド"),
          ("i", "h-lopp-park.webp", "公園の芝生で職員と子どもたちが遊ぶ様子（お顔はスタンプで隠しています）", "No.02", "放課後等デイサービス ロップ"),
          ("i", "h-dg-chuo.webp", "でじるみ千葉中央の制作スペース", "No.03", "就労継続支援B型 でじるみ千葉中央"),
          ("i", "t-call.webp", "電話で対応するコールセンタースタッフ", "No.04", "コールセンター事業"),
          ("v", "v-gohan", "給食を食べる子どもたち", "No.01", "企業主導型保育 トリオランド"),
          ("i", "h-compass.webp", "コンパスマイル落合南長崎の室内", "No.02", "放課後等デイサービス コンパスマイル"),
          ("v", "v-karada", "保育士が子どもの体を支えて一緒に体を動かす様子", "No.01", "企業主導型保育 トリオランド"),
          ("i", "h-dg-ota.webp", "でじるみ東京大田の制作スペース", "No.03", "就労継続支援B型 でじるみ東京大田")]
if not DG_OK: SLIDES = [s for s in SLIDES if "h-dg-" not in s[1]]
def hero_slides():
    out = []
    for i, (t, src, alt, n, cap) in enumerate(SLIDES):
        on = " on" if i == 0 else ""
        if t == "v":
            pre = "auto" if i == 0 else "none"
            out.append(f'<div class="sl{on}" data-cap="{cap}" data-n="{n}"><img class="pv" src="a/{src}.webp" width="1200" height="800" alt="">'
                       f'<video muted playsinline preload="{pre}" poster="a/{src}.webp" aria-label="{alt}"><source src="a/{src}.mp4" type="video/mp4"><source src="a/{src}.webm" type="video/webm"></video></div>')
        else:
            out.append(f'<div class="sl{on}" data-cap="{cap}" data-n="{n}"><img src="a/{src}" alt="{alt}" decoding="async"></div>')
    return "\n".join(out)
hero_html = f'''<div class="hero" id="hero">
  <div class="copy"><h1>育つ。<br>はたらく。<br>ささえる。<br><em class="tag">トリオキャリアがつなぐ。</em></h1><span class="side">Trio Career</span><span class="dots3" aria-hidden="true"><i></i><i></i><i></i></span></div>
  <div class="stage">
{hero_slides()}
    <div class="cap" id="heroCap"></div>
    <div class="ctrl" id="heroCtrl"></div>
  </div>
</div>
'''

def p_index():
    panels = "".join(f'''<a class="panel" href="{v["page"]}">{dgart("でじるみの制作スペース", "", "abs") if (img.startswith("dg-") and not DG_OK) else f'<img src="a/{img}" width="{w}" height="{h}" alt="{E(alt)}" loading="lazy"{st}>'}<div class="t"><span class="n">No.{v["no"]}</span><h3>{v["label"]}</h3><small>{v["sub"]}</small></div></a>'''
        for (k, v), (img, w, h, alt, st) in zip(BIZ.items(), [("life-water.webp", 1400, 1867, "タライのそばで水あそびに夢中になっている子ども", ""), ("t-lopp-kart.webp", 1600, 1200, "ゴーカートに挑戦する子どもたちと職員", ""), ("dg-oyama.webp", 960, 720, "でじるみの制作スペース", ""), ("t-call-2.webp", 1200, 800, "電話で対応するスタッフ", "")]))
    body = f'''{hero_html}
<section class="mapsec" id="map"><div class="wrap">
  <div class="mapgrid">
    <div class="maptx rv">
      <div class="eyebrow">Our network</div><h2 class="sub"><span class="nw">東京・</span><span class="nw">千葉・</span><span class="nw">栃木に、</span><br><span class="nw">{len(F)}の施設。</span></h2>
      <p>保育園、<span class="nw">放課後等デイサービス</span>、<span class="nw">就労継続支援B型</span>。地域の<span class="nw">「育つ」と</span><span class="nw">「はたらく」</span>を支える拠点を広げています。</p>
      {counters()}
      <a class="btn" href="facilities.html">施設一覧を見る</a>
    </div>
    {big_map()}
  </div>
</div></section>
<section class="biz-intro"><div class="wrap">
  <div class="eyebrow rv">Business</div><div class="sub">事業紹介</div>
  <div class="panels">{panels}</div>
</div></section>
<section class="philo wrap">
  <div class="rv"><div class="eyebrow">Philosophy</div><div class="big" style="margin-top:18px">会社・お客様・<br>スタッフが、<br><em>ともに伸びる</em>。</div>
    <svg style="margin-top:34px" class="trio" viewBox="0 0 420 230" role="img" aria-label="当社・クライアント様・スタッフの三者が重なり合う図">
      <circle class="c1" cx="150" cy="140" r="80"/><circle class="c2" cx="270" cy="140" r="80"/><circle class="c3" cx="210" cy="86" r="80"/>
      <text class="lb" x="106" y="168">当社</text><text class="lb" x="314" y="168">スタッフ</text><text class="lb" x="210" y="52">クライアント様</text>
      <text class="en" x="210" y="133">TRIO</text><text class="en sm" x="210" y="150">CAREER</text>
    </svg>
  </div>
  <div class="rv philo-r">
    <p>当社・クライアント様・スタッフ。三者（トリオ）が最良のパートナーとなり、互いにキャリアを積み重ねていく。それが社名に込めた想いです。</p>
    <div class="two"><div><span class="en">Mission</span><b>社会にイノベーションを。</b><span>三者がそれぞれの“稼ぐ力”を高め合い、社会に新しい価値を生み出します。</span></div>
    <div><span class="en">Credo</span><b>強みは「人財」。</b><span>時代のニーズに応える力の源は人。人財の採用と教育に、徹底的に投資します。</span></div></div>
    <a class="link-more" href="about.html">About us</a>
  </div>
</section>
<section class="recruit"><div class="wrap"><div class="rc">
  <div class="ph rv"><img src="a/rc-staff.webp" width="740" height="555" alt="笑顔で子どもと積み木あそびをする保育士" loading="lazy"><span class="tag">正社員・パート募集中</span></div>
  <div class="rv"><div class="eyebrow">Recruit</div><div class="sub">採用情報</div><h2>わたしたちと一緒に<br>働きませんか？</h2><p>育児と仕事を両立できる職場です。子育て中の方、ブランクのある方、未経験の方も歓迎します。</p><a class="btn" href="recruit.html">募集職種を見る</a></div>
</div></div></section>
{news_block(3)}
{cta()}'''
    write("index.html", "トリオキャリア株式会社｜保育・放課後等デイサービス・就労継続支援B型・コールセンター",
          "トリオキャリア株式会社は東京・千葉・栃木で、企業主導型保育園トリオランド、放課後等デイサービス、就労継続支援B型でじるみ、コールセンター事業を運営しています。", body, "index.html", [ORG_LD])

def news_block(n=4, with_news=True):
    news = [("2026-07-01", "でじるみ栃木小山 OPEN", "f-dg-oyama.html"), ("2026-01-01", "でじるみ千葉中央 OPEN", "f-dg-chuo.html"), ("2025-10-01", "でじるみ栃木宇都宮 OPEN", "f-dg-utsunomiya.html"), ("2025-10-01", "でじるみ千葉市川 OPEN", "f-dg-ichikawa.html"), ("2025-07-01", "でじるみ千葉我孫子 OPEN", "f-dg-abiko.html"), ("2025-04-01", "でじるみ東京大田 OPEN", "f-dg-ota.html")]
    hc = [("2026-10-07", "保育士の配置基準とは？0〜2歳児クラスで働く前に", "https://hoiku.triocareer.jp/column/hoikushi-haichi-kijun.html"), ("2026-10-07", "保育園の午睡チェックとは？", "https://hoiku.triocareer.jp/column/gosui-check-anzen.html"), ("2026-10-07", "0〜2歳児クラスの保育士の1日", "https://hoiku.triocareer.jp/column/nyuji-hoiku-ichinichi.html"), ("2026-10-07", "自園調理の保育園で働く保育士へ", "https://hoiku.triocareer.jp/column/jien-chouri-rinyushoku.html")]
    ac = [("2026-10-06", "放課後等デイサービスの仕事とは？", "https://afterschool.triocareer.jp/column/what-is-houkago-day-job.html"), ("2026-10-06", "無資格・未経験から放デイで働くには", "https://afterschool.triocareer.jp/column/no-license-start.html"), ("2026-10-06", "感覚統合を軸にした放デイで働く", "https://afterschool.triocareer.jp/column/sensory-integration-work.html"), ("2026-10-06", "放デイの勤務時間とシフト", "https://afterschool.triocareer.jp/column/working-hours-shift.html")]
    def ul(xs, ext):
        t = ' target="_blank" rel="noopener"' if ext else ""
        return "".join(f'<li><a href="{u}"{t}><time datetime="{d}">{d.replace("-", ".")}</time>{E(x)}</a></li>' for d, x, u in xs[:n])
    newsul = f"<!--TRIO:NEWS:{n}-->" if MODE == "wp" else ul(news, False)
    newscol = f'<div class="rv"><div class="eyebrow">News</div><div class="sub">お知らせ</div><ul class="list">{newsul}<li><a href="news.html">一覧を見る →</a></li></ul></div>' if with_news else ""
    return f'''<section class="wrap newsec"><div class="cols3{"" if with_news else " cols2"}">
  {newscol}
  <div class="rv"><div class="eyebrow">Column</div><div class="sub">保育のコラム</div><ul class="list">{ul(hc, True)}<li><a href="https://hoiku.triocareer.jp/column.html" target="_blank" rel="noopener">一覧を見る →</a></li></ul></div>
  <div class="rv"><div class="eyebrow">Column</div><div class="sub">放課後デイのコラム</div><ul class="list">{ul(ac, True)}<li><a href="https://afterschool.triocareer.jp/column/" target="_blank" rel="noopener">一覧を見る →</a></li></ul></div>
</div></section>'''

def cta():
    return f'''<section class="ctasec"><div class="wrap"><div class="contact rv">
  <div><div class="eyebrow">Contact</div><div class="sub" style="color:#fff">お問い合わせ</div><p>サービス・見学・採用のご相談は、お気軽にどうぞ。</p></div>
  <div><div class="tel num">{ORG["tel"]}</div><small>受付 9:00〜18:00（土日祝を除く）</small><a class="btn" href="contact.html">お問い合わせ方法を見る</a></div>
</div></div></section>'''

def p_facilities():
    groups = ""
    for k, v in BIZ.items():
        fs = [f for f in F if f["biz"] == k]
        if not fs: continue
        groups += f'<div class="fgroup" data-biz="{k}"><h2 class="gh"><i style="background:{v["color"]}"></i>{v["label"]}<small>{len(fs)}施設</small></h2><div class="fgrid">{"".join(fac_card(f) for f in fs)}</div></div>'
    cr, crld = crumbs([("ホーム", "index.html"), ("施設マップ", None)])
    itemlist = {"@context": "https://schema.org", "@type": "ItemList", "name": "トリオキャリアの施設一覧", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{BASE}/facilities/{f['k']}/", "name": f["name"]} for i, f in enumerate(F)]}
    body = f'''{phead("Facilities", "施設マップ", f"東京・千葉・栃木の{len(F)}施設。地図のアイコンから各施設のページへ進めます。")}{cr}
<section class="wrap" style="padding-block:30px 20px">{counters()}{big_map()}</section>
<section class="wrap" style="padding-block:40px 60px">{groups}</section>{cta()}'''
    write("facilities.html", f"施設マップ・施設一覧｜トリオキャリア株式会社（東京・千葉・栃木の{len(F)}施設）",
          f"トリオキャリアが運営する保育園・放課後等デイサービス・就労継続支援B型の施設一覧。東京・千葉・栃木の{len(F)}施設の所在地・アクセス・電話番号を地図で紹介します。", body, "facilities.html", [ORG_LD, crld, itemlist])

def p_business():
    cards = "".join(f'''<a class="bcard rv" href="{v["page"]}"><span class="n">No.{v["no"]}</span><b>{v["label"]}</b><small>{v["sub"]}</small><em>→</em></a>''' for v in BIZ.values())
    cr, crld = crumbs([("ホーム", "index.html"), ("事業紹介", None)])
    body = f'''{phead("Business", "事業紹介", "保育・福祉・コールセンター。暮らしと働き方を支える4つの事業です。")}{cr}<section class="wrap" style="padding-block:40px 80px"><div class="bcards">{cards}</div></section>{cta()}'''
    write("business.html", "事業紹介｜トリオキャリア株式会社", "トリオキャリアの4つの事業（企業主導型保育・放課後等デイサービス・就労継続支援B型・コールセンター）を紹介します。", body, "business.html", [ORG_LD, crld])

def fac_list_section(biz):
    fs = [f for f in F if f["biz"] == biz]
    return f'<div class="sub-h">施設</div><div class="fgrid">{"".join(fac_card(f) for f in fs)}</div>'

def biz_page(key, title, desc, intro_media, intro_text, chips, link, extra=""):
    v = BIZ[key]
    cr, crld = crumbs([("ホーム", "index.html"), ("事業紹介", "business.html"), (v["label"], None)])
    body = f'''{phead("Business No." + v["no"], v["label"], v["sub"])}{cr}
<section class="biz"><div class="wrap">
  <div class="bhead"><div class="rv"><span class="n" style="color:var(--teal)">No.{v["no"]}</span><h2>{v["label"]}</h2><div class="co">{v["sub"]}</div><p>{intro_text}</p>
    <div class="chips" style="color:{v["color"]}">{"".join(f"<span>{c}</span>" for c in chips)}</div>{link}</div>
    <div class="media rv">{intro_media}</div></div>
  {extra}
  {fac_list_section(key) if key != "call" else ""}
</div></section>{cta()}'''
    write(v["page"], title, desc, body, "business.html", [ORG_LD, crld])

DG_MENU_ICON = {  # 学べること（写真の代わりの線のアイコン）
  "01": '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="10" width="38" height="26" rx="3"/><path d="M20 17l10 6-10 6z" class="f"/></svg>',
  "02": '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38l20-20 6 6-20 20-8 2z"/><path d="M26 22l6 6"/></svg>',
  "06": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="9"/><rect x="22" y="22" width="18" height="18" rx="2"/></svg>',
  "03": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8c6 6 6 26 0 32M24 8c-6 6-6 26 0 32"/></svg>',
  "05": '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="36" height="20" rx="3"/><path d="M12 20h2M18 20h2M24 20h2M30 20h2M36 20h0M14 28h20"/></svg>',
  "07": '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="16" cy="16" r="5"/><circle cx="32" cy="16" r="5"/><path d="M6 38c1-7 6-11 10-11s9 4 10 11M22 38c1-7 6-11 10-11s9 4 10 11"/></svg>'}

def p_biz():
    biz_page("hoiku", "企業主導型保育 トリオランド｜世田谷区の0〜2歳児保育園｜トリオキャリア",
        "トリオキャリアの企業主導型保育園トリオランド（駒沢大学園・梅ヶ丘園）。生後57日目〜2歳児クラス、平日7:30〜20:30。認可保育園より割安な保育料で子育てと仕事の両立を応援します。",
        '<video class="clip" muted playsinline loop preload="none" poster="a/v-mizu.webp" aria-label="タライで水あそびをする子どもたち"><source data-src="a/v-mizu.webm" type="video/webm"><source data-src="a/v-mizu.mp4" type="video/mp4"></video>',
        "子どもを近くで、安心して預けられる。内閣府の企業主導型保育事業の園として、認可保育園より割安な保育料で子育てと仕事の両立を応援します。",
        ["7:30〜20:30", "生後57日目から", "駅すぐ", "理学療法士と学ぶ保育"],
        '<a class="btn" href="https://hoiku.triocareer.jp/" target="_blank" rel="noopener">トリオランドのHP <span class="u">hoiku.triocareer.jp</span></a>',
        '''<div class="sub-h">園での毎日</div><div class="strip">
<figure class="rv"><video class="clip" muted playsinline loop preload="none" poster="a/v-gohan.webp" aria-label="給食を食べる子どもたち"><source data-src="a/v-gohan.webm" type="video/webm"><source data-src="a/v-gohan.mp4" type="video/mp4"></video><figcaption>自園調理の給食</figcaption></figure>
<figure class="rv"><video class="clip" muted playsinline loop preload="none" poster="a/v-inochi.webp" aria-label="カブトムシにそっとふれる子ども"><source data-src="a/v-inochi.webm" type="video/webm"><source data-src="a/v-inochi.mp4" type="video/mp4"></video><figcaption>小さな命にふれる</figcaption></figure>
<figure class="rv"><img src="a/life-play.webp" width="1600" height="1027" alt="保育室で遊ぶ子どもたち" loading="lazy"><figcaption>室内あそび</figcaption></figure></div>
<details class="more"><summary>ご利用料金（月極コース・両園共通）</summary><div class="tbl"><table class="fee"><thead><tr><th>クラス</th><th>従業員枠</th><th>提携企業枠</th><th>地域枠</th></tr></thead><tbody class="num"><tr><th>0歳</th><td>¥18,000</td><td>¥25,200</td><td>¥36,000</td></tr><tr><th>1歳</th><td>¥16,000</td><td>¥22,400</td><td>¥32,000</td></tr><tr><th>2歳</th><td>¥16,000</td><td>¥22,400</td><td>¥32,000</td></tr></tbody></table></div><p class="note">入園料0円・延長料金なし。給食費・クリーニング込み。16日以上登園で半額。</p></details>''')
    biz_page("houkago", "放課後等デイサービス ロップ・コンパスマイル｜練馬区・豊島区｜トリオキャリア",
        "トリオキャリアの放課後等デイサービス。練馬区のロップ（武蔵関駅徒歩約3分）と豊島区のコンパスマイル落合南長崎（落合南長崎駅徒歩約5分）。遊びを中心に感覚統合の考え方で発達を支えます。",
        '<img src="a/lopp-act-star.webp" width="800" height="600" alt="七夕飾りの下で職員と子どもたちがピースをしている様子（お顔はスタンプで隠しています）" loading="lazy">',
        "障害や発達に特性のある6〜18歳のお子さんの、放課後と休日の居場所。「遊び」を中心に、感覚統合の考え方で発達の土台を育てます。",
        ["学習する力", "コミュニケーション", "社会性", "送迎あり"],
        '<a class="btn" href="https://afterschool.triocareer.jp/" target="_blank" rel="noopener">放課後デイのHP <span class="u">afterschool.triocareer.jp</span></a>')
    menus = "".join((f'<div class="menu rv"><img src="a/dgc-{n}.webp" width="600" height="480" alt="" loading="lazy">{t}</div>' if DG_OK else f'<div class="menu rv"><span class="mi">{DG_MENU_ICON.get(n, "")}</span>{t}</div>') for n, t in [("01", "動画・映像編集"), ("02", "イラスト・キャラクター"), ("06", "グラフィックデザイン"), ("03", "WEB・SNS運営"), ("05", "データ入力・事務"), ("07", "社会体験・イベント")])
    biz_page("digilumi", "就労継続支援B型 でじるみ｜東京・千葉・栃木の6事業所｜トリオキャリア",
        "トリオキャリアが運営する就労継続支援B型事業所でじるみ（東京大田・千葉我孫子・千葉市川・栃木宇都宮・千葉中央・栃木小山）。イラスト・動画・デザインを学びながら自分のペースで働けます。",
        ('<img src="a/dg-chara.webp" width="600" height="600" alt="でじるみのキャラクター" loading="lazy" style="object-fit:contain;background:#111">' if DG_OK else dgart("イラスト・動画・デザインを学ぶでじるみ", "イラスト・動画・デザイン", "abs big")),
        "貴方の「好き」を「仕事」に。イラスト・動画・デザインに特化したB型事業所です。自分のペースで通いながらプロのクリエイターに学び、工賃を受け取れます。",
        ["学習費用0円", "無料見学・体験", "各事業所 定員20名"],
        '<a class="btn" href="https://digilumi.jp/" target="_blank" rel="noopener">でじるみ公式サイト <span class="u">digilumi.jp</span></a>',
        f'<div class="sub-h">学べること</div><div class="menus">{menus}</div>')
    biz_page("call", "コールセンター事業｜電話代行・テレマーケティング｜トリオキャリア",
        "トリオキャリアのコールセンター事業。電話代行・電話秘書（月額15,000円〜）、コールセンター、バーチャルオフィス、テレマーケティング、メール・FAX一斉送信に対応します。",
        '<img src="a/t-call-2.webp" width="900" height="600" alt="電話で対応するスタッフ" loading="lazy">',
        "トリオキャリアの原点。電話とメールで、企業様の問題解決と目標達成をお手伝いします。迅速・丁寧・正確な対応で、お客様の「信頼」につなげます。",
        ["インバウンド", "アウトバウンド", "本社（千代田区）"], '<a class="btn" href="contact.html">お問い合わせ</a>',
        '''<div class="sub-h">サービス</div><div class="svc">
<div class="rv"><b>電話代行・電話秘書</b><span>不在時の電話受付など</span><em>15,000円〜／月</em></div>
<div class="rv"><b>コールセンター</b><span>受注・予約・サポート・事務局</span><em>お見積り</em></div>
<div class="rv"><b>バーチャルオフィス</b><span>電話番号・住所のレンタル</span><em>15,000円〜／月</em></div>
<div class="rv"><b>テレマーケティング</b><span>市場開拓・販売促進・調査</span><em>お見積り</em></div>
<div class="rv"><b>メール・FAX一斉送信</b><span>回答の自動集計にも対応</span><em>5,000円〜／回 ＋ 50円／件</em></div>
<div class="rv"><b>受信・発信の連携</b><span>開拓から注文受付まで一元管理</span><em>お見積り</em></div></div>''')

def ld_place(f):
    t = {"hoiku": ["ChildCare", "LocalBusiness"], "houkago": ["LocalBusiness"], "digilumi": ["LocalBusiness"]}[f["biz"]]
    x = {"@context": "https://schema.org", "@type": t, "@id": f"{BASE}/facilities/{f['k']}/#place", "name": f["name"],
         "description": "。".join(f["points"][:3]) + "。", "url": f"{BASE}/facilities/{f['k']}/", "telephone": "+81-" + f["tel"].lstrip("0"),
         **({"image": f"{ASSET_BASE}/a/{f['photo']}"} if (f["biz"] != "digilumi" or DG_OK) else {}),
         "address": {"@type": "PostalAddress", "postalCode": f["zip"], "addressRegion": f["pref"], "addressLocality": f["city"], "streetAddress": f["street"], "addressCountry": "JP"},
         "geo": {"@type": "GeoCoordinates", "latitude": f["lat"], "longitude": f["lng"]}, "hasMap": f["gmap"],
         "parentOrganization": {"@id": f"{BASE}/#org"}, "foundingDate": f["opened"],
         "sameAs": [u for u in [f.get("site"), f.get("insta")] if u]}
    if f["hours_ld"]:
        x["openingHoursSpecification"] = [{"@type": "OpeningHoursSpecification", "dayOfWeek": [{"Mo": "Monday", "Tu": "Tuesday", "We": "Wednesday", "Th": "Thursday", "Fr": "Friday", "Sa": "Saturday", "Su": "Sunday"}[d] for d in days.split(",")], "opens": o, "closes": c} for days, o, c in f["hours_ld"]]
    return x

def p_facility(f):
    b = BIZ[f["biz"]]
    cr, crld = crumbs([("ホーム", "index.html"), ("施設マップ", "facilities.html"), (f["name"], None)])
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in f["faq"]]}
    rows = [("施設名", f["name"]), ("種別", f["kind"]), ("所在地", f"〒{f['zip']} {f['addr']}"), ("電話番号", f["tel"])]
    if f["hours"]: rows.append(("営業時間", f["hours"]))
    rows += [("対象", f["target"]), ("定員", f["capacity"]), ("開所", fdate(f["opened"]))] + f["extra"] + [("運営", "トリオキャリア株式会社")]
    table = "".join(f"<tr><th>{E(a)}</th><td>{E(c)}</td></tr>" for a, c in rows)
    mini = map_svg((f["lng"] - .05, f["lng"] + .05, f["lat"] - .035, f["lat"] + .035), 480, [f], tol=.4, wards=(f["pref"] == "東京都"), cls="kmap mini", labels=False, show_lines=False)
    gal = "".join(f'<figure><img src="a/{p}" width="{w}" height="{h}" alt="{E(a)}" loading="lazy"><figcaption>{E(a)}</figcaption></figure>' for p, w, h, a in f["gallery"])
    if f.get("banner") and DG_OK: gal = f'<figure class="wide"><img src="a/{f["banner"]}" width="1200" height="300" alt="{E(f["name"])}のバナー" loading="lazy"></figure>' + gal
    links = [(f["site"], "公式ページ" if f["biz"] != "digilumi" else "でじるみ公式の事業所ページ"), (f["gmap"], "Googleマップで開く")]
    if f.get("vacancy"): links.append((f["vacancy"], "空き状況"))
    if f.get("insta"): links.append((f["insta"], "Instagram"))
    linkh = "".join(f'<a class="btn" href="{E(u)}" target="_blank" rel="noopener">{t}</a>' for u, t in links)
    rel = [x for x in F if x["biz"] == f["biz"] and x["k"] != f["k"]][:3] or [x for x in F if x["k"] != f["k"]][:3]
    near = sorted([x for x in F if x["k"] != f["k"]], key=lambda x: (x["lat"] - f["lat"]) ** 2 + (x["lng"] - f["lng"]) ** 2)[:3]
    faq = "".join(f'<details class="qa"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in f["faq"])
    body = f'''<section class="fhero"><div class="wrap fh-grid">
  <div class="rv"><span class="bz" style="--c:{b["color"]}">{b["label"]}</span><h1>{E(f["name"])}</h1><p class="addr">{E(f["addr"])}</p><p class="acc">{E(f["access"][0])}</p>
    <div class="fh-btn"><a class="btn" href="tel:{f["tel"].replace("-", "")}">TEL {f["tel"]}</a><a class="btn" href="{E(f["gmap"])}" target="_blank" rel="noopener">地図アプリで開く</a></div></div>
  <div class="ph rv">{dgart(f["name"], f["short"].replace("でじるみ", ""), "abs") if (f["biz"] == "digilumi" and not DG_OK) else f'<img src="a/{f["photo"]}" width="{f["photo_wh"][0]}" height="{f["photo_wh"][1]}" alt="{E(f["photo_alt"])}">'}</div>
</div></section>{cr}
<section class="wrap fbody">
  <div class="summary rv"><h2>{E(f["short"])}の要点</h2><ul>{"".join(f"<li>{E(p)}</li>" for p in f["points"])}</ul><p class="upd">最終更新：{fdate(TODAY)}</p></div>
  <div class="sub-h">基本情報</div><div class="tbl"><table class="info">{table}</table></div>
  <div class="sub-h">アクセス</div>
  <div class="accgrid"><div><ul class="acclist">{"".join(f"<li>{E(a)}</li>" for a in f["access"])}</ul><p class="note">地図は位置の目安です。正確な道順は地図アプリでご確認ください。</p><div class="links">{linkh}</div></div><figure class="minimap">{mini}</figure></div>
  {f'<div class="sub-h">写真</div><div class="fgal">{gal}</div>' if gal else ''}
  <div class="sub-h">よくある質問</div><div class="faq">{faq}</div>
  <div class="sub-h">近くのトリオキャリアの施設</div><div class="fgrid">{"".join(fac_card(x) for x in near)}</div>
</section>{cta()}'''
    title = f"{f['name']}｜{f['station']}駅の{f['kind']}（{f['city']}）｜トリオキャリア"
    desc = f"{f['name']}は{f['addr']}の{f['kind']}です。{f['access'][0]}。" + "、".join(f["points"][1:3]) + "。"
    write(f["page"], title, desc[:150], body, "facilities.html", [ld_place(f), crld, faq_ld])

def p_about():
    hist = [("2018.02", "トリオキャリア株式会社 設立（千代田区）"), ("2019.05", "トリオランド駒沢大学園 開園"), ("2019.12", "放課後等デイサービス ロップ 開所"), ("2020.06", "コンパスマイル落合南長崎 開所"),
            ("2021.04", "トリオランド梅ヶ丘園 開園"), ("2025.04", "でじるみ東京大田 開所"), ("2025.07", "でじるみ千葉我孫子 開所"), ("2025.10", "でじるみ栃木宇都宮・千葉市川 開所"), ("2026.01", "でじるみ千葉中央 開所"), ("2026.07", "でじるみ栃木小山 開所")]
    tl = "".join(f'<li class="rv"><time>{d}</time><span>{E(t)}</span></li>' for d, t in hist)
    cr, crld = crumbs([("ホーム", "index.html"), ("トリオキャリアについて", None)])
    body = f'''{phead("About us", "トリオキャリアについて", "")}{cr}
<section class="philo wrap" id="philosophy">
  <div class="rv"><div class="eyebrow">Philosophy</div><div class="big" style="margin-top:18px">会社・お客様・<br>スタッフが、<br><em>ともに伸びる</em>。</div></div>
  <div class="rv"><p>当社・クライアント様・スタッフ。三者（トリオ）が最良のパートナーとなり、互いにキャリアを積み重ねていく。それが社名に込めた想いです。</p>
  <div class="two"><div><span class="en">Mission</span><b>社会にイノベーションを。</b><span>三者がそれぞれの“稼ぐ力”を高め合い、社会に新しい価値を生み出します。</span></div>
  <div><span class="en">Credo</span><b>強みは「人財」。</b><span>時代のニーズに応える力の源は人。人財の採用と教育に、徹底的に投資します。</span></div></div></div>
</section>
<section class="about wrap"><div class="ph rv"><img src="a/t-about.webp" width="1600" height="1600" alt="子どもを抱き上げるお母さんと保育士" loading="lazy"></div>
  <div class="tx rv"><div class="eyebrow">Our story</div><div class="sub">保育園をつくった理由</div><p>コールセンターで活躍した女性に、出産後も戻ってきてほしい。その想いから、自社で保育園をつくりました。</p><p style="margin-top:12px">「働きたいけど働けない」をなくすために。子育てと仕事を両立できる場所を、地域の中に広げています。</p></div></section>
<section class="wrap" style="padding-block:20px 80px"><div class="eyebrow">History</div><div class="sub">あゆみ</div><ol class="tl">{tl}</ol></section>
<section class="company wrap" id="company"><div class="eyebrow">Company</div><div class="sub">会社概要</div>
  <dl class="co" style="margin-top:28px"><dt>会社名</dt><dd>トリオキャリア株式会社</dd><dt>役員</dt><dd>河野 正</dd><dt>設立</dt><dd>2018年2月6日</dd><dt>資本金</dt><dd class="num">750万円</dd>
  <dt>所在地</dt><dd>〒102-0071 東京都千代田区富士見2-14-38 富士見イースト511</dd><dt>電話</dt><dd class="num">03-6450-7390</dd>
  <dt>事業内容</dt><dd>コールセンター事業／企業主導型保育事業／放課後等デイサービス／就労継続支援B型</dd><dt>事業所</dt><dd>{"／".join(E(f["name"]) for f in F)}</dd><dt>取引銀行</dt><dd>りそな銀行</dd></dl>
</section>'''
    write("about.html", "トリオキャリアについて｜理念・あゆみ・会社概要｜トリオキャリア株式会社", "トリオキャリア株式会社の理念（ミッション・クレド）、保育園をつくった理由、2018年設立からのあゆみ、会社概要を紹介します。", body, "about.html", [ORG_LD, crld])

def p_recruit():
    cr, crld = crumbs([("ホーム", "index.html"), ("採用情報", None)])
    body = f'''{phead("Recruit", "採用情報", "育児と仕事を両立できる職場です。子育て中・ブランクあり・未経験の方も歓迎します。")}{cr}
<section class="recruit" style="background:none"><div class="wrap"><div class="rc">
  <div class="ph rv"><img src="a/rc-staff.webp" width="740" height="555" alt="笑顔で子どもと積み木あそびをする保育士" loading="lazy"><span class="tag">正社員・パート募集中</span></div>
  <div class="rv"><h2>わたしたちと一緒に<br>働きませんか？</h2><p>「働きたいけど働けない」をなくしたい。トリオキャリアは、子育て中の方が無理なく働ける職場をつくっています。</p>
  <div style="display:flex;flex-wrap:wrap;gap:12px"><a class="btn" href="https://hoiku.triocareer.jp/recruit.html" target="_blank" rel="noopener">保育園の採用</a><a class="btn" href="https://afterschool.triocareer.jp/recruit.html" target="_blank" rel="noopener">放課後デイの採用</a></div></div></div>
  <div class="jobs tbl rv"><table><thead><tr><th>職種</th><th>勤務先</th><th>給与</th><th>対象</th></tr></thead><tbody>
  <tr><th>保育士</th><td>トリオランド駒沢大学園／梅ヶ丘園</td><td class="num">月給 310,500円〜</td><td>保育士・看護師・准看護師。未経験・ブランク歓迎</td></tr>
  <tr><th>保育補助</th><td>トリオランド駒沢大学園／梅ヶ丘園</td><td>応募・見学時にご案内</td><td>無資格・未経験OK。子育て経験も歓迎</td></tr>
  <tr><th>保育士（正職員）</th><td>ロップ（練馬区）</td><td class="num">月給 290,000〜350,000円</td><td>保育士資格。新卒・未経験も歓迎</td></tr>
  <tr><th>児童指導員・保育士（パート）</th><td>コンパスマイル（豊島区）</td><td class="num">時給 1,300〜1,700円</td><td>任用資格・保育士歓迎。未経験も相談可</td></tr></tbody></table></div>
</div></section>{cta()}'''
    write("recruit.html", "採用情報｜保育士・保育補助・児童指導員の求人｜トリオキャリア株式会社", "トリオキャリアの採用情報。世田谷区の保育園トリオランド（保育士 月給310,500円〜）、練馬区・豊島区の放課後等デイサービスで保育士・児童指導員を募集しています。", body, "recruit.html", [ORG_LD, crld])

def p_news():
    cr, crld = crumbs([("ホーム", "index.html"), ("お知らせ・コラム", None)])
    top = ('<section class="wrap newsall"><div class="eyebrow">News</div><div class="sub">お知らせ</div><!--TRIO:NEWSLIST--></section>' + news_block(4, with_news=False)) if MODE == "wp" else news_block(6)
    body = f'''{phead("News", "お知らせ・コラム", "")}{cr}{top}
<section class="wrap" style="padding-block:10px 80px"><div class="sub-h">Follow us</div><div class="sns">
<a href="https://www.facebook.com/profile.php?id=61591966192630" target="_blank" rel="noopener"><i style="background:#1877f2">f</i>トリオキャリア</a>
<a href="https://www.instagram.com/trioland.komazawa/" target="_blank" rel="noopener"><i style="background:#d6336c">IG</i>トリオランド駒沢大学園</a>
<a href="https://www.instagram.com/trioland.umegaoka/" target="_blank" rel="noopener"><i style="background:#d6336c">IG</i>トリオランド梅ヶ丘園</a>
<a href="https://x.com/digilumi_ota" target="_blank" rel="noopener"><i style="background:#111">X</i>でじるみ東京大田</a>
<a href="https://www.instagram.com/degilumi_shuroushien/" target="_blank" rel="noopener"><i style="background:#d6336c">IG</i>でじるみ（公式）</a></div></section>'''
    write("news.html", "お知らせ・コラム｜トリオキャリア株式会社", "トリオキャリアのお知らせ（施設のオープン情報など）と、保育・放課後等デイサービスのコラムの新着です。", body, "news.html", [ORG_LD, crld])

def p_contact():
    cr, crld = crumbs([("ホーム", "index.html"), ("お問い合わせ", None)])
    rows = "".join(f'<tr><th><a href="{f["page"]}">{E(f["name"])}</a></th><td class="num">{f["tel"]}</td></tr>' for f in F)
    body = f'''{phead("Contact", "お問い合わせ", "サービス・見学・採用のご相談は、お電話かフォームからどうぞ。")}{cr}
<section class="wrap" style="padding-block:40px 80px"><div class="co-grid">
  <div class="contact rv" style="display:block"><div class="eyebrow">Head office</div><div class="sub" style="color:#fff">本社</div><div class="tel num">{ORG["tel"]}</div><small>受付 9:00〜18:00（土日祝を除く）</small>
    <p style="margin:16px 0 0;font-size:14px">〒{ORG["zip"]} {ORG["pref"]}{ORG["city"]}{ORG["street"]}</p>{'<a class="btn" href="#form">お問い合わせフォーム</a>' if MODE == "wp" else '<a class="btn" href="https://www.triocareer.jp/contact/" target="_blank" rel="noopener">お問い合わせフォーム</a>'}</div>
  <div class="rv"><div class="sub-h" style="margin-top:0">施設の電話番号</div><div class="tbl"><table>{rows}</table></div></div>
</div></section>{'<section class="wrap cfsec" id="form"><div class="eyebrow">Form</div><div class="sub">お問い合わせフォーム</div><p class="cflead">内容を確認のうえ、担当者からご連絡します。<span class="nw">施設の見学・ご利用のご相談は、</span><span class="nw">各施設へのお電話が便利です。</span></p><div class="cfbox"><!--TRIO:CF7:234--></div></section>' if MODE == "wp" else ''}'''
    write("contact.html", "お問い合わせ｜トリオキャリア株式会社", "トリオキャリア株式会社へのお問い合わせ。本社の電話番号（03-6450-7390）と、各施設の電話番号の一覧です。", body, "contact.html", [ORG_LD, crld])

if __name__ == "__main__":
    p_index(); p_facilities(); p_business(); p_biz(); p_about(); p_recruit(); p_news(); p_contact()
    for f in F: p_facility(f)
    print("pages:", sorted(p.name for p in OUT.glob("*.html")))
