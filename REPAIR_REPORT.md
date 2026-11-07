# Project repairs — 2026-11-06

Addressed the inspection findings:

- Profile password changes now use the Argon2 save hook, exclude sensitive fields from responses, and invalidate other sessions. Inactive accounts cannot keep using existing sessions or sign in through Google. JWTs include a unique session identifier.
- ZIP downloads reject unsafe filenames, use independent temporary directories, wait for downloads before cleanup, inspect file types with the supported API, and bound file count and total size.
- Remote downloads require an explicit hostname allowlist, validate public DNS addresses on every redirect, pin connections to checked addresses, and limit download size and duration.
- Frontend editor and batch URLs match the mounted backend routes; ZIP responses are handled as binary blobs.
- Uploads use UUID filenames, enforce file/count/request limits, and reject excess concurrent conversion work. Text rendering retains a lock through Chrome cleanup. LibreOffice runs with argument arrays and a timeout.
- Failed conversions return explicit per-file errors instead of HTTP 200 with an empty array.
- Validation, malformed JSON, oversize JSON and CORS failures return appropriate client errors. API limits no longer count static assets.
- HTTP logs redact authorization and cookie headers. Internal notification sending requires admin access and reports provider failure instead of returning false success.
- Updated dependencies, consolidated installation under the root workspace lockfile, and removed circular workspace self-dependencies. Node 24 is required; Docker and CI configurations are updated accordingly.
- Removed duplicate Prism language imports that crashed the built code formatter; verified actual formatting in Chrome. Corrected font CSP for the Express-served frontend.

## Verification

- Backend: 30 tests passed against a separate MongoDB instance on loopback port 27018.
- Frontend: 7 tests passed; lint passed; production build passed.
- Local merge-library patch: 3 regression tests passed.
- Production middleware: 1 integration test passed (asset access, API rate limits, CORS and font policy).
- Full npm audit, including development dependencies: zero vulnerabilities reported.
- Candidate API checks passed for password updates/login, unique sessions, ZIP integrity, traversal/internal URL rejection and DOCX document contents.
- Browser checks confirmed home, PDF converter, blog, JSON formatter, code formatter, Markdown-to-DOCX and mobile PDF page rendering. Actual code beautification passed without page errors.

## Maintenance

`vendor/deepmerge` is a documented MIT-licensed patch of 4.3.1 used only by development tooling. It rejects prototype-manipulating keys in both merge inputs; its local version is 4.3.2 to satisfy consumer semver ranges. This does not represent an upstream release. Replace it when a fixed upstream version is available and keep its regression tests.

Use Node 24 and the root lockfile. `TESTING.md` documents safe test database requirements and runtime limits. Email delivery still requires valid SMTP/SendGrid configuration. Remote batch fetching remains disabled unless approved domains are configured. The Docker configuration was updated but the image was not built on this host.

Previous source is retained under `/home/ubuntu/.local/state/server-repair/source-backup`; release dependencies and frontend are retained under `/home/ubuntu/.local/state/server-repair/release-20261106` after rollout.

## Live rollout

Applied to myconvertertool.com and saved in PM2 with the dedicated Node 24.22.2 interpreter. The production homepage and API return HTTP 200, www CORS works, unapproved origins return 403, real Markdown-to-PDF conversion and ZIP integrity checks passed, and the corrected editor route responds as expected. The served homepage matches the verified build exactly. Old hashed frontend assets were retained for open browser tabs. No system services are failed. A read-only production database check found zero accounts with non-Argon2 password values.

The production backend binds to 127.0.0.1:5000 behind nginx. The temporary candidate server and test MongoDB instance have been stopped. Source changes are left uncommitted for review.
