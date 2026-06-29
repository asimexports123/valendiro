-- Migration: Autonomous Demand Intelligence & Publishing Engine
-- Extends demand signals, adds topic clusters, discovered topic queue, and category tracking.

-- Extend demand_signals with intent, category, freshness, and processing status
ALTER TABLE demand_signals
ADD COLUMN IF NOT EXISTS search_intent TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS freshness_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (freshness_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'rejected', 'duplicate', 'processed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cluster_id UUID;

CREATE INDEX IF NOT EXISTS idx_demand_signals_status ON demand_signals(status, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_demand_signals_category ON demand_signals(category);
CREATE INDEX IF NOT EXISTS idx_demand_signals_cluster ON demand_signals(cluster_id);

-- Topic clusters from demand signals
CREATE TABLE IF NOT EXISTS demand_topic_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_name TEXT NOT NULL,
  category TEXT,
  seed_keyword TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  demand_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  competition_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  opportunity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_topic_clusters_opportunity ON demand_topic_clusters(status, opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_demand_topic_clusters_name ON demand_topic_clusters(cluster_name);

-- Discovered topics queue before entering content_generation_queue
CREATE TABLE IF NOT EXISTS demand_topic_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_signal_id UUID NOT NULL REFERENCES demand_signals(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES demand_topic_clusters(id) ON DELETE SET NULL,
  keyword TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  search_intent TEXT,
  category TEXT,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  demand_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  competition_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  opportunity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate', 'cannibalized')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_topic_queue_status ON demand_topic_queue(status, opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_demand_topic_queue_keyword ON demand_topic_queue(keyword);

-- Track categories auto-created by demand engine
CREATE TABLE IF NOT EXISTS demand_auto_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  source_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_auto_categories_name ON demand_auto_categories(category_name);
