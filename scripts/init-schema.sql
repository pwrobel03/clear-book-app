-- =============================================================================
-- ClearBook — PostgreSQL Init Schema
-- =============================================================================
-- This file is mounted into /docker-entrypoint-initdb.d/ in the postgres-db
-- container for local development.  PostgreSQL executes it automatically the
-- FIRST time the data directory is empty (i.e. on a fresh volume).
--
-- It is the authoritative source of truth for the schema in local dev and
-- replaces Flyway (which does not support PostgreSQL 18 in Flyway 11.x).
--
-- IMPORTANT: This file is generated from the Flyway migrations V1–V5.
--            When you add a new migration (V6, etc.) you must also update
--            this file to keep local dev in sync with production.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- V1: Initial schema
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    created_at  timestamp(6),
    id          uuid          NOT NULL,
    email       varchar(255)  NOT NULL UNIQUE,
    first_name  varchar(255)  NOT NULL,
    last_name   varchar(255)  NOT NULL,
    password    varchar(255)  NOT NULL,
    role        varchar(255)  NOT NULL CHECK (role IN ('USER','DOCTOR','MANAGER','ADMIN')),
    status      varchar(255)  NOT NULL CHECK (status IN ('UNVERIFIED','PENDING','ACTIVE','BANNED','DELETED')),
    PRIMARY KEY (id)
);

