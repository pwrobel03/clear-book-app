#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ClearBook — Local Development Setup
# ─────────────────────────────────────────────────────────────────────────────
# Bootstraps a local development environment in one command:
#   1. Creates .env from .env.example (if not already present)
#   2. Generates a random JWT_SECRET
#   3. Builds and starts all Docker containers
#
# Usage:
#   chmod +x setup.sh && ./setup.sh          # build + start (foreground)
#   ./setup.sh -d                            # build + start (background)
#   ./setup.sh --no-start                    # only create .env, skip Docker
# ─────────────────────────────────────────────────────────────────────────────
set -eo pipefail

COMPOSE_CMD="docker compose -f docker-compose.yaml -f docker-compose.dev.yaml"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; }

echo ""
echo "🩺  ClearBook — Local Development Setup"
echo "──────────────────────────────────────────"
echo ""

# ── Parse flags ──────────────────────────────────────────────────────────────
NO_START=false
DOCKER_FLAGS=()
for arg in "$@"; do
  case "$arg" in
    --no-start) NO_START=true ;;
    *)          DOCKER_FLAGS+=("$arg") ;;
  esac
done

# ── 1. Create .env ────────────────────────────────────────────────────────────
if [ -f .env ]; then
  ok ".env already exists — skipping copy"
else
  if [ ! -f .env.example ]; then
    err ".env.example not found. Are you in the project root?"
    exit 1
  fi
  cp .env.example .env
  ok ".env created from .env.example"

  # Generate a cryptographically random JWT secret
  if command -v openssl &>/dev/null; then
    JWT_SECRET=$(openssl rand -hex 64)
    # Portable in-place replacement (sed -i.bak works on macOS + Linux)
    sed -i.bak "s|change_me_64_hex_characters_minimum|${JWT_SECRET}|" .env
    rm -f .env.bak
    ok "JWT_SECRET generated (64 hex bytes via openssl)"
  else
    warn "openssl not found — set JWT_SECRET manually in .env before starting"
  fi
fi

echo ""
echo "📦  Services that will start:"
echo "   • PostgreSQL   — internal only (Docker network)"
echo "   • Spring Boot  — http://localhost:8080"
echo "   • Next.js      — http://localhost:3000"
echo "   • MailHog UI   — http://localhost:8025  (catches all outbound email)"
echo ""

# ── 2. Start Docker ───────────────────────────────────────────────────────────
if $NO_START; then
  ok "Skipped Docker start (--no-start)"
  echo ""
  echo "To start manually:"
  echo "  $COMPOSE_CMD up --build"
  exit 0
fi

if ! command -v docker &>/dev/null; then
  err "Docker not found. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

echo "🐳  Building and starting containers…"
echo "   (first build takes a few minutes — subsequent starts are fast)"
echo ""

$COMPOSE_CMD up --build ${DOCKER_FLAGS[@]+"${DOCKER_FLAGS[@]}"}
