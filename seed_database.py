#!/usr/bin/env python3
"""
ClearBook – Database Seed Script
=================================
Populates the PostgreSQL database with realistic demo data.

Generated data:
  • 5 medical centers  (CLINIC, HOSPITAL, PRIVATE_PRACTICE, DIAGNOSTIC_CENTER)
  • 10 doctors         full profiles · specializations · services
  • variable patients  (default 10, override with --patients N)
  • availability blocks: 4 weeks back + 2 weeks ahead  (Mon–Fri)
  • past appointments  COMPLETED / CANCELLED / NO_SHOW   (default ~45)
  • future appointments SCHEDULED                        (default ~25)
  • reviews            for COMPLETED appointments

Usage:
    pip install psycopg2-binary bcrypt python-dotenv
    python seed_database.py                  # normal run
    python seed_database.py --reset          # wipe seeded data, then re-seed
    python seed_database.py --patients 20 --past 60 --future 30
    python seed_database.py --dry-run        # connect & validate only, no writes
"""

import argparse
import os
import sys
import uuid
import random
import shutil
from datetime import datetime, timedelta, date, time
from pathlib import Path

# ─── Optional dotenv ──────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    # Walk up from this script's directory to find the nearest .env
    _here = Path(__file__).resolve().parent
    for _candidate in [_here, _here / "api", _here.parent / "api"]:
        if (_candidate / ".env").exists():
            load_dotenv(_candidate / ".env")
            print(f"[env] Loaded .env from {_candidate / '.env'}")
            break
except ImportError:
    pass  # python-dotenv not installed; fall back to os.environ / defaults

# ─── Dependencies check ───────────────────────────────────────────────────────
try:
    import psycopg2
except ImportError:
    sys.exit("Missing psycopg2. Install: pip install psycopg2-binary")
try:
    import bcrypt
except ImportError:
    sys.exit("Missing bcrypt. Install: pip install bcrypt")

