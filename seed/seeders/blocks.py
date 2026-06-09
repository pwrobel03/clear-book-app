"""
seed/seeders/blocks.py
======================
Creates availability blocks (working shifts) for each doctor.

Coverage window
---------------
  Controlled by ``past_weeks`` and ``future_weeks`` parameters:
    • past_weeks   (default 4) – history required for COMPLETED/CANCELLED seed
    • future_weeks (default 8) – visible calendar for patient booking

Schedule
--------
  Mon–Fri only. Each doctor alternates between their two assigned
  centres day-by-day so the calendar is distributed evenly.
  Work-hour ranges come from the doctor definition (e.g. 8–16, 10–18).
"""

from datetime import date, datetime, time, timedelta

from seed.helpers import uid, now_ts


def seed_availability_blocks(
    cur,
    doctor_data:  list[dict],
    center_ids:   list[str],
    past_weeks:   int = 4,
    future_weeks: int = 8,
) -> dict:
    """
    Ensure all Mon-Fri blocks exist for the requested window.

    Parameters
    ----------
    past_weeks   : weeks of history to create (for past appointment seeding)
    future_weeks : weeks ahead to create (visible to patients for booking)

    Returns
    -------
    dict
        Key   : (doctor_user_id: str, center_id: str, date_str: str)
        Value : block_id (str UUID)
    """
    today   = date.today()
    start_d = today - timedelta(weeks=past_weeks)
    end_d   = today + timedelta(weeks=future_weeks)

    print(
        f"  Window: {start_d}  →  {end_d}  "
        f"({past_weeks} wks back, {future_weeks} wks ahead)"
    )

    block_map: dict = {}
    new_count = 0

    current = start_d
    while current <= end_d:
        if current.weekday() < 5:                          # Mon(0) … Fri(4)
            day_offset = (current - start_d).days
            for doc in doctor_data:
                wh        = doc["work_hours"]              # (start_h, end_h)
                ci        = doc["centers"][day_offset % len(doc["centers"])]
                center_id = center_ids[ci]
                doc_id    = doc["user_id"]
                key       = (doc_id, center_id, str(current))

                if key in block_map:
                    continue                                # already in memory

                cur.execute(
                    "SELECT id FROM availability_blocks "
                    "WHERE doctor_id=%s AND center_id=%s AND DATE(start_time)=%s "
                    "AND is_deleted = false",
                    (doc_id, center_id, current),
                )
                row = cur.fetchone()
                if row:
                    block_map[key] = str(row[0])
                else:
                    bid = uid()
                    bs  = datetime.combine(current, time(wh[0], 0))
                    be  = datetime.combine(current, time(wh[1], 0))
                    cur.execute(
                        """
                        INSERT INTO availability_blocks
                            (id, doctor_id, center_id,
                             start_time, end_time, is_deleted, created_at)
                        VALUES (%s, %s, %s, %s, %s, false, %s)
                        """,
                        (bid, doc_id, center_id, bs, be, now_ts()),
                    )
                    block_map[key] = bid
                    new_count += 1

        current += timedelta(days=1)

    print(
        f"  + {new_count} new block(s) created  "
        f"|  {len(block_map)} total block-keys in window"
    )
    return block_map
