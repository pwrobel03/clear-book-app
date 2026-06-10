"""
seed/seeders/fixed_accounts.py
================================
Creates three fixed demo accounts that are always present in the database:

    rmarcjan@clearbook.com  –  Robert Marcjan   (patient / USER)
    pwrobel@clearbook.com   –  Piotr Wróbel     (doctor  / DOCTOR)
    bkozyra@clearbook.com   –  Bartosz Kozyra   (admin   / ADMIN)

All three accounts survive a --reset because the reset script explicitly
targets these emails rather than using a broad pattern.

Doctor setup (pwrobel)
----------------------
  • DoctorProfile  –  CARDIOLOGY specialist, public profile
  • 3 services     –  consultation / ECG / Holter
  • 1 center       –  first active centre in center_ids (Varsovia Medical Clinic)
  • Availability   –  Mon–Fri 09:00–17:00, past_weeks back + future_weeks ahead

Patient appointments (rmarcjan)
-------------------------------
Booked with pwrobel only (so the demo account has a clean, predictable history):
  • 3 × COMPLETED  (past)
  • 1 × CANCELLED  (past)
  • 2 × SCHEDULED  (future)
"""

from datetime import date, datetime, time, timedelta

from seed.config import SEED_PASSWORD, DUMMY_LICENSE_PATH
from seed.helpers import uid, now_ts, hash_pw, upsert_returning, col_exists


# ─── Account definitions ──────────────────────────────────────────────────────

_PATIENT = {
    "email":      "rmarcjan@clearbook.com",
    "first_name": "Robert",
    "last_name":  "Marcjan",
    "role":       "USER",
    "password":   SEED_PASSWORD,
}

_DOCTOR = {
    "email":        "pwrobel@clearbook.com",
    "first_name":   "Piotr",
    "last_name":    "Wrobel",
    "role":         "DOCTOR",
    "password":     SEED_PASSWORD,
    "public_id":    "piotr-wrobel-demo",
    "license":      "PWZ-7654321",
    "bio": (
        "Cardiologist with over 12 years of clinical experience in preventive "
        "cardiology and non-invasive diagnostics. Graduate of the Medical "
        "University of Warsaw. Dedicated to building long-term relationships "
        "with patients and providing evidence-based care."
    ),
    "specialization": "CARDIOLOGY",
    "services": [
        {"name": "Cardiology Consultation", "duration": 60, "price": 250.00},
        {"name": "ECG (Resting)",            "duration": 30, "price": 150.00},
        {"name": "Holter Monitoring Setup",  "duration": 30, "price": 200.00},
    ],
    "work_hours": (9, 17),   # 09:00 – 17:00
}

