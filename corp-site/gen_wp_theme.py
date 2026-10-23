# トリオキャリア HP：試作版（gen4.py）から WordPress テーマ「trio-career」を作る（2026-10-20）。
# 使い方：python3 gen_wp.py  → scratchpad/theme/trio-career/ と trio-career.zip
# 画像・動画は corp4/a、CSS・JS は corp4/assets から取る（試作版と同じもの）。でじるみ本部の写真は入れない（掲載許可が出るまで）。
import os, re, sys, json, shutil, pathlib, zipfile, hashlib, html

os.environ["TRIO_MODE"] = "wp"
S = pathlib.Path("/tmp/claude-0/-home-claude/79e7618f-a508-5a14-b194-2bf7b5ffae0d/scratchpad")
sys.path.insert(0, str(S))
import gen_pages as G  # noqa: E402  （gen_pages.py＝試作版のページ生成）

VERSION = os.environ.get("TRIO_THEME_VERSION", "1.0.0")
T = S / "theme" / "trio-career"
SRC = S / "corp4"

# 試作版のページ → 本番の URL（今の WordPress の URL をできるだけそのまま使う。新しいページだけ新しい URL）
ROUTE = {
    "index.html": "", "facilities.html": "facilities", "business.html": "service",
    "hoiku.html": "service/childcare", "afterschool.html": "service/after-school",
    "digilumi.html": "service/digilumi", "callcenter.html": "service/callcenter",
    "about.html": "company", "recruit.html": "company/recruit", "news.html": "information", "contact.html": "contact",
    "f-komazawa.html": "service/childcare/trioland-komazawa", "f-umegaoka.html": "service/childcare/trioland-umegaoka",
    "f-lopp.html": "service/after-school/lopp", "f-compass.html": "service/after-school/compasmile",
    "f-dg-ota.html": "service/digilumi/tokyooota", "f-dg-abiko.html": "service/digilumi/chibaabiko",
    "f-dg-ichikawa.html": "service/digilumi/chibaichikawa", "f-dg-utsunomiya.html": "service/digilumi/tochigiutsunomiya",
    "f-dg-chuo.html": "service/digilumi/chibacyuo", "f-dg-oyama.html": "service/digilumi/tochigioyama",
}
def url(p): return "/" + p + "/" if p else "/"

def transform(doc):
    doc = re.sub(r'<div class="proto">.*?</div>\n?', "", doc)
    def h(m):
        name, frag = m.group(1), m.group(2) or ""
        return f'href="{url(ROUTE[name])}{frag}"' if name in ROUTE else m.group(0)
    doc = re.sub(r'href="([a-z0-9-]+\.html)(#[^"]*)?"', h, doc)
    doc = re.sub(r'\b(src|poster|data-src)="(?:\.\./)?a/', r'\1="{{A}}/a/', doc)
    doc = doc.replace("url(../a/", "url({{A}}/a/")
    doc = doc.replace('href="assets/site.css"', 'href="{{A}}/assets/site.css?ver={{V}}"').replace('src="assets/site.js"', 'src="{{A}}/assets/site.js?ver={{V}}"')
    # canonical・構造化データ・パンくずの URL
    for f in G.F:
        doc = doc.replace(f'{G.BASE}/facilities/{f["k"]}/', G.BASE + url(ROUTE[f["page"]]))
    for name, p in ROUTE.items():
        if name == "index.html": continue
        doc = doc.replace(f'{G.BASE}/{name[:-5]}/', G.BASE + url(p))
    return doc

PAGES = {}
def wp_write(path, title, desc, body, active, ld=None):
    head = G.page_head(title, desc, path, ld)
    doc = (f'<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
           f'{head}\n<!--TRIO:HEAD-->\n</head><body>\n<!--TRIO:BODY-->\n{G.header(active)}\n<main id="top">{body}</main>\n{G.footer()}\n<script src="assets/site.js"></script>\n<!--TRIO:FOOT-->\n</body></html>\n')
    PAGES[path] = transform(doc)
G.write = wp_write

def build_pages():
    G.p_index(); G.p_facilities(); G.p_business(); G.p_biz(); G.p_about(); G.p_recruit(); G.p_news(); G.p_contact()
    for f in G.F: G.p_facility(f)

PHP_GUARD = "<?php defined('ABSPATH') || exit; ?>"

