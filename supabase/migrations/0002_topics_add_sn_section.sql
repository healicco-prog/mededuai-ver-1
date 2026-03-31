-- ==========================================
-- Migration: Add SN, Section, and Competency No to Topics table
-- Changes the content pool format from (Topic, Competency No)
-- to (SN, Section, Topics, Competency No)
-- ==========================================

-- Add serial number column
ALTER TABLE topics ADD COLUMN IF NOT EXISTS sn INTEGER;

-- Add section column (e.g., "General Pharmacology", "Autonomic Nervous System")
ALTER TABLE topics ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'General';

-- Add competency number column (e.g., "PH1.1", "AN2.3")
ALTER TABLE topics ADD COLUMN IF NOT EXISTS competency_no TEXT DEFAULT 'N/A';

-- Update existing rows: set sn based on row order within each subject
WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY created_at) AS row_num
    FROM topics
)
UPDATE topics
SET sn = numbered.row_num
FROM numbered
WHERE topics.id = numbered.id AND topics.sn IS NULL;

-- Add an index on section for faster filtering
CREATE INDEX IF NOT EXISTS idx_topics_section ON topics(section);

-- Add an index on competency_no for lookups
CREATE INDEX IF NOT EXISTS idx_topics_competency_no ON topics(competency_no);
