-- Migration 000011: Knowledge Packs Table
-- Part of Phase 2A — Knowledge Pack Builder
--
-- The knowledge_packs table stores the assembled research context for every article.
-- The LLM writer reads from this table — it never writes from a raw keyword.
--
-- Each pack is linked to:
--  - The article's queue item (article_queue_id)
--  - The parent topic (topic_id)
--  - The raw pack JSON (pack_data)
--
-- Status lifecycle: ready → used (after article is written) | archived (manual)

CREATE TABLE IF NOT EXISTS knowledge_packs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword           TEXT        NOT NULL,
  category_slug     TEXT        NOT NULL DEFAULT 'unknown',
  topic_id          UUID        REFERENCES topics(id) ON DELETE SET NULL,
  article_queue_id  UUID        REFERENCES content_generation_queue(id) ON DELETE SET NULL,
  pack_data         JSONB       NOT NULL DEFAULT '{}',
  status            TEXT        NOT NULL DEFAULT 'ready'
                                CHECK (status IN ('ready', 'used', 'archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_packs_status        ON knowledge_packs (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_packs_topic         ON knowledge_packs (topic_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_packs_queue_item    ON knowledge_packs (article_queue_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_packs_category      ON knowledge_packs (category_slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_packs_created       ON knowledge_packs (created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER knowledge_packs_updated_at
  BEFORE UPDATE ON knowledge_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: admin/service_role full access, public no access
ALTER TABLE knowledge_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_knowledge_packs"
  ON knowledge_packs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add hero_image_url, thumbnail_url, og_image_url to article_translations if missing
-- (idempotent — ADD COLUMN IF NOT EXISTS)
ALTER TABLE article_translations
  ADD COLUMN IF NOT EXISTS hero_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url    TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url     TEXT;

COMMENT ON TABLE knowledge_packs IS
  'Stores assembled research context (Knowledge Packs) for every article in the pipeline. '
  'The LLM writer must read from this table — never write from a raw keyword.';
