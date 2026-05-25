#!/usr/bin/env bash
# Oracle Cloud Always-Free bootstrap — runs as root on a fresh Ubuntu 22.04 ARM box.
# Designed for Ampere A1 Flex (1-4 OCPU, 6-24GB RAM, ARM64).
#
# Usage:  curl -sSL https://raw.githubusercontent.com/wflow2252-svg/vixcell/main/social-agent/scripts/oracle-bootstrap.sh | sudo bash

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/wflow2252-svg/vixcell.git}"
DOMAIN="${DOMAIN:-agent.vixcell.com}"
APP_DIR=/opt/vixcell
ADMIN_EMAIL="${ADMIN_EMAIL:-vixcell.eg@gmail.com}"

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || die "Run as root: curl … | sudo bash"

ARCH=$(dpkg --print-architecture)
log "Detected architecture: ${ARCH}"
[ "${ARCH}" = "arm64" ] || log "⚠️  Not ARM64 — script tested on Oracle Ampere A1 (arm64). Continuing anyway."

log "Updating system + base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl ca-certificates gnupg lsb-release git nginx \
  certbot python3-certbot-nginx ufw fail2ban iptables-persistent

log "Opening firewall (Oracle's internal Ubuntu iptables blocks by default)"
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
netfilter-persistent save

log "Installing Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
docker compose version >/dev/null 2>&1 || apt-get install -y -qq docker-compose-plugin

log "Cloning repo into ${APP_DIR}"
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone --depth 1 "${REPO_URL}" "${APP_DIR}"
else
  git -C "${APP_DIR}" pull --ff-only
fi

cd "${APP_DIR}/social-agent"

if [ ! -f .env ]; then
  log "Creating .env from .env.example — EDIT IT after this script finishes"
  cp .env.example .env
  sed -i 's|^HEADED=true|HEADED=false|' .env
  sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://vixcell.com,https://${DOMAIN}|" .env
fi

log "Building + starting container (will pull Playwright image, ~500MB first time)"
docker compose up -d --build

log "Configuring Nginx reverse proxy for ${DOMAIN}"
NGX_FILE=/etc/nginx/sites-available/${DOMAIN}
cat > "${NGX_FILE}" <<NGINX
server {
    server_name ${DOMAIN};
    listen 80;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

ln -sf "${NGX_FILE}" /etc/nginx/sites-enabled/${DOMAIN}
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

PUBLIC_IP=$(curl -s ifconfig.me || echo "unknown")
DNS_IP=$(dig +short "${DOMAIN}" | head -1 || echo "")

log "Public IP: ${PUBLIC_IP}"
log "DNS for ${DOMAIN} resolves to: ${DNS_IP:-not set yet}"

if [ -n "${DNS_IP}" ] && [ "${DNS_IP}" = "${PUBLIC_IP}" ]; then
  log "DNS matches — requesting TLS cert from Let's Encrypt"
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${ADMIN_EMAIL}" --redirect || \
    log "⚠️  certbot failed — DNS may still be propagating. Run later: certbot --nginx -d ${DOMAIN}"
else
  log "⚠️  Add this DNS A record first, then run: sudo certbot --nginx -d ${DOMAIN}"
  echo "    Type: A   Name: ${DOMAIN%.*.*}   Value: ${PUBLIC_IP}   TTL: 3600"
fi

log "✅ Bootstrap complete."
echo
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│ Next steps:                                                        │"
echo "│   1. nano ${APP_DIR}/social-agent/.env                       │"
echo "│      → set AGENT_TOKEN to match web/.env.local                     │"
echo "│   2. cd ${APP_DIR}/social-agent && docker compose restart          │"
echo "│   3. Set DNS: ${DOMAIN} → ${PUBLIC_IP}                "
echo "│   4. After DNS: sudo certbot --nginx -d ${DOMAIN}              │"
echo "│   5. Update Vercel env: VITE_SOCIAL_AGENT_URL=https://${DOMAIN}   │"
echo "│   6. Log into Gemini via VNC (see ORACLE_CLOUD_SETUP.md §10)       │"
echo "└────────────────────────────────────────────────────────────────────┘"
