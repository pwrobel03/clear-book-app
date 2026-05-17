"""
seed/data/content.py
====================
Realistic text snippets used when generating appointments and reviews.

  REVIEW_COMMENTS   – (text, rating) pairs for appointment_reviews
  DOCTOR_REPLIES    – optional doctor responses to reviews (None = no reply)
  PATIENT_NOTES     – pre-visit notes written by patients
  DOCTOR_NOTES      – post-visit notes written by the doctor (COMPLETED only)

Extend any list to increase variety; the seeders pick entries at random.
"""

# (patient_comment, rating)
REVIEW_COMMENTS: list[tuple[str, int]] = [
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

# None entries mean no reply was written – picked at random alongside real replies
DOCTOR_REPLIES: list[str | None] = [
    "Thank you for your kind words – looking forward to seeing you at your next appointment!",
    "I am pleased the treatment is delivering the expected results. See you soon!",
    "Glad I could help. Please don't hesitate to reach out if any new symptoms arise.",
    "Thank you for your trust. Wishing you a speedy and full recovery!",
    "Please come back for your follow-up appointment as scheduled.",
    None,
    None,
    None,
]

# None entries mean the patient left no note
PATIENT_NOTES: list[str | None] = [
    "I have had severe pain for a week and over-the-counter medication is not helping.",
    "I would like to discuss the results of my recent blood tests.",
    "The first symptoms appeared about three months ago.",
    "I take medication X regularly – please review the dosage.",
    "Follow-up visit after hospitalisation.",
    "I need a referral to another specialist.",
    "Recurring episodes over the last two weeks, varying in intensity.",
    None,
]

# None entries mean no post-visit note was recorded
DOCTOR_NOTES: list[str | None] = [
    "Further diagnostics recommended. ECG referral issued.",
    "Review in 3 months. Medication dosage unchanged.",
    "Test results within normal range. No further treatment indicated.",
    "Antibiotic course prescribed for 7 days. Follow up if symptoms worsen.",
    "Elective hospital referral issued.",
    "Abdominal ultrasound ordered. Results review in 2 weeks.",
    "Discussed lifestyle modifications. Patient education materials provided.",
    None,
]
