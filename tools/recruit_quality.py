"""採用ガイド（site/recruit/*.html）の品質をそろえる。CI（recruit-sitemap.yml）から毎回呼ぶ。何度走らせても結果は同じ。

1. 応募への導線：どの記事にも「応募・相談フォーム」「園見学」への直接リンクを置く。
   採用ページへのリンクは「30秒でわかるまとめ」（/recruit.html#summary）へ向ける。
2. 事実の統一：保育士・保育補助・看護師の記事で「勤務地は駒沢大学園（だけ）」と読める文を、
   採用ページと同じ「駒沢大学園・梅ヶ丘園の2園」に直す。調理スタッフの記事は募集状況が要確認のため触らない。
3. 存在しない記事へのリンクを、ある記事へ付け替える。

2026-10-18 Cowork（docs/seo/2026-10-18-cowork-recruit-audit.md）。
"""
import datetime, re, sys
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else 'site/recruit')
TODAY = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).date()

STD = '勤務地は、駒沢大学園（世田谷区野沢）と梅ヶ丘園（世田谷区梅丘）の2園です（2026年10月18日時点のトリオランド採用ページ）。'
R = {
 '公式採用ページで現在掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 '勤務地として掲載されているのは駒沢大学園です。': STD,
 '現在の掲載勤務地はトリオランド駒沢大学園です。': STD,
 '掲載勤務地はトリオランド駒沢大学園です。': STD,
 '現在同ページに掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 '現在掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 '2026年9月12日時点で、公式採用ページの保育補助スタッフ欄に掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 '現在の公開ページで勤務地として確認できるのはトリオランド駒沢大学園です。': STD,
 '現在の公式採用ページで保育士・保育補助の勤務地として掲載されているのは、東京都世田谷区野沢のトリオランド駒沢大学園です。': STD,
 '現在同ページで保育士・保育補助・調理スタッフの勤務地として確認できるトリオランドは駒沢大学園です。': '保育士・保育補助の' + STD,
 '2026年9月12日時点で、公式採用ページの保育士スタッフ欄に掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 '公式採用ページの保育補助スタッフ欄に掲載されている勤務地はトリオランド駒沢大学園で、住所は東京都世田谷区野沢2-33-5 グランドメゾン野沢103です。': '保育補助の勤務地は、駒沢大学園（東京都世田谷区野沢2-33-5 グランドメゾン野沢103）と梅ヶ丘園（世田谷区梅丘）の2園です（2026年10月18日時点のトリオランド採用ページ）。',
 '現在の公式採用ページで保育補助の勤務地として掲載されているのはトリオランド駒沢大学園です。': STD,
 '現在、上記3職種の勤務地として公式採用ページに掲載されているのはトリオランド駒沢大学園です。': '保育士・保育補助の' + STD,
 '勤務地として記載されているのは駒沢大学園です。': STD,
 '現在の公式採用ページで保育士スタッフの勤務地として掲載されているのはトリオランド駒沢大学園です。': STD,
 '公式採用ページでは勤務地として駒沢大学園が掲載されています。': STD,
 '現在の公式採用ページで保育士・保育補助の勤務地として掲載されているのはトリオランド駒沢大学園ですが、面接が必ず園内で行われるとは公開情報から確認できません。': '保育士・保育補助の勤務地は駒沢大学園と梅ヶ丘園の2園ですが、面接が必ず園内で行われるとは公開情報から確認できません。',
 '2026年9月17日に確認したトリオキャリア公式採用ページでは、保育士・保育補助の勤務地としてトリオランド駒沢大学園が掲載されています。': '保育士・保育補助の' + STD,
 '掲載勤務地は駒沢大学園です。': STD,
 '勤務時間は7:30〜20:30の間で応相談、勤務地として駒沢大学園が掲載されています。': '勤務時間は7:30〜20:30の間で応相談と掲載されています。' + STD,
 '2026年9月14日時点で、トリオキャリア公式採用ページの保育士・保育補助の勤務地として掲載されているのは、東京都世田谷区野沢のトリオランド駒沢大学園です。': '保育士・保育補助の' + STD,
 '勤務地は駒沢大学園と記載されています。': STD,
 '現在の公式採用ページでは、勤務地としてトリオランド駒沢大学園（東京都世田谷区野沢2-33-5 グランドメゾン野沢103）が掲載されています。': '勤務地は、駒沢大学園（東京都世田谷区野沢2-33-5 グランドメゾン野沢103）と梅ヶ丘園（世田谷区梅丘）の2園です（2026年10月18日時点のトリオランド採用ページ）。',
 '今回確認した公式採用ページで、保育士・保育補助の勤務地として掲載されているのはトリオランド駒沢大学園（東京都世田谷区野沢2-33-5）です。': '保育士・保育補助の' + STD,
 '現在、公式採用ページで保育士・保育補助の勤務地として掲載されているのは世田谷区野沢のトリオランド駒沢大学園です。': '保育士・保育補助の' + STD,
 '現在の公式採用ページでは、保育補助スタッフの勤務地としてトリオランド駒沢大学園が掲載されています。': '保育補助の' + STD,
 '現在の勤務地として掲載されているのは駒沢大学園です。': STD,
 '一方、2026年9月30日に確認した公式採用ページで保育士・保育補助・調理スタッフの勤務地として掲載されているのはトリオランド駒沢大学園です。': '一方、保育士・保育補助の' + STD,
 '2026年9月12日時点で、トリオキャリア公式採用ページの保育士スタッフ欄に掲載されている勤務地はトリオランド駒沢大学園です。': STD,
 'トリオキャリア公式採用ページでは、保育士・保育補助・給食やおやつの調理スタッフの勤務地としてトリオランド駒沢大学園（東京都世田谷区野沢2-33-5）が掲載されています。': '保育士・保育補助の勤務地は、駒沢大学園（東京都世田谷区野沢2-33-5）と梅ヶ丘園（世田谷区梅丘）の2園です（2026年10月18日時点のトリオランド採用ページ）。',
 '2026年9月18日に確認した公式採用ページでは、保育士・保育補助・調理スタッフの勤務地として駒沢大学園が掲載されています。': '',
 '現在の公式採用ページで保育士・保育補助の勤務地として掲載されているのはトリオランド駒沢大学園ですが': '保育士・保育補助の勤務地は駒沢大学園と梅ヶ丘園の2園ですが',
}
H = {'<h2>勤務地は駒沢大学園として掲載</h2>': '<h2>勤務地は駒沢大学園・梅ヶ丘園の2園</h2>',
     '勤務地はトリオランド駒沢大学園、勤務は': '勤務地は駒沢大学園・梅ヶ丘園の2園、勤務は',
     '・勤務地として掲載：トリオランド駒沢大学園<br>': '・勤務地：駒沢大学園（世田谷区野沢）／梅ヶ丘園（世田谷区梅丘）<br>'}
