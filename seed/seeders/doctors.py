"""
seed/seeders/doctors.py
=======================
Creates doctor accounts, profiles, specialization links, and services.
Also handles the dummy licence PDF used to satisfy the admin
"Download licence" flow without requiring manual registration.
"""

from pathlib import Path

from seed.config import SEED_PASSWORD, DUMMY_LICENSE_PATH
from seed.helpers import uid, now_ts, hash_pw, upsert_returning, col_exists


# ─── Dummy licence file ───────────────────────────────────────────────────────

def seed_dummy_license(project_root: Path) -> None:
    """
    Write a minimal but valid single-page PDF to
    <project_root>/api/<DUMMY_LICENSE_PATH>.

    No external library is required – the bytes are hand-crafted
    following the PDF 1.4 specification.
    """
    target = project_root / "api" / DUMMY_LICENSE_PATH
    target.parent.mkdir(parents=True, exist_ok=True)

    if target.exists():
        print(f"  · Dummy licence already exists: {target}")
        return

    minimal_pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
        b"/Resources<</Font<</F1<</Type/Font/Subtype/Type1"
        b"/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj\n"
        b"4 0 obj<</Length 60>>\nstream\n"
        b"BT /F1 18 Tf 180 700 Td (DEMO MEDICAL LICENCE) Tj ET\n"
        b"endstream\nendobj\n"
        b"xref\n0 5\n0000000000 65535 f \n"
        b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n9\n%%EOF\n"
    )
    target.write_bytes(minimal_pdf)
    print(f"  + Created dummy licence PDF: {target}")


# ─── Doctor seeder ────────────────────────────────────────────────────────────

def seed_doctors(cur, spec_map: dict, doctors: list[dict]) -> list[dict]:
    """
    Ensure all doctors exist with their profiles and services.

    Parameters
    ----------
    spec_map : dict
        code → id mapping for all active specializations
        (produced by load_specializations).
    doctors : list[dict]
        Doctor definitions – typically the return value of
        seed.data.doctors.generate_doctors().

    Returns
    -------
    list of dicts with runtime keys:
        user_id, profile_id, display, services, centers, work_hours
    """
    hashed_pw    = hash_pw(SEED_PASSWORD)
    has_ver      = col_exists(cur, "doctor_profiles", "verification_status")
    has_lic_file = col_exists(cur, "doctor_profiles", "license_file_path")

    result: list[dict] = []

    for d in doctors:
        # ── 1. User account ───────────────────────────────────────────────
        user_id = upsert_returning(
            cur,
            """
            INSERT INTO users
                (id, email, password, first_name, last_name, role, status, created_at)
            VALUES (%s, %s, %s, %s, %s, 'DOCTOR', 'ACTIVE', %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (uid(), d["email"], hashed_pw, d["first_name"], d["last_name"], now_ts()),
            "SELECT id FROM users WHERE email = %s",
            (d["email"],),
        )
        print(f"  · Dr {d['first_name']} {d['last_name']}  <{d['email']}>")

        # ── 2. DoctorProfile ──────────────────────────────────────────────
        # Build optional column names / placeholders dynamically so this
        # module stays compatible with both old and new schema versions.
        extra_cols: list[str] = []
        extra_vals: list     = []

        if has_ver:
            extra_cols.append("verification_status")
            extra_vals.append("VERIFIED")
        if has_lic_file:
            extra_cols.append("license_file_path")
            extra_vals.append(d["license_file"])

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
            (uid(), user_id, d["public_id"], d["bio"], d["license"],
             now_ts(), now_ts(), *extra_vals),
            "SELECT id FROM doctor_profiles WHERE user_id = %s",
            (user_id,),
        )

        # ── 3. Specialization links ───────────────────────────────────────
        for code in d["specializations"]:
            spec_id = spec_map.get(code)
            if spec_id:
                cur.execute(
                    """
                    INSERT INTO doctor_profile_specializations
                        (doctor_profile_id, specialization_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    (profile_id, spec_id),
                )

        # ── 4. Services ───────────────────────────────────────────────────
        service_rows: list[dict] = []
        for svc in d["services"]:
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

        result.append({
            "user_id":    user_id,
            "profile_id": profile_id,
            "display":    f"Dr {d['first_name']} {d['last_name']}",
            "services":   service_rows,
            "centers":    d["centers"],    # indices into MEDICAL_CENTERS
            "work_hours": d["work_hours"],
        })

    return result


def load_specializations(cur) -> dict[str, str]:
    """
    Return a {code: id} map for all active specializations.
    Specializations are seeded by the Spring Boot app on first startup;
    this function only reads them.
    """
    cur.execute("SELECT code, id FROM specializations WHERE active = true")
    rows     = cur.fetchall()
    spec_map = {r[0]: str(r[1]) for r in rows}
    if not spec_map:
        print("  ⚠  No specializations found – start the Spring Boot app once first.")
    else:
        print(f"  · Loaded {len(spec_map)} specializations")
    return spec_map
