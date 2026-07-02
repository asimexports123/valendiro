-- Migration: Discovery Engine Framework
-- 3 new tables: discovery_sources, discovery_runs, discovery_candidates
-- Architecture: coverage-driven discovery → empty hub slots → candidates

-- ═══════════════════════════════════════════════════════════════════
-- 1. Discovery Sources — registered adapters (Wikipedia, MDN, static, etc.)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discovery_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  adapter_type TEXT NOT NULL CHECK (adapter_type IN ('static', 'wikipedia', 'docs', 'llm', 'manual')),
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_sources_adapter ON discovery_sources(adapter_type, status);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Discovery Runs — each execution of the discovery orchestrator
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discovery_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES discovery_sources(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  entity_type_id UUID REFERENCES entity_types(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  slots_analyzed INTEGER NOT NULL DEFAULT 0,
  candidates_found INTEGER NOT NULL DEFAULT 0,
  candidates_accepted INTEGER NOT NULL DEFAULT 0,
  candidates_rejected INTEGER NOT NULL DEFAULT 0,
  candidates_duplicate INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_topic ON discovery_runs(topic_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_source ON discovery_runs(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_status ON discovery_runs(status);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Discovery Candidates — individual knowledge items mapped to slots
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS discovery_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
  hub_slot_id UUID REFERENCES hub_slots(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  relevance_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'duplicate')),
  rejection_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discovery_candidates_run ON discovery_candidates(run_id);
CREATE INDEX IF NOT EXISTS idx_discovery_candidates_slot ON discovery_candidates(hub_slot_id, status);
CREATE INDEX IF NOT EXISTS idx_discovery_candidates_status ON discovery_candidates(status, relevance_score DESC);

-- ═══════════════════════════════════════════════════════════════════
-- RLS (service role bypasses, public read for candidates)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE discovery_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read discovery sources" ON discovery_sources
  FOR SELECT USING (true);

CREATE POLICY "Admin manage discovery sources" ON discovery_sources
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Admin read discovery runs" ON discovery_runs
  FOR SELECT USING (true);

CREATE POLICY "Admin manage discovery runs" ON discovery_runs
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Admin read discovery candidates" ON discovery_candidates
  FOR SELECT USING (true);

CREATE POLICY "Admin manage discovery candidates" ON discovery_candidates
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- ═══════════════════════════════════════════════════════════════════
-- Rollback:
--   DROP TABLE IF EXISTS discovery_candidates CASCADE;
--   DROP TABLE IF EXISTS discovery_runs CASCADE;
--   DROP TABLE IF EXISTS discovery_sources CASCADE;
-- ═══════════════════════════════════════════════════════════════════
