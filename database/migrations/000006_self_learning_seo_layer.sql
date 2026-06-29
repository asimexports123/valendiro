-- Migration: Self-Learning SEO + Affiliate Revenue Layer
-- Adds tables for performance tracking, content health scoring, affiliate optimization,
-- duplicate content detection, and internal link suggestions.

-- Content health scores (precomputed per object per language)
CREATE TABLE IF NOT EXISTS content_health_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  seo_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  revenue_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  freshness_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  overall_health_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  score_breakdown JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, object_type, language_code)
);

-- Affiliate conversions (estimated revenue per click)
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_product_id UUID NOT NULL REFERENCES affiliate_products(id) ON DELETE CASCADE,
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  clicks INTEGER NOT NULL DEFAULT 0,
  estimated_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duplicate content detections
CREATE TABLE IF NOT EXISTS duplicate_content_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_object_id UUID NOT NULL,
  source_object_type TEXT NOT NULL CHECK (source_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  target_object_id UUID NOT NULL,
  target_object_type TEXT NOT NULL CHECK (target_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  similarity_score DECIMAL(5,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'blocked', 'merged', 'ignored')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internal link suggestions (precomputed by SEO engine)
CREATE TABLE IF NOT EXISTS internal_link_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_object_id UUID NOT NULL,
  source_object_type TEXT NOT NULL CHECK (source_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  target_object_id UUID NOT NULL,
  target_object_type TEXT NOT NULL CHECK (target_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  anchor_text TEXT,
  context_snippet TEXT,
  relevance_score DECIMAL(5,4) NOT NULL DEFAULT 0,
  cluster_strength_score DECIMAL(5,4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO keyword gaps (opportunities per topic cluster)
CREATE TABLE IF NOT EXISTS seo_keyword_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID,
  keyword TEXT NOT NULL,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  search_volume_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  competition_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  affiliate_potential_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  opportunity_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ignored')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing language_code to existing internal_link_suggestions table
ALTER TABLE internal_link_suggestions
ADD COLUMN IF NOT EXISTS language_code TEXT REFERENCES languages(code) ON DELETE CASCADE;
UPDATE internal_link_suggestions SET language_code = 'en' WHERE language_code IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_scores_object ON content_health_scores(object_id, object_type, language_code);
CREATE INDEX IF NOT EXISTS idx_health_scores_overall ON content_health_scores(overall_health_score DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_object ON affiliate_conversions(object_id, object_type, language_code, recorded_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_product ON affiliate_conversions(affiliate_product_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_duplicate_content_hash ON duplicate_content_detections(content_hash);
CREATE INDEX IF NOT EXISTS idx_duplicate_content_similarity ON duplicate_content_detections(source_object_id, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_source ON internal_link_suggestions(source_object_id, source_object_type, language_code);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_target ON internal_link_suggestions(target_object_id, target_object_type, language_code);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_relevance ON internal_link_suggestions(status, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_seo_keyword_gaps_opportunity ON seo_keyword_gaps(status, opportunity_score DESC);
