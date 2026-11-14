#!/usr/bin/env bash
# Deploy the api.brandmd.space allow-list gateway to the Hostinger VPS.
# Copies the nginx template + compose file to /opt/brandmd-api, writes /opt/brandmd-api/.env (chmod 600)
# from the self-hosted stack's own ANON_KEY (public by design, never the service key), then starts it.
set -euo pipefail
cd "$(dirname "$0")"
SSH="ssh -o ConnectTimeout=8 hostinger-vps-launchd-root"

tar -czf - default.conf.template docker-compose.vps.yml | $SSH 'mkdir -p /opt/brandmd-api && cd /opt/brandmd-api && tar -xzf - --no-same-owner'
$SSH 'bash -s' <<'REMOTE'
set -euo pipefail
cd /opt/brandmd-api
umask 077
printf 'BMD_ANON_KEY=%s\n' "$(grep -E '^ANON_KEY=' /home/operator/supabase/.env | cut -d= -f2-)" > .env
chmod 600 .env
docker compose -f docker-compose.vps.yml -p brandmd-api up -d --force-recreate
sleep 3
docker exec brandmd-api nginx -t 2>&1 | tail -1
docker ps --filter name=brandmd-api --format '{{.Names}} {{.Status}}'
REMOTE
