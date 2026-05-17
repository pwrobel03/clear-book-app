"""
seed/data/doctors.py
====================
Procedural doctor generator.

Public API
----------
    generate_doctors(n, centers, seed=42) -> list[dict]

Each returned dict has the same schema consumed by seed/seeders/doctors.py:
    first_name, last_name, email, license, license_file, public_id,
    specializations, bio, services, centers (indices), work_hours

Geographic constraint
---------------------
Each doctor is assigned only to centres located in the same city.
Cities are weighted by the number of available centres so larger cities
receive proportionally more doctors.

Services
--------
Each doctor draws 3-10 services at random from their primary
specialization's pool (defined in _SERVICE_POOLS).
"""

import random
import re
from seed.config import DUMMY_LICENSE_PATH

# ─── Name pools ───────────────────────────────────────────────────────────────

_MALE_FIRST: list[str] = [
    "Adam", "Adrian", "Aleksander", "Andrzej", "Bartosz",
    "Damian", "Filip", "Grzegorz", "Jakub", "Jan",
    "Kamil", "Krzysztof", "Lukasz", "Marek", "Michal",
    "Pawel", "Piotr", "Rafal", "Robert", "Sebastian",
    "Szymon", "Tomasz", "Wojciech", "Zbigniew",
]

_FEMALE_FIRST: list[str] = [
    "Agnieszka", "Aleksandra", "Anna", "Barbara", "Beata",
    "Dorota", "Ewa", "Joanna", "Justyna", "Karolina",
    "Katarzyna", "Magdalena", "Malgorzata", "Marta", "Monika",
    "Natalia", "Patrycja", "Paulina", "Sylwia", "Teresa",
    "Urszula", "Weronika", "Zofia",
]

_LAST_NAMES: list[str] = [
    "Adamczyk", "Andrzejewski", "Baran", "Borowski", "Brzezinski",
    "Chmielewski", "Czarnecki", "Dabrowski", "Duda", "Grabowski",
    "Jankowski", "Jaworski", "Kaminski", "Kowalczyk", "Kowalski",
    "Kozlowski", "Krawczyk", "Lewandowski", "Lipinski", "Lisowski",
    "Malinowski", "Mazur", "Michalak", "Michalski", "Milewski",
    "Nowak", "Nowakowski", "Ostrowski", "Pawlak", "Pawlowski",
    "Pietrzak", "Piotrowski", "Sikora", "Sobczak", "Stanczyk",
    "Szymanski", "Tomczak", "Walczak", "Wieczorek", "Wisniewski",
    "Wojciechowski", "Wrobel", "Wronski", "Zawadzki", "Zielinski",
]

_FEMALE_SET: set[str] = set(_FEMALE_FIRST)

_UNIVERSITIES: list[str] = [
    "Medical University of Warsaw",
    "Jagiellonian University Medical College",
    "Medical University of Wroclaw",
    "Medical University of Poznan",
    "Medical University of Gdansk",
    "Medical University of Lodz",
    "Silesian Medical University",
    "Medical University of Bialystok",
    "Medical University of Lublin",
]

# ─── Specialization weights (realistic distribution) ─────────────────────────

_SPEC_POOL: list[tuple[str, int]] = [
    ("FAMILY_MEDICINE",    10),
    ("INTERNAL_MEDICINE",   9),
    ("PEDIATRICS",          8),
    ("CARDIOLOGY",          7),
    ("DERMATOLOGY",         6),
    ("GYNECOLOGY",          6),
    ("ORTHOPEDICS",         6),
    ("NEUROLOGY",           5),
    ("PSYCHIATRY",          5),
    ("GASTROENTEROLOGY",    5),
    ("ENDOCRINOLOGY",       5),
    ("OPHTHALMOLOGY",       4),
    ("PULMONOLOGY",         4),
    ("UROLOGY",             4),
    ("RHEUMATOLOGY",        4),
    ("SURGERY",             4),
    ("NEPHROLOGY",          3),
    ("ONCOLOGY",            3),
    ("HEMATOLOGY",          3),
    ("RADIOLOGY",           3),
    ("ANESTHESIOLOGY",      2),
    ("EMERGENCY_MEDICINE",  2),
]

# Compatible secondary specializations (pairs that make clinical sense)
_SECONDARY_MAP: dict[str, list[str]] = {
    "CARDIOLOGY":         ["INTERNAL_MEDICINE"],
    "INTERNAL_MEDICINE":  ["CARDIOLOGY", "ENDOCRINOLOGY", "GASTROENTEROLOGY", "PULMONOLOGY", "NEPHROLOGY", "RHEUMATOLOGY"],
    "FAMILY_MEDICINE":    ["PEDIATRICS", "INTERNAL_MEDICINE"],
    "PEDIATRICS":         ["FAMILY_MEDICINE"],
    "SURGERY":            ["ORTHOPEDICS", "UROLOGY"],
    "ORTHOPEDICS":        ["SURGERY"],
    "GASTROENTEROLOGY":   ["INTERNAL_MEDICINE"],
    "ENDOCRINOLOGY":      ["INTERNAL_MEDICINE"],
    "PULMONOLOGY":        ["INTERNAL_MEDICINE"],
    "NEPHROLOGY":         ["INTERNAL_MEDICINE"],
    "RHEUMATOLOGY":       ["INTERNAL_MEDICINE"],
    "NEUROLOGY":          [],
    "PSYCHIATRY":         [],
    "DERMATOLOGY":        [],
    "GYNECOLOGY":         [],
    "OPHTHALMOLOGY":      [],
    "UROLOGY":            ["SURGERY"],
    "ONCOLOGY":           ["HEMATOLOGY"],
    "HEMATOLOGY":         ["ONCOLOGY"],
    "RADIOLOGY":          [],
    "ANESTHESIOLOGY":     [],
    "EMERGENCY_MEDICINE": ["INTERNAL_MEDICINE"],
}