# ─── DB configuration (env vars → sensible defaults) ─────────────────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "5432")),
    "dbname":   os.getenv("DB_NAME",     "clearbook_db"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

SEED_PASSWORD = "Demo1234!"   # all seeded accounts share this password
random.seed(42)               # reproducible data

# ─── Helpers ──────────────────────────────────────────────────────────────────
def uid()      -> str:      return str(uuid.uuid4())
def now_ts()   -> datetime: return datetime.now()
def hash_pw(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt(rounds=10)).decode()

def col_exists(cur, table: str, column: str) -> bool:
    cur.execute(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name=%s AND column_name=%s",
        (table, column),
    )
    return cur.fetchone() is not None

def upsert_returning(cur, sql_insert: str, params: tuple, select_sql: str, select_params: tuple) -> str:
    """
    Execute an INSERT … ON CONFLICT DO NOTHING RETURNING id.
    Falls back to a SELECT when the row already existed (RETURNING yields nothing).
    Returns the UUID as a string.
    """
    cur.execute(sql_insert, params)
    row = cur.fetchone()
    if row:
        return str(row[0])
    cur.execute(select_sql, select_params)
    return str(cur.fetchone()[0])

# ─── Static data ──────────────────────────────────────────────────────────────

MEDICAL_CENTERS = [
    {
        "name":        "Varsovia Medical Clinic",
        "type":        "CLINIC",
        "city":        "Warsaw",
        "address":     "45 Marszalkowska Street",
        "phone":       "+48 22 123 45 67",
        "email":       "reception@varsovia.pl",
        "website":     "https://varsovia.pl",
        "description": (
            "A modern specialist clinic in the heart of Warsaw offering comprehensive medical care "
            "across more than 20 specialties. Equipped with state-of-the-art diagnostic technology "
            "and a highly experienced medical team available both in the morning and evening hours. "
            "Fully electronic patient records and online appointment booking available 24/7."
        ),
    },
    {
        "name":        "Mediplus Medical Centre Cracow",
        "type":        "CLINIC",
        "city":        "Cracow",
        "address":     "12 Dluga Street",
        "phone":       "+48 12 987 65 43",
        "email":       "contact@mediplus-cracow.pl",
        "website":     "https://mediplus-cracow.pl",
        "description": (
            "A multi-specialty medical centre operating since 2008. We provide swift access to "
            "specialist consultations without referrals, modern diagnostics, and patient-friendly "
            "service. Our on-site laboratory operates seven days a week, and results are available "
            "within 24 hours via our secure patient portal."
        ),
    },
    {
        "name":        "St. John Paul II Specialist Hospital",
        "type":        "HOSPITAL",
        "city":        "Wroclaw",
        "address":     "8 Swietego Jana Street",
        "phone":       "+48 71 456 78 90",
        "email":       "office@sjp2hospital.pl",
        "website":     "https://sjp2hospital.pl",
        "description": (
            "A specialist hospital with over 40 years of tradition, providing a full range of "
            "medical services. We operate internal medicine, cardiology, neurology, and orthopedic "
            "departments. Certified by the Centre for Quality Monitoring in Healthcare and fully "
            "accredited by the Polish Accreditation Centre."
        ),
    },
    {
        "name":        "MediCare Plus Private Practice",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Poznan",
        "address":     "33 Polwiejska Street",
        "phone":       "+48 61 234 56 78",
        "email":       "office@medicare-plus.pl",
        "website":     "https://medicare-plus.pl",
        "description": (
            "A boutique private medical practice with an individualised approach to every patient. "
            "Short waiting times, fully electronic documentation, and the option for online "
            "consultations. Specialising in family medicine and preventive healthcare, we aim "
            "to build lasting doctor-patient relationships based on trust and transparency."
        ),
    },
    {
        "name":        "CentraMed Diagnostic Centre",
        "type":        "DIAGNOSTIC_CENTER",
        "city":        "Gdansk",
        "address":     "7 Dlugi Targ Square",
        "phone":       "+48 58 321 09 87",
        "email":       "diagnostics@centramed.pl",
        "website":     "https://centramed.pl",
        "description": (
            "The leading diagnostic centre in the Tricity area, offering laboratory tests, "
            "ultrasound, X-ray, CT scanning, and MRI. Results are available online within "
            "24 hours. Our facility is equipped with the latest generation Siemens and "
            "GE Healthcare imaging systems, and our radiologists provide detailed written reports."
        ),
    },
]

# Dummy license PDF placed in the uploads/licenses directory at project root
_DUMMY_PDF = "uploads/licenses/dummy_license.pdf"

DOCTORS = [
    {
        "first_name": "Katherine", "last_name": "Wisniewska",
        "email":      "k.wisniewska@clearbook.demo",
        "license":    "PWZ-1023456",
        "license_file": _DUMMY_PDF,
        "public_id":  "katherine-wisniewska",
        "specializations": ["CARDIOLOGY", "INTERNAL_MEDICINE"],
        "bio": (
            "Dr Katherine Wisniewska is a cardiologist with over 14 years of clinical experience. "
            "She graduated with distinction from the Medical University of Warsaw and completed "
            "fellowships at leading cardiology centres in Poland and Germany. Her clinical focus "
            "is on arrhythmia management and heart failure, combining evidence-based medicine "
            "with a patient-centred approach. She is an active researcher, author of more than "
            "30 peer-reviewed publications, and a regular speaker at European cardiology congresses. "
            "Dr Wisniewska is a member of the Polish Cardiac Society and the European Society of Cardiology."
        ),
        "services": [
            {"name": "Cardiology Consultation",          "duration": 30, "price": 250.00},
            {"name": "ECG with Interpretation",          "duration": 20, "price": 120.00},
            {"name": "Holter ECG – Results Review",      "duration": 30, "price": 180.00},
        ],
        "centers": [0, 2],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Mark", "last_name": "Zielinski",
        "email":      "m.zielinski@clearbook.demo",
        "license":    "PWZ-2034567",
        "license_file": _DUMMY_PDF,
        "public_id":  "mark-zielinski",
        "specializations": ["ORTHOPEDICS", "SURGERY"],
        "bio": (
            "Dr Mark Zielinski is an orthopaedic surgeon and traumatologist with 18 years of "
            "clinical practice. A graduate of the Silesian Medical University, he specialises in "
            "arthroscopic surgery of the knee and shoulder as well as joint replacement surgery. "
            "He has performed over 2,000 arthroscopic procedures and serves as team physician for "
            "several professional sports clubs. Dr Zielinski is a strong advocate of minimally "
            "invasive techniques that ensure rapid patient recovery. He is an active member of "
            "the Polish Orthopaedic and Traumatological Society."
        ),
        "services": [
            {"name": "Orthopaedic Consultation",   "duration": 30, "price": 220.00},
            {"name": "Knee Examination + Ultrasound","duration": 45, "price": 300.00},
            {"name": "Intra-articular Injection",  "duration": 20, "price": 350.00},
        ],
        "centers": [0, 1],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Agnes", "last_name": "Kowalczyk",
        "email":      "a.kowalczyk@clearbook.demo",
        "license":    "PWZ-3045678",
        "license_file": _DUMMY_PDF,
        "public_id":  "agnes-kowalczyk",
        "specializations": ["NEUROLOGY"],
        "bio": (
            "Dr Agnes Kowalczyk holds a habilitation degree in neurology and brings over 20 years "
            "of combined clinical and research experience. Her areas of expertise include multiple "
            "sclerosis, migraine and headache disorders, and neurodegenerative diseases. "
            "She completed fellowships at the Institute of Psychiatry and Neurology in Warsaw and "
            "King's College Hospital in London. Author of more than 40 scientific publications, "
            "she is a member of the Polish Neurological Society and the European Academy of Neurology."
        ),
        "services": [
            {"name": "Neurology Consultation",         "duration": 45, "price": 280.00},
            {"name": "Full Neurological Assessment",   "duration": 60, "price": 350.00},
            {"name": "MS Treatment Follow-up",         "duration": 30, "price": 220.00},
        ],
        "centers": [2, 0],
        "work_hours": (10, 18),
    },
    {
        "first_name": "Thomas", "last_name": "Dabrowski",
        "email":      "t.dabrowski@clearbook.demo",
        "license":    "PWZ-4056789",
        "license_file": _DUMMY_PDF,
        "public_id":  "thomas-dabrowski",
        "specializations": ["PEDIATRICS", "FAMILY_MEDICINE"],
        "bio": (
            "Dr Thomas Dabrowski is a paediatrician and family physician with 12 years of experience "
            "working with children and adolescents. A graduate of the Medical University of Lodz, "
            "he is known for his patience and ability to connect with young patients. His clinical "
            "interests include paediatric allergology and childhood nutrition disorders. He actively "
            "participates in vaccination training programmes and runs educational workshops "
            "for parents on infant feeding and early childhood development milestones."
        ),
        "services": [
            {"name": "Paediatric Consultation",   "duration": 30, "price": 180.00},
            {"name": "Child Health Check-up",     "duration": 45, "price": 220.00},
            {"name": "Lactation Consultation",    "duration": 30, "price": 160.00},
        ],
        "centers": [1, 3],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Monica", "last_name": "Lewandowska",
        "email":      "m.lewandowska@clearbook.demo",
        "license":    "PWZ-5067890",
        "license_file": _DUMMY_PDF,
        "public_id":  "monica-lewandowska",
        "specializations": ["DERMATOLOGY"],
        "bio": (
            "Dr Monica Lewandowska is a dermatologist and venereologist with 10 years of clinical "
            "experience. She specialises in psoriasis, atopic dermatitis, acne, and sexually "
            "transmitted infections. She performs skin biopsies and minor dermatosurgical procedures. "
            "Dr Lewandowska has completed advanced training in dermoscopy and oncological diagnostics "
            "of skin lesions. She is a passionate advocate for sun protection awareness and melanoma "
            "prevention, and is an active member of the Polish Dermatological Society."
        ),
        "services": [
            {"name": "Dermatology Consultation",    "duration": 30, "price": 200.00},
            {"name": "Dermoscopy (up to 5 lesions)","duration": 30, "price": 250.00},
            {"name": "Skin Lesion Removal",         "duration": 30, "price": 400.00},
        ],
        "centers": [1, 4],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Peter", "last_name": "Nowakowski",
        "email":      "p.nowakowski@clearbook.demo",
        "license":    "PWZ-6078901",
        "license_file": _DUMMY_PDF,
        "public_id":  "peter-nowakowski",
        "specializations": ["PSYCHIATRY"],
        "bio": (
            "Dr Peter Nowakowski is a psychiatrist with 16 years of clinical experience. "
            "He completed his specialisation at the Medical University of Cracow and works with "
            "adults and adolescents over 16. His practice covers depression, anxiety disorders, "
            "ADHD, and personality disorders. He employs an integrative approach that combines "
            "pharmacotherapy with cognitive-behavioural therapy (CBT) techniques. Dr Nowakowski "
            "is actively involved in clinical trials investigating new treatments for mood disorders "
            "and regularly contributes to continuing psychiatric education."
        ),
        "services": [
            {"name": "Psychiatric Consultation (1 h)", "duration": 60, "price": 350.00},
            {"name": "Follow-up Appointment",          "duration": 30, "price": 220.00},
            {"name": "Adult ADHD Assessment",          "duration": 90, "price": 550.00},
        ],
        "centers": [0, 3],
        "work_hours": (10, 18),
    },
    {
        "first_name": "Joan", "last_name": "Michalska",
        "email":      "j.michalska@clearbook.demo",
        "license":    "PWZ-7089012",
        "license_file": _DUMMY_PDF,
        "public_id":  "joan-michalska",
        "specializations": ["GYNECOLOGY"],
        "bio": (
            "Dr Joan Michalska is an obstetrician and gynaecologist with 11 years of experience. "
            "A graduate of the Medical University of Gdansk, she specialises in perinatal care, "
            "endometriosis treatment, and infertility management. She performs colposcopy, "
            "hysteroscopy, and LEEP procedures. Dr Michalska leads antenatal education classes "
            "and is known for her empathetic, holistic approach to women's health across all "
            "life stages. She collaborates with assisted reproduction clinics and is a member "
            "of the Polish Society of Gynaecologists and Obstetricians."
        ),
        "services": [
            {"name": "Gynaecological Consultation","duration": 30, "price": 210.00},
            {"name": "Gynaecological Ultrasound",  "duration": 30, "price": 180.00},
            {"name": "Colposcopy",                 "duration": 30, "price": 300.00},
        ],
        "centers": [1, 4],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Andrew", "last_name": "Wroblewski",
        "email":      "a.wroblewski@clearbook.demo",
        "license":    "PWZ-8090123",
        "license_file": _DUMMY_PDF,
        "public_id":  "andrew-wroblewski",
        "specializations": ["GASTROENTEROLOGY", "INTERNAL_MEDICINE"],
        "bio": (
            "Prof. Andrew Wroblewski is a full professor of gastroenterology with 25 years of "
            "clinical and academic experience. He specialises in inflammatory bowel disease, "
            "liver conditions, and gastrointestinal endoscopy, having performed over 5,000 "
            "colonoscopies and gastroscopies. He is the author of a widely used clinical "
            "gastroenterology textbook and recipient of the Polish Society of Gastroenterology "
            "Award. Professor Wroblewski heads the Department of Gastroenterology and Hepatology "
            "and supervises multiple PhD research programmes."
        ),
        "services": [
            {"name": "Gastroenterology Consultation",    "duration": 30, "price": 300.00},
            {"name": "Gastroscopy",                      "duration": 30, "price": 600.00},
            {"name": "Colonoscopy Results Review",       "duration": 30, "price": 250.00},
        ],
        "centers": [2, 0],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Eva", "last_name": "Kowalska",
        "email":      "e.kowalska@clearbook.demo",
        "license":    "PWZ-9012345",
        "license_file": _DUMMY_PDF,
        "public_id":  "eva-kowalska",
        "specializations": ["ENDOCRINOLOGY"],
        "bio": (
            "Dr Eva Kowalska is an endocrinologist with 9 years of clinical experience. "
            "She completed her internal medicine and endocrinology specialisation at the "
            "Medical University of Poznan. Her clinical interests include diabetes management, "
            "thyroid disorders, adrenal, and pituitary conditions. A proponent of personalised "
            "medicine, she is actively involved in clinical trials for novel type 2 diabetes "
            "therapies. Dr Kowalska runs a specialist diabetes clinic and patient education "
            "programmes focused on lifestyle modification and self-management."
        ),
        "services": [
            {"name": "Endocrinology Consultation", "duration": 30, "price": 250.00},
            {"name": "Thyroid Treatment Follow-up","duration": 20, "price": 180.00},
            {"name": "Hormonal Results Review",    "duration": 30, "price": 220.00},
        ],
        "centers": [3, 1],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Ralph", "last_name": "Szymanski",
        "email":      "r.szymanski@clearbook.demo",
        "license":    "PWZ-0123456",
        "license_file": _DUMMY_PDF,
        "public_id":  "ralph-szymanski",
        "specializations": ["PULMONOLOGY", "INTERNAL_MEDICINE"],
        "bio": (
            "Dr Ralph Szymanski is a pulmonologist with 13 years of experience diagnosing "
            "and treating respiratory diseases. He specialises in asthma, COPD, interstitial "
            "lung diseases, and sleep-disordered breathing including obstructive sleep apnoea. "
            "He performs bronchoscopies and spirometries, and has been trained in non-invasive "
            "ventilation and oxygen therapy. Dr Szymanski collaborates with the Polish Society "
            "of Lung Diseases and leads smoking cessation workshops for patients and healthcare "
            "professionals."
        ),
        "services": [
            {"name": "Pulmonology Consultation",        "duration": 30, "price": 230.00},
            {"name": "Spirometry with Interpretation",  "duration": 30, "price": 150.00},
            {"name": "Chest CT Results Review",         "duration": 20, "price": 200.00},
        ],
        "centers": [2, 4],
        "work_hours": (10, 18),
    },
]

# Patient first/last names (English-friendly)
_PATIENT_FIRST = ["Anna", "Bart", "Clara", "Daniel", "Emily",
                  "Frank", "Grace", "Henry", "Irene", "Jack",
                  "Kate", "Leon", "Maria", "Nick", "Olivia",
                  "Paul", "Rachel", "Simon", "Tina", "Victor"]
_PATIENT_LAST  = ["Smith", "Brown", "Taylor", "Wilson", "Evans",
                  "Thomas", "Roberts", "Johnson", "White", "Harris",
                  "Martin", "Clark", "Lewis", "Walker", "Hall",
                  "Young", "Allen", "Wright", "Scott", "King"]

def make_patients(n: int) -> list[dict]:
    random.seed(42)
    seen_emails: set = set()
    result = []
    for _ in range(n):
        fn = random.choice(_PATIENT_FIRST)
        ln = random.choice(_PATIENT_LAST)
        base = f"{fn.lower()}.{ln.lower()}"
        email = f"{base}@example.com"
        i = 2
        while email in seen_emails:
            email = f"{base}{i}@example.com"
            i += 1
        seen_emails.add(email)
        result.append({"first_name": fn, "last_name": ln, "email": email})
    return result

REVIEW_COMMENTS = [
    ("Very professional and empathetic doctor. She explained the diagnosis and treatment plan clearly. Highly recommended!", 5),
    ("The doctor was excellent – patient, thorough, and concise. I felt well cared for throughout the appointment.", 5),
    ("Outstanding specialist. Finally someone who truly listens and doesn't rush the consultation.", 5),
    ("I am very impressed by the professionalism and depth of knowledge. The appointment lasted exactly as long as it should.", 5),
    ("Pleasant atmosphere, on time, reliable diagnosis. I will definitely return.", 5),
    ("The doctor listened to all my concerns and answered every question comprehensively.", 4),
    ("I recommend without reservation. A brilliant specialist and a wonderful human being.", 5),
    ("For the first time in years I feel genuinely well-informed about my health condition. Thank you!", 5),
    ("The appointment was handled efficiently, though the doctor could have spent a bit more time on explanations.", 4),
    ("Generally good, although I had to wait about 15 minutes past my scheduled time.", 3),
    ("Reliable doctor, but the consultation felt brief given the complexity of my situation.", 3),
    ("The reception could have been more efficient, but the doctor himself was competent.", 4),
    ("Very good visit. Short wait, smooth process and a highly competent physician.", 4),
    ("Recommended! Detailed review of my results and clear take-home instructions.", 5),
    ("Professional approach, unhurried. I will return when needed.", 5),
]

DOCTOR_REPLIES = [
    "Thank you for your kind words – looking forward to seeing you at your next appointment!",
    "I am pleased the treatment is delivering the expected results. See you soon!",
    "Glad I could help. Please don't hesitate to reach out if any new symptoms arise.",
    "Thank you for your trust. Wishing you a speedy and full recovery!",
    "Please come back for your follow-up appointment as scheduled.",
    None,   # some appointments have no reply
    None,
    None,
]

PATIENT_NOTES = [
    "I have had severe pain for a week and over-the-counter medication is not helping.",
    "I would like to discuss the results of my recent blood tests.",
    "The first symptoms appeared about three months ago.",
    "I take medication X regularly – please review the dosage.",
    "Follow-up visit after hospitalisation.",
    "I need a referral to another specialist.",
    "Recurring episodes over the last two weeks, varying in intensity.",
    None,
]

DOCTOR_NOTES = [
    "Further diagnostics recommended. ECG referral issued.",
    "Review in 3 months. Medication dosage unchanged.",
    "Test results within normal range. No further treatment indicated.",
    "Antibiotic course prescribed for 7 days. Follow up if symptoms worsen.",
    "Elective hospital referral issued.",
    "Abdominal ultrasound ordered. Results review in 2 weeks.",
    "Discussed lifestyle modifications. Patient education materials provided.",
    None,
]

# ─── CLI arguments ────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="ClearBook database seeder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python seed_database.py\n"
            "  python seed_database.py --reset\n"
            "  python seed_database.py --patients 20 --past 80 --future 40\n"
            "  python seed_database.py --dry-run\n"
        ),
    )
    p.add_argument("--patients",  type=int, default=10,
                   help="Number of patient accounts to generate (default: 10)")
    p.add_argument("--past",      type=int, default=45,
                   help="Target number of past appointments to create (default: 45)")
    p.add_argument("--future",    type=int, default=25,
                   help="Target number of future SCHEDULED appointments (default: 25)")
    p.add_argument("--reset",     action="store_true",
                   help="Delete all previously seeded data before inserting")
    p.add_argument("--dry-run",   action="store_true",
                   help="Connect and validate only – do not write anything")
    return p.parse_args()

