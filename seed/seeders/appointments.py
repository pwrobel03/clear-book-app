"""
seed/seeders/appointments.py
============================
Generates appointments on a **per-patient** basis.

For every patient the seeder books a random number of visits
(min_appts … max_appts) and guarantees:
  • at least 1 SCHEDULED (future) appointment
  • the remainder are past   (COMPLETED / CANCELLED / NO_SHOW)
  • doctors are chosen to keep the load balanced across the whole pool

Load-balancing strategy
-----------------------
A per-doctor counter (doc_appt_count) is maintained in memory.
Whenever a new slot is needed, doctors are sorted by their current
count and a random one is picked from the bottom third of the ranking.
This produces a close-to-uniform distribution without requiring a
deterministic round-robin that would be hard to resume on re-runs.

Past status weights  :  COMPLETED 70 / CANCELLED 20 / NO_SHOW 10

Returns
-------
list of (appointment_id: str, status: str)
Used by seed_reviews() to identify COMPLETED appointments.
"""

import random
from collections import defaultdict
from datetime import date, datetime, time, timedelta

from seed.helpers import uid, now_ts
from seed.data.content import PATIENT_NOTES, DOCTOR_NOTES


_PAST_STATUSES = ["COMPLETED", "CANCELLED", "NO_SHOW"]
_PAST_WEIGHTS  = [70, 20, 10]


# ─── Slot index ───────────────────────────────────────────────────────────────

def _build_slot_index(block_map: dict) -> tuple[dict, dict]:
    """
    Split block_map keys into two per-doctor dicts:
        past_idx[doc_id]   → list of (doc_id, center_id, date_str)  [past]
        future_idx[doc_id] → list of (doc_id, center_id, date_str)  [future]
    """
    today      = str(date.today())
    past_idx   = defaultdict(list)
    future_idx = defaultdict(list)

    for key in block_map:
        doc_id, _cid, date_str = key
        if date_str < today:
            past_idx[doc_id].append(key)
        elif date_str > today:
            future_idx[doc_id].append(key)

    return dict(past_idx), dict(future_idx)


# ─── Single-slot booker ───────────────────────────────────────────────────────

