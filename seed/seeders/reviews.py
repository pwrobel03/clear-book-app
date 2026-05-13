"""
seed/seeders/reviews.py
=======================
Adds patient reviews to COMPLETED appointments and recalculates
average_rating / total_reviews on each affected doctor profile.

~70 % of completed appointments receive a review.
~25 % of reviews are anonymous.
~60 % of reviews include a doctor reply.
"""

import random
from datetime import timedelta

from seed.helpers import uid, now_ts
from seed.data.content import REVIEW_COMMENTS, DOCTOR_REPLIES


def seed_reviews(cur, past_appointments: list[tuple]) -> None:
    """
    Insert reviews for completed past appointments.

    Parameters
    ----------
    past_appointments : list of (appointment_id: str, status: str)
        Typically the return value of seed_past_appointments().
    """
    completed = [aid for aid, s in past_appointments if s == "COMPLETED"]
    added = 0

    for appt_id in completed:
        if random.random() > 0.70:       # 30 % of visits have no review
            continue

        cur.execute(
            "SELECT id FROM appointment_reviews WHERE appointment_id = %s",
            (appt_id,),
        )
        if cur.fetchone():
            continue                      # review already exists (idempotent)

        comment, rating = random.choice(REVIEW_COMMENTS)
        is_anon    = random.random() < 0.25
        reply_text = random.choice(DOCTOR_REPLIES)
        replied_at = (
            now_ts() - timedelta(days=random.randint(0, 5))
            if reply_text else None
        )
        created_at = now_ts() - timedelta(days=random.randint(0, 10))

        cur.execute(
            """
            INSERT INTO appointment_reviews
                (id, appointment_id, rating, patient_comment,
                 is_anonymous, doctor_reply, replied_at,
                 created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                uid(), appt_id, rating, comment,
                is_anon, reply_text, replied_at,
                created_at, created_at,
            ),
        )
        added += 1

    # Recalculate aggregates on every affected doctor profile
    cur.execute(
        """
        UPDATE doctor_profiles dp
        SET    total_reviews  = sub.cnt,
               average_rating = sub.avg_r,
               updated_at     = NOW()
        FROM (
            SELECT u.id                               AS uid,
                   COUNT(ar.id)                       AS cnt,
                   ROUND(AVG(ar.rating)::numeric, 2)  AS avg_r
            FROM   users               u
            JOIN   doctor_profiles     dp2 ON dp2.user_id     = u.id
            JOIN   availability_blocks ab  ON ab.doctor_id    = u.id
            JOIN   appointments        a   ON a.block_id      = ab.id
            JOIN   appointment_reviews ar  ON ar.appointment_id = a.id
            GROUP  BY u.id
        ) sub
        WHERE  dp.user_id = sub.uid
        """
    )

    print(f"  + {added} review(s) added  |  doctor rating stats recalculated")
