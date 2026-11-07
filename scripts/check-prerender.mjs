import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const directory = path.resolve(process.env.FRONTEND_BUILD_DIR || 'client/dist');
const routes = JSON.parse(await fs.readFile(path.join(directory, 'routes-manifest.json'), 'utf8'));
const results = [];
for (const route of routes) {
  const html = await fs.readFile(path.join(directory, route.path.slice(1), 'index.html'), 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  const canonicals = [...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/gi)];
  assert.equal((head.match(/<title\b/gi) || []).length, 1, route.path + ': title');
  assert.equal((head.match(/<meta\b[^>]*name="description"/gi) || []).length, 1, route.path + ': description');
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, route.path + ': H1');
  assert.equal(canonicals.length, 1, route.path + ': canonical count');
  assert.ok(canonicals[0][0].includes(`href="https://myconvertertool.com${route.path}"`), route.path + ': canonical URL');
  assert.match(head, /<meta\b[^>]*property="og:image"[^>]*content="https:\/\//i, route.path + ': social image');
  for (const image of html.match(/<img\b[^>]*>/gi) || []) assert.match(image, /\balt=/i, route.path + ': image alt attribute');
  for (const schema of head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) JSON.parse(schema[1]);
  results.push({ path: route.path, status: 'PASS' });
}
assert.match(await fs.readFile(path.join(directory, '404.html'), 'utf8'), /noindex/);
console.log(JSON.stringify({ publicRoutes: results, notFoundNoindex: 'PASS' }, null, 2));
