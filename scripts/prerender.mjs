import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.FRONTEND_BUILD_DIR || path.join(root, 'client/dist');
const routes = JSON.parse(await readFile(path.join(root, 'client/src/data/publicRoutes.json'), 'utf8'));
const app = await readFile(path.join(dist, 'index.html'), 'utf8');
await writeFile(path.join(dist, 'app.html'), app);
await writeFile(path.join(dist, 'routes-manifest.json'), JSON.stringify(routes));
const source = process.env.PRERENDER_API_BASE || 'https://myconvertertool.com';
const getJson = async url => {
  const response = await fetch(source + url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Cannot load public build data: ${url} (${response.status})`);
  return response.json();
};
const stats = await getJson('/api/stats/total');
const blog = await getJson('/api/blog/posts?limit=9');
const types = { '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.html':'text/html', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      const data = url.pathname === '/api/stats/total' ? stats : url.pathname === '/api/blog/posts' ? { ...blog, posts: (blog.posts || []).slice(0, Math.min(Number(url.searchParams.get('limit')) || 9, 9)) } : {};
      res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); return;
    }
    const filename = path.resolve(dist, '.' + decodeURIComponent(url.pathname));
    if (!filename.startsWith(dist + path.sep) && filename !== dist) { res.writeHead(400); res.end(); return; }
    let body = app, type = 'text/html';
    if (filename !== dist) {
      try { if ((await stat(filename)).isFile()) { body = await readFile(filename); type = types[path.extname(filename)] || 'application/octet-stream'; } } catch { /* SPA route. */ }
    }
    res.writeHead(200, {'Content-Type':type}); res.end(body);
  } catch (error) { res.writeHead(500); res.end(error.message); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await puppeteer.launch({headless:true,timeout:60000,protocolTimeout:60000,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1']});
  let page;
  for (const route of [...routes, {path:'/__not-found__', title:'Page Not Found - MyConverterTool'}]) {
    if (page) await page.close();
    page = await browser.newPage();
    await page.setViewport({width:1440,height:1000});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
    await page.setRequestInterception(true);
    page.on('request', request => { if (request.url().startsWith(base + '/') || /^(data:|blob:|about:)/.test(request.url())) request.continue(); else request.abort(); });
    console.log('Prerendering', route.path);
    const errors = [];
    const onError = error => errors.push(error.message);
    page.on('pageerror', onError);
    await page.goto(base + route.path, {waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForSelector('h1', {timeout:60000});
    await page.waitForFunction(title => document.title === title, {timeout:30000}, route.title);
    await page.evaluate(() => document.fonts.ready);
    if (errors.length) throw new Error(route.path + ': ' + errors.join('; '));
    const snapshot = await page.evaluate(origin => {
      const clone = document.documentElement.cloneNode(true);
      for (const element of clone.querySelectorAll('[style]')) {
        if (element.style.opacity === '0') element.style.opacity = '1';
        if (element.style.transform) element.style.transform = 'none';
      }
      for (const element of clone.querySelectorAll('[href],[src]')) {
        for (const name of ['href','src']) { const value = element.getAttribute(name); if (value?.startsWith(origin)) element.setAttribute(name, value.slice(origin.length) || '/'); }
      }
      for (const tag of clone.querySelectorAll('title,meta[name="description"],meta[name="keywords"],meta[name="robots"],meta[name^="twitter:"],meta[property^="og:"],link[rel="canonical"],script[type="application/ld+json"]')) tag.setAttribute('data-initial-seo', 'true');
      const slot = clone.querySelector('[data-page-content]');
      slot.innerHTML = '<!--route-content-->' + slot.innerHTML + '<!--/route-content-->';
      return '<!doctype html>\n' + clone.outerHTML;
    }, base);
    const filename = route.path === '/__not-found__' ? path.join(dist, '404.html') : path.join(dist, route.path.slice(1), 'index.html');
    await mkdir(path.dirname(filename), {recursive:true}); await writeFile(filename, snapshot);
    page.off('pageerror', onError);
    console.log('Prerendered', route.path);
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + routes.map(route => `<url><loc>https://myconvertertool.com${route.path}</loc></url>`).join('') + '</urlset>';
  await writeFile(path.join(dist, 'sitemap.xml'), xml);
  await writeFile(path.join(root, 'client/public/sitemap.xml'), xml);
} finally {
  if (browser) await browser.close();
  server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
