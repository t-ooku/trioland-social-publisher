"""放デイサイト（afterschool/site）の URL を「.html なし」にそろえる。build_site.py のあとに CI で毎回呼ぶ。

配信先の Cloudflare Pages は /approach.html を /approach へ転送して配信する。
canonical・og:url・構造化データ・サイトマップ・サイト内リンクが .html のままだと、Google は転送元の URL を見に行き、
Search Console に「ページにリダイレクトがあります」「代替ページ」として出る（2026-11-12 に 11件＋1件を確認）。
ここで転送後の形に書き換え、Google に最初から配信される URL を渡す。何度走らせても結果は同じ。
"""
import pathlib
import re

SITE = pathlib.Path(__file__).resolve().parent.parent / "site"
# "/approach.html" "https://afterschool.triocareer.jp/column/x.html?kind=…" などを .html なしにする。
# /assets/ 以下（PDF など）と外部サイトは対象にしない。
PATTERN = re.compile(r'(["\'>])((?:https://afterschool\.triocareer\.jp)?/(?:column/)?[a-z0-9][a-z0-9-]*)\.html(?=[?#"\'<])')


def pretty(text):
    return PATTERN.sub(r"\1\2", text)


def main():
    files = sorted(SITE.rglob("*.html")) + [SITE / "sitemap.xml"]
    changed = 0
    for f in files:
        before = f.read_text(encoding="utf-8")
        after = pretty(before)
        if after != before:
            f.write_text(after, encoding="utf-8")
            changed += 1
    left = [str(f.relative_to(SITE)) for f in files if PATTERN.search(f.read_text(encoding="utf-8"))]
    if left:
        raise SystemExit(f"still has .html links: {left}")
    print(f"pretty URLs: {changed} files updated, {len(files)} checked")


if __name__ == "__main__":
    main()
