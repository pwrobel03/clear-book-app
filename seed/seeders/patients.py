"""
seed/seeders/patients.py
========================
Creates patient (USER role) accounts.
"""

from seed.config import SEED_PASSWORD
from seed.helpers import uid, now_ts, hash_pw, upsert_returning


def seed_patients(cur, patients: list[dict]) -> list[str]:
    """
    Ensure all patient accounts exist.

    Parameters
    ----------
    patients : list[dict]
        Each dict must have: first_name, last_name, email.
        Typically produced by seed.data.patients.make_patients().

    Returns
    -------
    list[str]
        UUIDs for every patient, in the same order as *patients*.
    """
    hashed_pw   = hash_pw(SEED_PASSWORD)
    patient_ids: list[str] = []

    for p in patients:
        pid = upsert_returning(
            cur,
            """
            INSERT INTO users
                (id, email, password, first_name, last_name, role, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'USER', 'ACTIVE', %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (uid(), p["email"], hashed_pw, p["first_name"], p["last_name"], now_ts()),
            "SELECT id FROM users WHERE email = %s",
            (p["email"],),
        )
        patient_ids.append(pid)

    print(f"  · {len(patient_ids)} patient account(s) ready")
    return patient_ids
