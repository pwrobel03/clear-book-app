"""
seed/seeders/blocks.py
======================
Creates availability blocks (working shifts) for each doctor.

Coverage window
---------------
  • 4 weeks back  – past blocks required by seed_past_appointments
  • 2 weeks ahead – future blocks visible to patients for booking

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
    doctor_data: list[dict],
    center_ids:  list[str],
) -> dict:
    """
    Ensure all Mon-Fri blocks exist for the 6-week window.

    Returns
    -------
    dict
        Key   : (doctor_user_id: str, center_id: str, date_str: str)
        Value : block_id (str UUID)
    """
    today   = date.today()
    start_d = today - timedelta(weeks=4)
    end_d   = today + timedelta(weeks=2)

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
                    "WHERE doctor_id=%s AND center_id=%s AND DATE(start_time)=%s",
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
                            (id, doctor_id, center_id, start_time, end_time, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
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
