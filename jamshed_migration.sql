-- ============================================================
-- Emblazers School Management System
-- Migration: report_card_settings table
-- Generated: 2026-04-21
-- ============================================================

CREATE TABLE IF NOT EXISTS report_card_settings (
  id                  SERIAL PRIMARY KEY,
  school_name         TEXT NOT NULL DEFAULT '',
  school_logo         TEXT,
  principal_name      TEXT NOT NULL DEFAULT '',
  principal_signature TEXT,
  grading_scale       JSONB NOT NULL DEFAULT '[]',
  passing_percentage  REAL NOT NULL DEFAULT 40,
  show_attendance     BOOLEAN NOT NULL DEFAULT TRUE,
  show_remarks        BOOLEAN NOT NULL DEFAULT TRUE,
  show_position       BOOLEAN NOT NULL DEFAULT TRUE,
  show_grade          BOOLEAN NOT NULL DEFAULT TRUE,
  header_color        TEXT NOT NULL DEFAULT '#1e40af',
  footer_text         TEXT,
  remark_labels       JSONB NOT NULL DEFAULT '{}',
  branch_id           INTEGER,
  updated_at          TEXT
);

-- ============================================================
-- Column descriptions:
--   id                  Primary key (auto-increment)
--   school_name         School name printed on the report card header
--   school_logo         URL or base-64 string of the school logo
--   principal_name      Principal's name shown at the bottom
--   principal_signature URL or base-64 string of principal's signature image
--   grading_scale       JSON array of grade bands, e.g.:
--                         [{"grade":"A+","min":90,"max":100},
--                          {"grade":"A","min":80,"max":89}, ...]
--   passing_percentage  Minimum percentage required to pass (default 40)
--   show_attendance     Toggle attendance section on the report card
--   show_remarks        Toggle teacher remarks section
--   show_position       Toggle class position / rank display
--   show_grade          Toggle letter-grade column
--   header_color        Hex colour used for the report card header bar
--   footer_text         Optional custom footer line (e.g. address / tagline)
--   remark_labels       JSON object mapping grade thresholds to remark text,
--                         e.g. {"A+":"Outstanding","A":"Excellent",...}
--   branch_id           Foreign key to branches table (NULL = all branches)
--   updated_at          ISO-8601 timestamp of last settings update
-- ============================================================
