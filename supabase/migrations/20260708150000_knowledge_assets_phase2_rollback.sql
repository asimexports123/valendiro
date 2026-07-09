-- Phase 2 rollback: restore discovered_articles table from knowledge_assets (zero row loss)
-- Preserves row IDs. Run only when reverting Phase 2 storage migration.

BEGIN;

DROP VIEW IF EXISTS discovered_articles;

CREATE TABLE IF NOT EXISTS discovered_articles (
  id UUID PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES discovery_system_sources(id) ON DELETE CASCADE,
  external_id TEXT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, external_id)
);

INSERT INTO discovered_articles (
  id, source_id, external_id, title, content, summary, url,
  published_at, author, metadata, status,
  relevance_score, confidence_score, rejection_reason,
  processing_started_at, processing_completed_at,
  created_at, updated_at
)
SELECT
  id, source_id, external_id, title, content, summary, url,
  published_at, author, COALESCE(metadata, '{}'::jsonb), status,
  relevance_score, confidence_score, rejection_reason,
  processing_started_at, processing_completed_at,
  created_at, updated_at
FROM knowledge_assets
ON CONFLICT (id) DO UPDATE SET
  source_id = EXCLUDED.source_id,
  external_id = EXCLUDED.external_id,
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  summary = EXCLUDED.summary,
  url = EXCLUDED.url,
  published_at = EXCLUDED.published_at,
  author = EXCLUDED.author,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  relevance_score = EXCLUDED.relevance_score,
  confidence_score = EXCLUDED.confidence_score,
  rejection_reason = EXCLUDED.rejection_reason,
  processing_started_at = EXCLUDED.processing_started_at,
  processing_completed_at = EXCLUDED.processing_completed_at,
  updated_at = EXCLUDED.updated_at;

-- Repoint FKs back to discovered_articles
ALTER TABLE discovered_article_topics
  DROP CONSTRAINT IF EXISTS discovered_article_topics_discovered_article_id_fkey;
ALTER TABLE discovered_article_topics
  ADD CONSTRAINT discovered_article_topics_discovered_article_id_fkey
  FOREIGN KEY (discovered_article_id) REFERENCES discovered_articles(id) ON DELETE CASCADE;

ALTER TABLE knowledge_extraction_queue
  DROP CONSTRAINT IF EXISTS knowledge_extraction_queue_discovered_article_id_fkey;
ALTER TABLE knowledge_extraction_queue
  ADD CONSTRAINT knowledge_extraction_queue_discovered_article_id_fkey
  FOREIGN KEY (discovered_article_id) REFERENCES discovered_articles(id) ON DELETE CASCADE;

DROP TABLE IF EXISTS knowledge_assets;

COMMIT;

COMMENT ON TABLE discovered_articles IS 'Restored from knowledge_assets rollback (Phase 2 revert).';
