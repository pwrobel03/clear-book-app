#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# scripts/run_in_docker.sh
# ─────────────────────────────────────────────────────────────────────────────
# Runs a Python script inside the Docker network so it can reach postgres-db
# without exposing the database port to the host.
#
# Usage:
#   ./scripts/run_in_docker.sh seed_database.py [extra args...]
#   ./scripts/run_in_docker.sh extend_schedules.py
#   HORIZON_WEEKS=12 ./scripts/run_in_docker.sh extend_schedules.py
#   DRY_RUN=1        ./scripts/run_in_docker.sh extend_schedules.py
#
# Requirements:
#   • Docker running
#   • clearbook_clearbook-net network exists (i.e. docker compose up has run at
#     least once, or at minimum docker compose create --build)
#   • .env file present in the project root
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SCRIPT_NAME="${1:-}"
if [[ -z "$SCRIPT_NAME" ]]; then
    echo "Usage: $0 <script.py> [args...]" >&2
    exit 1
fi
shift   # remaining args forwarded to the Python script

# ── Load .env to pass DB credentials as -e flags ─────────────────────────────
ENV_FILE="${PROJECT_DIR}/.env"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: .env not found at ${ENV_FILE}" >&2
    exit 1
fi

# Build list of -e KEY=VALUE flags from .env (skip comments and blanks)
ENV_FLAGS=()
while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^\s*# ]] && continue   # skip comments
    [[ -z "${line// }"   ]] && continue  # skip blank lines
    key="${line%%=*}"
    val="${line#*=}"
    # Remove surrounding quotes if present
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    ENV_FLAGS+=( -e "${key}=${val}" )
done < "$ENV_FILE"

# ── Extra env vars from caller (e.g. HORIZON_WEEKS, DRY_RUN) ─────────────────
EXTRA_ENV_FLAGS=()
for var in HORIZON_WEEKS LOOKBACK_DAYS DRY_RUN; do
    if [[ -n "${!var:-}" ]]; then
        EXTRA_ENV_FLAGS+=( -e "${var}=${!var}" )
    fi
done

echo "──────────────────────────────────────────────────────────"
echo "  Running: ${SCRIPT_NAME} $*"
echo "  Network: clearbook_clearbook-net"
echo "──────────────────────────────────────────────────────────"

/usr/bin/docker run --rm \
    --network clearbook_clearbook-net \
    -v "${PROJECT_DIR}":/app \
    -w /app \
    -e DB_HOST=postgres-db \
    "${ENV_FLAGS[@]}" \
    "${EXTRA_ENV_FLAGS[@]}" \
    python:3.11-slim \
    bash -c "
        pip install psycopg2-binary bcrypt python-dotenv -q
        python ${SCRIPT_NAME} $*
    "
