"""
seed/data/centers.py
====================
34 medical centres across 10 Polish cities.

The 'city' field is used by the doctor generator to enforce the
geographic constraint: a doctor is only assigned to centres in
the same city they practice in.

To add a new centre: append a dict with the same keys.
'type' must be one of:  CLINIC | HOSPITAL | PRIVATE_PRACTICE
                        DIAGNOSTIC_CENTER | REHABILITATION_CENTER
"""

MEDICAL_CENTERS: list[dict] = [

    # ── Warsaw (8) ────────────────────────────────────────────────────────────
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
            "and a highly experienced medical team available both in the morning and evening hours."
        ),
    },
    {
        "name":        "Warsaw Central Hospital",
        "type":        "HOSPITAL",
        "city":        "Warsaw",
        "address":     "3 Nowogrodzka Street",
        "phone":       "+48 22 500 10 00",
        "email":       "info@warsawcentral.pl",
        "website":     "https://warsawcentral.pl",
        "description": (
            "One of Warsaw's largest public hospitals, providing emergency, surgical, and specialist "
            "inpatient care. Operates 24 specialist departments and a Level I trauma centre. "
            "Affiliated with the Medical University of Warsaw for clinical training and research."
        ),
    },
    {
        "name":        "MedExpress Warsaw",
        "type":        "CLINIC",
        "city":        "Warsaw",
        "address":     "18 Pulawska Street",
        "phone":       "+48 22 345 67 89",
        "email":       "contact@medexpress-warsaw.pl",
        "website":     "https://medexpress-warsaw.pl",
        "description": (
            "Fast-access outpatient clinic focused on same-day consultations and minor procedures. "
            "No referral required. Extended opening hours seven days a week with online booking "
            "and a digital prescription service."
        ),
    },
    {
        "name":        "Warsaw Cardiac Institute",
        "type":        "CLINIC",
        "city":        "Warsaw",
        "address":     "7 Spartanska Street",
        "phone":       "+48 22 678 90 12",
        "email":       "cardio@warsawcardiac.pl",
        "website":     "https://warsawcardiac.pl",
        "description": (
            "A dedicated cardiology centre offering the full spectrum of non-invasive and invasive "
            "cardiac diagnostics and treatment. Home to a 24/7 cardiac imaging suite and a team "
            "of interventional cardiologists with European board certification."
        ),
    },
    {
        "name":        "University Clinical Hospital Warsaw",
        "type":        "HOSPITAL",
        "city":        "Warsaw",
        "address":     "1a Banacha Street",
        "phone":       "+48 22 599 10 00",
        "email":       "sekretariat@uch-warsaw.pl",
        "website":     "https://uch-warsaw.pl",
        "description": (
            "A major academic medical centre combining tertiary clinical care with cutting-edge "
            "research and postgraduate medical education. Operates specialist units in oncology, "
            "transplantation, neuroscience, and paediatrics."
        ),
    },
    {
        "name":        "ProMed Private Practice Warsaw",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Warsaw",
        "address":     "22 Wilanowska Street",
        "phone":       "+48 22 456 78 90",
        "email":       "promed@promed-warsaw.pl",
        "website":     "https://promed-warsaw.pl",
        "description": (
            "A boutique private practice offering personalised, unhurried consultations. "
            "Specialising in preventive medicine and chronic disease management with a "
            "strong focus on continuity of care and a direct doctor-patient relationship."
        ),
    },
    {
        "name":        "DiagnoCenter Warsaw",
        "type":        "DIAGNOSTIC_CENTER",
        "city":        "Warsaw",
        "address":     "55 Grójecka Street",
        "phone":       "+48 22 789 01 23",
        "email":       "lab@diagnocenter.pl",
        "website":     "https://diagnocenter.pl",
        "description": (
            "Full-service diagnostic centre offering blood work, imaging (MRI, CT, ultrasound), "
            "and functional testing. Results available online within 24 hours. "
            "Equipped with a 3T MRI scanner and 256-slice CT system."
        ),
    },
    {
        "name":        "RehabPlus Warsaw",
        "type":        "REHABILITATION_CENTER",
        "city":        "Warsaw",
        "address":     "10 Raclawicka Street",
        "phone":       "+48 22 234 56 78",
        "email":       "rehab@rehabplus-warsaw.pl",
        "website":     "https://rehabplus-warsaw.pl",
        "description": (
            "Specialist rehabilitation centre offering physiotherapy, neurological rehabilitation, "
            "post-surgical recovery programmes, and sports medicine. "
            "Home to a hydrotherapy pool and a fully equipped gym supervised by physiotherapists."
        ),
    },

    # ── Cracow (5) ────────────────────────────────────────────────────────────
    {
        "name":        "Mediplus Medical Centre Cracow",
        "type":        "CLINIC",
        "city":        "Cracow",
        "address":     "12 Dluga Street",
        "phone":       "+48 12 987 65 43",
        "email":       "contact@mediplus-cracow.pl",
        "website":     "https://mediplus-cracow.pl",
        "description": (
            "A multi-specialty medical centre operating since 2008, providing swift access to "
            "specialist consultations without referrals. On-site laboratory open seven days a week "
            "with results available within 24 hours via the secure patient portal."
        ),
    },
    {
        "name":        "Jagiellonian University Hospital Cracow",
        "type":        "HOSPITAL",
        "city":        "Cracow",
        "address":     "2 Kopernika Street",
        "phone":       "+48 12 424 70 00",
        "email":       "klinika@juh-cracow.pl",
        "website":     "https://juh-cracow.pl",
        "description": (
            "The flagship teaching hospital of the Jagiellonian University Medical College, "
            "offering world-class care in oncology, haematology, cardiology, and rare diseases. "
            "Centre of excellence for bone marrow transplantation in Southern Poland."
        ),
    },
    {
        "name":        "Cracow Specialist Clinic",
        "type":        "CLINIC",
        "city":        "Cracow",
        "address":     "34 Wielicka Street",
        "phone":       "+48 12 111 22 33",
        "email":       "info@cracow-specialist.pl",
        "website":     "https://cracow-specialist.pl",
        "description": (
            "A well-established outpatient clinic in the Podgorze district, housing specialists "
            "in dermatology, orthopaedics, gynaecology, and neurology. "
            "Known for minimal waiting times and a friendly, patient-first environment."
        ),
    },
    {
        "name":        "MedPrivat Cracow",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Cracow",
        "address":     "7 Szewska Street",
        "phone":       "+48 12 444 55 66",
        "email":       "office@medprivat-cracow.pl",
        "website":     "https://medprivat-cracow.pl",
        "description": (
            "Private practice in the Old Town offering high-quality consultations with an emphasis "
            "on integrative medicine and preventive care. Flexible scheduling including evenings "
            "and Saturdays."
        ),
    },
    {
        "name":        "Cracow Diagnostic Centre",
        "type":        "DIAGNOSTIC_CENTER",
        "city":        "Cracow",
        "address":     "88 Zakopianska Street",
        "phone":       "+48 12 555 66 77",
        "email":       "diagnostics@cracow-diag.pl",
        "website":     "https://cracow-diag.pl",
        "description": (
            "State-of-the-art diagnostic facility offering laboratory testing, CT, MRI, PET-CT, "
            "and nuclear medicine studies. Specialist reporting by radiologists with subspecialty "
            "training. Results portal available 24/7."
        ),
    },

    # ── Wroclaw (4) ───────────────────────────────────────────────────────────
    {
        "name":        "St. John Paul II Specialist Hospital",
        "type":        "HOSPITAL",
        "city":        "Wroclaw",
        "address":     "8 Swietego Jana Street",
        "phone":       "+48 71 456 78 90",
        "email":       "office@sjp2hospital.pl",
        "website":     "https://sjp2hospital.pl",
        "description": (
            "A specialist hospital with over 40 years of tradition providing a full range of "
            "medical services. Operates cardiology, neurology, and orthopaedic departments. "
            "Certified by the Centre for Quality Monitoring in Healthcare."
        ),
    },
    {
        "name":        "Wroclaw Medical Clinic",
        "type":        "CLINIC",
        "city":        "Wroclaw",
        "address":     "20 Swidnicka Street",
        "phone":       "+48 71 300 40 50",
        "email":       "info@wroclaw-medclinic.pl",
        "website":     "https://wroclaw-medclinic.pl",
        "description": (
            "Modern outpatient clinic in the city centre offering specialist consultations and "
            "minor surgical procedures. Same-day appointments available for urgent cases. "
            "Parking and easy access by public transport."
        ),
    },
    {
        "name":        "Salus Wroclaw",
        "type":        "CLINIC",
        "city":        "Wroclaw",
        "address":     "5 Pilsudskiego Street",
        "phone":       "+48 71 222 33 44",
        "email":       "salus@salus-wroclaw.pl",
        "website":     "https://salus-wroclaw.pl",
        "description": (
            "Multi-specialty clinic serving Wroclaw's Srodmiescie district. Core specialties include "
            "internal medicine, endocrinology, rheumatology, and pulmonology. "
            "Accredited by the Polish Society of Quality in Healthcare."
        ),
    },
    {
        "name":        "WrocMed Private Practice",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Wroclaw",
        "address":     "14 Kazimierza Wielkiego Street",
        "phone":       "+48 71 666 77 88",
        "email":       "wrocmed@wrocmed.pl",
        "website":     "https://wrocmed.pl",
        "description": (
            "Boutique private practice offering comprehensive diagnostics and personalised care. "
            "Fully paperless with an electronic health record accessible to patients. "
            "Telehealth consultations available."
        ),
    },

    # ── Poznan (4) ────────────────────────────────────────────────────────────
    {
        "name":        "MediCare Plus Private Practice",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Poznan",
        "address":     "33 Polwiejska Street",
        "phone":       "+48 61 234 56 78",
        "email":       "office@medicare-plus.pl",
        "website":     "https://medicare-plus.pl",
        "description": (
            "Boutique private practice focused on family medicine and preventive healthcare, "
            "with short waiting times, fully electronic documentation, and online consultations available."
        ),
    },
    {
        "name":        "Poznan City Hospital",
        "type":        "HOSPITAL",
        "city":        "Poznan",
        "address":     "49 Szwajcarska Street",
        "phone":       "+48 61 873 10 00",
        "email":       "szpital@poznan-cityhospital.pl",
        "website":     "https://poznan-cityhospital.pl",
        "description": (
            "Large municipal hospital operating emergency, surgical, and internal medicine "
            "departments. Home to the regional stroke unit and a neonatal intensive care ward. "
            "One of the main trauma centres for Greater Poland."
        ),
    },
    {
        "name":        "PosMed Poznan",
        "type":        "CLINIC",
        "city":        "Poznan",
        "address":     "6 Roosevelta Street",
        "phone":       "+48 61 345 67 89",
        "email":       "info@posmed.pl",
        "website":     "https://posmed.pl",
        "description": (
            "Comprehensive outpatient clinic covering 15 specialties under one roof. "
            "Known for its cooperative model where specialists consult on complex cases "
            "together, resulting in faster and more accurate diagnoses."
        ),
    },
    {
        "name":        "Poznan Diagnostic Centre",
        "type":        "DIAGNOSTIC_CENTER",
        "city":        "Poznan",
        "address":     "11 Mielzynskiego Street",
        "phone":       "+48 61 456 78 90",
        "email":       "lab@poznan-diag.pl",
        "website":     "https://poznan-diag.pl",
        "description": (
            "Leading diagnostics facility for the Wielkopolska region, providing imaging, "
            "laboratory, and genetic testing services. Certified ISO 15189 laboratory with "
            "results delivered electronically within 24 hours."
        ),
    },

    # ── Gdansk (3) ────────────────────────────────────────────────────────────
    {
        "name":        "CentraMed Diagnostic Centre",
        "type":        "DIAGNOSTIC_CENTER",
        "city":        "Gdansk",
        "address":     "7 Dlugi Targ Square",
        "phone":       "+48 58 321 09 87",
        "email":       "diagnostics@centramed.pl",
        "website":     "https://centramed.pl",
        "description": (
            "Leading diagnostic centre in the Tricity area offering laboratory tests, "
            "ultrasound, X-ray, CT, and MRI. Results available online within 24 hours. "
            "Equipped with the latest generation Siemens and GE Healthcare imaging systems."
        ),
    },
    {
        "name":        "Gdansk Medical Clinic",
        "type":        "CLINIC",
        "city":        "Gdansk",
        "address":     "23 Rajska Street",
        "phone":       "+48 58 400 50 60",
        "email":       "clinic@gdansk-medclinic.pl",
        "website":     "https://gdansk-medclinic.pl",
        "description": (
            "Multi-specialty outpatient clinic in central Gdansk covering cardiology, neurology, "
            "dermatology, and gynaecology. Online booking, digital prescriptions, and "
            "e-referrals available."
        ),
    },
    {
        "name":        "Pomeranian Specialist Hospital",
        "type":        "HOSPITAL",
        "city":        "Gdansk",
        "address":     "17 Nowe Ogrody Street",
        "phone":       "+48 58 764 00 00",
        "email":       "info@pomeranian-hospital.pl",
        "website":     "https://pomeranian-hospital.pl",
        "description": (
            "Regional specialist hospital for the Pomerania area, with departments in oncology, "
            "haematology, cardiology, and thoracic surgery. Home to the regional cancer referral "
            "centre and a certified bone densitometry unit."
        ),
    },

    # ── Lodz (3) ──────────────────────────────────────────────────────────────
    {
        "name":        "Lodz Medical Centre",
        "type":        "CLINIC",
        "city":        "Lodz",
        "address":     "35 Piotrkowska Street",
        "phone":       "+48 42 123 45 67",
        "email":       "info@lodz-medcenter.pl",
        "website":     "https://lodz-medcenter.pl",
        "description": (
            "Centrally located multi-specialty clinic on Lodz's famous Piotrkowska Street. "
            "Specialist consultations in 12 disciplines, with on-site laboratory and "
            "ultrasound diagnostics available daily."
        ),
    },
    {
        "name":        "Lodz Central Hospital",
        "type":        "HOSPITAL",
        "city":        "Lodz",
        "address":     "251 Pomorska Street",
        "phone":       "+48 42 675 00 00",
        "email":       "sekretariat@lodz-central.pl",
        "website":     "https://lodz-central.pl",
        "description": (
            "The largest hospital in the Lodz metropolitan area, operating 28 clinical departments. "
            "Provides emergency, surgical, and intensive care services around the clock. "
            "Teaching hospital affiliated with the Medical University of Lodz."
        ),
    },
    {
        "name":        "MediLodz Private Practice",
        "type":        "PRIVATE_PRACTICE",
        "city":        "Lodz",
        "address":     "8 Narutowicza Street",
        "phone":       "+48 42 234 56 78",
        "email":       "contact@medilodz.pl",
        "website":     "https://medilodz.pl",
        "description": (
            "Private practice offering family medicine, diabetology, and nutritional consultations. "
            "Patient-centred environment with extended appointment slots ensuring unhurried care."
        ),
    },

    # ── Katowice (2) ──────────────────────────────────────────────────────────
    {
        "name":        "Silesian Medical Centre",
        "type":        "CLINIC",
        "city":        "Katowice",
        "address":     "2 Rondo Street",
        "phone":       "+48 32 123 45 67",
        "email":       "info@silesian-medcenter.pl",
        "website":     "https://silesian-medcenter.pl",
        "description": (
            "Modern specialist clinic serving the Silesian conurbation. Expertise in occupational "
            "medicine, pulmonology, and cardiology — reflecting the regional health priorities "
            "of the area. Corporate health packages available."
        ),
    },
    {
        "name":        "Silesian Specialist Hospital",
        "type":        "HOSPITAL",
        "city":        "Katowice",
        "address":     "45 Medykow Street",
        "phone":       "+48 32 789 01 23",
        "email":       "hospital@silesian-specialist.pl",
        "website":     "https://silesian-specialist.pl",
        "description": (
            "Regional specialist hospital in Upper Silesia with a strong reputation in cardiac "
            "surgery, urology, and neuro-oncology. Provides complex tertiary care and trains "
            "medical residents in partnership with the Silesian Medical University."
        ),
    },

    # ── Szczecin (2) ──────────────────────────────────────────────────────────
    {
        "name":        "Szczecin Medical Clinic",
        "type":        "CLINIC",
        "city":        "Szczecin",
        "address":     "14 Monte Cassino Street",
        "phone":       "+48 91 456 78 90",
        "email":       "clinic@szczecin-medclinic.pl",
        "website":     "https://szczecin-medclinic.pl",
        "description": (
            "Outpatient clinic in central Szczecin offering specialist consultations in ten "
            "disciplines. Emphasis on preventive medicine and early detection programmes "
            "for cardiovascular and metabolic diseases."
        ),
    },
    {
        "name":        "Pomeranian University Hospital Szczecin",
        "type":        "HOSPITAL",
        "city":        "Szczecin",
        "address":     "1 Unii Lubelskiej Street",
        "phone":       "+48 91 425 00 00",
        "email":       "info@pum-hospital.pl",
        "website":     "https://pum-hospital.pl",
        "description": (
            "University hospital of the Pomeranian Medical University. Clinical excellence in "
            "transplantation, hepatology, and thoracic medicine. One of the few centres in Poland "
            "offering combined heart-kidney transplantation."
        ),
    },

    # ── Bydgoszcz (2) ────────────────────────────────────────────────────────
    {
        "name":        "Bydgoszcz Medical Centre",
        "type":        "CLINIC",
        "city":        "Bydgoszcz",
        "address":     "21 Gdanska Street",
        "phone":       "+48 52 345 67 89",
        "email":       "info@bydgoszcz-med.pl",
        "website":     "https://bydgoszcz-med.pl",
        "description": (
            "Well-established multi-specialty clinic in the Kujawy-Pomerania region. "
            "Covers internal medicine, neurology, ENT, and orthopaedics. "
            "Cooperates with local hospitals for seamless inpatient referrals."
        ),
    },
    {
        "name":        "Jan Biziel University Hospital Bydgoszcz",
        "type":        "HOSPITAL",
        "city":        "Bydgoszcz",
        "address":     "75 Ujejskiego Street",
        "phone":       "+48 52 365 50 00",
        "email":       "hospital@jb-hospital.pl",
        "website":     "https://jb-hospital.pl",
        "description": (
            "Teaching hospital of Collegium Medicum in Bydgoszcz, specialising in oncology, "
            "haematology, and gastroenterology. Regional referral centre for hereditary cancer "
            "syndromes and home to the only PET-CT unit in the Kujawy-Pomerania Voivodeship."
        ),
    },

    # ── Lublin (2) ────────────────────────────────────────────────────────────
    {
        "name":        "Lublin Medical Centre",
        "type":        "CLINIC",
        "city":        "Lublin",
        "address":     "5 Krakowskie Przedmiescie Street",
        "phone":       "+48 81 234 56 78",
        "email":       "clinic@lublin-medcenter.pl",
        "website":     "https://lublin-medcenter.pl",
        "description": (
            "Central Lublin's go-to outpatient clinic, offering quick access to specialist "
            "consultations and on-site diagnostics. Particularly strong in endocrinology, "
            "rheumatology, and paediatrics."
        ),
    },
    {
        "name":        "Medical University Hospital Lublin",
        "type":        "HOSPITAL",
        "city":        "Lublin",
        "address":     "8 Jaczewskiego Street",
        "phone":       "+48 81 724 28 11",
        "email":       "szpital@mu-lublin.pl",
        "website":     "https://mu-lublin.pl",
        "description": (
            "Clinical university hospital of the Medical University of Lublin, providing tertiary "
            "care in haematology, nephrology, and infectious diseases. Operates the regional HIV "
            "treatment centre and is a hub for clinical trials in Eastern Poland."
        ),
    },
]
