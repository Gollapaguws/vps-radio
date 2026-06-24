#!/usr/bin/env bash
# scripts/setup-vps.sh
# Run once on a fresh Ubuntu 22.04 LTS VPS to prepare it for VPS Radio.
# Usage: sudo bash scripts/setup-vps.sh
set -euo pipefail

RADIO_DIR="${RADIO_DIR:-/opt/radio}"
RADIO_USER="${RADIO_USER:-radio}"

echo "==> [1/6] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

echo "==> [2/6] Installing system dependencies..."
apt-get install -y -qq \
  curl \
  ca-certificates \
  gnupg \
  lsb-release \
  ufw \
  fail2ban \
  unattended-upgrades \
  logrotate \
  htop \
  git

# ─── Docker CE ──────────────────────────────────────────────────────────────
echo "==> [3/6] Installing Docker CE..."
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "Docker CE installed: $(docker --version)"
else
  echo "Docker already installed: $(docker --version)"
fi

# ─── Create radio user (non-root) ───────────────────────────────────────────
echo "==> [4/6] Creating service user '${RADIO_USER}'..."
if ! id "${RADIO_USER}" &>/dev/null; then
  useradd -r -m -s /bin/bash "${RADIO_USER}"
  usermod -aG docker "${RADIO_USER}"
  echo "User '${RADIO_USER}' created and added to docker group."
else
  echo "User '${RADIO_USER}' already exists."
fi

# Ensure radio dir exists and is owned by radio user
mkdir -p "${RADIO_DIR}"
chown -R "${RADIO_USER}:${RADIO_USER}" "${RADIO_DIR}"

# ─── Firewall (ufw) ─────────────────────────────────────────────────────────
echo "==> [5/6] Configuring ufw firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (22), HTTP (80), HTTPS (443) only
ufw allow 22/tcp comment "SSH"
ufw allow 80/tcp comment "HTTP (redirect to HTTPS)"
ufw allow 443/tcp comment "HTTPS"

# CRITICAL: Block Icecast port 8000 from external access
# Docker bypasses ufw for mapped ports, so we use iptables directly:
iptables -I DOCKER-USER -p tcp --dport 8000 -j DROP 2>/dev/null || true
iptables -I DOCKER-USER -p tcp --dport 8000 -s 127.0.0.1 -j ACCEPT 2>/dev/null || true

# Persist iptables rules across reboots
if command -v iptables-save &>/dev/null; then
  iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
fi

ufw --force enable
echo "ufw status:"
ufw status verbose

# ─── fail2ban ───────────────────────────────────────────────────────────────
echo "==> [6/6] Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<'FAIL2BAN'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
FAIL2BAN

systemctl enable fail2ban
systemctl restart fail2ban

# ─── Unattended security upgrades ────────────────────────────────────────────
dpkg-reconfigure --priority=low unattended-upgrades

echo ""
echo "✅  VPS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone the repo:  git clone <repo-url> ${RADIO_DIR}"
echo "  2. Copy env:        cp ${RADIO_DIR}/.env.example ${RADIO_DIR}/.env"
echo "  3. Edit .env with your domain, passwords, R2 credentials"
echo "  4. Run SSL init:    sudo bash ${RADIO_DIR}/scripts/init-ssl.sh"
echo "  5. Start stack:     cd ${RADIO_DIR} && docker compose -f docker-compose.prod.yml up -d"
