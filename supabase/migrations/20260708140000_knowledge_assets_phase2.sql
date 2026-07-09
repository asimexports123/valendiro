-- Phase 2: knowledge_assets replaces discovered_articles (zero duplicate storage)
-- Preserves row IDs for FK integrity on discovered_article_topics / knowledge_extraction_queue

CREATE TABLE IF NOT EXISTS knowledge_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
  external_id TEXT,
  schema_version TEXT NOT NULL DEFAULT '1.0',
  asset_kind TEXT NOT NULL DEFAULT 'text',
  payload JSONB NOT NULL DEFAULT '{}',
  labels JSONB NOT NULL DEFAULT '{}',
  provenance JSONB NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  author TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  relevance_score DECIMAL(4,3),
  confidence_score DECIMAL(4,3),
  rejection_reason TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_assets_status ON knowledge_assets(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_source ON knowledge_assets(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_published ON knowledge_assets(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_url ON knowledge_assets(url);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_schema ON knowledge_assets(schema_version);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_kind ON knowledge_assets(asset_kind);

-- One-time migration from discovered_articles when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'discovered_articles'
  ) THEN
    INSERT INTO knowledge_assets (
      id, source_id, external_id, schema_version, asset_kind,
      payload, labels, provenance,
      title, content, summary, url, published_at, author, metadata,
      status, relevance_score, confidence_score, rejection_reason,
      processing_started_at, processing_completed_at,
      discovered_at, created_at, updated_at
    )
    SELECT
      da.id,
      da.source_id,
      da.external_id,
      '1.0',
      'text',
      jsonb_build_object(
        'text', COALESCE(da.content, ''),
        'uri', da.url,
        'mime_type', 'text/html'
      ),
      jsonb_build_object(
        'title', da.title,
        'description', da.summary,
        'language', 'en'
      ),
      jsonb_build_object(
        'connector_type', 'legacy',
        'connector_version', '0.0.0',
        'adapter_type', 'legacy',
        'adapter_version', '0.0.0',
        'migrated_from', 'discovered_articles'
      ),
      da.title,
      da.content,
      da.summary,
      da.url,
      da.published_at,
      da.author,
      COALESCE(da.metadata, '{}'::jsonb),
      da.status,
      da.relevance_score,
      da.confidence_score,
      da.rejection_reason,
      da.processing_started_at,
      da.processing_completed_at,
      COALESCE(da.created_at, NOW()),
      COALESCE(da.created_at, NOW()),
      COALESCE(da.updated_at, NOW())
    FROM discovered_articles da
    ON CONFLICT (id) DO NOTHING;

    -- Repoint FKs to knowledge_assets
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'discovered_article_topics_discovered_article_id_fkey'
    ) THEN
      ALTER TABLE discovered_article_topics
        DROP CONSTRAINT discovered_article_topics_discovered_article_id_fkey;
    END IF;

    ALTER TABLE discovered_article_topics
      ADD CONSTRAINT discovered_article_topics_discovered_article_id_fkey
      FOREIGN KEY (discovered_article_id) REFERENCES knowledge_assets(id) ON DELETE CASCADE;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'knowledge_extraction_queue'
    ) THEN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'knowledge_extraction_queue_discovered_article_id_fkey'
      ) THEN
        ALTER TABLE knowledge_extraction_queue
          DROP CONSTRAINT knowledge_extraction_queue_discovered_article_id_fkey;
      END IF;

      ALTER TABLE knowledge_extraction_queue
        ADD CONSTRAINT knowledge_extraction_queue_discovered_article_id_fkey
        FOREIGN KEY (discovered_article_id) REFERENCES knowledge_assets(id) ON DELETE CASCADE;
    END IF;

    DROP TABLE discovered_articles;
  END IF;
END $$;

-- Read-only compat view for legacy scripts (SELECT only)
CREATE OR REPLACE VIEW discovered_articles AS
SELECT
  id,
  source_id,
  external_id,
  title,
  content,
  summary,
  url,
  published_at,
  author,
  metadata,
  status,
  relevance_score,
  confidence_score,
  rejection_reason,
  processing_started_at,
  processing_completed_at,
  created_at,
  updated_at
FROM knowledge_assets;

COMMENT ON TABLE knowledge_assets IS 'Canonical ingest storage (Phase 2). Replaces discovered_articles.';
COMMENT ON VIEW discovered_articles IS 'Read-only compat view over knowledge_assets for legacy scripts.';