# ─── Service pools (min 10 per specialization) ────────────────────────────────

_SERVICE_POOLS: dict[str, list[dict]] = {
    "CARDIOLOGY": [
        {"name": "Cardiology Consultation",           "duration": 30, "price": 250.00},
        {"name": "ECG with Interpretation",           "duration": 20, "price": 120.00},
        {"name": "Holter ECG – Results Review",       "duration": 30, "price": 180.00},
        {"name": "Echocardiography",                  "duration": 45, "price": 380.00},
        {"name": "Stress Test",                       "duration": 60, "price": 420.00},
        {"name": "Cardiac Risk Assessment",           "duration": 30, "price": 210.00},
        {"name": "Pacemaker / ICD Check",             "duration": 30, "price": 230.00},
        {"name": "Ambulatory Blood Pressure Review",  "duration": 20, "price": 150.00},
        {"name": "Cardiac Rehabilitation Consultation","duration": 45, "price": 280.00},
        {"name": "Arrhythmia Evaluation",             "duration": 30, "price": 260.00},
        {"name": "Heart Failure Management Review",   "duration": 30, "price": 270.00},
        {"name": "Lipid Disorder Management",         "duration": 20, "price": 160.00},
    ],
    "NEUROLOGY": [
        {"name": "Neurology Consultation",            "duration": 45, "price": 280.00},
        {"name": "Full Neurological Assessment",      "duration": 60, "price": 350.00},
        {"name": "MS Treatment Follow-up",            "duration": 30, "price": 220.00},
        {"name": "Epilepsy Management Review",        "duration": 30, "price": 240.00},
        {"name": "Migraine Treatment Consultation",   "duration": 30, "price": 230.00},
        {"name": "Nerve Conduction Study Review",     "duration": 30, "price": 200.00},
        {"name": "Dementia Screening",                "duration": 60, "price": 320.00},
        {"name": "Parkinson's Disease Follow-up",     "duration": 30, "price": 250.00},
        {"name": "Headache & Vertigo Diagnosis",      "duration": 45, "price": 260.00},
        {"name": "Cognitive Function Assessment",     "duration": 60, "price": 380.00},
        {"name": "Botulinum Toxin for Migraine – Review", "duration": 30, "price": 290.00},
    ],
    "ORTHOPEDICS": [
        {"name": "Orthopaedic Consultation",          "duration": 30, "price": 220.00},
        {"name": "Knee Examination + Ultrasound",     "duration": 45, "price": 300.00},
        {"name": "Intra-articular Injection",         "duration": 20, "price": 350.00},
        {"name": "Shoulder Assessment",               "duration": 30, "price": 240.00},
        {"name": "Spine Evaluation",                  "duration": 45, "price": 280.00},
        {"name": "Hip Joint Assessment",              "duration": 30, "price": 250.00},
        {"name": "Post-surgical Follow-up",           "duration": 30, "price": 200.00},
        {"name": "Fracture Management Review",        "duration": 30, "price": 220.00},
        {"name": "Sports Injury Assessment",          "duration": 30, "price": 230.00},
        {"name": "Rehabilitation Planning Session",   "duration": 45, "price": 260.00},
        {"name": "PRP Therapy Consultation",          "duration": 30, "price": 320.00},
    ],
    "PEDIATRICS": [
        {"name": "Paediatric Consultation",           "duration": 30, "price": 180.00},
        {"name": "Child Health Check-up",             "duration": 45, "price": 220.00},
        {"name": "Lactation Consultation",            "duration": 30, "price": 160.00},
        {"name": "Newborn Assessment",                "duration": 45, "price": 200.00},
        {"name": "Vaccination Consultation",          "duration": 20, "price": 120.00},
        {"name": "Developmental Assessment",          "duration": 60, "price": 280.00},
        {"name": "Paediatric Allergy Screening",      "duration": 30, "price": 200.00},
        {"name": "ENT Assessment for Children",       "duration": 30, "price": 190.00},
        {"name": "School Readiness Assessment",       "duration": 45, "price": 220.00},
        {"name": "Paediatric Nutrition Consultation", "duration": 30, "price": 170.00},
        {"name": "Adolescent Health Consultation",    "duration": 30, "price": 185.00},
    ],
    "DERMATOLOGY": [
        {"name": "Dermatology Consultation",          "duration": 30, "price": 200.00},
        {"name": "Dermoscopy (up to 5 lesions)",      "duration": 30, "price": 250.00},
        {"name": "Skin Lesion Removal",               "duration": 30, "price": 400.00},
        {"name": "Acne Treatment Plan",               "duration": 30, "price": 190.00},
        {"name": "Psoriasis Management Review",       "duration": 30, "price": 210.00},
        {"name": "Atopic Dermatitis Follow-up",       "duration": 30, "price": 200.00},
        {"name": "Skin Biopsy",                       "duration": 30, "price": 350.00},
        {"name": "Patch Testing – Results Review",    "duration": 30, "price": 220.00},
        {"name": "Cryotherapy Consultation",          "duration": 20, "price": 300.00},
        {"name": "Hair Loss Assessment",              "duration": 30, "price": 230.00},
        {"name": "Wound Care Consultation",           "duration": 30, "price": 180.00},
    ],
    "GYNECOLOGY": [
        {"name": "Gynaecological Consultation",       "duration": 30, "price": 210.00},
        {"name": "Gynaecological Ultrasound",         "duration": 30, "price": 180.00},
        {"name": "Colposcopy",                        "duration": 30, "price": 300.00},
        {"name": "Cervical Smear & HPV Test",         "duration": 20, "price": 150.00},
        {"name": "Prenatal Consultation",             "duration": 30, "price": 220.00},
        {"name": "Contraception Counselling",         "duration": 30, "price": 180.00},
        {"name": "Menopause Management",              "duration": 30, "price": 200.00},
        {"name": "Fertility Assessment",              "duration": 45, "price": 280.00},
        {"name": "Endometriosis Follow-up",           "duration": 30, "price": 230.00},
        {"name": "Hysteroscopy Results Review",       "duration": 30, "price": 250.00},
        {"name": "Breast Examination",                "duration": 20, "price": 160.00},
    ],
    "PSYCHIATRY": [
        {"name": "Psychiatric Consultation (1 h)",    "duration": 60, "price": 350.00},
        {"name": "Follow-up Appointment",             "duration": 30, "price": 220.00},
        {"name": "Adult ADHD Assessment",             "duration": 90, "price": 550.00},
        {"name": "Depression Screening",              "duration": 45, "price": 280.00},
        {"name": "Anxiety Disorder Evaluation",       "duration": 45, "price": 280.00},
        {"name": "Medication Review",                 "duration": 30, "price": 210.00},
        {"name": "Insomnia Management Plan",          "duration": 30, "price": 230.00},
        {"name": "Personality Disorder Assessment",   "duration": 90, "price": 500.00},
        {"name": "Post-traumatic Stress Evaluation",  "duration": 60, "price": 380.00},
        {"name": "Psychoeducation Session",           "duration": 45, "price": 250.00},
    ],
    "OPHTHALMOLOGY": [
        {"name": "Ophthalmology Consultation",        "duration": 30, "price": 200.00},
        {"name": "Visual Acuity Examination",         "duration": 20, "price": 120.00},
        {"name": "Slit-lamp Examination",             "duration": 20, "price": 160.00},
        {"name": "Fundus Photography Review",         "duration": 20, "price": 180.00},
        {"name": "Intraocular Pressure Check",        "duration": 15, "price": 100.00},
        {"name": "Contact Lens Fitting",              "duration": 30, "price": 200.00},
        {"name": "Glaucoma Management Review",        "duration": 30, "price": 220.00},
        {"name": "Diabetic Retinopathy Screening",    "duration": 30, "price": 200.00},
        {"name": "Dry Eye Assessment",                "duration": 20, "price": 170.00},
        {"name": "Children's Vision Screening",       "duration": 30, "price": 180.00},
        {"name": "Cataract Pre-operative Assessment", "duration": 45, "price": 280.00},
    ],
    "RADIOLOGY": [
        {"name": "Radiology Consultation",            "duration": 30, "price": 200.00},
        {"name": "Ultrasound Results Interpretation", "duration": 20, "price": 150.00},
        {"name": "CT Scan Results Review",            "duration": 30, "price": 220.00},
        {"name": "MRI Results Review",                "duration": 30, "price": 240.00},
        {"name": "X-ray Results Consultation",        "duration": 15, "price": 100.00},
        {"name": "Interventional Radiology Consultation", "duration": 45, "price": 300.00},
        {"name": "Mammography Results Review",        "duration": 20, "price": 170.00},
        {"name": "PET-CT Results Interpretation",     "duration": 45, "price": 350.00},
        {"name": "Bone Density (DEXA) Review",        "duration": 20, "price": 160.00},
        {"name": "Vascular Imaging Consultation",     "duration": 30, "price": 260.00},
    ],
    "ONCOLOGY": [
        {"name": "Oncology Consultation",             "duration": 45, "price": 320.00},
        {"name": "Chemotherapy Planning Session",     "duration": 60, "price": 400.00},
        {"name": "Treatment Response Review",         "duration": 30, "price": 260.00},
        {"name": "Surveillance Scan Review",          "duration": 30, "price": 240.00},
        {"name": "Palliative Care Consultation",      "duration": 45, "price": 300.00},
        {"name": "Tumour Board Referral Consultation","duration": 45, "price": 350.00},
        {"name": "Immunotherapy Monitoring Visit",    "duration": 30, "price": 280.00},
        {"name": "Cancer Genetic Risk Assessment",    "duration": 60, "price": 420.00},
        {"name": "Post-treatment Follow-up",          "duration": 30, "price": 250.00},
        {"name": "Symptom Management Consultation",   "duration": 30, "price": 270.00},
    ],
    "EMERGENCY_MEDICINE": [
        {"name": "Emergency Assessment",              "duration": 30, "price": 250.00},
        {"name": "Wound Assessment & Closure",        "duration": 30, "price": 300.00},
        {"name": "Laceration Suturing",               "duration": 30, "price": 350.00},
        {"name": "Acute Pain Management",             "duration": 20, "price": 200.00},
        {"name": "Minor Burns Assessment",            "duration": 20, "price": 200.00},
        {"name": "Fracture Splinting",                "duration": 30, "price": 280.00},
        {"name": "Acute Infection Management",        "duration": 20, "price": 180.00},
        {"name": "Anaphylaxis Follow-up",             "duration": 30, "price": 220.00},
        {"name": "Chest Pain Rapid Assessment",       "duration": 30, "price": 260.00},
        {"name": "Head Injury Assessment",            "duration": 30, "price": 240.00},
    ],
    "INTERNAL_MEDICINE": [
        {"name": "Internal Medicine Consultation",    "duration": 30, "price": 220.00},
        {"name": "Annual Health Review",              "duration": 45, "price": 260.00},
        {"name": "Chronic Disease Management",        "duration": 30, "price": 210.00},
        {"name": "Pre-operative Assessment",          "duration": 30, "price": 200.00},
        {"name": "Hypertension Management",           "duration": 20, "price": 170.00},
        {"name": "Diabetes Management Review",        "duration": 30, "price": 200.00},
        {"name": "Anaemia Evaluation",                "duration": 30, "price": 210.00},
        {"name": "Fever & Infection Assessment",      "duration": 20, "price": 160.00},
        {"name": "Blood Test Results Review",         "duration": 20, "price": 150.00},
        {"name": "Lifestyle & Prevention Consultation","duration": 30, "price": 180.00},
        {"name": "Travel Medicine Consultation",      "duration": 30, "price": 190.00},
    ],
    "SURGERY": [
        {"name": "Surgical Consultation",             "duration": 30, "price": 250.00},
        {"name": "Pre-operative Evaluation",          "duration": 30, "price": 220.00},
        {"name": "Post-operative Follow-up",          "duration": 30, "price": 200.00},
        {"name": "Hernia Assessment",                 "duration": 30, "price": 240.00},
        {"name": "Wound Management",                  "duration": 20, "price": 180.00},
        {"name": "Abdominal Pain Evaluation",         "duration": 30, "price": 230.00},
        {"name": "Minor Surgical Procedure",          "duration": 30, "price": 350.00},
        {"name": "Laparoscopy Results Review",        "duration": 30, "price": 260.00},
        {"name": "Colorectal Surgery Consultation",   "duration": 45, "price": 300.00},
        {"name": "Lipoma / Cyst Removal Consultation","duration": 20, "price": 200.00},
        {"name": "Thyroid Surgery Consultation",      "duration": 30, "price": 280.00},
    ],
    "UROLOGY": [
        {"name": "Urology Consultation",              "duration": 30, "price": 230.00},
        {"name": "PSA Results Review",                "duration": 20, "price": 160.00},
        {"name": "Prostate Assessment",               "duration": 30, "price": 220.00},
        {"name": "Kidney Stone Management",           "duration": 30, "price": 240.00},
        {"name": "Urinary Incontinence Assessment",   "duration": 45, "price": 280.00},
        {"name": "Urodynamics Results Review",        "duration": 30, "price": 220.00},
        {"name": "Erectile Dysfunction Consultation", "duration": 30, "price": 260.00},
        {"name": "Cystoscopy Results Review",         "duration": 20, "price": 200.00},
        {"name": "Renal Ultrasound Consultation",     "duration": 20, "price": 180.00},
        {"name": "Testicular Examination",            "duration": 20, "price": 170.00},
        {"name": "Haematuria Evaluation",             "duration": 30, "price": 230.00},
    ],
    "ENDOCRINOLOGY": [
        {"name": "Endocrinology Consultation",        "duration": 30, "price": 250.00},
        {"name": "Thyroid Treatment Follow-up",       "duration": 20, "price": 180.00},
        {"name": "Hormonal Results Review",           "duration": 30, "price": 220.00},
        {"name": "Diabetes Type 2 Management",        "duration": 30, "price": 210.00},
        {"name": "Insulin Pump Consultation",         "duration": 45, "price": 280.00},
        {"name": "Adrenal Disorder Assessment",       "duration": 30, "price": 240.00},
        {"name": "Pituitary Function Review",         "duration": 30, "price": 250.00},
        {"name": "Bone Metabolism Consultation",      "duration": 30, "price": 220.00},
        {"name": "Thyroid Nodule Evaluation",         "duration": 30, "price": 230.00},
        {"name": "Polycystic Ovary Syndrome (PCOS) Management", "duration": 30, "price": 220.00},
        {"name": "Growth Hormone Deficiency Review",  "duration": 30, "price": 260.00},
    ],
    "GASTROENTEROLOGY": [
        {"name": "Gastroenterology Consultation",     "duration": 30, "price": 300.00},
        {"name": "Gastroscopy Results Review",        "duration": 30, "price": 250.00},
        {"name": "Colonoscopy Results Review",        "duration": 30, "price": 250.00},
        {"name": "IBD Management Review",             "duration": 30, "price": 260.00},
        {"name": "Liver Disease Consultation",        "duration": 30, "price": 280.00},
        {"name": "Coeliac Disease Follow-up",         "duration": 20, "price": 200.00},
        {"name": "Irritable Bowel Syndrome Plan",     "duration": 30, "price": 220.00},
        {"name": "H. Pylori Treatment Review",        "duration": 20, "price": 180.00},
        {"name": "Abdominal Ultrasound Consultation", "duration": 30, "price": 220.00},
        {"name": "Functional GI Disorder Assessment", "duration": 45, "price": 270.00},
        {"name": "Gastric Reflux Management",         "duration": 20, "price": 190.00},
    ],
    "PULMONOLOGY": [
        {"name": "Pulmonology Consultation",          "duration": 30, "price": 230.00},
        {"name": "Spirometry with Interpretation",    "duration": 30, "price": 150.00},
        {"name": "Chest CT Results Review",           "duration": 20, "price": 200.00},
        {"name": "Asthma Management Review",          "duration": 30, "price": 210.00},
        {"name": "COPD Follow-up",                    "duration": 30, "price": 220.00},
        {"name": "Sleep Study Results Review",        "duration": 30, "price": 240.00},
        {"name": "Inhaler Technique Assessment",      "duration": 20, "price": 130.00},
        {"name": "Bronchoscopy Pre-assessment",       "duration": 30, "price": 250.00},
        {"name": "Oxygen Therapy Consultation",       "duration": 30, "price": 220.00},
        {"name": "Interstitial Lung Disease Follow-up","duration": 30, "price": 240.00},
        {"name": "Smoking Cessation Consultation",    "duration": 30, "price": 180.00},
    ],
    "RHEUMATOLOGY": [
        {"name": "Rheumatology Consultation",         "duration": 45, "price": 270.00},
        {"name": "Rheumatoid Arthritis Review",       "duration": 30, "price": 230.00},
        {"name": "Biologics Monitoring Visit",        "duration": 20, "price": 200.00},
        {"name": "Lupus Management Review",           "duration": 30, "price": 240.00},
        {"name": "Gout Management",                   "duration": 20, "price": 190.00},
        {"name": "Joint Injection Consultation",      "duration": 20, "price": 300.00},
        {"name": "Fibromyalgia Assessment",           "duration": 45, "price": 260.00},
        {"name": "Osteoporosis Management Review",    "duration": 30, "price": 220.00},
        {"name": "Vasculitis Follow-up",              "duration": 30, "price": 250.00},
        {"name": "Connective Tissue Disease Assessment","duration": 45, "price": 280.00},
        {"name": "Ankylosing Spondylitis Review",     "duration": 30, "price": 230.00},
    ],
    "NEPHROLOGY": [
        {"name": "Nephrology Consultation",           "duration": 30, "price": 260.00},
        {"name": "Chronic Kidney Disease Review",     "duration": 30, "price": 240.00},
        {"name": "Dialysis Planning Consultation",    "duration": 45, "price": 320.00},
        {"name": "Kidney Transplant Follow-up",       "duration": 30, "price": 280.00},
        {"name": "Proteinuria Assessment",            "duration": 20, "price": 190.00},
        {"name": "Hypertensive Nephropathy Review",   "duration": 30, "price": 230.00},
        {"name": "Electrolyte Disorder Consultation", "duration": 20, "price": 200.00},
        {"name": "Renal Biopsy Results Review",       "duration": 30, "price": 250.00},
        {"name": "AKI Follow-up",                     "duration": 30, "price": 220.00},
        {"name": "Urinary Tract Infection Review",    "duration": 20, "price": 160.00},
    ],
    "HEMATOLOGY": [
        {"name": "Haematology Consultation",          "duration": 45, "price": 300.00},
        {"name": "Blood Disorder Management",         "duration": 30, "price": 260.00},
        {"name": "Bone Marrow Biopsy Results Review", "duration": 30, "price": 280.00},
        {"name": "Leukaemia Treatment Review",        "duration": 30, "price": 270.00},
        {"name": "Lymphoma Follow-up",                "duration": 30, "price": 270.00},
        {"name": "Anticoagulation Management",        "duration": 20, "price": 190.00},
        {"name": "Thrombocytopenia Assessment",       "duration": 30, "price": 240.00},
        {"name": "Iron Deficiency Anaemia Review",    "duration": 20, "price": 170.00},
        {"name": "Haemophilia Management",            "duration": 30, "price": 280.00},
        {"name": "Post-transplant Haematology Review","duration": 30, "price": 260.00},
    ],
    "ANESTHESIOLOGY": [
        {"name": "Pre-anaesthetic Assessment",        "duration": 30, "price": 220.00},
        {"name": "Pain Management Consultation",      "duration": 45, "price": 300.00},
        {"name": "Chronic Pain Review",               "duration": 30, "price": 260.00},
        {"name": "Regional Anaesthesia Consultation", "duration": 30, "price": 250.00},
        {"name": "Post-operative Pain Review",        "duration": 20, "price": 190.00},
        {"name": "Epidural / Spinal Planning",        "duration": 30, "price": 230.00},
        {"name": "Nerve Block Consultation",          "duration": 30, "price": 280.00},
        {"name": "Palliative Pain Management",        "duration": 45, "price": 320.00},
        {"name": "Sedation Planning Consultation",    "duration": 20, "price": 200.00},
        {"name": "Allergy to Anaesthetic Review",     "duration": 30, "price": 240.00},
    ],
    "FAMILY_MEDICINE": [
        {"name": "GP Consultation",                   "duration": 20, "price": 150.00},
        {"name": "Annual Health Check",               "duration": 30, "price": 180.00},
        {"name": "Sick Note Consultation",            "duration": 15, "price": 100.00},
        {"name": "Vaccination Appointment",           "duration": 15, "price": 90.00},
        {"name": "Chronic Condition Review",          "duration": 20, "price": 160.00},
        {"name": "Referral & Test Results Review",    "duration": 20, "price": 140.00},
        {"name": "Minor Illness Consultation",        "duration": 15, "price": 110.00},
        {"name": "Preventive Health Screening",       "duration": 30, "price": 170.00},
        {"name": "Child Development Review",          "duration": 30, "price": 160.00},
        {"name": "Elderly Care Consultation",         "duration": 30, "price": 170.00},
        {"name": "Mental Health Review (GP level)",   "duration": 20, "price": 155.00},
        {"name": "Travel Medicine Advice",            "duration": 20, "price": 150.00},
    ],
}

