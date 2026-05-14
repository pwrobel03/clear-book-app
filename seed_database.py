#!/usr/bin/env python3
"""
ClearBook – Database Seed  (entry point)
=========================================
Orchestrates all seeding steps in the correct order.
All logic lives in the seed/ package; this file is intentionally thin.

Usage
-----
    pip install psycopg2-binary bcrypt python-dotenv
    python seed_database.py                              # default run (200 patients)
    python seed_database.py --reset                      # wipe & re-seed
    python seed_database.py --patients 50                # fewer patients
    python seed_database.py --min-appts 5 --max-appts 8  # smaller per-patient window
    python seed_database.py --dry-run                    # validate connection only
"""

import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    sys.exit("Missing psycopg2. Install: pip install psycopg2-binary")

from seed.config import parse_args, DB_CONFIG, SEED_PASSWORD
from seed.reset import reset_seeded_data
from seed.data.centers import MEDICAL_CENTERS
from seed.data.doctors import generate_doctors
from seed.data.patients import make_patients

from seed.seeders.centers      import seed_medical_centers
from seed.seeders.doctors      import seed_doctors, seed_dummy_license, load_specializations
from seed.seeders.memberships  import seed_memberships
from seed.seeders.patients     import seed_patients
from seed.seeders.blocks       import seed_availability_blocks
from seed.seeders.appointments import seed_appointments_per_patient
from seed.seeders.reviews      import seed_reviews


def main() -> None:
    args = parse_args()

    print("=" * 60)
    print("  ClearBook – Database Seed")
    print("=" * 60)
    print(f"  doctors      : {args.doctors}")
    print(f"  patients     : {args.patients}")
    print(f"  appts/patient: {args.min_appts}–{args.max_appts}")
    print(f"  reset        : {args.reset}")
    print(f"  dry-run      : {args.dry_run}")
    print("=" * 60 + "\n")

    # ── Connect ───────────────────────────────────────────────────────────────
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur  = conn.cursor()
        print(f"✓ Connected to {DB_CONFIG['dbname']}@{DB_CONFIG['host']}\n")
    except Exception as exc:
        sys.exit(f"✗ Cannot connect: {exc}")

    if args.dry_run:
        print("Dry-run mode – connection OK. No data written.")
        cur.close(); conn.close()
        return

    try:
        # ── Optional reset ────────────────────────────────────────────────────
        if args.reset:
            print("─── Reset ────────────────────────────────────────────────")
            reset_seeded_data(cur)
            print()

        # ── 1. Medical centres ────────────────────────────────────────────────
        print("─── 1. Medical centres ───────────────────────────────────────")
        center_ids = seed_medical_centers(cur)

        # ── 2. Specializations (read-only; seeded by Spring Boot on startup) ──
        print("\n─── 2. Specializations ───────────────────────────────────────")
        spec_map = load_specializations(cur)

        # ── 3. Dummy licence PDF ──────────────────────────────────────────────
        print("\n─── 3. Dummy licence PDF ─────────────────────────────────────")
        seed_dummy_license(Path(__file__).resolve().parent)

        # ── 4. Doctors · profiles · services ─────────────────────────────────
        print("\n─── 4. Doctors · profiles · services ────────────────────────")
        doctor_defs = generate_doctors(args.doctors, MEDICAL_CENTERS)
        doctor_data = seed_doctors(cur, spec_map, doctor_defs)

        # ── 5. Clinic memberships ─────────────────────────────────────────────
        print("\n─── 5. Clinic memberships ────────────────────────────────────")
        seed_memberships(cur, doctor_data, center_ids)

        # ── 6. Patients ───────────────────────────────────────────────────────
        print("\n─── 6. Patients ──────────────────────────────────────────────")
        patient_ids = seed_patients(cur, make_patients(args.patients))

        # ── 7. Availability blocks (Mon–Fri, 4 wks back + 2 wks ahead) ───────
        print("\n─── 7. Availability blocks ───────────────────────────────────")
        block_map = seed_availability_blocks(cur, doctor_data, center_ids)

        # ── 8. Appointments (per-patient, load-balanced across doctors) ───────
        print("\n─── 8. Appointments (per-patient) ────────────────────────────")
        all_appts = seed_appointments_per_patient(
            cur, doctor_data, patient_ids, block_map,
            min_appts=args.min_appts,
            max_appts=args.max_appts,
        )

        # ── 9. Reviews ────────────────────────────────────────────────────────
        print("\n─── 9. Reviews ───────────────────────────────────────────────")
        seed_reviews(cur, all_appts)

        conn.commit()
        print("\n✓ Commit – all data saved.\n")

    except Exception as exc:
        conn.rollback()
        print(f"\n✗ Error – rolled back: {exc}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

    print("=" * 60)
    print("  Seed complete!")
    print(f"  All demo accounts use password: {SEED_PASSWORD}")
    print("=" * 60)


if __name__ == "__main__":
    main()
