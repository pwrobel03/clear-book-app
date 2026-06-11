-- V5: Create appointment_reviews if missing from older schema deployments
CREATE TABLE IF NOT EXISTS appointment_reviews (
    is_anonymous    boolean      NOT NULL,
    rating          integer      NOT NULL,
    created_at      timestamp(6),
    replied_at      timestamp(6),
    updated_at      timestamp(6),
    appointment_id  uuid         NOT NULL UNIQUE,
    id              uuid         NOT NULL,
    doctor_reply    TEXT,
    patient_comment TEXT         NOT NULL,
    PRIMARY KEY (id)
);

ALTER TABLE appointment_reviews
    DROP CONSTRAINT IF EXISTS fk_review_appointment;

ALTER TABLE appointment_reviews
    ADD CONSTRAINT fk_review_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id);

CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON appointment_reviews (appointment_id);