# ─── Bio templates per specialization ────────────────────────────────────────

# Each entry: list of bio template strings with {name}, {years}, {university},
# {focus_a}, {focus_b}, {skill} placeholders.

_FOCUS_POOLS: dict[str, list[str]] = {
    "CARDIOLOGY":         ["arrhythmia management", "heart failure treatment", "coronary artery disease", "preventive cardiology", "cardiac imaging", "valvular disease", "electrophysiology", "hypertension"],
    "NEUROLOGY":          ["multiple sclerosis", "epilepsy", "migraine and headache disorders", "neurodegenerative diseases", "stroke prevention", "peripheral neuropathy", "movement disorders", "neuro-oncology"],
    "ORTHOPEDICS":        ["knee and shoulder arthroscopy", "joint replacement surgery", "sports injuries", "spine surgery", "fracture management", "paediatric orthopaedics", "foot and ankle disorders", "hand surgery"],
    "PEDIATRICS":         ["paediatric allergology", "infant nutrition", "developmental disorders", "childhood infectious diseases", "neonatology", "paediatric cardiology", "adolescent medicine", "paediatric gastroenterology"],
    "DERMATOLOGY":        ["psoriasis and atopic dermatitis", "skin oncology", "acne management", "sexually transmitted infections", "hair and nail disorders", "wound care", "cosmetic dermatology", "contact allergy"],
    "GYNECOLOGY":         ["endometriosis and infertility", "perinatal care", "colposcopy and cervical pathology", "menopause management", "gynaecological oncology", "contraception", "recurrent miscarriage", "minimally invasive surgery"],
    "PSYCHIATRY":         ["depression and anxiety", "ADHD in adults", "personality disorders", "trauma and PTSD", "bipolar disorder", "psychosis", "addiction psychiatry", "eating disorders"],
    "OPHTHALMOLOGY":      ["glaucoma", "diabetic retinopathy", "cataract surgery planning", "age-related macular degeneration", "dry eye syndrome", "strabismus", "uveitis", "contact lens fitting"],
    "RADIOLOGY":          ["chest and thoracic imaging", "abdominal and pelvic MRI", "neuroradiology", "musculoskeletal imaging", "breast imaging", "interventional radiology", "PET-CT interpretation", "vascular imaging"],
    "ONCOLOGY":           ["lung cancer", "colorectal cancer", "breast oncology", "immunotherapy protocols", "palliative care", "haematological malignancies", "targeted therapy", "cancer genetics"],
    "EMERGENCY_MEDICINE": ["trauma management", "acute cardiac events", "toxicology", "paediatric emergencies", "respiratory failure", "sepsis protocols", "procedural sedation", "point-of-care ultrasound"],
    "INTERNAL_MEDICINE":  ["hypertension and metabolic syndrome", "diabetes management", "anaemia", "chronic kidney disease", "thyroid disorders", "infectious diseases", "geriatric medicine", "preventive health"],
    "SURGERY":            ["laparoscopic abdominal surgery", "hernia repair", "colorectal surgery", "thyroid and parathyroid surgery", "hepatobiliary surgery", "breast surgery", "vascular surgery", "day-case procedures"],
    "UROLOGY":            ["prostate disease", "kidney stones", "urinary incontinence", "male infertility", "uro-oncology", "minimally invasive endoscopy", "renal cysts", "bladder disorders"],
    "ENDOCRINOLOGY":      ["thyroid disorders", "type 1 and type 2 diabetes", "adrenal diseases", "pituitary conditions", "osteoporosis", "polycystic ovary syndrome", "obesity medicine", "bone metabolism"],
    "GASTROENTEROLOGY":   ["inflammatory bowel disease", "liver and hepatology", "functional GI disorders", "colorectal cancer screening", "coeliac disease", "upper GI endoscopy", "pancreatic disorders", "gut microbiome"],
    "PULMONOLOGY":        ["asthma", "COPD and emphysema", "interstitial lung diseases", "sleep-disordered breathing", "pulmonary hypertension", "pleural diseases", "lung cancer screening", "smoking cessation"],
    "RHEUMATOLOGY":       ["rheumatoid arthritis", "systemic lupus erythematosus", "ankylosing spondylitis", "vasculitis", "fibromyalgia", "gout and crystal arthropathies", "connective tissue diseases", "osteoporosis"],
    "NEPHROLOGY":         ["chronic kidney disease", "dialysis planning", "kidney transplantation", "glomerulonephritis", "hypertensive nephropathy", "acute kidney injury", "polycystic kidney disease", "electrolyte disorders"],
    "HEMATOLOGY":         ["leukaemia and lymphoma", "anaemia", "haemostasis disorders", "bone marrow diseases", "anticoagulation management", "stem cell transplantation", "haemophilia", "iron metabolism"],
    "ANESTHESIOLOGY":     ["chronic pain management", "regional anaesthesia", "perioperative medicine", "palliative pain control", "paediatric anaesthesia", "neuroaxial blocks", "cancer pain", "post-operative rehabilitation"],
    "FAMILY_MEDICINE":    ["chronic disease prevention", "geriatric care", "mental health at primary care level", "paediatric and adult vaccinations", "cardiovascular risk reduction", "women's health", "palliative care", "lifestyle medicine"],
}

