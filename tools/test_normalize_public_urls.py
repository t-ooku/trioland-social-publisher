import tempfile
import unittest
from pathlib import Path
from normalize_public_urls import canonical_url, normalize_html, normalize_sitemap, validate


class PublicUrlTests(unittest.TestCase):
    def test_html(self):
        self.assertEqual(canonical_url('https://hoiku.triocareer.jp/komazawa.html'), 'https://hoiku.triocareer.jp/komazawa')

    def test_directory_index(self):
        for a, b in [('/index.html', '/'), ('/recruit/index.html', '/recruit/')]:
            self.assertEqual(canonical_url('https://hoiku.triocareer.jp' + a), 'https://hoiku.triocareer.jp' + b)

    def test_keep_fragments_and_queries(self):
        self.assertEqual(canonical_url('https://hoiku.triocareer.jp/contact.html?a=1#form'), 'https://hoiku.triocareer.jp/contact?a=1#form')

    def test_leave_other_hosts_api_assets(self):
        for url in ['https://www.triocareer.jp/a.html', 'https://afterschool.triocareer.jp/a.html',
                    'https://hoiku.triocareer.jp/api/x.html', 'https://hoiku.triocareer.jp/file.pdf',
                    '/recruit.html#form', 'https://hoiku.triocareer.jp/recruit/']:
            self.assertEqual(canonical_url(url), url)

    def test_metadata_only(self):
        text = '<link rel="canonical" href="https://hoiku.triocareer.jp/contact.html"><meta property="og:url" content="https://hoiku.triocareer.jp/contact.html"><a href="/contact.html#form">相談</a><script>fetch("https://x.workers.dev/api/inquiry")</script>'
        fixed = normalize_html(text)
        self.assertIn('href="https://hoiku.triocareer.jp/contact"', fixed)
        self.assertIn('content="https://hoiku.triocareer.jp/contact"', fixed)
        self.assertIn('href="/contact.html#form"', fixed)
        self.assertIn('https://x.workers.dev/api/inquiry', fixed)
        self.assertEqual(normalize_html(fixed), fixed)

    def test_single_quotes_and_reordered_attrs(self):
        self.assertEqual(normalize_html("<LINK href='https://hoiku.triocareer.jp/faq.html' REL='canonical'>"), "<LINK href='https://hoiku.triocareer.jp/faq' REL='canonical'>")

    def test_sitemap_deduplication_and_idempotency(self):
        text = '<urlset><url><loc>https://hoiku.triocareer.jp/faq.html</loc><lastmod>2026-11-09</lastmod></url><url><loc>https://hoiku.triocareer.jp/faq</loc></url></urlset>'
        fixed = normalize_sitemap(text)
        self.assertEqual(fixed.count('<url>'), 1)
        self.assertIn('<lastmod>2026-11-09</lastmod>', fixed)
        self.assertEqual(normalize_sitemap(fixed), fixed)

    def test_validation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'index.html').write_text('<link rel="canonical" href="https://hoiku.triocareer.jp/">')
            (root / 'sitemap.xml').write_text('<urlset><url><loc>https://hoiku.triocareer.jp/</loc></url></urlset>')
            self.assertEqual(validate(root), [])
            (root / 'index.html').write_text('<link rel="canonical" href="https://hoiku.triocareer.jp/index.html"><meta name="robots" content="noindex">')
            self.assertEqual(len(validate(root)), 2)


if __name__ == '__main__':
    unittest.main()
