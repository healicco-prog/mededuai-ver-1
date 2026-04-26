-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0006: creator_jobs — Background batch generation job queue
-- ─────────────────────────────────────────────────────────────────────────────
-- Enables the "Mass trigger Gemini background jobs" feature in Content Creator
-- Intelligence. Superadmin enqueues topics here and batch-process picks them up
-- server-side, so generation continues even if the browser is closed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creator_jobs (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id        UUID NOT NULL,

    -- Status lifecycle: pending → processing → completed | failed
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- Job metadata
    client_topic_id TEXT,                    -- client-side topic ID for UI correlation
    course_name     TEXT NOT NULL,
    subject_name    TEXT NOT NULL,
    section_name    TEXT DEFAULT 'General',
    topic_name      TEXT NOT NULL,
    lms_structure   JSONB NOT NULL DEFAULT '[]',
    version         TEXT DEFAULT '2025',

    -- Output & error tracking
    result          JSONB,                   -- generatedNotes stored here on completion
    error_message   TEXT,
    attempt_count   INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS creator_jobs_batch_id_idx     ON creator_jobs (batch_id);
CREATE INDEX IF NOT EXISTS creator_jobs_status_idx       ON creator_jobs (status);
CREATE INDEX IF NOT EXISTS creator_jobs_batch_status_idx ON creator_jobs (batch_id, status);
CREATE INDEX IF NOT EXISTS creator_jobs_created_at_idx   ON creator_jobs (created_at DESC);

-- RLS: Only service_role (server-side) can read/write
ALTER TABLE creator_jobs ENABLE ROW LEVEL SECURITY;

-- Server-side operations (API routes use service_role) bypass RLS by default.
-- Authenticated users (browser) should NOT access this table directly.
-- The following policy locks it down to service_role only:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'creator_jobs' AND policyname = 'service_role_only'
    ) THEN
        CREATE POLICY service_role_only ON creator_jobs
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_creator_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS creator_jobs_updated_at ON creator_jobs;
CREATE TRIGGER creator_jobs_updated_at
    BEFORE UPDATE ON creator_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_creator_jobs_updated_at();
