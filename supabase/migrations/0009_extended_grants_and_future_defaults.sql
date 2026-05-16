-- ══════════════════════════════════════════════════════════════════════════
-- MedEduAI Migration 0009: Extended Grants + Future-Proof Default Privileges
--
-- Hardens the project against Supabase's "deny by default" rollout
-- (new projects: 2026-05-30, existing projects: 2026-10-30).
--
-- Migration 0008 granted every migration-defined table by name. This file
-- additionally:
--   1. Dynamically grants every CURRENT table in `public` (including ones
--      created via the Supabase Studio dashboard that never made it into a
--      versioned migration: blogs, referrals, q_papers, etc.). Idempotent.
--   2. Sets ALTER DEFAULT PRIVILEGES so any FUTURE table created by the
--      typical Supabase owner roles (postgres, supabase_admin) auto-grants
--      to the API roles. This is the belt-and-braces protection for tables
--      created later via the dashboard or new migrations.
--   3. Grants the dashboard-created tables explicitly by name (with
--      IF EXISTS guards) so the migration is auditable, not just dynamic.
--   4. Grants USAGE on the public schema and sequences (required for
--      SERIAL / bigserial inserts via the Data API).
--   5. Grants EXECUTE on the known `increment_view_count` RPC and any
--      future functions created in public.
--
-- API visibility grants (GRANT) control whether PostgREST/GraphQL exposes
-- the table at all. Per-row authorisation continues to be enforced by RLS
-- and the existing policies — nothing here loosens RLS.
-- ══════════════════════════════════════════════════════════════════════════


-- ── 1. Schema-level USAGE (prerequisite for any per-table grant to work) ──
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


-- ── 2. Dynamic catch-all: grant every existing public table ───────────────
-- Picks up dashboard-created tables (blogs, referrals, q_papers, …) without
-- requiring us to keep an exhaustive hand-maintained list. Safe to re-run.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',
            r.tablename
        );
        EXECUTE format(
            'GRANT ALL ON public.%I TO service_role',
            r.tablename
        );
    END LOOP;
END $$;


-- ── 3. Explicit named grants for dashboard-created tables (audit trail) ───
-- Wrapped in IF EXISTS via DO blocks so the migration is portable across
-- environments where some of these tables may not have been created yet.
DO $$
DECLARE
    t TEXT;
    dashboard_tables TEXT[] := ARRAY[
        'q_paper_formats',
        'q_papers',
        'blogs',
        'referrals',
        'dig_eval_rubrics',
        'answer_rubrics',
        'answer_evaluations',
        'contact_submissions',
        'elective_shared_store'
    ];
BEGIN
    FOREACH t IN ARRAY dashboard_tables LOOP
        IF EXISTS (
            SELECT 1 FROM pg_tables
            WHERE schemaname = 'public' AND tablename = t
        ) THEN
            EXECUTE format(
                'GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated',
                t
            );
            EXECUTE format(
                'GRANT ALL ON public.%I TO service_role',
                t
            );
        END IF;
    END LOOP;
END $$;

-- Public-readable catalog tables (anon role) — only the genuinely public ones
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blogs') THEN
        EXECUTE 'GRANT SELECT ON public.blogs TO anon';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_submissions') THEN
        -- anon must be able to submit contact forms; no SELECT for anon
        EXECUTE 'GRANT INSERT ON public.contact_submissions TO anon';
    END IF;
END $$;


-- ── 4. Sequence privileges (SERIAL / bigserial inserts via the Data API) ──
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;


-- ── 5. Function / RPC privileges ──────────────────────────────────────────
-- Grant EXECUTE on every existing public function so RPCs called from the
-- client (e.g. increment_view_count) keep working under deny-by-default.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;


-- ── 6. Future-table default privileges ────────────────────────────────────
-- Any table/sequence/function created LATER by these owner roles in `public`
-- will inherit these grants automatically. This is what protects new tables
-- created via the Supabase Studio dashboard after the deny-by-default
-- rollout completes for existing projects on 2026-10-30.
DO $$
DECLARE
    owner TEXT;
    owner_roles TEXT[] := ARRAY['postgres', 'supabase_admin'];
BEGIN
    FOREACH owner IN ARRAY owner_roles LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = owner) THEN
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT ALL ON TABLES TO service_role',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT USAGE, SELECT ON SEQUENCES TO authenticated',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT ALL ON SEQUENCES TO service_role',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT EXECUTE ON FUNCTIONS TO authenticated',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT EXECUTE ON FUNCTIONS TO anon',
                owner
            );
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public
                 GRANT EXECUTE ON FUNCTIONS TO service_role',
                owner
            );
        END IF;
    END LOOP;
END $$;


-- ══════════════════════════════════════════════════════════════════════════
-- House rule for future migrations:
-- Every new `CREATE TABLE public.<name>` MUST be followed by:
--   GRANT SELECT, INSERT, UPDATE, DELETE ON public.<name> TO authenticated;
--   GRANT ALL ON public.<name> TO service_role;
--   ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY ... ON public.<name> ...;
-- The default-privileges block above is a safety net, not an excuse to
-- omit explicit grants from migration files.
-- ══════════════════════════════════════════════════════════════════════════
