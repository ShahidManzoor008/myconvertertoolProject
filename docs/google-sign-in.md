# Google sign-in

Google Identity Services uses the public OAuth web client ID in `server/.env`:

```
GOOGLE_CLIENT_ID=<web-client-id>.apps.googleusercontent.com
```

`GET /api/auth/config` returns only `{ googleClientId }`, with `Cache-Control: no-store`. The frontend fetches this before rendering Google's native sign-in button. The same server setting is used as the audience when verifying the returned ID token. Client IDs are public identifiers; client secrets, JWT keys and SMTP settings are never returned.

The frontend no longer uses `VITE_GOOGLE_CLIENT_ID`. Existing copies of that setting can be removed; no frontend environment file or OAuth build-time injection is required. This prevents builds in isolated worktrees or CI from silently shipping an undefined or mismatched client ID. A missing or malformed server setting disables Google sign-in with HTTP 503 and a visible retryable message while password login remains available.

In Google Cloud Console, select this OAuth client, ensure its type is Web application, and configure Authorized JavaScript origins for each origin actually serving sign-in (production: `https://myconvertertool.com`; add a `www` origin only if it serves sign-in rather than redirecting). Local development needs its exact origin and port. Check consent-screen audience/publishing status and test-user restrictions. This is a JavaScript callback/popup ID-token flow; it does not require an authorization-code redirect endpoint or a browser client secret.

The site CSP permits Google's sign-in script, iframe, connection and `https://accounts.google.com/gsi/style` stylesheet.

The SDK is loaded from Google's official URL, shared between mounts, and can be retried after a network failure. The native Google button is used instead of treating the optional One Tap prompt as a sign-in button. Authentication errors are displayed inline. Failed credential exchange never triggers a success redirect.

## Validation

- Backend tests exercise configuration, credential validation, audience verification, verified-email enforcement, session creation, and inactive accounts.
- Frontend tests exercise runtime configuration, stable initialization, SDK/configuration failures and retry, rejected credentials, and successful callbacks/redirects.
- Build without frontend OAuth environment files to confirm sign-in does not depend on build-time client IDs.
- Before a production release, check Google's button on the production origin and complete an interactive sign-in with a real Google account. Automated mocked credentials validate application behavior but do not establish that Cloud Console settings or a real account's permissions are correct.

Configuration changes require a backend restart. Deploy the backend config endpoint before, or together with, the new frontend. Do not deploy the new frontend alone against an older backend. This development branch does not change the running production service.

## Development verification (2026-11-12)

The development build and prerender completed without frontend OAuth environment files. All 43 frontend tests, 11 Google/password authentication integration tests against a temporary MongoDB, and both production middleware tests passed. Frontend lint passed. Google credentials in automated integration tests were mocked; no real account was signed in.

The production backend's current Google setting is not a valid web OAuth client ID. Google's native button request rejected the previously configured frontend ID with `[GSI_LOGGER]: The given origin is not allowed for the given client ID.` The Google Cloud client's Authorized JavaScript origins must include `https://myconvertertool.com`. Obtain a client ID from the site's Google Cloud project and confirm its authorized origins before configuring/releasing this change. The public configuration endpoint deliberately refuses malformed IDs rather than passing them to Google. Production configuration and services have not been modified by this development work.
