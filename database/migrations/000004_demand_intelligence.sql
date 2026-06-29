-- Migration: Demand Intelligence Layer
-- Tracks demand signals, topic gaps, trends, and opportunity sources.

CREATE TABLE IF NOT EXISTS demand_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_type TEXT NOT NULL CHECK (signal_type IN ('search_intent', 'trend', 'affiliate', 'seasonal', 'competition', 'manual')),
  source TEXT NOT NULL,
  keyword TEXT,
  object_id UUID,
  object_type TEXT CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code) ON DELETE CASCADE,
  volume_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (volume_score BETWEEN 0 AND 100),
  trend_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (trend_score BETWEEN 0 AND 100),
  seasonal_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (seasonal_score BETWEEN 0 AND 100),
  affiliate_potential_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (affiliate_potential_score BETWEEN 0 AND 100),
  competition_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (competition_score BETWEEN 0 AND 100),
  metadata JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_type ON demand_signals(signal_type, source);
CREATE INDEX IF NOT EXISTS idx_demand_signals_keyword ON demand_signals(keyword);
CREATE INDEX IF NOT EXISTS idx_demand_scores ON demand_signals(volume_score DESC, trend_score DESC, affiliate_potential_score DESC);

CREATE TABLE IF NOT EXISTS topic_gap_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code) ON DELETE CASCADE,
  gap_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (gap_score BETWEEN 0 AND 100),
  coverage_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (coverage_score BETWEEN 0 AND 100),
  intent_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (intent_score BETWEEN 0 AND 100),
  opportunity_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (opportunity_score BETWEEN 0 AND 100),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (topic_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_topic_gap_scores ON topic_gap_scores(opportunity_score DESC, calculated_at);

CREATE TABLE IF NOT EXISTS trend_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL DEFAULT 'en' REFERENCES languages(code) ON DELETE CASCADE,
  trend_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (trend_score BETWEEN 0 AND 100),
  source TEXT NOT NULL,
  metadata JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, object_type, language_code, source)
);

CREATE INDEX IF NOT EXISTS idx_trend_scores ON trend_scores(trend_score DESC, calculated_at);

CREATE TABLE IF NOT EXISTS opportunity_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('internal_search_intent', 'google_trends', 'search_console', 'affiliate_trends', 'seasonal', 'manual')),
  source_name TEXT NOT NULL UNIQUE,
  config JSONB,
  last_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_sources ON opportunity_sources(source_type, status);

-- Enable RLS
ALTER TABLE demand_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_gap_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public read demand signals" ON demand_signals
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage demand signals" ON demand_signals
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Public read topic gap scores" ON topic_gap_scores
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage topic gap scores" ON topic_gap_scores
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Public read trend scores" ON trend_scores
  FOR SELECT USING (true);

CREATE POLICY "Admin and editor manage trend scores" ON trend_scores
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "Admin and editor manage opportunity sources" ON opportunity_sources
  FOR ALL USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

-- Trigger for updated_at on opportunity_sources
CREATE TRIGGER update_opportunity_sources_updated_at
  BEFORE UPDATE ON opportunity_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
