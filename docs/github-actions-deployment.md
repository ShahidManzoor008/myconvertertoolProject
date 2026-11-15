# GitHub Actions production deployment

## Current status

Implementation prepared on `ci/github-auto-deploy`, based on `09412a4`.
The original working tree was clean and matched the cached `origin/main`.
A fresh fetch/push could not run in the preparation session: GitHub DNS/network
access was unavailable, the system SSH client configuration had a permissions
error, and `gh` had no authenticated account. The user subsequently authenticated
and published commit `12dd0d0` from their terminal. This task still cannot reach
GitHub directly. No production process, Nginx configuration or database was changed.

The first CI run exposed a missing Ghostscript dependency and stale test fixtures:
public blog pagination must use published posts, and authenticated profile updates
must use the HttpOnly login cookie with an approved Origin. The branch corrects
those fixtures and installs conversion dependencies before backend checks. A fresh
GitHub CI run is required to verify these fixes; the sandbox cannot run HTTP or
MongoDB integration tests. The saved `ci-failure.log` is ignored by Git.

Do not delete either project checkout until deployment, rollback and restart
recovery are verified and the user explicitly approves that deletion.

Deployment is gated by a **repository** Actions variable `DEPLOY_ENABLED=true`.
Leave it unset until bootstrap, a real rollback rehearsal, and public verification
have completed. The environment is called `production`; only `main` can deploy.

## Behavior

The existing CI job runs on pushes and pull requests. It tests and builds the
checkout using Node 24, checks prerendered metadata, and runs the dependency audit.
For `main`, it packages that exact commit and its tested frontend build into an
artifact named `production-COMMIT-RUN_ID-ATTEMPT`. No production secrets are needed
to test, build or package. Prerendering currently reads public stats and blog posts
from production; if that API is unavailable the build fails and production stays
as it was.

After all checks pass, the deployment job:

1. Skips a superseded commit, downloads the same run's artifact and verifies SHA-256.
2. Uploads through SSH with a pinned host key and starts a detached host operation.
3. Installs only backend runtime dependencies from the lockfile in a new release
   directory. The frontend is never rebuilt on production. Native packages are
   installed for the host architecture; this requires npm registry access.
4. Starts a candidate on the unused loopback port, 5100 or 5101. Readiness checks
   require MongoDB ping, frontend output and the expected release identity.
5. Atomically replaces `current`, tests Nginx configuration and gracefully reloads
   Nginx. Each Nginx worker retains an absolute frontend root and backend port.
6. Checks the release through public HTTPS, then the home page, blog and sitemap.
   Only after successful verification does `scheduler-current` move, allowing the
   candidate to consume scheduled AI Writer jobs.
7. Waits 190 seconds for old requests to drain before removing the old PM2 process.
   Both versions are saved in PM2 during the transition for reboot recovery.

On a failed candidate, live routing is unchanged. On a failed cutover, the host
restores the old Nginx include and verifies it before draining/removing the
candidate. If rollback fails, both backends are retained and the job reports an
explicit recovery error. A kernel `flock` also serializes host operations, and a
detached process continues cutover/rollback if SSH or the GitHub runner disconnects.

This targets near-zero deployment interruption, not a guarantee for every request.
Old and new versions must coexist safely. Database migrations, seeding, destructive
cleanup and database rollback are **not** part of this workflow. AI Writer work
already in flight can finish under its existing database lock during a transition.

## Publish the source first

From a machine/session with GitHub access:

```sh
cd /home/ubuntu/myconvertertool-cicd
git fetch origin
git log --oneline origin/main..HEAD
git push -u origin ci/github-auto-deploy
```

Open and merge a pull request after CI passes. If system SSH configuration has the
same ownership error observed during preparation, use a user-controlled config,
for example `GIT_SSH_COMMAND='ssh -F /dev/null' git fetch origin`, with the correct
key and trusted known-hosts entry. Do not disable host-key checking. The original
application source had no pending changes requiring a separate pre-CI/CD commit.

## One-time host preparation

