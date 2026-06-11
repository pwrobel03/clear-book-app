#!/usr/bin/env python3
"""
ClearBook – extend_schedules.py
================================
Automatically extends future availability blocks for ALL active doctors
based on their existing schedule pattern.

What it does
------------
For each doctor who has at least one block in the last LOOKBACK_DAYS days:
  1. Reads their active center memberships (status = 'ACTIVE')
  2. Infers their typical work hours from recent blocks
  3. Infers which center they use on each weekday (Mon–Fri) from recent blocks
  4. Creates missing blocks up to HORIZON_WEEKS weeks into the future

The script is fully IDEMPOTENT — safe to run multiple times per day.
It never modifies or deletes existing blocks.

Usage
-----
  # Directly (requires DB accessible on host):
  python extend_schedules.py

  # Inside Docker network (recommended for production):
  docker run --rm \
    --network clearbook_clearbook-net \
    -v "$(pwd)":/app -w /app \
    -e DB_HOST=postgres-db \
    -e DB_NAME=<name> -e DB_USER=<user> -e DB_PASSWORD=<pass> \
    python:3.11-slim \
    bash -c "pip install psycopg2-binary python-dotenv -q && python extend_schedules.py"

Environment variables
---------------------
  DB_HOST         (default: localhost)
  DB_PORT         (default: 5432)
  DB_NAME         (default: clearbook_db)
  DB_USER         (default: postgres)
  DB_PASSWORD     (default: "")
  HORIZON_WEEKS   (default: 8)   – how many weeks ahead to ensure blocks exist
  LOOKBACK_DAYS   (default: 28)  – how far back to look for work pattern
  DRY_RUN         (default: 0)   – set to 1 to print what would be created

The script also reads .env / api/.env automatically when python-dotenv is installed.
"""

import os
import sys
import uuid
from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta

# ─── Dependencies ─────────────────────────────────────────────────────────────

try:
    import psycopg2
except ImportError:
    sys.exit("Missing psycopg2. Install: pip install psycopg2-binary")

# python-dotenv is optional — load .env if present
try:
    from dotenv import load_dotenv
    from pathlib import Path
    _here = Path(__file__).resolve().parent
    for _cand in [_here, _here / "api"]:
        _env = _cand / ".env"
        if _env.exists():
            load_dotenv(_env)
            print(f"[env] Loaded {_env}")
            break
except ImportError:
    pass

