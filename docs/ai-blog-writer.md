# AI Writer operation

The writer reuses the existing MongoDB and Markdown publisher. It is disabled by
default. No production schedule or Google spending is activated by development.

## Admin control

Open **Admin → AI Writer**. Set topics, standing instructions, exclusions,
primary-source domains, publishing mode, timezone, start hour and 1–3 daily
attempts. The optional one-time brief applies only to the next manual article.
Examples: focus on free AI tools; explain technical terms; describe limitations;
avoid promotional language. Save settings before generating.

Every save increments a revision and cancels queued/running work. Pause and Cancel
abort requests in the current process. Cross-process state/revision and worker
lease checks prevent old work from publishing. Already consumed usage cannot be
refunded. A publication committed before a pause remains published; archive it in
the existing editor if needed. New guidance never rewrites existing articles.

Draft mode is the default. Auto mode publishes only outputs passing source,
recency, structure and model-review checks. Flagged outputs remain private drafts
with reasons. Incomplete JSON, no current sources, duplicate topics and provider
failures create no article. All saved articles remain editable as Markdown.
Automated review cannot guarantee factual accuracy, originality or search ranking;
review the initial drafts yourself.

Daily slots include manual, failed and cancelled attempts to bound costs. Cancelled
slots are not refunded. There is also a maximum of three attempts per UTC day to
prevent timezone changes creating unlimited work. The scheduler checks every minute,
processes sequentially after the start hour, and does not backfill missed days.

## Connect Gemini in admin

1. Open **Admin → AI Writer → Gemini connection**.
2. Paste the Google AI Studio API key. The portal automatically loads models from
   Google, including paginated results. Choose a compatible model from the selector,
   and record whether the Google project uses free quota or has billing enabled.
3. Enable **Allow Gemini API writing** and save. Saving never enables the daily
   schedule; it switches scheduling off and cancels unfinished work.
4. Click **Test connection**. This makes a Google model-metadata request to check
   key acceptance and model compatibility, without generating text. The result
   includes the time and latency. It does not guarantee generation quota/billing.
5. Click **Write test blog**. The normal research, writing, review and cover-image
   pipeline starts immediately when the worker is available. Progress updates
   automatically; **Open test draft** opens the result in the Markdown editor.
   This action always saves a private draft, even in auto-publish mode. It uses
   saved guidance plus the optional one-time brief. A paused writer must be resumed.
6. Review the result before enabling the daily schedule and automatic publishing.

New keys are sent over the existing HTTPS admin API, encrypted with AES-256-GCM
and stored in the existing database. They are never returned by management APIs,
written into articles/job snapshots, or persisted by the application in browser
storage. The UI shows only a short fingerprint; leave the password field blank
when changing a model or permission without replacing the key. Connection edits
use a revision counter to reject overwrites from an older tab.

**Disconnect Gemini** removes the database key, cancels unfinished work and
switches scheduling/API writing off. It also prevents a server environment key
from silently taking over. Reconnect by entering a key again. Replacing a key
invalidates earlier connection-test results. A key changed during a test cannot
inherit the old connection's successful result.

Two test-blog attempts per UTC day are available separately from normal daily
slots. Connection checks are limited to five per UTC day. Both count toward the
shared monthly API request ceiling, including failures. Normally two generation
calls are made per article. A test blog can incur Google API charges. Project
billing/quota settings remain in Google Cloud/AI Studio; the billing selector
records those settings and does not change them. Usage ceilings are not dollar
caps, and provider model access is not a guarantee of generation availability.

## Server secrets and compatibility

No terminal configuration is required to add the API key through admin. The
server automatically creates a random 32-byte encryption master key in:

```text
~/.local/state/myconvertertool-secrets/gemini-writer.key
```

It is outside Git/the public web root, restricted to the service user (mode 0600).
Back it up privately with database/media backups. Losing it prevents decryption
of saved API keys; restore it or enter a new API key. Decryption does not silently
create a new master key. Other service instances must use the same master key.

Operators can instead set `GEMINI_WRITER_ENCRYPTION_KEY` to a base64-encoded
32-byte secret or choose `GEMINI_WRITER_SECRET_KEY_FILE`. Never set either through
frontend VITE variables or commit secret values. Changing the master key without
reencrypting stored credentials makes them unreadable.

The existing server configuration remains a fallback only while no admin
connection record exists:

```text
GEMINI_API_KEY=<secret from Google AI Studio>
GEMINI_WRITER_MODEL=<available JSON-capable Gemini generateContent model>
GEMINI_WRITER_BILLING_MODE=free
AI_WRITER_ALLOW_REQUESTS=false
GEMINI_WRITER_MAX_MONTHLY_REQUESTS=90
```

