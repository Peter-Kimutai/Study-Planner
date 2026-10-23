/*
# Create Study Planner Tables (single-tenant, no auth)

1. New Tables
- `study_plans`
  - `id` (uuid, primary key)
  - `exam_date` (date, not null) — the learner's AZ-900 exam date
  - `available_hours_per_week` (integer, not null) — weekly study budget
  - `selected_topics` (text[], not null) — weak areas the learner wants to focus on
  - `proficiency` (jsonb, not null) — per-topic proficiency levels: { "Cloud Concepts": "beginner", ... }
  - `total_days` (integer, not null) — computed days until exam
  - `created_at` (timestamptz, default now)

- `study_sessions`
  - `id` (uuid, primary key)
  - `plan_id` (uuid, FK to study_plans, ON DELETE CASCADE)
  - `session_date` (date, not null) — which day the session is scheduled
  - `topic` (text, not null) — AZ-900 topic being studied
  - `subtopics` (text[], not null) — specific subtopics to cover
  - `duration_minutes` (integer, not null) — planned session length
  - `is_completed` (boolean, default false) — whether the learner finished the session
  - `completed_at` (timestamptz, nullable) — when it was marked done
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- Grant CRUD to `anon` + `authenticated` — this is a single-tenant no-auth app, so data is intentionally shared/public.
- Allow anon + authenticated full CRUD on both tables.
- ON DELETE CASCADE on sessions ensures deleting a plan also removes its sessions.
*/

CREATE TABLE IF NOT EXISTS study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_date date NOT NULL,
  available_hours_per_week integer NOT NULL,
  selected_topics text[] NOT NULL,
  proficiency jsonb NOT NULL,
  total_days integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  topic text NOT NULL,
  subtopics text[] NOT NULL,
  duration_minutes integer NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_plan_id ON study_sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(session_date);

ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON study_plans TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_plans" ON study_plans;
CREATE POLICY "anon_select_plans" ON study_plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_plans" ON study_plans;
CREATE POLICY "anon_insert_plans" ON study_plans FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_plans" ON study_plans;
CREATE POLICY "anon_update_plans" ON study_plans FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_plans" ON study_plans;
CREATE POLICY "anon_delete_plans" ON study_plans FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_sessions" ON study_sessions;
CREATE POLICY "anon_select_sessions" ON study_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON study_sessions;
CREATE POLICY "anon_insert_sessions" ON study_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON study_sessions;
CREATE POLICY "anon_update_sessions" ON study_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON study_sessions;
CREATE POLICY "anon_delete_sessions" ON study_sessions FOR DELETE
  TO anon, authenticated USING (true);