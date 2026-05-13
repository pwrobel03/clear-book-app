"""
seed/seeders/memberships.py
===========================
Assigns doctors to their medical centres.

Role assignment strategy
------------------------
  • The first doctor registered at a given centre receives role = ADMIN.
  • All subsequent doctors at the same centre receive role = MEMBER.

This makes it possible to test the clinic management panel on the frontend
(only an ADMIN member can invite new doctors, edit clinic details, etc.)
without any manual setup.
"""

from seed.helpers import uid, now_ts
from seed.data.centers import MEDICAL_CENTERS


def seed_memberships(cur, doctor_data: list[dict], center_ids: list[str]) -> None:
    """
    Ensure every doctor is an ACTIVE member of each clinic in their centers list.

    Parameters
    ----------
    doctor_data : list[dict]
        Returned by seed_doctors(); each entry has 'user_id', 'display', 'centers'.
    center_ids  : list[str]
        UUIDs in the same order as MEDICAL_CENTERS, returned by seed_medical_centers().
    """
    # Pre-check which centres already have an ADMIN so we don't create two.
    center_has_admin: set[str] = set()
    for center_id in center_ids:
        cur.execute(
            "SELECT 1 FROM center_memberships "
            "WHERE center_id = %s AND role = 'ADMIN' LIMIT 1",
            (center_id,),
        )
        if cur.fetchone():
            center_has_admin.add(center_id)

    added = 0
    for doc in doctor_data:
        for ci in doc["centers"]:
            center_id    = center_ids[ci]
            center_name  = MEDICAL_CENTERS[ci]["name"]

            role = "MEMBER"
            if center_id not in center_has_admin:
                role = "ADMIN"
                center_has_admin.add(center_id)

            ts = now_ts()
            cur.execute(
                """
                INSERT INTO center_memberships
                    (id, user_id, center_id, role, status, invited_at, joined_at)
                VALUES (%s, %s, %s, %s, 'ACTIVE', %s, %s)
                ON CONFLICT (user_id, center_id) DO NOTHING
                """,
                (uid(), doc["user_id"], center_id, role, ts, ts),
            )

            if cur.rowcount:
                tag = "  [ADMIN]" if role == "ADMIN" else ""
                print(f"  · {doc['display']} → {center_name}{tag}")
                added += 1

    if not added:
        print("  · All memberships already existed")
    else:
        print(f"  + {added} membership(s) created")