_SPECIALTY_NAMES: dict[str, str] = {
    "CARDIOLOGY":         "cardiologist",
    "NEUROLOGY":          "neurologist",
    "ORTHOPEDICS":        "orthopaedic surgeon",
    "PEDIATRICS":         "paediatrician",
    "DERMATOLOGY":        "dermatologist",
    "GYNECOLOGY":         "gynaecologist and obstetrician",
    "PSYCHIATRY":         "psychiatrist",
    "OPHTHALMOLOGY":      "ophthalmologist",
    "RADIOLOGY":          "radiologist",
    "ONCOLOGY":           "oncologist",
    "EMERGENCY_MEDICINE": "emergency medicine physician",
    "INTERNAL_MEDICINE":  "specialist in internal medicine",
    "SURGERY":            "general surgeon",
    "UROLOGY":            "urologist",
    "ENDOCRINOLOGY":      "endocrinologist",
    "GASTROENTEROLOGY":   "gastroenterologist",
    "PULMONOLOGY":        "pulmonologist",
    "RHEUMATOLOGY":       "rheumatologist",
    "NEPHROLOGY":         "nephrologist",
    "HEMATOLOGY":         "haematologist",
    "ANESTHESIOLOGY":     "anaesthesiologist and pain specialist",
    "FAMILY_MEDICINE":    "GP and family medicine physician",
}