An admin-managed connection overrides those key/model/permission values. The
server monthly request ceiling always applies; its effective limit is the lower
of the admin setting and server value. Each outbound Google request is reserved
before sending. Token counts come from returned usage metadata; interrupted calls
may be billed without returning usage. There is no automatic paid-tier/model
fallback or retry. Provider calls use the fixed Google API host and bounded
responses; generation has a 90-second timeout and connection checks 15 seconds.

## Current information and attribution

Research uses recent official RSS feeds from OpenAI, Google and GitHub. Source
choices are server-owned; admins control editorial topics and acceptable primary
source domains. Supported coverage is limited to those publishers for this first
release. Expanding coverage requires adding another vetted feed in
`server/utils/aiWriterSources.js`. Excluding every available publisher may hold all
articles as drafts. A quiet news day may produce fewer articles than requested.

Feeds are downloaded sequentially over HTTPS with a 2 MB limit and 15-second
network timeout per feed. The existing safe downloader pins connections to public
DNS addresses and checks redirects against explicit hostname allowlists. Parser
input is bounded; DTDs/entities are not expanded. Only recent (72 hours), dated
entries with useful descriptions and official-domain links are accepted. There is
no article crawling or download of full news stories or their photographs.

Gemini receives bounded publisher titles, dates, URLs and summaries. It selects
relevant sources for one event and writes an original explanation; it must skip
when the evidence is insufficient. Selected URLs must match the supplied evidence.
Previously used source URLs and similar topics are excluded. A second model pass
checks claims against the limited briefs, instruction compliance and uncertainties.
Long exact passages matching a publisher summary are flagged; this is not a full
plagiarism detector. The event date is model-reported, not independently proven.
Source summaries may be insufficient for a detailed article; uncertain work should
remain in draft for human verification.

