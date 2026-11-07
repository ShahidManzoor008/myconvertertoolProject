# Production rollout — 2026-11-07

Deployed the verified audit fixes to https://myconvertertool.com.

## Rollout

- Preserved the previous frontend, backend source baseline, process metadata, and nginx configuration in `/home/ubuntu/.local/state/myconvertertool-deploy/20261107T035046Z`. This private directory is outside Git and includes protected operational files; do not publish it.
- Started the new backend temporarily on loopback port 5001 and verified database-backed read endpoints before routing traffic to it.
- Activated the tested frontend using an atomic directory exchange, retaining older hashed assets for existing browser tabs.
- Restarted the managed Node 24 server on port 5000 while the warmed server handled new traffic.
- Verified the managed server, restored the exact original nginx configuration, stopped the temporary server, and saved PM2 state.
- No production database migration, seed, or document update was performed. Blog corrections are applied when presenting exact legacy templates.

## Live verification

- 20 public pages returned HTTP 200 with expected H1, title, and canonical metadata.
- The served homepage matches the deployed build byte for byte: SHA-256 `54d30aeffda9d673e523498d72bf1ce6ba118626ca8ef06ae7884d74e7a8fc23`.
- HTTP and www entry points resolve to the canonical HTTPS apex domain.
- Unknown pages return 404; account pages carry noindex; the XML sitemap contains 27 URLs.
- Approved-origin API access returned 200; an unapproved origin returned 403.
- Live Chromium verified UTF-8 Base64 output and the previously missing QR form controls, without uncaught page errors.
- Production browser writes were blocked during verification, including usage-counter POSTs. Upload/conversion output accuracy was verified against the isolated candidate before release.

Evidence: [HTTP checks](docs/audit/live-http-results.json), [browser checks](docs/audit/live-browser-results.json), [live mobile QR](docs/audit/live-mobile-qr.png).

The normal managed process is `myconvertertool-server`, using Node 24.22.2 and loopback port 5000 behind nginx. Temporary deployment routing and processes have been removed. Google indexing/rankings and field Core Web Vitals have not been asserted.

Source publishing target: `ShahidManzoor008/myconvertertoolProject`, branch `main`. No credentials, runtime environment files, uploads, dependencies, or private rollback material belong in that commit.
