"""
seed/reset.py
=============
Removes all previously seeded demo data in strict dependency order so that
foreign-key constraints are never violated.

Ownership rules
---------------
Tables that Spring Boot NEVER writes to (seeder owns 100 %):
    appointment_reviews, appointments, availability_blocks,
    center_memberships, medical_centers
→ These are deleted in full (all rows).

Tables that Spring Boot also writes to:
    doctor_profile_specializations, doctor_services, doctor_profiles,
    invite_codes, refresh_tokens, verification_tokens,
    password_reset_tokens, notifications, users
→ Filtered to demo email patterns (@clearbook.demo / @example.com).
    Spring Boot rows (admin@clearbook.com, etc.) are left untouched.
"""

# Email patterns that identify seeded demo accounts
_DEMO = ["%@clearbook.demo", "%@example.com"]


def reset_seeded_data(cur) -> None:
    """Delete all data seeded by this script."""
    print("  ⚠  Resetting seeded data…")

    # ── 1. Reviews (owns all rows) ────────────────────────────────────────────
    cur.execute("DELETE FROM appointment_reviews")

    # ── 2. Appointments (owns all rows) ───────────────────────────────────────
    cur.execute("DELETE FROM appointments")

    # ── 3. Availability blocks (owns all rows) ────────────────────────────────
    cur.execute("DELETE FROM availability_blocks")

    # ── 4. Clinic memberships (owns all rows) ─────────────────────────────────
    cur.execute("DELETE FROM center_memberships")

    # ── 5. Doctor–specialization links (filter to demo doctors only) ──────────
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
        _DEMO,
    )

    # ── 6. Doctor services (filter to demo doctors only) ──────────────────────
    cur.execute(
        "DELETE FROM doctor_services WHERE doctor_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        _DEMO,
    )

    # ── 7. Doctor profiles (filter to demo doctors only) ──────────────────────
    cur.execute(
        "DELETE FROM doctor_profiles WHERE user_id IN "
        "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
        _DEMO,
    )

    # ── 8. Token & code tables (no CASCADE in schema – must delete before users)
    for table in ("invite_codes", "refresh_tokens",
                  "verification_tokens", "password_reset_tokens"):
        cur.execute(
            f"DELETE FROM {table} WHERE user_id IN "
            "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
            _DEMO,
        )

    # ── 9. Notifications (optional table – skip if absent) ────────────────────
    cur.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications'"
    )
    if cur.fetchone():
        cur.execute(
            "DELETE FROM notifications WHERE user_id IN "
            "(SELECT id FROM users WHERE email LIKE %s OR email LIKE %s)",
            _DEMO,
        )

    # ── 10. Demo user accounts ────────────────────────────────────────────────
    cur.execute(
        "DELETE FROM users WHERE email LIKE %s OR email LIKE %s",
        _DEMO,
    )

    # ── 11. Medical centres (owns all rows – Spring Boot creates none) ─────────
    cur.execute("DELETE FROM medical_centers")

    print("  ✓ Reset complete")