**Google Search grounding is deliberately not used.** During implementation, the
current [Google grounding terms](https://ai.google.dev/gemini-api/terms#grounding-with-google-search)
were checked and found unsuitable for the proposed permanent, public automated
blog workflow. This implementation uses ordinary Gemini generation from publisher
briefs and does not retain, frame or republish Google Search-grounded results.

Source links and an AI-assistance disclosure appear in React and initial article
HTML. Do not claim a human has reviewed an article unless one actually has.
Original Sharp templates create two branded WebP covers without external photos.
Existing media cleanup protects saved draft and published references.

The publisher reuses canonical metadata, Article JSON-LD, stable URLs, tags and the
sitemap. `/blog` initial HTML now queries recent published records; the Nginx
release change below ensures it reaches Node rather than a stale static snapshot.

## Storage and recovery

The existing DB gains settings, jobs, meters and small locks. Blog records gain
unique generation/topic IDs, sources, model and generation date. Jobs retain the
settings/brief used, state, compact reasons and usage. Full API responses and feed
bodies are not stored. Completed summaries expire after 30 days; admin cleanup only
removes completed summaries older than seven days. Article provenance remains.
Monthly meters expire after 100 days; active work is never removed by cleanup.

A database lease permits one worker for ten minutes. Settings changes,
cancellation and final publication use a separate short control lock. An expired
worker cannot publish. Restart recovery finds saved articles by unique generation
ID and never silently repeats unfinished API calls. Do not increase request
timeouts beyond the worker lease without implementing lease renewal.

## Release requirements

1. Test using an isolated DB and build into a staging directory, not live
   `client/dist`. Back up database/media and the previous release.
2. Ensure sparse unique Blog generation/topic indexes can be created. Existing
   manual articles have no values and are unaffected.
3. Add `location = /blog { try_files /nonexistent @frontend; }` to the active Nginx
   virtual host. `/blog/` already proxies. Validate with `nginx -t` before reload.
4. Release backend/frontend with the schedule disabled. Verify admin authorization,
   draft privacy, sources, fresh listing HTML and sitemap discovery.
5. Use the admin Gemini connection panel, test access and write a test draft.
   Select limits/timezone/mode, then deliberately enable scheduling/auto-publication.

Tests require an isolated MongoDB listening on 127.0.0.1:27019:

```bash
MONGO_URI_TEST=mongodb://127.0.0.1:27019/ai_writer_test \
  node --test --test-concurrency=1 server/tests/aiWriter.node-test.mjs
npm run test --workspace=client -- src/pages/admin/AIWriter.test.jsx
```

The suite refuses other DB URIs, drops only that test database and mocks Google
and publisher downloads. No live provider requests or production mutations occur.

References: [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing),
[model metadata checks](https://ai.google.dev/api/models#method:-models.get),
[AI content and SEO](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

## Development verification (2026-11-14)

- 20 isolated AI Writer backend tests passed with mocked Gemini and feed responses.
- 11 existing publishing/SEO backend tests and 16 frontend tests passed.
- HTTPS-only/private-address downloader checks, syntax, lint and whitespace passed.
- A real read-only feed check returned 20 recent briefs from Google and OpenAI;
  it made no Google AI requests.
- The production-mode frontend build and all public prerenders passed in a staging
  directory outside live `client/dist`.
- Browser checks at 1440, 390 and 320 pixels passed instruction saving, a one-time
  brief and emergency pause, with no page errors or horizontal overflow.
- Temporary test MongoDB processes, data and generated test media were removed.
  The existing production PM2 process remained online without a reload.

## Key-management verification (2026-11-14)

- 31 isolated backend tests and eight focused frontend tests passed, including
  authorization, encryption, missing encryption-key recovery, secret redaction,
  connection failures/quotas, stale revisions, key rotation and draft-only tests.
- The latest production-mode build and public prerenders passed in staging.
- Browser flows at 1440, 390 and 320 pixels passed saving a key, clearing the key
  input, testing access, saving instructions, writing a test, opening its draft
  link, immediate history/usage refresh, pausing and disconnecting. No browser
  storage retained the entered test key; no page errors or horizontal overflow.
- Google/network generation responses were mocked. Temporary test database data,
  test media and test encryption files were removed. No real API spending occurred.

## Production release (2026-11-14)

The backend, frontend and dynamic `/blog` Nginx route are deployed. All 35 live
checks passed, including published guides, assets, structured metadata, admin
authorization, deduplication indexes and disabled-by-default writer behavior.
Private backups of the database, blog media, previous frontend/server and Nginx
configuration were saved before deployment. No generation jobs or Google API
requests were created by the release.

Admins can now configure Gemini in **Admin → AI Writer**, test model access and
write a private test draft. Real Google-key verification remains an admin setup
step; automatic writing stays disabled until deliberately enabled.

## Authorization keys, model discovery and usage

Both standard keys and the newer `AQ.` authorization-key format are accepted.
The earlier validator rejected dots before a Google request was attempted; that
local validation bug is corrected. No prefix is assumed when authenticating.
Key characters remain bounded to a safe ASCII token alphabet, including dots.

Entering a key automatically loads the Google model catalog after a short pause,
without saving the key. Saved connections load their catalog automatically on page
open. The selector shows every returned model and enables general Gemini text
models for blogs; embeddings, image/audio and other specialized models are listed
with an explanation. Listing a model does not confirm free-tier or generation
quota access. Use Write test blog to verify the selected model's full workflow.

**Refresh models** bypasses the ten-minute cache. The cache is bounded to eight
key digests, stores only model metadata, and never contains a raw API key. Concurrent
lookups for the same key share a request. Two distinct lookups may run at once.
There are at most 20 uncached lookups per UTC day; each Google page request also
counts toward the existing monthly API ceiling. No generation tokens are consumed
by catalog lookup. Client cancellation discards stale responses after key changes;
server requests remain bounded by timeout and size/pagination limits.

Usage displays scope explicitly: the current UTC month's requests and tokens
observed by this portal. New generation responses record Google's actual input,
output, thinking, cached and total token counts. Cached input overlaps prompt
tokens. Earlier totals may have no breakdown. Metadata calls are counted separately
within the API request total. Per-model counters for the connected key include
requests, tokens, failures and the latest quota/rate-limit response. Returned usage
is retained even when Google truncates a generation. Interrupted calls may still
be billed without returning usage, so local tracking is not an invoice.

The Models API returns capabilities/context limits, not a remaining balance. Google
project quotas apply across keys and applications, so the portal does not invent
project-wide remaining tokens or credits. Admin links open the AI Studio usage and
rate-limit dashboards. Cloud Monitoring project metrics require additional OAuth
permissions/project configuration beyond this Gemini-key integration.

References: [Google key types](https://ai.google.dev/gemini-api/docs/api-key),
[model pagination](https://ai.google.dev/api/models#method:-models.list),
[project quotas](https://ai.google.dev/gemini-api/docs/rate-limits).

Validation for the model-discovery update: 41 backend and 11 frontend tests passed.
The production-mode frontend build and desktop/mobile browser flows at 1440, 390
and 320 pixels passed automatic discovery, manual refresh, model switching and
portal-usage display. A read-only live Google catalog check returned 64 models. A
minimal generation using `gemini-3.1-flash-lite` succeeded with eight total tokens.
The diagnostic credential was kept in memory and was not saved to the portal or
source code. Google may list models that subsequently reject a generation request;
HTTP 404 now identifies an unavailable model and directs admins to refresh/select
another model, rather than implying the API key is invalid.
