#!/usr/bin/env bash
set -euo pipefail
umask 077
release_id="${1:?Missing release ID}"
digest="${2:?Missing checksum}"
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ && "$digest" =~ ^[a-f0-9]{64}$ ]] || exit 2
deploy_root="$HOME/.local/share/myconvertertool-deploy"
test -x "$deploy_root/bin/host.sh"
test -s "$deploy_root/incoming/$release_id.tar.gz"
mkdir -p "$deploy_root/logs" "$deploy_root/results"
test ! -e "$deploy_root/results/$release_id.json"
# Detach from SSH so runner cancellation cannot interrupt a cutover or rollback.
nohup bash -c '
  root="$1"; id="$2"; digest="$3"
  if ! "$root/bin/host.sh" deploy "$id" "$digest"; then
    if [[ ! -s "$root/results/$id.json" ]]; then
      printf '\''{"status":"failure","message":"Deployment could not start; inspect the private server log."}'\'' > "$root/results/$id.json.tmp"
      mv "$root/results/$id.json.tmp" "$root/results/$id.json"
    fi
  fi
' _ "$deploy_root" "$release_id" "$digest" > "$deploy_root/logs/$release_id.log" 2>&1 < /dev/null &
echo "Deployment started: $release_id"
