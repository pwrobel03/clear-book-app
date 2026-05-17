"""
seed/helpers.py
===============
Low-level utilities shared across all seeder modules:
  - UUID / timestamp generation
  - BCrypt password hashing
  - UPSERT helper (INSERT … ON CONFLICT DO NOTHING RETURNING id)
  - Schema introspection (column existence check)
"""

import uuid
import sys
from datetime import datetime

try:
    import bcrypt
except ImportError:
    sys.exit("Missing bcrypt. Install: pip install bcrypt")


# ─── Generators ───────────────────────────────────────────────────────────────

def uid() -> str:
    """Return a fresh UUID4 as a lowercase string."""
    return str(uuid.uuid4())


def now_ts() -> datetime:
    """Return the current local datetime (no timezone)."""
    return datetime.now()


def hash_pw(raw: str) -> str:
    """Return a BCrypt hash compatible with Spring Security's BCryptPasswordEncoder."""
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=10)).decode()


# ─── Database helpers ─────────────────────────────────────────────────────────

def upsert_returning(
    cur,
    sql_insert: str,
    insert_params: tuple,
    sql_select: str,
    select_params: tuple,
) -> str:
    """
    Execute an INSERT … ON CONFLICT DO NOTHING RETURNING id.
    If RETURNING yields nothing (row already existed), fall back to SELECT.
    Returns the row id as a string in both cases.

    Example
    -------
    user_id = upsert_returning(
        cur,
        "INSERT INTO users (id, email) VALUES (%s,%s) ON CONFLICT (email) DO NOTHING RETURNING id",
        (new_uuid, email),
        "SELECT id FROM users WHERE email = %s",
        (email,),
    )
    """
    cur.execute(sql_insert, insert_params)
    row = cur.fetchone()
    if row:
        return str(row[0])
    cur.execute(sql_select, select_params)
    return str(cur.fetchone()[0])


def col_exists(cur, table: str, column: str) -> bool:
    """Return True if *column* exists in *table* (current schema)."""
    cur.execute(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = %s AND column_name = %s",
        (table, column),
    )
    return cur.fetchone() is not None
