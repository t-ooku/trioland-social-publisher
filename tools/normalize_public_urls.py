"""Align Hoiku SEO signals with Cloudflare Pages' extensionless HTML URLs.

Physical filenames, navigation/form links, APIs and other hosts are unchanged.
Run after BOTH HTML generation and recruitment discovery synchronization.
"""
import argparse
import html
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from xml.etree import ElementTree as ET

HOST = 'hoiku.triocareer.jp'


def canonical_url(value):
    p = urlsplit(value)
    if p.scheme != 'https' or p.netloc != HOST or p.path.startswith('/api/'):
        return value
    path = p.path
    if path.endswith('/index.html'):
        path = path[:-10]
    elif path.endswith('.html'):
        path = path[:-5]
    return urlunsplit((p.scheme, p.netloc, path, p.query, p.fragment))


def attr_value(tag, name):
    m = re.search(r'\b' + re.escape(name) + r'\s*=\s*([\"\x27])(.*?)\1', tag, re.I | re.S)
    return html.unescape(m.group(2)) if m else ''


def replace_attr(tag, name):
    pattern = r'(\b' + re.escape(name) + r'\s*=\s*)([\"\x27])(.*?)\2'
    def change(m):
        original = html.unescape(m.group(3))
        new = canonical_url(original)
        if new == original:
            return m.group(0)
        return m.group(1) + m.group(2) + html.escape(new, quote=True) + m.group(2)
    return re.sub(pattern, change, tag, flags=re.I | re.S)


def normalize_html(text):
    def change(m):
        tag = m.group(0)
        if tag.lower().startswith('<link') and 'canonical' in attr_value(tag, 'rel').lower().split():
            return replace_attr(tag, 'href')
        if tag.lower().startswith('<meta') and attr_value(tag, 'property').lower() == 'og:url':
            return replace_attr(tag, 'content')
        return tag
    return re.sub(r'<(?:link|meta)\b[^>]*>', change, text, flags=re.I | re.S)


def normalize_sitemap(text):
    def change(m):
        return '<loc>' + html.escape(canonical_url(html.unescape(m.group(1))), quote=False) + '</loc>'
    text = re.sub(r'<loc>(.*?)</loc>', change, text, flags=re.S)
    seen = set()
    def unique(m):
        loc = re.search(r'<loc>(.*?)</loc>', m.group(0), re.S)
        if not loc:
            return m.group(0)
        if loc.group(1) in seen:
            return ''
        seen.add(loc.group(1))
        return m.group(0)
    return re.sub(r'<url\b[^>]*>.*?</url>', unique, text, flags=re.S)


class Canonicals(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls = []; self.noindex = False
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'link' and 'canonical' in d.get('rel', '').lower().split():
            self.urls.append(d.get('href', ''))
        if tag == 'meta' and d.get('name', '').lower() in ('robots', 'googlebot'):
            self.noindex |= 'noindex' in d.get('content', '').lower()


def validate(root):
    errors = []
    sm = root / 'sitemap.xml'
    urls = [n.text for n in ET.fromstring(sm.read_text()).findall('.//{*}loc')]
    if len(urls) != len(set(urls)):
        errors.append('duplicate sitemap URLs')
    for url in urls:
        if not url or not url.startswith('https://' + HOST + '/') or canonical_url(url) != url:
            errors.append('non-canonical sitemap URL: ' + str(url)); continue
        path = urlsplit(url).path
        f = root / (path.strip('/') + '/index.html' if path.endswith('/') else path.lstrip('/') + '.html')
        if path == '/':
            f = root / 'index.html'
        if not f.is_file():
            errors.append('missing HTML for: ' + url); continue
        h = Canonicals(); h.feed(f.read_text(encoding='utf-8'))
        if h.urls != [url]:
            errors.append('canonical does not match sitemap: ' + url + ' => ' + repr(h.urls))
        if h.noindex:
            errors.append('noindex in sitemap: ' + url)
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', nargs='?', default='site')
    parser.add_argument('--check', action='store_true', help='validate only; no writes')
    args = parser.parse_args(); root = Path(args.directory)
    changed = 0
    if not args.check:
        for f in sorted(root.rglob('*.html')) + [root / 'sitemap.xml']:
            old = f.read_text(encoding='utf-8')
            new = normalize_sitemap(old) if f.name == 'sitemap.xml' else normalize_html(old)
            if new != old:
                f.write_text(new, encoding='utf-8'); changed += 1
    errors = validate(root)
    print('public SEO URLs: changed', changed, 'files; validation errors', len(errors))
    if errors:
        raise SystemExit('\n'.join(errors))


if __name__ == '__main__':
    main()