_SOCIETIES: dict[str, str] = {
    "CARDIOLOGY":         "Polish Cardiac Society and the European Society of Cardiology",
    "NEUROLOGY":          "Polish Neurological Society and the European Academy of Neurology",
    "ORTHOPEDICS":        "Polish Orthopaedic and Traumatological Society",
    "PEDIATRICS":         "Polish Paediatric Society and the European Paediatric Association",
    "DERMATOLOGY":        "Polish Dermatological Society and the European Academy of Dermatology",
    "GYNECOLOGY":         "Polish Society of Gynaecologists and Obstetricians",
    "PSYCHIATRY":         "Polish Psychiatric Association and the European Psychiatric Association",
    "OPHTHALMOLOGY":      "Polish Ophthalmological Society and the European Society of Ophthalmology",
    "RADIOLOGY":          "Polish Medical Society of Radiology and the European Society of Radiology",
    "ONCOLOGY":           "Polish Society of Clinical Oncology and ESMO",
    "EMERGENCY_MEDICINE": "Polish Society of Emergency Medicine",
    "INTERNAL_MEDICINE":  "Polish Society of Internal Medicine",
    "SURGERY":            "Polish Surgical Society and the European Association for Endoscopic Surgery",
    "UROLOGY":            "Polish Urological Society and the European Association of Urology",
    "ENDOCRINOLOGY":      "Polish Society of Endocrinology and the European Society of Endocrinology",
    "GASTROENTEROLOGY":   "Polish Society of Gastroenterology and the European Society of Gastrointestinal Endoscopy",
    "PULMONOLOGY":        "Polish Society of Lung Diseases and the European Respiratory Society",
    "RHEUMATOLOGY":       "Polish Society of Rheumatology and EULAR",
    "NEPHROLOGY":         "Polish Society of Nephrology and the European Renal Association",
    "HEMATOLOGY":         "Polish Society of Haematology and Transfusiology and the EHA",
    "ANESTHESIOLOGY":     "Polish Society of Anaesthesiology and Intensive Therapy and the ESRA",
    "FAMILY_MEDICINE":    "Polish Society of Family Medicine and the European Society of General Practice",
}


