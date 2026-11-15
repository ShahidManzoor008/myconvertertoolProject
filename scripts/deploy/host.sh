#!/usr/bin/env bash
set -euo pipefail
umask 022
# Noninteractive SSH does not load the login profile's user runtime path.
export PATH="$HOME/.local/bin:$PATH"
export MCT_DEPLOY_ROOT="${MCT_DEPLOY_ROOT:-$HOME/.local/share/myconvertertool-deploy}"
mkdir -p "$MCT_DEPLOY_ROOT"
# The kernel releases this lock even if SSH drops or the process is killed.
exec flock -w 30 "$MCT_DEPLOY_ROOT/deploy.lock" node "$(dirname "$0")/host.mjs" "$@"