_ADMIN = {
    "email":      "bkozyra@clearbook.com",
    "first_name": "Bartosz",
    "last_name":  "Kozyra",
    "role":       "ADMIN",
    "password":   SEED_PASSWORD,
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _ensure_user(cur, account: dict) -> str:
    """Insert or fetch a user account; return the UUID."""
    hashed = hash_pw(account["password"])
    return upsert_returning(
        cur,
        """
        INSERT INTO users
            (id, email, password, first_name, last_name, role, status, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE', %s)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
        """,
        (
            uid(), account["email"], hashed,
            account["first_name"], account["last_name"],
            account["role"], now_ts(),
        ),
        "SELECT id FROM users WHERE email = %s",
        (account["email"],),
    )


# ─── Doctor setup ─────────────────────────────────────────────────────────────

def _ensure_doctor_profile(cur, user_id: str, spec_map: dict) -> tuple[str, list[dict]]:
    """
    Create/fetch doctor profile, specialization links, and services.
    Returns (profile_id, service_rows).
    """
    has_ver      = col_exists(cur, "doctor_profiles", "verification_status")
    has_lic_file = col_exists(cur, "doctor_profiles", "license_file_path")

    extra_cols, extra_vals = [], []
    if has_ver:
        extra_cols.append("verification_status"); extra_vals.append("VERIFIED")
    if has_lic_file:
        extra_cols.append("license_file_path");   extra_vals.append(DUMMY_LICENSE_PATH)

    col_fragment = (", " + ", ".join(extra_cols)) if extra_cols else ""
    ph_fragment  = (", " + ", ".join(["%s"] * len(extra_vals))) if extra_vals else ""

    profile_id = upsert_returning(
        cur,
        f"""
        INSERT INTO doctor_profiles
            (id, user_id, public_id, bio, license_number,
             is_public, average_rating, total_reviews,
             created_at, updated_at{col_fragment})
        VALUES (%s, %s, %s, %s, %s, true, 0.0, 0, %s, %s{ph_fragment})
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id
        """,
        (
            uid(), user_id, _DOCTOR["public_id"], _DOCTOR["bio"],
            _DOCTOR["license"], now_ts(), now_ts(), *extra_vals,
        ),
        "SELECT id FROM doctor_profiles WHERE user_id = %s",
        (user_id,),
    )

    # Specialization link
    spec_id = spec_map.get(_DOCTOR["specialization"])
    if spec_id:
        cur.execute(
            """
            INSERT INTO doctor_profile_specializations
                (doctor_profile_id, specialization_id)
            VALUES (%s, %s) ON CONFLICT DO NOTHING
            """,
            (profile_id, spec_id),
        )

    # Services
    service_rows = []
    for svc in _DOCTOR["services"]:
        cur.execute(
            "SELECT id FROM doctor_services WHERE doctor_id=%s AND name=%s",
            (user_id, svc["name"]),
        )
        row = cur.fetchone()
        if row:
            svc_id = str(row[0])
        else:
            svc_id = uid()
            cur.execute(
                """
                INSERT INTO doctor_services
                    (id, doctor_id, name, duration_minutes, price, active)
                VALUES (%s, %s, %s, %s, %s, true)
                """,
                (svc_id, user_id, svc["name"], svc["duration"], svc["price"]),
            )
        service_rows.append({"id": svc_id, **svc})

    return profile_id, service_rows


def _ensure_membership(cur, user_id: str, center_id: str) -> None:
    """Ensure the doctor is an ACTIVE MEMBER of the given centre."""
    cur.execute(
        "SELECT 1 FROM center_memberships WHERE user_id=%s AND center_id=%s",
        (user_id, center_id),
    )
    if cur.fetchone():
        return

    # Determine role: ADMIN if the centre has no admin yet
    cur.execute(
        "SELECT 1 FROM center_memberships WHERE center_id=%s AND role='ADMIN' LIMIT 1",
        (center_id,),
    )
    role = "ADMIN" if not cur.fetchone() else "MEMBER"

    cur.execute(
        """
        INSERT INTO center_memberships
            (id, user_id, center_id, role, status, invited_at, joined_at)
        VALUES (%s, %s, %s, %s, 'ACTIVE', %s, %s)
        ON CONFLICT (user_id, center_id) DO NOTHING
        """,
        (uid(), user_id, center_id, role, now_ts(), now_ts()),
    )


def _ensure_blocks(
    cur, user_id: str, center_id: str,
    past_weeks: int, future_weeks: int,
) -> dict:
    """
    Create Mon–Fri 09:00–17:00 blocks for pwrobel.
    Returns a block_map compatible with the appointment seeder format:
        key: (user_id, center_id, date_str)  →  block_id
    """
    start_h, end_h = _DOCTOR["work_hours"]
    today   = date.today()
    start_d = today - timedelta(weeks=past_weeks)
    end_d   = today + timedelta(weeks=future_weeks)

    block_map: dict = {}
    new_count = 0
    current   = start_d

    while current <= end_d:
        if current.weekday() < 5:          # Mon–Fri only
            block_start = datetime.combine(current, time(start_h, 0))
            block_end   = datetime.combine(current, time(end_h, 0))
            date_str    = current.strftime("%Y-%m-%d")

            cur.execute(
                """
                SELECT id FROM availability_blocks
                WHERE doctor_id=%s AND center_id=%s
                  AND start_time=%s AND is_deleted=false
                """,
                (user_id, center_id, block_start),
            )
            row = cur.fetchone()
            if row:
                block_id = str(row[0])
            else:
                block_id = uid()
                cur.execute(
                    """
                    INSERT INTO availability_blocks
                        (id, doctor_id, center_id, start_time, end_time,
                         is_deleted, created_at)
                    VALUES (%s, %s, %s, %s, %s, false, %s)
                    """,
                    (block_id, user_id, center_id,
                     block_start, block_end, now_ts()),
                )
                new_count += 1

            block_map[(user_id, center_id, date_str)] = block_id

        current += timedelta(days=1)

    print(f"  · pwrobel availability: {new_count} new block(s) created")
    return block_map


# ─── Patient appointments ─────────────────────────────────────────────────────

def _seed_rmarcjan_appointments(
    cur,
    patient_id:   str,
    doctor_uid:   str,
    service_rows: list[dict],
    block_map:    dict,
    center_id:    str,
) -> None:
    """
    Insert a small, deterministic set of appointments for Robert Marcjan
    with Dr Wróbel:  3 COMPLETED · 1 CANCELLED · 2 SCHEDULED
    """
    from seed.data.content import PATIENT_NOTES, DOCTOR_NOTES
    import random

    today      = date.today()
    svc_consult = next(
        (s for s in service_rows if "Consultation" in s["name"]),
        service_rows[0],
    )
    svc_ecg = next(
        (s for s in service_rows if "ECG" in s["name"]),
        service_rows[0],
    )

    # ── Past appointments ────────────────────────────────────────────────────
    past_plan = [
        # (weeks_ago, slot_hour, status)
        (6, 10, "COMPLETED"),
        (4, 11, "COMPLETED"),
        (3, 14, "CANCELLED"),
        (2, 10, "COMPLETED"),
    ]

    for weeks_ago, slot_hour, status in past_plan:
        appt_date  = today - timedelta(weeks=weeks_ago)
        # Advance to Monday if weekend
        while appt_date.weekday() >= 5:
            appt_date += timedelta(days=1)

        date_str   = appt_date.strftime("%Y-%m-%d")
        block_id   = block_map.get((doctor_uid, center_id, date_str))
        if not block_id:
            continue

        appt_start = datetime.combine(appt_date, time(slot_hour, 0))
        svc        = svc_ecg if slot_hour == 11 else svc_consult
        appt_end   = appt_start + timedelta(minutes=svc["duration"])

        cur.execute(
            "SELECT id FROM appointments WHERE block_id=%s AND start_time=%s",
            (block_id, appt_start),
        )
        if cur.fetchone():
            continue

        d_notes  = random.choice(DOCTOR_NOTES) if status == "COMPLETED" else None
        created  = appt_start - timedelta(days=random.randint(3, 14))

        cur.execute(
            """
            INSERT INTO appointments
                (id, block_id, patient_id, service_id,
                 start_time, end_time, status,
                 patient_notes, doctor_notes, reminder_sent, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, false, %s)
            """,
            (
                uid(), block_id, patient_id, svc["id"],
                appt_start, appt_end, status,
                random.choice(PATIENT_NOTES), d_notes, created,
            ),
        )

    # ── Future appointments (SCHEDULED) ──────────────────────────────────────
    future_plan = [
        (1, 10, svc_consult),   # next week, 10:00
        (3,  9, svc_ecg),       # 3 weeks from now, 09:00
    ]

    for weeks_ahead, slot_hour, svc in future_plan:
        appt_date = today + timedelta(weeks=weeks_ahead)
        while appt_date.weekday() >= 5:
            appt_date += timedelta(days=1)

        date_str  = appt_date.strftime("%Y-%m-%d")
        block_id  = block_map.get((doctor_uid, center_id, date_str))
        if not block_id:
            continue

        appt_start = datetime.combine(appt_date, time(slot_hour, 0))
        appt_end   = appt_start + timedelta(minutes=svc["duration"])

        cur.execute(
            "SELECT id FROM appointments WHERE block_id=%s AND start_time=%s",
            (block_id, appt_start),
        )
        if cur.fetchone():
            continue

        created = today - timedelta(days=random.randint(1, 7))

        cur.execute(
            """
            INSERT INTO appointments
                (id, block_id, patient_id, service_id,
                 start_time, end_time, status,
                 patient_notes, doctor_notes, reminder_sent, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'SCHEDULED', %s, null, false, %s)
            """,
            (
                uid(), block_id, patient_id, svc["id"],
                appt_start, appt_end,
                random.choice(PATIENT_NOTES), created,
            ),
        )


# ─── Public entry point ───────────────────────────────────────────────────────

def seed_fixed_accounts(
    cur,
    center_ids:  list[str],
    spec_map:    dict,
    past_weeks:  int = 4,
    future_weeks: int = 8,
) -> None:
    """
    Idempotent – safe to run on every seed invocation.
    Creates all three fixed accounts and wires up the doctor's data.

    Parameters
    ----------
    center_ids   : UUIDs returned by seed_medical_centers() (same order as MEDICAL_CENTERS)
    spec_map     : {code → id} from load_specializations()
    past_weeks   : history window for availability blocks
    future_weeks : future window for availability blocks
    """
    print("  Creating fixed accounts…")

    # ── 1. bkozyra – ADMIN ───────────────────────────────────────────────────
    _ensure_user(cur, _ADMIN)
    print(f"  · Admin   : {_ADMIN['email']}")

    # ── 2. rmarcjan – PATIENT ────────────────────────────────────────────────
    patient_id = _ensure_user(cur, _PATIENT)
    print(f"  · Patient : {_PATIENT['email']}")

    # ── 3. pwrobel – DOCTOR ──────────────────────────────────────────────────
    doctor_id = _ensure_user(cur, _DOCTOR)
    print(f"  · Doctor  : {_DOCTOR['email']}")

    if not center_ids:
        print("  ⚠  No centers available – skipping doctor setup")
        return

    center_id = center_ids[0]   # Varsovia Medical Clinic

    _, service_rows = _ensure_doctor_profile(cur, doctor_id, spec_map)
    _ensure_membership(cur, doctor_id, center_id)

    block_map = _ensure_blocks(
        cur, doctor_id, center_id, past_weeks, future_weeks,
    )

    # ── 4. rmarcjan appointments with pwrobel ────────────────────────────────
    _seed_rmarcjan_appointments(
        cur, patient_id, doctor_id, service_rows, block_map, center_id,
    )

    print(f"  · rmarcjan appointments with pwrobel: seeded")
    print(f"  ✓ Fixed accounts ready  (password: {SEED_PASSWORD})")