def _try_book(
    cur,
    block_map:   dict,
    keys:        list,
    slot_used:   set,
    patient_id:  str,
    doctor_data: list[dict],
    status:      str,
) -> tuple | None:
    """
    Attempt to book one appointment from *keys* (up to 30 random draws).

    Returns (appointment_id, status) on success, None if no free slot found.
    """
    is_future   = status == "SCHEDULED"
    max_lookback = 7 if is_future else 14

    candidates = keys.copy()
    random.shuffle(candidates)

    for key in candidates[:30]:
        doc_id, _cid, date_str = key
        block_id = block_map[key]

        doc = next((d for d in doctor_data if d["user_id"] == doc_id), None)
        if not doc or not doc["services"]:
            continue

        svc  = random.choice(doc["services"])
        wh   = doc["work_hours"]          # (start_h, end_h)
        dur  = svc["duration"]

        slots = list(range(wh[0] * 60, wh[1] * 60 - dur + 1, 30))
        if not slots:
            continue

        slot_min   = random.choice(slots)
        appt_date  = datetime.strptime(date_str, "%Y-%m-%d").date()
        appt_start = datetime.combine(appt_date, time(slot_min // 60, slot_min % 60))
        appt_end   = appt_start + timedelta(minutes=dur)

        slot_key = (block_id, appt_start)
        if slot_key in slot_used:
            continue
        slot_used.add(slot_key)

        # Idempotency – return existing row if present
        cur.execute(
            "SELECT id, status FROM appointments WHERE block_id=%s AND start_time=%s",
            (block_id, appt_start),
        )
        existing = cur.fetchone()
        if existing:
            return (str(existing[0]), str(existing[1]))

        d_notes    = random.choice(DOCTOR_NOTES) if status == "COMPLETED" else None
        created_at = appt_start - timedelta(days=random.randint(1, max_lookback))

        cur.execute(
            """
            INSERT INTO appointments
                (id, block_id, patient_id, service_id,
                 start_time, end_time, status,
                 patient_notes, doctor_notes, reminder_sent, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, false, %s)
            RETURNING id, status
            """,
            (
                uid(), block_id, patient_id, svc["id"],
                appt_start, appt_end, status,
                random.choice(PATIENT_NOTES), d_notes, created_at,
            ),
        )
        row = cur.fetchone()
        if row:
            return (str(row[0]), str(row[1]))

    return None


# ─── Doctor picker (load-balanced) ────────────────────────────────────────────

def _pick_doctor(
    doc_ids:        list[str],
    available_idx:  dict,
    doc_appt_count: dict,
) -> str | None:
    """
    Return the id of a doctor that has available slots in *available_idx*,
    preferring those with the fewest appointments booked so far.
    """
    eligible = [d for d in doc_ids if d in available_idx and available_idx[d]]
    if not eligible:
        return None

    eligible.sort(key=lambda d: doc_appt_count[d])

    # Randomly pick from the bottom third to avoid strict determinism
    pool_size = max(1, len(eligible) // 3)
    return random.choice(eligible[:pool_size])


# ─── Public seeder ────────────────────────────────────────────────────────────

def seed_appointments_per_patient(
    cur,
    doctor_data: list[dict],
    patient_ids: list[str],
    block_map:   dict,
    min_appts:   int = 7,
    max_appts:   int = 10,
) -> list[tuple]:
    """
    Insert *min_appts*–*max_appts* appointments for every patient.

    Guarantees
    ----------
    • ≥ 1 SCHEDULED (future) appointment per patient
    • Past appointments distributed by COMPLETED 70 / CANCELLED 20 / NO_SHOW 10
    • Doctor workload balanced via a per-doctor counter

    Returns
    -------
    list of (appointment_id: str, status: str)
    """
    past_idx, future_idx = _build_slot_index(block_map)
    doc_ids = [d["user_id"] for d in doctor_data]

    doc_appt_count: dict[str, int] = defaultdict(int)
    slot_used:      set            = set()
    all_added:      list[tuple]    = []

    for i, patient_id in enumerate(patient_ids):
        n_total  = random.randint(min_appts, max_appts)
        n_future = random.randint(1, min(2, n_total))
        n_past   = n_total - n_future

        # ── Future (SCHEDULED) ────────────────────────────────────────────────
        for _ in range(n_future):
            doc_id = _pick_doctor(doc_ids, future_idx, doc_appt_count)
            if doc_id is None:
                break
            result = _try_book(
                cur, block_map, future_idx[doc_id],
                slot_used, patient_id, doctor_data, "SCHEDULED",
            )
            if result:
                all_added.append(result)
                doc_appt_count[doc_id] += 1

        # ── Past (COMPLETED / CANCELLED / NO_SHOW) ────────────────────────────
        for _ in range(n_past):
            doc_id = _pick_doctor(doc_ids, past_idx, doc_appt_count)
            if doc_id is None:
                break
            status = random.choices(_PAST_STATUSES, weights=_PAST_WEIGHTS)[0]
            result = _try_book(
                cur, block_map, past_idx[doc_id],
                slot_used, patient_id, doctor_data, status,
            )
            if result:
                all_added.append(result)
                doc_appt_count[doc_id] += 1

        if (i + 1) % 50 == 0:
            print(f"  · {i + 1}/{len(patient_ids)} patients processed…")

    # ── Summary ───────────────────────────────────────────────────────────────
    c = sum(1 for _, s in all_added if s == "COMPLETED")
    x = sum(1 for _, s in all_added if s == "CANCELLED")
    n = sum(1 for _, s in all_added if s == "NO_SHOW")
    s = sum(1 for _, s in all_added if s == "SCHEDULED")
    total = len(all_added)

    print(
        f"  + {total} appointment(s)  "
        f"COMPLETED {c} | CANCELLED {x} | NO_SHOW {n} | SCHEDULED {s}"
    )

    # Per-doctor distribution stats
    counts = sorted(doc_appt_count.values())
    if counts:
        print(
            f"  · Doctor load  min={counts[0]}  "
            f"median={counts[len(counts)//2]}  max={counts[-1]}"
        )

    return all_added


# ─── Legacy helpers (kept for backward-compatibility) ─────────────────────────
# These are no longer called by seed_database.py but may be useful for
# one-off scripts or tests.

def seed_past_appointments(cur, doctor_data, patient_ids, block_map, target):
    """Deprecated – use seed_appointments_per_patient() instead."""
    import warnings
    warnings.warn(
        "seed_past_appointments is deprecated; use seed_appointments_per_patient()",
        DeprecationWarning, stacklevel=2,
    )
    return []


def seed_future_appointments(cur, doctor_data, patient_ids, block_map, target):
    """Deprecated – use seed_appointments_per_patient() instead."""
    import warnings
    warnings.warn(
        "seed_future_appointments is deprecated; use seed_appointments_per_patient()",
        DeprecationWarning, stacklevel=2,
    )
    return []
