-- Discovery System Schema for Valendiro
-- Enables autonomous knowledge acquisition from Feedly and RSS feeds
-- Integrates with existing Knowledge OS architecture

-- Discovery Sources Table
-- Manages Feedly and RSS feed sources for autonomous discovery
CREATE TABLE IF NOT EXISTS discovery_system_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT NOT NULL CHECK (source_type IN ('feedly', 'rss', 'api')),
  name TEXT NOT NULL,
  url TEXT,
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  last_fetched_at TIMESTAMPTZ,
  fetch_interval_minutes INTEGER NOT NULL DEFAULT 60,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, url)
);

-- Create indexes for discovery_system_sources
CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_status ON discovery_system_sources(status);
CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_type ON discovery_system_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_discovery_system_sources_last_fetched ON discovery_system_sources(last_fetched_at);

-- Discovered Articles Table
-- Stores articles discovered from external sources before processing
CREATE TABLE IF NOT EXISTS discovered_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
  external_id TEXT, -- Feedly entry ID or RSS GUID
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  author TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'accepted', 'rejected', 'duplicate', 'error')),
  relevance_score DECIMAL(4,3),
  confidence_score DECIMAL(4,3),
  rejection_reason TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

-- Create indexes for discovered_articles
CREATE INDEX IF NOT EXISTS idx_discovered_articles_status ON discovered_articles(status);
CREATE INDEX IF NOT EXISTS idx_discovered_articles_source ON discovered_articles(source_id);
CREATE INDEX IF NOT EXISTS idx_discovered_articles_published ON discovered_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_articles_relevance ON discovered_articles(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_articles_url ON discovered_articles(url);

-- Article Deduplication Table
-- Tracks processed articles to prevent duplicates
CREATE TABLE IF NOT EXISTS article_deduplication (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_hash TEXT NOT NULL UNIQUE,
  title_hash TEXT NOT NULL UNIQUE,
  content_hash TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for article_deduplication
CREATE INDEX IF NOT EXISTS idx_article_deduplication_url_hash ON article_deduplication(url_hash);
CREATE INDEX IF NOT EXISTS idx_article_deduplication_title_hash ON article_deduplication(title_hash);
CREATE INDEX IF NOT EXISTS idx_article_deduplication_last_seen ON article_deduplication(last_seen_at DESC);

-- Topic Mapping Table
-- Maps discovered articles to existing Knowledge OS topics
CREATE TABLE IF NOT EXISTS discovered_article_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovered_article_id UUID NOT NULL REFERENCES discovered_articles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  confidence DECIMAL(4,3),
  mapping_method TEXT NOT NULL, -- 'keyword', 'embedding', 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (discovered_article_id, topic_id)
);

-- Create indexes for discovered_article_topics
CREATE INDEX IF NOT EXISTS idx_discovered_article_topics_article ON discovered_article_topics(discovered_article_id);
CREATE INDEX IF NOT EXISTS idx_discovered_article_topics_topic ON discovered_article_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_discovered_article_topics_confidence ON discovered_article_topics(confidence DESC);

-- Knowledge Extraction Queue Table
-- Queues articles for knowledge extraction and package updates
CREATE TABLE IF NOT EXISTS knowledge_extraction_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovered_article_id UUID NOT NULL REFERENCES discovered_articles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for knowledge_extraction_queue
CREATE INDEX IF NOT EXISTS idx_knowledge_extraction_queue_status ON knowledge_extraction_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_knowledge_extraction_queue_article ON knowledge_extraction_queue(discovered_article_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_extraction_queue_topic ON knowledge_extraction_queue(topic_id);

-- Discovery Schedule Table
-- Manages automated discovery scheduling
CREATE TABLE IF NOT EXISTS discovery_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('interval', 'cron')),
  schedule_config JSONB NOT NULL,
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for discovery_schedule
CREATE INDEX IF NOT EXISTS idx_discovery_schedule_next_run ON discovery_schedule(next_run_at);
CREATE INDEX IF NOT EXISTS idx_discovery_schedule_status ON discovery_schedule(status);
CREATE INDEX IF NOT EXISTS idx_discovery_schedule_source ON discovery_schedule(source_id);

-- Discovery Metrics Table
-- Tracks discovery system performance and health
CREATE TABLE IF NOT EXISTS discovery_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES discovery_system_sources(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('articles_discovered', 'articles_accepted', 'articles_rejected', 'processing_time', 'error_rate')),
  metric_value DECIMAL(15,4) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for discovery_metrics
CREATE INDEX IF NOT EXISTS idx_discovery_metrics_source ON discovery_metrics(source_id, metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovery_metrics_type ON discovery_metrics(metric_type, recorded_at DESC);

-- Feedly Configuration Table
-- Stores Feedly API credentials and configuration
CREATE TABLE IF NOT EXISTS feedly_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  user_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_discovery_system_sources_updated_at ON discovery_system_sources;
CREATE TRIGGER update_discovery_system_sources_updated_at BEFORE UPDATE ON discovery_system_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discovered_articles_updated_at ON discovered_articles;
CREATE TRIGGER update_discovered_articles_updated_at BEFORE UPDATE ON discovered_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_extraction_queue_updated_at ON knowledge_extraction_queue;
CREATE TRIGGER update_knowledge_extraction_queue_updated_at BEFORE UPDATE ON knowledge_extraction_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_discovery_schedule_updated_at ON discovery_schedule;
CREATE TRIGGER update_discovery_schedule_updated_at BEFORE UPDATE ON discovery_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedly_config_updated_at ON feedly_config;
CREATE TRIGGER update_feedly_config_updated_at BEFORE UPDATE ON feedly_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
