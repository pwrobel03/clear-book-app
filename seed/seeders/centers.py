"""
seed/seeders/centers.py
=======================
Inserts medical centres into the database.
medical_centers has no UNIQUE constraint on name in the schema, so we
use a plain SELECT-then-INSERT guard instead of ON CONFLICT.
"""

from seed.helpers import uid, now_ts
from seed.data.centers import MEDICAL_CENTERS


def seed_medical_centers(cur) -> list[str]:
    """
    Ensure all MEDICAL_CENTERS exist.
    Returns a list of UUIDs in the same order as MEDICAL_CENTERS.
    """
    center_ids: list[str] = []

    for mc in MEDICAL_CENTERS:
        cur.execute(
            "SELECT id FROM medical_centers WHERE name = %s",
            (mc["name"],),
        )
        row = cur.fetchone()

        if row:
            center_id = str(row[0])
        else:
            center_id = uid()
            ts = now_ts()
            cur.execute(
                """
                INSERT INTO medical_centers
                    (id, name, type, status, city, address, phone, email,
                     website, description, created_at, updated_at)
                VALUES (%s, %s, %s, 'ACTIVE', %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    center_id, mc["name"], mc["type"], mc["city"], mc["address"],
                    mc["phone"], mc["email"], mc["website"], mc["description"], ts, ts,
                ),
            )

        center_ids.append(center_id)
        print(f"  · {mc['name']}  [{mc['city']}]")

    return center_ids
