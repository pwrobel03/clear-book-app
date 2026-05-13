"""
seed/reset.py
=============
Removes all previously seeded demo data in strict dependency order so that
foreign-key constraints are never violated.

Only rows created by this seeder are removed – the application's own bootstrap
data (admin@clearbook.com, specializations, etc.) is left untouched.
"""

from seed.data.centers import MEDICAL_CENTERS

# Email patterns that identify seeded accounts
_DEMO_PATTERNS = ["%@clearbook.demo", "%@example.com"]


def reset_seeded_data(cur) -> None:
    """Delete all demo data seeded by this script."""
    print("  ⚠  Resetting seeded data…")

    p = _DEMO_PATTERNS   # shorthand for repeated use

    # 1. Reviews that belong to seeded doctors' appointments
    cur.execute(
        """
        DELETE FROM appointment_reviews
        WHERE appointment_id IN (
            SELECT a.id
            FROM   appointments a
            JOIN   availability_blocks ab ON ab.id       = a.block_id
            JOIN   users              u  ON u.id         = ab.doctor_id
            WHERE  u.email LIKE %s OR u.email LIKE %s
        )
        """,
        p,
    )

    # 2. Appointments booked by seeded patients
    cur.execute(
        "DELETE FROM appointments WHERE patient_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        p,
    )

    # 3. Appointments in seeded doctors' blocks (catch any remainder)
    cur.execute(
        """
        DELETE FROM appointments
        WHERE block_id IN (
            SELECT ab.id
            FROM   availability_blocks ab
            JOIN   users u ON u.id = ab.doctor_id
            WHERE  u.email LIKE %s OR u.email LIKE %s
        )
        """,
        p,
    )

    # 4. Availability blocks owned by seeded doctors
    cur.execute(
        "DELETE FROM availability_blocks WHERE doctor_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        p,
    )

    # 5. Clinic memberships
    cur.execute(
        "DELETE FROM center_memberships WHERE user_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        p,
    )

    # 6. Doctor–specialization join rows
    cur.execute(
        """
        DELETE FROM doctor_profile_specializations
        WHERE doctor_profile_id IN (
            SELECT dp.id
            FROM   doctor_profiles dp
            JOIN   users u ON u.id = dp.user_id
            WHERE  u.email LIKE %s OR u.email LIKE %s
        )
        """,
        p,
    )

    # 7. Doctor services
    cur.execute(
        "DELETE FROM doctor_services WHERE doctor_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        p,
    )

    # 8. Doctor profiles
    cur.execute(
        "DELETE FROM doctor_profiles WHERE user_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        p,
    )

    # 9. All seeded user accounts (doctors + patients)
    cur.execute(
        "DELETE FROM users WHERE email LIKE %s OR email LIKE %s",
        p,
    )

    # 10. Medical centres (identified by name)
    center_names = [mc["name"] for mc in MEDICAL_CENTERS]
    cur.execute(
        "DELETE FROM medical_centers WHERE name = ANY(%s)",
        (center_names,),
    )

    print("  ✓ Reset complete")
