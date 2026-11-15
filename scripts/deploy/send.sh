#!/usr/bin/env bash
set -euo pipefail
release_id="${1:?Missing release ID}"
artifact_directory="${2:?Missing artifact directory}"
: "${DEPLOY_HOST:?Missing DEPLOY_HOST}" "${DEPLOY_USER:?Missing DEPLOY_USER}" "${DEPLOY_PORT:=22}"
[[ "$release_id" =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 2
[[ "$DEPLOY_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ && "$DEPLOY_USER" =~ ^[a-z_][a-z0-9_-]*$ && "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || exit 2
digest="$(cut -d ' ' -f1 "$artifact_directory/$release_id.tar.gz.sha256")"
[[ "$digest" =~ ^[a-f0-9]{64}$ ]] || exit 2
(cd "$artifact_directory" && sha256sum -c "$release_id.tar.gz.sha256")
ssh_options=(-F /dev/null -i "$HOME/.ssh/deploy_key" -p "$DEPLOY_PORT" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$HOME/.ssh/known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
target="$DEPLOY_USER@$DEPLOY_HOST"
# IDs contain only hex, digits and hyphens. All remote paths are fixed under HOME.
ssh "${ssh_options[@]}" "$target" "umask 077; mkdir -p \"\$HOME/.local/share/myconvertertool-deploy/incoming\"; cat > \"\$HOME/.local/share/myconvertertool-deploy/incoming/$release_id.tar.gz.part\" && mv \"\$HOME/.local/share/myconvertertool-deploy/incoming/$release_id.tar.gz.part\" \"\$HOME/.local/share/myconvertertool-deploy/incoming/$release_id.tar.gz\"" < "$artifact_directory/$release_id.tar.gz"
ssh "${ssh_options[@]}" "$target" "bash -s -- '$release_id' '$digest'" < scripts/deploy/remote-start.sh
for ((attempt=0; attempt<120; attempt++)); do
  if ! result="$(ssh "${ssh_options[@]}" "$target" "cat \"\$HOME/.local/share/myconvertertool-deploy/results/$release_id.json\" 2>/dev/null || true")"; then
    echo 'SSH unavailable while deployment continues on server; retrying.' >&2
    sleep 10
    continue
  fi
  if [[ -n "$result" ]]; then
    DEPLOY_RESULT="$result" node -e '
      const result=JSON.parse(process.env.DEPLOY_RESULT);
      console.log(result.status === "success" ? "Deployment completed: " + result.release : "Deployment failed: " + result.message);
      if(result.status !== "success") process.exit(1);
    '
    exit 0
  fi
  sleep 10
done
echo 'Timed out waiting for deployment. It continues independently; inspect the server result before retrying.' >&2
exit 1