def main():
    if T.exists(): shutil.rmtree(T)
    (T / "pages").mkdir(parents=True); (T / "parts").mkdir(); (T / "inc").mkdir(); (T / "assets").mkdir()
    build_pages()
    used = set()
    for path, doc in PAGES.items():
        name = path[:-5]
        (T / "pages" / f"{name}.php").write_text(PHP_GUARD + "\n" + doc, encoding="utf-8")
        used |= set(re.findall(r'\{\{A\}\}/a/([^"\'?)\s]+)', doc))
    # 動的なページ（記事・一覧・固定ページ）用の共通部品
    (T / "parts" / "head.html").write_text(G.FONTS + '\n<link rel="stylesheet" href="{{A}}/assets/site.css?ver={{V}}">\n', encoding="utf-8")
    (T / "parts" / "header-news.html").write_text(transform(G.header("news.html")), encoding="utf-8")
    (T / "parts" / "header.html").write_text(transform(G.header("")), encoding="utf-8")
    (T / "parts" / "footer.html").write_text(transform(G.footer()), encoding="utf-8")
    (T / "parts" / "phead-news.html").write_text('<section class="phead"><div class="wrap"><div class="eyebrow">News</div><p class="sub phead-t">お知らせ</p></div></section>', encoding="utf-8")
    (T / "parts" / "cta.html").write_text(transform(G.cta()), encoding="utf-8")
    used |= set(re.findall(r'\{\{A\}\}/a/([^"\'?)\s]+)', "".join(p.read_text() for p in (T / "parts").iterdir())))
    # CSS が参照する画像も
    css = (SRC / "base.css").read_text(encoding="utf-8") + (SRC / "extra.css").read_text(encoding="utf-8")
    used |= set(re.findall(r'\.\./a/([^"\'?)\s]+)', css))
    (SRC / "assets" / "site.css").write_text((SRC / "base.css").read_text(encoding="utf-8") + (SRC / "extra.css").read_text(encoding="utf-8"), encoding="utf-8")
    shutil.copy(SRC / "assets" / "site.css", T / "assets" / "site.css")
    shutil.copy(SRC / "assets" / "site.js", T / "assets" / "site.js")
    (T / "a").mkdir()
    missing = []
    for n in sorted(used):
        fac_photo = n.startswith("h-dg-") or re.fullmatch(r"dg-(ota|abiko|ichikawa|utsunomiya|chuo|oyama)\.webp", n)
        if not G.DG_OK and n.startswith(("dg", "h-dg")) and not (G.DG_FAC_OK and fac_photo):
            raise SystemExit(f"でじるみ本部の写真がテーマに入りそう：{n}")
        src = SRC / "a" / n
        if src.exists(): shutil.copy(src, T / "a" / n)
        else: missing.append(n)
    if missing: raise SystemExit(f"見つからない素材：{missing}")
    # URL の対応表（PHP）
    routes_php = "<?php defined('ABSPATH') || exit;\n// 本番の URL（先頭・末尾の / なし）→ pages/ のファイル名。gen_wp.py が作る。\nreturn " + php_array({p: n[:-5] for n, p in ROUTE.items()}) + ";\n"
    (T / "inc" / "routes.php").write_text(routes_php, encoding="utf-8")
    for fn, body in PHP_FILES.items():
        (T / fn).parent.mkdir(parents=True, exist_ok=True)
        (T / fn).write_text(body.replace("@@VERSION@@", VERSION), encoding="utf-8")
    shutil.copy(S / "theme_screenshot.png", T / "screenshot.png") if (S / "theme_screenshot.png").exists() else None
    # zip（フォルダ名 trio-career ごと）。A＝写真・動画入り／B＝軽い版＋写真・動画（メディアに入れる用）
    z = S / "theme" / "trio-career.zip"
    zl = S / "theme" / "trio-career-light.zip"
    zm = S / "theme" / "trio-career-media.zip"
    for x in (z, zl, zm):
        if x.exists(): x.unlink()
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf, zipfile.ZipFile(zl, "w", zipfile.ZIP_DEFLATED) as zfl, zipfile.ZipFile(zm, "w", zipfile.ZIP_STORED) as zfm:
        for p in sorted(T.rglob("*")):
            if not p.is_file(): continue
            rel = str(p.relative_to(T))
            zf.write(p, "trio-career/" + rel)
            if rel.startswith("a/"): zfm.write(p, "trio-career-media/" + p.name)
            else: zfl.write(p, "trio-career/" + rel)
    tot = sum(p.stat().st_size for p in T.rglob("*") if p.is_file())
    print(f"theme: {len(PAGES)} pages, {len(list((T/'a').iterdir()))} media, {tot/1e6:.1f} MB → {z} ({z.stat().st_size/1e6:.1f} MB)")

def php_array(d):
    return "array(\n" + "".join(f"  {php_str(k)} => {php_str(v)},\n" for k, v in d.items()) + ")"
def php_str(s): return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"

