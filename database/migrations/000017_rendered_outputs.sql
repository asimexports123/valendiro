-- Phase 11: Rendering Layer
-- Creates tables for rendered outputs and rendering policies.
-- Does NOT modify any existing tables.

-- ─── Rendered Outputs ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rendered_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE,
  knowledge_hash  TEXT NOT NULL,
  renderer_id     TEXT NOT NULL,
  renderer_version TEXT NOT NULL,
  template_version TEXT NOT NULL,
  output_format   TEXT NOT NULL CHECK (output_format IN ('html', 'markdown', 'json')),
  style           TEXT[] NOT NULL DEFAULT '{}',
  cache_key       TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL,
  document_tree   JSONB NOT NULL,
  word_count      INTEGER NOT NULL DEFAULT 0,
  section_count   INTEGER NOT NULL DEFAULT 0,
  citation_count  INTEGER NOT NULL DEFAULT 0,
  quality_score   JSONB NOT NULL DEFAULT '{}',
  diagnostics     JSONB NOT NULL DEFAULT '{}',
  render_duration_ms INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'stale', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rendered_outputs_package ON rendered_outputs(package_id);
CREATE INDEX IF NOT EXISTS idx_rendered_outputs_cache ON rendered_outputs(cache_key);
CREATE INDEX IF NOT EXISTS idx_rendered_outputs_status ON rendered_outputs(status);

-- ─── Rendering Policies ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rendering_policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  category_match    TEXT[] NOT NULL DEFAULT '{}',
  required_fact_types TEXT[] NOT NULL DEFAULT '{}',
  preferred_format  TEXT NOT NULL DEFAULT 'long-article',
  preferred_style   TEXT[] NOT NULL DEFAULT '{intermediate}',
  min_fact_count    INTEGER NOT NULL DEFAULT 5,
  min_citation_count INTEGER NOT NULL DEFAULT 1,
  section_overrides JSONB NOT NULL DEFAULT '[]',
  commercial_placeholders BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── RLS Policies ────────────────────────────────────────────────────────────

ALTER TABLE rendered_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendering_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on rendered_outputs"
  ON rendered_outputs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public read on rendered_outputs"
  ON rendered_outputs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Service role full access on rendering_policies"
  ON rendering_policies FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Public read on rendering_policies"
  ON rendering_policies FOR SELECT
  USING (true);

-- ─── Default Policy Seed ─────────────────────────────────────────────────────

INSERT INTO rendering_policies (name, category_match, required_fact_types, preferred_format, preferred_style, min_fact_count, min_citation_count, commercial_placeholders)
VALUES (
  'default',
  '{}',
  '{definition}',
  'long-article',
  '{intermediate}',
  5,
  1,
  false
)
ON CONFLICT (name) DO NOTHING;
