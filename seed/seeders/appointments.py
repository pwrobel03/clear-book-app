"""
seed/seeders/appointments.py
============================
Generates past and future appointments.

Past  → COMPLETED / CANCELLED / NO_SHOW  (60 / 25 / 15 weight)
Future → SCHEDULED only (no doctor notes, no reviews yet)

_pick_slots() is a shared helper that avoids double-booking the same
(block, start_time) slot and is reused by both public functions.
"""

import random
from datetime import date, datetime, time, timedelta

from seed.helpers import uid, now_ts
from seed.data.content import PATIENT_NOTES, DOCTOR_NOTES


# ─── Internal slot sampler ────────────────────────────────────────────────────

def _pick_slots(
    block_map:   dict,
    doctor_data: list[dict],
    keys:        list,
    slot_used:   set,
    target:      int,
    status_dist: list[tuple],   # [(status_str, weight), …]
) -> list[tuple]:
    """
    Randomly sample up to *target* non-overlapping slots from *keys*.

    Returns
    -------
    list of (block_id, service_dict, start_datetime, end_datetime, status_str)
    """
    statuses, weights = zip(*status_dist)
    result: list[tuple] = []

    random.shuffle(keys)
    for key in keys * 4:           # multiple passes to reach the target
        if len(result) >= target:
            break

        doc_id, _center_id, date_str = key
        block_id = block_map[key]

        doc = next((d for d in doctor_data if d["user_id"] == doc_id), None)
        if not doc or not doc["services"]:
            continue

        svc   = random.choice(doc["services"])
        wh    = doc["work_hours"]              # (start_h, end_h)
        dur   = svc["duration"]

        # Build 30-minute-aligned slot offsets that fit within the block
        slots = list(range(wh[0] * 60, wh[1] * 60 - dur + 1, 30))
        if not slots:
            continue

        slot_min   = random.choice(slots)
        appt_date  = datetime.strptime(date_str, "%Y-%m-%d").date()
        appt_start = datetime.combine(appt_date, time(slot_min // 60, slot_min % 60))
        appt_end   = appt_start + timedelta(minutes=dur)

        key_slot = (block_id, appt_start)
        if key_slot in slot_used:
            continue
        slot_used.add(key_slot)

        status = random.choices(statuses, weights=list(weights))[0]
        result.append((block_id, svc, appt_start, appt_end, status))

    return result


# ─── Public seeders ───────────────────────────────────────────────────────────

def seed_past_appointments(
    cur,
    doctor_data:  list[dict],
    patient_ids:  list[str],
    block_map:    dict,
    target:       int,
) -> list[tuple]:
    """
    Insert past appointments (start_time < today).

    Returns
    -------
    list of (appointment_id: str, status: str)
    Used by seed_reviews() to know which appointments can receive a review.
    """
    today     = date.today()
    past_keys = [k for k in block_map if k[2] < str(today)]

    if not past_keys:
        print("  ⚠  No past blocks found – skipping past appointments.")
        return []

    status_dist = [("COMPLETED", 60), ("CANCELLED", 25), ("NO_SHOW", 15)]
    slot_used:  set = set()
    slots = _pick_slots(block_map, doctor_data, past_keys, slot_used, target, status_dist)

    added: list[tuple] = []
    for block_id, svc, appt_start, appt_end, status in slots:
        # Skip if already in DB (idempotent re-run)
        cur.execute(
            "SELECT id, status FROM appointments WHERE block_id=%s AND start_time=%s",
            (block_id, appt_start),
        )
        existing = cur.fetchone()
        if existing:
            added.append((str(existing[0]), existing[1]))
            continue

        d_notes    = random.choice(DOCTOR_NOTES) if status == "COMPLETED" else None
        created_at = appt_start - timedelta(days=random.randint(1, 14))

        cur.execute(
            """
            INSERT INTO appointments
                (id, block_id, patient_id, service_id,
                 start_time, end_time, status,
                 patient_notes, doctor_notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, status
            """,
            (
                uid(), block_id, random.choice(patient_ids), svc["id"],
                appt_start, appt_end, status,
                random.choice(PATIENT_NOTES), d_notes, created_at,
            ),
        )
        row = cur.fetchone()
        if row:
            added.append((str(row[0]), row[1]))

    c = sum(1 for _, s in added if s == "COMPLETED")
    x = sum(1 for _, s in added if s == "CANCELLED")
    n = sum(1 for _, s in added if s == "NO_SHOW")
    print(
        f"  + {len(added)} past appointment(s)  "
        f"(COMPLETED {c}  |  CANCELLED {x}  |  NO_SHOW {n})"
    )
    return added


def seed_future_appointments(
    cur,
    doctor_data:  list[dict],
    patient_ids:  list[str],
    block_map:    dict,
    target:       int,
) -> list[tuple]:
    """
    Insert future appointments (start_time > today) with status SCHEDULED.

    Returns
    -------
    list of (appointment_id: str, 'SCHEDULED')
    """
    today       = date.today()
    future_keys = [k for k in block_map if k[2] > str(today)]

    if not future_keys:
        print("  ⚠  No future blocks found – skipping future appointments.")
        return []

    status_dist = [("SCHEDULED", 100)]
    slot_used:  set = set()
    slots = _pick_slots(block_map, doctor_data, future_keys, slot_used, target, status_dist)

    added: list[tuple] = []
    for block_id, svc, appt_start, appt_end, _status in slots:
        cur.execute(
            "SELECT id FROM appointments WHERE block_id=%s AND start_time=%s",
            (block_id, appt_start),
        )
        if cur.fetchone():
            continue

        created_at = appt_start - timedelta(days=random.randint(1, 7))

        cur.execute(
            """
            INSERT INTO appointments
                (id, block_id, patient_id, service_id,
                 start_time, end_time, status,
                 patient_notes, doctor_notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'SCHEDULED', %s, NULL, %s)
            RETURNING id
            """,
            (
                uid(), block_id, random.choice(patient_ids), svc["id"],
                appt_start, appt_end,
                random.choice(PATIENT_NOTES), created_at,
            ),
        )
        row = cur.fetchone()
        if row:
            added.append((str(row[0]), "SCHEDULED"))

    print(f"  + {len(added)} future SCHEDULED appointment(s)")
    return added
