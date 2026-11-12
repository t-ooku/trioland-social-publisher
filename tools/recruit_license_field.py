"""保育HP（site/）の採用フォームに「お持ちの資格」の選択欄を入れる。build_site.py のあとに CI で毎回呼ぶ。

2026-11-12 馬場さんの依頼：「保育士資格保有、子育て支援員研修修了、無資格の選択欄を作ってほしい」。
- 選択は必須（ブラウザ側で確認。資格がない方は「無資格」を選ぶ）。
- 送信先（/api/inquiry）には license として送り、担当者に届くメール本文（message）の先頭にも
  「資格：…」を入れる（Make のメールは message を必ず使うため。希望職種・希望園と同じ扱い）。
何度走らせても結果は同じ。build_site.py に同じ欄が入ったら、このツールは何もしない。
対象の目印が見つからないときは止まる（壊れたフォームを公開しない）。
"""
import pathlib
import sys

FIELD = """
    <div class="field"><label for="f-license">お持ちの資格 <span class="req">必須</span></label>
      <select id="f-license" name="license" required>
        <option value="">選択してください</option>
        <option value="保育士資格保有">保育士資格保有</option>
        <option value="子育て支援員研修修了">子育て支援員研修修了</option>
        <option value="無資格">無資格</option>
      </select></div>"""
FIELD_ANCHOR = '<p class="hint">メールアドレスと電話番号は、どちらか一方で構いません。</p>'
MSG_ANCHOR = '    INVALID_DESTINATION: "ご希望の園を選択してください。",\n'
MSG_ADD = '    LICENSE_REQUIRED: "お持ちの資格を選んでください（資格がない方は「無資格」）。",\n'
JS_ANCHOR = '    if (data.destination === "recruit") {\n      var details = [];\n'
JS_NEW = '''    if (data.destination === "recruit") {
      var licenseField = form.querySelector('[name="license"]');
      if (licenseField && !data.license) {
        show(MESSAGES.LICENSE_REQUIRED, "error");
        licenseField.focus();
        return;
      }
      var details = [];
      if (data.license) details.push("資格：" + data.license);
'''


def patch(html):
    if 'data-ga-form="nursery_recruit"' not in html or 'id="f-license"' in html:
        return html
    for anchor in (FIELD_ANCHOR, MSG_ANCHOR, JS_ANCHOR):
        if html.count(anchor) != 1:
            raise SystemExit(f"recruit form anchor not found once: {anchor[:40]!r}")
    html = html.replace(FIELD_ANCHOR, FIELD_ANCHOR + FIELD)
    html = html.replace(MSG_ANCHOR, MSG_ANCHOR + MSG_ADD)
    return html.replace(JS_ANCHOR, JS_NEW)


def main(root):
    site = pathlib.Path(root)
    changed = 0
    for f in sorted(site.rglob("*.html")):
        before = f.read_text(encoding="utf-8")
        after = patch(before)
        if after != before:
            f.write_text(after, encoding="utf-8")
            changed += 1
    forms = [f for f in site.rglob("*.html") if 'data-ga-form="nursery_recruit"' in f.read_text(encoding="utf-8")]
    if not forms or any('id="f-license"' not in f.read_text(encoding="utf-8") for f in forms):
        raise SystemExit("recruit form without the license field")
    print(f"recruit license field: {changed} pages updated, {len(forms)} recruit forms checked")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "site")
