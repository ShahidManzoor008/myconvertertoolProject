# Project checks

Use Node.js 24 (`nvm use` reads `.nvmrc`) and install from the repository root:

```sh
PUPPETEER_SKIP_DOWNLOAD=true CYPRESS_INSTALL_BINARY=0 npm ci
```

The root `package-lock.json` is the authoritative workspace lockfile. Do not run independent installs in `client/` or `server/`.

Run backend tests against a dedicated local MongoDB instance or container, never production. `MONGO_URI_TEST` must use `localhost` or `127.0.0.1` and a database name ending in `_test`. Test setup ignores the production `MONGODB_URI`. The fixtures delete users and sessions in the selected test database.

```sh
MONGO_URI_TEST=mongodb://127.0.0.1:27018/myconvertertool_test npm test --workspace server
node --test vendor/deepmerge/security.test.cjs server/tests/middleware.node-test.mjs
npm test --workspace client
npm run lint --workspace client
npm run build --workspace client
npm audit
```

CI starts its own MongoDB service and runs these checks. The local `vendor/deepmerge` package is a documented security patch for development tooling; keep its regression tests until a patched upstream release can replace it.

Production PDF conversion additionally needs LibreOffice and Chrome. Install the browser for the server account with `npx puppeteer browsers install chrome`. The Docker image uses system Chromium instead. Docker Compose builds from the repository root and keeps MongoDB data in a named volume.

The backend listens on loopback by default behind nginx. Set `HOST=0.0.0.0` when running it in a container. Conversion endpoints accept at most five files, 75 MB per file and 100 MB per request, and reject concurrent conversion requests with HTTP 503 and a retry hint. The frontend allows 95 MB combined to leave room for multipart overhead. Batch ZIP downloads accept up to 20 MB total; JSON requests are also subject to the 10 MB body limit. Remote batch URLs require an explicit `ALLOWED_DOWNLOAD_DOMAINS` allowlist, public DNS addresses, and safe redirect destinations.

## Audit regression and browser checks

The server suite includes PDF validation, actual DOCX generation, compression size,
blog pagination, and exact-match legacy article corrections. The frontend suite covers
UTF-8/binary Base64, numeric fidelity, string-safe JSON repair, minifier semantics,
QR payload escaping, Unicode counts, truthful progress, and clipboard errors.

Build the candidate outside the production-served directory:

```sh
FRONTEND_BUILD_DIR=/tmp/myconvertertool-audit-build npm run build --workspace client
```

With a dedicated MongoDB on loopback port 27018, run the local QA server in one terminal:

```sh
LOG_LEVEL=fatal node scripts/audit-server.mjs
```

In another terminal:

```sh
node scripts/verify-public-tools.mjs
```

Both scripts reject non-local targets. The QA server seeds only the explicitly selected
local `_test` database and uses a temporary upload directory. Browser checks use real
candidate APIs and independently decode QR images with `jsqr`; they write screenshots,
downloads, and JSON results under `/tmp/myconvertertool-browser-results`.
`AUDIT_CHECK_FILTER` selects named checks for a targeted rerun, and `AUDIT_OUTPUT_DIR`
selects a separate evidence directory. Chromium coverage does not establish Safari or
Firefox compatibility or field Core Web Vitals.

Check the generated public page metadata after building:

```sh
FRONTEND_BUILD_DIR=/tmp/myconvertertool-audit-build node scripts/check-prerender.mjs
```

The check verifies one title, description, H1, canonical URL, absolute social image,
image alt presence, valid JSON-LD, and a noindex 404 page. It does not claim Google
indexing, ranking, rich-result eligibility, or full accessibility compliance.

## Markdown document conversion

Run `npm run test:markdown --workspace server` with Node 24 and Chrome installed.
This standalone suite does not connect to MongoDB. It checks all supported math
delimiters, code and currency preservation, sanitization, actual DOCX media and
PDF image embedding, plus Markdown upload validation. See
[the conversion guide](docs/markdown-conversion.md) for syntax and limitations.
It also converts the full reported mathematics stress-test fixture to both
formats, checking all 170 equation images and three Pandoc simple tables.
The test files run sequentially to keep browser memory use within small-server
limits.

## Tool entry and home page UI

The frontend suite checks that tool navigation focuses the workspace without
opening a mobile keyboard, and that the searchable tool list comes before the
category section. To check actual desktop and phone layouts after building a
candidate, run:

```sh
FRONTEND_BUILD_DIR=/tmp/myconvertertool-audit-build node scripts/verify-tool-navigation.mjs
```

This browser check serves the candidate on loopback and mocks API responses;
it does not contact production APIs. It checks all ten tool links at desktop
and phone widths, direct navigation at 320 px, file selection, search, section
order, and dark mode. Screenshots and results are saved under
`/tmp/myconvertertool-ui-checks` (override with `UI_CHECK_OUTPUT`).
