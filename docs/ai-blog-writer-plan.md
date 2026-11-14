# AI Writer delivery plan

Implementation authorized on 2026-11-14. Implemented in development, not deployed
or enabled. See [operation and release guide](ai-blog-writer.md).

The original research proposal used Google Search grounding. Checking the current
Google service terms during implementation showed that permanent public automated
blog storage is not a suitable use of that feature. Research therefore uses vetted
official publisher feeds; Gemini writes original articles from their recent briefs.
No Google Search-grounded output is used or stored.

## Delivered scope

- Admin → AI Writer: standing instructions, topics, exclusions and one-time briefs.
- Encrypted admin-managed Gemini keys, model/permission controls, connection checks
  and one-click private test drafts with progress and editor links.
- Draft/auto-publish modes, pause/cancel, revision protection and editable articles.
- One to three daily generation slots; timezone/start hour; sequential execution.
- Recent official OpenAI, Google and GitHub feed evidence, exact allowed source
  links, duplicate topic/source checks and separate editorial consistency review.
- Markdown structure, title/description, sources/disclosure, original WebP cover,
  existing canonical/Article metadata and live initial blog listing HTML.
- API request ceilings, token reporting, bounded downloads/outputs, server-only key.
- Database worker/control locks, restart recovery and 30-day summary retention.
- Mock-provider and isolated-database tests plus responsive frontend checks.

## Activation prerequisites

Configure a Gemini key/model and writing permission in the admin panel; verify
connection and a test draft. Provider billing/quota configuration is still required. Defaults remain one English article daily, UTC 09:00,
draft mode and schedule disabled. The admin can change these after reviewing the
first outputs. No dollar ceiling is inferred from request counts.

Deployment must include the Nginx /blog proxy rule described in the operation guide.
An initial real Google generation remains a configuration-time verification step;
normal development tests make no paid requests.

## Later improvements

Add more vetted publisher feeds for broader news coverage. Human-reviewed source
briefs can improve articles when an RSS summary is insufficient. Provider pricing
and model availability should be rechecked when selecting production credentials.
Do not increase volume to fill a quota when there is no useful, well-supported news.