# ─── Reset helpers ────────────────────────────────────────────────────────────

def reset_seeded_data(cur):
    """Remove all demo data seeded by this script, in dependency order."""
    print("  ⚠  Resetting seeded data…")

    # Collect demo email domains so we remove exactly what we seeded
    demo_emails_like = ["%@clearbook.demo", "%@example.com"]

    # 1. reviews → appointments → blocks → memberships → profiles → users → centers
    cur.execute("DELETE FROM appointment_reviews WHERE appointment_id IN ("
                "  SELECT a.id FROM appointments a"
                "  JOIN availability_blocks ab ON ab.id = a.block_id"
                "  JOIN users u ON u.id = ab.doctor_id"
                "  WHERE u.email LIKE %s OR u.email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM appointments WHERE patient_id IN ("
                "  SELECT id FROM users WHERE email LIKE %s OR email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM appointments WHERE block_id IN ("
                "  SELECT ab.id FROM availability_blocks ab"
                "  JOIN users u ON u.id = ab.doctor_id"
                "  WHERE u.email LIKE %s OR u.email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM availability_blocks WHERE doctor_id IN ("
                "  SELECT id FROM users WHERE email LIKE %s OR email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM center_memberships WHERE user_id IN ("
                "  SELECT id FROM users WHERE email LIKE %s OR email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM doctor_profile_specializations WHERE doctor_profile_id IN ("
                "  SELECT dp.id FROM doctor_profiles dp"
                "  JOIN users u ON u.id = dp.user_id"
                "  WHERE u.email LIKE %s OR u.email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM doctor_services WHERE doctor_id IN ("
                "  SELECT id FROM users WHERE email LIKE %s OR email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM doctor_profiles WHERE user_id IN ("
                "  SELECT id FROM users WHERE email LIKE %s OR email LIKE %s"
                ")", demo_emails_like)

    cur.execute("DELETE FROM users WHERE email LIKE %s OR email LIKE %s",
                demo_emails_like)

    # Medical centres by our known names
    center_names = [mc["name"] for mc in MEDICAL_CENTERS]
    cur.execute(
        "DELETE FROM medical_centers WHERE name = ANY(%s)",
        (center_names,),
    )

    print("  ✓ Reset complete")

