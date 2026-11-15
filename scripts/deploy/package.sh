#!/usr/bin/env bash
set -euo pipefail
commit="${1:?Usage: package.sh COMMIT RUN_ID RUN_ATTEMPT OUTPUT_DIRECTORY}"
run_id="${2:?Missing run ID}"
attempt="${3:?Missing run attempt}"
output="${4:?Missing output directory}"
[[ "$commit" =~ ^[a-f0-9]{40}$ && "$run_id" =~ ^[0-9]+$ && "$attempt" =~ ^[0-9]+$ ]] || exit 2
[[ "$(git rev-parse HEAD)" == "$commit" ]] || { echo 'Checkout does not match release commit' >&2; exit 2; }
test -s client/dist/index.html
test -s client/dist/routes-manifest.json
test -s client/dist/404.html
release_id="$commit-$run_id-$attempt"
staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT
# mktemp creates mode 700; the archived root must be traversable by Nginx.
chmod 755 "$staging"
# Only tracked source and the tested build enter the archive: no .git, .env,
# runtime uploads, logs, dependencies, encryption keys or rollback backups.
git archive "$commit" | tar -x -C "$staging"
mkdir -p "$staging/client/dist"
cp -a client/dist/. "$staging/client/dist/"
node -e 'require("node:fs").writeFileSync(process.argv[1],JSON.stringify({id:process.argv[2],commit:process.argv[3]}))' "$staging/release.json" "$release_id" "$commit"
mkdir -p "$output"
tar -czf "$output/$release_id.tar.gz" -C "$staging" .
(cd "$output" && sha256sum "$release_id.tar.gz" > "$release_id.tar.gz.sha256")
