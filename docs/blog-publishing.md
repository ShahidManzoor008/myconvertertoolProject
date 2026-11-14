# Markdown blog publishing

The blog uses the existing MongoDB database for article records and local files for
images. It introduces no additional database, container, paid editor, or cloud
service. The changes were validated locally before release. Production migration is applied
only as part of an authorized deployment.

## Admin workflow

1. Open Blog Posts → New Post. Write or paste Markdown into the editor.
2. Use the toolbar to insert headings, emphasis, lists, tables, code, and images.
3. Review the reader preview. It calls the same server renderer as the public
   article and initial SEO HTML. Preview updates after a short typing pause.
4. Add a summary (or leave it blank for an automatic excerpt), author, category,
   and up to ten comma-separated tags.
5. Upload a featured image and describe it in the image description field.
6. Save draft to store privately; publish only after checking the content.

Saving a published article as a draft unpublishes it. Changes do not automatically
update the live article until a save/publish action. Saving an existing article
keeps its slug. A new article with a duplicate title receives a distinct slug.

Failed saves leave the editor intact. A revision counter detects an older tab
attempting to overwrite a newer saved revision. Refresh/close and ordinary link
navigation warn about unsaved edits. An optional recovery copy is kept in the
current browser tab's sessionStorage, scoped to the admin and article. It is not
an automatic server backup; use Save draft to retain work durably.

## How formatting works

The title is the article's H1. Use `##` for sections and `###` for subsections.
The server normalizes body H1 headings to H2, creates stable section IDs, and
builds a table of contents. Markdown source is stored unchanged, including code
fences; HTML tags appearing in examples cannot switch the whole article into HTML
mode. Legacy records without a format continue to be treated as HTML.

Supported content includes paragraphs, headings, links, bold/italic/strikethrough,
lists, quotes, tables, code, and inline/display LaTeX. Equations reuse the existing
converter parser and MathJax image renderer. Limit: 30 equations per article,
4,000 characters per equation, and 200,000 source characters per article. Normal
articles do not initialize MathJax. Server output is sanitized, then sanitized
again in the browser. Script embeds and arbitrary raw HTML are not a Markdown
publishing feature.

The editor's legacy HTML mode is retained only for existing records. New articles
use Markdown. The seven rewritten guides in `content/blog/` migrate those specific
legacy articles; they do not force-convert arbitrary admin content.

## Data storage

Article records contain title, original content, explicit contentFormat, summary,
author, category, tags, status, stable slug, image references/dimensions/alt text,
reading time, publication date, timestamps, and revision. Public lists omit the
article body. Public single-article responses include rendered HTML in the legacy `content`
field, with `sourceFormat` identifying the stored format; admin management reads return the original source. Generated HTML is rendered when needed rather than being stored as
another editable copy of the source.

Only admins may write articles, access draft records, preview content, upload
images, or run media cleanup. Public API reads, article pages, categories, and the
sitemap exclude drafts and archived articles. Legacy records without status remain
published to preserve existing visibility.

## Images and disk use

Images accept JPEG, PNG, or WebP up to 8 MB and 40 megapixels. One image upload is
processed at a time. The server rotates according to orientation metadata and
creates two WebP sizes: up to 1280px for article use and up to 480px for cards.
Images are not enlarged. Metadata records the actual generated dimensions.

The image bytes are saved under `server/uploads/blog-images` by default. Set
`BLOG_MEDIA_DIR` to an application-owned persistent directory if relocating them;
copy existing files before changing that configuration. Both database backups and
the image directory are required to restore a complete blog.

Each generated filename is unique. Public image access requires a reference from
a published article; unpublished uploads can be viewed by admins. Already public
images may remain in browser caches after unpublishing. They are not revocable
private documents.

Blog management offers a preview of unused generated images whose file age is
more than seven days. Confirmed cleanup rechecks all saved references, including
drafts, and removes only generated UUID variants. Legacy source images are
excluded. The seven historically public seed image URLs remain public for cached
clients and older links. Unsaved browser content is not a saved reference. Writes and cleanup are
serialized in the current single Node process; use a cross-process lock before
scaling this service to multiple workers.

## Rewritten guides and migration

Seven rewritten Markdown files and `manifest.json` preserve the current slugs.
The manifest records the reviewed legacy source hash. Preparation backs up the
records and source images, checks for intervening edits, optimizes image copies,
then updates content and metadata. Existing source images are retained.

Run from the repository root:

```bash
node server/scripts/migrateBlogsToMarkdown.js
```

The default is a read-only dry run. At the approved deployment step:

```bash
node server/scripts/migrateBlogsToMarkdown.js --apply
```

Apply saves a private backup under `~/.local/state/myconvertertool-blog/` before
updates. `BLOG_BACKUP_DIR` can select a different private backup folder. The script
preflights all records and uses a conditional update for each record. A concurrent
edit stops the migration; earlier completed records remain migrated and the
backup identifies their previous values. It is not a multi-document transaction
on this standalone database. Rerunning skips the editorial revision already
applied and does not overwrite subsequent admin edits.

`seed:blogs` now creates missing guides only. It does not overwrite existing posts.
The old frontend JSON remains legacy seed/reference material and is no longer
used for new seeding. Runtime publishing does not write new articles into Git.

## Local validation

The API tests require a dedicated loopback MongoDB on port 27019 and an isolated
media folder. They refuse production-shaped database/media locations. The local
preview harness additionally requires `NODE_ENV=test` and `blog_preview_test`.
It binds only to 127.0.0.1:5055 and must not be used as a production server.

## Production release order

The isolated preview build uses test image URLs and must not be copied directly
into production. On the authorized release: load the new backend, apply the
reviewed migration with its backup, build/prerender a fresh frontend against the
production blog API, then promote that frontend atomically. Public HTML-compatible
API content and retained legacy image URLs keep the previous frontend usable
during the transition. Verify article status, source format, seven stable slugs,
image URLs, metadata, sitemap exclusion of drafts, and admin publishing afterward.

## Validation results

- Production frontend build and public-page prerendering passed against an isolated
  backend/database containing the rewritten articles.
- 11 backend tests passed: role protection, draft privacy, preview/public rendering,
  stable URLs, revision conflicts, images, cleanup, math, field limits, and SEO.
- 13 focused frontend tests passed across editor, listing, admin, and home suites.
  The editor tests were repeated after the final layout adjustments.
- Blog listing, article, and admin editor passed browser layout checks at 1440px,
  390px, and 320px; a further three checks exercised bounded preview scrolling
  with the keyboard. No page overflow was detected.
- The real local API/browser workflow passed: image upload, Markdown/math preview,
  private draft, publication, anonymous reading, and archiving.
- The migration rewrote all seven copied legacy records in the test database; a
  repeat application updated zero records. The production dry run still passes.
- Temporary preview/MongoDB processes and generated test data were removed after
  validation. The original private content backup and screenshots/logs are kept.

With a dedicated local test MongoDB running on port 27019, the backend suite is:

```bash
MONGO_URI_TEST=mongodb://127.0.0.1:27019/blog_feature_test \
BLOG_MEDIA_DIR="$HOME/.cache/mct-blog-test-media" npm run test:blog --workspace=server
```