CREATE TABLE specializations (
    active  boolean       NOT NULL,
    id      uuid          NOT NULL,
    code    varchar(60)   NOT NULL UNIQUE,
    name    varchar(100)  NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE medical_centers (
    created_at  timestamp(6)  NOT NULL,
    updated_at  timestamp(6)  NOT NULL,
    id          uuid          NOT NULL,
    address     varchar(255),
    city        varchar(255),
    description TEXT,
    email       varchar(255),
    logo_url    varchar(255),
    name        varchar(255)  NOT NULL,
    phone       varchar(255),
    status      varchar(255)  NOT NULL CHECK (status IN ('PENDING_APPROVAL','ACTIVE','SUSPENDED')),
    type        varchar(255)  NOT NULL CHECK (type IN ('CLINIC','HOSPITAL','PRIVATE_PRACTICE','DIAGNOSTIC_CENTER','REHABILITATION_CENTER')),
    website     varchar(255),
    PRIMARY KEY (id)
);

CREATE TABLE doctor_profiles (
    average_rating      double precision    DEFAULT 0.0 NOT NULL,
    is_public           boolean             NOT NULL,
    total_reviews       integer             DEFAULT 0   NOT NULL,
    created_at          timestamp(6)        NOT NULL,
    updated_at          timestamp(6)        NOT NULL,
    id                  uuid                NOT NULL,
    user_id             uuid                NOT NULL UNIQUE,
    bio                 TEXT,
    license_number      varchar(255),
    photo_url           varchar(255),
    public_id           varchar(255)        NOT NULL UNIQUE,
    -- V4 columns (added inline so we avoid ALTER TABLE on a fresh DB)
    license_file_path   varchar(255),
    verification_status varchar(255)        DEFAULT 'PENDING'
                            CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
    PRIMARY KEY (id)
);

CREATE TABLE doctor_profile_specializations (
    doctor_profile_id   uuid NOT NULL,
    specialization_id   uuid NOT NULL,
    PRIMARY KEY (doctor_profile_id, specialization_id)
);

CREATE TABLE doctor_services (
    active              boolean         NOT NULL,
    duration_minutes    integer         NOT NULL,
    price               numeric(10,2),
    doctor_id           uuid            NOT NULL,
    id                  uuid            NOT NULL,
    name                varchar(255)    NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE center_memberships (
    invited_at          timestamp(6)    NOT NULL,
    joined_at           timestamp(6),
    center_id           uuid            NOT NULL,
    id                  uuid            NOT NULL,
    invited_by_user_id  uuid,
    user_id             uuid            NOT NULL,
    role                varchar(255)    NOT NULL CHECK (role IN ('MEMBER','ADMIN')),
    status              varchar(255)    NOT NULL CHECK (status IN ('INVITED','ACTIVE','SUSPENDED','REJECTED')),
    PRIMARY KEY (id),
    UNIQUE (user_id, center_id)
);

CREATE TABLE availability_blocks (
    created_at  timestamp(6)    NOT NULL,
    end_time    timestamp(6)    NOT NULL,
    start_time  timestamp(6)    NOT NULL,
    center_id   uuid            NOT NULL,
    doctor_id   uuid            NOT NULL,
    id          uuid            NOT NULL,
    -- V3 column (added inline)
    is_deleted  boolean         NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

CREATE TABLE appointments (
    created_at      timestamp(6)    NOT NULL,
    end_time        timestamp(6)    NOT NULL,
    reserved_until  timestamp(6),
    start_time      timestamp(6)    NOT NULL,
    block_id        uuid            NOT NULL,
    id              uuid            NOT NULL,
    patient_id      uuid            NOT NULL,
    service_id      uuid            NOT NULL,
    doctor_notes    TEXT,
    patient_notes   TEXT,
    status          varchar(255)    NOT NULL CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','RESERVED','NO_SHOW')),
    -- V4 column (added inline)
    reminder_sent   boolean         NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

CREATE TABLE appointment_reviews (
    is_anonymous    boolean         NOT NULL,
    rating          integer         NOT NULL,
    created_at      timestamp(6),
    replied_at      timestamp(6),
    updated_at      timestamp(6),
    appointment_id  uuid            NOT NULL UNIQUE,
    id              uuid            NOT NULL,
    doctor_reply    TEXT,
    patient_comment TEXT            NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE invite_codes (
    created_at  timestamp(6)    NOT NULL,
    expires_at  timestamp(6)    NOT NULL,
    code        varchar(12)     NOT NULL UNIQUE,
    id          uuid            NOT NULL,
    user_id     uuid            NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE password_reset_tokens (
    expiry_date timestamp(6)    NOT NULL,
    id          bigint          GENERATED BY DEFAULT AS IDENTITY,
    user_id     uuid            NOT NULL UNIQUE,
    token       varchar(255)    NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE verification_tokens (
    expiry_date timestamp(6)    NOT NULL,
    id          bigint          GENERATED BY DEFAULT AS IDENTITY,
    user_id     uuid            NOT NULL UNIQUE,
    token       varchar(255)    NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- V2: Refresh tokens
-- ---------------------------------------------------------------------------

CREATE TABLE refresh_tokens (
    id          uuid            NOT NULL,
    token       varchar(255)    NOT NULL UNIQUE,
    user_id     uuid            NOT NULL,
    expires_at  timestamp(6)    NOT NULL,
    created_at  timestamp(6)    NOT NULL,
    revoked     boolean         NOT NULL DEFAULT false,
    PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- V4: Notifications table
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
    id          uuid            NOT NULL,
    user_id     uuid            NOT NULL,
    title       varchar(255)    NOT NULL,
    message     TEXT            NOT NULL,
    is_read     boolean         NOT NULL DEFAULT false,
    created_at  timestamp(6)    NOT NULL,
    PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE doctor_profiles
    ADD CONSTRAINT fk_doctor_profile_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE doctor_profile_specializations
    ADD CONSTRAINT fk_dps_profile
    FOREIGN KEY (doctor_profile_id) REFERENCES doctor_profiles;

ALTER TABLE doctor_profile_specializations
    ADD CONSTRAINT fk_dps_specialization
    FOREIGN KEY (specialization_id) REFERENCES specializations;

ALTER TABLE doctor_services
    ADD CONSTRAINT fk_doctor_service_doctor
    FOREIGN KEY (doctor_id) REFERENCES users;

ALTER TABLE center_memberships
    ADD CONSTRAINT fk_membership_center
    FOREIGN KEY (center_id) REFERENCES medical_centers;

ALTER TABLE center_memberships
    ADD CONSTRAINT fk_membership_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE center_memberships
    ADD CONSTRAINT fk_membership_invited_by
    FOREIGN KEY (invited_by_user_id) REFERENCES users;

ALTER TABLE availability_blocks
    ADD CONSTRAINT fk_block_center
    FOREIGN KEY (center_id) REFERENCES medical_centers;

ALTER TABLE availability_blocks
    ADD CONSTRAINT fk_block_doctor
    FOREIGN KEY (doctor_id) REFERENCES users;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointment_block
    FOREIGN KEY (block_id) REFERENCES availability_blocks;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointment_patient
    FOREIGN KEY (patient_id) REFERENCES users;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointment_service
    FOREIGN KEY (service_id) REFERENCES doctor_services;

ALTER TABLE appointment_reviews
    ADD CONSTRAINT fk_review_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments;

ALTER TABLE invite_codes
    ADD CONSTRAINT fk_invite_code_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE password_reset_tokens
    ADD CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE verification_tokens
    ADD CONSTRAINT fk_verification_token_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_token_user
    FOREIGN KEY (user_id) REFERENCES users;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES users;

-- ---------------------------------------------------------------------------
-- Indexes (from V4)
-- ---------------------------------------------------------------------------

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
CREATE INDEX idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read)
    WHERE is_read = false;

-- appointment_reviews
CREATE INDEX idx_reviews_appointment_id ON appointment_reviews (appointment_id);

-- refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
