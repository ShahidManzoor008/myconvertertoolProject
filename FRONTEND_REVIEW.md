# Frontend, responsive layout and SEO improvements

Deployed to myconvertertool.com on 2026-11-06.

## Improvements

- Replaced the overlapping tablet header with responsive navigation. The brand remains visible on phones. Removed the redundant desktop sidebar and excessive top spacing; standardized heading sizes, content widths and primary actions.
- Improved keyboard focus, skip navigation, mobile menu focus trapping, Escape/return focus, scroll locking and desktop resize behavior. Added missing control names, larger touch targets and reduced-motion styles. Corrected narrow QR previews and small-screen form typography.
- Checked light/dark layouts. Optional histories and public API requests tolerate unavailable browser storage. Corrected PWA names and icon paths. Removed an unsupported user-rating claim.
- Prerendered all 20 public routes with content, one main heading, a unique title/description/canonical, absolute social images and structured data. The initial document is useful without JavaScript. JavaScript startup removes initial metadata before mounting to avoid duplicate tags.
- Added a branded 1200×630 sharing image. Blog pages receive sanitized article HTML and metadata from live data. Unknown pages return HTTP 404; account pages are noindex. The sitemap includes current blog articles and excludes private pages.
- Deferred the ~645 KB PDF preview bundle until preview is needed, deferred the admin layout, removed unused remote font requests and hosted the icon font locally. Enabled HTTP/2 and gzip for JS/CSS/JSON/XML/SVG, preserving immutable asset caching and old assets for open tabs.
- Expanded the TLS certificate to cover www.myconvertertool.com. HTTP and www now redirect to the canonical HTTPS apex domain.

## Validation

- 20 public pages × six widths (320, 390, 768, 1024, 1440, 1920px): 120 layout/metadata checks, followed by targeted checks of corrected pages.
- 36 targeted checks found no missing control labels, duplicate metadata or page exceptions. One immediate post-resize navigation measurement was rechecked after layout settled: its right edge was 304px inside a 320px viewport.
- Menu keyboard navigation, dark mode, JavaScript-disabled content, blocked storage and iPhone 13/Android Pixel 2 emulation were checked in Chromium. Emulation does not establish compatibility with actual Safari or Firefox engines.
- 11 frontend tests and 3 server SEO tests passed. Lint and the production build passed. Full npm dependency audit reports zero vulnerabilities.
- No Search Console/CrUX field data was available, so no claim is made that field Core Web Vitals or rankings have passed a threshold. No formal accessibility certification is claimed.

## Operation and rollback

`npm run build --workspace client` now prerenders public routes and needs Chrome/Chromium plus access to the public API. `PRERENDER_API_BASE` can select another API source. `FRONTEND_BUILD_DIR` supports an isolated candidate build. CI and Docker build configuration were updated; the Docker image was not built on this host.

Previous frontend: `/home/ubuntu/.local/state/frontend-optimization/rollback-dist`.
Previous source/configuration: `/home/ubuntu/.local/state/frontend-optimization/before`.
Screenshots and audit results: `/tmp/frontend-audit` (also archived in the state directory).

The changes follow [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) and use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as an accessibility design reference. Field performance should subsequently be monitored against [Core Web Vitals](https://web.dev/articles/vitals).
