-- ─────────────────────────────────────────────────────────────────────────────
-- V4 : Add missing columns, notifications table, and performance indexes
--
-- Columns that exist in JPA entities but were not included in V1:
--   • doctor_profiles  → license_file_path, verification_status
--   • appointments     → reminder_sent
--
-- New table:
--   • notifications    (in-app notification inbox for doctors and patients)
--
-- Indexes on every FK column that backs a high-traffic JOIN or WHERE clause.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── doctor_profiles: admin verification columns ────────────────────────────────

ALTER TABLE doctor_profiles
    ADD COLUMN license_file_path   varchar(255);

ALTER TABLE doctor_profiles
    ADD COLUMN verification_status varchar(255) DEFAULT 'PENDING'
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED'));

-- ── appointments: e-mail reminder tracking flag ───────────────────────────────

ALTER TABLE appointments
    ADD COLUMN reminder_sent boolean NOT NULL DEFAULT false;

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE TABLE notifications (
    id          uuid          NOT NULL,
    user_id     uuid          NOT NULL,
    title       varchar(255)  NOT NULL,
    message     TEXT          NOT NULL,
    is_read     boolean       NOT NULL DEFAULT false,
    created_at  timestamp(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ── Performance indexes ───────────────────────────────────────────────────────
-- PostgreSQL does not automatically index FK columns; explicit indexes are
-- required for acceptable query performance on joins and filtered lookups.

-- appointments
CREATE INDEX idx_appointments_block_id   ON appointments (block_id);
CREATE INDEX idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX idx_appointments_service_id ON appointments (service_id);
CREATE INDEX idx_appointments_status     ON appointments (status);
CREATE INDEX idx_appointments_start_time ON appointments (start_time);

-- availability_blocks
CREATE INDEX idx_blocks_doctor_id  ON availability_blocks (doctor_id);
CREATE INDEX idx_blocks_center_id  ON availability_blocks (center_id);
CREATE INDEX idx_blocks_start_time ON availability_blocks (start_time);
CREATE INDEX idx_blocks_is_deleted ON availability_blocks (is_deleted);

-- center_memberships
CREATE INDEX idx_memberships_user_id   ON center_memberships (user_id);
CREATE INDEX idx_memberships_center_id ON center_memberships (center_id);
CREATE INDEX idx_memberships_status    ON center_memberships (status);

-- doctor_services
CREATE INDEX idx_doctor_services_doctor_id ON doctor_services (doctor_id);

-- notifications
CREATE INDEX idx_notifications_user_id        ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread     ON notifications (user_id, is_read)
    WHERE is_read = false;

-- appointment_reviews
CREATE INDEX idx_reviews_appointment_id ON appointment_reviews (appointment_id);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