def _generate_bio(
    rng: random.Random,
    first: str,
    last: str,
    is_female: bool,
    primary_spec: str,
    years: int,
    university: str,
) -> str:
    spec_name = _SPECIALTY_NAMES.get(primary_spec, "specialist")
    focuses   = _FOCUS_POOLS.get(primary_spec, ["general medicine"])
    society   = _SOCIETIES.get(primary_spec, "relevant professional society")
    f_a, f_b  = rng.sample(focuses, min(2, len(focuses)))
    pronoun   = "She" if is_female else "He"
    title     = "Dr"

    templates = [
        (
            f"{title} {first} {last} is a {spec_name} with {years} years of clinical experience. "
            f"A graduate of the {university}, {pronoun.lower()} specialises in {f_a} and {f_b}. "
            f"{pronoun} combines evidence-based practice with a patient-centred approach, "
            f"ensuring every consultation is thorough and clearly communicated. "
            f"{pronoun} is an active member of the {society}."
        ),
        (
            f"With {years} years of dedicated practice, {title} {first} {last} is a highly regarded "
            f"{spec_name}. {pronoun} graduated from the {university} and subsequently completed "
            f"specialist training at tertiary referral centres. Clinical interests focus on "
            f"{f_a} and {f_b}. {pronoun} actively participates in continuing medical education "
            f"and is a member of the {society}."
        ),
        (
            f"{title} {first} {last} brings {years} years of specialist expertise as a {spec_name}. "
            f"Having trained at the {university}, {pronoun.lower()} developed a particular focus on "
            f"{f_a} and {f_b}. {pronoun} is committed to integrating the latest clinical guidelines "
            f"into everyday practice and regularly contributes to departmental training programmes. "
            f"A member of the {society}."
        ),
        (
            f"A {spec_name} with {years} years of experience, {title} {first} {last} trained at "
            f"the {university}. {pronoun} has developed recognised expertise in {f_a} and {f_b}, "
            f"and is known for a thorough, empathetic consultation style. "
            f"{pronoun} frequently lectures at national conferences and is a member of the {society}."
        ),
    ]
    return rng.choice(templates)


