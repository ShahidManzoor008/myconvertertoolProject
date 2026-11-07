import test from 'node:test';
import assert from 'node:assert/strict';
import { renderArticleHtml, renderPageHtml, makeSitemap } from '../utils/pageSeo.js';
const template='<!doctype html><html><head><title>Home</title><meta data-rh="true" name="description" content="Old"><script data-rh="true" type="application/ld+json">{"old":true}</script></head><body><main><!--route-content-->Home<!--/route-content--></main></body></html>';
test('article HTML replaces homepage metadata and sanitizes untrusted content', () => {
  const html=renderArticleHtml(template,{title:'Guide </title><script>alert(1)</script>',slug:'safe-guide',excerpt:'A useful guide & reference.',author:'Author',createdAt:'2026-11-01',updatedAt:'2026-11-06',coverImage:'javascript:alert(1)',content:'<h1>Subheading</h1><p>Content</p><img src="x" onerror="alert(1)"><script>bad()</script>'});
  assert.equal((html.match(/<title\b/g)||[]).length,1);
  assert.equal((html.match(/name="description"/g)||[]).length,1);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes('<h2>Subheading</h2>'));
  assert.ok(!html.includes('onerror=')); assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('https://myconvertertool.com/blog/safe-guide'));
  const schema=JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'],'Article');assert.equal(schema.image,'https://myconvertertool.com/assets/og-default.png');
});
test('protected page HTML carries noindex without stale homepage content', () => {
  const html=renderPageHtml(template,{title:'Sign in',description:'Account',pathname:'/login',robots:'noindex, follow',content:'<h1>Sign in</h1>'});
  assert.ok(html.includes('content="noindex, follow"'));assert.ok(!html.includes('>Home<'));
});
test('sitemap includes canonical public routes and new article modification dates', () => {
  const xml=makeSitemap([{path:'/'},{path:'/tools'}],[{slug:'new-guide',updatedAt:'2026-11-06T00:00:00Z'}]);
  assert.ok(xml.includes('/blog/new-guide</loc><lastmod>2026-11-06</lastmod>'));
  assert.ok(!xml.includes('/login'));
});