Use the existing application's Unix account (`ubuntu`) so uploads, browser cache,
PM2, and the Gemini encryption key retain their owners. Confirm Node 24, npm, PM2,
GNU tar, `flock`, Ghostscript, LibreOffice, Chrome, Python virtual environment and
MongoDB are installed. Do not move the existing uploads or Gemini key. Check free
memory for two Node processes plus conversion work and sufficient release disk
space. The frontend build occurs on GitHub; npm installation still uses the host.

Install the reviewed host controller from the merged checkout:

```sh
deploy_root="$HOME/.local/share/myconvertertool-deploy"
install -d -m 755 "$deploy_root" "$deploy_root/bin" "$deploy_root/incoming"
install -m 700 scripts/deploy/host.sh scripts/deploy/host.mjs "$deploy_root/bin/"
install -m 644 scripts/deploy/nginx-app.conf.template "$deploy_root/bin/"
install -m 600 scripts/deploy/host-config.example.json "$deploy_root/host-config.json"
```

Edit `host-config.json` to match the actual environment file, uploads and Python
paths. The example uses the current production paths. Ensure the environment file
is mode 600 and contains the complete production environment, including
`MONGODB_URI`. Check that these settings match the current PM2 configuration;
values supplied only through PM2 must be preserved in this private file first.
Do not put runtime secrets in GitHub artifacts or the repository. Nginx's account
needs traversal/read access to `releases/` and `shared/`, never to the private env
file or Gemini encryption key.

Grant the deployment account passwordless access to just the two required commands,
using `sudo visudo -f /etc/sudoers.d/myconvertertool-deploy`:

```sudoers
ubuntu ALL=(root) NOPASSWD: /usr/sbin/nginx -t, /bin/systemctl reload nginx
```

Verify `sudo -n /usr/sbin/nginx -t` works. Treat the deployment account and the
reviewed Nginx include as privileged infrastructure: they control production
routing. Existing firewall rules must allow SSH from GitHub-hosted runners; keep
5100/5101 bound to loopback and do not expose them publicly. Confirm PM2's existing
startup service restores the `ubuntu` process list after reboot.

The host controller and template live outside release directories. Later changes
to these files require an explicit reviewed reinstall; a pushed commit does not
silently replace the host controller.

## Bootstrap without replacing the current site first

With deployment still disabled, merge the changes and download the successful
`main` CI artifact from the Actions page. Unzip it into `$deploy_root/incoming`.
It contains `ID.tar.gz` and `ID.tar.gz.sha256`; `ID` is the 40-character commit SHA,
workflow run ID and attempt separated by hyphens.

```sh
# Set release_id to the downloaded filename without .tar.gz.
release_id=REPLACE_WITH_ACTUAL_RELEASE_ID
cd "$deploy_root/incoming"
sha256sum -c "$release_id.tar.gz.sha256"
digest="$(cut -d ' ' -f1 "$release_id.tar.gz.sha256")"
"$deploy_root/bin/host.sh" bootstrap "$release_id" "$digest"
```

Bootstrap starts and checks the new backend on 5100 and creates `current`. The
existing server on 5000 and existing Nginx configuration continue serving the site.
The new scheduler stays inactive until public verification.

Back up both enabled application Nginx configurations privately. In the application
HTTPS server for `myconvertertool.com`, replace the old `root`, `index`,
`client_max_body_size` and application `location` directives with:

```nginx
include /home/ubuntu/.local/share/myconvertertool-deploy/current/nginx.conf;
```

Keep the existing TLS, gzip, domain and redirect settings. Update the separate
IP/sslip.io application server to use the same include instead of its old root and
locations. Do not leave either server routing to 5000 after the legacy process is
retired. Validate and reload, then verify:

```sh
sudo -n /usr/sbin/nginx -t
sudo -n /bin/systemctl reload nginx
"$deploy_root/bin/host.sh" verify
```

`verify` checks public HTTPS and enables the new scheduler only after success.
If it fails, restore the saved legacy Nginx files and reload while the legacy
process is still available. Do not enable auto deployment. Once successful, allow
at least 190 seconds for legacy requests, then stop `myconvertertool-server` and
save PM2. Removing the legacy process also prevents its ungated old scheduler from
continuing to poll alongside the new scheduler. Keep legacy files for recovery.

