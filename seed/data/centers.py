"""
seed/data/centers.py
====================
Static list of medical centres to seed.
Each entry maps 1-to-1 to a row in the medical_centers table.

To add a new clinic: append a dict following the same schema.
The 'type' field must match CenterType enum values:
  CLINIC | HOSPITAL | PRIVATE_PRACTICE | DIAGNOSTIC_CENTER | REHABILITATION_CENTER
"""

MEDICAL_CENTERS: list[dict] = [
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