# ─── Seed functions ───────────────────────────────────────────────────────────

def seed_medical_centers(cur) -> list[str]:
    center_ids = []
    for mc in MEDICAL_CENTERS:
        cid = uid()
        ts  = now_ts()
        result_id = upsert_returning(
            cur,
            """
            INSERT INTO medical_centers
                (id, name, type, status, city, address, phone, email,
                 website, description, created_at, updated_at)
            VALUES (%s,%s,%s,'ACTIVE',%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
            """,
            (cid, mc["name"], mc["type"], mc["city"], mc["address"],
             mc["phone"], mc["email"], mc["website"], mc["description"], ts, ts),
            "SELECT id FROM medical_centers WHERE name = %s",
            (mc["name"],),
        )
        center_ids.append(result_id)
        print(f"  · {mc['name']}  [{mc['city']}]")
    return center_ids


def load_specializations(cur) -> dict[str, str]:
    cur.execute("SELECT code, id FROM specializations WHERE active = true")
    rows = cur.fetchall()
    spec_map = {r[0]: str(r[1]) for r in rows}
    if not spec_map:
        print("  ⚠  No specializations found – run the Spring Boot app once to seed them first.")
    else:
        print(f"  · Loaded {len(spec_map)} specializations")
    return spec_map


def seed_dummy_license(project_root: Path):
    """Creates a minimal placeholder PDF so the admin 'Download licence' button works."""
    target = project_root / "api" / _DUMMY_PDF
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists():
        # Minimal valid 1-page PDF (no external library required)
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
        print(f"  + Created dummy licence PDF at {target}")
    else:
        print(f"  · Dummy licence already exists at {target}")


