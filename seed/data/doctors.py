"""
seed/data/doctors.py
====================
Static list of doctors to seed.

Each entry represents one doctor and maps to:
  - one row in users             (role = DOCTOR)
  - one row in doctor_profiles
  - N rows in doctor_services
  - M rows in doctor_profile_specializations

Fields:
  first_name / last_name  – displayed name
  email                   – unique login (must end in @clearbook.demo)
  license                 – PWZ number shown in admin panel
  license_file            – path written to doctor_profiles.license_file_path
  public_id               – URL-friendly slug (must be globally unique)
  specializations         – list of Specialization.code values
  bio                     – long professional biography (plain text)
  services                – list of {name, duration (min), price (PLN)}
  centers                 – indices into seed/data/centers.py::MEDICAL_CENTERS
  work_hours              – (start_hour, end_hour) for availability blocks

To add a new doctor: append a dict following the same schema.
"""

from seed.config import DUMMY_LICENSE_PATH

DOCTORS: list[dict] = [
    {
        "first_name": "Katherine", "last_name": "Wisniewska",
        "email":      "k.wisniewska@clearbook.demo",
        "license":    "PWZ-1023456",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Cardiology Consultation",     "duration": 30, "price": 250.00},
            {"name": "ECG with Interpretation",     "duration": 20, "price": 120.00},
            {"name": "Holter ECG – Results Review", "duration": 30, "price": 180.00},
        ],
        "centers": [0, 2],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Mark", "last_name": "Zielinski",
        "email":      "m.zielinski@clearbook.demo",
        "license":    "PWZ-2034567",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Orthopaedic Consultation",    "duration": 30, "price": 220.00},
            {"name": "Knee Examination + Ultrasound","duration": 45, "price": 300.00},
            {"name": "Intra-articular Injection",   "duration": 20, "price": 350.00},
        ],
        "centers": [0, 1],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Agnes", "last_name": "Kowalczyk",
        "email":      "a.kowalczyk@clearbook.demo",
        "license":    "PWZ-3045678",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Neurology Consultation",       "duration": 45, "price": 280.00},
            {"name": "Full Neurological Assessment", "duration": 60, "price": 350.00},
            {"name": "MS Treatment Follow-up",       "duration": 30, "price": 220.00},
        ],
        "centers": [2, 0],
        "work_hours": (10, 18),
    },
    {
        "first_name": "Thomas", "last_name": "Dabrowski",
        "email":      "t.dabrowski@clearbook.demo",
        "license":    "PWZ-4056789",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Paediatric Consultation", "duration": 30, "price": 180.00},
            {"name": "Child Health Check-up",   "duration": 45, "price": 220.00},
            {"name": "Lactation Consultation",  "duration": 30, "price": 160.00},
        ],
        "centers": [1, 3],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Monica", "last_name": "Lewandowska",
        "email":      "m.lewandowska@clearbook.demo",
        "license":    "PWZ-5067890",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Dermatology Consultation",     "duration": 30, "price": 200.00},
            {"name": "Dermoscopy (up to 5 lesions)", "duration": 30, "price": 250.00},
            {"name": "Skin Lesion Removal",          "duration": 30, "price": 400.00},
        ],
        "centers": [1, 4],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Peter", "last_name": "Nowakowski",
        "email":      "p.nowakowski@clearbook.demo",
        "license":    "PWZ-6078901",
        "license_file": DUMMY_LICENSE_PATH,
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
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Gynaecological Consultation", "duration": 30, "price": 210.00},
            {"name": "Gynaecological Ultrasound",   "duration": 30, "price": 180.00},
            {"name": "Colposcopy",                  "duration": 30, "price": 300.00},
        ],
        "centers": [1, 4],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Andrew", "last_name": "Wroblewski",
        "email":      "a.wroblewski@clearbook.demo",
        "license":    "PWZ-8090123",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Gastroenterology Consultation", "duration": 30, "price": 300.00},
            {"name": "Gastroscopy",                   "duration": 30, "price": 600.00},
            {"name": "Colonoscopy Results Review",    "duration": 30, "price": 250.00},
        ],
        "centers": [2, 0],
        "work_hours": (9, 17),
    },
    {
        "first_name": "Eva", "last_name": "Kowalska",
        "email":      "e.kowalska@clearbook.demo",
        "license":    "PWZ-9012345",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Endocrinology Consultation",  "duration": 30, "price": 250.00},
            {"name": "Thyroid Treatment Follow-up", "duration": 20, "price": 180.00},
            {"name": "Hormonal Results Review",     "duration": 30, "price": 220.00},
        ],
        "centers": [3, 1],
        "work_hours": (8, 16),
    },
    {
        "first_name": "Ralph", "last_name": "Szymanski",
        "email":      "r.szymanski@clearbook.demo",
        "license":    "PWZ-0123456",
        "license_file": DUMMY_LICENSE_PATH,
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
            {"name": "Pulmonology Consultation",       "duration": 30, "price": 230.00},
            {"name": "Spirometry with Interpretation", "duration": 30, "price": 150.00},
            {"name": "Chest CT Results Review",        "duration": 20, "price": 200.00},
        ],
        "centers": [2, 4],
        "work_hours": (10, 18),
    },
]
