// GA4 本番確認（2026-11-03）：3ホストの公開ページで、①HTML のタグ ②ブラウザの送信（/g/collect）を調べる。
// 送信は途中で止める（abort）ので、本番 GA4 には確認アクセスを届けない。③受信は GA4 の画面で別に確認する。
// フォームは入力欄にフォーカスして1文字入れるだけ。送信ボタンは押さない（本番の問い合わせは送らない）。
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || 'corp-mirror/ga4check';
const SITES = {
  corp: ['https://www.triocareer.jp', ['/', '/company/', '/service/', '/service/childcare/', '/service/childcare/trioland-komazawa/',
    '/service/after-school/', '/service/after-school/lopp/', '/service/digilumi/', '/service/callcenter/', '/company/recruit/',
    '/contact/', '/information/', '/bussiness-information/1092/', '/privacy/']],
  hoiku: ['https://hoiku.triocareer.jp', ['/', '/komazawa.html', '/umegaoka.html', '/contact.html', '/recruit.html', '/faq.html',
    '/column.html', '/column/gosui-check-anzen.html', '/recruit/', '/recruit/around-20-capacity-nursery-job.html',
    '/recruit/nursery-shift-hours-check-guide.html']],
  afterschool: ['https://afterschool.triocareer.jp', ['/', '/lopp.html', '/compass.html', '/approach.html', '/availability.html',
    '/contact.html', '/recruit.html', '/column/hoikushi-houkago-day.html']],
};
const IDRE = /\b(G-[A-Z0-9]{6,12}|GTM-[A-Z0-9]{4,10}|UA-\d{4,10}-\d{1,3}|AW-\d{6,12})\b/g;
function parseHits(req) {
  const u = new URL(req.url());
  const base = Object.fromEntries(u.searchParams);
  const body = req.postData() || '';
  const lines = body.split('\n').filter(Boolean);
  const evs = (lines.length ? lines : ['']).map(l => Object.assign({}, base, Object.fromEntries(new URLSearchParams(l))));
  return evs.map(e => {
    const ep = {}; for (const k of Object.keys(e)) if (k.startsWith('ep.') || k.startsWith('epn.')) ep[k] = e[k];
    return { tid: e.tid, en: e.en, dl: e.dl, dh: (() => { try { return new URL(e.dl).host; } catch (x) { return ''; } })(),
      dbg: e._dbg || e['ep.debug_mode'] || '', tt: e['ep.traffic_type'] || '', ep };
  });
}
(async () => {
  const only = (process.env.SITES || 'corp,hoiku,afterschool').split(',');
  const b = await chromium.launch();
  const rep = { checked: new Date().toISOString(), run: process.env.GITHUB_RUN_ID || '', sites: {} };
  for (const key of only) {
    const [B, paths] = SITES[key];
    const site = rep.sites[key] = { base: B, pages: [] };
    for (const path of paths) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
      await ctx.addInitScript(() => { try { localStorage.setItem('trio_ga_debug', '1'); } catch (e) {} });
      const hits = [], loads = [];
      await ctx.route('**/*', route => {
        const r = route.request(), u = r.url();
        if (/googletagmanager\.com\/gtag\/js/.test(u)) loads.push(u.replace(/^.*id=/, ''));
        if (/(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)\/(g|[a-z]\/collect|j\/collect|collect)/.test(u) && /collect/.test(u)) {
          hits.push(...parseHits(r)); return route.abort();
        }
        return route.continue();
      });
      const p = await ctx.newPage();
      const pg = { path, status: 0, html: {}, gtagLoaded: [], hits: [], actions: [] };
      try {
        const res = await p.goto(B + path, { waitUntil: 'load', timeout: 60000 });
        pg.status = res ? res.status() : 0;
        await p.waitForTimeout(4000);
        const html = await p.content();
        pg.html = { ids: [...new Set(html.match(IDRE) || [])], gtagScripts: (html.match(/googletagmanager\.com\/gtag\/js/g) || []).length,
          gtm: (html.match(/googletagmanager\.com\/gtm\.js/g) || []).length, analyticsJs: (html.match(/google-analytics\.com\/analytics\.js/g) || []).length,
          trioMarker: (html.match(/trio-ga4/g) || []).length, siteKit: (html.match(/Site Kit|googlesitekit/g) || []).length,
          exunitGa: (html.match(/vkExUnit.*analytics|veu.*gtag/gi) || []).length };
        const before = hits.length;
        // フォームの入力開始（送信はしない）
        if (await p.$('#inquiry-form [name=name], form.wpcf7-form input[type=text]')) {
          await p.focus('#inquiry-form [name=name], form.wpcf7-form input[type=text]').catch(() => {});
          await p.keyboard.type('x').catch(() => {});
          await p.waitForTimeout(2500);
          pg.actions.push({ action: 'form_focus_type', newHits: hits.slice(before).map(h => h.en) });
        }
        // 問い合わせ・採用への導線のクリック（画面は移動させない）
        const b2 = hits.length;
        const clicked = await p.evaluate(() => {
          addEventListener('click', e => e.preventDefault());
          const a = [...document.querySelectorAll('a[href]')].find(x => /contact|recruit|tel:/.test(x.getAttribute('href')) && x.offsetParent !== null);
          if (!a) return '';
          a.click(); return a.getAttribute('href').replace(/^tel:.*/, 'tel:');
        }).catch(() => '');
        if (clicked) { await p.waitForTimeout(2500); pg.actions.push({ action: 'cta_click ' + clicked, newHits: hits.slice(b2).map(h => h.en) }); }
      } catch (e) { pg.error = e.message; }
      pg.gtagLoaded = loads; pg.hits = hits;
      pg.pageViews = hits.filter(h => h.en === 'page_view').length;
      site.pages.push(pg);
      await ctx.close();
    }
  }
  await b.close();
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(OUT + '/report.json', JSON.stringify(rep, null, 1));
  const L = ['checked ' + rep.checked + ' run ' + rep.run];
  for (const [k, s] of Object.entries(rep.sites)) {
    L.push('## ' + k + ' ' + s.base);
    for (const pg of s.pages) {
      const tids = [...new Set(pg.hits.map(h => h.tid))].join(',');
      const evs = pg.hits.map(h => h.en + (h.dh ? '@' + h.dh : '')).join(' ');
      L.push(`${pg.path} ${pg.status} htmlIDs=[${pg.html.ids || ''}] gtagScripts=${pg.html.gtagScripts} gtm=${pg.html.gtm} ua=${pg.html.analyticsJs} trio=${pg.html.trioMarker} loaded=[${pg.gtagLoaded}] page_view=${pg.pageViews} tid=[${tids}] events=[${evs}]` + (pg.error ? ' ERROR ' + pg.error : ''));
      for (const a of pg.actions) L.push('   ' + a.action + ' -> [' + a.newHits.join(',') + ']');
    }
  }
  fs.writeFileSync(OUT + '/summary.txt', L.join('\n') + '\n');
  console.log(L.join('\n'));
})();
