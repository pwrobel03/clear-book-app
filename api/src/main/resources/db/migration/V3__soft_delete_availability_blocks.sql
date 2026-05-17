-- ─────────────────────────────────────────────────────────────────────────────
-- V3 : Add soft-delete support to availability_blocks
--
-- Adds the is_deleted flag so blocks can be logically removed without
-- breaking FK constraints from the appointments table.
-- All application queries filter on is_deleted = false.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE availability_blocks
    ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