Before enabling automatic releases, deploy a second successful CI artifact with
`host.sh deploy ID SHA256`, then rehearse `host.sh rollback PREVIOUS_ID` and verify
the site. This proves the actual host permissions, reload, application dependencies
and rollback path; local tests use simulated host commands and cannot prove these.

## GitHub SSH configuration and activation

Create a separate SSH key for this repository's deployment, without a passphrase.
Install its public key in `ubuntu`'s `authorized_keys` with the `restrict` option
(no forwarding, agent forwarding, X11 or PTY). Keep the private key out of Git.
This key runs reviewed deploy scripts as the application owner; possession gives
access to that account. Pin the server host key using a fingerprint verified from
the server console or another trusted channel. Do not trust an unverified
`ssh-keyscan` response alone.

Under repository **Settings → Environments → production**, add:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | Server IPv4 address or DNS hostname |
| `DEPLOY_USER` | `ubuntu` |
| `DEPLOY_PORT` | SSH port, normally `22` |
| `DEPLOY_SSH_KEY` | Dedicated private SSH key, including header/footer |
| `DEPLOY_KNOWN_HOSTS` | Verified OpenSSH known-hosts line; nonstandard port uses `[host]:port` |

Restrict the environment to `main`. Protect `main` with pull requests and required
CI checks. No environment reviewer is necessary for fully automatic deployment.
Finally add **repository Settings → Secrets and variables → Actions → Variables**
`DEPLOY_ENABLED=true` (not an environment-only variable). Run CI manually on `main`
once to verify end to end; subsequent pushes to `main` deploy automatically.

To stop future automatic deployments, set `DEPLOY_ENABLED=false`. An already
started detached deployment continues to its safe finish; inspect its result
before doing maintenance or retrying.

## Operations and recovery

```sh
deploy_root="$HOME/.local/share/myconvertertool-deploy"
"$deploy_root/bin/host.sh" current
"$deploy_root/bin/host.sh" verify
"$deploy_root/bin/host.sh" rollback PREVIOUS_RELEASE_ID
```

`previous` records the last successful predecessor. Per-release results and private
logs live under `results/` and `logs/`. Application logs are in the existing PM2
log directory. If a runner times out, read the server result before retrying;
another workflow attempt uses a distinct ID, and the host lock blocks overlap.

Rollback restarts the retained backend, checks it, switches Nginx, verifies public
traffic and drains the outgoing process. Manual rollback can also recover a
currently unhealthy active release. If the rollback reload fails, leave both backends
running until routing is known. Reconcile with `host.sh verify` after recovery.

Retain at least the active and previous release. Releases, uploads, encrypted Gemini
keys, MongoDB backups and old deployment backups have different lifecycles. There
is deliberately no automatic deletion. Monitor disk growth; manually remove only
inactive, stopped releases after the rollback retention window and with backups.
Retained hashed assets also accumulate under `shared/assets` to support existing
browser tabs. GitHub artifacts expire after 14 days; on-host releases remain.

## Local validation

```sh
for script in scripts/deploy/*.sh; do bash -n "$script"; done
node --test tests/deploy/*.test.mjs
npm run lint --workspace client
```

Deployment tests simulate PM2/npm/Nginx and public HTTP while exercising real
release extraction, checksums, symlinks, generated configuration, candidate
failures and rollback behavior. They never connect to production MongoDB or start
production processes. Full existing CI and a real host rehearsal are still
required before activation.

Preparation-session results:

- All 11 deployment regression checks passed (8 host lifecycle, 2 runtime, 1 packaging).
- Shell parsing, JavaScript syntax checks, workflow YAML parsing, client lint and
  `git diff --check` passed. Existing SEO and deepmerge security checks passed.
- Existing HTTP middleware tests could not bind loopback in this sandbox
  (`listen EPERM`), so they did not pass here. The frontend test runner stalled
  without results and was interrupted; it must be rerun in CI.
- The full MongoDB-backed backend suite, production build, live deployment and
  live rollback rehearsal were not run in this restricted session.
