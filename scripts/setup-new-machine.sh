#!/usr/bin/env bash
# setup-new-machine.sh — Run once on a new machine to bootstrap the HomeFix dev environment.
# Usage: bash scripts/setup-new-machine.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

info()  { echo ""; echo "▶ $*"; }
ok()    { echo "  ✓ $*"; }
warn()  { echo "  ⚠ $*"; }
die()   { echo "  ✗ $*" >&2; exit 1; }

# ── 1. Fix Docker-created root-owned node_modules ──────────────────────────
info "Fixing ownership of node_modules directories (may need sudo)..."
for dir in "$REPO_ROOT/node_modules" "$REPO_ROOT/backend/node_modules"; do
  if [ -d "$dir" ] && [ "$(stat -c '%U' "$dir")" != "$(whoami)" ]; then
    sudo chown -R "$(whoami):$(whoami)" "$dir"
    ok "Ownership fixed: $dir"
  fi
done
ok "Ownership check done."

# ── 2. Backend .env setup ───────────────────────────────────────────────────
info "Checking backend environment file..."
if [ ! -f "$REPO_ROOT/backend/.env.development" ]; then
  if [ -f "$REPO_ROOT/backend/.env.sample" ]; then
    cp "$REPO_ROOT/backend/.env.sample" "$REPO_ROOT/backend/.env.development"
    warn ".env.development created from .env.sample — fill in DB_NAME, DB_USER, DB_PASSWORD, JWT secrets before running 'make up'."
  else
    die "backend/.env.sample not found. Cannot create .env.development."
  fi
else
  ok ".env.development already exists."
fi

# ── 3. Root .env symlink (required by docker-compose) ──────────────────────
info "Checking root .env symlink..."
if [ ! -e "$REPO_ROOT/.env" ]; then
  ln -sf backend/.env.development "$REPO_ROOT/.env"
  ok "Symlink created: .env → backend/.env.development"
else
  ok "Root .env symlink already exists."
fi

# ── 4. Install all workspace dependencies ──────────────────────────────────
info "Installing all workspace dependencies (npm workspaces — installs to root node_modules)..."
cd "$REPO_ROOT"
npm install
ok "All workspace packages installed."

# ── 5. WSL2 mirrored networking reminder ───────────────────────────────────
info "WSL2 networking check..."
WSLCONFIG_HINT="C:\\Users\\<your-username>\\.wslconfig"
if grep -qi "networkingMode=mirrored" /proc/version 2>/dev/null || \
   (command -v wslinfo &>/dev/null && wslinfo --networking-mode 2>/dev/null | grep -qi mirrored); then
  ok "Mirrored networking is active."
else
  warn "Could not confirm mirrored networking."
  echo ""
  echo "  On Windows, ensure $WSLCONFIG_HINT contains:"
  echo "    [wsl2]"
  echo "    networkingMode=mirrored"
  echo ""
  echo "  Then run in Windows cmd/PowerShell: wsl --shutdown"
  echo "  (One-time setup — survives reboots.)"
fi

# ── 6. Summary ─────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Setup complete. Next steps:"
echo ""
echo "  Backend:"
echo "    1. Edit backend/.env.development (fill in secrets)"
echo "    2. make up       — build + start Docker services"
echo "    3. make seed     — seed roles, categories, admin user"
echo "    4. make restart  — reload permission cache"
echo ""
echo "  Mobile (find WiFi IP via 'ipconfig' in Windows cmd):"
echo "    cd mobile"
echo "    REACT_NATIVE_PACKAGER_HOSTNAME=<windows-wifi-ip> npx expo start --host lan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