FACTS = {**R, **H}

LINKFIX = {
 '/recruit/hoiku-assistant-parent-contact-record-work-guide.html">保護者対応・記録業務の確認': '/recruit/hoiku-assistant-diaper-meal-care-role-guide.html">おむつ替え・食事介助の役割確認',
 '/recruit/nursery-cook-allergy-hygiene-work-guide.html': '/recruit/nursery-cook-allergy-meal-role-guide.html',
}

BLOCK = ('<div class="rc-apply" style="margin:36px 0 0;padding:18px 18px 14px;border:2px solid #f3c4d2;border-radius:16px;background:#fff">'
 '<strong style="display:block;margin-bottom:4px">応募・見学の相談はこちら</strong>'
 '<span style="display:block;font-size:14px;color:#5b6475;margin-bottom:8px">トリオランドの募集内容は<a href="/recruit.html#summary">30秒でわかるまとめ</a>で確認できます。</span>'
 '<a href="/recruit.html#form" style="display:inline-block;background:#e0577f;color:#fff;font-weight:800;text-decoration:none;border-radius:999px;padding:11px 20px;margin:4px 8px 4px 0">応募・相談フォームへ</a>'
 '<a href="/recruit.html#form" style="display:inline-block;border:2px solid #e0577f;color:#c23f68;font-weight:800;text-decoration:none;border-radius:999px;padding:9px 18px;margin:4px 0">採用前の園見学を相談する</a></div>')
# 2026-10-20：園見学ボタンの行き先を、保護者向けの /contact.html から採用の相談フォームへ（Codex の点検で判明）
OLD_BLOCK = re.compile(r'<div class="rc-apply"[^>]*>.*?園見学を申し込む</a></div>', re.S)