# ─── Public generator ─────────────────────────────────────────────────────────

def generate_doctors(
    n:       int,
    centers: list[dict],
    seed:    int = 42,
) -> list[dict]:
    """
    Generate *n* unique doctor dicts with city-based centre assignment.

    Parameters
    ----------
    n        : number of doctors to generate
    centers  : the full MEDICAL_CENTERS list (used to build city→indices map)
    seed     : random seed for reproducibility

    Returns
    -------
    list[dict] – each dict matches the schema expected by seed_doctors()
    """
    rng = random.Random(seed)

    # Build city → [center_index, …] mapping
    city_centers: dict[str, list[int]] = {}
    for i, c in enumerate(centers):
        city_centers.setdefault(c["city"], []).append(i)

    cities  = list(city_centers.keys())
    weights = [len(city_centers[c]) for c in cities]

    specs_list, spec_weights = zip(*_SPEC_POOL)

    used_emails:     set[str] = set()
    used_public_ids: set[str] = set()
    used_licenses:   set[str] = set()
    result: list[dict] = []

    for _ in range(n):
        # ── Gender & name ─────────────────────────────────────────────────
        is_female = rng.random() < 0.50
        first = rng.choice(_FEMALE_FIRST if is_female else _MALE_FIRST)
        last  = rng.choice(_LAST_NAMES)

        # ── Unique email ──────────────────────────────────────────────────
        base  = f"{first[0].lower()}.{last.lower()}@clearbook.demo"
        email = base
        sfx   = 2
        while email in used_emails:
            email = f"{first[0].lower()}.{last.lower()}{sfx}@clearbook.demo"
            sfx  += 1
        used_emails.add(email)

        # ── Unique public_id ──────────────────────────────────────────────
        slug = re.sub(r"[^a-z0-9-]", "", f"{first}-{last}".lower())
        pid  = f"{slug}-{rng.randint(0, 0xffff):04x}"
        while pid in used_public_ids:
            pid = f"{slug}-{rng.randint(0, 0xffff):04x}"
        used_public_ids.add(pid)

        # ── Unique license ────────────────────────────────────────────────
        lic = f"PWZ-{rng.randint(1_000_000, 9_999_999)}"
        while lic in used_licenses:
            lic = f"PWZ-{rng.randint(1_000_000, 9_999_999)}"
        used_licenses.add(lic)

        # ── Specialization(s) ─────────────────────────────────────────────
        primary = rng.choices(list(specs_list), weights=list(spec_weights))[0]
        secondaries = _SECONDARY_MAP.get(primary, [])
        specializations = [primary]
        if secondaries and rng.random() < 0.45:      # 45 % chance of dual spec
            specializations.append(rng.choice(secondaries))

        # ── Services (3-10 from primary spec pool) ────────────────────────
        pool      = _SERVICE_POOLS.get(primary, _SERVICE_POOLS["FAMILY_MEDICINE"])
        n_svc     = rng.randint(3, min(10, len(pool)))
        services  = rng.sample(pool, n_svc)

        # ── City & centres (same-city constraint) ─────────────────────────
        city            = rng.choices(cities, weights=weights)[0]
        available       = city_centers[city]
        n_assigned      = min(rng.randint(1, 2), len(available))
        assigned_centers = rng.sample(available, n_assigned)

        # ── Misc ──────────────────────────────────────────────────────────
        work_hours = rng.choice([(8, 16), (9, 17), (10, 18)])
        years      = rng.randint(5, 25)
        university = rng.choice(_UNIVERSITIES)
        bio        = _generate_bio(rng, first, last, is_female, primary, years, university)

        result.append({
            "first_name":    first,
            "last_name":     last,
            "email":         email,
            "license":       lic,
            "license_file":  DUMMY_LICENSE_PATH,
            "public_id":     pid,
            "specializations": specializations,
            "bio":           bio,
            "services":      services,
            "centers":       assigned_centers,
            "work_hours":    work_hours,
        })

    return result