PHP_FILES = {}
PHP_FILES["style.css"] = """/*
Theme Name: Trio Career
Theme URI: https://www.triocareer.jp/
Author: トリオキャリア株式会社
Description: トリオキャリア株式会社のコーポレートサイト用テーマ（2026年10月リニューアル）。トップ・事業紹介・施設マップ・各施設・会社案内・採用情報・お問い合わせは pages/ のデザインで表示し、お知らせは WordPress の投稿から表示します。
Version: @@VERSION@@
Requires at least: 6.0
Requires PHP: 7.0
Text Domain: trio-career
*/
/* 見た目は assets/site.css にあります。 */
"""
PHP_FILES["functions.php"] = r"""<?php
/**
 * Trio Career テーマ
 * - 決まった URL（inc/routes.php）は pages/ のデザインをそのまま表示する
 * - お知らせ（投稿）・カテゴリー・固定ページ（プライバシーポリシーなど）は同じ見た目で表示する
 * - 古い URL は新しいページへ 301 転送する
 */
defined('ABSPATH') || exit;
define('TRIO_VERSION', '@@VERSION@@');

function trio_routes() {
	static $r = null;
	if ($r === null) { $r = include __DIR__ . '/inc/routes.php'; }
	return $r;
}

/** 今の URL のパス（サイトの基準からの相対、前後の / なし、日本語はデコード） */
function trio_path() {
	$uri  = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/';
	$path = (string) parse_url($uri, PHP_URL_PATH);
	$base = (string) parse_url(home_url('/'), PHP_URL_PATH);
	if ($base !== '' && $base !== '/' && strpos($path, $base) === 0) { $path = substr($path, strlen($base)); }
	return trim(rawurldecode($path), '/');
}

/** pages/ のデザインで出すページか */
function trio_current_route() {
	static $page = false;
	if ($page !== false) { return $page; }
	$page = null;
	if (is_admin() || is_feed() || is_search() || is_preview() || (defined('REST_REQUEST') && REST_REQUEST)) { return $page; }
	$path   = trio_path();
	$routes = trio_routes();
	if (!isset($routes[$path])) { return $page; }
	// トップ（/）は、固定ページをトップに設定していても pages/index を出す。?p=123 など URL で記事を指定されたときだけ WordPress に任せる
	if ($path === '') { foreach (array('p', 'page_id', 'cat', 'm', 'preview', 'attachment_id') as $k) { if (isset($_GET[$k])) { return $page; } } }
	$page = $routes[$path];
	return $page;
}

/* ---------------------------------------------------------------- 古い URL の転送 */
add_action('template_redirect', function () {
	$path = trio_path();
	$map = array(
		'company/companyoutline' => '/company/#company',
		'thought'                => '/company/#philosophy',
		'facilities/komazawa'    => '/service/childcare/trioland-komazawa/',
		'facilities/umegaoka'    => '/service/childcare/trioland-umegaoka/',
	);
	$to = isset($map[$path]) ? $map[$path] : null;
	if ($to === null && preg_match('#^author/#', $path)) { $to = '/information/'; } // 投稿者ページ（ログイン名が出る）は使わない
	if ($to !== null) { wp_safe_redirect(home_url($to), 301); exit; }
}, 0);

/* ---------------------------------------------------------------- pages/ のページを出す */
add_action('template_redirect', function () {
	$page = trio_current_route();
	if (!$page) { return; }
	global $wp_query;
	if ($wp_query) { $wp_query->is_404 = false; }
	status_header(200);
	echo trio_render(__DIR__ . '/pages/' . $page . '.php');
	exit;
}, 5);

function trio_render($file) {
	ob_start();
	include $file;
	return trio_fill(ob_get_clean());
}

/** {{A}}（テーマの場所）・{{V}}（版）と <!--TRIO:…--> の差し込み */
function trio_fill($html) {
	$html = preg_replace_callback('#\{\{A\}\}/a/([A-Za-z0-9._-]+)#', function ($m) { return esc_url(trio_media_url($m[1])); }, $html);
	$html = str_replace(array('{{A}}', '{{V}}'), array(esc_url(get_template_directory_uri()), TRIO_VERSION), $html);
	return preg_replace_callback('/<!--TRIO:([A-Z0-9]+)(?::(\d+))?-->/', function ($m) {
		$n = isset($m[2]) ? (int) $m[2] : 0;
		switch ($m[1]) {
			case 'HEAD':     return trio_head_extra();
			case 'BODY':     ob_start(); if (function_exists('wp_body_open')) { wp_body_open(); } return ob_get_clean();
			case 'FOOT':     ob_start(); wp_footer(); return ob_get_clean();
			case 'NEWS':     return trio_news_items($n ? $n : 4);
			case 'NEWSLIST': return trio_news_list();
			case 'CF7':      return trio_form($n);
		}
		return '';
	}, $html);
}

/**
 * 写真・動画の URL。テーマの a/ にあればそれを使い、なければメディアライブラリから同じファイル名を探す
 * （アップロードの上限が小さいサーバーでは、テーマを軽い版にして写真・動画をメディアに入れる＝手順書の「B」）
 */
function trio_media_url($name) {
	static $map = null;
	if (file_exists(__DIR__ . '/a/' . $name)) { return get_template_directory_uri() . '/a/' . $name; }
	if ($map === null) { $map = get_option('trio_media_map', array()); if (!is_array($map)) { $map = array(); } }
	if (isset($map[$name])) { return $map[$name]; }
	global $wpdb;
	$base = pathinfo($name, PATHINFO_FILENAME); $ext = pathinfo($name, PATHINFO_EXTENSION);
	$rows = $wpdb->get_col($wpdb->prepare(
		"SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key = '_wp_attached_file' AND (meta_value = %s OR meta_value LIKE %s OR meta_value LIKE %s)",
		$name, '%/' . $wpdb->esc_like($name), '%/' . $wpdb->esc_like($base) . '-_.' . $wpdb->esc_like($ext)
	));
	if ($rows) {
		usort($rows, function ($a, $b) { return strlen($a) - strlen($b); });
		$up = wp_get_upload_dir();
		$url = trailingslashit($up['baseurl']) . $rows[0];
		$map[$name] = $url; update_option('trio_media_map', $map, false);
		return $url;
	}
	return get_template_directory_uri() . '/a/' . $name;
}

/** wp_head() の中身から、こちらで出しているもの（title・description・canonical・OGP・構造化データなど）を除く */
function trio_head_extra() {
	ob_start();
	wp_head();
	$h = ob_get_clean();
	$pat = array(
		'#<title>.*?</title>\s*#s',
		'#<meta\s+name=["\']description["\'][^>]*>\s*#i',
		'#<meta\s+name=["\']keywords["\'][^>]*>\s*#i',
		'#<link\s+rel=["\']canonical["\'][^>]*>\s*#i',
		'#<meta\s+property=["\'](og|fb|article):[^>]*>\s*#i',
		'#<meta\s+name=["\']twitter:[^>]*>\s*#i',
		'#<script\s+type=["\']application/ld\+json["\'][^>]*>.*?</script>\s*#is',
		'#<meta\s+name=["\']generator["\'][^>]*>\s*#i',
	);
	return preg_replace($pat, '', $h);
}

/* ---------------------------------------------------------------- お知らせ（投稿） */
function trio_news_items($n) {
	$q = new WP_Query(array('post_type' => 'post', 'posts_per_page' => $n, 'ignore_sticky_posts' => true, 'no_found_rows' => true));
	$o = '';
	foreach ($q->posts as $p) {
		$o .= '<li><a href="' . esc_url(get_permalink($p)) . '"><time datetime="' . esc_attr(get_the_date('Y-m-d', $p)) . '">' . esc_html(get_the_date('Y.m.d', $p)) . '</time>' . esc_html(get_the_title($p)) . '</a></li>';
	}
	return $o ? $o : '<li><span class="empty">お知らせはまだありません。</span></li>';
}

function trio_news_rows($posts) {
	$o = '';
	foreach ($posts as $p) {
		$cats = get_the_category($p->ID);
		$cat  = $cats ? '<span class="cat">' . esc_html($cats[0]->name) . '</span>' : '<span></span>';
		$o .= '<li><a href="' . esc_url(get_permalink($p)) . '"><time datetime="' . esc_attr(get_the_date('Y-m-d', $p)) . '">' . esc_html(get_the_date('Y.m.d', $p)) . '</time>' . $cat . '<span class="tt">' . esc_html(get_the_title($p)) . '</span></a></li>';
	}
	return $o;
}

function trio_news_list() {
	$paged = max(1, (int) (isset($_GET['pg']) ? $_GET['pg'] : 1));
	$q = new WP_Query(array('post_type' => 'post', 'posts_per_page' => 20, 'paged' => $paged, 'ignore_sticky_posts' => true));
	if (!$q->posts) { return '<p class="empty">お知らせはまだありません。</p>'; }
	$o = '<ul class="list">' . trio_news_rows($q->posts) . '</ul>';
	if ($q->max_num_pages > 1) {
		$o .= '<nav class="pager" aria-label="ページ">';
		for ($i = 1; $i <= $q->max_num_pages; $i++) {
			$o .= $i === $paged ? '<span class="current">' . $i . '</span>' : '<a href="' . esc_url(add_query_arg('pg', $i, home_url('/information/'))) . '">' . $i . '</a>';
		}
		$o .= '</nav>';
	}
	return $o;
}

/* ---------------------------------------------------------------- お問い合わせフォーム（Contact Form 7 をそのまま使う） */
function trio_form($id) {
	$id   = (int) apply_filters('trio_contact_form_id', $id);
	$code = '[contact-form-7 id="' . $id . '"]';
	$out  = shortcode_exists('contact-form-7') ? do_shortcode($code) : '';
	if ($out === '' || $out === $code || strpos($out, '<form') === false) {
		return '<p>フォームを表示できませんでした。お手数ですが、お電話（03-6450-7390／受付 9:00〜18:00・土日祝を除く）でお問い合わせください。</p>';
	}
	return $out;
}

/* ---------------------------------------------------------------- 共通の設定 */
/* ---------------------------------------------------------------- Search Console・アクセス解析（外観 → カスタマイズ →「計測・Search Console」で入れる） */
function trio_clean_code($v) { return preg_replace('/[^A-Za-z0-9_\-]/', '', (string) $v); }
function trio_gsc_code($v) {
	// <meta name="google-site-verification" content="…"> を丸ごと貼っても、content の中身だけ取り出す
	if (preg_match('/content=["\']([^"\']+)["\']/', (string) $v, $m)) { $v = $m[1]; }
	return trio_clean_code($v);
}
add_action('customize_register', function ($c) {
	$c->add_section('trio_measure', array('title' => '計測・Search Console', 'priority' => 160,
		'description' => 'Google Search Console の「HTML タグ」の確認コードと、Google アナリティクス 4 の測定 ID（G- から始まる）を入れます。空欄なら何も出しません。'));
	$c->add_setting('trio_gsc', array('type' => 'option', 'default' => '', 'sanitize_callback' => 'trio_gsc_code'));
	$c->add_control('trio_gsc', array('section' => 'trio_measure', 'label' => 'Search Console の確認コード（HTML タグをそのまま貼っても可）', 'type' => 'text'));
	$c->add_setting('trio_ga4', array('type' => 'option', 'default' => '', 'sanitize_callback' => 'trio_clean_code'));
	$c->add_control('trio_ga4', array('section' => 'trio_measure', 'label' => 'GA4 の測定 ID（例：G-XXXXXXXXXX）', 'type' => 'text'));
});
add_action('wp_head', function () {
	// 初期値：放課後デイのサイトで確認済みの、オーナーの Google アカウントの確認コード（2026-10-07 c1283a6）。カスタマイズで別のコードを入れたらそちらを使う
	$g = trio_gsc_code(get_option('trio_gsc', '') !== '' ? get_option('trio_gsc') : 'GGR_eaakJpEhbyW9CRI4FER9Gov1ET9YTNrP6fPFnAI');
	if ($g !== '') { echo '<meta name="google-site-verification" content="' . esc_attr($g) . "\">\n"; }
	$a = trio_clean_code(get_option('trio_ga4', ''));
	if ($a !== '' && strpos($a, 'G-') === 0) {
		echo '<script async src="https://www.googletagmanager.com/gtag/js?id=' . esc_attr($a) . '"></script>' . "\n";
		echo "<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','" . esc_js($a) . "');</script>\n";
	}
}, 1);

add_action('after_setup_theme', function () {
	add_theme_support('post-thumbnails');
	add_theme_support('automatic-feed-links');
	add_theme_support('html5', array('search-form', 'gallery', 'caption', 'style', 'script'));
});

// 余計な出力を減らす（バージョン番号・絵文字・旧式のリンク）
remove_action('wp_head', 'wp_generator');
remove_action('wp_head', 'rsd_link');
remove_action('wp_head', 'wlwmanifest_link');
remove_action('wp_head', 'wp_shortlink_wp_head');
remove_action('wp_head', 'rel_canonical');
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');
add_filter('the_generator', '__return_empty_string');

// pages/ のデザインのページでは、ブロック用・プラグインの CSS を読まない（フォームの CSS だけ残す）
add_action('wp_enqueue_scripts', function () {
	if (!trio_current_route()) { return; }
	global $wp_styles;
	$keep = array('contact-form-7', 'admin-bar', 'dashicons');
	foreach ((array) $wp_styles->queue as $h) {
		if (!in_array($h, $keep, true)) { wp_dequeue_style($h); }
	}
	wp_dequeue_style('global-styles');
	foreach (array('vkExUnit_smooth-js', 'vkExUnit_master-js') as $h) { wp_dequeue_script($h); }
}, 999);
add_action('wp_print_styles', function () {
	if (trio_current_route()) { wp_dequeue_style('global-styles'); }
}, 999);

/* ---------------------------------------------------------------- サイトマップ（wp-sitemap.xml） */
add_filter('wp_sitemaps_add_provider', function ($provider, $name) {
	return $name === 'users' ? false : $provider; // 投稿者（ログイン名）は載せない
}, 10, 2);
add_filter('wp_sitemaps_posts_query_args', function ($args, $post_type) {
	if ($post_type !== 'page') { return $args; }
	$ids = array();
	foreach (array_keys(trio_routes()) as $p) {
		if ($p === '') { continue; }
		$pg = get_page_by_path($p);
		if ($pg) { $ids[] = $pg->ID; }
	}
	foreach (array('thought', 'company/companyoutline') as $p) { $pg = get_page_by_path($p); if ($pg) { $ids[] = $pg->ID; } }
	if ($ids) { $args['post__not_in'] = array_merge(isset($args['post__not_in']) ? (array) $args['post__not_in'] : array(), $ids); }
	return $args;
}, 10, 2);
add_action('init', function () {
	if (!function_exists('wp_register_sitemap_provider') || !class_exists('WP_Sitemaps_Provider')) { return; }
	require_once __DIR__ . '/inc/sitemap.php';
	wp_register_sitemap_provider('trio', new Trio_Sitemap_Provider());
});

/* ---------------------------------------------------------------- 動的なページの共通の外枠 */
function trio_layout_open($title, $desc, $canonical, $nav = 'news', $noindex = false) {
	echo "<!doctype html>\n<html lang=\"ja\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n";
	echo '<title>' . esc_html($title) . "</title>\n";
	if ($desc !== '') { echo '<meta name="description" content="' . esc_attr($desc) . "\">\n"; }
	if ($canonical) { echo '<link rel="canonical" href="' . esc_url($canonical) . "\">\n"; }
	if ($noindex) { echo "<meta name=\"robots\" content=\"noindex,follow\">\n"; }
	echo '<meta property="og:type" content="' . (is_singular('post') ? 'article' : 'website') . '"><meta property="og:title" content="' . esc_attr($title) . '"><meta property="og:site_name" content="トリオキャリア株式会社"><meta property="og:locale" content="ja_JP">' . "\n";
	if ($canonical) { echo '<meta property="og:url" content="' . esc_url($canonical) . '">'; }
	echo '<meta property="og:image" content="' . esc_url(get_template_directory_uri() . '/a/v-minna.webp') . '"><meta name="twitter:card" content="summary_large_image">' . "\n";
	echo trio_fill(file_get_contents(__DIR__ . '/parts/head.html') . '<!--TRIO:HEAD-->');
	echo "</head><body>\n" . trio_fill('<!--TRIO:BODY-->');
	echo trio_fill(file_get_contents(__DIR__ . '/parts/' . ($nav === 'news' ? 'header-news.html' : 'header.html')));
	echo "\n<main id=\"top\">";
}
function trio_layout_close($cta = true) {
	echo $cta ? trio_fill(file_get_contents(__DIR__ . '/parts/cta.html')) : '';
	echo "</main>\n" . trio_fill(file_get_contents(__DIR__ . '/parts/footer.html'));
	echo "\n<script src=\"" . esc_url(get_template_directory_uri()) . '/assets/site.js?ver=' . TRIO_VERSION . "\"></script>\n";
	echo trio_fill('<!--TRIO:FOOT-->') . "\n</body></html>\n";
}
function trio_crumbs($items) {
	$o = '<nav class="crumb wrap" aria-label="パンくず">';
	$parts = array();
	foreach ($items as $it) {
		$parts[] = $it[1] ? '<a href="' . esc_url($it[1]) . '">' . esc_html($it[0]) . '</a>' : '<span aria-current="page">' . esc_html($it[0]) . '</span>';
	}
	return $o . implode(' / ', $parts) . '</nav>';
}
function trio_phead($en, $ja, $lead = '') {
	return '<section class="phead"><div class="wrap"><div class="eyebrow">' . esc_html($en) . '</div><h1 class="sub">' . esc_html($ja) . '</h1>' . ($lead !== '' ? '<p>' . esc_html($lead) . '</p>' : '') . '</div></section>';
}
/** 本文に VK All in One Expansion Unit が足すもの（SNS ボタン・フォロー・関連記事・CTA）を外す。テーマ側に同じ役割の部品があるため */
function trio_clean_content($html) {
	if (!class_exists('DOMDocument') || trim($html) === '') { return $html; }
	$prev = libxml_use_internal_errors(true);
	$d = new DOMDocument();
	$d->loadHTML('<?xml encoding="utf-8" ?><div id="trio-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
	libxml_clear_errors(); libxml_use_internal_errors($prev);
	$x = new DOMXPath($d);
	$kill = array('veu_socialSet', 'veu_followSet', 'veu_relatedPosts', 'veu_cta', 'veu_contentAddSection', 'veu_childPage', 'veu_pageList_ancestor');
	foreach ($kill as $c) {
		foreach (iterator_to_array($x->query('//*[contains(concat(" ", normalize-space(@class), " "), " ' . $c . ' ")]')) as $n) { $n->parentNode->removeChild($n); }
	}
	$root = $d->getElementById('trio-root');
	if (!$root) { return $html; }
	$o = '';
	foreach ($root->childNodes as $c) { $o .= $d->saveHTML($c); }
	return $o;
}
function trio_the_content() {
	ob_start(); the_content(); echo trio_clean_content(ob_get_clean());
}
add_action('wp_enqueue_scripts', function () {
	if (trio_current_route()) { return; }
	foreach (array('vkExUnit_common_style', 'veu-cta', 'vk-font-awesome') as $h) { wp_dequeue_style($h); }
}, 999);

function trio_desc_of($post) {
	$t = has_excerpt($post) ? get_the_excerpt($post) : wp_strip_all_tags(strip_shortcodes($post->post_content));
	$t = trim(preg_replace('/\s+/u', ' ', $t));
	return mb_substr($t, 0, 110);
}
"""
PHP_FILES["inc/sitemap.php"] = r"""<?php
defined('ABSPATH') || exit;
/** pages/ のデザインのページ（トップ・事業紹介・施設・会社案内など）を wp-sitemap.xml に載せる */
class Trio_Sitemap_Provider extends WP_Sitemaps_Provider {
	public function __construct() { $this->name = 'trio'; $this->object_type = 'trio'; }
	public function get_url_list($page_num, $object_subtype = '') {
		$list = array();
		$mod  = gmdate('Y-m-d\TH:i:s+00:00', filemtime(__DIR__ . '/routes.php'));
		foreach (array_keys(trio_routes()) as $p) {
			$list[] = array('loc' => home_url($p === '' ? '/' : '/' . $p . '/'), 'lastmod' => $mod);
		}
		return $list;
	}
	public function get_max_num_pages($object_subtype = '') { return 1; }
}
"""
PHP_FILES["single.php"] = r"""<?php
defined('ABSPATH') || exit;
the_post();
$p    = get_post();
$cats = get_the_category();
$cat  = $cats ? $cats[0] : null;
trio_layout_open(get_the_title() . '｜お知らせ｜トリオキャリア株式会社', trio_desc_of($p), get_permalink());
echo trio_fill(file_get_contents(__DIR__ . '/parts/phead-news.html'));
echo trio_crumbs(array(array('ホーム', home_url('/')), array('お知らせ', home_url('/information/')), array(get_the_title(), null)));
?>
<article class="post wrap">
  <div class="meta"><time datetime="<?php echo esc_attr(get_the_date('Y-m-d')); ?>"><?php echo esc_html(get_the_date('Y.m.d')); ?></time><?php if ($cat) : ?><a class="cat" href="<?php echo esc_url(get_category_link($cat)); ?>"><?php echo esc_html($cat->name); ?></a><?php endif; ?></div>
  <h1><?php the_title(); ?></h1>
  <?php if (has_post_thumbnail()) : ?><figure class="thumb" style="margin:28px 0 0"><?php the_post_thumbnail('large', array('style' => 'width:100%;height:auto;border-radius:6px')); ?></figure><?php endif; ?>
  <div class="body"><?php trio_the_content(); ?></div>
  <nav class="nav" aria-label="前後のお知らせ">
    <div class="prev"><?php $pp = get_previous_post(); if ($pp) : ?><a href="<?php echo esc_url(get_permalink($pp)); ?>"><small>PREV</small><?php echo esc_html(get_the_title($pp)); ?></a><?php endif; ?></div>
    <div class="next"><?php $np = get_next_post(); if ($np) : ?><a href="<?php echo esc_url(get_permalink($np)); ?>"><small>NEXT</small><?php echo esc_html(get_the_title($np)); ?></a><?php endif; ?></div>
  </nav>
  <p class="back"><a class="btn" href="<?php echo esc_url(home_url('/information/')); ?>">お知らせ一覧へ</a></p>
</article>
<?php
trio_layout_close();
"""
PHP_FILES["archive.php"] = r"""<?php
defined('ABSPATH') || exit;
$label = is_category() ? single_cat_title('', false) : (is_tag() ? single_tag_title('', false) : (is_date() ? get_the_date(is_year() ? 'Y年' : 'Y年n月') : 'お知らせ'));
$link  = is_category() || is_tag() ? get_term_link(get_queried_object()) : home_url('/information/');
$paged = max(1, (int) get_query_var('paged'));
trio_layout_open($label . ($paged > 1 ? '（' . $paged . 'ページ目）' : '') . '｜お知らせ｜トリオキャリア株式会社', 'トリオキャリア株式会社のお知らせ（' . $label . '）の一覧です。', is_wp_error($link) ? '' : ($paged > 1 ? get_pagenum_link($paged) : $link));
echo trio_phead('News', $label);
echo trio_crumbs(array(array('ホーム', home_url('/')), array('お知らせ', home_url('/information/')), array($label, null)));
global $wp_query;
?>
<section class="wrap newsall">
<?php if (have_posts()) : ?>
  <ul class="list"><?php echo trio_news_rows($wp_query->posts); ?></ul>
  <?php $links = paginate_links(array('type' => 'array', 'prev_text' => '←', 'next_text' => '→')); if ($links) { echo '<nav class="pager" aria-label="ページ">' . implode('', $links) . '</nav>'; } ?>
<?php else : ?>
  <p class="empty">お知らせはまだありません。</p>
<?php endif; ?>
  <p class="back" style="margin-top:36px"><a class="btn" href="<?php echo esc_url(home_url('/information/')); ?>">お知らせ一覧へ</a></p>
</section>
<?php
trio_layout_close();
"""
PHP_FILES["index.php"] = r"""<?php
defined('ABSPATH') || exit;
// 投稿一覧（ブログのトップに設定されている場合など）は「お知らせ」と同じ見た目にする
require __DIR__ . '/archive.php';
"""
PHP_FILES["search.php"] = r"""<?php
defined('ABSPATH') || exit;
$s = get_search_query();
trio_layout_open('「' . $s . '」の検索結果｜トリオキャリア株式会社', '', '', 'none', true);
echo trio_phead('Search', '検索結果', '「' . $s . '」');
global $wp_query;
?>
<section class="wrap newsall">
<?php if (have_posts()) : ?>
  <ul class="list"><?php foreach ($wp_query->posts as $p) : ?><li><a href="<?php echo esc_url(get_permalink($p)); ?>"><time><?php echo esc_html(get_the_date('Y.m.d', $p)); ?></time><span></span><span class="tt"><?php echo esc_html(get_the_title($p)); ?></span></a></li><?php endforeach; ?></ul>
<?php else : ?>
  <p class="empty">見つかりませんでした。メニューからお探しください。</p>
<?php endif; ?>
</section>
<?php
trio_layout_close();
"""
PHP_FILES["page.php"] = r"""<?php
defined('ABSPATH') || exit;
// pages/ にない固定ページ（プライバシーポリシー・サイトマップなど）
the_post();
$p = get_post();
$crumbs = array(array('ホーム', home_url('/')));
foreach (array_reverse(get_post_ancestors($p)) as $aid) { $crumbs[] = array(get_the_title($aid), get_permalink($aid)); }
$crumbs[] = array(get_the_title(), null);
trio_layout_open(get_the_title() . '｜トリオキャリア株式会社', trio_desc_of($p), get_permalink(), 'none');
$en = array('privacy' => 'Privacy policy', 'sitemap-page' => 'Sitemap');
echo trio_phead(isset($en[$p->post_name]) ? $en[$p->post_name] : 'Information', get_the_title());
echo trio_crumbs($crumbs);
?>
<article class="post wrap"><div class="body"><?php trio_the_content(); ?></div></article>
<?php
trio_layout_close();
"""
PHP_FILES["404.php"] = r"""<?php
defined('ABSPATH') || exit;
status_header(404);
trio_layout_open('ページが見つかりません｜トリオキャリア株式会社', '', '', 'none', true);
echo trio_phead('404', 'ページが見つかりません', 'お探しのページは移動したか、なくなった可能性があります。');
?>
<section class="wrap" style="padding-block:40px 80px">
  <div class="links" style="display:flex;flex-wrap:wrap;gap:12px">
    <a class="btn" href="<?php echo esc_url(home_url('/')); ?>">トップへ</a>
    <a class="btn" href="<?php echo esc_url(home_url('/facilities/')); ?>">施設マップ</a>
    <a class="btn" href="<?php echo esc_url(home_url('/service/')); ?>">事業紹介</a>
    <a class="btn" href="<?php echo esc_url(home_url('/contact/')); ?>">お問い合わせ</a>
  </div>
</section>
<?php
trio_layout_close(false);
"""

if __name__ == "__main__":
    main()
