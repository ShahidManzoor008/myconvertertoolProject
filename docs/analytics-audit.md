# Analytics and maintenance audit — 2026-11-14

## Verified against the agreed plan

- Essential authentication uses an HttpOnly session cookie. Legacy browser JWTs can be migrated; new login responses omit the JWT.
- Optional analytics defaults to disabled; acceptance/rejection is remembered, and preferences can be reopened from the footer.
- New metrics are daily counts, grouped by tool, outcome, failure category, and registered/anonymous audience. No filenames or contents are stored in these metrics.
- Visitor markers expire after 30 days and account daily records after 90 days. These TTL indexes were verified in production, along with the 90-day legacy conversion TTL.
- Admin analytics and cleanup routes require a current admin session. Maintenance previews include app temporary files older than six hours, expired records, and resource status.
- Cleanup preserves new aggregate metrics and excludes blog image folders. System/PM2/Nginx logs use separate rotation; this page does not purge those logs.
- Live consent endpoint returns 200 and defaults to disabled. Unauthenticated admin analytics returns 401. Unknown pages return 404, admin pages have noindex, and API responses use no-store.

## Corrections prepared during this audit

- Removed the API's twenty-tool truncation, which undercounted summary totals.
- Added success/failure events to JSON format/minify actions.
- Classified `invalid input` consistently as input errors.
- Updated authentication regression tests to assert cookie sessions rather than JWT response bodies; added analytics regression tests.

## Remaining gaps and limitations

- Account activity is stored and available to the account dashboard API, but admin Users does not yet show a per-account activity view.
- There are resource indicators and cleanup controls, but no admin action for clearing a managed application cache.
- Visitor statistics cover consented browsers, not all visitors or people. The anonymous unique count is explicitly a rolling 30-day count even when another report range is selected.
- Legacy conversion rows expire; totals that include these rows may decrease as legacy data expires. New aggregate counters survive cleanup.
- The old deployment report in the conversation named the wrong frontend path. Nginx serves `/home/ubuntu/myconvertertoolProject/client/dist`; `/var/www/myconvertertool` is not the active frontend root.
- There is no production `/health` endpoint; it is mounted only in tests. API reachability was verified with the consent/configuration endpoints instead.

The corrections above were approved for production release after this audit. Release status is recorded in Git and the deployment report.

## Validation

- 21 isolated backend tests passed across analytics, password authentication, and Google authentication (Google token verification mocked).
- Two production middleware checks passed.
- JSON formatter and text clipboard UI checks passed individually. The initial broader frontend run was stopped after a timeout under resource contention; a complete frontend suite is not claimed.
- Changed frontend file passed ESLint; backend syntax and Git whitespace checks passed.
- The temporary MongoDB process and its data directory were removed after testing. Production records and temporary uploads were not purged by this audit.