# ─── Configuration ────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "5432")),
    "dbname":   os.getenv("DB_NAME",     "clearbook_db"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

HORIZON_WEEKS = int(os.getenv("HORIZON_WEEKS", "8"))
LOOKBACK_DAYS = int(os.getenv("LOOKBACK_DAYS", "28"))
DRY_RUN       = os.getenv("DRY_RUN", "0").strip() in ("1", "true", "yes")

DEFAULT_START_H = 8
DEFAULT_END_H   = 16


# ─── Helpers ──────────────────────────────────────────────────────────────────

def new_uuid() -> str:
    return str(uuid.uuid4())


def now_ts() -> datetime:
    return datetime.now()


def future_weekdays(weeks: int) -> list[date]:
    """Return all Mon–Fri dates from today through today + weeks."""
    today = date.today()
    end   = today + timedelta(weeks=weeks)
    out   = []
    d     = today
    while d <= end:
        if d.weekday() < 5:  # Mon=0 … Fri=4
            out.append(d)
        d += timedelta(days=1)
    return out


# ─── Database queries ──────────────────────────────────────────────────────────

def fetch_active_doctors(cur) -> list[str]:
    """Return IDs of doctors with ACTIVE / non-deleted accounts."""
    cur.execute(
        """
        SELECT id::text
        FROM   users
        WHERE  role   = 'DOCTOR'
          AND  status NOT IN ('DELETED', 'BANNED')
        """
    )
    return [r[0] for r in cur.fetchall()]


def fetch_active_centers(cur, doctor_id: str) -> list[str]:
    """Return center IDs where the doctor has an ACTIVE membership."""
    cur.execute(
        """
        SELECT center_id::text
        FROM   center_memberships
        WHERE  user_id = %s::uuid
          AND  status  = 'ACTIVE'
        ORDER  BY joined_at ASC NULLS LAST
        """,
        (doctor_id,),
    )
    return [r[0] for r in cur.fetchall()]


def fetch_recent_blocks(cur, doctor_id: str, days: int) -> list[dict]:
    """
    Return blocks from the last `days` days for this doctor.
    Each dict: {center_id, weekday (0-4), start_h, end_h, block_date}
    """
    since = date.today() - timedelta(days=days)
    cur.execute(
        """
        SELECT center_id::text,
               EXTRACT(DOW FROM start_time)::int AS dow,
               EXTRACT(HOUR FROM start_time)::int AS start_h,
               EXTRACT(HOUR FROM end_time)::int   AS end_h,
               DATE(start_time)                   AS block_date
        FROM   availability_blocks
        WHERE  doctor_id  = %s::uuid
          AND  is_deleted = false
          AND  DATE(start_time) >= %s
        ORDER  BY start_time DESC
        """,
        (doctor_id, since),
    )
    rows = cur.fetchall()
    out  = []
    for r in rows:
        center_id, dow, start_h, end_h, block_date = r
        # PostgreSQL DOW: 0=Sunday … 6=Saturday → convert to Python 0=Monday
        weekday = (dow - 1) % 7
        out.append({
            "center_id":  center_id,
            "weekday":    weekday,
            "start_h":    int(start_h),
            "end_h":      int(end_h),
            "block_date": block_date,
        })
    return out


def block_exists(cur, doctor_id: str, target_date: date) -> bool:
    """True if any non-deleted block for this doctor already covers target_date."""
    cur.execute(
        """
        SELECT 1
        FROM   availability_blocks
        WHERE  doctor_id  = %s::uuid
          AND  DATE(start_time) = %s
          AND  is_deleted = false
        LIMIT  1
        """,
        (doctor_id, target_date),
    )
    return cur.fetchone() is not None


def insert_block(
    cur,
    doctor_id:  str,
    center_id:  str,
    target_date: date,
    start_h:    int,
    end_h:      int,
) -> None:
    bid        = new_uuid()
    start_time = datetime.combine(target_date, time(start_h, 0))
    end_time   = datetime.combine(target_date, time(end_h,   0))
    cur.execute(
        """
        INSERT INTO availability_blocks
            (id, doctor_id, center_id, start_time, end_time, is_deleted, created_at)
        VALUES
            (%s::uuid, %s::uuid, %s::uuid, %s, %s, false, %s)
        """,
        (bid, doctor_id, center_id, start_time, end_time, now_ts()),
    )


# ─── Pattern inference ────────────────────────────────────────────────────────

def infer_work_hours(blocks: list[dict]) -> tuple[int, int]:
    """
    Return the most common (start_h, end_h) pair from recent blocks.
    Falls back to DEFAULT_START_H / DEFAULT_END_H if blocks are empty.
    """
    if not blocks:
        return DEFAULT_START_H, DEFAULT_END_H
    pairs   = [(b["start_h"], b["end_h"]) for b in blocks]
    counter = Counter(pairs)
    return counter.most_common(1)[0][0]


def infer_center_for_weekday(
    blocks:    list[dict],
    weekday:   int,
    centers:   list[str],
    day_index: int,
) -> str:
    """
    Choose the most appropriate center for a given weekday.

    Strategy:
    1. Look at the most recent block on the same weekday — use that center.
    2. If no history for that weekday, fall back to round-robin over centers
       using the calendar day index (same rotation logic as the seeder).
    3. If the doctor has no active memberships, return None.
    """
    if not centers:
        return None  # type: ignore[return-value]

    # Filter blocks by matching weekday, most recent first
    same_day = [b for b in blocks if b["weekday"] == weekday]
    if same_day:
        # Use the center from the most recent occurrence of this weekday
        return same_day[0]["center_id"]

    # No history for this weekday — use round-robin
    return centers[day_index % len(centers)]


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("  ClearBook – Extend Schedules")
    print("=" * 60)
    print(f"  horizon  : {HORIZON_WEEKS} weeks ahead")
    print(f"  lookback : {LOOKBACK_DAYS} days")
    print(f"  dry-run  : {DRY_RUN}")
    print("=" * 60 + "\n")

    # ── Connect ───────────────────────────────────────────────────────────────
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur  = conn.cursor()
        print(f"✓ Connected to {DB_CONFIG['dbname']}@{DB_CONFIG['host']}\n")
    except Exception as exc:
        sys.exit(f"✗ Cannot connect: {exc}")

    future_dates    = future_weekdays(HORIZON_WEEKS)
    total_created   = 0
    total_skipped   = 0
    doctors_updated = 0

    try:
        doctors = fetch_active_doctors(cur)
        print(f"Found {len(doctors)} active doctor(s)\n")

        for doctor_id in doctors:
            centers = fetch_active_centers(cur, doctor_id)
            if not centers:
                continue  # not a member of any center — skip

            recent_blocks = fetch_recent_blocks(cur, doctor_id, LOOKBACK_DAYS)
            if not recent_blocks:
                # Doctor has no recent schedule pattern — skip to avoid
                # creating blocks on days they may have deliberately left empty.
                total_skipped += 1
                continue

            start_h, end_h = infer_work_hours(recent_blocks)
            doctor_created = 0

            for i, target_date in enumerate(future_dates):
                if block_exists(cur, doctor_id, target_date):
                    continue  # already covered

                weekday   = target_date.weekday()
                center_id = infer_center_for_weekday(
                    recent_blocks, weekday, centers, i
                )
                if center_id not in centers:
                    # Inferred center is no longer an active membership
                    center_id = centers[i % len(centers)]

                if DRY_RUN:
                    print(
                        f"  [DRY] {target_date}  doctor={doctor_id[:8]}…"
                        f"  center={center_id[:8]}…  {start_h:02d}:00–{end_h:02d}:00"
                    )
                else:
                    insert_block(cur, doctor_id, center_id, target_date, start_h, end_h)

                doctor_created  += 1
                total_created   += 1

            if doctor_created:
                doctors_updated += 1

        if not DRY_RUN:
            conn.commit()
            print(f"✓ Commit complete.")
        else:
            conn.rollback()

    except Exception as exc:
        conn.rollback()
        print(f"\n✗ Error – rolled back: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

    print()
    print("=" * 60)
    print(f"  Blocks created  : {total_created}")
    print(f"  Doctors updated : {doctors_updated}")
    print(f"  Doctors skipped : {total_skipped} (no recent blocks)")
    print("=" * 60)


if __name__ == "__main__":
    main()