# 求人ガイド一覧（index.html）の文言：求職者に見せる言葉にする
INDEX_FIX = {
 '現在の募集有無や条件は各記事から公式採用情報をご確認ください。</p></section>':
 '募集中の職種・条件・応募方法は<a href="/recruit.html#summary">採用ページの「30秒でわかるまとめ」</a>にまとめています。応募や採用前の園見学のご相談は<a href="/recruit.html#form">採用の相談フォーム</a>からどうぞ。</p></section>',
 '<h2>求人SEOガイド</h2>': '<h2>テーマ別の求人ガイド</h2>',
}



def is_cook(name):
    return 'cook' in name or 'nutritionist' in name


H1 = {}
def h1_of(slug):
    """記事の見出し（「？」か「｜」まで）。関連リンクの表示名に使う"""
    if slug not in H1:
        f = ROOT / (slug + '.html')
        m = re.search(r'<h1[^>]*>(.*?)</h1>', f.read_text(encoding='utf-8'), re.S) if f.exists() else None
        s = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else ''
        cut = min([i + (1 if s[i] == '？' else 0) for i in (s.find('？'), s.find('｜')) if i >= 0] or [len(s)])
        H1[slug] = s[:cut]
    return H1[slug]


def fix_related_labels(t):
    """「関連する求人ガイド：〇〇」の表示名を、リンク先の記事の見出しにそろえる（調理の記事で「看護資格を生かす」と出ていた）"""
    def r(m):
        lab = h1_of(m.group(1))
        return f'<a href="/recruit/{m.group(1)}.html">関連する求人ガイド：{lab}</a>' if lab else m.group(0)
    t = re.sub(r'<a href="/recruit/([a-z0-9-]+)\.html">関連する求人ガイド：[^<]*</a>', r, t)
    # リンクの文字がファイル名のまま（例：hoiku assistant resume career guide）のものも見出しにする
    def s(m):
        slug, txt = m.group(1), m.group(2).strip().lower()
        if txt in (slug, slug.replace('-', ' ')) and h1_of(slug):
            return f'<a href="/recruit/{slug}.html">{h1_of(slug)}</a>'
        return m.group(0)
    return re.sub(r'<a href="/recruit/([a-z0-9-]+)\.html">([^<]*)</a>', s, t)


def fix(name, t):
    fact_changed = False
    if not is_cook(name):
        for a, b in FACTS.items():
            if a in t:
                t = t.replace(a, b); fact_changed = True
    for a, b in LINKFIX.items():
        t = t.replace(a, b)
    t = t.replace('/recruit.html#jobs', '/recruit.html#summary')
    t = OLD_BLOCK.sub(BLOCK, t)
    t = fix_related_labels(t)
    if 'class="rc-apply"' not in t:
        m = re.search(r'<(div|section) class="cta"', t) or re.search(r'</main>|</article>|<footer|</body>', t)
        if m:
            t = t[:m.start()] + BLOCK + t[m.start():]
        else:
            print('warning: no place for the apply block in', name)
    if fact_changed:  # 中身（事実）を直したときだけ更新日を進める
        t = re.sub(r'"dateModified":"\d{4}-\d{2}-\d{2}"', '"dateModified":"%s"' % TODAY.isoformat(), t)
        t = re.sub(r'更新日：\d{4}年\d{1,2}月\d{1,2}日', '更新日：%d年%d月%d日' % (TODAY.year, TODAY.month, TODAY.day), t)
    return t


def main():
    n = 0
    idx = ROOT / 'index.html'
    if idx.exists():
        o = idx.read_text(encoding='utf-8'); t = o
        for a, b in INDEX_FIX.items(): t = t.replace(a, b)
        if t != o: idx.write_text(t, encoding='utf-8'); n += 1
    for f in sorted(ROOT.glob('*.html')):
        if f.name == 'index.html':
            continue
        o = f.read_text(encoding='utf-8'); t = fix(f.name, o)
        if t != o:
            f.write_text(t, encoding='utf-8'); n += 1
    left = [f.name for f in ROOT.glob('*.html') if f.name != 'index.html' and 'recruit.html#form' not in f.read_text(encoding='utf-8')]
    print('recruit_quality: updated', n, 'files')
    if left:
        sys.exit('recruit_quality: no apply link in ' + ', '.join(left))


if __name__ == '__main__':
    main()
