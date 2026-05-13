"""
seed/config.py
==============
Database connection settings, shared constants, and CLI argument parser.
Values are read from environment variables (populated automatically from .env
if python-dotenv is installed).
"""

import argparse
import os
import sys
from pathlib import Path

# ─── Load .env ────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv

    _here = Path(__file__).resolve().parent.parent   # project root
    for _candidate in [_here, _here / "api"]:
        _env = _candidate / ".env"
        if _env.exists():
            load_dotenv(_env)
            print(f"[env] Loaded {_env}")
            break
except ImportError:
    pass  # python-dotenv not installed; rely on os.environ

# ─── Database connection ──────────────────────────────────────────────────────
DB_CONFIG: dict = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "5432")),
    "dbname":   os.getenv("DB_NAME",     "clearbook_db"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# ─── Shared constants ─────────────────────────────────────────────────────────

# All demo accounts share this password (bcrypt-compatible with Spring Security).
SEED_PASSWORD: str = "Demo1234!"

# Path written into doctor_profiles.license_file_path (relative to the api/ root).
DUMMY_LICENSE_PATH: str = "uploads/licenses/dummy_license.pdf"

# ─── CLI argument parser ──────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    """Return parsed CLI arguments."""
    p = argparse.ArgumentParser(
        description="ClearBook database seeder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python seed_database.py\n"
            "  python seed_database.py --reset\n"
            "  python seed_database.py --patients 20 --past 80 --future 40\n"
            "  python seed_database.py --dry-run\n"
        ),
    )
    p.add_argument(
        "--doctors", type=int, default=80,
        help="Number of doctor accounts to generate (default: 80)",
    )
    p.add_argument(
        "--patients", type=int, default=10,
        help="Number of patient accounts to generate (default: 10)",
    )
    p.add_argument(
        "--past", type=int, default=45,
        help="Target number of past appointments (default: 45)",
    )
    p.add_argument(
        "--future", type=int, default=25,
        help="Target number of future SCHEDULED appointments (default: 25)",
    )
    p.add_argument(
        "--reset", action="store_true",
        help="Delete all previously seeded data before inserting",
    )
    p.add_argument(
        "--dry-run", action="store_true",
        help="Connect and validate only – do not write anything",
    )
    return p.parse_args()