def seed_doctors(cur, spec_map: dict) -> list[dict]:
    hashed_pw    = hash_pw(SEED_PASSWORD)
    has_ver      = col_exists(cur, "doctor_profiles", "verification_status")
    has_lic_file = col_exists(cur, "doctor_profiles", "license_file_path")

    result = []
    for d in DOCTORS:
        # ── User (UPSERT on email) ─────────────────────────────────────────
        new_uid = uid()
        user_id = upsert_returning(
            cur,
            """
            INSERT INTO users
                (id, email, password, first_name, last_name, role, status, created_at)
            VALUES (%s,%s,%s,%s,%s,'DOCTOR','ACTIVE',%s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (new_uid, d["email"], hashed_pw, d["first_name"], d["last_name"], now_ts()),
            "SELECT id FROM users WHERE email = %s",
            (d["email"],),
        )
        print(f"  · Dr {d['first_name']} {d['last_name']}  <{d['email']}>")

        # ── DoctorProfile (UPSERT on user_id) ─────────────────────────────
        new_pid = uid()
        ts      = now_ts()

        # Build column lists dynamically depending on schema
        extra_cols   = []
        extra_vals   = []
        if has_ver:
            extra_cols.append("verification_status")
            extra_vals.append("VERIFIED")
        if has_lic_file:
            extra_cols.append("license_file_path")
            extra_vals.append(d["license_file"])

        col_str = ", ".join(extra_cols)
        ph_str  = ", ".join(["%s"] * len(extra_vals))
        if col_str:
            col_str = ", " + col_str
            ph_str  = ", " + ph_str

        profile_id = upsert_returning(
            cur,
            f"""
            INSERT INTO doctor_profiles
                (id, user_id, public_id, bio, license_number,
                 is_public, average_rating, total_reviews,
                 created_at, updated_at{col_str})
            VALUES (%s,%s,%s,%s,%s,true,0.0,0,%s,%s{ph_str})
            ON CONFLICT (user_id) DO NOTHING
            RETURNING id
            """,
            (new_pid, user_id, d["public_id"], d["bio"], d["license"], ts, ts, *extra_vals),
            "SELECT id FROM doctor_profiles WHERE user_id = %s",
            (user_id,),
        )

        # ── Specializations (UPSERT via PK ON CONFLICT) ───────────────────
        for code in d["specializations"]:
            spec_id = spec_map.get(code)
            if spec_id:
                cur.execute("""
                    INSERT INTO doctor_profile_specializations
                        (doctor_profile_id, specialization_id)
                    VALUES (%s,%s)
                    ON CONFLICT DO NOTHING
                """, (profile_id, spec_id))

        # ── Services (no unique constraint → SELECT + conditional INSERT) ──
        service_rows = []
        for svc in d["services"]:
            cur.execute("""
                SELECT id FROM doctor_services
                WHERE doctor_id = %s AND name = %s
            """, (user_id, svc["name"]))
            row = cur.fetchone()
            if row:
                svc_id = str(row[0])
            else:
                svc_id = uid()
                cur.execute("""
                    INSERT INTO doctor_services
                        (id, doctor_id, name, duration_minutes, price, active)
                    VALUES (%s,%s,%s,%s,%s,true)
                """, (svc_id, user_id, svc["name"], svc["duration"], svc["price"]))
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


def seed_memberships(cur, doctor_data: list[dict], center_ids: list[str]):
    """
    Assigns each doctor to their clinics.
    The first doctor registered at a given clinic becomes ADMIN;
    subsequent doctors are MEMBER.
    """
    # Track which center already has an admin
    center_has_admin: set[str] = set()

    # Pre-check existing admins
    for center_id in center_ids:
        cur.execute(
            "SELECT 1 FROM center_memberships WHERE center_id=%s AND role='ADMIN' LIMIT 1",
            (center_id,),
        )
        if cur.fetchone():
            center_has_admin.add(center_id)

    added = 0
    for doc in doctor_data:
        for ci in doc["centers"]:
            center_id = center_ids[ci]

            # Decide role: ADMIN if center has none yet
            role = "MEMBER"
            if center_id not in center_has_admin:
                role = "ADMIN"
                center_has_admin.add(center_id)

            ts = now_ts()
            cur.execute("""
                INSERT INTO center_memberships
                    (id, user_id, center_id, role, status, invited_at, joined_at)
                VALUES (%s,%s,%s,%s,'ACTIVE',%s,%s)
                ON CONFLICT (user_id, center_id) DO NOTHING
            """, (uid(), doc["user_id"], center_id, role, ts, ts))

            if cur.rowcount:
                added += 1
                tag = " [ADMIN]" if role == "ADMIN" else ""
                print(f"  · {doc['display']} → {MEDICAL_CENTERS[ci]['name']}{tag}")

    if not added:
        print("  · All memberships already existed")


def seed_patients(cur, patients: list[dict]) -> list[str]:
    hashed_pw = hash_pw(SEED_PASSWORD)
    patient_ids = []
    for p in patients:
        new_uid = uid()
        pid = upsert_returning(
            cur,
            """
            INSERT INTO users
                (id, email, password, first_name, last_name, role, status, created_at)
            VALUES (%s,%s,%s,%s,%s,'USER','ACTIVE',%s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (new_uid, p["email"], hashed_pw, p["first_name"], p["last_name"], now_ts()),
            "SELECT id FROM users WHERE email = %s",
            (p["email"],),
        )
        patient_ids.append(pid)
    print(f"  · {len(patient_ids)} patient accounts ready")
    return patient_ids


def seed_availability_blocks(cur, doctor_data: list[dict], center_ids: list[str]) -> dict:
    """
    Creates Mon-Fri blocks:
      • 4 weeks back  (past blocks needed for past appointments)
      • 2 weeks ahead (future availability for booking)

    Returns dict: (doctor_user_id, center_id, date_str) → block_id
    """
    today    = date.today()
    start_d  = today - timedelta(weeks=4)
    end_d    = today + timedelta(weeks=2)

    block_map: dict = {}
    new_count = 0

    current = start_d
    while current <= end_d:
        if current.weekday() < 5:          # Mon–Fri only
            day_offset = (current - start_d).days
            for doc in doctor_data:
                wh = doc["work_hours"]
                ci = doc["centers"][day_offset % len(doc["centers"])]
                center_id = center_ids[ci]
                doc_id    = doc["user_id"]
                key       = (doc_id, center_id, str(current))

                if key in block_map:
                    continue

                cur.execute("""
                    SELECT id FROM availability_blocks
                    WHERE doctor_id=%s AND center_id=%s AND DATE(start_time)=%s
                """, (doc_id, center_id, current))
                row = cur.fetchone()

                if row:
                    block_map[key] = str(row[0])
                else:
                    bid = uid()
                    bs  = datetime.combine(current, time(wh[0], 0))
                    be  = datetime.combine(current, time(wh[1], 0))
                    cur.execute("""
                        INSERT INTO availability_blocks
                            (id, doctor_id, center_id, start_time, end_time, created_at)
                        VALUES (%s,%s,%s,%s,%s,%s)
                    """, (bid, doc_id, center_id, bs, be, now_ts()))
                    block_map[key] = bid
                    new_count += 1

        current += timedelta(days=1)

    print(f"  · {new_count} new blocks created  |  {len(block_map)} total block-keys")
    return block_map


def _pick_slot(block_map: dict, doctor_data: list[dict],
               keys: list, slot_used: set,
               target: int, status_dist: list[tuple]) -> list[tuple]:
    """
    Generic appointment generator used by both past & future seeders.
    status_dist: list of (status_string, weight) pairs.
    Returns list of (appointment_id, status).
    """
    result: list[tuple] = []
    statuses, weights = zip(*status_dist)

    random.shuffle(keys)
    for key in keys * 4:
        if len(result) >= target:
            break

        doc_id, center_id, date_str = key
        block_id = block_map[key]
        doc = next((d for d in doctor_data if d["user_id"] == doc_id), None)
        if not doc or not doc["services"]:
            continue

        svc      = random.choice(doc["services"])
        wh       = doc["work_hours"]
        dur      = svc["duration"]
        slots    = list(range(wh[0] * 60, wh[1] * 60 - dur + 1, 30))
        if not slots:
            continue

        slot_min   = random.choice(slots)
        appt_date  = datetime.strptime(date_str, "%Y-%m-%d").date()
        appt_start = datetime.combine(appt_date, time(slot_min // 60, slot_min % 60))
        appt_end   = appt_start + timedelta(minutes=dur)
        slot_key   = (block_id, appt_start)

        if slot_key in slot_used:
            continue
        slot_used.add(slot_key)

        result.append((block_id, svc, appt_start, appt_end,
                       random.choices(statuses, weights=weights)[0]))

    return result


def seed_past_appointments(
    cur, doctor_data: list[dict], patient_ids: list[str],
    block_map: dict, target: int,
) -> list[tuple]:
    today     = date.today()
    past_keys = [k for k in block_map if k[2] < str(today)]

    if not past_keys:
        print("  ⚠  No past blocks – skipping past appointments.")
        return []

    slot_used: set = set()
    status_dist = [("COMPLETED", 60), ("CANCELLED", 25), ("NO_SHOW", 15)]

    slots = _pick_slot(block_map, doctor_data, past_keys, slot_used, target, status_dist)

    added: list[tuple] = []
    for block_id, svc, appt_start, appt_end, status in slots:
        cur.execute("""
            SELECT id FROM appointments WHERE block_id=%s AND start_time=%s
        """, (block_id, appt_start))
        if cur.fetchone():
            continue

        appt_id     = uid()
        patient_id  = random.choice(patient_ids)
        p_notes     = random.choice(PATIENT_NOTES)
        d_notes     = random.choice(DOCTOR_NOTES) if status == "COMPLETED" else None
        created_at  = appt_start - timedelta(days=random.randint(1, 14))

        cur.execute("""
            INSERT INTO appointments
                (id, block_id, patient_id, service_id, start_time, end_time,
                 status, patient_notes, doctor_notes, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (appt_id, block_id, patient_id, svc["id"],
              appt_start, appt_end, status, p_notes, d_notes, created_at))
        added.append((appt_id, status))

    c = sum(1 for _, s in added if s == "COMPLETED")
    x = sum(1 for _, s in added if s == "CANCELLED")
    n = sum(1 for _, s in added if s == "NO_SHOW")
    print(f"  + {len(added)} past appointments  "
          f"(COMPLETED {c}  |  CANCELLED {x}  |  NO_SHOW {n})")
    return added


def seed_future_appointments(
    cur, doctor_data: list[dict], patient_ids: list[str],
    block_map: dict, target: int,
) -> list[tuple]:
    today       = date.today()
    future_keys = [k for k in block_map if k[2] > str(today)]

    if not future_keys:
        print("  ⚠  No future blocks – skipping future appointments.")
        return []

    slot_used: set = set()
    status_dist = [("SCHEDULED", 100)]   # all future appointments are SCHEDULED

    slots = _pick_slot(block_map, doctor_data, future_keys, slot_used, target, status_dist)

    added: list[tuple] = []
    for block_id, svc, appt_start, appt_end, status in slots:
        cur.execute("""
            SELECT id FROM appointments WHERE block_id=%s AND start_time=%s
        """, (block_id, appt_start))
        if cur.fetchone():
            continue

        appt_id    = uid()
        patient_id = random.choice(patient_ids)
        p_notes    = random.choice(PATIENT_NOTES)
        # Booking created 1-7 days before the appointment
        created_at = appt_start - timedelta(days=random.randint(1, 7))

        cur.execute("""
            INSERT INTO appointments
                (id, block_id, patient_id, service_id, start_time, end_time,
                 status, patient_notes, doctor_notes, created_at)
            VALUES (%s,%s,%s,%s,%s,%s,'SCHEDULED',%s,NULL,%s)
        """, (appt_id, block_id, patient_id, svc["id"],
              appt_start, appt_end, p_notes, created_at))
        added.append((appt_id, "SCHEDULED"))

    print(f"  + {len(added)} future SCHEDULED appointments")
    return added


def seed_reviews(cur, past_appointments: list[tuple]):
    completed = [aid for aid, s in past_appointments if s == "COMPLETED"]
    added = 0
    for appt_id in completed:
        if random.random() > 0.70:      # ~30% of completed visits have no review
            continue
        cur.execute(
            "SELECT id FROM appointment_reviews WHERE appointment_id=%s",
            (appt_id,),
        )
        if cur.fetchone():
            continue

        comment, rating = random.choice(REVIEW_COMMENTS)
        is_anon    = random.random() < 0.25
        reply_text = random.choice(DOCTOR_REPLIES)
        replied_at = (now_ts() - timedelta(days=random.randint(0, 5))) if reply_text else None
        created_at = now_ts() - timedelta(days=random.randint(0, 10))

        cur.execute("""
            INSERT INTO appointment_reviews
                (id, appointment_id, rating, patient_comment,
                 is_anonymous, doctor_reply, replied_at, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (uid(), appt_id, rating, comment, is_anon,
              reply_text, replied_at, created_at, created_at))
        added += 1

    # Recalculate average_rating & total_reviews for every doctor profile
    cur.execute("""
        UPDATE doctor_profiles dp
        SET total_reviews  = sub.cnt,
            average_rating = sub.avg_r,
            updated_at     = NOW()
        FROM (
            SELECT u.id  AS uid,
                   COUNT(ar.id)                         AS cnt,
                   ROUND(AVG(ar.rating)::numeric, 2)    AS avg_r
            FROM users u
            JOIN doctor_profiles dp2 ON dp2.user_id = u.id
            JOIN availability_blocks ab ON ab.doctor_id = u.id
            JOIN appointments a ON a.block_id = ab.id
            JOIN appointment_reviews ar ON ar.appointment_id = a.id
            GROUP BY u.id
        ) sub
        WHERE dp.user_id = sub.uid
    """)

    print(f"  + {added} reviews added  |  doctor rating stats updated")


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    print("=" * 60)
    print("  ClearBook – Database Seed")
    print("=" * 60)
    print(f"  patients        : {args.patients}")
    print(f"  past appts      : {args.past}")
    print(f"  future appts    : {args.future}")
    print(f"  reset first     : {args.reset}")
    print(f"  dry run         : {args.dry_run}")
    print("=" * 60 + "\n")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cur  = conn.cursor()
        print(f"✓ Connected to {DB_CONFIG['dbname']}@{DB_CONFIG['host']}\n")
    except Exception as e:
        sys.exit(f"✗ Cannot connect to database: {e}")

    if args.dry_run:
        print("Dry-run mode – connection OK. No data written.")
        cur.close(); conn.close()
        return

    try:
        if args.reset:
            print("─── Reset ────────────────────────────────────────────────")
            reset_seeded_data(cur)
            print()

        # 1. Medical centres
        print("─── 1. Medical centres ───────────────────────────────────────")
        center_ids = seed_medical_centers(cur)

        # 2. Specializations (read only – seeded by Spring Boot on startup)
        print("\n─── 2. Specializations (read) ────────────────────────────────")
        spec_map = load_specializations(cur)

        # 3. Dummy licence file
        print("\n─── 3. Dummy licence PDF ─────────────────────────────────────")
        seed_dummy_license(Path(__file__).resolve().parent)

        # 4. Doctors, profiles, services
        print("\n─── 4. Doctors · profiles · services ────────────────────────")
        doctor_data = seed_doctors(cur, spec_map)

        # 5. Clinic memberships (first doctor per clinic → ADMIN)
        print("\n─── 5. Clinic memberships ────────────────────────────────────")
        seed_memberships(cur, doctor_data, center_ids)

        # 6. Patients
        print("\n─── 6. Patients ──────────────────────────────────────────────")
        patients    = make_patients(args.patients)
        patient_ids = seed_patients(cur, patients)

        # 7. Availability blocks
        print("\n─── 7. Availability blocks (Mon–Fri, 4 wks back + 2 wks ahead)")
        block_map = seed_availability_blocks(cur, doctor_data, center_ids)

        # 8. Past appointments
        print("\n─── 8. Past appointments ─────────────────────────────────────")
        past_appts = seed_past_appointments(
            cur, doctor_data, patient_ids, block_map, args.past,
        )

        # 9. Future appointments (SCHEDULED)
        print("\n─── 9. Future appointments (SCHEDULED) ──────────────────────")
        seed_future_appointments(
            cur, doctor_data, patient_ids, block_map, args.future,
        )

        # 10. Reviews
        print("\n─── 10. Reviews ──────────────────────────────────────────────")
        seed_reviews(cur, past_appts)

        conn.commit()
        print("\n✓ Commit – all data saved successfully.\n")

    except Exception as e:
        conn.rollback()
        print(f"\n✗ Error – rolled back: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

    print("=" * 60)
    print("  Seed complete!")
    print(f"  All accounts use password: {SEED_PASSWORD}")
    print("=" * 60)


if __name__ == "__main__":
    main()
