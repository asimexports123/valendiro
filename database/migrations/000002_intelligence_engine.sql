-- Migration: Intelligence Engine
-- Adds knowledge graph, intent classification, content scoring, decision queues, and internal linking suggestions.

-- 1. Search intent classification on questions
ALTER TABLE questions ADD COLUMN IF NOT EXISTS intent_type TEXT CHECK (intent_type IN ('informational', 'commercial', 'transactional', 'navigational'));
CREATE INDEX IF NOT EXISTS idx_questions_intent_type ON questions(intent_type);

-- 2. Content scoring table (scalable for millions of objects, one row per object-language)
CREATE TABLE IF NOT EXISTS content_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  search_volume_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (search_volume_score BETWEEN 0 AND 100),
  competition_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (competition_score BETWEEN 0 AND 100),
  affiliate_potential_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (affiliate_potential_score BETWEEN 0 AND 100),
  ctr_estimate_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (ctr_estimate_score BETWEEN 0 AND 100),
  freshness_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (freshness_score BETWEEN 0 AND 100),
  overall_priority_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (overall_priority_score BETWEEN 0 AND 100),
  score_metadata JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (object_id, object_type, language_code)
);

CREATE INDEX IF NOT EXISTS idx_content_scores_object ON content_scores(object_id, object_type, language_code);
CREATE INDEX IF NOT EXISTS idx_content_scores_priority ON content_scores(overall_priority_score DESC, calculated_at);

-- 3. Generic knowledge graph relationship edges (node = any object)
CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('belongs_to', 'answers', 'explains', 'references', 'related_to', 'prerequisite', 'follow_up', 'sibling', 'parent', 'child')),
  strength_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (strength_score BETWEEN 0 AND 100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_id, source_type, target_id, target_type, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_source ON knowledge_relationships(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_target ON knowledge_relationships(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_relationships_type ON knowledge_relationships(relationship_type);

-- 4. Content decision queues
CREATE TABLE IF NOT EXISTS content_generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_generation_queue_status ON content_generation_queue(status, priority_score DESC, scheduled_at);

CREATE TABLE IF NOT EXISTS content_update_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  reason TEXT NOT NULL,
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress', 'completed')),
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_update_queue_status ON content_update_queue(status, priority_score DESC, scheduled_at);

CREATE TABLE IF NOT EXISTS content_priority_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  object_id UUID NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  priority_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  decision_type TEXT NOT NULL CHECK (decision_type IN ('create', 'update', 'ignore')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'done')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_priority_queue_score ON content_priority_queue(priority_score DESC, decision_type, status);

-- 5. Internal link suggestions (auto-generated, not yet approved)
CREATE TABLE IF NOT EXISTS internal_link_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_object_id UUID NOT NULL,
  source_object_type TEXT NOT NULL CHECK (source_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  target_object_id UUID NOT NULL,
  target_object_type TEXT NOT NULL CHECK (target_object_type IN ('topic', 'question', 'entity', 'article', 'knowledge_object')),
  anchor_text TEXT,
  context_snippet TEXT,
  relevance_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  cluster_strength_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (cluster_strength_score BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_object_id, source_object_type, target_object_id, target_object_type)
);

CREATE INDEX IF NOT EXISTS idx_internal_link_suggestions_source ON internal_link_suggestions(source_object_id, source_object_type);
CREATE INDEX IF NOT EXISTS idx_internal_link_suggestions_target ON internal_link_suggestions(target_object_id, target_object_type);
CREATE INDEX IF NOT EXISTS idx_internal_link_suggestions_score ON internal_link_suggestions(relevance_score DESC, status);

-- Enable RLS on new tables
ALTER TABLE content_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_update_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_priority_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_link_suggestions ENABLE ROW LEVEL SECURITY;
